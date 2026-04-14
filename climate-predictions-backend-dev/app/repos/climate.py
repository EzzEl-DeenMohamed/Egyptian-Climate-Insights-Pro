from datetime import datetime
from typing import List, Dict

from sqlalchemy import Sequence, select, func, extract, desc

from app.models.db.climate import ClimateParameterDim, ClimateDataFact, LocationDim
from app.models.db.materialized_views import ClmValsPerGovOrCountryYearMatView, ClmValsPerGovOrCountryMonthMatView
from app.models.schemas.climate import ClimateParameterOut, ClimAggMatViewRecord, FactConfig, Fact, QuestionFact
from app.models.schemas.common import LocationTypeEnum, ScenarioEnum, TimeframeEnum, AggregationType
from app.repos.base import BaseRepository
from app.repos.utils import timeframe_to_months, which_mat_view


class ClimateRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db)

    async def get_climate_parameters(self, ids: List[int] = None) -> List[ClimateParameterOut]:
        stmt = select(ClimateParameterDim)
        if ids:
            stmt = stmt.where(ClimateParameterDim.id.in_(ids))

        result = await self.db.execute(stmt)
        params_db = result.scalars().all()
        return [ClimateParameterOut.model_validate(param) for param in params_db]

    async def get_clm_values(self, start_year: int, end_year: int,
                             timeframe: TimeframeEnum,
                             clm_param_ids: List[int] | None = None,
                             location_codes: List[str] | None = None,
                             scenario_codes: List[ScenarioEnum] | None = None) -> List[ClimAggMatViewRecord]:
        """
        get all values for the given filters from the materialized view in range start_year to end_year.
        :return: A list of ClimAggMatViewRecord objects containing
                values for each (location, parameter, scenario, and time_bucket).
        """
        start_date = datetime(start_year, 1, 1)
        end_date = datetime(end_year, 12, 31)
        months = []

        table, bucket_column = which_mat_view(timeframe)

        if timeframe != TimeframeEnum.ANNUAL:
            months = timeframe_to_months(timeframe)

        stmt = (select(table.location_code,
                       table.clm_param_id,
                       table.scenario_code,
                       table.avg_value,
                       getattr(table, bucket_column).label("time_bucket"),
                       ClimateParameterDim.name,
                       LocationDim.name_en)
                .join(
                    ClimateParameterDim,
                    table.clm_param_id == ClimateParameterDim.id
                ).join(
                    LocationDim,
                    LocationDim.code == table.location_code)
                .where(getattr(table, bucket_column).between(start_date, end_date)))

        if clm_param_ids:
            stmt = stmt.where(table.clm_param_id.in_(clm_param_ids))
        if location_codes:
            stmt = stmt.where(table.location_code.in_(location_codes))
        if months:
            stmt = stmt.where(extract('month', getattr(table, bucket_column)).in_(months))
        if scenario_codes:
            stmt = stmt.where(table.scenario_code.in_([sc.value for sc in scenario_codes]))

        result = await self.db.execute(stmt)
        rows = result.fetchall()

        return [ClimAggMatViewRecord(location_code=row[0], clm_param_id=row[1],
                                     scenario_code=row[2], avg_value=row[3], time_bucket=row[4], clm_param_name=row[5],
                                     location_name=row[6])
                for row in rows]

    async def get_time_aggr_clm_values(self, start_year: int, end_year: int,
                                       timeframe: TimeframeEnum,
                                       clm_param_ids: List[int] | None = None,
                                       location_codes: List[str] | None = None,
                                       scenario_codes: List[ScenarioEnum] | None = None) -> List[ClimAggMatViewRecord]:
        """
        Get average of values for the given filters from the materialized view in range start_year to end_year.
        :returns
        A list of ClimAggRecord objects containing avg_value for each (location, parameter, and scenario).
        """
        start_date = datetime(start_year, 1, 1)
        end_date = datetime(end_year, 12, 31)
        months = []

        table, bucket_column = which_mat_view(timeframe)

        if timeframe != TimeframeEnum.ANNUAL:
            months = timeframe_to_months(timeframe)

        select_stmt = select(table.location_code,
                             table.clm_param_id,
                             table.scenario_code)

        select_stmt = select_stmt.add_columns(func.avg(table.avg_value).label('avg_value'))
        select_stmt = select_stmt.add_columns(func.max(table.avg_value).label('max_value'))
        select_stmt = select_stmt.add_columns(func.min(table.avg_value).label('min_value'))

        stmt = (select_stmt
        .where(getattr(table, bucket_column).between(start_date, end_date))
        .group_by(
            table.location_code,
            table.clm_param_id,
            table.scenario_code))

        if clm_param_ids:
            stmt = stmt.where(table.clm_param_id.in_(clm_param_ids))
        if location_codes:
            stmt = stmt.where(table.location_code.in_(location_codes))
        if months:
            stmt = stmt.where(extract('month', getattr(table, bucket_column)).in_(months))
        if scenario_codes:
            stmt = stmt.where(table.scenario_code.in_([sc.value for sc in scenario_codes]))

        result = await self.db.execute(stmt)
        rows = result.fetchall()

        return [ClimAggMatViewRecord(location_code=row[0], clm_param_id=row[1],
                                     scenario_code=row[2], avg_value=row[3], max_value=row[4], min_value=row[5])
                for row in rows]

    async def get_climate_facts(self, configs: List[FactConfig]) -> List[Fact]:
        """
        Retrieve climate facts based on provided configurations.
        """
        facts = []
        for config in configs:
            table, bucket_column = which_mat_view(config.timeframe)
            months = None
            if config.timeframe != TimeframeEnum.ANNUAL:
                months = timeframe_to_months(config.timeframe)

            # Build base query
            stmt = (select(
                table.location_code,
                table.avg_value,
                table.scenario_code,
                getattr(table, bucket_column).label("time_bucket"),
                ClimateParameterDim.name,
                ClimateParameterDim.unit,
                LocationDim.name_en
            ).join(
                ClimateParameterDim,
                table.clm_param_id == ClimateParameterDim.id
            ).join(
                LocationDim,
                LocationDim.code == table.location_code
            ).where(
                table.clm_param_id == config.clm_param_id,
                table.location_type == config.location_type.value.upper()))

            if months:
                stmt = stmt.where(extract('month', getattr(table, bucket_column)).in_(months))

            if config.aggregation == AggregationType.MAX:
                stmt = stmt.order_by(table.avg_value.desc())
            elif config.aggregation == AggregationType.MIN:
                stmt = stmt.order_by(table.avg_value.asc())


            result = await self.db.execute(stmt)
            rows = result.fetchall()

            for row in rows:
                time_bucket = row[3]
                year = int(time_bucket.year)
                month = time_bucket.strftime('%b') if config.timeframe != TimeframeEnum.ANNUAL else None
                facts.append(QuestionFact(
                    location_code=row[0],
                    value=row[1],
                    scenario_code=row[2],
                    clm_param_name=row[4],
                    unit=row[5],
                    year=year,
                    month=month,
                    location_name=row[6]
                ))

        return facts


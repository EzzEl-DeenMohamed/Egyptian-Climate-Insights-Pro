from app.models.db.base import MaterializedViewBase

from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint, DateTime, Index, Enum as SQLEnum, \
    select, text, Connection

from app.models.db.climate import ClimateDataFact, LocationDim
from app.models.schemas.common import LocationTypeEnum, SeasonEnum


class ClmValsPerGovOrCountryMonthMatView(MaterializedViewBase):
    schema_name = "dwh"

    __tablename__ = "clm_vals_per_gov_or_country_month_mat_view"
    __table_args__ = (
        {"schema": schema_name}
    )

    clm_param_id = Column(Integer, primary_key=True, index=True)
    location_code = Column(String, primary_key=True, index=True)
    location_type = Column(String, primary_key=True, index=True)
    month_bucket = Column(DateTime, primary_key=True, index=True)
    scenario_code = Column(String, primary_key=True, index=True)

    avg_value = Column(Float)
    sum_value = Column(Float)
    min_value = Column(Float)
    max_value = Column(Float)

    def __repr__(self):
        return (f"<ClmValsPerGovOrCountryMonthMatView(month_bucket={self.month_bucket},"
                f" scenario_code={self.scenario_code}, location_code={self.location_code}, location_type={self.location_type},"
                f" clm_param_id={self.clm_param_id}, avg_value={self.avg_value},"
                f" sum_value={self.sum_value}, min_value={self.min_value}, max_value={self.max_value})>")

    @classmethod
    def create(cls, conn: Connection):
        """
        Create the materialized view for governorate- and country-level monthly climate data aggregation.
        """
        conn.execute(text(f"""
            CREATE MATERIALIZED VIEW IF NOT EXISTS {cls.schema_name}.{cls.__tablename__}
            AS
            SELECT
                F.clm_param_id,
                L1.parent_code AS location_code,
                '{LocationTypeEnum.GOVERNORATE.value.upper()}' AS location_type,
                time_bucket('1 month', F.timestamp) AS month_bucket,
                F.scenario_code,
                AVG(F.value) AS avg_value,
                SUM(F.value) AS sum_value,
                MIN(F.value) AS min_value,
                MAX(F.value) AS max_value
            FROM
                {ClimateDataFact.schema_name}.{ClimateDataFact.__tablename__} AS F
            JOIN
                {LocationDim.schema_name}.{LocationDim.__tablename__} AS L1
                ON F.location_id = L1.id
            WHERE
                L1.location_type = '{LocationTypeEnum.DISTRICT.value.upper()}'
            GROUP BY
                F.clm_param_id,
                L1.parent_code,
                month_bucket,
                F.scenario_code
            UNION ALL
            SELECT
                F.clm_param_id,
                L3.code AS location_code,
                '{LocationTypeEnum.COUNTRY.value.upper()}' AS location_type,
                time_bucket('1 month', F.timestamp) AS month_bucket,
                F.scenario_code,
                AVG(F.value) AS avg_value,
                SUM(F.value) AS sum_value,
                MIN(F.value) AS min_value,
                MAX(F.value) AS max_value
            FROM
                {ClimateDataFact.schema_name}.{ClimateDataFact.__tablename__} AS F
            JOIN
                {LocationDim.schema_name}.{LocationDim.__tablename__} AS L1
                ON F.location_id = L1.id
            JOIN
                {LocationDim.schema_name}.{LocationDim.__tablename__} AS L2
                ON L1.parent_code = L2.code
            JOIN
                {LocationDim.schema_name}.{LocationDim.__tablename__} AS L3
                ON L2.parent_code = L3.code
            WHERE
                L1.location_type = '{LocationTypeEnum.DISTRICT.value.upper()}'
                AND L2.location_type = '{LocationTypeEnum.GOVERNORATE.value.upper()}'
                AND L3.location_type = '{LocationTypeEnum.COUNTRY.value.upper()}'
            GROUP BY
                F.clm_param_id,
                L3.code,
                month_bucket,
                F.scenario_code
            WITH NO DATA;
        """))

        conn.execute(text(f"""
            CREATE INDEX IF NOT EXISTS ix_{cls.__tablename__}_composite
            ON {cls.schema_name}.{cls.__tablename__} (clm_param_id, location_code, location_type, month_bucket, scenario_code);
        """))


class ClmValsPerGovOrCountryYearMatView(MaterializedViewBase):
    schema_name = "dwh"

    __tablename__ = "clm_vals_per_gov_or_country_year_mat_view"
    __table_args__ = (
        {"schema": schema_name}
    )

    clm_param_id = Column(Integer, primary_key=True, index=True)
    location_code = Column(String, primary_key=True, index=True)
    location_type = Column(String, primary_key=True, index=True)
    year_bucket = Column(DateTime, primary_key=True, index=True)
    scenario_code = Column(String, primary_key=True, index=True)

    avg_value = Column(Float)
    sum_value = Column(Float)
    min_value = Column(Float)
    max_value = Column(Float)

    def __repr__(self):
        return (f"<ClmValsPerGovOrCountryYearMatView(year_bucket={self.year_bucket},"
                f" scenario_code={self.scenario_code}, location_code={self.location_code}, location_type={self.location_type},"
                f" clm_param_id={self.clm_param_id}, avg_value={self.avg_value},"
                f" sum_value={self.sum_value}, min_value={self.min_value}, max_value={self.max_value})>")

    @classmethod
    def create(cls, conn: Connection):
        """
        Create the materialized view for governorate- and country-level yearly climate data aggregation.
        """
        conn.execute(text(f"""
            CREATE MATERIALIZED VIEW IF NOT EXISTS {cls.schema_name}.{cls.__tablename__}
            AS
            SELECT
                F.clm_param_id,
                L1.parent_code AS location_code,
                '{LocationTypeEnum.GOVERNORATE.value.upper()}' AS location_type,
                time_bucket('1 year', F.timestamp) AS year_bucket,
                F.scenario_code,
                AVG(F.value) AS avg_value,
                SUM(F.value) AS sum_value,
                MIN(F.value) AS min_value,
                MAX(F.value) AS max_value
            FROM
                {ClimateDataFact.schema_name}.{ClimateDataFact.__tablename__} AS F
            JOIN
                {LocationDim.schema_name}.{LocationDim.__tablename__} AS L1
                ON F.location_id = L1.id
            WHERE
                L1.location_type = '{LocationTypeEnum.DISTRICT.value.upper()}'
            GROUP BY
                F.clm_param_id,
                L1.parent_code,
                year_bucket,
                F.scenario_code
            UNION ALL
            SELECT
                F.clm_param_id,
                L3.code AS location_code,
                '{LocationTypeEnum.COUNTRY.value.upper()}' AS location_type,
                time_bucket('1 year', F.timestamp) AS year_bucket,
                F.scenario_code,
                AVG(F.value) AS avg_value,
                SUM(F.value) AS sum_value,
                MIN(F.value) AS min_value,
                MAX(F.value) AS max_value
            FROM
                {ClimateDataFact.schema_name}.{ClimateDataFact.__tablename__} AS F
            JOIN
                {LocationDim.schema_name}.{LocationDim.__tablename__} AS L1
                ON F.location_id = L1.id
            JOIN
                {LocationDim.schema_name}.{LocationDim.__tablename__} AS L2
                ON L1.parent_code = L2.code
            JOIN
                {LocationDim.schema_name}.{LocationDim.__tablename__} AS L3
                ON L2.parent_code = L3.code
            WHERE
                L1.location_type = '{LocationTypeEnum.DISTRICT.value.upper()}'
                AND L2.location_type = '{LocationTypeEnum.GOVERNORATE.value.upper()}'
                AND L3.location_type = '{LocationTypeEnum.COUNTRY.value.upper()}'
            GROUP BY
                F.clm_param_id,
                L3.code,
                year_bucket,
                F.scenario_code
            WITH NO DATA;
        """))

        conn.execute(text(f"""
            CREATE INDEX IF NOT EXISTS ix_{cls.__tablename__}_composite
            ON {cls.schema_name}.{cls.__tablename__} (clm_param_id, location_code, location_type, year_bucket, scenario_code);
        """))

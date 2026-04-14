import asyncio
import io
from collections import defaultdict
from datetime import datetime

from typing import List, Dict

from fastapi import HTTPException
from shapely.ops import unary_union, transform

import app.core.config
from app.models.schemas.common import LocationTypeEnum, ScenarioEnum, TimeframeEnum
from app.repos.climate import ClimateRepository
from app.models.schemas.climate import ClimateParameterOut, LineChartData, Line, ClimateMapRequest, \
    ClimateMapValuesOut, ClimateLineChartRequest, ChatbotAnswer, ChatbotQuestion, FactConfig, Fact, FactsResponse
from app.services import facts_config
from app.services.geo import GeoService


import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import matplotlib.cm as cm
import matplotlib.colors as mcolors
import cartopy.crs as ccrs
import cartopy.feature as cfeature
from shapely.geometry import shape

QUESTION_CONFIGS = facts_config.QUESTION_CONFIGS

class ClimateService:
    def __init__(self, repo: ClimateRepository, geo_service: GeoService):
        self.repo = repo
        self.geo_service = geo_service

    async def get_climate_parameters(self, ids: List[int] = None) -> List[ClimateParameterOut]:
        return await self.repo.get_climate_parameters(ids=ids)

    async def get_climate_facts(self, req: ClimateMapRequest) -> FactsResponse:
        """
        Get aggregated climate values based on the request.
        aggr values for each (location, parameter, scenario).
        """
        records = await self.repo.get_time_aggr_clm_values(
            start_year=req.start_year,
            end_year=req.end_year,
            timeframe=req.timeframe,
            clm_param_ids=req.climate_param_ids,
            location_codes=req.location_codes,
            scenario_codes=req.scenario_codes,
        )

        if not records:
            raise ValueError("No data found for the given criteria.")

        # Convert records to FactsResponse format.
        data = {}

        for record in records:
            data[str(record.clm_param_id)] = Fact(
                    location_code=record.location_code,
                    scenario_code=record.scenario_code,
                    avg_value=record.avg_value,
                    max_value=record.max_value,
                    min_value=record.min_value,
                    timeframe=req.timeframe)


        return FactsResponse(data=data)


    async def get_choropleth_map_values(self, req: ClimateMapRequest) -> ClimateMapValuesOut:

        records = await self.repo.get_time_aggr_clm_values(
            req.start_year, req.end_year, req.timeframe,
            clm_param_ids=req.climate_param_ids,
            location_codes=req.location_codes,
            scenario_codes=req.scenario_codes
        )

        if not records:
            raise ValueError("No data found for the given criteria.")

        # Prepare the climate data in the required format.
        # Nested dict: loc_code -> param_id -> scenario -> timeframe(season) -> value
        data: Dict[str, Dict[str, Dict[str, Dict[str, float]]]] = defaultdict(
            lambda: defaultdict(lambda: defaultdict(dict))
        )

        for r in records:
            data[r.location_code][str(r.clm_param_id)][r.scenario_code.value][req.timeframe.value]\
                = r.avg_value

        return ClimateMapValuesOut(data=data)

    async def _generate_choropleth_map(self, req: ClimateMapRequest) -> io.BytesIO:
        """
        Generates a choropleth map as a PNG image using Cartopy.
        Returns a BytesIO object containing the PNG image.
        """
        # location_codes = await self._resolve_location_codes(analysis_req_in)

        # Retrieve records climate data.
        # get records data for the selected parameters.
        records = await self.repo.get_time_aggr_clm_values(
            start_year=req.start_year,
            end_year=req.end_year,
            timeframe=req.timeframe,
            clm_param_ids=req.climate_param_ids,
            location_codes=req.location_codes,
            scenario_codes=req.scenario_codes
        )
        if not records:
            raise ValueError("No data found for the given criteria.")

        # Retrieve locations boundaries as GeoJSON features. (should be in crs: EPSG:4326)
        # get all govs geojson to draw on the map
        feature_collection = await self.geo_service.get_locations_geojson(location_types=[LocationTypeEnum.GOVERNORATE])
        features = feature_collection.features

        # Attach records value to each feature, None if not found.
        for feature in features:
            code = feature["properties"]["code"]
            feature["properties"]["value"] = next(
                (v.avg_value for v in records if v.location_code == code), None
            )

        # Create a Cartopy map using PlateCarree (EPSG:4326).
        proj = ccrs.PlateCarree()
        fig, ax = plt.subplots(figsize=(10, 8), subplot_kw={'projection': proj})

        # Add background features.
        ax.add_feature(cfeature.LAND, facecolor='lightgray')
        ax.add_feature(cfeature.OCEAN, facecolor='lightblue')
        ax.add_feature(cfeature.BORDERS, edgecolor='gray')
        # ax.add_feature(cfeature.STATES, edgecolor='gray')

        # Create a colormap for the records values.
        values = [feature["properties"]["value"] for feature in features if feature["properties"]["value"]]
        if values:
            vmin = min(values)
            vmax = max(values)
        else:
            vmin, vmax = 0, 1  # Fallback values.
        norm = mcolors.Normalize(vmin=vmin, vmax=vmax)
        cmap = cm.get_cmap("YlOrRd")

        colored_geometries = []

        # draw all govs polygons with grey and Draw each loc polygon.
        for feature in features:
            geom = shape(feature["geometry"])

            # if the feature is in the location_codes, color it with the value, otherwise color it with grey
            value = feature["properties"]["value"]
            if not value:
                facecolor = 'lightgray'
                ax.add_geometries([geom], crs=proj, facecolor=facecolor, edgecolor='black', linewidth=1, alpha=0.7)

            else:
                facecolor = cmap(norm(value))
                ax.add_geometries([geom], crs=proj, facecolor=facecolor, edgecolor='black', linewidth=1, alpha=0.7)

                colored_geometries.append(geom)
                # Annotate the map with the geometry's code.
                centroid = geom.centroid
                ax.text(
                    centroid.x,
                    centroid.y,
                    str(feature["properties"]["name"]),
                    transform=proj,
                    fontsize=6,
                    ha='center',
                    va='center',
                    color='black',
                )

        # Union of all geometries (if multiple) to get global bounding box for the map extent.
        if colored_geometries:
            union_geom = unary_union(colored_geometries)
            # Get bounding box
            minx, miny, maxx, maxy = union_geom.bounds
            margin_percentage = 0.07  # 7% margin
            # Calculate the margin to add (based on the bounding box width and height)
            x_margin = (maxx - minx) * margin_percentage
            y_margin = (maxy - miny) * margin_percentage
            # Apply margin to the bounding box
            ax.set_extent([minx - x_margin, maxx + x_margin, miny - y_margin, maxy + y_margin])
        else:
            ax.set_extent([28.5, 36.0, 28.0, 34.0], crs=proj)  # Fallback extent

        # Create a colorbar.
        sm = cm.ScalarMappable(cmap=cmap, norm=norm)
        sm.set_array([])
        cbar = fig.colorbar(sm, ax=ax, orientation='vertical', pad=0.05, shrink=0.7)

        clm_params = await self.get_climate_parameters(req.climate_param_ids)
        clm_param_name = clm_params[0].name
        cbar.set_label(f"avg {clm_param_name} in {clm_params[0].unit}"
                       f" \n{req.timeframe.value} {req.start_year}-{req.end_year}"
                       f" \nfor {req.scenario_codes[0].value} scenario",)

        # Save the figure to a BytesIO object.
        buf = io.BytesIO()
        plt.savefig(buf, format="png", bbox_inches="tight", dpi=120)
        plt.close(fig)
        buf.seek(0)

        return buf

    async def get_line_chart_data(self, req: ClimateLineChartRequest) -> LineChartData:
        """
        Get line chart data based on the analysis request.
        """
        records = await self.repo.get_clm_values(
            req.start_year, req.end_year, req.timeframe,
            location_codes=req.location_codes,
            clm_param_ids=req.climate_param_ids
        )

        if not records:
            raise ValueError("No data found for the given criteria.")

        # Group by (clm_param_id, scenario_code)
        grouped = {}
        for record in records:
            key = (record.clm_param_id, record.location_code, record.scenario_code)
            grouped.setdefault(key, []).append(record)

        lines = []
        for (clm_param_id, location_code, scenario_code), group_records in grouped.items():
            # Sort by time_bucket
            group_records.sort(key=lambda r: r.time_bucket)
            time_buckets = [r.time_bucket for r in group_records]  # or format based on timeframe
            values = [r.avg_value for r in group_records]
            line = Line(
                location_code=location_code,
                clm_param_id=clm_param_id,
                scenario_code=scenario_code,
                time_buckets=time_buckets,
                values=values
            )
            lines.append(line)

        return LineChartData(
            timeframe=req.timeframe,
            start_year=req.start_year,
            end_year=req.end_year,
            lines=lines
        )


    async def generate_excel_report(self, req: ClimateMapRequest) -> io.BytesIO:
        """
        Generate an Excel report based on the analysis request.
        """
        # Retrieve records climate data.
        records = await self.repo.get_clm_values(
            req.start_year, req.end_year, req.timeframe,
            clm_param_ids=req.climate_param_ids,
            location_codes=req.location_codes,
            scenario_codes=req.scenario_codes
        )

        # Create an Excel file in memory.
        buf = io.BytesIO()

        # write the records data to the Excel file (columns will be code, clim_param_name, scenario_code, year, avg_value)
        import pandas as pd
        df = pd.DataFrame([{
            "gov_name": v.location_name,
            "clm_param_name": v.clm_param_name,
            "scenario_code": v.scenario_code.value,
            "date": v.time_bucket.strftime("%Y-%m-%d") if v.time_bucket else None,
            "avg_value": v.avg_value
        } for v in records])

        df.to_excel(buf, index=False, engine='openpyxl')

        buf.seek(0)
        # Return the BytesIO object containing the Excel file.
        buf.name = f"avg_values_{req.start_year}_{req.end_year}_{req.timeframe.value}.xlsx"

        return buf

    async def answer_chatbot_question(self, question_id: int) -> ChatbotAnswer:
        """
        Answer a predefined chatbot question by ID.
        """
        if question_id not in QUESTION_CONFIGS:
            raise HTTPException(status_code=400, detail=f"Unknown question ID: {question_id}")
        config = QUESTION_CONFIGS[question_id]
        answers = await self.repo.get_climate_facts([config.fact_config])
        answer = answers[0] if answers else None
        return ChatbotAnswer(
            question=ChatbotQuestion(
                question_id=question_id,
                text=config.question_text
            ),
            answer=answer
        )

    async def get_chatbot_questions(self) -> List[ChatbotQuestion]:
        """
        Get predefined chatbot questions.
        """
        return [ChatbotQuestion(question_id=q.question_id, text=q.question_text) for q in QUESTION_CONFIGS.values()]
    async def get_choropleth_map(self, req: ClimateMapRequest) -> io.BytesIO:
        if req.geojson:
            location_codes = await self._resolve_location_codes(req.geojson)
            req.location_codes = location_codes

        return await self._generate_choropleth_map(req)

    async def _resolve_location_codes(self, geojson) -> List[str]:
        """
        Resolve location codes from either direct input or GeoJSON
        """
        if geojson:
            locations = await self.geo_service.get_locations_by_geojson(
                geojson,
                [LocationTypeEnum.GOVERNORATE]  # or other types as needed
            )
            return [loc.location_info.code for loc in locations]

        return None  # will query all locations

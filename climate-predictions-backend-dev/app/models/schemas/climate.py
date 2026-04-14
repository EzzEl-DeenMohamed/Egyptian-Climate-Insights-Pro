import uuid
from datetime import datetime


from app.models.schemas.base import BaseSchemaModel
from pydantic import Field, field_validator
from typing import Optional, List, Union , Dict, Any

from app.models.schemas.common import SeasonEnum, ScenarioEnum, TimeframeEnum, LocationTypeEnum, AggregationType

class ClimateParameterOut(BaseSchemaModel):
    id: int
    code: str
    name: str
    description: Optional[str]
    unit: str

class ClimateMapRequest(BaseSchemaModel):
    climate_param_ids: Optional[List[int]] = Field(
        title="Climate Parameter IDs",
        examples=[[1, 2, 3]],
        default=None
    )
    location_codes: Optional[List[str]] = Field(examples=[["EG01", "EG02"]], default=None)
    scenario_codes: Optional[List[ScenarioEnum]] = Field(default=None)
    start_year : int = Field(examples=[2019], ge=1900, le=2100)
    end_year: int = Field(examples=[2030], ge=1900, le=2100)
    timeframe: TimeframeEnum = Field(
        examples=[TimeframeEnum.ANNUAL, TimeframeEnum.SUMMER, TimeframeEnum.FEB],
    )

    geojson: Optional[Dict[str, Any]] = Field(
        title="GeoJSON",
        default=None,
        description="GeoJSON FeatureCollection representing the area of interest"
    )

class ClimateLineChartRequest(BaseSchemaModel):
    location_codes: Optional[List[str]] = Field(examples=[["EG01", "EG02"]], default=None)
    climate_param_ids: Optional[List[int]] = Field(examples=[[1, 2, 3]], default=None)
    start_year: int = Field(examples=[2019], ge=1900, le=2100)
    end_year: int = Field(examples=[2030], ge=1900, le=2100)
    timeframe: TimeframeEnum = Field(
        examples=[TimeframeEnum.ANNUAL, TimeframeEnum.SUMMER, TimeframeEnum.FEB],
    )


class ClimAggMatViewRecord(BaseSchemaModel):
    location_code: str
    location_name: Optional[str] = Field(default=None)
    clm_param_id: int
    clm_param_name: Optional[str] = Field(default=None)
    scenario_code: ScenarioEnum
    avg_value: float
    max_value: Optional[float] = Field(default=None)
    min_value: Optional[float] = Field(default=None)
    time_bucket: Optional[datetime] = Field(default=None)


class ClimateMapValuesOut(BaseSchemaModel):
    data: Dict[str, Dict[str, Dict[str, Dict[str, float]]]] = Field(
        ...,
        examples=[
            {
                "gov_code": {
                    "clim_param_id": {
                            "scenario": {
                                    "timeframe": 12.3
                            },
                    }
                }
            }
        ]
    )

class Line(BaseSchemaModel):
    clm_param_id: int = Field(title="Climate Parameter ID", ge=1)
    location_code: str = Field(title="Location Code", examples=["EG01"])
    scenario_code: ScenarioEnum = Field(title="Scenario Code")

    time_buckets: List[datetime] = Field(title="list of time_buckets, e.g., years, months, seasons. in datetime format")
    values: List[float] = Field(title="list of values")

class LineChartData(BaseSchemaModel):
    timeframe: TimeframeEnum = Field(title="Timeframe", examples=[TimeframeEnum.ANNUAL, TimeframeEnum.SUMMER])
    start_year: int = Field(title="Start Year", ge=1900, le=2100)
    end_year: int = Field(title="End Year", ge=1900, le=2100)

    lines: List[Line] = Field(title="Line Data", description="Each line represents a clm parameter with its values over timeframe")

class FactConfig(BaseSchemaModel):
    clm_param_id: int = Field(..., examples=[1])
    location_type: LocationTypeEnum = Field(..., examples=[LocationTypeEnum.GOVERNORATE, LocationTypeEnum.COUNTRY])
    aggregation: AggregationType = Field(..., examples=[AggregationType.MAX, AggregationType.MIN])
    timeframe: TimeframeEnum = Field(..., examples=[TimeframeEnum.ANNUAL, TimeframeEnum.MONTHLY])
    top_n: Optional[int] = Field(default=None, description="Number of results for TOP_N aggregation")


class QuestionConfig(BaseSchemaModel):
    question_id: int
    question_text: str
    fact_config: FactConfig

class QuestionFact(BaseSchemaModel):
    location_code: Optional[str] = Field(None, examples=["EG01"])
    location_name: Optional[str] = Field(None, examples=["Cairo"])
    value: Optional[float] = Field(None, examples=[35.5])
    year: Optional[int] = Field(None, examples=[2023])
    month: Optional[str] = Field(None, examples=["Jan"])
    scenario_code: Optional[ScenarioEnum] = Field(None, examples=[ScenarioEnum.SSP245])
    clm_param_name: Optional[str] = Field(None, examples=["Daily Mean Temperature"])
    unit: Optional[str] = Field(None, examples=["Celsius (°C)"])


class Fact(BaseSchemaModel):
    location_code: str = Field(examples=["EG01"], title="Location Code")
    scenario_code: ScenarioEnum = Field(title="Scenario Code")
    timeframe: TimeframeEnum = Field(examples=[TimeframeEnum.ANNUAL, TimeframeEnum.SUMMER])
    max_value: Optional[float] = Field(default=None)
    min_value: Optional[float] = Field(default=None)
    avg_value: Optional[float] = Field(default=None)


class FactsResponse(BaseSchemaModel):
    data: Dict[str, Fact] = Field(
        ...,
        examples=[
            {
                "clm_param_id": Fact(location_code="EG",
                                     scenario_code=ScenarioEnum.SSP245,
                                     timeframe=TimeframeEnum.ANNUAL,
                                     max_value=35.5,
                                     min_value=20.0,
                                     avg_value=28.0)
            }
        ]
    )

class ChatbotQuestion(BaseSchemaModel):
    question_id: int
    text: str

class ChatbotAnswer(BaseSchemaModel):
    question: ChatbotQuestion
    answer: Optional[QuestionFact] = Field(default=None)

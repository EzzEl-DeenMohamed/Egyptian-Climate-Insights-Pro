# Define fact configurations for summary cards
from app.models.schemas.climate import FactConfig, QuestionConfig
from app.models.schemas.common import LocationTypeEnum, AggregationType, TimeframeEnum

# Define question configurations for chatbot
QUESTION_CONFIGS = {
    1: QuestionConfig(
        question_id=1,
        question_text="What is the hottest month in Egypt cities?",
        fact_config=FactConfig(
            clm_param_id=1,  # Daily Mean Temperature
            location_type=LocationTypeEnum.GOVERNORATE,
            aggregation=AggregationType.MAX,
            timeframe=TimeframeEnum.MONTHLY
        )
    ),
    2: QuestionConfig(
        question_id=2,
        question_text="Which city has the lowest average temperature?",
        fact_config=FactConfig(
            clm_param_id=1,  # Daily Mean Temperature
            location_type=LocationTypeEnum.GOVERNORATE,
            aggregation=AggregationType.MIN,
            timeframe=TimeframeEnum.MONTHLY
        )
    ),
    3: QuestionConfig(
        question_id=3,
        question_text="What is the year with the highest wind speed in Egypt?",
        fact_config=FactConfig(
            clm_param_id=10,  # Wind speed
            location_type=LocationTypeEnum.COUNTRY,
            aggregation=AggregationType.MAX,
            timeframe=TimeframeEnum.ANNUAL
        )
    ),
    4: QuestionConfig(
        question_id=4,
        question_text="Which governorate had the highest cloud cover (Cloud Cover)?",
        fact_config=FactConfig(
            clm_param_id=6,  # Cloud Cover
            location_type=LocationTypeEnum.GOVERNORATE,
            aggregation=AggregationType.MAX,
            timeframe=TimeframeEnum.MONTHLY
        )
    ),
    5: QuestionConfig(
        question_id=5,
        question_text="What is the month with the highest vapor pressure in Egypt?",
        fact_config=FactConfig(
            clm_param_id=11,  # Vapor Pressure
            location_type=LocationTypeEnum.COUNTRY,
            aggregation=AggregationType.MAX,
            timeframe=TimeframeEnum.MONTHLY
        )
    )
}
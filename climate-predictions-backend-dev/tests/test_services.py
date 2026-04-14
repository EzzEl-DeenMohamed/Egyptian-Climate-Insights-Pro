from app.services.climate import ClimateService
from app.services.predictions import PredictionService
from app.models.schemas.predictions import PredictionOut, PredictionOut, PredictionIn
from unittest.mock import AsyncMock

async def test_get_historical_data():
    db = AsyncMock()
    service = ClimateService(db)
    data = await service.get_climate_data_by_region("egypt")
    assert isinstance(data, PredictionOut)

async def test_get_predictions():
    db = AsyncMock()
    service = PredictionService(db)
    prediction = await service.get_predictions(PredictionIn(feature1=1.0, feature2=2.0))
    assert isinstance(prediction, PredictionOut)

import fastapi

from app.api.routes.auth import router as auth_router
from app.api.routes.climate import router as climate_router
from app.api.routes.geo import router as geo_router

router = fastapi.APIRouter()

router.include_router(auth_router)
router.include_router(climate_router)
router.include_router(geo_router)
# router.include_router(predictions_router)

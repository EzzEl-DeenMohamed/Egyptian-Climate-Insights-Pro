from typing import Optional, List

from fastapi import APIRouter, Depends, Query

from app.models.schemas.common import LocationTypeEnum
from app.services.geo import GeoService
from app.models.schemas.geo import LocationOut, FeatureCollectionModel
from app.core.dependencies import get_geo_service

router = APIRouter(prefix="/geo", tags=["geo"])


@router.get("/govs", response_model=List[LocationOut])
async def get_govs(service: GeoService = Depends(get_geo_service)):
    """
    Get all governorates in Egypt without their geometries.
    """
    return await service.get_locations(location_types=[LocationTypeEnum.GOVERNORATE])

@router.get("/govs/geojson", response_model=FeatureCollectionModel)
async def get_gov_geojson(gov_codes: List[str] = Query([]),
                          service: GeoService = Depends(get_geo_service)):
    """
    Get list of geojson for govs, if govs_codes is empty, return all govs in Egypt.
    """
    return await service.get_locations_geojson(codes=gov_codes,
                                               location_types=[LocationTypeEnum.GOVERNORATE])


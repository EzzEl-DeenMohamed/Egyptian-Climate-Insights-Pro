from pydantic import Field, field_validator
from typing import Optional, Dict, Any, List
from app.models.schemas.base import BaseSchemaModel


# GeoJson Schema
class FeatureCollectionModel(BaseSchemaModel):
    type: str = "FeatureCollection"
    features: list


# Locations Schema
class LocationInfo(BaseSchemaModel):
    code: str
    parent_code: Optional[str]
    name: str

class LocationOut(BaseSchemaModel):
    location_info: LocationInfo

class LocationWithPostGisGeojson(LocationOut):
    geojson_geometry: str


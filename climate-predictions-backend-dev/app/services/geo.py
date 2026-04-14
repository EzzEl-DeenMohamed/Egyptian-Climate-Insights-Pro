import json
from typing import List, Union
from geojson import Feature, FeatureCollection
from shapely.geometry import shape
from shapely.ops import unary_union
from typing import Dict, Any

from app.models.schemas.common import LocationTypeEnum
from app.models.schemas.geo import (LocationOut, FeatureCollectionModel,
                                    LocationInfo, LocationWithPostGisGeojson)
from app.repos.geo import GeoRepository


class GeoService:
    def __init__(self, repo: GeoRepository):
        self.repo = repo

    async def get_locations(self, location_types: [LocationTypeEnum] = None, codes: [str] = None) -> List[LocationOut]:
        """
        Get list of locations by location types and codes
        :param location_types:  list of location types to filter by, if None filters locations of any type
        :param codes:  list of locations codes to filter by, if None filters all locations of the given types
        :return:  list of LocationOut objects
        """
        return await self.repo.get_locations(location_types, codes)

    async def get_locations_geojson(
            self,
            location_types: List[LocationTypeEnum] = None,
            codes: List[str] = None
    ) -> FeatureCollectionModel:
        locations = await self.repo.get_locations_geojson(location_types, codes)

        features = []
        for loc in locations:
            location_properties = {
                "code": loc.location_info.code,
                "parent_code": loc.location_info.parent_code,
                "name": loc.location_info.name,
            }
            feature = Feature(geometry=json.loads(loc.geojson_geometry), properties=location_properties)
            features.append(dict(feature.items()))

        return FeatureCollectionModel(features=features)

    async def get_locations_by_geojson(
            self,
            geojson: Dict[str, Any],
            location_types: List[LocationTypeEnum] = None
    ) -> List[LocationOut]:
        """
        Find locations that intersect with the given GeoJSON
        :param geojson: GeoJSON dictionary
        :param location_types: Optional list of location types to filter by
        :return: List of matching LocationOut objects
        """
        try:
            # Convert GeoJSON to Shapely geometry
            if geojson["type"] == "FeatureCollection":
                # For FeatureCollections, union all features
                geoms = [shape(feature["geometry"]) for feature in geojson["features"]]
                if not geoms:
                    return []
                geom = unary_union(geoms)
            else:
                geom = shape(geojson)

            if not geom.is_valid:
                geom = geom.buffer(0)  # Fix self-intersections if any

            # Get all locations of the specified types
            feature_collection = await self.get_locations_geojson(location_types)

            # Find intersecting locations
            intersecting_locations = []
            for feature in feature_collection.features:
                # Get the geometry from the feature collection
                loc_geom = shape(feature["geometry"])
                if geom.intersects(loc_geom):
                    intersecting_locations.append(
                        LocationOut(location_info=LocationInfo(**feature['properties']))
                    )

            return intersecting_locations
        except Exception as e:
            raise ValueError(f"Error processing GeoJSON: {str(e)}")
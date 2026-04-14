import json
from typing import List, Sequence

from sqlalchemy import select
from geoalchemy2 import functions as geo_func

from app.models.schemas.common import LocationTypeEnum
from app.models.schemas.geo import LocationInfo, LocationOut, LocationWithPostGisGeojson
from app.repos.base import BaseRepository
from app.models.db.climate import LocationDim

class GeoRepository(BaseRepository):

    async def get_locations(self, location_types: [LocationTypeEnum] = None, codes: [str] = None) -> List[LocationOut]:
        """
        Get list of locations by location types and codes
        :param location_types: list of location types to filter by, if None filters locations of any type
        :param codes: list of locations codes to filter by, if None filters all locations of the given types
        :return: list of RegionOut objects with
        """
        stmt = select(LocationDim.code, LocationDim.parent_code, LocationDim.name_en)
        if location_types:
            stmt = stmt.where(LocationDim.location_type.in_(location_types))
        if codes:
            stmt = stmt.where(LocationDim.code.in_(codes))

        result = await self.db.execute(stmt)

        return [LocationOut(location_info=LocationInfo(code=code, parent_code=parent_code, name=name_en))
                for code, parent_code, name_en in result.fetchall()]


    async def get_locations_geojson(self, location_types: [LocationTypeEnum] = None, codes: [str] = None
                                    ) -> List[LocationWithPostGisGeojson]:
        """
        Get list of locations by location types and codes with geojson geometry
        :param location_types: list of location types to filter by, if None return locations of any type
        :param codes: list of location codes to filter by, if None return all locations of the given types
        :return: list of RegionWithGeoJson objects with geojson_geometry
        """
        stmt = select(LocationDim.code,
                      LocationDim.parent_code,
                      LocationDim.name_en,
                      geo_func.ST_AsGeoJSON(LocationDim.geometry).label('geojson_geometry')
                      )
        if location_types:
            stmt = stmt.where(LocationDim.location_type.in_(location_types))
        if codes:
            stmt = stmt.where(LocationDim.code.in_(codes))

        result = await self.db.execute(stmt)
        rows = result.fetchall()

        return [LocationWithPostGisGeojson(location_info=LocationInfo(code=code, parent_code=parent_code, name=name_en),
                                            geojson_geometry=geojson_geometry)
                for code, parent_code, name_en, geojson_geometry in rows]


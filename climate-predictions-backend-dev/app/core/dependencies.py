import typing

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.repos.base import BaseRepository
from app.repos.climate import ClimateRepository

from app.repos.geo import GeoRepository

from app.services.climate import ClimateService
from app.services.geo import GeoService

# DATABASE DEPENDENCIES
from app.core.db import get_db_async


# REPOSITORIES DEPENDENCIES

def get_repository(
    repo_type: typing.Type[BaseRepository],
) -> typing.Callable[[AsyncSession], BaseRepository]:
    def _get_repo(
        db: AsyncSession = Depends(get_db_async),
    ) -> BaseRepository:
        return repo_type(db=db)

    return _get_repo

# SERVICES DEPENDENCIES

def get_geo_service(repo: GeoRepository = Depends(get_repository(GeoRepository))) -> GeoService:
    return GeoService(repo=repo)

def get_climate_service(repo: ClimateRepository = Depends(get_repository(ClimateRepository)),
                        geo_service: GeoService = Depends(get_geo_service)) -> ClimateService:
    return ClimateService(repo=repo, geo_service=geo_service)

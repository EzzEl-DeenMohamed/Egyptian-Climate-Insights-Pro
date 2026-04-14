import logging
from typing import List, Dict
import geopandas as gpd
from geoalchemy2.shape import to_shape
from sqlalchemy.dialects.postgresql import insert

from app.models.schemas.common import LocationTypeEnum
from app.models.db.climate import ClimateDataFact, LocationDim
from app.core.db import get_db_sync
from config import Config, UTM_CRS

def fetch_districts_geometries() -> gpd.GeoDataFrame:
    """Fetches district geometries from the database."""
    config = Config()
    session = get_db_sync()
    try:
        districts = session.query(LocationDim).filter(LocationDim.location_type == LocationTypeEnum.DISTRICT).all()
        records = [{"id": d.id, "code": d.code, "geometry": to_shape(d.geometry)} for d in districts]
        gdf = gpd.GeoDataFrame(records, crs=config.geo_src_crs_from_db)
        return gdf.to_crs(UTM_CRS) if config.geo_src_crs_from_db != UTM_CRS else gdf
    except Exception as e:
        logging.error(f"Failed to fetch district geometries: {str(e)}")
        raise
    finally:
        session.close()

def save_climate_records(records: List[Dict]) -> bool:
    """Saves climate data records to the database."""
    session = get_db_sync()
    try:
        if records:
            stmt = insert(ClimateDataFact).values(records)
            on_conflict_stmt = stmt.on_conflict_do_nothing(
                index_elements=["location_id", "clm_param_id", "timestamp", "scenario_code"]
            )
            session.execute(on_conflict_stmt)
            session.commit()
            logging.info(f"Committed {len(records)} records")
            return True
        return False
    except Exception as e:
        logging.error(f"Error saving records: {str(e)}")
        session.rollback()
        return False
    finally:
        session.close()
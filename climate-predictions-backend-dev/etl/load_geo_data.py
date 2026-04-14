import geopandas as gpd
from dotenv import load_dotenv
from sqlalchemy.dialects.postgresql import insert

from app.models.db.climate import LocationDim
from app.core.db import init_db_sync, get_db_sync
import os

from app.models.schemas.common import LocationTypeEnum

load_dotenv()

# path of .gdb file
gdb_path = os.getenv("GEO_DATABASE_PATH")

tables_to_load = [
    # governorates
    {
        "table_name": "Egy_adm_1",
        "model": LocationDim,
        "field_mapping": {
            "ADM1_EN": "name_en",
            "ADM1_AR": "name_ar",
            "ADM1_PCODE": "code",
            "ADM0_PCODE": "parent_code",
            "geometry": "geometry"
        },
        "location_type": LocationTypeEnum.GOVERNORATE,
    },
    # districts
    {
        "table_name": "Egy_adm_2",
        "model": LocationDim,
        "field_mapping": {
            "ADM2_EN": "name_en",
            "ADM2_AR": "name_ar",
            "ADM2_PCODE": "code",
            "ADM1_PCODE": "parent_code",
            "geometry": "geometry"
        },
        "location_type": LocationTypeEnum.DISTRICT,
    },
]


# Function to resolve foreign key relationships
def resolve_foreign_key(session, model, code):
    """Resolve a foreign key by code."""
    record = session.query(model).filter_by(code=code).first()
    return record.code if record else None

def bulk_insert_update(session, model, data, unique_fields, update_fields):
    """
    Insert records into the database, updating existing ones on conflict.

    Args:
        session: SQLAlchemy session.
        model: SQLAlchemy model.
        data: List of dictionaries containing data to insert.
        unique_fields: Fields to identify unique records.
        update_fields: Fields to update if a conflict occurs.
    """
    stmt = insert(model).values(data)
    on_conflict_stmt = stmt.on_conflict_do_update(
        index_elements=unique_fields,
        set_={field: getattr(stmt.excluded, field) for field in update_fields}
    )
    session.execute(on_conflict_stmt)


def load_data_to_postgres():
    # session = SessionLocal()
    session = get_db_sync()
    try:
        # insert record for egypt
        eg_row = {
            "name_en": "Egypt",
            "name_ar": "مصر",
            "code": "EG",
            "parent_code": None,
            "geometry": None,
            "location_type": LocationTypeEnum.COUNTRY
        }

        session.add(LocationDim(**eg_row))
        session.commit()

        for table in tables_to_load:
            gdb_table = table['table_name']
            model = table['model']
            field_mapping = table['field_mapping']
            location_type = table['location_type']

            gdf = gpd.read_file(gdb_path, layer=gdb_table)

            # reproject to the target CRS
            if SRC_CRS != TARGET_CRS:
                print(f"RE PROJECTING to {TARGET_CRS}.")
                gdf = gdf.to_crs(TARGET_CRS)

            # Ensure 'geometry' column is included in the selected columns
            selected_columns = list(field_mapping.keys())
            if 'geometry' not in selected_columns:
                selected_columns.append('geometry')

            # Select only the specified columns
            gdf = gdf.loc[:, selected_columns]

            # Map geodatabase columns to SQLAlchemy model fields
            gdf = gdf.rename(columns=field_mapping)

            # Convert GeoDataFrame rows to SQLAlchemy model instances
            records = []
            for _, row in gdf.iterrows():
                record_data = row.to_dict()
                record_data['geometry'] = row['geometry'].wkt  # Convert shape to WKT format
                record_data['location_type'] = location_type
                record = model(**record_data)
                records.append(record)

            session.bulk_save_objects(records)

            session.commit()
            print(f"Data from {gdb_table} loaded successfully into {model.__tablename__}.")

        session.commit()

    except Exception as e:
        session.rollback()
        print(f"Error loading data: {e}")
    finally:
        session.close()


if __name__ == "__main__":
    load_dotenv()

    # TARGET_CRS = "EPSG:32636"
    SRC_CRS = f'EPSG:{os.getenv("SRC_GEOMETRY_SRID")}'
    TARGET_CRS = f'EPSG:{os.getenv("DB_GEOMETRY_SRID")}' # should be 4326

    init_db_sync()
    load_data_to_postgres()

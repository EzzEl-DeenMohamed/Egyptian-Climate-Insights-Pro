import json

from dotenv import load_dotenv
from sqlalchemy.dialects.postgresql import insert

from app.core.db import init_db_sync, get_db_sync

from app.models.db.climate import ClimateParameterDim, ScenarioDim

import pandas as pd


# def bulk_insert_ignore(session, model, data, unique_fields):
#     """
#     Insert records into the database, ignoring existing ones.
#
#     Args:
#         session: SQLAlchemy session.
#         model: SQLAlchemy model.
#         data: List of dictionaries containing data to insert.
#         unique_fields: Fields to identify unique records.
#     """
#     stmt = insert(model).values(data)
#     on_conflict_stmt = stmt.on_conflict_do_nothing(index_elements=unique_fields)
#     session.execute(on_conflict_stmt)
#

# Helper function to bulk insert or update existing records
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


def extract_climate_parameter_data():
    global CLIMATE_PARAMETERS_JSON_FILE
    # Load the JSON data from the file
    with open(CLIMATE_PARAMETERS_JSON_FILE, 'r') as f:
        data = json.load(f)

    # Convert the JSON data into a DataFrame
    df = pd.DataFrame(data)

    # Select only the relevant columns (id, name, description, unit)
    return df[["id", "code", "name", "description", "unit"]].to_dict(orient="records")

def extract_scenario_data():
    global SCENARIOS_PARAMETERS_JSON_FILE
    # Load the JSON data from the file
    with open(SCENARIOS_PARAMETERS_JSON_FILE, 'r') as f:
        data = json.load(f)

    # Convert the JSON data into a DataFrame
    df = pd.DataFrame(data)

    # Select only the relevant columns (id, name, description, unit)
    return df[["code", "display_name", "desc"]].to_dict(orient="records")



if __name__ == "__main__":

    CLIMATE_PARAMETERS_JSON_FILE = "climate_parameters.json"
    SCENARIOS_PARAMETERS_JSON_FILE = "scenarios.json"

    # Transform and load data
    init_db_sync()
    session = get_db_sync()

    try:
        # Climate Parameter Dimension (update row if exists)
        climate_parameter_data = extract_climate_parameter_data()
        bulk_insert_update(session, ClimateParameterDim, climate_parameter_data, unique_fields=["id"],
                           update_fields=["description", "unit", "name"])

        # Scenario Dimension (update row if exists)
        scenario_data = extract_scenario_data()
        bulk_insert_update(session, ScenarioDim, scenario_data, unique_fields=["code"],
                           update_fields=["display_name", "desc"])

        session.commit()

        print("data inserted successfully!")

    except Exception as e:
        session.rollback()
        print(f"An error occurred: {e}")
    finally:
        session.close()

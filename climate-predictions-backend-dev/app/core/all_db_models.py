
"""
Import all db models here to be registered with the metadata object and to be created in the database
if they do not exist.
"""

from app.models.db.base import (
    SQLBase
)

from app.models.db.climate import (
    ClimateDataFact,
    ClimateParameterDim,
    LocationDim,
    ScenarioDim,
    ClimateRasters
)

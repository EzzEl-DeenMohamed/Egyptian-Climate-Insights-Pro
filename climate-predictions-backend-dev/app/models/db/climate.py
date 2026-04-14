import os

import app.core.config
from app.models.db.base import SQLBase

from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint, DateTime, Index, Enum as SQLEnum, \
    select, func, join, text, Connection
from sqlalchemy.orm import relationship
from geoalchemy2 import Raster, Geometry

from app.models.schemas.common import LocationTypeEnum

class ScenarioDim(SQLBase):
    schema_name = "dwh"

    __tablename__ = "scenario_dim"
    __table_args__ = (
        UniqueConstraint("code", name="unique_scenario_code"),
        {"schema": schema_name}
    )
    code = Column(String, primary_key=True, index=True)
    display_name = Column(String, index=True)
    desc = Column(String, nullable=True)


class ClimateParameterDim(SQLBase):
    schema_name = "dwh"

    __tablename__ = "climate_parameter_dim"
    __table_args__ = (
        {"schema": schema_name}
    )

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, index=True, unique=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    unit = Column(String, nullable=True)

    # @classmethod
    # def from_dict(cls, data):
    #     return cls(
    #         id=data["id"],
    #         code=data["code"],
    #         name=data["name"],
    #         description=data["description"],
    #         unit=data["unit"]
    #     )


class LocationDim(SQLBase):
    schema_name = "dwh"

    __tablename__ = "location_dim"
    __table_args__ = (
        UniqueConstraint("code", name="unique_code"),
        UniqueConstraint("code", "parent_code", name="unique_location"),
        {"schema": schema_name}
    )

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False, index=True)
    parent_code = Column(String, ForeignKey(f"{schema_name}.{__tablename__}.code"), nullable=True, index=True)
    name_en = Column(String, nullable=False)
    name_ar = Column(String, nullable=True)
    location_type = Column(SQLEnum(LocationTypeEnum), nullable=False)
    geometry = Column(Geometry('MULTIPOLYGON', srid=os.getenv("DB_GEOMETRY_SRID")), nullable=True)


    # def to_geojson(self) -> GeoJsonOut:
    #     region_properties = {"code": self.code, "name": self.name_en}
    #     feature = Feature(geometry=self.geometry, properties=region_properties)
    #     feature_collection_model = FeatureCollectionModel(features=[dict(feature.items())])
    #
    #     return GeoJsonOut(feature_collection=feature_collection_model, code=self.code)
    #
    # def to_region_out(self) -> RegionOut:
    #     return RegionOut(code=self.code, name=self.name_en)

class ClimateDataFact(SQLBase):
    schema_name = "dwh"

    __tablename__ = "climate_data_fact"
    __table_args__ = (
        UniqueConstraint("clm_param_id", "location_id", "timestamp", "scenario_code", name="unique_fact"),
        {"schema": schema_name}
    )

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)

    clm_param_id = Column(Integer,
                          ForeignKey(f"{ClimateParameterDim.schema_name}.{ClimateParameterDim.__tablename__}.id"),
                          nullable=False, index=True)
    location_id = Column(Integer, ForeignKey(f"{LocationDim.schema_name}.{LocationDim.__tablename__}.id"),
                         nullable=False, index=True)
    timestamp = Column(DateTime, primary_key=True, nullable=False, index=True)
    scenario_code = Column(String, ForeignKey(f"{ScenarioDim.schema_name}.{ScenarioDim.__tablename__}.code"),
                           nullable=False, index=True)

    value = Column(Float, nullable=False)

    climate_parameter = relationship("ClimateParameterDim")
    location = relationship("LocationDim")


    @classmethod
    def create_hypertable(cls, connection):
        """
        This method is used to convert the table into a hypertable.
        The hypertable is optimized for time-series data, allowing efficient storage and querying.
        """
        # Check if the table is already a hypertable
        result = connection.execute(text(f"""
                    SELECT COUNT(*) 
                    FROM timescaledb_information.hypertables 
                    WHERE hypertable_name = '{cls.__tablename__}';
                """)).fetchone()

        if result[0] == 0:
            connection.execute(text(f"""
                        SELECT create_hypertable('{cls.schema_name}.{cls.__tablename__}', 'timestamp');
                    """))
        else:
            print(f"Table {cls.schema_name}.{cls.__tablename__} is already a hypertable.")




class ClimateRasters(SQLBase):
    schema_name = "dwh"

    __tablename__ = "climate_rasters"
    __table_args__ = (
        UniqueConstraint("clm_param_id", "timestamp", name="unique_raster"),
        {"schema": schema_name}
    )

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)

    clm_param_id = Column(Integer,
                          ForeignKey(f"{ClimateParameterDim.schema_name}.{ClimateParameterDim.__tablename__}.id"),
                          nullable=False, index=True)
    timestamp = Column(DateTime, primary_key=True, nullable=False, index=True)

    rast = Column(Raster, nullable=False)

    #todo: create index on rast column
    'CREATE INDEX raster_gist_index ON rasters.climate_rasters USING gist (ST_ConvexHull(rast))'

    climate_parameter = relationship("ClimateParameterDim")

    @classmethod
    def create_hypertable(cls, connection):
        """
        This method is used to convert the table into a hypertable.
        The hypertable is optimized for time-series data, allowing efficient storage and querying.
        """
        # Check if the table is already a hypertable
        result = connection.execute(text(f"""
                SELECT COUNT(*) 
                FROM timescaledb_information.hypertables 
                WHERE hypertable_name = '{cls.__tablename__}';
            """)).fetchone()

        if result[0] == 0:
            connection.execute(text(f"""
                    SELECT create_hypertable('{cls.schema_name}.{cls.__tablename__}', 'timestamp');
                """))
        else:
            print(f"Table {cls.schema_name}.{cls.__tablename__} is already a hypertable.")



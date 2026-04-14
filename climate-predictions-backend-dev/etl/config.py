import os
import json
from typing import Dict, List, Any
from dotenv import load_dotenv

# Constants
UTM_CRS = "EPSG:32636"  # UTM Zone 36N
WGS84_CRS = "EPSG:4326"  # WGS 84
HISTORICAL_SCENARIO_CODE = "historical"

class Config:
    """Centralized configuration management for the ETL pipeline."""

    def __init__(self):
        load_dotenv()
        self.geo_src_crs_from_db = f'EPSG:{os.getenv("DB_GEOMETRY_SRID")}'
        self.grid_resolution_meters = int(os.getenv("GRID_RESOLUTION_METERS", 1000))
        self.egypt_bounds = {
            "lat_min": float(os.getenv("LAT_MIN", 22.0)),
            "lat_max": float(os.getenv("LAT_MAX", 31.7)),
            "lon_min": float(os.getenv("LON_MIN", 25.0)),
            "lon_max": float(os.getenv("LON_MAX", 35.0))
        }
        self.base_nc_folder = os.getenv("BASE_NC_FOLDER")
        self.max_files_threads = int(os.getenv("MAX_FILES_THREADS", 4))
        self.max_timestep_threads = int(os.getenv("MAX_TIMESTEP_THREADS", 2))
        self.start_year = int(os.getenv("START_YEAR", 1950))
        self.end_year = int(os.getenv("END_YEAR", 2020))
        self.variable_mappings_config = "mappings.json"

        # Load JSON configurations
        with open("climate_parameters.json", 'r') as f:
            self.climate_params = json.load(f)
        with open("scenarios.json", 'r') as f:
            self.scenarios = json.load(f)
        with open(self.variable_mappings_config, 'r') as f:
            config_data = json.load(f)
            self.variables = config_data["variables"]

    def validate(self) -> None:
        """Validates configuration parameters."""
        if self.start_year > self.end_year:
            raise ValueError("START_YEAR must be less than or equal to END_YEAR")
        if not self.base_nc_folder:
            raise ValueError("BASE_NC_FOLDER must be provided")
        if not os.path.exists(self.variable_mappings_config):
            raise ValueError(f"Variable mappings config file {self.variable_mappings_config} does not exist")
        if not isinstance(self.grid_resolution_meters, int) or self.grid_resolution_meters <= 0:
            raise ValueError("grid_resolution_meters must be a positive integer")
        if not isinstance(self.max_files_threads, int) or self.max_files_threads <= 0:
            raise ValueError("max_files_threads must be a positive integer")
        if not isinstance(self.max_timestep_threads, int) or self.max_timestep_threads <= 0:
            raise ValueError("max_timestep_threads must be a positive integer")

        # Validate variable configurations
        for var in self.variables:
            if not all(k in var for k in ["name", "historical", "cmip6", "upload_historical", "upload_cmip6"]):
                raise ValueError(f"Invalid variable config: {var}")
            if not isinstance(var["upload_historical"], bool) or not isinstance(var["upload_cmip6"], bool):
                raise ValueError(f"upload_historical and upload_cmip6 must be booleans in variable: {var}")

            # Validate historical config
            historical = var["historical"]
            if not all(k in historical for k in ["folder", "nc_var_name", "transformation"]):
                raise ValueError(f"Invalid historical config for {var['name']}: {historical}")
            if historical["transformation"] is not None and not isinstance(historical["transformation"], str):
                raise ValueError(f"historical.transformation must be a string or null for {var['name']}")

            # Validate CMIP6 config
            cmip6 = var["cmip6"]
            if not all(k in cmip6 for k in ["folders", "source_variables", "transformation"]):
                raise ValueError(f"Invalid CMIP6 config for {var['name']}: {cmip6}")
            if not isinstance(cmip6["folders"], list) or not isinstance(cmip6["source_variables"], list):
                raise ValueError(f"cmip6.folders and cmip6.source_variables must be lists for {var['name']}")
            if len(cmip6["folders"]) != len(cmip6["source_variables"]):
                raise ValueError(f"Mismatch between cmip6.folders and cmip6.source_variables for {var['name']}")
            if cmip6["transformation"] is not None and not isinstance(cmip6["transformation"], str):
                raise ValueError(f"cmip6.transformation must be a string or null for {var['name']}")

            # Validate climate_params
            if not any(p["code"] == var["name"] for p in self.climate_params):
                raise ValueError(f"No climate_param_id found for variable {var['name']}")
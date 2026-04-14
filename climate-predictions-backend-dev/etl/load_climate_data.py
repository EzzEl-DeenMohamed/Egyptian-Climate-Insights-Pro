import io
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Optional
import gzip
import logging
import numpy as np
import pandas as pd
import xarray as xr
import geopandas as gpd
from shapely.geometry import Point

from config import Config, UTM_CRS, WGS84_CRS, HISTORICAL_SCENARIO_CODE
from app.core.db import init_db_sync
from db_utils import fetch_districts_geometries, save_climate_records
from transformations import TransformationFactory
from utils import parse_time_value, idw_interpolation, extract_scenario_code, get_dimension_names, group_timesteps_by_year

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

# Load configuration
config = Config()
config.validate()

class NetCDFProcessor:
    """Processes NetCDF files for climate data."""
    def __init__(self, districts_gdf: gpd.GeoDataFrame, max_timestep_threads: int):
        self.districts_gdf = districts_gdf
        self.max_timestep_threads = max_timestep_threads

    def process_timestep(self, nc_data: xr.Dataset, time_index: int, climate_param_id: int, since_year: int,
                        scenario_code: str, transformation=None, extra_data: Optional[Dict[str, xr.Dataset]] = None,
                        source_variables: List[str] = None) -> List[Dict]:
        """Processes a single timestep of a NetCDF dataset."""
        try:
            logging.info(f"Processing timestep {time_index} for climate_param_id {climate_param_id} and scenario {scenario_code}")
            values_dict = {nc_data.name: nc_data.isel(time=time_index).values}
            nodata_value = nc_data.attrs.get("_FillValue", nc_data.attrs.get("missing_value", 9.96921e+36))

            # Initialize list of masks for each variable
            masks = [(~np.isnan(values_dict[nc_data.name])) & (values_dict[nc_data.name] != nodata_value)]

            # Handle extra_data interpolation and masks
            if extra_data:
                for var, ds in extra_data.items():
                    ds_interp = ds.isel(time=time_index).interp(
                        lat=nc_data["lat"], lon=nc_data["lon"], method="linear", kwargs={"fill_value": "extrapolate"}
                    )
                    values_dict[var] = ds_interp.values
                    # Assume extra_data datasets have their own nodata values
                    ds_nodata = ds.attrs.get("_FillValue", ds.attrs.get("missing_value", 9.96921e+36))
                    masks.append((~np.isnan(values_dict[var])) & (values_dict[var] != ds_nodata))

            # Compute the intersection of all masks
            valid_mask = np.logical_and.reduce(masks)

            # Apply transformation if provided
            if transformation:
                if source_variables and len(source_variables) == 1:
                    values = transformation.transform(values_dict[source_variables[0]])
                else:
                    values = transformation.transform(values_dict)
            else:
                values = nc_data.isel(time=time_index).values

            # Create meshgrid for lon/lat
            lon, lat = np.meshgrid(nc_data["lon"], nc_data["lat"])
            time_value = str(nc_data["time"].isel(time=time_index).values)[:10]
            timestamp = parse_time_value(time_value, since_year)

            # Use the pre-transformation valid_mask to select valid points
            valid_points = np.c_[lon[valid_mask], lat[valid_mask]]
            valid_values = values[valid_mask]

            if valid_points.size == 0:
                return []

            points_gdf = gpd.GeoDataFrame(
                {"value": valid_values},
                geometry=[Point(x, y) for x, y in valid_points],
                crs=WGS84_CRS
            ).to_crs(UTM_CRS)

            valid_points_utm = np.c_[points_gdf.geometry.x, points_gdf.geometry.y]
            grid_x, grid_y = np.meshgrid(
                np.arange(points_gdf.total_bounds[0], points_gdf.total_bounds[2], config.grid_resolution_meters),
                np.arange(points_gdf.total_bounds[1], points_gdf.total_bounds[3], config.grid_resolution_meters)
            )

            interpolated_grid = idw_interpolation(valid_points_utm, valid_values, grid_x, grid_y)

            df = pd.DataFrame({
                "value": interpolated_grid.ravel(),
                "x": grid_x.ravel(),
                "y": grid_y.ravel()
            })

            interpolated_points_gdf = gpd.GeoDataFrame(
                df, geometry=gpd.points_from_xy(df.x, df.y), crs=UTM_CRS
            )

            aggregated_data = gpd.sjoin(interpolated_points_gdf, self.districts_gdf, how="inner", predicate="within")
            aggregated_data = aggregated_data.groupby("id").agg({"value": "mean"}).reset_index()

            return [
                {
                    "timestamp": timestamp,
                    "location_id": int(row["id"]),
                    "clm_param_id": int(climate_param_id),
                    "scenario_code": scenario_code,
                    "value": round(float(row["value"]), 4)
                }
                for _, row in aggregated_data.iterrows()
            ]
        except Exception as e:
            logging.error(f"Error processing timestep {time_index}: {str(e)}")
            return []

    def process_year(self, nc_data: xr.Dataset, time_indices: List[int], climate_param_id: int,
                     since_year: int, scenario_code: str, transformation=None,
                     extra_data: Optional[Dict[str, xr.Dataset]] = None,
                     source_variables: List[str] = None) -> bool:
        try:
            year_records = []
            for time_index in time_indices:
                records = self.process_timestep(
                    nc_data, time_index, climate_param_id, since_year, scenario_code,
                    transformation, extra_data, source_variables
                )
                year_records.extend(records)
            # Aggregate for FrostDays, WetDays, DiurnalTemperatureRange
            if transformation and transformation.__class__.__name__ in ["FrostDays", "WetDays",
                                                                        "DiurnalTemperatureRange"]:
                df = pd.DataFrame(year_records)
                if not df.empty:
                    agg_func = "sum" if transformation.__class__.__name__ in ["FrostDays", "WetDays"] else "mean"
                    df = df.groupby(["location_id", pd.to_datetime(df["timestamp"]).dt.to_period("M")]).agg({
                        "value": agg_func,
                        "clm_param_id": "first",
                        "scenario_code": "first"
                    }).reset_index()
                    year_records = [
                        {
                            "timestamp": row["timestamp"].to_timestamp(),
                            "location_id": row["location_id"],
                            "clm_param_id": row["clm_param_id"],
                            "scenario_code": row["scenario_code"],
                            "value": round(float(row["value"]), 4)
                        }
                        for _, row in df.iterrows()
                    ]
            return save_climate_records(year_records)
        except Exception as e:
            logging.error(f"Error processing year with timesteps {time_indices}: {str(e)}")
            return False

    def process_file(self, nc_path: str, climate_param_id: int, var_config: Dict, start_year: int,
                     end_year: int, is_historical: bool, extra_data: Optional[Dict[str, str]] = None) -> bool:
        """Processes a single NetCDF file."""
        try:
            nc_to_open = nc_path
            if nc_path.endswith(".nc.gz"):
                with gzip.open(nc_path, "rb") as f:
                    nc_to_open = io.BytesIO(f.read())

            data = xr.open_dataset(nc_to_open, decode_cf=False)
            logging.info(f"Opened dataset {nc_path}. Variables: {list(data.variables)}, Dimensions: {list(data.dims)}")

            if "time" not in data.variables or "units" not in data["time"].attrs:
                raise ValueError(f"No time.units attribute found in {nc_path}")
            units = data["time"].attrs["units"]
            if not units.startswith("days since"):
                raise ValueError(f"Invalid time.units format in {nc_path}: {units}")
            try:
                date_str = units.split("since")[1].strip().split()[0]
                since_year = int(date_str.split("-")[0])
            except (IndexError, ValueError) as e:
                raise ValueError(f"Failed to parse year from time.units in {nc_path}: {units}") from e

            scenario_code = HISTORICAL_SCENARIO_CODE if is_historical else extract_scenario_code(nc_path)
            if not is_historical and (scenario_code is None or scenario_code not in [item["code"] for item in config.scenarios]):
                raise ValueError(f"Invalid or missing scenario code in CMIP6 file {nc_path}")

            nc_var_name = var_config["nc_var_name"] if is_historical else var_config["source_variables"][0]
            transformation_name = var_config.get("transformation")
            transformation = TransformationFactory.get_strategy(transformation_name) if transformation_name else None
            source_variables = [var_config["nc_var_name"]] if is_historical else var_config["source_variables"]

            if nc_var_name not in data.variables:
                raise KeyError(f"Variable {nc_var_name} not found in dataset {nc_path}. Available: {list(data.variables)}")

            lat_dim, lon_dim = get_dimension_names(data)
            if not lat_dim or not lon_dim:
                raise ValueError(f"Could not identify lat/lon dimensions in {nc_path}. Dimensions: {list(data.dims)}")

            values_data = data[nc_var_name]
            values_data = values_data.sel(
                **{lat_dim: slice(config.egypt_bounds["lat_min"], config.egypt_bounds["lat_max"]),
                   lon_dim: slice(config.egypt_bounds["lon_min"], config.egypt_bounds["lon_max"])}
            )
            values_data = values_data.rename({lat_dim: "lat", lon_dim: "lon"})
            values_data.name = var_config["source_variables"][0] if not is_historical else var_config["nc_var_name"]

            if extra_data:
                extra_datasets = {}
                for var, path in extra_data.items():
                    extra_ds = xr.open_dataset(path, decode_cf=False)
                    extra_ds = extra_ds[var].sel(
                        **{lat_dim: slice(config.egypt_bounds["lat_min"], config.egypt_bounds["lat_max"]),
                           lon_dim: slice(config.egypt_bounds["lon_min"], config.egypt_bounds["lon_max"])}
                    )
                    extra_ds = extra_ds.rename({lat_dim: "lat", lon_dim: "lon"})
                    extra_ds.name = var
                    extra_datasets[var] = extra_ds

            year_groups = group_timesteps_by_year(values_data, since_year, start_year, end_year)
            logging.info(f"Processing {len(year_groups)} years for {nc_path} in range {start_year}-{end_year}")

            with ThreadPoolExecutor(max_workers=self.max_timestep_threads) as executor:
                futures = [
                    executor.submit(
                        self.process_year, values_data, indices, climate_param_id, since_year, scenario_code,
                        transformation, extra_datasets if extra_data else None, source_variables
                    )
                    for _, indices in year_groups
                ]
                for future in futures:
                    try:
                        success = future.result()
                        if not success:
                            logging.warning(f"Year processing failed for {nc_path}")
                    except Exception as e:
                        logging.error(f"Year processing error for {nc_path}: {str(e)}")

            data.close()
            logging.info(f"Processed {nc_path} successfully")
            return True
        except Exception as e:
            logging.error(f"Failed to process {nc_path}: {str(e)}")
            return False

class ETLOrchestrator:
    """Orchestrates the ETL process for NetCDF files."""
    def __init__(self, base_folder: str, max_files_threads: int, max_timestep_threads: int,
                 start_year: int, end_year: int):
        self.base_folder = base_folder
        self.max_files_threads = max_files_threads
        self.max_timestep_threads = max_timestep_threads
        self.start_year = start_year
        self.end_year = end_year
        self.districts_gdf = fetch_districts_geometries()
        self.processor = NetCDFProcessor(self.districts_gdf, max_timestep_threads)

    def run(self):
        """Runs the ETL process for all NetCDF files."""
        processed_files = []
        failed_files = []

        for var_config in config.variables:
            var_name = var_config["name"]
            climate_param_id = next((p["id"] for p in config.climate_params if p["code"] == var_name), None)
            if climate_param_id is None:
                logging.warning(f"Skipping {var_name}: no clm_param_id found")
                continue

            # Process historical data
            if var_config.get("upload_historical", False):
                folder = os.path.join(self.base_folder, var_config["historical"]["folder"])
                if not os.path.isdir(folder):
                    logging.warning(f"Skipping {folder}: not a directory")
                    continue

                nc_files = [
                    (os.path.join(folder, nc_file), climate_param_id, var_config["historical"], True, None)
                    for nc_file in os.listdir(folder) if nc_file.endswith((".nc", ".nc.gz"))
                ]

                with ThreadPoolExecutor(max_workers=self.max_files_threads) as executor:
                    results = executor.map(
                        lambda args: (args[0], self.processor.process_file(
                            args[0], args[1], args[2], self.start_year, self.end_year, args[3], args[4])),
                        nc_files
                    )
                    for nc_path, success in results:
                        (processed_files if success else failed_files).append(nc_path)

            # Process CMIP6 data
            if var_config.get("upload_cmip6", False):
                primary_folder = os.path.join(self.base_folder, var_config["cmip6"]["folders"][0])
                if not os.path.isdir(primary_folder):
                    logging.warning(f"Skipping {primary_folder}: not a directory")
                    continue

                # Collect primary files and their scenario codes
                primary_files = []
                for nc_file in os.listdir(primary_folder):
                    if nc_file.endswith((".nc", ".nc.gz")):
                        nc_path = os.path.join(primary_folder, nc_file)
                        scenario_code = extract_scenario_code(nc_path)
                        if scenario_code:  # Only check for non-None scenario_code
                            primary_files.append((nc_path, scenario_code))
                        else:
                            logging.warning(f"Skipping {nc_path}: no scenario code detected")

                # Process each primary file with matching extra data
                nc_files = []
                for primary_path, scenario_code in primary_files:
                    extra_data = {}
                    if len(var_config["cmip6"]["source_variables"]) > 1:
                        for folder, var in zip(var_config["cmip6"]["folders"][1:],
                                               var_config["cmip6"]["source_variables"][1:]):
                            extra_folder = os.path.join(self.base_folder, folder)
                            if not os.path.isdir(extra_folder):
                                logging.warning(f"Skipping {extra_folder}: not a directory")
                                continue
                            # Find extra file with matching scenario_code
                            for extra_file in os.listdir(extra_folder):
                                if extra_file.endswith((".nc", ".nc.gz")):
                                    extra_path = os.path.join(extra_folder, extra_file)
                                    extra_scenario = extract_scenario_code(extra_path)
                                    if extra_scenario == scenario_code:
                                        extra_data[var] = extra_path
                                        break
                            else:
                                logging.warning(
                                    f"No file with scenario {scenario_code} found in {extra_folder}")
                                break  # Skip this primary file if no matching extra file
                        if len(extra_data) != len(var_config["cmip6"]["source_variables"][1:]):
                            logging.warning(
                                f"Skipping {primary_path}: missing extra data for {scenario_code}")
                            continue  # Skip if not all extra data found
                    nc_files.append(
                        (primary_path, climate_param_id, var_config["cmip6"], False, extra_data))

                if not nc_files:
                    logging.warning(f"No valid CMIP6 files found for {var_name} in {primary_folder}")
                    continue

                with ThreadPoolExecutor(max_workers=self.max_files_threads) as executor:
                    results = executor.map(
                        lambda args: (args[0], self.processor.process_file(
                            args[0], args[1], args[2], self.start_year, self.end_year, args[3], args[4])),
                        nc_files
                    )
                    for nc_path, success in results:
                        (processed_files if success else failed_files).append(nc_path)

        logging.info(f"Processed files ({len(processed_files)}): {processed_files}")
        logging.info(f"Failed files ({len(failed_files)}): {failed_files}")

if __name__ == "__main__":
    init_db_sync()
    orchestrator = ETLOrchestrator(
        config.base_nc_folder, config.max_files_threads,
        config.max_timestep_threads, config.start_year, config.end_year
    )
    orchestrator.run()
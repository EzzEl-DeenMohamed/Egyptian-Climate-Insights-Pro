from datetime import datetime, timedelta
import numpy as np
from scipy.spatial import cKDTree
import logging

def parse_time_value(time_value: str, since_year: int, output_format: str = "%Y-%m-%d") -> str:
    """Parses time value into a formatted date string."""
    try:
        timestamp = datetime(since_year, 1, 1) + timedelta(days=float(time_value))
    except (ValueError, TypeError):
        timestamp = datetime.strptime(str(time_value)[:10], "%Y-%m-%d")
    return timestamp.strftime(output_format)

def idw_interpolation(points: np.ndarray, values: np.ndarray, grid_x: np.ndarray, grid_y: np.ndarray, power: int = 2) -> np.ndarray:
    """Performs Inverse Distance Weighting interpolation."""
    tree = cKDTree(points)
    distances, idx = tree.query(np.c_[grid_x.ravel(), grid_y.ravel()], k=2)
    weights = 1 / np.maximum(distances, 1e-12) ** power
    return np.sum(weights * values[idx], axis=1) / weights.sum(axis=1)

def extract_scenario_code(nc_path_or_obj: str) -> str | None:
    """Extracts scenario code from NetCDF filename."""
    import os
    file_name = os.path.basename(nc_path_or_obj) if isinstance(nc_path_or_obj, str) else os.path.basename(nc_path_or_obj.name)
    try:
        return file_name.split("_")[3]
    except IndexError:
        logging.warning(f"No scenario code found in filename: {file_name}")
        return None

def get_dimension_names(dataset) -> tuple[str | None, str | None]:
    """Returns latitude and longitude dimension names."""
    possible_lat_names = ["lat", "latitude", "y"]
    possible_lon_names = ["lon", "longitude", "x"]
    lat_dim = next((dim for dim in possible_lat_names if dim in dataset.dims), None)
    lon_dim = next((dim for dim in possible_lon_names if dim in dataset.dims), None)
    return lat_dim, lon_dim

def group_timesteps_by_year(nc_data, since_year: int, start_year: int, end_year: int) -> list[tuple[int, list[int]]]:
    """Groups timesteps by year within the specified range."""
    time_values = nc_data["time"].values
    years = {}
    for idx, time_value in enumerate(time_values):
        timestamp = parse_time_value(str(time_value)[:10], since_year)
        year = datetime.strptime(timestamp, "%Y-%m-%d").year
        if start_year <= year <= end_year:
            if year not in years:
                years[year] = []
            years[year].append(idx)
    if not years:
        logging.warning(f"No timesteps found in year range {start_year}-{end_year}")
    return [(year, indices) for year, indices in years.items() if len(indices) > 0]
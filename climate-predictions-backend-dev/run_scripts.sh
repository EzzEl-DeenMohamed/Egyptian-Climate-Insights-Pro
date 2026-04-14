#!/bin/bash
export PYTHONPATH=$(pwd)
python /app/etl/load_geo_data.py
python /app/etl/load_climate_params.py
python /app/etl/load_climate_data.py
python /app/etl/refresh_materialized_views.py

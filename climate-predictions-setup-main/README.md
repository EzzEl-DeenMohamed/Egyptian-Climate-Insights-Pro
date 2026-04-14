# Climate Predictions Setup

## Project Structure

```
climate-predictions-setup/
├── climate-predictions-backend/
├── climate-predictions-frontend/
├── NC_files/
├── New File Geodatabase.gdb/
├── docker-compose.yml
```

## Getting Started

### 1. Navigate to the project directory:

```bash
cd /path/to/climate-predictions-setup
```

### 2. Run the application using Docker:

```bash
docker-compose up --build -d
```

## Database Setup

### Run All Data Scripts

To initialize the database with all necessary data, execute the following inside the backend container:

```bash
./run_scripts.sh
```

This script sets up all required datasets and configurations.

### Running a Specific Script

To run a specific ETL script, follow these steps inside the backend container:

```bash
export PYTHONPATH=$(pwd)
python /etl/load_geo_data.py
```

Replace `/etl/load_geo_data.py` with the path to the script you want to run.

### Partial Data Load & Refresh

If you don't need to load all data:

1. First, run the full data setup:

```bash
./run_scripts.sh
```

You can stop the process at any time using `Ctrl + C`.

2. Later, to refresh materialized views only, run:

```bash
export PYTHONPATH=$(pwd)
python /etl/refresh_materialized_views.py
```

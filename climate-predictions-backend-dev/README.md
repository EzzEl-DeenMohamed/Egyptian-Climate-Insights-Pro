# Climate Predictions Backend

Welcome to the **Climate Predictions Backend**! This project powers the **Climate Insights Portal**, a tool that leverages machine learning models to predict future climate parameters for Egypt. It provides valuable insights through GeoJSON data and spatial queries using PostGIS. The platform offers a fast, scalable backend built with **FastAPI** for real-time climate predictions and visualizations.

---

## 🛠️ Requirements

Before getting started, ensure the following are installed:

- **Python 3.10: Required for running the project.
- **`pip`**: Python package manager for installing dependencies.
- **`virtualenv`**: To create isolated environments for your project.

---

## 🚀 Getting Started

To set up the project on your local machine, follow these steps:

### 1. Create a Virtual Environment

Run the following command to create a virtual environment for your project:

```bash
python -m venv venv
```

### 2. Activate the Virtual Environment

- **On Windows**:
  ```bash
  .\venv\Scripts\activate
  ```

- **On MacOS/Linux**:
  ```bash
  source venv/bin/activate
  ```

### 3. Set Up the `.env` File

In the root directory of the project, create a `.env` file. This file will store environment variables such as database URLs, API keys, and secrets. Ensure all required variables are added to this file.

### 4. Install Dependencies

After setting up the virtual environment and the `.env` file, install the required Python packages:

```bash
pip install -r requirements.txt
```

### - docker container for timescaledb 
'docker run --hostname=d4fdc62a50df --user=postgres --env=POSTGRES_PASSWORD=postgres --env=PATH=/usr/lib/postgresql/16/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin --env=PGROOT=/home/postgres --env=PGDATA=/home/postgres/pgdata/data --env=PGLOG=/home/postgres/pg_log --env=PGSOCKET=/home/postgres/pgdata --env=BACKUPROOT=/home/postgres/pgdata/backup --env=PGBACKREST_CONFIG=/home/postgres/pgdata/backup/pgbackrest.conf --env=PGBACKREST_STANZA=poddb --env=LC_ALL=C.UTF-8 --env=LANG=C.UTF-8 --env=PAGER= --network=bridge --workdir=/home/postgres -p 4444:5432 --restart=no --label='com.timescaledb.image.ai.version=0.8.0' --label='com.timescaledb.image.install_method=docker-ha' --label='com.timescaledb.image.patroni.version=4.0.4' --label='com.timescaledb.image.pgBackRest.version=2.54.2' --label='com.timescaledb.image.postgis.version=3.5.2' --label='com.timescaledb.image.postgresql.available_versions=16.6' --label='com.timescaledb.image.postgresql.version=16.6' --label='com.timescaledb.image.timescaledb.available_versions=2.12.2,2.13.0,2.13.1,2.14.0,2.14.1,2.14.2,2.15.0,2.15.1,2.15.2,2.15.3,2.16.0,2.16.1,2.17.0,2.17.1,2.17.2,2.18.0' --label='com.timescaledb.image.timescaledb.version=2.18.0' --label='com.timescaledb.image.timescaledb_toolkit.available_versions=1.18.0,1.19.0' --label='com.timescaledb.image.timescaledb_toolkit.version=1.19.0' --label='com.timescaledb.image.vectorscale.available_versions=0.2.0,0.3.0,0.4.0,0.5.0,0.5.1' --label='com.timescaledb.image.vectorscale.version=0.5.1' --label='org.opencontainers.image.created=2025-02-04T15:27:09+00:00' --label='org.opencontainers.image.revision=refs/heads/master' --label='org.opencontainers.image.source=https://github.com/timescale/timescaledb-docker-ha' --label='org.opencontainers.image.vendor=Timescale' --runtime=runc -d timescale/timescaledb-ha:pg16'
### 5. Run the Project

Once the environment is set up and dependencies are installed, you can start the application:

```bash
uvicorn app.main:app --reload
```

---

## 📂 Project Structure

Below is an overview of the project directory structure:

```backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application entry point
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py        # Configuration settings
│   │   ├── db.py            # Database connection
│   │   ├── logging.py       # Logging setup
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── data.py      # Routes for historical data
│   │   │   ├── predict.py   # Routes for predictions
│   │   │   ├── auth.py      # Routes for user authentication
│   │   ├── dependencies.py  # Dependency injections
│   ├── models/
│   │   ├── __init__.py
│   │   ├── schemas.py       # Pydantic models for request/response
│   │   ├── database.py      # ORM models for database tables
│   ├── services/
│   │   ├── __init__.py
│   │   ├── data_service.py  # Functions to interact with historical data
│   │   ├── predict_service.py  # Functions for ML model interaction
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── model_loader.py  # Load and interact with ML models
│   │   ├── preprocess.py    # Preprocessing utilities for predictions
├── tests/                   # Unit and integration tests
│   ├── __init__.py
│   ├── test_routes.py
│   ├── test_services.py
├── requirements.txt         # Python dependencies
├── README.md
├── .env
├── venv
```

---

## ✨ Features

- **Machine Learning Predictions**: Predict future climate parameters for Egypt.
- **Spatial Queries with PostGIS**: GeoJSON data and advanced spatial queries.
- **FastAPI**: High-performance backend for real-time responses.
- **Scalable Architecture**: Modular and extensible project structure.
- **Testing Suite**: Comprehensive unit tests for each module.

---

## 🤝 Contributing

We welcome contributions! To contribute:

1. Fork the repository.
2. Create a new branch for your feature.
3. Commit your changes and push them to your fork.
4. Open a pull request for review.

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Thank you for using **Climate Predictions Backend**! If you have any questions or need support, feel free to open an issue or reach out to us.


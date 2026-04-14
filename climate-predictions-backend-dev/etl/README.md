

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

### 5. Run the scripts in the following order

- load_geo_data
- load_dimensions
- load_climate_data

## 

---

## 📂 Climate Data Structure

Below is an overview of the climate data structure:

```
├── .gdb geo data/

├── nc files base folder/
│   ├── folders named with climate param id/
│   │   ├── multiple nc files

```
### NOTE: (scripts will work only on the provided data)

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


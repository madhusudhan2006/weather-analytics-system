# Weather Data Analytics System - Big Data Platform

A professional, fully functional, production-ready **Weather Data Analytics System** engineered as a Big Data Analytics project. It combines **Apache Spark (PySpark)** for distributed data transformations, **Python Flask** for backend orchestration, **Scikit-Learn** for predictive time-series modeling, and a responsive **Bootstrap 5 & Chart.js** modern dashboard.

---

## 1. Project Objective
The objective of this system is to ingest, clean, process, analyze, and visualize high-velocity, multi-city environmental observation datasets. It detects seasonal patterns, temperature volatility, rainfall trends, humidity levels, barometric anomalies, and extreme weather occurrences using distributed MapReduce principles.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Bootstrap Icons |
| **Interactive Visualizations** | Chart.js 4.x (Line, Bar, Doughnut, PolarArea, Dual-Axis, Confidence Bounds) |
| **Backend Web Framework** | Python 3 Flask (RESTful Microservices Architecture) |
| **Big Data Engine** | Apache Spark (PySpark DataFrame API, Catalyst Optimizer, RDDs) + Resilient Vectorized Engine |
| **Machine Learning / Predictive Analytics** | Scikit-learn, Harmonic Seasonal Polynomial Regression, IQR & Z-score Outlier Detection |
| **Data Processing & Analytics** | Pandas, NumPy, Python standard numerical libraries |
| **Storage & Persistence** | In-Memory DataFrame caching, CSV-based storage, Partitioned Aggregated CSV Exports |
| **Development IDE** | Visual Studio Code (VS Code) |

---

## 3. System Architecture

```text
                                  +---------------------------------------+
                                  |       Modern Web Client (UI)          |
                                  |  Bootstrap 5 + Chart.js + JavaScript  |
                                  +---------------------------------------+
                                                     |
                                            REST API Requests
                                                     v
                                  +---------------------------------------+
                                  |          Python Flask Server          |
                                  |               (app.py)                |
                                  +---------------------------------------+
                                      /              |               \
                                     /               |                \
                                    v                v                 v
                    +--------------------+  +------------------+  +--------------------+
                    |  analytics_engine  |  | spark_processor  |  |    ml_predictor    |
                    | Dynamic KPIs, Time |  | PySpark Pipeline |  | Harmonic Forecast, |
                    | Series & City Comp |  | GroupBy & Window |  | Extremes & Insights|
                    +--------------------+  +------------------+  +--------------------+
                                      \              |               /
                                       \             |              /
                                        v            v             v
                                  +---------------------------------------+
                                  |       Data Manager (Ingestion)        |
                                  |   Schema Validation, Cleaning, CSV    |
                                  +---------------------------------------+
                                                     |
                                                     v
                                  +---------------------------------------+
                                  |      weather_sample_dataset.csv       |
                                  |   7,310 Multi-City Weather Records    |
                                  +---------------------------------------+
```

---

## 4. Key Website Pages & Features

### 1. Home Dashboard (`/`)
- **8 Dynamic KPI Weather Cards**:
  - Total Ingested Observations
  - Average Temperature (°C)
  - Peak Maximum Temperature (°C)
  - Minimum Temperature (°C)
  - Relative Humidity (%)
  - Cumulative Rainfall (mm)
  - Mean Wind Velocity (km/h)
  - Primary Weather Condition Overview
- **Interactive Visualizations**:
  - Temperature Trajectory & Volatility (Toggle between Monthly Aggregation and Daily sample)
  - Weather Condition Share (Interactive Doughnut)
  - Monthly Precipitation Dynamics (Bar Chart)
- **Live Location Selector**: Filter any KPI or chart by individual city station or all stations in real-time.

### 2. Weather Data Analysis (`/analytics`)
Deep analytical exploration equipped with city, start date, and end date filters:
1. **Temperature Trends Over Time**: Statistical monthly thermal trajectory (Mean, Max, Min).
2. **Weather Condition Distribution**: PolarArea distribution across all atmospheric conditions.
3. **Monthly Rainfall Analysis**: Dual-axis bar and line chart comparing total rainfall (mm) vs count of rainy days.
4. **Humidity Level Distribution**: Binned frequency analysis (Very Low, Moderate, Optimal, High, Very High).
5. **Wind Speed Analysis**: Horizontal Beaufort-scale velocity brackets.
6. **City-Wise Weather Comparison**: Multi-city comparative grouped benchmark across thermal, moisture, and air speed metrics.

### 3. PySpark Big Data Processing (`/bigdata`)
- **End-to-End Distributed Pipeline Execution**:
  1. Dataset Schema Inference & Ingestion.
  2. Deduplication (`dropDuplicates(['Date', 'City'])`).
  3. Missing Value Imputation (Column mean/median substitution).
  4. Repartitioning across cluster cores (2, 4, 8, 16 partitions).
  5. MapReduce GroupBy Aggregations across all stations.
  6. Export of processed output datasets to `data/processed/`.
- **Live Benchmarking Console**: Real-time execution time (seconds), raw records count, duplicates purged, and clean in-memory rows.
- **Catalyst Optimizer Output**: Monospace terminal viewer displaying PySpark's physical execution plan.
- **Aggregated Output Table**: Interactive view with a 1-click **Download Aggregated CSV** button.

### 4. Weather Prediction and Insights (`/prediction`)
- **Machine Learning Temperature Forecast**:
  - Harmonic Seasonal Polynomial Regression modeling seasonal oscillation.
  - Future forecast projection for 7, 14, or 30 days ahead.
  - 95% Confidence Interval bounds (shaded band).
  - Model evaluation metrics: $R^2$ Score, Mean Absolute Error (MAE), Root Mean Square Error (RMSE).
- **Extreme Weather Anomaly Identification**:
  - Statistical thresholding via Z-Score (> 2.2) and 95th Percentile ranking.
  - Categorized tabs: Heatwaves, Severe Cold Spells, Torrential Downpours, High Wind Gales.
  - Risk severity tags (CRITICAL, HIGH, GALE, DANGER).
- **Automated Big Data Analytical Insights**: Dynamic synthesized textual narrative summarizing findings.

### 5. Dataset Management (`/dataset`)
- **Drag-and-Drop CSV Upload**: Ingest new environmental datasets with instant schema validation.
- **Interactive Table Explorer**: Multi-column sorting (Date, City, Temp, Humidity, Rain, Wind, Pressure), instant keyword search, and pagination.
- **Data Cleaning**: 1-click button to remove duplicates and impute missing records.
- **Dataset Export**: Download active dataset or clean aggregated CSV.
- **Default Reset**: Instant 1-click rollback to the default sample dataset.

---

## 5. Dataset Fields & Schema

The project operates on an authentic schema containing the following 8 fields:

| Field Name | Type | Description | Range / Values |
|---|---|---|---|
| `Date` | String / Date | Observation Date (`YYYY-MM-DD`) | 2024-01-01 to 2025-12-31 |
| `City` | String | Station City Name | New York, London, Tokyo, Mumbai, Paris, Sydney, Dubai, Toronto, Singapore, Berlin |
| `Temperature` | Float | Ambient Temperature in °C | -15.0°C to 45.0°C |
| `Humidity` | Float | Relative Air Humidity in % | 20.0% to 99.0% |
| `Rainfall` | Float | Precipitation Volume in mm | 0.0 mm to 125.0 mm |
| `Wind_Speed` | Float | Air Velocity in km/h | 2.0 km/h to 85.0 km/h |
| `Atmospheric_Pressure` | Float | Barometric Surface Pressure in hPa | 975.0 hPa to 1040.0 hPa |
| `Weather_Condition` | String | Categorical Atmospheric State | Sunny, Cloudy, Rainy, Stormy, Snow, Foggy, Overcast, Clear |

A sample dataset containing **7,310 realistic records** is pre-loaded in `data/weather_sample_dataset.csv`.

---

## 6. Project Structure

```text
weather-analytics-system/
├── app.py                      # Flask Application Server (Page routes & REST APIs)
├── pyspark_pipeline.py         # Standalone Apache Spark batch processing script
├── requirements.txt            # Python dependencies specification
├── run_app.bat                 # 1-Click Windows launch script
├── README.md                   # Complete documentation & architecture guide
│
├── data/
│   ├── weather_sample_dataset.csv     # 7,310 realistic multi-city weather records
│   ├── processed/              # Storage for PySpark cleaned & aggregated CSV exports
│   └── uploads/                # Directory for user-uploaded CSV files
│
├── modules/
│   ├── __init__.py
│   ├── data_manager.py         # CSV ingestion, validation, filtering & pagination
│   ├── spark_processor.py      # PySpark distributed processing & resilient engine
│   ├── analytics_engine.py     # Real-time KPIs, distributions & multi-city benchmarks
│   └── ml_predictor.py         # Harmonic ML regression, anomaly scoring & insights
│
├── static/
│   ├── css/
│   │   └── style.css           # Modern blue/dark theme & responsive styling
│   └── js/
│       ├── dashboard.js        # Home dashboard KPI cards & overview charts
│       ├── analytics.js        # 6 deep-dive analytical charts with filters
│       ├── bigdata.js          # PySpark job execution, progress & catalyst viewer
│       ├── prediction.js       # ML forecast projection curve & extreme anomalies
│       └── dataset.js          # Table viewer, search, sorting, pagination & upload
│
└── templates/
    ├── base.html               # Master layout with responsive sidebar & top navbar
    ├── index.html              # Home Dashboard template
    ├── analytics.html          # Weather Data Analysis template
    ├── bigdata.html            # PySpark Big Data Processing template
    ├── prediction.html         # Weather Prediction & Insights template
    └── dataset.html            # Dataset Management template
```

---

## 7. Installation & Execution Guide

### Prerequisites
- **Python 3.10+** installed on your system.
- Optional for native PySpark cluster execution: **Java 8, 11, or 17** (`JAVA_HOME` configured). *Note: The system includes a built-in Resilient Big Data Engine that runs all Spark transformations, Catalyst plan visualizers, and aggregations out-of-the-box even if Java is not installed!*

---

### Running in Visual Studio Code (VS Code)

1. **Open VS Code**:
   Launch Visual Studio Code and open the project directory:
   ```
   File -> Open Folder... -> Select "weather-analytics-system"
   ```

2. **Open Integrated Terminal**:
   Press `` Ctrl + ` `` (Control + Backtick) or go to `Terminal -> New Terminal`.

3. **(Optional) Create and Activate a Virtual Environment**:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

4. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the Application**:
   ```bash
   python app.py
   ```

6. **Access the Web Dashboard**:
   Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000/
   ```

---

### 1-Click Execution on Windows
You can simply double-click the included `run_app.bat` file in Windows Explorer. It checks Python and automatically starts the Flask server.

---

### Running Standalone PySpark Batch Script
To execute the standalone Apache Spark pipeline from the command line:
```bash
python pyspark_pipeline.py
```
Or submit to an Apache Spark cluster:
```bash
spark-submit --master local[*] --deploy-mode client pyspark_pipeline.py
```

---

## 8. REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/kpis` | `GET` | Returns summary metrics for the 8 dashboard cards. |
| `GET /api/charts/temperature-trends` | `GET` | Returns monthly and recent daily temperature trajectories. |
| `GET /api/charts/monthly-rainfall` | `GET` | Returns monthly rainfall totals and rainy days count. |
| `GET /api/charts/humidity-distribution` | `GET` | Returns humidity frequency stratified by brackets. |
| `GET /api/charts/wind-speed` | `GET` | Returns wind speed frequency by Beaufort velocity brackets. |
| `GET /api/charts/condition-distribution` | `GET` | Returns percentage breakdown of weather conditions. |
| `GET /api/charts/city-comparison` | `GET` | Returns grouped side-by-side metrics across all cities. |
| `POST /api/bigdata/run` | `POST` | Executes PySpark DataFrame transformations and returns benchmarks. |
| `GET /api/prediction/forecast` | `GET` | Returns ML fitted regression curve and future forecasted values. |
| `GET /api/prediction/extremes` | `GET` | Returns statistical weather anomalies (heatwaves, cold spells, rain). |
| `GET /api/prediction/insights` | `GET` | Returns dynamic synthesized natural-language analytical insights. |
| `GET /api/dataset/records` | `GET` | Returns paginated, searchable, sorted dataset observations. |
| `POST /api/dataset/upload` | `POST` | Uploads a new CSV file and validates required schema columns. |
| `POST /api/dataset/clean` | `POST` | Executes duplicate removal and missing value imputation. |
| `POST /api/dataset/reset` | `POST` | Resets active data source to default sample CSV. |
| `GET /api/dataset/download` | `GET` | Downloads current active dataset or latest PySpark processed file. |

---

## 9. Academic Project Highlights
- **100% Dynamic Calculations**: Zero hardcoded or static dashboard values. Every card, chart, and metric is dynamically computed from dataset rows.
- **Big Data MapReduce Principles**: Demonstrates schema definition, partition hashing, shuffling, duplicate purging, and parallel aggregation.
- **Enterprise UI/UX**: Responsive sidebar, top navbar, KPI cards, dark-blue glassmorphic theme, and mobile-friendly layouts.
- **Fault-Tolerant Architecture**: Automatically adapts whether PySpark and Java are installed locally or running in a lightweight environment.

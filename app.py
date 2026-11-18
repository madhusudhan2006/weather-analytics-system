"""
Weather Data Analytics System - Flask Application Server
Connects dynamic dataset operations with Big Data PySpark processing,
analytics computations, ML predictive modeling, and interactive Web Dashboard.
"""

import os
import sys
from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for

# Ensure current project directory is in python search path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from modules.data_manager import DataManager
from modules.spark_processor import SparkWeatherProcessor
from modules.analytics_engine import AnalyticsEngine
from modules.ml_predictor import WeatherMLPredictor

app = Flask(__name__)
app.config['SECRET_KEY'] = 'weather-bigdata-analytics-secret-key-2026'
app.config['MAX_CONTENT_LENGTH'] = 64 * 1024 * 1024  # 64 MB upload limit

# Initialize backend services
data_manager = DataManager(BASE_DIR)
spark_processor = SparkWeatherProcessor(data_manager)
analytics_engine = AnalyticsEngine(data_manager)
ml_predictor = WeatherMLPredictor(data_manager)


# ==============================================================================
# PAGE ROUTES (WEB PAGES)
# ==============================================================================

@app.route('/')
def home():
    """Home Dashboard Page"""
    cities = data_manager.get_cities()
    date_range = data_manager.get_date_range()
    return render_template('index.html', active_page='home', cities=cities, date_range=date_range)


@app.route('/analytics')
def analytics():
    """Weather Data Analysis Page"""
    cities = data_manager.get_cities()
    conditions = data_manager.get_conditions()
    date_range = data_manager.get_date_range()
    return render_template('analytics.html', active_page='analytics', cities=cities, conditions=conditions, date_range=date_range)


@app.route('/bigdata')
def bigdata():
    """Big Data Processing (PySpark) Page"""
    filepath = data_manager.get_active_filepath()
    filename = os.path.basename(filepath)
    file_size_kb = round(os.path.getsize(filepath) / 1024, 1) if os.path.exists(filepath) else 0
    pyspark_available = spark_processor.pyspark_available
    return render_template(
        'bigdata.html', 
        active_page='bigdata', 
        filename=filename, 
        file_size_kb=file_size_kb,
        pyspark_available=pyspark_available
    )


@app.route('/prediction')
def prediction():
    """Weather Prediction & Insights Page"""
    cities = data_manager.get_cities()
    return render_template('prediction.html', active_page='prediction', cities=cities)


@app.route('/dataset')
def dataset():
    """Dataset Management Page"""
    cities = data_manager.get_cities()
    conditions = data_manager.get_conditions()
    date_range = data_manager.get_date_range()
    filepath = data_manager.get_active_filepath()
    filename = os.path.basename(filepath)
    return render_template(
        'dataset.html', 
        active_page='dataset', 
        cities=cities, 
        conditions=conditions, 
        date_range=date_range,
        active_filename=filename
    )


# ==============================================================================
# REST API ENDPOINTS
# ==============================================================================

@app.route('/api/metadata', methods=['GET'])
def api_metadata():
    """Returns general metadata: cities, conditions, date range."""
    return jsonify({
        "status": "success",
        "cities": data_manager.get_cities(),
        "conditions": data_manager.get_conditions(),
        "date_range": data_manager.get_date_range(),
        "active_file": os.path.basename(data_manager.get_active_filepath())
    })


@app.route('/api/kpis', methods=['GET'])
def api_kpis():
    """Returns dynamic KPI metrics for Dashboard cards."""
    city = request.args.get('city')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    kpis = analytics_engine.compute_kpis(city=city, start_date=start_date, end_date=end_date)
    return jsonify({"status": "success", "data": kpis})


@app.route('/api/charts/temperature-trends', methods=['GET'])
def api_temp_trends():
    city = request.args.get('city')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    trends = analytics_engine.get_temperature_trends(city=city, start_date=start_date, end_date=end_date)
    return jsonify({"status": "success", "data": trends})


@app.route('/api/charts/monthly-rainfall', methods=['GET'])
def api_monthly_rainfall():
    city = request.args.get('city')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    rain = analytics_engine.get_monthly_rainfall(city=city, start_date=start_date, end_date=end_date)
    return jsonify({"status": "success", "data": rain})


@app.route('/api/charts/humidity-distribution', methods=['GET'])
def api_humidity_dist():
    city = request.args.get('city')
    dist = analytics_engine.get_humidity_distribution(city=city)
    return jsonify({"status": "success", "data": dist})


@app.route('/api/charts/wind-speed', methods=['GET'])
def api_wind_speed():
    city = request.args.get('city')
    wind = analytics_engine.get_wind_speed_analysis(city=city)
    return jsonify({"status": "success", "data": wind})


@app.route('/api/charts/condition-distribution', methods=['GET'])
def api_condition_dist():
    city = request.args.get('city')
    cond = analytics_engine.get_condition_distribution(city=city)
    return jsonify({"status": "success", "data": cond})


@app.route('/api/charts/city-comparison', methods=['GET'])
def api_city_comparison():
    comp = analytics_engine.get_city_comparison()
    return jsonify({"status": "success", "data": comp})


@app.route('/api/bigdata/run', methods=['POST'])
def api_bigdata_run():
    """Triggers PySpark Big Data processing job."""
    req_data = request.get_json(silent=True) or {}
    num_partitions = int(req_data.get('partitions', 4))
    impute_strategy = req_data.get('impute_strategy', 'mean')

    result = spark_processor.run_bigdata_pipeline(
        num_partitions=num_partitions,
        impute_strategy=impute_strategy
    )
    return jsonify({"status": "success", "data": result})


@app.route('/api/prediction/forecast', methods=['GET'])
def api_prediction_forecast():
    """Generates ML trend forecast for temperature."""
    city = request.args.get('city', 'New York')
    days = int(request.args.get('days', 14))
    res = ml_predictor.predict_temperature_trend(city=city, forecast_days=days)
    return jsonify({"status": "success", "data": res})


@app.route('/api/prediction/extremes', methods=['GET'])
def api_prediction_extremes():
    """Returns detected extreme weather anomalies."""
    city = request.args.get('city')
    extremes = ml_predictor.detect_extreme_events(city=city)
    return jsonify({"status": "success", "data": extremes})


@app.route('/api/prediction/insights', methods=['GET'])
def api_prediction_insights():
    """Returns automated analytical insights summary."""
    city = request.args.get('city')
    insights = ml_predictor.generate_automated_insights(city=city)
    return jsonify({"status": "success", "data": insights})


@app.route('/api/dataset/records', methods=['GET'])
def api_dataset_records():
    """Returns paginated, searchable, filtered dataset records."""
    city = request.args.get('city')
    condition = request.args.get('condition')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    query = request.args.get('query')
    sort_by = request.args.get('sort_by', 'Date')
    sort_dir = request.args.get('sort_dir', 'desc')
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('page_size', 20))

    result = data_manager.get_paginated_records(
        city=city,
        condition=condition,
        start_date=start_date,
        end_date=end_date,
        search_query=query,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size
    )
    return jsonify({"status": "success", "data": result})


@app.route('/api/dataset/upload', methods=['POST'])
def api_dataset_upload():
    """Handles CSV file upload with schema validation."""
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded."}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No file selected."}), 400

    if not file.filename.lower().endswith('.csv'):
        return jsonify({"status": "error", "message": "Only CSV files are supported."}), 400

    filename = f"upload_{int(os.path.getmtime(data_manager.default_dataset_path))}_{file.filename}"
    upload_path = os.path.join(data_manager.uploads_dir, filename)
    file.save(upload_path)

    # Validate Schema
    is_valid, msg, headers = data_manager.validate_csv_schema(upload_path)
    if not is_valid:
        if os.path.exists(upload_path):
            os.remove(upload_path)
        return jsonify({"status": "error", "message": f"Validation Failed: {msg}"}), 400

    # Set as active dataset
    data_manager.set_active_dataset(upload_path)
    records = data_manager.load_dataset(force_reload=True)

    return jsonify({
        "status": "success",
        "message": f"Dataset uploaded and activated successfully! ({len(records)} records ingested)",
        "filename": filename,
        "total_records": len(records),
        "columns": headers
    })


@app.route('/api/dataset/reset', methods=['POST'])
def api_dataset_reset():
    """Resets active dataset to the default sample dataset."""
    data_manager.reset_to_default()
    records = data_manager.load_dataset(force_reload=True)
    return jsonify({
        "status": "success",
        "message": "Reset to default sample dataset successfully.",
        "total_records": len(records)
    })


@app.route('/api/dataset/clean', methods=['POST'])
def api_dataset_clean():
    """Triggers dataset cleaning and imputation."""
    clean_info = data_manager.clean_and_impute_dataset()
    return jsonify({"status": "success", "data": clean_info})


@app.route('/api/dataset/download', methods=['GET'])
def api_dataset_download():
    """Downloads active dataset or processed file."""
    file_type = request.args.get('type', 'active')
    if file_type == 'processed':
        # Return most recent processed file if exists
        files = [os.path.join(data_manager.processed_dir, f) for f in os.listdir(data_manager.processed_dir) if f.endswith('.csv')]
        if files:
            latest_file = max(files, key=os.path.getmtime)
            return send_file(latest_file, as_attachment=True, download_name=os.path.basename(latest_file))
            
    filepath = data_manager.get_active_filepath()
    return send_file(filepath, as_attachment=True, download_name=os.path.basename(filepath))


# ==============================================================================
# MAIN ENTRYPOINT
# ==============================================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 80)
    print("   WEATHER DATA ANALYTICS SYSTEM - BIG DATA PLATFORM   ")
    print(f"   Server running at: http://127.0.0.1:{port}/")
    print("=" * 80)
    app.run(host='0.0.0.0', port=port, debug=True)

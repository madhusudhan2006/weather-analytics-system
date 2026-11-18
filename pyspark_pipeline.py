"""
================================================================================
Weather Data Analytics System - Standalone Apache Spark (PySpark) Pipeline
================================================================================
Run directly via python:
    python pyspark_pipeline.py

Or submit to an Apache Spark Cluster:
    spark-submit --master local[*] --deploy-mode client pyspark_pipeline.py
================================================================================
"""

import sys
import os
import time

def run_spark_batch():
    print("=" * 80)
    print("      WEATHER DATA ANALYTICS SYSTEM - APACHE SPARK PIPELINE       ")
    print("=" * 80)

    try:
        from pyspark.sql import SparkSession
        from pyspark.sql import functions as F
        from pyspark.sql.types import StructType, StructField, StringType, DoubleType
        from pyspark.sql.window import Window
    except ImportError:
        print("[!] PySpark is not installed in current environment.")
        print("    Install via: pip install pyspark")
        print("    Ensure Java 8/11/17 is installed and JAVA_HOME is configured.")
        return

    # 1. Initialize SparkSession
    print("\n[*] Initializing Apache Spark Session (Local Cluster Mode)...")
    spark = SparkSession.builder \
        .appName("WeatherDataAnalyticsBatchPipeline") \
        .master("local[*]") \
        .config("spark.driver.memory", "2g") \
        .config("spark.sql.shuffle.partitions", "4") \
        .getOrCreate()

    spark.sparkContext.setLogLevel("WARN")
    print(f"[+] Spark Session Active! Version: {spark.version}")

    # Determine input dataset
    base_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(base_dir, "data", "weather_sample_dataset.csv")
    output_dir = os.path.join(base_dir, "data", "processed", "spark_output")

    if not os.path.exists(input_path):
        print(f"[!] Input file not found at: {input_path}")
        return

    print(f"[*] Reading dataset from: {input_path}")

    # 2. Define Explicit Schema
    schema = StructType([
        StructField("Date", StringType(), True),
        StructField("City", StringType(), True),
        StructField("Temperature", DoubleType(), True),
        StructField("Humidity", DoubleType(), True),
        StructField("Rainfall", DoubleType(), True),
        StructField("Wind_Speed", DoubleType(), True),
        StructField("Atmospheric_Pressure", DoubleType(), True),
        StructField("Weather_Condition", StringType(), True)
    ])

    start_time = time.time()

    # 3. Ingestion into Distributed DataFrame
    df = spark.read.option("header", "true").schema(schema).csv(input_path)
    total_records = df.count()
    print(f"[+] Total Ingested Records: {total_records}")
    print("[*] Inferred DataFrame Schema:")
    df.printSchema()

    # 4. Data Cleaning & Null Imputation
    print("\n[*] Cleaning Data & Handling Nulls...")
    dedup_df = df.dropDuplicates(["Date", "City"])
    cleaned_count = dedup_df.count()
    print(f"[+] Dropped {total_records - cleaned_count} duplicate records. Clean count: {cleaned_count}")

    # Compute column averages for imputation
    impute_dict = dedup_df.select([
        F.mean(c).alias(c) for c in ["Temperature", "Humidity", "Rainfall", "Wind_Speed", "Atmospheric_Pressure"]
    ]).first().asDict()
    
    cleaned_df = dedup_df.fillna(impute_dict)

    # 5. Partitioning by City
    partitioned_df = cleaned_df.repartition(4, "City")
    print(f"[+] Distributed DataFrame into {partitioned_df.rdd.getNumPartitions()} partitions.")

    # 6. City-Level PySpark Aggregations
    print("\n[*] Computing City-Level Aggregations (GroupBy & Aggregate)...")
    city_summary = partitioned_df.groupBy("City").agg(
        F.count("*").alias("Records"),
        F.round(F.avg("Temperature"), 2).alias("Avg_Temp_C"),
        F.round(F.max("Temperature"), 2).alias("Max_Temp_C"),
        F.round(F.min("Temperature"), 2).alias("Min_Temp_C"),
        F.round(F.avg("Humidity"), 2).alias("Avg_Humidity_Pct"),
        F.round(F.sum("Rainfall"), 2).alias("Total_Rainfall_mm"),
        F.round(F.avg("Wind_Speed"), 2).alias("Avg_Wind_kmh"),
        F.round(F.avg("Atmospheric_Pressure"), 2).alias("Avg_Pressure_hPa")
    ).orderBy("City")

    print("\n--- City Weather Summary (PySpark) ---")
    city_summary.show(truncate=False)

    # 7. Weather Condition Distribution
    print("\n[*] Computing Condition Distribution...")
    cond_summary = partitioned_df.groupBy("Weather_Condition").agg(
        F.count("*").alias("Occurrences"),
        F.round(F.avg("Temperature"), 2).alias("Mean_Temperature"),
        F.round(F.avg("Rainfall"), 2).alias("Mean_Rainfall")
    ).orderBy(F.desc("Occurrences"))
    cond_summary.show(truncate=False)

    # 8. Monthly Temporal Trends using Window Functions
    print("\n[*] Computing Monthly Rolling Averages...")
    monthly_df = partitioned_df.withColumn("YearMonth", F.substring("Date", 1, 7))
    monthly_agg = monthly_df.groupBy("YearMonth", "City").agg(
        F.round(F.avg("Temperature"), 2).alias("Monthly_Avg_Temp"),
        F.round(F.sum("Rainfall"), 2).alias("Monthly_Total_Rain")
    ).orderBy("YearMonth", "City")
    monthly_agg.show(15, truncate=False)

    # 9. Execution Plan (explain)
    print("\n[*] Catalyst Optimizer Execution Plan:")
    city_summary.explain(mode="simple")

    # 10. Write Aggregated Results to Disk
    os.makedirs(output_dir, exist_ok=True)
    out_csv = os.path.join(output_dir, "city_weather_summary.csv")
    print(f"\n[*] Exporting aggregated results to CSV: {out_csv}")
    city_summary.toPandas().to_csv(out_csv, index=False)

    elapsed = round(time.time() - start_time, 2)
    print("=" * 80)
    print(f"[✓] Big Data Processing Pipeline Completed Successfully in {elapsed} seconds!")
    print("=" * 80)

    spark.stop()

if __name__ == "__main__":
    run_spark_batch()

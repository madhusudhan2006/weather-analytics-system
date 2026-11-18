"""
Data Manager Module
Handles CSV dataset loading, validation, filtering, cleaning, pagination, and persistence.
Works with pure Python standard libraries with automatic enhancements when pandas is available.
"""

import os
import csv
import math
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional

REQUIRED_COLUMNS = [
    'Date', 'City', 'Temperature', 'Humidity', 
    'Rainfall', 'Wind_Speed', 'Atmospheric_Pressure', 'Weather_Condition'
]

NUMERIC_COLUMNS = ['Temperature', 'Humidity', 'Rainfall', 'Wind_Speed', 'Atmospheric_Pressure']

class DataManager:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        self.data_dir = os.path.join(base_dir, 'data')
        self.default_dataset_path = os.path.join(self.data_dir, 'weather_sample_dataset.csv')
        self.uploads_dir = os.path.join(self.data_dir, 'uploads')
        self.processed_dir = os.path.join(self.data_dir, 'processed')
        
        os.makedirs(self.uploads_dir, exist_ok=True)
        os.makedirs(self.processed_dir, exist_ok=True)
        
        self.active_file_path = self.default_dataset_path
        self._cached_records: Optional[List[Dict[str, Any]]] = None
        self._last_loaded_mtime: Optional[float] = None

    def get_active_filepath(self) -> str:
        if not os.path.exists(self.active_file_path):
            self.active_file_path = self.default_dataset_path
        return self.active_file_path

    def set_active_dataset(self, filepath: str) -> bool:
        if os.path.exists(filepath):
            self.active_file_path = filepath
            self._cached_records = None
            return True
        return False

    def reset_to_default(self) -> bool:
        self.active_file_path = self.default_dataset_path
        self._cached_records = None
        return True

    def validate_csv_schema(self, filepath: str) -> Tuple[bool, str, List[str]]:
        """Validate if the uploaded CSV contains required columns."""
        if not os.path.exists(filepath):
            return False, "File does not exist.", []
            
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.reader(f)
                header = next(reader, None)
                if not header:
                    return False, "CSV file is empty.", []
                
                # Normalize column names: strip spaces, match case-insensitively
                clean_headers = [h.strip() for h in header]
                header_map = {h.lower().replace(" ", "_"): h for h in clean_headers}
                
                missing = []
                for req in REQUIRED_COLUMNS:
                    req_key = req.lower().replace(" ", "_")
                    if req_key not in header_map and req not in clean_headers:
                        missing.append(req)
                        
                if missing:
                    return False, f"Missing required columns: {', '.join(missing)}", clean_headers
                return True, "Schema is valid.", clean_headers
        except Exception as e:
            return False, f"Error reading CSV header: {str(e)}", []

    def load_dataset(self, force_reload: bool = False) -> List[Dict[str, Any]]:
        """Load and cache the active dataset as parsed dictionaries with strongly typed values."""
        filepath = self.get_active_filepath()
        if not os.path.exists(filepath):
            return []

        mtime = os.path.getmtime(filepath)
        if not force_reload and self._cached_records is not None and self._last_loaded_mtime == mtime:
            return self._cached_records

        records = []
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            # Find matching field names for normalization
            headers = reader.fieldnames or []
            field_map = {}
            for h in headers:
                norm = h.strip().lower().replace(" ", "_")
                for req in REQUIRED_COLUMNS:
                    if norm == req.lower().replace(" ", "_"):
                        field_map[req] = h
                        break

            for idx, row in enumerate(reader):
                try:
                    date_val = str(row.get(field_map.get('Date', 'Date'), '')).strip()
                    city_val = str(row.get(field_map.get('City', 'City'), '')).strip()
                    
                    temp_raw = row.get(field_map.get('Temperature', 'Temperature'), '')
                    temp_val = float(temp_raw) if temp_raw not in (None, '', 'null', 'NaN') else None

                    hum_raw = row.get(field_map.get('Humidity', 'Humidity'), '')
                    hum_val = float(hum_raw) if hum_raw not in (None, '', 'null', 'NaN') else None

                    rain_raw = row.get(field_map.get('Rainfall', 'Rainfall'), '')
                    rain_val = float(rain_raw) if rain_raw not in (None, '', 'null', 'NaN') else None

                    wind_raw = row.get(field_map.get('Wind_Speed', 'Wind_Speed'), '')
                    wind_val = float(wind_raw) if wind_raw not in (None, '', 'null', 'NaN') else None

                    press_raw = row.get(field_map.get('Atmospheric_Pressure', 'Atmospheric_Pressure'), '')
                    press_val = float(press_raw) if press_raw not in (None, '', 'null', 'NaN') else None

                    cond_val = str(row.get(field_map.get('Weather_Condition', 'Weather_Condition'), 'Sunny')).strip()
                    if not cond_val:
                        cond_val = 'Unknown'

                    records.append({
                        'id': idx + 1,
                        'Date': date_val,
                        'City': city_val,
                        'Temperature': temp_val,
                        'Humidity': hum_val,
                        'Rainfall': rain_val,
                        'Wind_Speed': wind_val,
                        'Atmospheric_Pressure': press_val,
                        'Weather_Condition': cond_val
                    })
                except Exception:
                    # Skip or gracefully tolerate individual corrupt rows
                    continue

        self._cached_records = records
        self._last_loaded_mtime = mtime
        return self._cached_records

    def get_cities(self) -> List[str]:
        records = self.load_dataset()
        cities = sorted(list(set(r['City'] for r in records if r.get('City'))))
        return cities

    def get_conditions(self) -> List[str]:
        records = self.load_dataset()
        conditions = sorted(list(set(r['Weather_Condition'] for r in records if r.get('Weather_Condition'))))
        return conditions

    def get_date_range(self) -> Dict[str, str]:
        records = self.load_dataset()
        dates = [r['Date'] for r in records if r.get('Date')]
        if not dates:
            return {'min_date': '2024-01-01', 'max_date': '2025-12-31'}
        return {'min_date': min(dates), 'max_date': max(dates)}

    def filter_records(
        self,
        city: Optional[str] = None,
        condition: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Filter dataset records based on criteria."""
        records = self.load_dataset()
        filtered = []

        query = (search_query or '').strip().lower()

        for r in records:
            if city and city.lower() != 'all' and r['City'].lower() != city.lower():
                continue
            if condition and condition.lower() != 'all' and r['Weather_Condition'].lower() != condition.lower():
                continue
            if start_date and r['Date'] < start_date:
                continue
            if end_date and r['Date'] > end_date:
                continue
            if query:
                text_match = (
                    query in r['City'].lower() or
                    query in r['Weather_Condition'].lower() or
                    query in r['Date'].lower()
                )
                if not text_match:
                    continue

            filtered.append(r)

        return filtered

    def get_paginated_records(
        self,
        city: Optional[str] = None,
        condition: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        search_query: Optional[str] = None,
        sort_by: str = 'Date',
        sort_dir: str = 'desc',
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """Return paginated, sorted records with total counts."""
        filtered = self.filter_records(city, condition, start_date, end_date, search_query)
        
        # Sort
        reverse = (sort_dir.lower() == 'desc')
        def sort_key(row):
            val = row.get(sort_by)
            if val is None:
                return -float('inf') if reverse else float('inf')
            return val

        filtered.sort(key=sort_key, reverse=reverse)

        total_records = len(filtered)
        total_pages = math.ceil(total_records / page_size) if total_records > 0 else 1
        page = max(1, min(page, total_pages))

        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_records = filtered[start_idx:end_idx]

        return {
            'records': page_records,
            'total_records': total_records,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages
        }

    def clean_and_impute_dataset(self, impute_strategy: str = 'mean', remove_duplicates: bool = True) -> Dict[str, Any]:
        """Perform data cleaning, duplicate removal, and missing value imputation."""
        records = self.load_dataset(force_reload=True)
        initial_count = len(records)
        duplicates_removed = 0

        # Remove duplicates based on Date + City
        seen_keys = set()
        deduped = []
        for r in records:
            key = (r['Date'], r['City'])
            if remove_duplicates:
                if key in seen_keys:
                    duplicates_removed += 1
                    continue
                seen_keys.add(key)
            deduped.append(r)

        # Impute missing numeric values
        # Calculate column means
        means = {}
        for col in NUMERIC_COLUMNS:
            vals = [r[col] for r in deduped if r[col] is not None]
            means[col] = sum(vals) / len(vals) if vals else 0.0

        missing_imputed = 0
        cleaned_records = []
        for r in deduped:
            new_r = dict(r)
            for col in NUMERIC_COLUMNS:
                if new_r[col] is None:
                    new_r[col] = round(means[col], 1)
                    missing_imputed += 1
            cleaned_records.append(new_r)

        # Save to processed folder
        output_filename = f"cleaned_weather_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        output_path = os.path.join(self.processed_dir, output_filename)
        
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            fieldnames = REQUIRED_COLUMNS
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for r in cleaned_records:
                row_dict = {col: r[col] for col in fieldnames}
                writer.writerow(row_dict)

        self._cached_records = cleaned_records
        return {
            'initial_count': initial_count,
            'final_count': len(cleaned_records),
            'duplicates_removed': duplicates_removed,
            'missing_imputed': missing_imputed,
            'output_file': output_filename,
            'output_path': output_path
        }

"""
Analytics Engine Module
Computes live analytical metrics, time series trends, distribution statistics,
correlation analysis, and comparative summaries dynamically from dataset records.
"""

import math
from datetime import datetime
from typing import Dict, Any, List, Optional
from collections import defaultdict

class AnalyticsEngine:
    def __init__(self, data_manager):
        self.dm = data_manager

    def compute_kpis(self, city: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """Compute real-time summary KPIs for Dashboard cards."""
        records = self.dm.filter_records(city=city, start_date=start_date, end_date=end_date)
        total_records = len(records)
        
        if total_records == 0:
            return {
                "total_records": 0,
                "avg_temperature": 0.0,
                "max_temperature": 0.0,
                "min_temperature": 0.0,
                "avg_humidity": 0.0,
                "total_rainfall": 0.0,
                "avg_wind_speed": 0.0,
                "avg_pressure": 0.0,
                "primary_condition": "N/A",
                "condition_breakdown": {}
            }

        temps = [r['Temperature'] for r in records if r['Temperature'] is not None]
        hums = [r['Humidity'] for r in records if r['Humidity'] is not None]
        rains = [r['Rainfall'] for r in records if r['Rainfall'] is not None]
        winds = [r['Wind_Speed'] for r in records if r['Wind_Speed'] is not None]
        press = [r['Atmospheric_Pressure'] for r in records if r['Atmospheric_Pressure'] is not None]

        cond_counts = defaultdict(int)
        for r in records:
            cond = r['Weather_Condition'] or 'Unknown'
            cond_counts[cond] += 1

        primary_condition = max(cond_counts.items(), key=lambda x: x[1])[0] if cond_counts else "Sunny"

        return {
            "total_records": total_records,
            "avg_temperature": round(sum(temps) / len(temps), 1) if temps else 0.0,
            "max_temperature": round(max(temps), 1) if temps else 0.0,
            "min_temperature": round(min(temps), 1) if temps else 0.0,
            "avg_humidity": round(sum(hums) / len(hums), 1) if hums else 0.0,
            "total_rainfall": round(sum(rains), 1) if rains else 0.0,
            "avg_wind_speed": round(sum(winds) / len(winds), 1) if winds else 0.0,
            "avg_pressure": round(sum(press) / len(press), 1) if press else 0.0,
            "primary_condition": primary_condition,
            "condition_breakdown": dict(cond_counts)
        }

    def get_temperature_trends(self, city: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """Aggregate temperature over time (monthly and 14-day rolling window)."""
        records = self.dm.filter_records(city=city, start_date=start_date, end_date=end_date)
        
        # Sort chronologically
        records.sort(key=lambda x: x['Date'])

        # Monthly aggregation: YYYY-MM -> list of temps
        monthly_data = defaultdict(list)
        for r in records:
            if r['Temperature'] is not None and r['Date']:
                ym = r['Date'][:7]  # YYYY-MM
                monthly_data[ym].append(r['Temperature'])

        labels = sorted(monthly_data.keys())
        avg_temps = [round(sum(monthly_data[m]) / len(monthly_data[m]), 1) for m in labels]
        max_temps = [round(max(monthly_data[m]), 1) for m in labels]
        min_temps = [round(min(monthly_data[m]), 1) for m in labels]

        # Recent daily trend sample (up to 30 latest dates)
        daily_sample = {}
        for r in records[-60:]:
            d = r['Date']
            if d not in daily_sample and r['Temperature'] is not None:
                daily_sample[d] = r['Temperature']

        daily_labels = sorted(daily_sample.keys())[-30:]
        daily_vals = [daily_sample[d] for d in daily_labels]

        return {
            "monthly": {
                "labels": labels,
                "avg_temperatures": avg_temps,
                "max_temperatures": max_temps,
                "min_temperatures": min_temps
            },
            "recent_daily": {
                "labels": daily_labels,
                "values": daily_vals
            }
        }

    def get_monthly_rainfall(self, city: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """Calculates monthly total and average rainfall."""
        records = self.dm.filter_records(city=city, start_date=start_date, end_date=end_date)
        monthly_rain = defaultdict(list)

        for r in records:
            if r['Rainfall'] is not None and r['Date']:
                ym = r['Date'][:7]
                monthly_rain[ym].append(r['Rainfall'])

        labels = sorted(monthly_rain.keys())
        total_rainfall = [round(sum(monthly_rain[m]), 1) for m in labels]
        avg_rainfall = [round(sum(monthly_rain[m]) / len(monthly_rain[m]), 1) for m in labels]
        rainy_days = [sum(1 for val in monthly_rain[m] if val > 0.5) for m in labels]

        return {
            "labels": labels,
            "total_rainfall": total_rainfall,
            "avg_rainfall": avg_rainfall,
            "rainy_days": rainy_days
        }

    def get_humidity_distribution(self, city: Optional[str] = None) -> Dict[str, Any]:
        """Bin humidity into ranges: 0-20, 21-40, 41-60, 61-80, 81-100."""
        records = self.dm.filter_records(city=city)
        bins = {
            "Very Low (<30%)": 0,
            "Moderate (30-50%)": 0,
            "Optimal (51-70%)": 0,
            "High (71-85%)": 0,
            "Very High (>85%)": 0
        }

        hums = [r['Humidity'] for r in records if r['Humidity'] is not None]
        for h in hums:
            if h < 30:
                bins["Very Low (<30%)"] += 1
            elif h <= 50:
                bins["Moderate (30-50%)"] += 1
            elif h <= 70:
                bins["Optimal (51-70%)"] += 1
            elif h <= 85:
                bins["High (71-85%)"] += 1
            else:
                bins["Very High (>85%)"] += 1

        return {
            "labels": list(bins.keys()),
            "counts": list(bins.values()),
            "total_samples": len(hums)
        }

    def get_wind_speed_analysis(self, city: Optional[str] = None) -> Dict[str, Any]:
        """Analyzes wind speed categories based on Beaufort-scale inspired brackets."""
        records = self.dm.filter_records(city=city)
        brackets = {
            "Calm (<10 km/h)": 0,
            "Light Breeze (10-25 km/h)": 0,
            "Moderate Wind (26-40 km/h)": 0,
            "Strong Breeze (41-60 km/h)": 0,
            "Gale/Storm (>60 km/h)": 0
        }

        winds = [r['Wind_Speed'] for r in records if r['Wind_Speed'] is not None]
        for w in winds:
            if w < 10:
                brackets["Calm (<10 km/h)"] += 1
            elif w <= 25:
                brackets["Light Breeze (10-25 km/h)"] += 1
            elif w <= 40:
                brackets["Moderate Wind (26-40 km/h)"] += 1
            elif w <= 60:
                brackets["Strong Breeze (41-60 km/h)"] += 1
            else:
                brackets["Gale/Storm (>60 km/h)"] += 1

        return {
            "labels": list(brackets.keys()),
            "counts": list(brackets.values()),
            "avg_wind": round(sum(winds) / len(winds), 1) if winds else 0.0,
            "max_wind": round(max(winds), 1) if winds else 0.0
        }

    def get_condition_distribution(self, city: Optional[str] = None) -> Dict[str, Any]:
        """Calculates weather condition occurrences and percentage share."""
        records = self.dm.filter_records(city=city)
        cond_counts = defaultdict(int)
        for r in records:
            cond = r['Weather_Condition'] or 'Unknown'
            cond_counts[cond] += 1

        # Sorted by count desc
        sorted_pairs = sorted(cond_counts.items(), key=lambda x: x[1], reverse=True)
        labels = [item[0] for item in sorted_pairs]
        counts = [item[1] for item in sorted_pairs]
        total = sum(counts)
        percentages = [round((c / total * 100), 1) if total > 0 else 0.0 for c in counts]

        return {
            "labels": labels,
            "counts": counts,
            "percentages": percentages,
            "total": total
        }

    def get_city_comparison(self) -> Dict[str, Any]:
        """Multi-city comparative analysis across all core weather indicators."""
        records = self.dm.load_dataset()
        cities = sorted(list(set(r['City'] for r in records if r.get('City'))))

        city_data = {c: {'temps': [], 'hums': [], 'rains': [], 'winds': [], 'press': []} for c in cities}
        for r in records:
            c = r['City']
            if c in city_data:
                if r['Temperature'] is not None: city_data[c]['temps'].append(r['Temperature'])
                if r['Humidity'] is not None: city_data[c]['hums'].append(r['Humidity'])
                if r['Rainfall'] is not None: city_data[c]['rains'].append(r['Rainfall'])
                if r['Wind_Speed'] is not None: city_data[c]['winds'].append(r['Wind_Speed'])
                if r['Atmospheric_Pressure'] is not None: city_data[c]['press'].append(r['Atmospheric_Pressure'])

        comparison = []
        for c in cities:
            d = city_data[c]
            n = len(d['temps']) or 1
            comparison.append({
                "city": c,
                "avg_temp": round(sum(d['temps']) / len(d['temps']), 1) if d['temps'] else 0.0,
                "max_temp": round(max(d['temps']), 1) if d['temps'] else 0.0,
                "min_temp": round(min(d['temps']), 1) if d['temps'] else 0.0,
                "avg_humidity": round(sum(d['hums']) / len(d['hums']), 1) if d['hums'] else 0.0,
                "total_rainfall": round(sum(d['rains']), 1) if d['rains'] else 0.0,
                "avg_wind": round(sum(d['winds']) / len(d['winds']), 1) if d['winds'] else 0.0,
                "avg_pressure": round(sum(d['press']) / len(d['press']), 1) if d['press'] else 0.0
            })

        return {
            "cities": cities,
            "metrics": comparison
        }

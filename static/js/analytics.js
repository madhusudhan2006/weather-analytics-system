/**
 * Weather Data Analytics Controller - SkyAnalytics
 * Manages 6 analytical charts with live filtering by city and date range
 */

document.addEventListener('DOMContentLoaded', () => {
    let chartTemp = null;
    let chartCond = null;
    let chartRain = null;
    let chartHum = null;
    let chartWind = null;
    let chartCity = null;

    const cityInput = document.getElementById('analyticsCity');
    const startDateInput = document.getElementById('analyticsStartDate');
    const endDateInput = document.getElementById('analyticsEndDate');
    const applyBtn = document.getElementById('btnApplyAnalyticsFilter');
    const resetBtn = document.getElementById('btnResetAnalyticsFilter');

    function getFilterParams() {
        const city = cityInput ? cityInput.value : 'all';
        const start = startDateInput ? startDateInput.value : '';
        const end = endDateInput ? endDateInput.value : '';
        return `city=${encodeURIComponent(city)}&start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`;
    }

    // 1. Temperature Trends Over Time
    async function renderTempTrends() {
        try {
            const res = await fetch(`/api/charts/temperature-trends?${getFilterParams()}`);
            const json = await res.json();
            if (json.status === 'success') {
                const m = json.data.monthly;
                const ctx = document.getElementById('chartTempTrends');
                if (!ctx) return;
                if (chartTemp) chartTemp.destroy();

                chartTemp = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: m.labels,
                        datasets: [
                            {
                                label: 'Monthly Mean (°C)',
                                data: m.avg_temperatures,
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                                fill: true,
                                tension: 0.35,
                                borderWidth: 3
                            },
                            {
                                label: 'Peak Maximum (°C)',
                                data: m.max_temperatures,
                                borderColor: '#ef4444',
                                borderWidth: 2,
                                borderDash: [4, 4],
                                fill: false
                            },
                            {
                                label: 'Trough Minimum (°C)',
                                data: m.min_temperatures,
                                borderColor: '#06b6d4',
                                borderWidth: 2,
                                borderDash: [4, 4],
                                fill: false
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' } },
                        scales: { y: { title: { display: true, text: 'Temperature (°C)' } } }
                    }
                });
            }
        } catch (err) {
            console.error('Error in temp trends:', err);
        }
    }

    // 2. Weather Condition Distribution
    async function renderConditionDistribution() {
        try {
            const city = cityInput ? cityInput.value : 'all';
            const res = await fetch(`/api/charts/condition-distribution?city=${encodeURIComponent(city)}`);
            const json = await res.json();
            if (json.status === 'success') {
                const d = json.data;
                const ctx = document.getElementById('chartConditionDist');
                if (!ctx) return;
                if (chartCond) chartCond.destroy();

                const colors = ['#f59e0b', '#38bdf8', '#94a3b8', '#ef4444', '#a855f7', '#64748b', '#10b981', '#cbd5e1'];

                chartCond = new Chart(ctx, {
                    type: 'polarArea',
                    data: {
                        labels: d.labels,
                        datasets: [{
                            data: d.counts,
                            backgroundColor: colors.slice(0, d.labels.length).map(c => c + 'cc')
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 10, padding: 8 } }
                        },
                        scales: {
                            r: { grid: { color: 'rgba(255, 255, 255, 0.08)' }, ticks: { display: false } }
                        }
                    }
                });
            }
        } catch (err) {
            console.error('Error in condition dist:', err);
        }
    }

    // 3. Monthly Rainfall Analysis (Dual Axis Bar + Line)
    async function renderMonthlyRainfall() {
        try {
            const res = await fetch(`/api/charts/monthly-rainfall?${getFilterParams()}`);
            const json = await res.json();
            if (json.status === 'success') {
                const d = json.data;
                const ctx = document.getElementById('chartMonthlyRainfall');
                if (!ctx) return;
                if (chartRain) chartRain.destroy();

                chartRain = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: d.labels,
                        datasets: [
                            {
                                label: 'Total Rainfall (mm)',
                                data: d.total_rainfall,
                                backgroundColor: 'rgba(56, 189, 248, 0.7)',
                                borderColor: '#38bdf8',
                                borderWidth: 1,
                                yAxisID: 'y'
                            },
                            {
                                label: 'Rainy Days Count',
                                data: d.rainy_days,
                                type: 'line',
                                borderColor: '#f59e0b',
                                backgroundColor: '#f59e0b',
                                borderWidth: 2,
                                pointRadius: 3,
                                yAxisID: 'y1'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' } },
                        scales: {
                            y: { type: 'linear', position: 'left', title: { display: true, text: 'Rainfall (mm)' } },
                            y1: {
                                type: 'linear',
                                position: 'right',
                                grid: { drawOnChartArea: false },
                                title: { display: true, text: 'Rainy Days' }
                            }
                        }
                    }
                });
            }
        } catch (err) {
            console.error('Error in monthly rainfall:', err);
        }
    }

    // 4. Humidity Distribution
    async function renderHumidityDistribution() {
        try {
            const city = cityInput ? cityInput.value : 'all';
            const res = await fetch(`/api/charts/humidity-distribution?city=${encodeURIComponent(city)}`);
            const json = await res.json();
            if (json.status === 'success') {
                const d = json.data;
                const ctx = document.getElementById('chartHumidityDist');
                if (!ctx) return;
                if (chartHum) chartHum.destroy();

                chartHum = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: d.labels,
                        datasets: [{
                            label: 'Observations Count',
                            data: d.counts,
                            backgroundColor: [
                                'rgba(239, 68, 68, 0.75)',
                                'rgba(245, 158, 11, 0.75)',
                                'rgba(16, 185, 129, 0.75)',
                                'rgba(59, 130, 246, 0.75)',
                                'rgba(168, 85, 247, 0.75)'
                            ],
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { title: { display: true, text: 'Frequency' } },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }
        } catch (err) {
            console.error('Error in humidity dist:', err);
        }
    }

    // 5. Wind Speed Analysis (Horizontal Bars)
    async function renderWindSpeed() {
        try {
            const city = cityInput ? cityInput.value : 'all';
            const res = await fetch(`/api/charts/wind-speed?city=${encodeURIComponent(city)}`);
            const json = await res.json();
            if (json.status === 'success') {
                const d = json.data;
                const ctx = document.getElementById('chartWindSpeed');
                if (!ctx) return;
                if (chartWind) chartWind.destroy();

                chartWind = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: d.labels,
                        datasets: [{
                            label: 'Observed Days',
                            data: d.counts,
                            backgroundColor: 'rgba(249, 115, 22, 0.75)',
                            borderColor: '#f97316',
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { title: { display: true, text: 'Day Count' } }
                        }
                    }
                });
            }
        } catch (err) {
            console.error('Error in wind speed:', err);
        }
    }

    // 6. City-Wise Weather Comparison
    async function renderCityComparison() {
        try {
            const res = await fetch('/api/charts/city-comparison');
            const json = await res.json();
            if (json.status === 'success') {
                const metrics = json.data.metrics;
                const cities = json.data.cities;
                const ctx = document.getElementById('chartCityComparison');
                if (!ctx) return;
                if (chartCity) chartCity.destroy();

                const avgTemps = metrics.map(m => m.avg_temp);
                const avgHums = metrics.map(m => m.avg_humidity);
                const avgWinds = metrics.map(m => m.avg_wind);

                chartCity = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: cities,
                        datasets: [
                            {
                                label: 'Avg Temp (°C)',
                                data: avgTemps,
                                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                borderRadius: 4
                            },
                            {
                                label: 'Avg Humidity (%)',
                                data: avgHums,
                                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                                borderRadius: 4
                            },
                            {
                                label: 'Avg Wind (km/h)',
                                data: avgWinds,
                                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                borderRadius: 4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' } },
                        scales: {
                            y: { title: { display: true, text: 'Metric Value' } },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }
        } catch (err) {
            console.error('Error in city comparison:', err);
        }
    }

    function refreshAllAnalytics() {
        renderTempTrends();
        renderConditionDistribution();
        renderMonthlyRainfall();
        renderHumidityDistribution();
        renderWindSpeed();
        renderCityComparison();
    }

    // Event Listeners
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            refreshAllAnalytics();
            showToast('Analytics filters applied successfully!');
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (cityInput) cityInput.value = 'all';
            refreshAllAnalytics();
            showToast('Analytics filters reset.');
        });
    }

    // Initial Execution
    refreshAllAnalytics();
});

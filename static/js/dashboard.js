/**
 * Dashboard Controller - SkyAnalytics
 * Fetches dynamic dataset calculations and renders interactive Chart.js visualizations
 */

document.addEventListener('DOMContentLoaded', () => {
    let tempChartInstance = null;
    let conditionChartInstance = null;
    let rainChartInstance = null;

    let tempTrendData = null;
    let currentTempMode = 'monthly';

    const citySelect = document.getElementById('dashboardCitySelect');
    const refreshBtn = document.getElementById('btnRefreshDashboard');
    const btnMonthly = document.getElementById('btnTempMonthly');
    const btnDaily = document.getElementById('btnTempDaily');

    // Chart.js Default Dark Theme Configuration
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

    function getSelectedCity() {
        return citySelect ? citySelect.value : 'all';
    }

    // 1. Fetch Dynamic KPIs
    async function loadKPIs() {
        try {
            const city = getSelectedCity();
            const res = await fetch(`/api/kpis?city=${encodeURIComponent(city)}`);
            const json = await res.json();
            if (json.status === 'success') {
                const d = json.data;
                document.getElementById('kpiTotalRecords').innerText = d.total_records.toLocaleString();
                document.getElementById('kpiAvgTemp').innerText = formatNum(d.avg_temperature);
                document.getElementById('kpiMaxTemp').innerText = formatNum(d.max_temperature);
                document.getElementById('kpiMinTemp').innerText = formatNum(d.min_temperature);
                document.getElementById('kpiAvgHumidity').innerText = formatNum(d.avg_humidity);
                document.getElementById('kpiTotalRainfall').innerText = formatNum(d.total_rainfall);
                document.getElementById('kpiAvgWind').innerText = formatNum(d.avg_wind_speed);
                document.getElementById('kpiPrimaryCond').innerText = d.primary_condition;
            }
        } catch (err) {
            console.error('Error loading KPIs:', err);
        }
    }

    // 2. Fetch & Render Temperature Trends
    async function loadTemperatureTrends() {
        try {
            const city = getSelectedCity();
            const res = await fetch(`/api/charts/temperature-trends?city=${encodeURIComponent(city)}`);
            const json = await res.json();
            if (json.status === 'success') {
                tempTrendData = json.data;
                renderTempChart();
            }
        } catch (err) {
            console.error('Error loading temp trends:', err);
        }
    }

    function renderTempChart() {
        if (!tempTrendData) return;
        const ctx = document.getElementById('dashboardTempChart');
        if (!ctx) return;

        if (tempChartInstance) {
            tempChartInstance.destroy();
        }

        if (currentTempMode === 'monthly') {
            const m = tempTrendData.monthly;
            tempChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: m.labels,
                    datasets: [
                        {
                            label: 'Average Temp (°C)',
                            data: m.avg_temperatures,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            fill: true,
                            tension: 0.35,
                            borderWidth: 3,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Max Peak (°C)',
                            data: m.max_temperatures,
                            borderColor: '#ef4444',
                            borderDash: [5, 5],
                            borderWidth: 2,
                            pointRadius: 2,
                            fill: false
                        },
                        {
                            label: 'Min Valley (°C)',
                            data: m.min_temperatures,
                            borderColor: '#06b6d4',
                            borderDash: [5, 5],
                            borderWidth: 2,
                            pointRadius: 2,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top', labels: { boxWidth: 12 } },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        y: { title: { display: true, text: 'Temperature (°C)' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        } else {
            const d = tempTrendData.recent_daily;
            tempChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: d.labels,
                    datasets: [{
                        label: 'Daily Temperature (°C)',
                        data: d.values,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2,
                        pointRadius: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        y: { title: { display: true, text: 'Temperature (°C)' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    }

    // 3. Fetch & Render Weather Condition Doughnut
    async function loadConditionChart() {
        try {
            const city = getSelectedCity();
            const res = await fetch(`/api/charts/condition-distribution?city=${encodeURIComponent(city)}`);
            const json = await res.json();
            if (json.status === 'success') {
                const d = json.data;
                const ctx = document.getElementById('dashboardConditionChart');
                if (!ctx) return;

                if (conditionChartInstance) {
                    conditionChartInstance.destroy();
                }

                const palette = [
                    '#f59e0b', '#38bdf8', '#94a3b8', '#ef4444', 
                    '#a855f7', '#64748b', '#10b981', '#cbd5e1'
                ];

                conditionChartInstance = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: d.labels,
                        datasets: [{
                            data: d.counts,
                            backgroundColor: palette.slice(0, d.labels.length),
                            borderWidth: 2,
                            borderColor: '#152445'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12 } },
                            tooltip: {
                                callbacks: {
                                    label: function(item) {
                                        const count = item.parsed;
                                        const pct = d.percentages[item.dataIndex];
                                        return ` ${item.label}: ${count} records (${pct}%)`;
                                    }
                                }
                            }
                        },
                        cutout: '65%'
                    }
                });
            }
        } catch (err) {
            console.error('Error loading condition distribution:', err);
        }
    }

    // 4. Fetch & Render Monthly Rainfall Bar Chart
    async function loadRainfallChart() {
        try {
            const city = getSelectedCity();
            const res = await fetch(`/api/charts/monthly-rainfall?city=${encodeURIComponent(city)}`);
            const json = await res.json();
            if (json.status === 'success') {
                const d = json.data;
                const ctx = document.getElementById('dashboardRainChart');
                if (!ctx) return;

                if (rainChartInstance) {
                    rainChartInstance.destroy();
                }

                rainChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: d.labels,
                        datasets: [
                            {
                                label: 'Total Rainfall (mm)',
                                data: d.total_rainfall,
                                backgroundColor: 'rgba(56, 189, 248, 0.75)',
                                borderColor: '#38bdf8',
                                borderWidth: 1,
                                borderRadius: 4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { mode: 'index', intersect: false }
                        },
                        scales: {
                            y: { title: { display: true, text: 'Rainfall (mm)' } },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }
        } catch (err) {
            console.error('Error loading rainfall:', err);
        }
    }

    // Refresh All Components
    function refreshDashboard() {
        loadKPIs();
        loadTemperatureTrends();
        loadConditionChart();
        loadRainfallChart();
    }

    // Event Listeners
    if (citySelect) {
        citySelect.addEventListener('change', () => {
            refreshDashboard();
            showToast(`Dashboard updated for: ${citySelect.options[citySelect.selectedIndex].text}`);
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshDashboard();
            showToast('Dashboard statistics refreshed!');
        });
    }

    if (btnMonthly && btnDaily) {
        btnMonthly.addEventListener('click', () => {
            currentTempMode = 'monthly';
            btnMonthly.classList.add('active');
            btnDaily.classList.remove('active');
            renderTempChart();
        });
        btnDaily.addEventListener('click', () => {
            currentTempMode = 'daily';
            btnDaily.classList.add('active');
            btnMonthly.classList.remove('active');
            renderTempChart();
        });
    }

    // Initial Load
    refreshDashboard();
});

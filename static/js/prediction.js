/**
 * Weather Prediction & Predictive Insights Controller - SkyAnalytics
 * Renders ML temperature forecast curves, automated analytical insights,
 * and statistical extreme anomaly tables.
 */

document.addEventListener('DOMContentLoaded', () => {
    let forecastChart = null;

    const citySelect = document.getElementById('predCitySelect');
    const daysSelect = document.getElementById('predDaysSelect');
    const runBtn = document.getElementById('btnRunPrediction');

    const metricR2 = document.getElementById('metricR2');
    const metricMAE = document.getElementById('metricMAE');
    const metricRMSE = document.getElementById('metricRMSE');
    const insightsContainer = document.getElementById('insightsContainer');

    // 1. Fetch & Render ML Forecast Curve
    async function loadForecast() {
        const city = citySelect ? citySelect.value : 'New York';
        const days = daysSelect ? daysSelect.value : '14';

        try {
            const res = await fetch(`/api/prediction/forecast?city=${encodeURIComponent(city)}&days=${days}`);
            const json = await res.json();
            if (json.status === 'success') {
                const d = json.data;
                if (d.error) {
                    showToast(d.error, false);
                    return;
                }

                // Update Metrics
                if (metricR2) metricR2.innerText = d.metrics.r2_score;
                if (metricMAE) metricMAE.innerText = d.metrics.mae;
                if (metricRMSE) metricRMSE.innerText = d.metrics.rmse;

                // Render Combined Chart
                renderForecastChart(d);
            }
        } catch (err) {
            console.error('Error loading forecast:', err);
        }
    }

    function renderForecastChart(d) {
        const ctx = document.getElementById('chartForecast');
        if (!ctx) return;
        if (forecastChart) forecastChart.destroy();

        // Concatenate labels: Historical + Future
        const histDates = d.historical.dates;
        const futureDates = d.forecast.dates;
        const allLabels = histDates.concat(futureDates);

        // Actual series (padded with nulls for future)
        const actualSeries = d.historical.actual.concat(new Array(futureDates.length).fill(null));

        // Fitted series for historical
        const fittedSeries = d.historical.fitted.concat(new Array(futureDates.length).fill(null));

        // Forecast series (padded with nulls for historical except bridge point)
        const lastFitted = d.historical.fitted[d.historical.fitted.length - 1];
        const forecastSeries = new Array(histDates.length - 1).fill(null);
        forecastSeries.push(lastFitted); // bridge
        const fullForecastSeries = forecastSeries.concat(d.forecast.predictions);

        // Upper Bound series
        const upperSeries = new Array(histDates.length - 1).fill(null);
        upperSeries.push(lastFitted);
        const fullUpper = upperSeries.concat(d.forecast.upper_bound);

        // Lower Bound series
        const lowerSeries = new Array(histDates.length - 1).fill(null);
        lowerSeries.push(lastFitted);
        const fullLower = lowerSeries.concat(d.forecast.lower_bound);

        forecastChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: allLabels,
                datasets: [
                    {
                        label: 'Historical Actual (°C)',
                        data: actualSeries,
                        borderColor: 'rgba(148, 163, 184, 0.6)',
                        backgroundColor: 'rgba(148, 163, 184, 0.4)',
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        showLine: false
                    },
                    {
                        label: 'ML Seasonal Fitted Model',
                        data: fittedSeries,
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.3
                    },
                    {
                        label: 'Projected ML Forecast',
                        data: fullForecastSeries,
                        borderColor: '#f97316',
                        borderWidth: 3,
                        borderDash: [5, 5],
                        pointRadius: 4,
                        pointBackgroundColor: '#f97316',
                        fill: false,
                        tension: 0.3
                    },
                    {
                        label: 'Confidence Interval (95% Upper)',
                        data: fullUpper,
                        borderColor: 'rgba(249, 115, 22, 0.25)',
                        borderWidth: 1,
                        pointRadius: 0,
                        fill: '+1',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        tension: 0.3
                    },
                    {
                        label: 'Confidence Interval (95% Lower)',
                        data: fullLower,
                        borderColor: 'rgba(249, 115, 22, 0.25)',
                        borderWidth: 1,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.3
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
                    x: {
                        ticks: { maxTicksLimit: 14 },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // 2. Fetch & Render Automated Insights
    async function loadInsights() {
        const city = citySelect ? citySelect.value : 'New York';
        try {
            const res = await fetch(`/api/prediction/insights?city=${encodeURIComponent(city)}`);
            const json = await res.json();
            if (json.status === 'success' && insightsContainer) {
                insightsContainer.innerHTML = '';
                json.data.forEach(item => {
                    const col = document.createElement('div');
                    col.className = 'col-12 col-md-6';
                    col.innerHTML = `
                        <div class="analytics-card h-100 p-3" style="border-left: 4px solid var(--bs-${item.color});">
                            <div class="d-flex align-items-center gap-2 mb-2">
                                <i class="bi ${item.icon} text-${item.color} fs-5"></i>
                                <h6 class="fw-bold text-white mb-0">${item.title}</h6>
                                <span class="badge bg-${item.color} bg-opacity-25 text-${item.color} ms-auto">${item.category}</span>
                            </div>
                            <p class="text-secondary small mb-0 lh-base">${item.text}</p>
                        </div>
                    `;
                    insightsContainer.appendChild(col);
                });
            }
        } catch (err) {
            console.error('Error loading insights:', err);
        }
    }

    // 3. Fetch & Render Extreme Anomalies
    async function loadExtremes() {
        const city = citySelect ? citySelect.value : 'New York';
        try {
            const res = await fetch(`/api/prediction/extremes?city=${encodeURIComponent(city)}`);
            const json = await res.json();
            if (json.status === 'success') {
                const d = json.data;

                // Update thresholds
                document.getElementById('threshHeat').innerText = d.thresholds.heatwave_temp_c;
                document.getElementById('threshCold').innerText = d.thresholds.cold_spell_temp_c;
                document.getElementById('threshRain').innerText = d.thresholds.heavy_rain_mm;

                // Populate Heatwave Table
                const heatBody = document.getElementById('tableHeatBody');
                if (heatBody) {
                    heatBody.innerHTML = d.heatwaves.length ? '' : '<tr><td colspan="6" class="text-center text-muted">No extreme heatwaves recorded for this station.</td></tr>';
                    d.heatwaves.forEach(row => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><span class="font-monospace text-light">${row.date}</span></td>
                            <td><span class="text-white">${row.city}</span></td>
                            <td><strong class="text-danger">${row.temperature}°C</strong></td>
                            <td><span class="badge-condition cond-${row.condition.toLowerCase()}">${row.condition}</span></td>
                            <td>${row.anomaly_type}</td>
                            <td><span class="badge bg-danger">${row.severity}</span></td>
                        `;
                        heatBody.appendChild(tr);
                    });
                }

                // Populate Cold Spell Table
                const coldBody = document.getElementById('tableColdBody');
                if (coldBody) {
                    coldBody.innerHTML = d.cold_spells.length ? '' : '<tr><td colspan="6" class="text-center text-muted">No severe cold spells recorded.</td></tr>';
                    d.cold_spells.forEach(row => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><span class="font-monospace text-light">${row.date}</span></td>
                            <td><span class="text-white">${row.city}</span></td>
                            <td><strong class="text-info">${row.temperature}°C</strong></td>
                            <td><span class="badge-condition cond-${row.condition.toLowerCase()}">${row.condition}</span></td>
                            <td>${row.anomaly_type}</td>
                            <td><span class="badge bg-info text-dark">${row.severity}</span></td>
                        `;
                        coldBody.appendChild(tr);
                    });
                }

                // Populate Rain Table
                const rainBody = document.getElementById('tableRainBody');
                if (rainBody) {
                    rainBody.innerHTML = d.heavy_rain.length ? '' : '<tr><td colspan="6" class="text-center text-muted">No torrential precipitation events.</td></tr>';
                    d.heavy_rain.forEach(row => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><span class="font-monospace text-light">${row.date}</span></td>
                            <td><span class="text-white">${row.city}</span></td>
                            <td><strong class="text-primary">${row.rainfall_mm} mm</strong></td>
                            <td><span class="badge-condition cond-${row.condition.toLowerCase()}">${row.condition}</span></td>
                            <td>${row.anomaly_type}</td>
                            <td><span class="badge bg-primary">${row.severity}</span></td>
                        `;
                        rainBody.appendChild(tr);
                    });
                }

                // Populate Wind Table
                const windBody = document.getElementById('tableWindBody');
                if (windBody) {
                    windBody.innerHTML = d.severe_wind.length ? '' : '<tr><td colspan="6" class="text-center text-muted">No severe wind events.</td></tr>';
                    d.severe_wind.forEach(row => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><span class="font-monospace text-light">${row.date}</span></td>
                            <td><span class="text-white">${row.city}</span></td>
                            <td><strong class="text-warning">${row.wind_kmh} km/h</strong></td>
                            <td><span class="badge-condition cond-${row.condition.toLowerCase()}">${row.condition}</span></td>
                            <td>${row.anomaly_type}</td>
                            <td><span class="badge bg-warning text-dark">${row.severity}</span></td>
                        `;
                        windBody.appendChild(tr);
                    });
                }
            }
        } catch (err) {
            console.error('Error loading extremes:', err);
        }
    }

    function refreshAllPredictions() {
        loadForecast();
        loadInsights();
        loadExtremes();
    }

    if (runBtn) {
        runBtn.addEventListener('click', () => {
            refreshAllPredictions();
            showToast('Predictive models re-fitted & forecast updated!');
        });
    }

    if (citySelect) {
        citySelect.addEventListener('change', refreshAllPredictions);
    }
    if (daysSelect) {
        daysSelect.addEventListener('change', loadForecast);
    }

    // Initial Execution
    refreshAllPredictions();
});

/**
 * PySpark Big Data Processing Controller - SkyAnalytics
 * Executes distributed DataFrame transformations, displays physical execution plans,
 * and renders PySpark GroupBy aggregations dynamically.
 */

document.addEventListener('DOMContentLoaded', () => {
    const executeBtn = document.getElementById('btnExecuteSparkJob');
    const spinner = document.getElementById('sparkBtnSpinner');
    const icon = document.getElementById('sparkBtnIcon');
    const partitionsSelect = document.getElementById('sparkPartitionsSelect');
    const imputeSelect = document.getElementById('sparkImputeSelect');

    const benchRaw = document.getElementById('benchRawCount');
    const benchDedup = document.getElementById('benchDedupCount');
    const benchClean = document.getElementById('benchCleanCount');
    const benchTime = document.getElementById('benchExecTime');
    const statusBadge = document.getElementById('sparkJobStatusBadge');
    const planConsole = document.getElementById('sparkExecutionPlanConsole');
    const tableBody = document.getElementById('sparkAggTableBody');
    const downloadContainer = document.getElementById('sparkDownloadContainer');

    async function runSparkPipeline() {
        if (!executeBtn) return;

        // UI Loading state
        executeBtn.disabled = true;
        if (spinner) spinner.classList.remove('d-none');
        if (icon) icon.classList.add('d-none');
        if (statusBadge) {
            statusBadge.innerText = 'EXECUTING PIPELINE...';
            statusBadge.className = 'badge bg-warning text-dark';
        }
        if (planConsole) {
            planConsole.innerText = '// Initializing distributed partitions...\n// Ingesting DataFrame from CSV stream...\n// Applying Catalyst logical & physical optimization...';
        }

        try {
            const partitions = partitionsSelect ? parseInt(partitionsSelect.value) : 4;
            const impute = imputeSelect ? imputeSelect.value : 'mean';

            const res = await fetch('/api/bigdata/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partitions: partitions, impute_strategy: impute })
            });

            const json = await res.json();
            if (json.status === 'success') {
                const d = json.data;

                // Update Benchmarks
                if (benchRaw) benchRaw.innerText = d.raw_records.toLocaleString();
                if (benchDedup) benchDedup.innerText = d.duplicates_removed.toLocaleString();
                if (benchClean) benchClean.innerText = d.cleaned_records.toLocaleString();
                if (benchTime) benchTime.innerText = d.execution_time_seconds;

                if (statusBadge) {
                    statusBadge.innerText = 'SUCCESS (200 OK)';
                    statusBadge.className = 'badge bg-success';
                }

                // Update Catalyst Execution Plan
                if (planConsole) {
                    planConsole.innerText = `// Engine: ${d.engine}\n// Timestamp: ${d.timestamp}\n// Partitions: ${d.partitions}\n\n${d.execution_plan}`;
                }

                // Render Table
                if (tableBody && d.city_aggregations) {
                    tableBody.innerHTML = '';
                    d.city_aggregations.forEach(row => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><span class="fw-bold text-white"><i class="bi bi-geo-alt text-danger me-1"></i> ${row.City}</span></td>
                            <td>${row.Total_Records.toLocaleString()}</td>
                            <td><span class="text-danger fw-bold">${row.Avg_Temperature}°C</span></td>
                            <td>${row.Max_Temperature}°C</td>
                            <td>${row.Min_Temperature}°C</td>
                            <td><span class="text-info">${row.Avg_Humidity}%</span></td>
                            <td><span class="text-primary fw-bold">${row.Total_Rainfall} mm</span></td>
                            <td>${row.Avg_Wind_Speed} km/h</td>
                            <td>${row.Avg_Pressure} hPa</td>
                        `;
                        tableBody.appendChild(tr);
                    });
                }

                if (downloadContainer) {
                    downloadContainer.classList.remove('d-none');
                }

                showToast(`PySpark Pipeline completed successfully in ${d.execution_time_seconds}s!`);
            } else {
                throw new Error(json.message || 'Pipeline execution failed.');
            }
        } catch (err) {
            console.error('Spark run error:', err);
            if (statusBadge) {
                statusBadge.innerText = 'FAILED';
                statusBadge.className = 'badge bg-danger';
            }
            if (planConsole) {
                planConsole.innerText = `// Execution Error:\n${err.message}`;
            }
            showToast(`Pipeline execution failed: ${err.message}`, false);
        } finally {
            executeBtn.disabled = false;
            if (spinner) spinner.classList.add('d-none');
            if (icon) icon.classList.remove('d-none');
        }
    }

    if (executeBtn) {
        executeBtn.addEventListener('click', runSparkPipeline);
    }
});

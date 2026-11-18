/**
 * Dataset Management Controller - SkyAnalytics
 * Handles CSV uploads, schema validation, data cleaning/imputation,
 * search, multi-column sorting, and dynamic pagination.
 */

document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    let pageSize = 20;
    let sortBy = 'Date';
    let sortDir = 'desc';

    const tableBody = document.getElementById('recordsTableBody');
    const tableShowing = document.getElementById('tableShowingCount');
    const tableTotal = document.getElementById('tableTotalCount');
    const currentPgLabel = document.getElementById('currentPageNum');
    const totalPgLabel = document.getElementById('totalPageNum');
    const prevBtn = document.getElementById('btnPrevPage');
    const nextBtn = document.getElementById('btnNextPage');
    const pageSizeSelect = document.getElementById('pageSizeSelect');

    const searchInput = document.getElementById('searchQuery');
    const cityFilter = document.getElementById('filterCity');
    const condFilter = document.getElementById('filterCondition');
    const startFilter = document.getElementById('filterStartDate');
    const endFilter = document.getElementById('filterEndDate');
    const filterBtn = document.getElementById('btnFilterSearch');

    const dropzone = document.getElementById('dropzoneArea');
    const fileInput = document.getElementById('csvFileInput');
    const cleanBtn = document.getElementById('btnCleanDataset');
    const resetBtn = document.getElementById('btnResetDataset');
    const activeFileLabel = document.getElementById('activeFileLabel');
    const datasetTotalCount = document.getElementById('datasetTotalCount');

    // 1. Fetch & Render Paginated Records
    async function loadRecords() {
        const query = searchInput ? searchInput.value.trim() : '';
        const city = cityFilter ? cityFilter.value : 'all';
        const cond = condFilter ? condFilter.value : 'all';
        const start = startFilter ? startFilter.value : '';
        const end = endFilter ? endFilter.value : '';

        const params = new URLSearchParams({
            page: currentPage,
            page_size: pageSize,
            sort_by: sortBy,
            sort_dir: sortDir,
            query: query,
            city: city,
            condition: cond,
            start_date: start,
            end_date: end
        });

        try {
            const res = await fetch(`/api/dataset/records?${params.toString()}`);
            const json = await res.json();
            if (json.status === 'success') {
                const d = json.data;
                renderTable(d.records);

                if (tableShowing) tableShowing.innerText = d.records.length;
                if (tableTotal) tableTotal.innerText = d.total_records.toLocaleString();
                if (datasetTotalCount) datasetTotalCount.innerText = d.total_records.toLocaleString();

                if (currentPgLabel) currentPgLabel.innerText = d.page;
                if (totalPgLabel) totalPgLabel.innerText = d.total_pages;

                if (prevBtn) prevBtn.disabled = (d.page <= 1);
                if (nextBtn) nextBtn.disabled = (d.page >= d.total_pages);
            }
        } catch (err) {
            console.error('Error loading dataset records:', err);
        }
    }

    function renderTable(records) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (!records || records.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No records match the active search criteria.</td></tr>';
            return;
        }

        records.forEach(r => {
            const condClass = `cond-${(r.Weather_Condition || 'clear').toLowerCase()}`;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="font-monospace text-light">${r.Date || '--'}</span></td>
                <td><span class="fw-bold text-white"><i class="bi bi-geo-alt-fill text-danger me-1"></i> ${r.City || '--'}</span></td>
                <td><span class="text-danger fw-semibold">${formatNum(r.Temperature)}°C</span></td>
                <td><span class="text-info">${formatNum(r.Humidity)}%</span></td>
                <td><span class="text-primary">${formatNum(r.Rainfall)} mm</span></td>
                <td><span class="text-warning">${formatNum(r.Wind_Speed)} km/h</span></td>
                <td><span class="text-secondary">${formatNum(r.Atmospheric_Pressure)} hPa</span></td>
                <td><span class="badge-condition ${condClass}">${r.Weather_Condition || 'Unknown'}</span></td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // 2. Sorting Handler
    function setupSorting(headerId, column) {
        const el = document.getElementById(headerId);
        if (el) {
            el.addEventListener('click', () => {
                if (sortBy === column) {
                    sortDir = (sortDir === 'asc' ? 'desc' : 'asc');
                } else {
                    sortBy = column;
                    sortDir = 'asc';
                }
                currentPage = 1;
                loadRecords();
            });
        }
    }

    setupSorting('thDate', 'Date');
    setupSorting('thCity', 'City');
    setupSorting('thTemp', 'Temperature');
    setupSorting('thHum', 'Humidity');
    setupSorting('thRain', 'Rainfall');
    setupSorting('thWind', 'Wind_Speed');
    setupSorting('thPress', 'Atmospheric_Pressure');

    // 3. Pagination & Filters Listeners
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadRecords();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentPage++;
            loadRecords();
        });
    }

    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', () => {
            pageSize = parseInt(pageSizeSelect.value);
            currentPage = 1;
            loadRecords();
        });
    }

    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            currentPage = 1;
            loadRecords();
            showToast('Filter applied!');
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                currentPage = 1;
                loadRecords();
            }
        });
    }

    if (cityFilter) cityFilter.addEventListener('change', () => { currentPage = 1; loadRecords(); });
    if (condFilter) condFilter.addEventListener('change', () => { currentPage = 1; loadRecords(); });

    // 4. File Upload (Drag & Drop + Input)
    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());

        ['dragenter', 'dragover'].forEach(name => {
            dropzone.addEventListener(name, (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(name => {
            dropzone.addEventListener(name, (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
            });
        });

        dropzone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                uploadFile(files[0]);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                uploadFile(fileInput.files[0]);
            }
        });
    }

    async function uploadFile(file) {
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showToast('Invalid file format. Please upload a CSV file.', false);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            showToast('Uploading and validating CSV dataset schema...', true);
            const res = await fetch('/api/dataset/upload', {
                method: 'POST',
                body: formData
            });
            const json = await res.json();
            if (json.status === 'success') {
                showToast(json.message);
                if (activeFileLabel) activeFileLabel.innerText = json.filename;
                currentPage = 1;
                loadRecords();
            } else {
                showToast(json.message || 'Upload failed.', false);
            }
        } catch (err) {
            console.error('Upload error:', err);
            showToast('Failed to upload CSV dataset.', false);
        }
    }

    // 5. Clean & Impute Handler
    if (cleanBtn) {
        cleanBtn.addEventListener('click', async () => {
            cleanBtn.disabled = true;
            try {
                showToast('Executing data cleaning and mean imputation...');
                const res = await fetch('/api/dataset/clean', { method: 'POST' });
                const json = await res.json();
                if (json.status === 'success') {
                    const d = json.data;
                    showToast(`Cleaned! ${d.duplicates_removed} duplicates removed, ${d.missing_imputed} null values imputed.`);
                    loadRecords();
                }
            } catch (err) {
                console.error('Clean error:', err);
                showToast('Data cleaning failed.', false);
            } finally {
                cleanBtn.disabled = false;
            }
        });
    }

    // 6. Reset to Default Dataset Handler
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            try {
                const res = await fetch('/api/dataset/reset', { method: 'POST' });
                const json = await res.json();
                if (json.status === 'success') {
                    showToast(json.message);
                    if (activeFileLabel) activeFileLabel.innerText = 'weather_sample_dataset.csv';
                    currentPage = 1;
                    loadRecords();
                }
            } catch (err) {
                console.error('Reset error:', err);
            }
        });
    }

    // Initial Load
    loadRecords();
});

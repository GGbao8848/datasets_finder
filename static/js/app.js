/**
 * Dataset Finder - Frontend Application
 * Handles path input, server-side browsing, and API communication
 */

// Global state
let analysisResults = null;
let currentSort = { column: 'class_name', ascending: true };
let currentBrowserPath = null;
let selectedBrowserPath = null;

// DOM Elements
const pathInput = document.getElementById('pathInput');
const browseBtn = document.getElementById('browseBtn');
const scanBtn = document.getElementById('scanBtn');
const resultsSection = document.getElementById('resultsSection');
const loadingIndicator = document.getElementById('loadingIndicator');
const searchInput = document.getElementById('searchInput');
const tableBody = document.getElementById('tableBody');
const exportBtn = document.getElementById('exportBtn');

// Modal Elements
const dirModal = document.getElementById('dirModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const confirmModelBtn = document.getElementById('confirmModelBtn');
const dirList = document.getElementById('dirList');
// History Elements
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');

const MAX_HISTORY = 10;
const HISTORY_KEY = 'dataset_finder_history';


// Event Listeners
browseBtn.addEventListener('click', openBrowserModal);
scanBtn.addEventListener('click', startAnalysis);
closeModalBtn.addEventListener('click', closeBrowserModal);
cancelModalBtn.addEventListener('click', closeBrowserModal);
confirmModelBtn.addEventListener('click', confirmSelection);
searchInput.addEventListener('input', filterTable);
exportBtn.addEventListener('click', exportToExcel);

// Close modal on outside click
dirModal.addEventListener('click', (e) => {
    if (e.target === dirModal) closeBrowserModal();
});

// Add sort listeners to table headers
document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
        const column = th.dataset.sort;
        sortTable(column);
    });
});

/**
 * Open Directory Browser Modal
 */
async function openBrowserModal() {
    dirModal.classList.add('active');

    // Start from current input path or root/home
    let startPath = pathInput.value.trim();
    await loadDirectory(startPath);
}

/**
 * Close Directory Browser Modal
 */
function closeBrowserModal() {
    dirModal.classList.remove('active');
    selectedBrowserPath = null;
    confirmModelBtn.disabled = true;
}

/**
 * Confirm folder selection
 */
function confirmSelection() {
    if (selectedBrowserPath || currentBrowserPath) {
        // Use selected subfolder or fallback to current folder
        pathInput.value = selectedBrowserPath || currentBrowserPath;
        closeBrowserModal();
    }
}

/**
 * Load directory contents from server
 */
async function loadDirectory(path = '') {
    try {
        dirList.innerHTML = '<div style="padding:1rem; text-align:center;">加载中...</div>';
        confirmModelBtn.disabled = true;
        selectedBrowserPath = null;

        const response = await fetch('/api/list_dirs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error);
        }

        currentBrowserPath = data.current_path;
        currentPathDisplay.textContent = currentBrowserPath;

        renderDirList(data);

        // Enable "Select Current Folder" (which is effectively choosing the one we are inside)
        // Actually, usually user selects a child folder or says "Select This Folder".
        // We'll treat "Current Folder" as the selection if nothing else selected.
        confirmModelBtn.disabled = false;

    } catch (error) {
        console.error('Error loading directory:', error);
        dirList.innerHTML = `<div style="padding:1rem; color:var(--danger-color);">无法加载目录: ${error.message}</div>`;
    }
}

/**
 * Render directory list
 */
function renderDirList(data) {
    dirList.innerHTML = '';

    // Parent directory option
    if (data.parent_path) {
        const parentLi = document.createElement('li');
        parentLi.className = 'dir-item';
        parentLi.innerHTML = `<span class="dir-icon">⬆️</span> ..`;
        parentLi.onclick = () => loadDirectory(data.parent_path);
        dirList.appendChild(parentLi);
    }

    // Subdirectories
    if (data.directories.length === 0) {
        dirList.innerHTML += `<div style="padding:1rem; color:var(--text-muted); text-align:center;">(无子文件夹)</div>`;
    }

    data.directories.forEach(dir => {
        const li = document.createElement('li');
        li.className = 'dir-item';
        li.innerHTML = `<span class="dir-icon">📁</span> ${escapeHtml(dir.name)}`;

        // Single click to select, double click to enter
        li.onclick = () => {
            // Deselect others
            document.querySelectorAll('.dir-item.selected').forEach(el => el.classList.remove('selected'));
            li.classList.add('selected');
            selectedBrowserPath = dir.path;
            confirmModelBtn.disabled = false;
        };

        li.ondblclick = () => {
            loadDirectory(dir.path);
        };

        dirList.appendChild(li);
    });
}

/**
 * Start Analysis
 */
async function startAnalysis() {
    const path = pathInput.value.trim();
    if (!path) {
        showToast('请输入或选择数据集路径', 'error');
        return;
    }

    try {
        // Show loading
        loadingIndicator.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        scanBtn.disabled = true;

        // Call API
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '分析失败');
        }

        if (data.success) {
            analysisResults = data.data;
            displayResults(analysisResults);
            saveToHistory(path);
            showToast('分析完成!', 'success');
        } else {

            throw new Error(data.error || '未知错误');
        }
    } catch (error) {
        console.error('Error analyzing dataset:', error);
        showToast('分析失败: ' + error.message, 'error');
    } finally {
        loadingIndicator.classList.add('hidden');
        scanBtn.disabled = false;
    }
}

/**
 * Display analysis results
 */
function displayResults(results) {
    // Update statistics
    document.getElementById('totalClasses').textContent = results.total_classes || 0;
    document.getElementById('totalAnnotations').textContent = results.total_annotations || 0;
    document.getElementById('totalFiles').textContent = results.total_files || 0;

    // Render table
    renderTable(results.classes || []);

    // Show results section
    resultsSection.classList.remove('hidden');

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Render data table
 */
function renderTable(classes) {
    tableBody.innerHTML = '';

    if (classes.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    未找到任何标注数据
                </td>
            </tr>
        `;
        return;
    }

    // Sort by class name by default if not set
    // (Existing sort logic handles the data array, this just renders)

    classes.forEach((classData, index) => {
        const row = document.createElement('tr');

        // 1. Class Name
        const nameCell = document.createElement('td');
        // Check for special/unsafe characters in class name
        nameCell.innerHTML = `<span class="class-name" title="${escapeHtml(classData.class_name)}">${escapeHtml(classData.class_name)}</span>`;
        row.appendChild(nameCell);

        // 2. Annotation Type
        const typeCell = document.createElement('td');
        const types = classData.types || [];
        if (types.length > 0) {
            typeCell.innerHTML = types.map(t => `<span class="badge" style="margin-right:4px">${escapeHtml(t)}</span>`).join('');
        } else {
            typeCell.innerHTML = `<span class="text-muted">-</span>`;
        }
        row.appendChild(typeCell);

        // 3. Annotations Count
        const annotationsCell = document.createElement('td');
        annotationsCell.innerHTML = `<span>${classData.annotations}</span>`;
        row.appendChild(annotationsCell);

        // 4. Files Count
        const filesCell = document.createElement('td');
        filesCell.textContent = classData.files;
        row.appendChild(filesCell);

        // 5. Locations (Dropdown)
        const locationsCell = document.createElement('td');

        // Use details/summary for dropdown
        const details = document.createElement('details');
        details.className = 'location-dropdown';

        const summary = document.createElement('summary');

        // Calculate all paths string for "Copy All"
        // Ensure absolute paths. classData.locations are now absolute from backend.
        const allPaths = classData.locations.join('\n');

        summary.innerHTML = `
            <div class="summary-content">
                <span>📁 共 ${classData.locations.length} 个路径</span>
            </div>
            <div class="summary-actions">
                 <button class="copy-btn-sm" data-copy-all="${index}">
                    📑 复制全部
                </button>
                <button class="copy-btn-sm" data-copy-formatted="${index}" style="margin-left: 8px;">
                    📝 格式化复制
                </button>
            </div>
        `;

        // Custom event handler for Copy All button to prevent expansion when clicking button
        const copyAllBtn = summary.querySelector(`[data-copy-all="${index}"]`);
        copyAllBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            copyToClipboard(allPaths, copyAllBtn);
        });

        // Custom event handler for Formatted Copy
        const copyFormattedBtn = summary.querySelector(`[data-copy-formatted="${index}"]`);
        copyFormattedBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Format: "path" \ (with trailing backslash on every line as per request)
            const formattedPaths = classData.locations.map(path => `"${path}" \\`).join('\n');
            copyToClipboard(formattedPaths, copyFormattedBtn);
        });

        const listDiv = document.createElement('div');
        listDiv.className = 'path-list';

        classData.locations.forEach(location => {
            const locItem = document.createElement('div');
            locItem.className = 'path-item';

            // Shorten display if too long? No, user wants full path.
            // But CSS truncates it visually with ellipsis.

            locItem.innerHTML = `
                <div class="path-text" title="${escapeHtml(location)}">${escapeHtml(location)}</div>
                <button class="copy-btn-sm" onclick="copyToClipboard('${escapeHtml(location)}', this)" title="复制">
                    📋
                </button>
            `;
            listDiv.appendChild(locItem);
        });

        details.appendChild(summary);
        details.appendChild(listDiv);
        locationsCell.appendChild(details);

        row.appendChild(locationsCell);

        tableBody.appendChild(row);
    });
}

/**
 * Filter table based on search input
 */
function filterTable() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (!analysisResults) return;

    const filteredClasses = analysisResults.classes.filter(classData =>
        classData.class_name.toLowerCase().includes(searchTerm)
    );

    renderTable(filteredClasses);
}

/**
 * Sort table by column
 */
function sortTable(column) {
    if (!analysisResults) return;

    // Toggle sort direction if same column
    if (currentSort.column === column) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort.column = column;
        currentSort.ascending = true;
    }

    // Sort data
    const sortedClasses = [...analysisResults.classes].sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];

        // Handle different data types
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return currentSort.ascending ? -1 : 1;
        if (aVal > bVal) return currentSort.ascending ? 1 : -1;
        return 0;
    });

    // Update table headers
    document.querySelectorAll('th[data-sort]').forEach(th => {
        const arrow = th.dataset.sort === column
            ? (currentSort.ascending ? ' ▲' : ' ▼')
            : ' ▼';
        th.textContent = th.textContent.replace(/[▲▼]/g, '').trim() + arrow;
    });

    // Update results and re-render
    analysisResults.classes = sortedClasses;
    filterTable(); // This will re-render with current search filter
}

/**
 * Export results to Excel
 */
async function exportToExcel() {
    if (!analysisResults) {
        showToast('没有可导出的数据', 'error');
        return;
    }

    try {
        exportBtn.disabled = true;
        exportBtn.textContent = '导出中...';

        const response = await fetch('/api/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                results: analysisResults
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '导出失败');
        }

        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dataset_analysis_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('导出成功!', 'success');
    } catch (error) {
        console.error('Error exporting:', error);
        showToast('导出失败: ' + error.message, 'error');
    } finally {
        exportBtn.disabled = false;
        exportBtn.textContent = '📥 导出 Excel';
    }
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text, button) {
    const showSuccess = () => {
        const originalText = button.textContent;
        // Helper to check if text is just an emoji or icon
        const isIcon = originalText.length <= 2 || originalText.trim().match(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]$/u);

        button.textContent = '✓';
        button.style.color = 'var(--success-color)';

        setTimeout(() => {
            button.textContent = originalText;
            button.style.color = '';
        }, 1500);

        showToast('路径已复制到剪贴板', 'success');
    };

    const useFallback = () => {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Ensure textarea is not visible but part of DOM so it can be selected
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showSuccess();
            } else {
                throw new Error('execCommand returned false');
            }
        } catch (err) {
            console.error('Fallback copy failed', err);
            showToast('复制失败: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            document.body.removeChild(textArea);
        }
    };

    // Check if Clipboard API is supported and available (it might be undefined in non-secure contexts)
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => showSuccess())
            .catch(err => {
                console.error('Clipboard API failed, attempting fallback...', err);
                useFallback(); // Fallback if promise rejects
            });
    } else {
        console.log('Clipboard API unavailable, using fallback...');
        useFallback(); // Fallback if API not exists
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Save path to history in localStorage
 */
function saveToHistory(path) {
    let history = getHistory();

    // Remove if already exists (to move to top)
    history = history.filter(h => h !== path);

    // Add to top
    history.unshift(path);

    // Limit size
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}

/**
 * Remove path from history
 */
function deleteFromHistory(path) {
    let history = getHistory();
    history = history.filter(h => h !== path);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}

/**
 * Get history from localStorage
 */
function getHistory() {
    const historyStr = localStorage.getItem(HISTORY_KEY);
    try {
        return historyStr ? JSON.parse(historyStr) : [];
    } catch (e) {
        return [];
    }
}

/**
 * Render history items
 */
function renderHistory() {
    const history = getHistory();

    if (history.length === 0) {
        historySection.classList.add('hidden');
        return;
    }

    historySection.classList.remove('hidden');
    historyList.innerHTML = '';

    history.forEach(path => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.title = path;

        const textSpan = document.createElement('span');
        textSpan.textContent = path;
        // Make text truncation work if needed, though flex handles it well usually
        textSpan.style.overflow = 'hidden';
        textSpan.style.textOverflow = 'ellipsis';
        textSpan.style.whiteSpace = 'nowrap';

        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'history-delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = '删除';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteFromHistory(path);
        };

        item.onclick = () => {
            pathInput.value = path;
            startAnalysis();
        };

        item.appendChild(textSpan);
        item.appendChild(deleteBtn);

        historyList.appendChild(item);
    });
}

/**
 * Load history on startup
 */
function loadHistory() {
    renderHistory();
}

// Initialize
console.log('Dataset Finder initialized');
loadHistory();


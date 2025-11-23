// Miyabi Dashboard - Frontend Application
// Version: 1.0.0

const API_BASE = 'http://localhost:3000/api';
const REFRESH_INTERVAL = 5000; // 5 seconds

let currentFilter = 'all';
let allTasks = [];
let refreshTimer = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌸 Miyabi Dashboard initialized');

    // Request notification permission
    requestNotificationPermission();

    // Setup event listeners
    setupEventListeners();

    // Load initial data
    loadTasks();
    loadProgressData();

    // Start auto-refresh
    startAutoRefresh();
});

// Event Listeners
function setupEventListeners() {
    // Task form submission
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });

    // Modal close
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('taskDetailModal').addEventListener('click', (e) => {
        if (e.target.id === 'taskDetailModal') {
            closeModal();
        }
    });
}

// Task Submission
async function handleTaskSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const taskData = {
        name: formData.get('taskName'),
        description: formData.get('taskDescription'),
        priority: formData.get('priority'),
        template: formData.get('template') || 'custom',
        execution_type: formData.get('executionType')
    };

    try {
        const response = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) {
            throw new Error('Failed to submit task');
        }

        const result = await response.json();
        console.log('✅ Task submitted:', result);

        // Show success message
        showNotification('success', `タスク「${taskData.name}」を投入しました`);

        // Reset form
        e.target.reset();

        // Reload tasks
        loadTasks();

    } catch (error) {
        console.error('❌ Error submitting task:', error);
        showNotification('error', 'タスクの投入に失敗しました');
    }
}

// Load Tasks
async function loadTasks() {
    try {
        const response = await fetch(`${API_BASE}/tasks`);

        if (!response.ok) {
            throw new Error('Failed to load tasks');
        }

        const data = await response.json();
        allTasks = data.tasks;

        // Update status counts
        updateStatusCounts(allTasks);

        // Render task list
        renderTaskList(filterTasks(allTasks, currentFilter));

        // Update last update time
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('ja-JP');

    } catch (error) {
        console.error('❌ Error loading tasks:', error);
        showEmptyState('タスクの読み込みに失敗しました');
    }
}

// Update Status Counts
function updateStatusCounts(tasks) {
    const counts = {
        pending: 0,
        in_progress: 0,
        completed: 0,
        blocked: 0
    };

    tasks.forEach(task => {
        if (counts.hasOwnProperty(task.status)) {
            counts[task.status]++;
        }
    });

    document.getElementById('pendingCount').textContent = counts.pending;
    document.getElementById('inProgressCount').textContent = counts.in_progress;
    document.getElementById('completedCount').textContent = counts.completed;
    document.getElementById('blockedCount').textContent = counts.blocked;
}

// Filter Tasks
function filterTasks(tasks, filter) {
    if (filter === 'all') {
        return tasks;
    }
    return tasks.filter(task => task.status === filter);
}

// Handle Filter Click
function handleFilterClick(e) {
    const filter = e.target.dataset.filter;

    // Update active state
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');

    // Update current filter
    currentFilter = filter;

    // Re-render task list
    renderTaskList(filterTasks(allTasks, currentFilter));
}

// Render Task List
function renderTaskList(tasks) {
    const container = document.getElementById('taskListContainer');

    if (tasks.length === 0) {
        showEmptyState('タスクがありません');
        return;
    }

    const html = tasks.map(task => `
        <div class="task-item ${task.status}" onclick="showTaskDetail('${task.task_id}')">
            <div class="task-item-header">
                <div class="task-item-title">${escapeHtml(task.directive || task.name)}</div>
                <div class="task-item-meta">
                    <span class="task-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
                    <span class="task-badge status-${task.status}">${formatStatus(task.status)}</span>
                </div>
            </div>
            ${task.description ? `<div class="task-item-description">${escapeHtml(task.description)}</div>` : ''}
            <div class="task-item-footer">
                <span>🆔 ${task.task_id}</span>
                <span>🕒 ${formatDateTime(task.created_at)}</span>
                ${task.execution && task.execution.duration ? `<span>⏱️ ${formatDuration(task.execution.duration)}</span>` : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

// Show Empty State
function showEmptyState(message) {
    const container = document.getElementById('taskListContainer');
    container.innerHTML = `
        <div class="empty-state">
            <p>${message}</p>
            <p class="text-muted">上記のフォームから新しいタスクを投入してください</p>
        </div>
    `;
}

// Show Task Detail
async function showTaskDetail(taskId) {
    try {
        const response = await fetch(`${API_BASE}/tasks/${taskId}`);

        if (!response.ok) {
            throw new Error('Failed to load task detail');
        }

        const task = await response.json();

        // Populate modal
        document.getElementById('modalTaskName').textContent = task.directive || task.name;
        document.getElementById('modalTaskId').textContent = `🆔 ${task.task_id}`;
        document.getElementById('modalTaskPriority').textContent = task.priority;
        document.getElementById('modalTaskPriority').className = `task-badge priority-${task.priority.toLowerCase()}`;
        document.getElementById('modalTaskStatus').textContent = formatStatus(task.status);
        document.getElementById('modalTaskStatus').className = `task-badge status-${task.status}`;

        document.getElementById('modalTaskDescription').textContent = task.description || '説明なし';
        document.getElementById('modalCreatedAt').textContent = formatDateTime(task.created_at);
        document.getElementById('modalUpdatedAt').textContent = formatDateTime(task.updated_at);

        if (task.execution && task.execution.duration) {
            document.getElementById('modalDuration').textContent = formatDuration(task.execution.duration);
        } else {
            document.getElementById('modalDuration').textContent = '-';
        }

        // Log file
        if (task.output && task.output.log_file) {
            const logLink = document.getElementById('modalLogFile');
            logLink.textContent = task.output.log_file;
            logLink.href = `${API_BASE}/logs/${encodeURIComponent(task.output.log_file)}`;

            // Load log content
            loadLogContent(task.output.log_file);
        } else {
            document.getElementById('modalLog').textContent = 'ログファイルがありません';
        }

        // GitHub links
        if (task.output && (task.output.github_issue || task.output.github_pr)) {
            document.getElementById('modalGitHubSection').style.display = 'block';
            const links = [];
            if (task.output.github_issue) {
                links.push(`<a href="https://github.com/customer-cloud/miyabi-private/issues/${task.output.github_issue}" target="_blank">Issue ${task.output.github_issue}</a>`);
            }
            if (task.output.github_pr) {
                links.push(`<a href="https://github.com/customer-cloud/miyabi-private/pull/${task.output.github_pr}" target="_blank">PR ${task.output.github_pr}</a>`);
            }
            document.getElementById('modalGitHubLinks').innerHTML = links.join(' | ');
        } else {
            document.getElementById('modalGitHubSection').style.display = 'none';
        }

        // Callout
        if (task.callout && task.callout.required) {
            document.getElementById('modalCalloutSection').style.display = 'block';
            const calloutHtml = `
                <div class="callout-content">
                    <p><strong>Issue:</strong> #${task.callout.issue_number}</p>
                    <div>
                        <strong>質問:</strong>
                        <ul>
                            ${task.callout.questions.map(q => `<li>${escapeHtml(q)}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
            document.getElementById('modalCalloutContent').innerHTML = calloutHtml;
        } else {
            document.getElementById('modalCalloutSection').style.display = 'none';
        }

        // Show modal
        document.getElementById('taskDetailModal').classList.add('active');

    } catch (error) {
        console.error('❌ Error loading task detail:', error);
        showNotification('error', 'タスク詳細の読み込みに失敗しました');
    }
}

// Load Log Content
async function loadLogContent(logFile) {
    try {
        const response = await fetch(`${API_BASE}/logs/${encodeURIComponent(logFile)}`);

        if (!response.ok) {
            throw new Error('Failed to load log');
        }

        const log = await response.text();
        document.getElementById('modalLog').textContent = log || 'ログが空です';

    } catch (error) {
        console.error('❌ Error loading log:', error);
        document.getElementById('modalLog').textContent = 'ログの読み込みに失敗しました';
    }
}

// Close Modal
function closeModal() {
    document.getElementById('taskDetailModal').classList.remove('active');
}

// Open in GitHub
function openInGitHub() {
    const taskId = document.getElementById('modalTaskId').textContent.replace('🆔 ', '');
    const task = allTasks.find(t => t.task_id === taskId);

    if (task && task.output && task.output.github_issue) {
        window.open(`https://github.com/customer-cloud/miyabi-private/issues/${task.output.github_issue}`, '_blank');
    } else {
        window.open('https://github.com/customer-cloud/miyabi-private/issues', '_blank');
    }
}

// Auto Refresh
function startAutoRefresh() {
    refreshTimer = setInterval(() => {
        loadTasks();
        loadProgressData();
    }, REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

// Utility Functions
function formatStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'blocked': 'Blocked'
    };
    return statusMap[status] || status;
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP');
}

function formatDuration(seconds) {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Request Notification Permission
async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        try {
            const permission = await Notification.requestPermission();
            console.log('📢 Notification permission:', permission);
        } catch (error) {
            console.error('Failed to request notification permission:', error);
        }
    }
}

// Show Browser Notification
function showBrowserNotification(title, body, icon = '🌸') {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'miyabi-notification',
            renotify: true,
            requireInteraction: false,
            vibrate: [200, 100, 200]
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);
    }
}

// Show In-Page Notification
function showNotification(type, message) {
    // In-page notification badge
    const notification = document.createElement('div');
    notification.className = `notification-badge ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.5rem;">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>${escapeHtml(message)}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);

    // Also show browser notification for important events
    if (type === 'success' || type === 'error') {
        const title = type === 'success' ? '✅ タスク完了' : '❌ エラー発生';
        showBrowserNotification(title, message);
    }
}

// ===================================================================
// Progress Monitoring Functions
// ===================================================================

// Load Progress Data
async function loadProgressData() {
    try {
        const response = await fetch('/progress-data.json');

        if (!response.ok) {
            throw new Error('Failed to load progress data');
        }

        const data = await response.json();
        console.log('📊 Progress data loaded:', data);

        // Render projects
        renderProjects(data.projects || []);

        // Render background tasks
        renderBackgroundTasks(data.tasks || []);

    } catch (error) {
        console.error('❌ Error loading progress data:', error);
        document.getElementById('projectsList').innerHTML = '<div class="error">進捗データの読み込みに失敗しました</div>';
        document.getElementById('backgroundTasksList').innerHTML = '<div class="error">進捗データの読み込みに失敗しました</div>';
    }
}

// Render Projects
function renderProjects(projects) {
    const container = document.getElementById('projectsList');

    if (projects.length === 0) {
        container.innerHTML = '<div class="empty-state">プロジェクトがありません</div>';
        return;
    }

    const html = projects.map(project => `
        <div class="project-card ${project.status}">
            <div class="project-header">
                <h4>${escapeHtml(project.project_name || project.project_id)}</h4>
                <span class="project-status">${project.status}</span>
            </div>
            <div class="project-stats">
                <div class="stat">
                    <span class="stat-label">Total</span>
                    <span class="stat-value">${project.metrics?.total_tasks || 0}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">完了</span>
                    <span class="stat-value">${project.metrics?.completed_tasks || 0}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">失敗</span>
                    <span class="stat-value">${project.metrics?.failed_tasks || 0}</span>
                </div>
            </div>
            <div class="project-footer">
                <span>🆔 ${project.project_id}</span>
                <span>👤 ${project.owner}</span>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

// Render Background Tasks
function renderBackgroundTasks(tasks) {
    const container = document.getElementById('backgroundTasksList');

    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-state">バックグラウンドタスクがありません</div>';
        return;
    }

    const html = tasks.map(task => {
        const percentage = task.progress?.percentage || 0;
        const current = task.progress?.current || 0;
        const total = task.progress?.total || 0;
        const statusIcon = getStatusIcon(task.status);

        return `
            <div class="progress-item ${task.status}">
                <div class="progress-item-header">
                    <div class="progress-item-title">
                        ${statusIcon} ${formatTaskType(task.task_type)}
                    </div>
                    <div class="progress-item-status">
                        <span class="status-badge ${task.status}">${formatStatus(task.status)}</span>
                        <span class="progress-percentage">${percentage}%</span>
                    </div>
                </div>

                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>

                <div class="progress-item-footer">
                    <span>${current}/${total} ${getProgressUnit(task.task_type)}</span>
                    ${task.details?.phase ? `<span>📍 ${escapeHtml(task.details.phase)}</span>` : ''}
                    ${task.updated_at ? `<span>🕒 ${formatDateTime(task.updated_at)}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

// Helper: Get Status Icon
function getStatusIcon(status) {
    const icons = {
        'pending': '⏳',
        'running': '🔄',
        'completed': '✅',
        'failed': '❌'
    };
    return icons[status] || '❓';
}

// Helper: Format Task Type
function formatTaskType(taskType) {
    const typeMap = {
        'cdk_deploy': 'CDK Deploy',
        'agent_execution': 'Agent実行',
        'issue_creation': 'Issue作成',
        'webui_server': 'WebUIサーバー',
        'build': 'ビルド'
    };
    return typeMap[taskType] || taskType;
}

// Helper: Get Progress Unit
function getProgressUnit(taskType) {
    const unitMap = {
        'cdk_deploy': 'resources',
        'agent_execution': 'steps',
        'issue_creation': 'issues',
        'build': 'tasks'
    };
    return unitMap[taskType] || 'items';
}

// Export for global access
window.showTaskDetail = showTaskDetail;
window.closeModal = closeModal;
window.openInGitHub = openInGitHub;
window.loadProgressData = loadProgressData;

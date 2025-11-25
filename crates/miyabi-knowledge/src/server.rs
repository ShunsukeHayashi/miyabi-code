//! HTTP Server for Knowledge Dashboard
//!
//! Provides a web interface for knowledge base visualization, search, and statistics.

use crate::config::KnowledgeConfig;
use crate::error::{KnowledgeError, Result};
use crate::searcher::{KnowledgeSearcher, QdrantSearcher, SearchFilter};
use crate::types::KnowledgeResult;
use axum::{
    extract::{Query, State, WebSocketUpgrade},
    http::StatusCode,
    response::{Html, IntoResponse, Response},
    routing::get,
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::{net::SocketAddr, sync::Arc};
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use tracing::{error, info};

/// Knowledge Server State
pub struct ServerState {
    config: KnowledgeConfig,
    searcher: Arc<QdrantSearcher>,
    stats_cache: RwLock<Option<DashboardStats>>,
}

/// Knowledge Server
pub struct KnowledgeServer {
    state: Arc<ServerState>,
}

impl KnowledgeServer {
    /// Create a new Knowledge Server
    pub async fn new(config: KnowledgeConfig) -> Result<Self> {
        let searcher = Arc::new(QdrantSearcher::new(config.clone()).await?);

        let state = Arc::new(ServerState {
            config,
            searcher,
            stats_cache: RwLock::new(None),
        });

        Ok(Self { state })
    }

    /// Start the server on the specified port
    pub async fn serve(&self, port: u16) -> Result<()> {
        let app = Router::new()
            // API Routes
            .route("/api/search", get(search_handler))
            .route("/api/stats", get(stats_handler))
            .route("/api/agents", get(agents_handler))
            .route("/api/timeline", get(timeline_handler))
            // WebSocket
            .route("/ws", get(websocket_handler))
            // Static Files
            .route("/", get(index_handler))
            .route("/health", get(health_handler))
            // CORS
            .layer(CorsLayer::permissive())
            .with_state(self.state.clone());

        let addr = SocketAddr::from(([127, 0, 0, 1], port));
        info!("Starting Knowledge Dashboard at http://localhost:{}", port);
        info!("Press Ctrl+C to stop");

        let listener = tokio::net::TcpListener::bind(addr).await?;
        axum::serve(listener, app)
            .await
            .map_err(|e| KnowledgeError::Server(format!("Server error: {}", e)))?;

        Ok(())
    }
}

// ===== API Handlers =====

/// Search Parameters
#[derive(Debug, Deserialize)]
pub struct SearchParams {
    /// Search query
    pub q: String,

    /// Agent filter
    #[serde(default)]
    pub agent: Option<String>,

    /// Workspace filter
    #[serde(default)]
    pub workspace: Option<String>,

    /// Issue number filter
    #[serde(default)]
    pub issue: Option<u32>,

    /// Task type filter
    #[serde(default)]
    pub task_type: Option<String>,

    /// Outcome filter
    #[serde(default)]
    pub outcome: Option<String>,

    /// Result limit
    #[serde(default = "default_limit")]
    pub limit: usize,
}

fn default_limit() -> usize {
    10
}

/// Search Response
#[derive(Debug, Serialize)]
pub struct SearchResponse {
    pub results: Vec<KnowledgeResult>,
    pub total: usize,
    pub query: String,
}

/// GET /api/search
async fn search_handler(
    State(state): State<Arc<ServerState>>,
    Query(params): Query<SearchParams>,
) -> std::result::Result<Json<SearchResponse>, ServerError> {
    info!("Search request: query='{}', agent={:?}", params.q, params.agent);

    let mut filter = SearchFilter::new();

    if let Some(agent) = params.agent {
        filter = filter.with_agent(agent);
    }

    if let Some(workspace) = params.workspace {
        filter = filter.with_workspace(workspace);
    }

    if let Some(issue) = params.issue {
        filter = filter.with_issue_number(issue);
    }

    if let Some(task_type) = params.task_type {
        filter = filter.with_task_type(task_type);
    }

    if let Some(outcome) = params.outcome {
        filter = filter.with_outcome(outcome);
    }

    let results = state
        .searcher
        .search_filtered(&params.q, filter)
        .await
        .map_err(ServerError::from)?;

    let total = results.len();

    Ok(Json(SearchResponse {
        results,
        total,
        query: params.q,
    }))
}

/// Dashboard Statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStats {
    pub total_entries: u64,
    pub unique_agents: usize,
    pub unique_workspaces: usize,
    pub success_rate: f64,
    pub by_agent: Vec<AgentStats>,
    pub by_outcome: OutcomeStats,
    pub timeline: Vec<TimelineEntry>,
    pub last_indexed_at: Option<DateTime<Utc>>,
}

/// Agent Statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentStats {
    pub agent: String,
    pub count: usize,
    pub success_count: usize,
    pub failed_count: usize,
    pub success_rate: f64,
}

/// Outcome Statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutcomeStats {
    pub success: usize,
    pub failed: usize,
    pub unknown: usize,
}

/// Timeline Entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineEntry {
    pub date: String,
    pub count: usize,
    pub success: usize,
    pub failed: usize,
}

/// GET /api/stats
async fn stats_handler(
    State(state): State<Arc<ServerState>>,
) -> std::result::Result<Json<DashboardStats>, ServerError> {
    info!("Stats request");

    // Check cache first
    {
        let cache = state.stats_cache.read().await;
        if let Some(stats) = cache.as_ref() {
            return Ok(Json(stats.clone()));
        }
    }

    // Get collection info from Qdrant
    let collection_info = crate::qdrant::QdrantClient::new(state.config.clone())
        .await
        .map_err(ServerError::from)?
        .collection_info()
        .await
        .map_err(ServerError::from)?;

    let total_entries = collection_info.points_count.unwrap_or(0);

    // For now, return mock data for agents and timeline
    // TODO: Implement actual statistics aggregation from Qdrant
    let stats = DashboardStats {
        total_entries,
        unique_agents: 7,
        unique_workspaces: 1,
        success_rate: 92.3,
        by_agent: vec![
            AgentStats {
                agent: "CodeGenAgent".to_string(),
                count: 1234,
                success_count: 1150,
                failed_count: 84,
                success_rate: 93.2,
            },
            AgentStats {
                agent: "ReviewAgent".to_string(),
                count: 892,
                success_count: 850,
                failed_count: 42,
                success_rate: 95.3,
            },
            AgentStats {
                agent: "DeploymentAgent".to_string(),
                count: 567,
                success_count: 502,
                failed_count: 65,
                success_rate: 88.5,
            },
        ],
        by_outcome: OutcomeStats {
            success: 2502,
            failed: 191,
            unknown: 0,
        },
        timeline: vec![
            TimelineEntry {
                date: "2025-10-24".to_string(),
                count: 156,
                success: 145,
                failed: 11,
            },
            TimelineEntry {
                date: "2025-10-23".to_string(),
                count: 189,
                success: 175,
                failed: 14,
            },
        ],
        last_indexed_at: Some(Utc::now()),
    };

    // Update cache
    {
        let mut cache = state.stats_cache.write().await;
        *cache = Some(stats.clone());
    }

    Ok(Json(stats))
}

/// Agents List Response
#[derive(Debug, Serialize)]
pub struct AgentsResponse {
    pub agents: Vec<String>,
}

/// GET /api/agents
async fn agents_handler(
    State(_state): State<Arc<ServerState>>,
) -> std::result::Result<Json<AgentsResponse>, ServerError> {
    info!("Agents request");

    // Return list of known agents
    let agents = vec![
        "CodeGenAgent".to_string(),
        "ReviewAgent".to_string(),
        "DeploymentAgent".to_string(),
        "PRAgent".to_string(),
        "IssueAgent".to_string(),
        "CoordinatorAgent".to_string(),
        "RefresherAgent".to_string(),
    ];

    Ok(Json(AgentsResponse { agents }))
}

/// Timeline Parameters
#[derive(Debug, Deserialize)]
pub struct TimelineParams {
    /// Number of days to retrieve
    #[serde(default = "default_days")]
    pub days: usize,
}

fn default_days() -> usize {
    30
}

/// GET /api/timeline
async fn timeline_handler(
    State(state): State<Arc<ServerState>>,
    Query(params): Query<TimelineParams>,
) -> std::result::Result<Json<Vec<TimelineEntry>>, ServerError> {
    info!("Timeline request: days={}", params.days);

    // Check cache
    {
        let cache = state.stats_cache.read().await;
        if let Some(stats) = cache.as_ref() {
            return Ok(Json(stats.timeline.clone()));
        }
    }

    // Return mock data for now
    // TODO: Implement actual timeline aggregation
    let timeline = vec![
        TimelineEntry {
            date: "2025-10-24".to_string(),
            count: 156,
            success: 145,
            failed: 11,
        },
        TimelineEntry {
            date: "2025-10-23".to_string(),
            count: 189,
            success: 175,
            failed: 14,
        },
    ];

    Ok(Json(timeline))
}

/// GET /
async fn index_handler() -> Html<&'static str> {
    Html(INDEX_HTML)
}

/// GET /health
async fn health_handler() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "timestamp": Utc::now(),
    }))
}

/// WebSocket Handler
async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<ServerState>>,
) -> Response {
    ws.on_upgrade(|socket| handle_websocket(socket, state))
}

use axum::extract::ws::{Message, WebSocket};

async fn handle_websocket(mut socket: WebSocket, state: Arc<ServerState>) {
    info!("WebSocket client connected");

    let mut interval = tokio::time::interval(std::time::Duration::from_secs(5));

    loop {
        tokio::select! {
            _ = interval.tick() => {
                // Send stats update
                let stats_result = {
                    let cache = state.stats_cache.read().await;
                    cache.clone()
                };

                if let Some(stats) = stats_result {
                    let msg = serde_json::to_string(&stats).unwrap_or_else(|e| {
                        error!("Failed to serialize stats: {}", e);
                        "{}".to_string()
                    });

                    if let Err(e) = socket.send(Message::Text(msg.into())).await {
                        error!("Failed to send WebSocket message: {}", e);
                        break;
                    }
                } else {
                    // Fetch stats if not cached
                    if let Ok(client) = crate::qdrant::QdrantClient::new(state.config.clone()).await {
                        if let Ok(info) = client.collection_info().await {
                            let total_entries = info.points_count.unwrap_or(0);
                            let update = serde_json::json!({
                                "total_entries": total_entries,
                                "timestamp": Utc::now(),
                            });

                            let msg = serde_json::to_string(&update).unwrap();
                            if let Err(e) = socket.send(Message::Text(msg.into())).await {
                                error!("Failed to send WebSocket message: {}", e);
                                break;
                            }
                        }
                    }
                }
            }

            Some(msg) = socket.recv() => {
                match msg {
                    Ok(Message::Close(_)) => {
                        info!("WebSocket client disconnected");
                        break;
                    }
                    Ok(Message::Ping(data)) => {
                        if let Err(e) = socket.send(Message::Pong(data)).await {
                            error!("Failed to send pong: {}", e);
                            break;
                        }
                    }
                    Err(e) => {
                        error!("WebSocket error: {}", e);
                        break;
                    }
                    _ => {}
                }
            }
        }
    }

    info!("WebSocket connection closed");
}

// ===== Error Handling =====

#[derive(Debug)]
pub struct ServerError {
    message: String,
}

impl From<KnowledgeError> for ServerError {
    fn from(err: KnowledgeError) -> Self {
        ServerError {
            message: err.to_string(),
        }
    }
}

impl IntoResponse for ServerError {
    fn into_response(self) -> Response {
        let body = Json(serde_json::json!({
            "error": self.message,
        }));

        (StatusCode::INTERNAL_SERVER_ERROR, body).into_response()
    }
}

// ===== Static HTML =====

const INDEX_HTML: &str = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Miyabi Knowledge Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 1200px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .status {
            display: inline-block;
            padding: 8px 16px;
            background: #10b981;
            color: white;
            border-radius: 20px;
            font-weight: 600;
            margin-bottom: 30px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .stat-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 12px;
            border: 2px solid #e5e7eb;
        }

        .stat-card h3 {
            font-size: 0.9em;
            color: #6b7280;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .stat-card .value {
            font-size: 2em;
            font-weight: 700;
            color: #667eea;
        }

        .search-section {
            margin: 30px 0;
        }

        .search-box {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        input {
            flex: 1;
            padding: 15px;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            font-size: 1em;
        }

        input:focus {
            outline: none;
            border-color: #667eea;
        }

        button {
            padding: 15px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }

        button:hover {
            transform: translateY(-2px);
        }

        .results {
            background: #f9fafb;
            padding: 20px;
            border-radius: 12px;
            border: 2px solid #e5e7eb;
            max-height: 400px;
            overflow-y: auto;
        }

        .result-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 4px solid #667eea;
        }

        .result-item:last-child {
            margin-bottom: 0;
        }

        .result-score {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .result-content {
            color: #6b7280;
            line-height: 1.6;
        }

        .ws-status {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #10b981;
            margin-right: 8px;
        }

        .ws-status.disconnected {
            background: #ef4444;
        }

        .footer {
            margin-top: 30px;
            text-align: center;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Miyabi Knowledge Dashboard</h1>
        <div class="status">
            <span class="ws-status" id="wsStatus"></span>
            <span id="statusText">Connected</span>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Entries</h3>
                <div class="value" id="totalEntries">-</div>
            </div>
            <div class="stat-card">
                <h3>Unique Agents</h3>
                <div class="value" id="uniqueAgents">-</div>
            </div>
            <div class="stat-card">
                <h3>Success Rate</h3>
                <div class="value" id="successRate">-</div>
            </div>
            <div class="stat-card">
                <h3>Last Updated</h3>
                <div class="value" style="font-size: 1.2em;" id="lastUpdated">-</div>
            </div>
        </div>

        <div class="search-section">
            <h2>Search Knowledge Base</h2>
            <div class="search-box">
                <input type="text" id="searchQuery" placeholder="Enter search query..." />
                <button onclick="search()">Search</button>
            </div>
            <div class="results" id="results">
                <p style="color: #6b7280;">Enter a query to search the knowledge base...</p>
            </div>
        </div>

        <div class="footer">
            <p>Miyabi Knowledge Dashboard v0.1.0</p>
            <p>API: <a href="/api/stats" style="color: #667eea;">/api/stats</a> | <a href="/api/agents" style="color: #667eea;">/api/agents</a> | <a href="/health" style="color: #667eea;">/health</a></p>
        </div>
    </div>

    <script>
        // WebSocket Connection
        let ws = null;

        function connectWebSocket() {
            ws = new WebSocket('ws://' + window.location.host + '/ws');

            ws.onopen = () => {
                console.log('WebSocket connected');
                document.getElementById('wsStatus').classList.remove('disconnected');
                document.getElementById('statusText').textContent = 'Connected';
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    updateStats(data);
                } catch (e) {
                    console.error('Failed to parse WebSocket message:', e);
                }
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                document.getElementById('wsStatus').classList.add('disconnected');
                document.getElementById('statusText').textContent = 'Disconnected';
                // Reconnect after 5 seconds
                setTimeout(connectWebSocket, 5000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        }

        function updateStats(data) {
            if (data.total_entries !== undefined) {
                document.getElementById('totalEntries').textContent = data.total_entries.toLocaleString();
            }
            if (data.unique_agents !== undefined) {
                document.getElementById('uniqueAgents').textContent = data.unique_agents;
            }
            if (data.success_rate !== undefined) {
                document.getElementById('successRate').textContent = data.success_rate.toFixed(1) + '%';
            }
            if (data.last_indexed_at !== undefined) {
                const date = new Date(data.last_indexed_at);
                const now = new Date();
                const diff = Math.floor((now - date) / 1000 / 60);
                document.getElementById('lastUpdated').textContent = diff < 60 ? diff + 'm ago' : Math.floor(diff / 60) + 'h ago';
            }
        }

        // Load initial stats
        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                updateStats(data);
            } catch (e) {
                console.error('Failed to load stats:', e);
            }
        }

        // Search function
        async function search() {
            const query = document.getElementById('searchQuery').value;
            if (!query) return;

            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<p style="color: #6b7280;">Searching...</p>';

            try {
                const response = await fetch('/api/search?q=' + encodeURIComponent(query) + '&limit=10');
                const data = await response.json();

                if (data.results.length === 0) {
                    resultsDiv.innerHTML = '<p style="color: #6b7280;">No results found.</p>';
                    return;
                }

                resultsDiv.innerHTML = data.results.map(result => `
                    <div class="result-item">
                        <span class="result-score">Score: ${(result.score * 100).toFixed(1)}%</span>
                        <div class="result-content">${result.content.substring(0, 200)}...</div>
                    </div>
                `).join('');
            } catch (e) {
                console.error('Search failed:', e);
                resultsDiv.innerHTML = '<p style="color: #ef4444;">Search failed. Please try again.</p>';
            }
        }

        // Enter key support
        document.getElementById('searchQuery').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') search();
        });

        // Initialize
        connectWebSocket();
        loadStats();
    </script>
</body>
</html>
"#;

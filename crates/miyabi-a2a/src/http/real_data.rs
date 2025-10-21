//! Real data fetching from GitHub API
//!
//! This module provides functions to fetch real production data from GitHub Issues
//! and compute live system metrics.

use crate::http::routes::{Agent, AgentCategory, AgentColor, AgentStatus, SystemStatus};
use anyhow::{Context, Result};
use miyabi_github::GitHubClient;
use octocrab::params::State;
use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant};
use tracing::{debug, warn};

/// Global cache instance
static GLOBAL_CACHE: OnceLock<Arc<Mutex<DataCache>>> = OnceLock::new();

/// Cache entry with expiration
#[derive(Clone)]
struct CachedData<T: Clone> {
    data: T,
    expires_at: Instant,
}

/// In-memory cache for GitHub API responses
struct DataCache {
    agents: Option<CachedData<Vec<Agent>>>,
    system_status: Option<CachedData<SystemStatus>>,
}

impl DataCache {
    fn new() -> Arc<Mutex<Self>> {
        Arc::new(Mutex::new(DataCache {
            agents: None,
            system_status: None,
        }))
    }

    fn get_agents(&self) -> Option<Vec<Agent>> {
        self.agents.as_ref().and_then(|cached| {
            if cached.expires_at > Instant::now() {
                debug!("Cache hit for agents");
                Some(cached.data.clone())
            } else {
                debug!("Cache expired for agents");
                None
            }
        })
    }

    fn set_agents(&mut self, data: Vec<Agent>, ttl: Duration) {
        self.agents = Some(CachedData {
            data,
            expires_at: Instant::now() + ttl,
        });
        debug!("Cached agents data with TTL: {:?}", ttl);
    }

    fn get_system_status(&self) -> Option<SystemStatus> {
        self.system_status.as_ref().and_then(|cached| {
            if cached.expires_at > Instant::now() {
                debug!("Cache hit for system status");
                Some(cached.data.clone())
            } else {
                debug!("Cache expired for system status");
                None
            }
        })
    }

    fn set_system_status(&mut self, data: SystemStatus, ttl: Duration) {
        self.system_status = Some(CachedData {
            data,
            expires_at: Instant::now() + ttl,
        });
        debug!("Cached system status with TTL: {:?}", ttl);
    }
}

/// Retry with exponential backoff
async fn retry_with_backoff<F, Fut, T>(mut operation: F) -> Result<T>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = Result<T>>,
{
    const MAX_RETRIES: u32 = 3;
    const BASE_DELAY_MS: u64 = 1000;

    let mut last_error = None;

    for attempt in 0..MAX_RETRIES {
        match operation().await {
            Ok(result) => {
                if attempt > 0 {
                    debug!("Retry succeeded on attempt {}", attempt + 1);
                }
                return Ok(result);
            }
            Err(e) => {
                warn!("Attempt {} failed: {}", attempt + 1, e);
                last_error = Some(e);

                // Don't sleep after last attempt
                if attempt < MAX_RETRIES - 1 {
                    let delay = Duration::from_millis(BASE_DELAY_MS * 2_u64.pow(attempt));
                    debug!("Retrying in {:?}", delay);
                    tokio::time::sleep(delay).await;
                }
            }
        }
    }

    Err(last_error.unwrap())
}

/// Get the global cache instance
fn get_cache() -> Arc<Mutex<DataCache>> {
    GLOBAL_CACHE
        .get_or_init(|| DataCache::new())
        .clone()
}

/// Fetch real agents data from GitHub Issues (with caching and retry)
pub async fn fetch_real_agents() -> Result<Vec<Agent>> {
    const CACHE_TTL: Duration = Duration::from_secs(60);

    // Check cache first
    let cache = get_cache();
    if let Some(cached) = cache.lock().unwrap().get_agents() {
        return Ok(cached);
    }

    // Fetch with retry
    let result = retry_with_backoff(|| async {
        fetch_real_agents_impl().await
    }).await;

    // Update cache on success
    if let Ok(ref agents) = result {
        cache.lock().unwrap().set_agents(agents.clone(), CACHE_TTL);
    } else {
        warn!("Failed to fetch agents after retries, checking for stale cache");
        // Return stale cache if available
        if let Some(cached) = cache.lock().unwrap().agents.as_ref() {
            warn!("Returning stale cached agents data");
            return Ok(cached.data.clone());
        }
    }

    result
}

/// Internal implementation of fetch_real_agents
async fn fetch_real_agents_impl() -> Result<Vec<Agent>> {
    let token = std::env::var("GITHUB_TOKEN").context("GITHUB_TOKEN not set")?;
    let owner = std::env::var("GITHUB_REPOSITORY_OWNER")
        .unwrap_or_else(|_| "ShunsukeHayashi".to_string());
    let repo = std::env::var("GITHUB_REPOSITORY")
        .unwrap_or_else(|_| "ShunsukeHayashi/miyabi-private".to_string())
        .split('/')
        .nth(1)
        .unwrap_or("miyabi-private")
        .to_string();

    let client = GitHubClient::new(&token, &owner, &repo)?;

    // Fetch all open issues with agent labels
    let issues = client.list_issues(Some(State::Open), vec![]).await?;

    // Group issues by agent type
    let mut agent_stats: HashMap<String, AgentData> = HashMap::new();

    // Initialize all 21 agents
    initialize_agents(&mut agent_stats);

    // Count tasks per agent from issues
    for issue in &issues {
        for label in &issue.labels {
            if label.starts_with("🤖 agent:") {
                let agent_name = label.strip_prefix("🤖 agent:").unwrap_or("unknown");
                if let Some(data) = agent_stats.get_mut(agent_name) {
                    data.tasks += 1;

                    // Determine status from state labels
                    if issue.labels.iter().any(|l| l.contains("state:implementing")) {
                        data.status = AgentStatus::Working;
                    } else if issue.labels.iter().any(|l| l.contains("state:analyzing")) {
                        data.status = AgentStatus::Active;
                    }
                }
            }
        }
    }

    // Convert to Agent vec
    let agents: Vec<Agent> = agent_stats
        .into_iter()
        .map(|(name, data)| Agent {
            id: data.id,
            name: get_japanese_name(&name),
            role: name.clone(),
            category: data.category,
            status: data.status,
            tasks: data.tasks,
            color: data.color,
            description: get_description(&name),
        })
        .collect();

    Ok(agents)
}

/// Fetch real system status (with caching and retry)
pub async fn fetch_real_system_status() -> Result<SystemStatus> {
    const CACHE_TTL: Duration = Duration::from_secs(60);

    // Check cache first
    let cache = get_cache();
    if let Some(cached) = cache.lock().unwrap().get_system_status() {
        return Ok(cached);
    }

    // Fetch with retry
    let result = retry_with_backoff(|| async {
        fetch_real_system_status_impl().await
    }).await;

    // Update cache on success
    if let Ok(ref status) = result {
        cache.lock().unwrap().set_system_status(status.clone(), CACHE_TTL);
    } else {
        warn!("Failed to fetch system status after retries, checking for stale cache");
        // Return stale cache if available
        if let Some(cached) = cache.lock().unwrap().system_status.as_ref() {
            warn!("Returning stale cached system status");
            return Ok(cached.data.clone());
        }
    }

    result
}

/// Internal implementation of fetch_real_system_status
async fn fetch_real_system_status_impl() -> Result<SystemStatus> {
    let token = std::env::var("GITHUB_TOKEN").context("GITHUB_TOKEN not set")?;
    let owner = std::env::var("GITHUB_REPOSITORY_OWNER")
        .unwrap_or_else(|_| "ShunsukeHayashi".to_string());
    let repo = std::env::var("GITHUB_REPOSITORY")
        .unwrap_or_else(|_| "ShunsukeHayashi/miyabi-private".to_string())
        .split('/')
        .nth(1)
        .unwrap_or("miyabi-private")
        .to_string();

    let client = GitHubClient::new(&token, &owner, &repo)?;

    // Fetch all issues
    let open_issues = client.list_issues(Some(State::Open), vec![]).await?;

    // Count active tasks (issues with agent labels)
    let active_tasks = open_issues
        .iter()
        .filter(|i| i.labels.iter().any(|l| l.starts_with("🤖 agent:")))
        .count() as u32;

    // Count active agents (agents with tasks)
    let mut active_agents_set = std::collections::HashSet::new();
    for issue in &open_issues {
        for label in &issue.labels {
            if label.starts_with("🤖 agent:") {
                if let Some(state) = issue
                    .labels
                    .iter()
                    .find(|l| l.contains("state:implementing") || l.contains("state:analyzing"))
                {
                    if !state.is_empty() {
                        active_agents_set.insert(label.clone());
                    }
                }
            }
        }
    }
    let active_agents = active_agents_set.len() as u32;

    // Calculate task throughput (issues closed in last 24h)
    let closed_issues = client.list_issues(Some(State::Closed), vec![]).await?;
    let now = chrono::Utc::now();
    let day_ago = now - chrono::Duration::hours(24);

    let recent_closed = closed_issues
        .iter()
        .filter(|i| i.updated_at > day_ago)
        .count();

    let task_throughput = (recent_closed as f64 / 24.0) * 100.0; // tasks per 100 hours

    // Calculate average completion time using updated_at - created_at
    let avg_completion_time = if !closed_issues.is_empty() {
        let total_time: f64 = closed_issues
            .iter()
            .map(|i| (i.updated_at - i.created_at).num_minutes() as f64 / 60.0)
            .sum();
        total_time / closed_issues.len() as f64
    } else {
        0.0
    };

    Ok(SystemStatus {
        status: "healthy".to_string(),
        active_agents,
        total_agents: 21,
        active_tasks,
        queued_tasks: (open_issues.len() as u32).saturating_sub(active_tasks),
        task_throughput,
        avg_completion_time,
    })
}

#[derive(Debug)]
struct AgentData {
    id: u32,
    category: AgentCategory,
    status: AgentStatus,
    color: AgentColor,
    tasks: u32,
}

fn initialize_agents(map: &mut HashMap<String, AgentData>) {
    // Leaders
    map.insert(
        "Coordinator".to_string(),
        AgentData {
            id: 1,
            category: AgentCategory::Coding,
            status: AgentStatus::Idle,
            color: AgentColor::Leader,
            tasks: 0,
        },
    );
    map.insert(
        "AIEntrepreneur".to_string(),
        AgentData {
            id: 2,
            category: AgentCategory::Business,
            status: AgentStatus::Idle,
            color: AgentColor::Leader,
            tasks: 0,
        },
    );

    // Coding Executors
    map.insert(
        "CodeGen".to_string(),
        AgentData {
            id: 3,
            category: AgentCategory::Coding,
            status: AgentStatus::Idle,
            color: AgentColor::Executor,
            tasks: 0,
        },
    );
    map.insert(
        "Review".to_string(),
        AgentData {
            id: 4,
            category: AgentCategory::Coding,
            status: AgentStatus::Idle,
            color: AgentColor::Executor,
            tasks: 0,
        },
    );
    map.insert(
        "Issue".to_string(),
        AgentData {
            id: 5,
            category: AgentCategory::Coding,
            status: AgentStatus::Idle,
            color: AgentColor::Executor,
            tasks: 0,
        },
    );
    map.insert(
        "PR".to_string(),
        AgentData {
            id: 6,
            category: AgentCategory::Coding,
            status: AgentStatus::Idle,
            color: AgentColor::Executor,
            tasks: 0,
        },
    );
    map.insert(
        "Deployment".to_string(),
        AgentData {
            id: 7,
            category: AgentCategory::Coding,
            status: AgentStatus::Idle,
            color: AgentColor::Executor,
            tasks: 0,
        },
    );

    // Business Executors
    for (id, name) in [
        (8, "ContentCreation"),
        (9, "Marketing"),
        (10, "SNSStrategy"),
        (11, "YouTube"),
        (12, "Sales"),
        (13, "CRM"),
        (14, "Analytics"),
    ] {
        map.insert(
            name.to_string(),
            AgentData {
                id,
                category: AgentCategory::Business,
                status: AgentStatus::Idle,
                color: AgentColor::Executor,
                tasks: 0,
            },
        );
    }

    // Analysts
    for (id, name, category) in [
        (15, "SelfAnalysis", AgentCategory::Business),
        (16, "MarketResearch", AgentCategory::Business),
        (17, "ProductConcept", AgentCategory::Business),
        (18, "ProductDesign", AgentCategory::Business),
        (19, "Persona", AgentCategory::Business),
    ] {
        map.insert(
            name.to_string(),
            AgentData {
                id,
                category,
                status: AgentStatus::Idle,
                color: AgentColor::Analyst,
                tasks: 0,
            },
        );
    }

    // Support
    map.insert(
        "FunnelDesign".to_string(),
        AgentData {
            id: 20,
            category: AgentCategory::Business,
            status: AgentStatus::Idle,
            color: AgentColor::Support,
            tasks: 0,
        },
    );
    map.insert(
        "Hooks".to_string(),
        AgentData {
            id: 21,
            category: AgentCategory::Coding,
            status: AgentStatus::Idle,
            color: AgentColor::Support,
            tasks: 0,
        },
    );
}

fn get_japanese_name(agent_type: &str) -> String {
    match agent_type {
        "Coordinator" => "しきるん",
        "AIEntrepreneur" => "あきんどさん",
        "CodeGen" => "つくるん",
        "Review" => "めだまん",
        "Issue" => "まとめるん",
        "PR" => "でこぼこん",
        "Deployment" => "はこぶん",
        "ContentCreation" => "かくちゃん",
        "Marketing" => "ひろめるん",
        "SNSStrategy" => "つぶやきん",
        "YouTube" => "どうがん",
        "Sales" => "うるるん",
        "CRM" => "おもてなしん",
        "Analytics" => "かぞえるん",
        "SelfAnalysis" => "みつけるん",
        "MarketResearch" => "しらべるん",
        "ProductConcept" => "きめるん",
        "ProductDesign" => "せっけいん",
        "Persona" => "よむるん",
        "FunnelDesign" => "みちびくん",
        "Hooks" => "つなぐん",
        _ => "不明",
    }
    .to_string()
}

fn get_description(agent_type: &str) -> String {
    match agent_type {
        "Coordinator" => "タスク統括・DAG分解",
        "AIEntrepreneur" => "ビジネスプラン統括",
        "CodeGen" => "AI駆動コード生成",
        "Review" => "コード品質レビュー",
        "Issue" => "Issue分析・ラベリング",
        "PR" => "Pull Request自動作成",
        "Deployment" => "CI/CDデプロイ自動化",
        "ContentCreation" => "コンテンツ制作",
        "Marketing" => "マーケティング施策",
        "SNSStrategy" => "SNS戦略立案",
        "YouTube" => "YouTube運用最適化",
        "Sales" => "セールスプロセス最適化",
        "CRM" => "顧客管理・満足度向上",
        "Analytics" => "データ分析・PDCA",
        "SelfAnalysis" => "自己分析・キャリア",
        "MarketResearch" => "市場調査・競合分析",
        "ProductConcept" => "プロダクトコンセプト設計",
        "ProductDesign" => "サービス詳細設計",
        "Persona" => "ペルソナ設定",
        "FunnelDesign" => "導線設計",
        "Hooks" => "ライフサイクルフック統合",
        _ => "説明なし",
    }
    .to_string()
}

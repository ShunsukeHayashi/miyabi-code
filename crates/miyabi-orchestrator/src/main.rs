use std::net::{IpAddr, SocketAddr};
use std::path::PathBuf;
use std::sync::Arc;

use anyhow::Result;
use axum::extract::State;
use axum::routing::get;
use axum::{Json, Router};
use clap::Parser;
use serde::Serialize;
use tokio::net::TcpListener;
use tokio::signal;
use tracing::{info, warn};
use tracing_subscriber::EnvFilter;

/// CLI arguments for the orchestrator service.
#[derive(Debug, Parser)]
#[command(name = "miyabi-orchestrator")]
#[command(about = "Claude session orchestrator control plane")]
pub struct Cli {
    /// HTTP host to bind.
    #[arg(long, default_value = "127.0.0.1")]
    pub host: IpAddr,

    /// HTTP port to listen on.
    #[arg(long, default_value_t = 8080)]
    pub port: u16,

    /// Maximum number of concurrent Claude CLI invocations.
    #[arg(long, default_value_t = 4)]
    pub max_concurrent_sessions: usize,

    /// Path to the Claude CLI binary.
    #[arg(long, env = "CLAUDE_BINARY_PATH", default_value = "claude")]
    pub claude_binary: PathBuf,

    /// Path to the session store database (SQLite URL or file path).
    #[arg(long, env = "MIYABI_ORCHESTRATOR_DATABASE", default_value = "sqlite://usage.sqlite")]
    pub database_url: String,
}

/// Runtime configuration derived from CLI arguments.
#[derive(Debug, Clone)]
pub struct OrchestratorConfig {
    pub bind_addr: SocketAddr,
    pub max_concurrent_sessions: usize,
    pub claude_binary: PathBuf,
    pub database_url: String,
}

impl OrchestratorConfig {
    fn from(cli: Cli) -> Self {
        let bind_addr = SocketAddr::new(cli.host, cli.port);
        Self {
            bind_addr,
            max_concurrent_sessions: cli.max_concurrent_sessions.max(1),
            claude_binary: cli.claude_binary,
            database_url: cli.database_url,
        }
    }
}

/// Shared runtime state.
#[derive(Clone)]
pub struct AppState {
    pub config: OrchestratorConfig,
    pub sessions: Arc<SessionScheduler>,
}

/// Placeholder session scheduler.
#[derive(Debug)]
pub struct SessionScheduler {
    max_concurrent: usize,
}

impl SessionScheduler {
    pub fn new(max_concurrent: usize) -> Self {
        Self {
            max_concurrent,
        }
    }
}

#[derive(Debug, Serialize)]
struct HealthPayload {
    status: &'static str,
    max_concurrent_sessions: usize,
}

async fn health(State(state): State<AppState>) -> Json<HealthPayload> {
    Json(HealthPayload {
        status: "ok",
        max_concurrent_sessions: state.sessions.max_concurrent,
    })
}

fn router(state: AppState) -> Router {
    Router::new()
        .route("/healthz", get(health))
        .with_state(state)
}

#[tokio::main]
async fn main() -> Result<()> {
    init_tracing();

    let cli = Cli::parse();
    let config = OrchestratorConfig::from(cli);

    info!(
        host = %config.bind_addr.ip(),
        port = config.bind_addr.port(),
        "starting miyabi-orchestrator"
    );

    let scheduler = SessionScheduler::new(config.max_concurrent_sessions);
    let state = AppState {
        config: config.clone(),
        sessions: Arc::new(scheduler),
    };

    let listener = TcpListener::bind(config.bind_addr).await?;
    let app = router(state);

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    info!("miyabi-orchestrator shutdown complete");
    Ok(())
}

fn init_tracing() {
    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| {
        EnvFilter::new("miyabi_orchestrator=debug,info")
    });

    tracing_subscriber::fmt()
        .with_env_filter(env_filter)
        .with_target(false)
        .compact()
        .init();
}

async fn shutdown_signal() {
    if signal::ctrl_c().await.is_ok() {
        warn!("shutdown signal received (ctrl-c)");
    }
}

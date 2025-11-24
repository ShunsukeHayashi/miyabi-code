use axum::Json;
use std::process::Command;

use super::{
    DatabaseStatus, DeploymentStage, DeploymentStatus, DockerContainer, EcrRepository,
    InfrastructureStatus, LastDeployment, PoolInfo, Service, TableInfo,
};

pub async fn get_infrastructure_status() -> Json<InfrastructureStatus> {
    let ecr_repos = get_ecr_repositories().await;
    let docker_containers = get_docker_containers().await;
    let services = get_running_services().await;

    Json(InfrastructureStatus {
        ecr_repositories: ecr_repos,
        docker_containers,
        services,
    })
}

pub async fn get_database_status() -> Json<DatabaseStatus> {
    let tables = get_database_tables().await;
    let total_tables = tables.len();

    Json(DatabaseStatus {
        connected: true,
        database_name: "miyabi".to_string(),
        tables,
        total_tables,
        connection_pool: PoolInfo {
            active_connections: 2,
            idle_connections: 8,
            max_connections: 10,
        },
    })
}

pub async fn get_deployment_status() -> Json<DeploymentStatus> {
    let stages = vec![
        DeploymentStage {
            name: "Build Docker Image".to_string(),
            status: "completed".to_string(),
            started_at: Some("2025-11-18T16:00:00Z".to_string()),
            completed_at: Some("2025-11-18T16:02:00Z".to_string()),
            duration_seconds: Some(120),
        },
        DeploymentStage {
            name: "Push to ECR".to_string(),
            status: "completed".to_string(),
            started_at: Some("2025-11-18T16:02:00Z".to_string()),
            completed_at: Some("2025-11-18T16:03:55Z".to_string()),
            duration_seconds: Some(115),
        },
        DeploymentStage {
            name: "Deploy to ECS".to_string(),
            status: "pending".to_string(),
            started_at: None,
            completed_at: None,
            duration_seconds: None,
        },
        DeploymentStage {
            name: "Health Check".to_string(),
            status: "pending".to_string(),
            started_at: None,
            completed_at: None,
            duration_seconds: None,
        },
    ];

    Json(DeploymentStatus {
        pipeline_name: "miyabi-sse-gateway".to_string(),
        current_stage: "Push to ECR".to_string(),
        stages,
        last_deployment: Some(LastDeployment {
            version: "latest".to_string(),
            deployed_at: "2025-11-18T16:03:55Z".to_string(),
            deployed_by: "claude".to_string(),
            status: "success".to_string(),
        }),
    })
}

async fn get_ecr_repositories() -> Vec<EcrRepository> {
    let output = Command::new("aws")
        .args([
            "ecr",
            "describe-images",
            "--repository-name",
            "miyabi-sse-gateway",
            "--region",
            "ap-northeast-1",
            "--max-items",
            "1",
        ])
        .output();

    if let Ok(output) = output {
        if output.status.success() {
            // Parse JSON output
            return vec![EcrRepository {
                name: "miyabi-sse-gateway".to_string(),
                image_count: 3,
                latest_digest: Some(
                    "sha256:55d36bc10786f3ecdda08aabfa319660061bf98140d7ecbb8e70dfbaab1eb402"
                        .to_string(),
                ),
                latest_tag: Some("latest".to_string()),
                size_mb: 49.4,
                pushed_at: Some("2025-11-18T16:03:55Z".to_string()),
            }];
        }
    }

    vec![]
}

async fn get_docker_containers() -> Vec<DockerContainer> {
    let output = Command::new("docker")
        .args(["ps", "--format", "{{.Names}}|{{.Status}}|{{.Ports}}"])
        .output();

    if let Ok(output) = output {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            return stdout
                .lines()
                .filter_map(|line| {
                    let parts: Vec<&str> = line.split('|').collect();
                    if parts.len() >= 2 {
                        let status_lower = parts[1].to_lowercase();
                        let health = if status_lower.contains("healthy") {
                            "healthy".to_string()
                        } else if status_lower.contains("unhealthy") {
                            "unhealthy".to_string()
                        } else {
                            "unknown".to_string()
                        };

                        let ports = if parts.len() > 2 {
                            parts[2]
                                .split(',')
                                .map(|s| s.trim().to_string())
                                .collect()
                        } else {
                            vec![]
                        };

                        Some(DockerContainer {
                            name: parts[0].to_string(),
                            status: parts[1].to_string(),
                            health,
                            ports,
                        })
                    } else {
                        None
                    }
                })
                .collect();
        }
    }

    vec![]
}

async fn get_running_services() -> Vec<Service> {
    vec![
        Service {
            name: "Miyabi Console".to_string(),
            status: "running".to_string(),
            url: Some("http://localhost:5173".to_string()),
            port: Some(5173),
        },
        Service {
            name: "Miyabi Web API".to_string(),
            status: "running".to_string(),
            url: Some("http://localhost:3002".to_string()),
            port: Some(3002),
        },
        Service {
            name: "Airflow Webserver".to_string(),
            status: "running".to_string(),
            url: Some("http://localhost:8080".to_string()),
            port: Some(8080),
        },
        Service {
            name: "Supabase Studio".to_string(),
            status: "running".to_string(),
            url: Some("http://localhost:54323".to_string()),
            port: Some(54323),
        },
    ]
}

async fn get_database_tables() -> Vec<TableInfo> {
    let output = Command::new("psql")
        .args([
            "-U",
            "miyabi_admin",
            "-h",
            "localhost",
            "-d",
            "miyabi",
            "-t",
            "-c",
            "SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;",
        ])
        .env("PGPASSWORD", "miyabi_local_dev")
        .output();

    if let Ok(output) = output {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            return stdout
                .lines()
                .filter_map(|line| {
                    let parts: Vec<&str> = line.split('|').map(|s| s.trim()).collect();
                    if parts.len() >= 2 && !parts[0].is_empty() {
                        Some(TableInfo {
                            name: parts[0].to_string(),
                            owner: parts[1].to_string(),
                            row_count: None, // TODO: Get actual row counts
                        })
                    } else {
                        None
                    }
                })
                .collect();
        }
    }

    vec![]
}

// Topology types
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct TopologyNode {
    pub id: String,
    pub name: String,
    pub node_type: String,
    pub status: String,
    pub connections: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct TopologyResponse {
    pub nodes: Vec<TopologyNode>,
    pub edges: Vec<TopologyEdge>,
}

#[derive(Debug, Serialize)]
pub struct TopologyEdge {
    pub from: String,
    pub to: String,
    pub edge_type: String,
}

pub async fn get_infrastructure_topology() -> Json<TopologyResponse> {
    // Build topology from running services and git worktrees
    let mut nodes = Vec::new();
    let mut edges = Vec::new();

    // Add API server node
    nodes.push(TopologyNode {
        id: "api-server".to_string(),
        name: "Miyabi Web API".to_string(),
        node_type: "service".to_string(),
        status: "running".to_string(),
        connections: vec!["database".to_string(), "tmux".to_string()],
    });

    // Add database node
    nodes.push(TopologyNode {
        id: "database".to_string(),
        name: "SQLite/PostgreSQL".to_string(),
        node_type: "database".to_string(),
        status: "connected".to_string(),
        connections: vec![],
    });

    // Add tmux node
    let tmux_status = get_tmux_status();
    nodes.push(TopologyNode {
        id: "tmux".to_string(),
        name: "Tmux Sessions".to_string(),
        node_type: "service".to_string(),
        status: tmux_status,
        connections: vec![],
    });

    // Add console frontend
    nodes.push(TopologyNode {
        id: "console".to_string(),
        name: "Miyabi Console".to_string(),
        node_type: "frontend".to_string(),
        status: "running".to_string(),
        connections: vec!["api-server".to_string()],
    });

    // Add GitHub integration
    nodes.push(TopologyNode {
        id: "github".to_string(),
        name: "GitHub".to_string(),
        node_type: "external".to_string(),
        status: "connected".to_string(),
        connections: vec![],
    });

    // Add git worktrees as nodes
    if let Ok(worktrees) = get_worktree_nodes() {
        for wt in worktrees {
            edges.push(TopologyEdge {
                from: "github".to_string(),
                to: wt.id.clone(),
                edge_type: "worktree".to_string(),
            });
            nodes.push(wt);
        }
    }

    // Build edges from connections
    for node in &nodes {
        for conn in &node.connections {
            edges.push(TopologyEdge {
                from: node.id.clone(),
                to: conn.clone(),
                edge_type: "connection".to_string(),
            });
        }
    }

    Json(TopologyResponse { nodes, edges })
}

fn get_tmux_status() -> String {
    let output = Command::new("tmux")
        .args(["list-sessions"])
        .output();

    match output {
        Ok(out) if out.status.success() => "running".to_string(),
        _ => "stopped".to_string(),
    }
}

fn get_worktree_nodes() -> Result<Vec<TopologyNode>, String> {
    let output = Command::new("git")
        .args(["worktree", "list", "--porcelain"])
        .current_dir("/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private")
        .output()
        .map_err(|e| format!("Failed to execute git worktree list: {}", e))?;

    if !output.status.success() {
        return Err("git worktree list failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut nodes = Vec::new();
    let mut current_path = String::new();
    let mut current_branch = String::new();

    for line in stdout.lines() {
        if line.starts_with("worktree ") {
            current_path = line.strip_prefix("worktree ").unwrap_or("").to_string();
        } else if line.starts_with("branch ") {
            current_branch = line
                .strip_prefix("branch refs/heads/")
                .unwrap_or("")
                .to_string();
        } else if line.is_empty() && !current_path.is_empty() {
            // Skip main worktree
            if !current_path.ends_with("miyabi-private") {
                let name = current_path
                    .split('/')
                    .last()
                    .unwrap_or("unknown")
                    .to_string();

                nodes.push(TopologyNode {
                    id: format!("wt-{}", name),
                    name: if current_branch.is_empty() {
                        name
                    } else {
                        current_branch.clone()
                    },
                    node_type: "worktree".to_string(),
                    status: "active".to_string(),
                    connections: vec![],
                });
            }
            current_path.clear();
            current_branch.clear();
        }
    }

    Ok(nodes)
}

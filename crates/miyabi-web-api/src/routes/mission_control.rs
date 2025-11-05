//! Mission Control Dashboard endpoint
//!
//! Provides unified view of agent execution state, TMUX sessions,
//! timeline events, preflight checks, and worktree status

use axum::{extract::Query, routing::get, Json, Router};
use serde::{Deserialize, Serialize};

use super::{agents, preflight, timeline, tmux, worktrees};

/// Mission Control dashboard response
#[derive(Serialize)]
pub struct MissionControlResponse {
    /// Overall system status
    pub status: SystemHealthStatus,
    /// Agent execution summary
    pub agents: AgentsSummary,
    /// TMUX sessions summary
    pub tmux: TmuxSummary,
    /// Timeline statistics
    pub timeline: TimelineSummary,
    /// Preflight checks status
    pub preflight: PreflightSummary,
    /// Worktrees status
    pub worktrees: WorktreesSummary,
    /// Timestamp of this snapshot
    pub timestamp: String,
}

/// Overall system health status
#[derive(Serialize, Debug, Clone, Copy, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SystemHealthStatus {
    Healthy,
    Degraded,
    Unhealthy,
}

/// Agents summary
#[derive(Serialize, Debug)]
pub struct AgentsSummary {
    pub total_agents: usize,
    pub coding_agents: usize,
    pub business_agents: usize,
    pub idle_agents: usize,
    pub running_agents: usize,
}

/// TMUX sessions summary
#[derive(Serialize, Debug)]
pub struct TmuxSummary {
    pub active_sessions: usize,
    pub total_windows: usize,
    pub total_panes: usize,
    pub assigned_panes: usize, // Panes with agents assigned
}

/// Timeline summary
#[derive(Serialize, Debug)]
pub struct TimelineSummary {
    pub total_events: usize,
    pub recent_events_count: usize,
    pub running_tasks: usize,
    pub idle_tasks: usize,
    pub failed_tasks: usize,
}

/// Preflight checks summary
#[derive(Serialize, Debug)]
pub struct PreflightSummary {
    pub status: preflight::SystemStatus,
    pub passed_checks: usize,
    pub failed_checks: usize,
    pub total_checks: usize,
}

/// Worktrees summary
#[derive(Serialize, Debug)]
pub struct WorktreesSummary {
    pub active_worktrees: usize,
    pub total_branches: usize,
}

/// Query parameters for mission control endpoint
#[derive(Deserialize)]
pub struct MissionControlQuery {
    /// Include detailed data (default: false)
    #[serde(default)]
    pub detailed: bool,
}

/// Get Mission Control dashboard status
pub async fn get_mission_control_status(
    Query(_params): Query<MissionControlQuery>,
) -> Json<MissionControlResponse> {
    // Gather data from all subsystems
    let agents_data = agents::list_agents().await.0;
    let tmux_data = tmux::list_sessions().await.0;
    let timeline_data = timeline::get_timeline(Query(timeline::TimelineQuery { window: 100 }))
        .await
        .0;
    let preflight_data = preflight::preflight_checks().await.0;
    let worktrees_data = worktrees::list_worktrees().await.0;

    // Calculate agents summary
    let agents_summary = AgentsSummary {
        total_agents: agents_data.agents.len(),
        coding_agents: agents_data
            .agents
            .iter()
            .filter(|a| matches!(a.agent_type, agents::AgentType::Coding))
            .count(),
        business_agents: agents_data
            .agents
            .iter()
            .filter(|a| matches!(a.agent_type, agents::AgentType::Business))
            .count(),
        idle_agents: agents_data
            .agents
            .iter()
            .filter(|a| a.status == "idle")
            .count(),
        running_agents: agents_data
            .agents
            .iter()
            .filter(|a| a.status == "running")
            .count(),
    };

    // Calculate TMUX summary
    let total_windows: usize = tmux_data
        .sessions
        .iter()
        .map(|s| s.windows.len())
        .sum();
    let total_panes: usize = tmux_data
        .sessions
        .iter()
        .flat_map(|s| &s.windows)
        .map(|w| w.panes.len())
        .sum();
    let assigned_panes: usize = tmux_data
        .sessions
        .iter()
        .flat_map(|s| &s.windows)
        .flat_map(|w| &w.panes)
        .filter(|p| p.agent.is_some())
        .count();

    let tmux_summary = TmuxSummary {
        active_sessions: tmux_data.total_count,
        total_windows,
        total_panes,
        assigned_panes,
    };

    // Calculate timeline summary
    let timeline_summary = TimelineSummary {
        total_events: timeline_data.summary.total_events,
        recent_events_count: timeline_data.recent_events.len(),
        running_tasks: timeline_data.summary.run_count,
        idle_tasks: timeline_data.summary.idle_count,
        failed_tasks: timeline_data.summary.dead_count,
    };

    // Calculate preflight summary
    let passed_checks = preflight_data
        .checks
        .iter()
        .filter(|c| matches!(c.status, preflight::CheckStatus::Pass))
        .count();
    let failed_checks = preflight_data.checks.len() - passed_checks;

    let preflight_summary = PreflightSummary {
        status: preflight_data.status,
        passed_checks,
        failed_checks,
        total_checks: preflight_data.checks.len(),
    };

    // Calculate worktrees summary
    let worktrees_summary = WorktreesSummary {
        active_worktrees: worktrees_data.worktrees.len(),
        total_branches: worktrees_data.worktrees.len(),
    };

    // Determine overall system health
    let status = determine_overall_health(
        &preflight_data.status,
        &timeline_summary,
        agents_summary.running_agents,
    );

    Json(MissionControlResponse {
        status,
        agents: agents_summary,
        tmux: tmux_summary,
        timeline: timeline_summary,
        preflight: preflight_summary,
        worktrees: worktrees_summary,
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

/// Determine overall system health based on subsystem status
fn determine_overall_health(
    preflight_status: &preflight::SystemStatus,
    timeline: &TimelineSummary,
    running_agents: usize,
) -> SystemHealthStatus {
    // System is unhealthy if preflight checks are unhealthy
    if matches!(preflight_status, preflight::SystemStatus::Unhealthy) {
        return SystemHealthStatus::Unhealthy;
    }

    // System is degraded if there are failed tasks or preflight is degraded
    if timeline.failed_tasks > 0
        || matches!(preflight_status, preflight::SystemStatus::Degraded)
    {
        return SystemHealthStatus::Degraded;
    }

    // System is healthy if preflight is healthy and agents are running
    if matches!(preflight_status, preflight::SystemStatus::Healthy) || running_agents > 0 {
        return SystemHealthStatus::Healthy;
    }

    // Default to degraded if we can't determine
    SystemHealthStatus::Degraded
}

/// Detailed mission control data (includes all subsystem details)
#[derive(Serialize)]
pub struct MissionControlDetailedResponse {
    pub summary: MissionControlResponse,
    pub agents_detail: agents::AgentsListResponse,
    pub tmux_detail: tmux::SessionsListResponse,
    pub timeline_detail: timeline::TimelineResponse,
    pub preflight_detail: preflight::PreflightResponse,
    pub worktrees_detail: worktrees::WorktreesListResponse,
}

/// Get detailed Mission Control dashboard data
pub async fn get_mission_control_detailed() -> Json<MissionControlDetailedResponse> {
    let summary = get_mission_control_status(Query(MissionControlQuery { detailed: false }))
        .await
        .0;

    let agents_detail = agents::list_agents().await.0;
    let tmux_detail = tmux::list_sessions().await.0;
    let timeline_detail =
        timeline::get_timeline(Query(timeline::TimelineQuery { window: 100 }))
            .await
            .0;
    let preflight_detail = preflight::preflight_checks().await.0;
    let worktrees_detail = worktrees::list_worktrees().await.0;

    Json(MissionControlDetailedResponse {
        summary,
        agents_detail,
        tmux_detail,
        timeline_detail,
        preflight_detail,
        worktrees_detail,
    })
}

/// Create router for Mission Control endpoints
pub fn routes() -> Router {
    Router::new()
        .route("/", get(get_mission_control_status))
        .route("/detailed", get(get_mission_control_detailed))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_determine_overall_health_unhealthy() {
        let result = determine_overall_health(
            &preflight::SystemStatus::Unhealthy,
            &TimelineSummary {
                total_events: 100,
                recent_events_count: 10,
                running_tasks: 5,
                idle_tasks: 3,
                failed_tasks: 0,
            },
            5,
        );
        assert_eq!(result, SystemHealthStatus::Unhealthy);
    }

    #[test]
    fn test_determine_overall_health_degraded() {
        let result = determine_overall_health(
            &preflight::SystemStatus::Healthy,
            &TimelineSummary {
                total_events: 100,
                recent_events_count: 10,
                running_tasks: 5,
                idle_tasks: 3,
                failed_tasks: 2, // Has failed tasks
            },
            5,
        );
        assert_eq!(result, SystemHealthStatus::Degraded);
    }

    #[test]
    fn test_determine_overall_health_healthy() {
        let result = determine_overall_health(
            &preflight::SystemStatus::Healthy,
            &TimelineSummary {
                total_events: 100,
                recent_events_count: 10,
                running_tasks: 5,
                idle_tasks: 3,
                failed_tasks: 0,
            },
            5,
        );
        assert_eq!(result, SystemHealthStatus::Healthy);
    }
}

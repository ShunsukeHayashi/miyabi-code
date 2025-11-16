//! Hook system integration for orchestrator events
//!
//! This module provides utilities to call Claude Code hooks
//! for narrating orchestrator behaviors via VOICEVOX.
//!
//! # Overview
//!
//! The hook system enables complete behavior transparency by
//! narrating all orchestrator-level events through VOICEVOX audio.
//!
//! # Hook Types
//!
//! - **orchestrator-event**: 5-Worlds execution, Winner selection, Cost tracking
//! - **circuit-breaker-event**: Circuit breaker state changes
//! - **dynamic-scaling-event**: Resource management and scaling
//! - **feedback-loop-event**: Iterative improvement and convergence
//!
//! # Example
//!
//! ```no_run
//! use std::collections::HashMap;
//! use miyabi_orchestrator::hooks;
//!
//! let mut params = HashMap::new();
//! params.insert("ISSUE_NUMBER".to_string(), "270".to_string());
//! params.insert("TASK_TITLE".to_string(), "Implement auth".to_string());
//! hooks::notify_orchestrator_event("five_worlds_start", params);
//! ```

use std::collections::HashMap;
use std::process::Command;
use tracing::{debug, warn};

/// Calls a Claude Code hook with event parameters
///
/// # Arguments
/// * `hook_name` - Name of the hook script (e.g., "orchestrator-event")
/// * `event_type` - Type of event (e.g., "five_worlds_start")
/// * `params` - Event parameters as key-value pairs
///
/// # Implementation Notes
///
/// - Hook calls are **non-blocking** (spawn background process)
/// - Failures are logged but don't interrupt execution
/// - Hooks are skipped if script file doesn't exist
///
/// # Example
/// ```no_run
/// use std::collections::HashMap;
/// use miyabi_orchestrator::hooks::call_hook;
///
/// let mut params = HashMap::new();
/// params.insert("ISSUE_NUMBER".to_string(), "270".to_string());
/// params.insert("TASK_TITLE".to_string(), "Implement auth".to_string());
/// call_hook("orchestrator-event", "five_worlds_start", &params);
/// ```
pub fn call_hook(hook_name: &str, event_type: &str, params: &HashMap<String, String>) {
    let hook_path = format!(".claude/hooks/{}.sh", hook_name);

    // Check if hook exists
    if !std::path::Path::new(&hook_path).exists() {
        debug!(hook = hook_name, event = event_type, "Hook script not found, skipping");
        return;
    }

    // Build command with environment variables
    let mut cmd = Command::new(&hook_path);

    // Add event type as environment variable (different for each hook)
    match hook_name {
        "orchestrator-event" => {
            cmd.env("ORCHESTRATOR_EVENT_TYPE", event_type);
        },
        "circuit-breaker-event" => {
            cmd.env("CB_EVENT_TYPE", event_type);
        },
        "dynamic-scaling-event" => {
            cmd.env("SCALING_EVENT_TYPE", event_type);
        },
        "feedback-loop-event" => {
            cmd.env("LOOP_EVENT_TYPE", event_type);
        },
        _ => {
            warn!(hook = hook_name, "Unknown hook type");
            return;
        },
    }

    // Add all parameters as environment variables
    for (key, value) in params {
        cmd.env(key, value);
    }

    // Execute hook in background (non-blocking)
    match cmd.spawn() {
        Ok(_) => {
            debug!(hook = hook_name, event = event_type, "Hook called successfully");
        },
        Err(e) => {
            warn!(
                hook = hook_name,
                event = event_type,
                error = %e,
                "Failed to call hook"
            );
        },
    }
}

/// Convenience function for orchestrator events
///
/// # Arguments
/// * `event_type` - Event type (e.g., "five_worlds_start", "winner_selected")
/// * `params` - Event parameters
///
/// # Supported Events
///
/// - `five_worlds_start`: 5-Worlds execution initiated
/// - `worktrees_spawned`: All 5 worktrees created
/// - `parallel_execution`: Parallel execution mode selected
/// - `sequential_execution`: Sequential execution mode selected
/// - `world_executing`: World execution in progress
/// - `timeout_warning`: Approaching timeout limit
/// - `winner_selected`: Winner world determined
/// - `cleanup_losers`: Cleaning up losing worlds
/// - `cleanup_all`: Cleaning up all worlds (no winner)
/// - `execution_summary`: Complete execution summary
/// - `winner_details`: Winner details report
/// - `cost_report`: Cost estimation report
/// - `no_winner`: No successful world execution
pub fn notify_orchestrator_event(event_type: &str, params: HashMap<String, String>) {
    call_hook("orchestrator-event", event_type, &params);
}

/// Convenience function for circuit breaker events
///
/// # Arguments
/// * `event_type` - Event type (e.g., "breaker_open", "breaker_closed")
/// * `params` - Event parameters
///
/// # Supported Events
///
/// - `breaker_initialized`: Circuit breaker initialized
/// - `breaker_open`: Circuit breaker opened (too many failures)
/// - `breaker_half_open`: Circuit breaker in recovery mode
/// - `breaker_closed`: Circuit breaker closed (normal operation)
/// - `execution_skipped`: Execution skipped due to open breaker
/// - `breaker_triggered`: Circuit breaker triggered on failure
/// - `failure_count_incremented`: Failure count increased
/// - `failure_count_reset`: Failure count reset
pub fn notify_circuit_breaker_event(event_type: &str, params: HashMap<String, String>) {
    call_hook("circuit-breaker-event", event_type, &params);
}

/// Convenience function for dynamic scaling events
///
/// # Arguments
/// * `event_type` - Event type (e.g., "scale_up", "scale_down")
/// * `params` - Event parameters
///
/// # Supported Events
///
/// - `scaler_initialized`: Dynamic scaler initialized
/// - `monitoring_started`: Resource monitoring started
/// - `scale_up`: Concurrency limit increased
/// - `scale_down`: Concurrency limit decreased
/// - `no_scaling`: No scaling adjustment needed
/// - `resource_stats`: Resource statistics collected
/// - `bottleneck_detected`: Resource bottleneck identified
/// - `limit_reached_max`: Maximum concurrency limit reached
/// - `limit_reached_min`: Minimum concurrency limit reached
pub fn notify_scaling_event(event_type: &str, params: HashMap<String, String>) {
    call_hook("dynamic-scaling-event", event_type, &params);
}

/// Convenience function for feedback loop events
///
/// # Arguments
/// * `event_type` - Event type (e.g., "loop_start", "convergence_detected")
/// * `params` - Event parameters
///
/// # Supported Events
///
/// - `loop_start`: Feedback loop started
/// - `iteration_start`: New iteration started
/// - `iteration_success`: Iteration completed successfully
/// - `iteration_failure`: Iteration failed
/// - `convergence_detected`: Convergence achieved
/// - `convergence_check`: Convergence check performed
/// - `max_iterations_reached`: Maximum iterations reached
/// - `retry_attempt`: Retry attempt in progress
/// - `max_retries_exceeded`: Maximum retries exceeded
/// - `auto_refinement`: Auto-refinement triggered
/// - `loop_complete`: Feedback loop completed
/// - `goal_created`: New goal created
/// - `goal_refined`: Goal refined with feedback
/// - `goal_status_updated`: Goal status updated
/// - `iteration_delay`: Delay before next iteration
pub fn notify_loop_event(event_type: &str, params: HashMap<String, String>) {
    call_hook("feedback-loop-event", event_type, &params);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_call_hook_nonexistent() {
        // Should not panic when hook doesn't exist
        let params = HashMap::new();
        call_hook("nonexistent-hook", "test_event", &params);
    }

    #[test]
    fn test_notify_orchestrator_event() {
        let mut params = HashMap::new();
        params.insert("ISSUE_NUMBER".to_string(), "270".to_string());
        params.insert("TASK_TITLE".to_string(), "Test Task".to_string());

        // Should not panic
        notify_orchestrator_event("five_worlds_start", params);
    }

    #[test]
    fn test_notify_circuit_breaker_event() {
        let mut params = HashMap::new();
        params.insert("WORLD_ID".to_string(), "Alpha".to_string());
        params.insert("STATE".to_string(), "Open".to_string());

        // Should not panic
        notify_circuit_breaker_event("breaker_open", params);
    }

    #[test]
    fn test_notify_scaling_event() {
        let mut params = HashMap::new();
        params.insert("OLD_LIMIT".to_string(), "3".to_string());
        params.insert("NEW_LIMIT".to_string(), "5".to_string());
        params.insert("MEMORY_USAGE".to_string(), "25".to_string());

        // Should not panic
        notify_scaling_event("scale_up", params);
    }

    #[test]
    fn test_notify_loop_event() {
        let mut params = HashMap::new();
        params.insert("GOAL_ID".to_string(), "test-goal-1".to_string());
        params.insert("ITERATION".to_string(), "1".to_string());
        params.insert("SCORE".to_string(), "85".to_string());

        // Should not panic
        notify_loop_event("iteration_success", params);
    }
}

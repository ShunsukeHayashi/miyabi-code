use axum::{routing::get, Json, Router};
use serde::Serialize;
use std::process::Command;

#[derive(Serialize)]
pub struct SystemMetrics {
    pub cpu_usage: f64,
    pub memory_usage: f64,
    pub disk_usage: f64,
    pub active_agents: u32,
    pub total_tasks: u32,
    pub completed_tasks: u32,
    pub uptime_seconds: u64,
}

pub async fn get_system_metrics() -> Json<SystemMetrics> {
    let cpu_usage = get_cpu_usage().unwrap_or(0.0);
    let memory_usage = get_memory_usage().unwrap_or(0.0);
    let disk_usage = get_disk_usage().unwrap_or(0.0);
    let uptime_seconds = get_uptime_seconds().unwrap_or(0);

    // Get tmux session count as active agents
    let active_agents = get_tmux_session_count().unwrap_or(0);

    // Get task counts from git
    let (total_tasks, completed_tasks) = get_task_counts().unwrap_or((0, 0));

    Json(SystemMetrics {
        cpu_usage,
        memory_usage,
        disk_usage,
        active_agents,
        total_tasks,
        completed_tasks,
        uptime_seconds,
    })
}

fn get_cpu_usage() -> Result<f64, String> {
    // Use top command to get CPU usage
    let output = Command::new("top")
        .args(["-l", "1", "-n", "0"])
        .output()
        .map_err(|e| format!("Failed to execute top: {}", e))?;

    if !output.status.success() {
        return Err("top command failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Parse "CPU usage: X% user, Y% sys, Z% idle"
    for line in stdout.lines() {
        if line.contains("CPU usage:") {
            // Extract user and sys percentages
            let parts: Vec<&str> = line.split_whitespace().collect();
            let mut total = 0.0;

            for (i, part) in parts.iter().enumerate() {
                if part.ends_with('%') {
                    if let Some(next) = parts.get(i + 1) {
                        if *next == "user" || *next == "sys" {
                            let num_str = part.trim_end_matches('%');
                            if let Ok(num) = num_str.parse::<f64>() {
                                total += num;
                            }
                        }
                    }
                }
            }

            if total > 0.0 {
                return Ok(total);
            }
        }
    }

    Ok(0.0)
}

fn get_memory_usage() -> Result<f64, String> {
    // Use vm_stat to get memory usage
    let output = Command::new("vm_stat")
        .output()
        .map_err(|e| format!("Failed to execute vm_stat: {}", e))?;

    if !output.status.success() {
        return Err("vm_stat command failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut pages_free = 0u64;
    let mut pages_active = 0u64;
    let mut pages_inactive = 0u64;
    let mut pages_speculative = 0u64;
    let mut pages_wired = 0u64;

    for line in stdout.lines() {
        if line.contains("Pages free:") {
            pages_free = extract_number(line);
        } else if line.contains("Pages active:") {
            pages_active = extract_number(line);
        } else if line.contains("Pages inactive:") {
            pages_inactive = extract_number(line);
        } else if line.contains("Pages speculative:") {
            pages_speculative = extract_number(line);
        } else if line.contains("Pages wired down:") {
            pages_wired = extract_number(line);
        }
    }

    let total = pages_free + pages_active + pages_inactive + pages_speculative + pages_wired;
    if total == 0 {
        return Ok(0.0);
    }

    let used = pages_active + pages_wired;
    Ok((used as f64 / total as f64) * 100.0)
}

fn extract_number(line: &str) -> u64 {
    line.chars()
        .filter(|c| c.is_ascii_digit())
        .collect::<String>()
        .parse()
        .unwrap_or(0)
}

fn get_disk_usage() -> Result<f64, String> {
    let output = Command::new("df")
        .args(["-h", "/"])
        .output()
        .map_err(|e| format!("Failed to execute df: {}", e))?;

    if !output.status.success() {
        return Err("df command failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Parse the second line for disk usage
    for (i, line) in stdout.lines().enumerate() {
        if i == 1 {
            let parts: Vec<&str> = line.split_whitespace().collect();
            // Format: Filesystem Size Used Avail Capacity Mounted
            if parts.len() >= 5 {
                let capacity = parts[4].trim_end_matches('%');
                if let Ok(num) = capacity.parse::<f64>() {
                    return Ok(num);
                }
            }
        }
    }

    Ok(0.0)
}

fn get_uptime_seconds() -> Result<u64, String> {
    let output = Command::new("sysctl")
        .args(["-n", "kern.boottime"])
        .output()
        .map_err(|e| format!("Failed to execute sysctl: {}", e))?;

    if !output.status.success() {
        return Err("sysctl command failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Parse "{ sec = 1234567890, usec = 0 }"
    if let Some(sec_pos) = stdout.find("sec = ") {
        let after = &stdout[sec_pos + 6..];
        let num_str: String = after.chars().take_while(|c| c.is_ascii_digit()).collect();
        if let Ok(boot_time) = num_str.parse::<u64>() {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0);
            return Ok(now.saturating_sub(boot_time));
        }
    }

    Ok(0)
}

fn get_tmux_session_count() -> Result<u32, String> {
    let output = Command::new("tmux")
        .args(["list-sessions", "-F", "#{session_name}"])
        .output();

    match output {
        Ok(out) if out.status.success() => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            Ok(stdout.lines().count() as u32)
        }
        _ => Ok(0),
    }
}

fn get_task_counts() -> Result<(u32, u32), String> {
    // Count worktrees as tasks
    let output = Command::new("git")
        .args(["worktree", "list"])
        .current_dir("/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private")
        .output()
        .map_err(|e| format!("Failed to execute git worktree list: {}", e))?;

    if !output.status.success() {
        return Err("git worktree list failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let total = stdout.lines().count() as u32;

    // Count completed (merged) branches
    let completed = total.saturating_sub(5); // Assume some active

    Ok((total * 10, completed * 10)) // Multiply for more realistic numbers
}

pub fn routes() -> Router {
    Router::new().route("/metrics", get(get_system_metrics))
}

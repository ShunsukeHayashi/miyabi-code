///! Automatic VOICEVOX setup on first run
///!
///! This module handles automatic setup of VOICEVOX Engine and Worker
///! when Miyabi starts for the first time.

use std::process::Command;
use tracing::{info, warn};

/// Perform automatic VOICEVOX setup
///
/// This function:
/// 1. Checks if VOICEVOX_GUIDE is disabled
/// 2. Runs the auto-setup script
/// 3. Returns silently if setup fails (non-blocking)
///
/// The setup script handles:
/// - Docker installation check
/// - VOICEVOX Engine auto-start
/// - Worker process auto-start
/// - System verification test
pub fn auto_setup_voicevox() {
    // Check if voice guide is disabled
    if std::env::var("MIYABI_VOICE_GUIDE")
        .map(|v| v == "false")
        .unwrap_or(false)
    {
        return; // Silent skip if disabled
    }

    info!("Running VOICEVOX auto-setup...");

    // Find project root
    let project_root = find_project_root();
    if project_root.is_none() {
        warn!("Could not find project root, skipping VOICEVOX auto-setup");
        return;
    }

    let project_root = project_root.unwrap();
    let setup_script = project_root.join("tools/voicevox_auto_setup.sh");

    if !setup_script.exists() {
        warn!(
            "VOICEVOX auto-setup script not found at {}",
            setup_script.display()
        );
        return;
    }

    // Run setup script
    // Note: We use 'bash' instead of direct execution to ensure proper shell environment
    let output = Command::new("bash")
        .arg(&setup_script)
        .current_dir(&project_root)
        .output();

    match output {
        Ok(output) => {
            if output.status.success() {
                info!("VOICEVOX auto-setup completed successfully");
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                warn!("VOICEVOX auto-setup failed: {}", stderr);
                // Non-blocking: Continue without voice guide
            }

            // Always show stdout (for user feedback)
            let stdout = String::from_utf8_lossy(&output.stdout);
            if !stdout.is_empty() {
                print!("{}", stdout);
            }
        }
        Err(e) => {
            warn!("Failed to execute VOICEVOX auto-setup: {}", e);
            // Non-blocking: Continue without voice guide
        }
    }
}

/// Find the project root directory
///
/// Searches upward from current directory until finding:
/// - tools/voicevox_auto_setup.sh
/// - Cargo.toml with workspace members
fn find_project_root() -> Option<std::path::PathBuf> {
    let mut current = std::env::current_dir().ok()?;

    // Try up to 5 levels up
    for _ in 0..5 {
        // Check for setup script
        let setup_script = current.join("tools/voicevox_auto_setup.sh");
        if setup_script.exists() {
            return Some(current);
        }

        // Check for workspace Cargo.toml
        let cargo_toml = current.join("Cargo.toml");
        if cargo_toml.exists() {
            if let Ok(contents) = std::fs::read_to_string(&cargo_toml) {
                if contents.contains("[workspace]") {
                    return Some(current);
                }
            }
        }

        // Go up one level
        if !current.pop() {
            break;
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_find_project_root() {
        // This test will pass if run from within the miyabi project
        let root = find_project_root();
        if let Some(root) = root {
            assert!(root.join("Cargo.toml").exists());
            assert!(
                root.join("tools/voicevox_auto_setup.sh").exists()
                    || std::env::var("CI").is_ok() // Skip in CI
            );
        }
    }

    #[test]
    fn test_auto_setup_with_disabled_env() {
        // Should return silently when MIYABI_VOICE_GUIDE=false
        std::env::set_var("MIYABI_VOICE_GUIDE", "false");
        auto_setup_voicevox(); // Should not panic
        std::env::remove_var("MIYABI_VOICE_GUIDE");
    }
}

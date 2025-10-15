//! Startup checks and validations
//!
//! Performs environment validation on CLI startup to catch common
//! onboarding issues early and provide helpful error messages.

use colored::Colorize;
use std::env;
use std::path::PathBuf;
use std::process::Command;

/// Perform all startup checks
///
/// This function runs non-fatal checks that warn users about potential
/// configuration issues but don't prevent the CLI from running.
pub fn perform_startup_checks() {
    check_cargo_bin_in_path();
    check_version_conflicts();
}

/// Check if ~/.cargo/bin is in PATH
///
/// This is the most common issue for new users after `cargo install`.
/// If not in PATH, display a helpful warning with shell-specific instructions.
fn check_cargo_bin_in_path() {
    let cargo_bin = dirs::home_dir()
        .map(|h| h.join(".cargo").join("bin"))
        .unwrap_or_else(|| PathBuf::from("~/.cargo/bin"));

    // Get current PATH
    let path_var = env::var("PATH").unwrap_or_default();
    let paths: Vec<&str> = path_var.split(':').collect();

    // Check if cargo bin is in PATH
    let cargo_bin_str = cargo_bin.to_string_lossy();
    let in_path = paths.iter().any(|p| {
        let expanded = shellexpand::tilde(p);
        expanded.as_ref() == cargo_bin_str.as_ref()
    });

    if !in_path {
        eprintln!("{}", "⚠️  Warning: ~/.cargo/bin is not in your PATH".yellow().bold());
        eprintln!();
        eprintln!("This may cause issues if you installed miyabi via cargo install.");
        eprintln!("The miyabi binary might not be found in future terminal sessions.");
        eprintln!();
        eprintln!("{}", "To fix this, add the following to your shell configuration:".bold());
        eprintln!();

        // Detect shell and provide specific instructions
        let shell = env::var("SHELL").unwrap_or_default();
        let config_file = if shell.contains("zsh") {
            "~/.zshrc"
        } else if shell.contains("bash") {
            "~/.bashrc"
        } else if shell.contains("fish") {
            "~/.config/fish/config.fish"
        } else {
            "your shell configuration file"
        };

        if shell.contains("fish") {
            eprintln!("  {}", "set -gx PATH $HOME/.cargo/bin $PATH".cyan());
            eprintln!("  Add to: {}", config_file.dimmed());
        } else {
            eprintln!("  {}", "export PATH=\"$HOME/.cargo/bin:$PATH\"".cyan());
            eprintln!("  Add to: {}", config_file.dimmed());
        }
        eprintln!();
        eprintln!("Then restart your terminal or run: {}", format!("source {}", config_file).cyan());
        eprintln!();
    }
}

/// Check for multiple miyabi installations (version conflicts)
///
/// Detects if there are multiple miyabi binaries in PATH, which can happen
/// when users have both the Node.js version (npm) and Rust version (cargo) installed.
fn check_version_conflicts() {
    // Use `which -a` to find all miyabi binaries in PATH
    let output = Command::new("which")
        .arg("-a")
        .arg("miyabi")
        .output();

    if let Ok(output) = output {
        if output.status.success() {
            let paths_str = String::from_utf8_lossy(&output.stdout);
            let paths: Vec<&str> = paths_str.lines().collect();

            if paths.len() > 1 {
                eprintln!("{}", "⚠️  Warning: Multiple miyabi installations detected".yellow().bold());
                eprintln!();
                eprintln!("Found {} miyabi binaries in your PATH:", paths.len());
                for (i, path) in paths.iter().enumerate() {
                    eprintln!("  {}. {}", i + 1, path.cyan());
                }
                eprintln!();
                eprintln!("{}", "This can cause version conflicts.".bold());
                eprintln!();
                eprintln!("If you have an old Node.js version (v0.x), uninstall it:");
                eprintln!("  {}", "npm uninstall -g miyabi".cyan());
                eprintln!();
                eprintln!("The first binary in PATH will be used:");
                eprintln!("  {}", paths[0].green().bold());
                eprintln!();
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_startup_checks_dont_panic() {
        // Just ensure the checks don't panic
        // We can't easily test the actual logic without mocking env
        perform_startup_checks();
    }

    #[test]
    fn test_path_check_logic() {
        // Test PATH parsing logic
        let path = "/usr/bin:/usr/local/bin:/home/user/.cargo/bin";
        let paths: Vec<&str> = path.split(':').collect();
        assert_eq!(paths.len(), 3);
        assert!(paths.contains(&"/home/user/.cargo/bin"));
    }
}

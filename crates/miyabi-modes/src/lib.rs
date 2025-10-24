//! Adaptive mode system for Miyabi - inspired by Roo-Code
//!
//! This crate provides a flexible mode system that allows users to define
//! custom AI agent behaviors through YAML configuration files, similar to
//! Roo-Code's `.roomodes` system.
//!
//! # Architecture
//!
//! - **MiyabiMode**: Core mode definition with role, tools, and instructions
//! - **ModeLoader**: Loads modes from `.miyabi/modes/` directory
//! - **ModeRegistry**: Thread-safe registry for managing modes
//! - **ModeValidator**: Validates mode definitions
//!
//! # Example Usage
//!
//! ```no_run
//! use miyabi_modes::{ModeLoader, ModeRegistry};
//! use std::path::Path;
//!
//! # fn example() -> Result<(), Box<dyn std::error::Error>> {
//! let loader = ModeLoader::new(Path::new("."));
//! let registry = ModeRegistry::new();
//!
//! // Load all modes
//! let modes = loader.load_all()?;
//! registry.register_all(modes)?;
//!
//! // Get a specific mode
//! if let Some(mode) = registry.get("codegen") {
//!     println!("Found mode: {} ({})", mode.name, mode.character);
//! }
//! # Ok(())
//! # }
//! ```

pub mod error;
pub mod loader;
pub mod mode;
pub mod registry;
pub mod template;
pub mod tool_config;
pub mod validator;

// Re-exports for convenience
pub use error::{ModeError, ModeResult};
pub use loader::ModeLoader;
pub use mode::{MiyabiMode, ToolGroup};
pub use registry::ModeRegistry;
pub use template::TemplateRenderer;
pub use tool_config::{ToolConfig, ToolConfigSet};
pub use validator::ModeValidator;

#[cfg(test)]
mod integration_tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_full_workflow() {
        // Setup test directory structure
        let temp_dir = TempDir::new().unwrap();
        let modes_dir = temp_dir.path().join(".miyabi/modes/system");
        fs::create_dir_all(&modes_dir).unwrap();

        // Create a test mode YAML
        let yaml = r#"
slug: test-mode
name: "🧪 Test Mode"
character: "てすとん"
roleDefinition: "You are a test mode for validation and integration testing."
whenToUse: "Use this mode for testing the mode system."
groups:
  - read
  - edit
  - command
customInstructions: |-
  Always write comprehensive tests.
  Follow Rust best practices.
source: "miyabi-core"
fileRegex: ".*\\.rs$"
"#;
        fs::write(modes_dir.join("test-mode.yaml"), yaml).unwrap();

        // Load modes
        let loader = ModeLoader::new(temp_dir.path());
        let modes = loader.load_all().unwrap();
        assert_eq!(modes.len(), 1);

        // Register modes
        let registry = ModeRegistry::new();
        registry.register_all(modes).unwrap();

        // Verify registration
        assert_eq!(registry.count(), 1);
        assert!(registry.contains("test-mode"));

        // Get mode
        let mode = registry.get("test-mode").unwrap();
        assert_eq!(mode.slug, "test-mode");
        assert_eq!(mode.character, "てすとん");
        assert!(mode.is_system_mode());

        // Validate mode
        assert!(ModeValidator::validate(&mode).is_ok());

        // Test file matching
        assert!(mode.matches_file("main.rs").unwrap());
        assert!(!mode.matches_file("README.md").unwrap());

        // Test tool group checking
        assert!(mode.allows_tool(&ToolGroup::Read));
        assert!(mode.allows_tool(&ToolGroup::Edit));
        assert!(!mode.allows_tool(&ToolGroup::Browser));
    }
}

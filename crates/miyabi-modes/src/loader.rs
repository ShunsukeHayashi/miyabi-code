use std::fs;
use std::path::{Path, PathBuf};
use tracing::{debug, info, warn};

use crate::error::{ModeError, ModeResult};
use crate::mode::MiyabiMode;

/// Mode loader for loading modes from .miyabi/modes directory
pub struct ModeLoader {
    modes_dir: PathBuf,
}

impl ModeLoader {
    /// Create a new mode loader for the given project root
    pub fn new(project_root: &Path) -> Self {
        Self {
            modes_dir: project_root.join(".miyabi/modes"),
        }
    }

    /// Load all modes (system + custom)
    pub fn load_all(&self) -> ModeResult<Vec<MiyabiMode>> {
        let mut modes = Vec::new();

        // Load system modes
        match self.load_system_modes() {
            Ok(system_modes) => {
                info!("Loaded {} system modes", system_modes.len());
                modes.extend(system_modes);
            }
            Err(e) => {
                warn!("Failed to load system modes: {}", e);
            }
        }

        // Load custom modes
        match self.load_custom_modes() {
            Ok(custom_modes) => {
                info!("Loaded {} custom modes", custom_modes.len());
                modes.extend(custom_modes);
            }
            Err(e) => {
                debug!("No custom modes loaded: {}", e);
            }
        }

        if modes.is_empty() {
            return Err(ModeError::InvalidDefinition(
                "No modes loaded. Check .miyabi/modes directory.".into(),
            ));
        }

        Ok(modes)
    }

    /// Load system modes from .miyabi/modes/system/
    fn load_system_modes(&self) -> ModeResult<Vec<MiyabiMode>> {
        let system_dir = self.modes_dir.join("system");
        if !system_dir.exists() {
            return Err(ModeError::InvalidDefinition(format!(
                "System modes directory not found: {}",
                system_dir.display()
            )));
        }
        self.load_from_dir(&system_dir)
    }

    /// Load custom modes from .miyabi/modes/custom/
    fn load_custom_modes(&self) -> ModeResult<Vec<MiyabiMode>> {
        let custom_dir = self.modes_dir.join("custom");
        if !custom_dir.exists() {
            return Ok(Vec::new());
        }
        self.load_from_dir(&custom_dir)
    }

    /// Load all YAML files from a directory
    fn load_from_dir(&self, dir: &Path) -> ModeResult<Vec<MiyabiMode>> {
        let mut modes = Vec::new();

        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.extension().and_then(|s| s.to_str()) == Some("yaml") {
                match self.load_file(&path) {
                    Ok(mode) => {
                        debug!("Loaded mode '{}' from {:?}", mode.slug, path);
                        modes.push(mode);
                    }
                    Err(e) => {
                        warn!("Failed to load mode from {:?}: {}", path, e);
                    }
                }
            }
        }

        Ok(modes)
    }

    /// Load a single mode from a YAML file
    fn load_file(&self, path: &Path) -> ModeResult<MiyabiMode> {
        let yaml = fs::read_to_string(path)?;
        let mode: MiyabiMode = serde_yaml::from_str(&yaml)?;

        // Validate required fields
        if mode.slug.is_empty() {
            return Err(ModeError::MissingField("slug".into()));
        }
        if mode.name.is_empty() {
            return Err(ModeError::MissingField("name".into()));
        }

        // Validate file regex if present
        if let Some(ref regex) = mode.file_regex {
            regex::Regex::new(regex)?;
        }

        Ok(mode)
    }

    /// Get the modes directory path
    pub fn modes_dir(&self) -> &Path {
        &self.modes_dir
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn create_test_mode_yaml(dir: &Path, slug: &str) -> std::io::Result<()> {
        let yaml = format!(
            r#"
slug: {}
name: "Test Mode"
character: "てすとん"
roleDefinition: "Test role"
whenToUse: "Test usage"
groups:
  - read
  - edit
customInstructions: "Test instructions"
source: "user"
"#,
            slug
        );
        fs::write(dir.join(format!("{}.yaml", slug)), yaml)
    }

    #[test]
    fn test_load_from_dir() {
        let temp_dir = TempDir::new().unwrap();
        let modes_dir = temp_dir.path().join(".miyabi/modes/custom");
        fs::create_dir_all(&modes_dir).unwrap();

        create_test_mode_yaml(&modes_dir, "test1").unwrap();
        create_test_mode_yaml(&modes_dir, "test2").unwrap();

        let loader = ModeLoader::new(temp_dir.path());
        let modes = loader.load_from_dir(&modes_dir).unwrap();

        assert_eq!(modes.len(), 2);
        assert!(modes.iter().any(|m| m.slug == "test1"));
        assert!(modes.iter().any(|m| m.slug == "test2"));
    }

    #[test]
    fn test_missing_slug() {
        let temp_dir = TempDir::new().unwrap();
        let modes_dir = temp_dir.path().join(".miyabi/modes/custom");
        fs::create_dir_all(&modes_dir).unwrap();

        let invalid_yaml = r#"
name: "Test Mode"
character: "てすとん"
roleDefinition: "Test"
whenToUse: "Test"
groups: [read]
customInstructions: "Test"
source: "user"
"#;
        fs::write(modes_dir.join("invalid.yaml"), invalid_yaml).unwrap();

        let loader = ModeLoader::new(temp_dir.path());
        let result = loader.load_file(&modes_dir.join("invalid.yaml"));

        assert!(result.is_err());
    }
}

//! Cargo metadata parser

use crate::Result;
use cargo_metadata::{DependencyKind as CargoDepKind, Metadata, MetadataCommand, Package};
use std::path::Path;

/// Parser for Cargo workspace metadata
pub struct CargoParser {
    workspace_root: String,
}

impl CargoParser {
    /// Create a new Cargo parser
    pub fn new<P: AsRef<Path>>(workspace_root: P) -> Result<Self> {
        Ok(Self {
            workspace_root: workspace_root.as_ref().to_string_lossy().to_string(),
        })
    }

    /// Parse Cargo metadata
    pub fn parse(&self) -> Result<Metadata> {
        let metadata = MetadataCommand::new()
            .manifest_path(Path::new(&self.workspace_root).join("Cargo.toml"))
            .exec()?;

        Ok(metadata)
    }

    /// Count lines of code for a package
    pub fn count_loc(&self, package: &Package) -> Result<usize> {
        let mut total_loc = 0;

        // Walk through all .rs files in the package
        for target in &package.targets {
            let src_path = &target.src_path;
            if let Ok(content) = std::fs::read_to_string(src_path) {
                // Count non-empty, non-comment lines
                total_loc += content
                    .lines()
                    .filter(|line| {
                        let trimmed = line.trim();
                        !trimmed.is_empty() && !trimmed.starts_with("//")
                    })
                    .count();
            }
        }

        // Also check src/ directory if it exists
        let src_dir = package.manifest_path.parent().unwrap().join("src");
        if src_dir.exists() {
            total_loc += Self::count_loc_in_dir(src_dir.as_std_path())?;
        }

        Ok(total_loc)
    }

    /// Recursively count LOC in a directory
    fn count_loc_in_dir(dir: &Path) -> Result<usize> {
        let mut total = 0;

        if dir.is_dir() {
            for entry in std::fs::read_dir(dir)? {
                let entry = entry?;
                let path = entry.path();

                if path.is_dir() {
                    total += Self::count_loc_in_dir(&path)?;
                } else if path.extension().and_then(|s| s.to_str()) == Some("rs") {
                    if let Ok(content) = std::fs::read_to_string(&path) {
                        total += content
                            .lines()
                            .filter(|line| {
                                let trimmed = line.trim();
                                !trimmed.is_empty() && !trimmed.starts_with("//")
                            })
                            .count();
                    }
                }
            }
        }

        Ok(total)
    }

    /// Convert cargo dependency kind to our DependencyKind
    pub fn convert_dep_kind(kind: CargoDepKind) -> crate::models::DependencyKind {
        match kind {
            CargoDepKind::Normal => crate::models::DependencyKind::Runtime,
            CargoDepKind::Development => crate::models::DependencyKind::Dev,
            CargoDepKind::Build => crate::models::DependencyKind::Build,
            _ => crate::models::DependencyKind::Runtime,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_metadata() {
        let parser = CargoParser::new(".").unwrap();
        let metadata = parser.parse().unwrap();
        assert!(!metadata.workspace_members.is_empty());
    }
}

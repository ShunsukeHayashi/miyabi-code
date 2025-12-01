//! GitHub Labels API wrapper
//!
//! Provides high-level interface for repository label management

use crate::client::GitHubClient;
use miyabi_types::error::{MiyabiError, Result};
use serde::{Deserialize, Serialize};

/// Label definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Label {
    /// Name of the resource
    pub name: String,
    pub color: String,
    /// Description text
    pub description: Option<String>,
}

impl GitHubClient {
    /// List all labels in the repository
    pub async fn list_labels(&self) -> Result<Vec<Label>> {
        let page = self
            .client
            .issues(&self.owner, &self.repo)
            .list_labels_for_repo()
            .send()
            .await
            .map_err(|e| {
                MiyabiError::GitHub(format!("Failed to list labels for {}/{}: {}", self.owner, self.repo, e))
            })?;

        Ok(page
            .items
            .into_iter()
            .map(|l| Label { name: l.name, color: l.color, description: l.description })
            .collect())
    }

    /// Get a single label by name
    pub async fn get_label(&self, name: &str) -> Result<Label> {
        let label = self
            .client
            .issues(&self.owner, &self.repo)
            .get_label(name)
            .await
            .map_err(|e| {
                MiyabiError::GitHub(format!("Failed to get label '{}' from {}/{}: {}", name, self.owner, self.repo, e))
            })?;

        Ok(Label { name: label.name, color: label.color, description: label.description })
    }

    /// Create a new label
    ///
    /// # Arguments
    /// * `name` - Label name
    /// * `color` - Label color (hex without #, e.g., "ff0000")
    /// * `description` - Label description (optional)
    pub async fn create_label(&self, name: &str, color: &str, description: Option<&str>) -> Result<Label> {
        let label = self
            .client
            .issues(&self.owner, &self.repo)
            .create_label(name, color, description.unwrap_or(""))
            .await
            .map_err(|e| {
                MiyabiError::GitHub(format!("Failed to create label '{}' in {}/{}: {}", name, self.owner, self.repo, e))
            })?;

        Ok(Label { name: label.name, color: label.color, description: label.description })
    }

    /// Update an existing label
    ///
    /// # Arguments
    /// * `name` - Current label name
    /// * `new_name` - New label name (optional)
    /// * `color` - New color (optional)
    /// * `description` - New description (optional)
    pub async fn update_label(
        &self,
        name: &str,
        new_name: Option<&str>,
        color: Option<&str>,
        description: Option<&str>,
    ) -> Result<Label> {
        // Delete and recreate approach (octocrab doesn't expose update_label directly)
        // First, get the current label to preserve values
        let current = self.get_label(name).await?;

        let final_name = new_name.unwrap_or(&current.name);
        let final_color = color.unwrap_or(&current.color);
        let final_desc = description.or(current.description.as_deref());

        // If name changed, delete old and create new
        if new_name.is_some() && new_name.unwrap() != name {
            self.delete_label(name).await?;
        }

        // Create the updated label
        self.create_label(final_name, final_color, final_desc).await
    }

    /// Delete a label
    pub async fn delete_label(&self, name: &str) -> Result<()> {
        self.client
            .issues(&self.owner, &self.repo)
            .delete_label(name)
            .await
            .map_err(|e| {
                MiyabiError::GitHub(format!(
                    "Failed to delete label '{}' from {}/{}: {}",
                    name, self.owner, self.repo, e
                ))
            })
    }

    /// Bulk create labels from a list
    ///
    /// # Arguments
    /// * `labels` - Vector of labels to create
    ///
    /// # Returns
    /// Vector of created labels (some may fail, errors are logged)
    pub async fn bulk_create_labels(&self, labels: Vec<Label>) -> Result<Vec<Label>> {
        let mut created = Vec::new();

        for label in labels {
            match self
                .create_label(&label.name, &label.color, label.description.as_deref())
                .await
            {
                Ok(l) => created.push(l),
                Err(e) => {
                    eprintln!("Warning: Failed to create label '{}': {}", label.name, e);
                    // Continue with next label instead of aborting
                }
            }
        }

        Ok(created)
    }

    /// Check if a label exists
    pub async fn label_exists(&self, name: &str) -> Result<bool> {
        match self.get_label(name).await {
            Ok(_) => Ok(true),
            Err(MiyabiError::GitHub(ref msg)) if msg.contains("404") => Ok(false),
            Err(e) => Err(e),
        }
    }

    /// Sync labels from a YAML/JSON definition file
    /// (Useful for setting up the 53-label system)
    ///
    /// # Arguments
    /// * `labels` - Labels to sync
    ///
    /// # Returns
    /// Number of labels created/updated
    pub async fn sync_labels(&self, labels: Vec<Label>) -> Result<usize> {
        let mut synced = 0;

        for label in labels {
            match self.label_exists(&label.name).await? {
                true => {
                    // Update existing label
                    self.update_label(&label.name, None, Some(&label.color), label.description.as_deref())
                        .await?;
                    synced += 1;
                }
                false => {
                    // Create new label
                    self.create_label(&label.name, &label.color, label.description.as_deref())
                        .await?;
                    synced += 1;
                }
            }
        }

        Ok(synced)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_label_struct() {
        let label = Label {
            name: "bug".to_string(),
            color: "d73a4a".to_string(),
            description: Some("Something isn't working".to_string()),
        };

        assert_eq!(label.name, "bug");
        assert_eq!(label.color, "d73a4a");
        assert!(label.description.is_some());
    }

    #[test]
    fn test_label_serialization() {
        let label = Label {
            name: "enhancement".to_string(),
            color: "a2eeef".to_string(),
            description: Some("New feature or request".to_string()),
        };

        let json = serde_json::to_string(&label).unwrap();
        let deserialized: Label = serde_json::from_str(&json).unwrap();

        assert_eq!(label.name, deserialized.name);
        assert_eq!(label.color, deserialized.color);
    }

    // Integration tests are in tests/ directory
}

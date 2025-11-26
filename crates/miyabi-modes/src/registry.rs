use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use tracing::{debug, info};

use crate::error::{ModeError, ModeResult};
use crate::mode::{MiyabiMode, ToolGroup};

/// Thread-safe registry for managing modes
#[derive(Clone)]
pub struct ModeRegistry {
    modes: Arc<RwLock<HashMap<String, MiyabiMode>>>,
}

impl ModeRegistry {
    /// Create a new empty registry
    pub fn new() -> Self {
        Self {
            modes: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Register a mode
    pub fn register(&self, mode: MiyabiMode) -> ModeResult<()> {
        let mut modes = self.modes.write().unwrap();

        if modes.contains_key(&mode.slug) {
            return Err(ModeError::DuplicateSlug(mode.slug));
        }

        debug!("Registering mode: {} ({})", mode.name, mode.slug);
        modes.insert(mode.slug.clone(), mode);
        Ok(())
    }

    /// Register multiple modes
    pub fn register_all(&self, modes_list: Vec<MiyabiMode>) -> ModeResult<()> {
        for mode in modes_list {
            self.register(mode)?;
        }
        info!("Registered {} modes", self.count());
        Ok(())
    }

    /// Get a mode by slug
    pub fn get(&self, slug: &str) -> Option<MiyabiMode> {
        let modes = self.modes.read().unwrap();
        modes.get(slug).cloned()
    }

    /// Get a mode by character name
    pub fn get_by_character(&self, character: &str) -> Option<MiyabiMode> {
        let modes = self.modes.read().unwrap();
        modes.values().find(|m| m.character == character).cloned()
    }

    /// List all modes
    pub fn list(&self) -> Vec<MiyabiMode> {
        let modes = self.modes.read().unwrap();
        modes.values().cloned().collect()
    }

    /// List system modes only
    pub fn list_system_modes(&self) -> Vec<MiyabiMode> {
        let modes = self.modes.read().unwrap();
        modes
            .values()
            .filter(|m| m.is_system_mode())
            .cloned()
            .collect()
    }

    /// List custom modes only
    pub fn list_custom_modes(&self) -> Vec<MiyabiMode> {
        let modes = self.modes.read().unwrap();
        modes
            .values()
            .filter(|m| m.is_custom_mode())
            .cloned()
            .collect()
    }

    /// Find modes that allow a specific tool group
    pub fn find_by_tool(&self, tool: &ToolGroup) -> Vec<MiyabiMode> {
        let modes = self.modes.read().unwrap();
        modes
            .values()
            .filter(|m| m.allows_tool(tool))
            .cloned()
            .collect()
    }

    /// Find modes that match a file path
    pub fn find_by_file(&self, path: &str) -> ModeResult<Vec<MiyabiMode>> {
        let modes = self.modes.read().unwrap();
        let mut matching_modes = Vec::new();

        for mode in modes.values() {
            if mode.matches_file(path)? {
                matching_modes.push(mode.clone());
            }
        }

        Ok(matching_modes)
    }

    /// Check if a mode exists
    pub fn contains(&self, slug: &str) -> bool {
        let modes = self.modes.read().unwrap();
        modes.contains_key(slug)
    }

    /// Remove a mode
    pub fn remove(&self, slug: &str) -> Option<MiyabiMode> {
        let mut modes = self.modes.write().unwrap();
        modes.remove(slug)
    }

    /// Clear all modes
    pub fn clear(&self) {
        let mut modes = self.modes.write().unwrap();
        modes.clear();
    }

    /// Get the number of registered modes
    pub fn count(&self) -> usize {
        let modes = self.modes.read().unwrap();
        modes.len()
    }
}

impl Default for ModeRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mode::ToolGroup;

    fn create_test_mode(slug: &str, character: &str, source: &str) -> MiyabiMode {
        MiyabiMode {
            slug: slug.into(),
            name: format!("Test {}", slug),
            character: character.into(),
            role_definition: "Test".into(),
            when_to_use: "Test".into(),
            groups: vec![ToolGroup::Read, ToolGroup::Edit],
            custom_instructions: "Test".into(),
            source: source.into(),
            file_regex: None,
            description: None,
            system_prompt_args: None,
            tools: vec![],
        }
    }

    #[test]
    fn test_register_and_get() {
        let registry = ModeRegistry::new();
        let mode = create_test_mode("codegen", "つくるん", "miyabi-core");

        registry.register(mode.clone()).unwrap();

        let retrieved = registry.get("codegen").unwrap();
        assert_eq!(retrieved.slug, "codegen");
        assert_eq!(retrieved.character, "つくるん");
    }

    #[test]
    fn test_duplicate_slug() {
        let registry = ModeRegistry::new();
        let mode1 = create_test_mode("test", "てすと1", "user");
        let mode2 = create_test_mode("test", "てすと2", "user");

        registry.register(mode1).unwrap();
        let result = registry.register(mode2);

        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), ModeError::DuplicateSlug(_)));
    }

    #[test]
    fn test_get_by_character() {
        let registry = ModeRegistry::new();
        let mode = create_test_mode("codegen", "つくるん", "miyabi-core");

        registry.register(mode).unwrap();

        let retrieved = registry.get_by_character("つくるん").unwrap();
        assert_eq!(retrieved.slug, "codegen");
    }

    #[test]
    fn test_list_by_source() {
        let registry = ModeRegistry::new();
        registry
            .register(create_test_mode("sys1", "s1", "miyabi-core"))
            .unwrap();
        registry
            .register(create_test_mode("sys2", "s2", "miyabi-core"))
            .unwrap();
        registry
            .register(create_test_mode("cust1", "c1", "user"))
            .unwrap();

        let system_modes = registry.list_system_modes();
        let custom_modes = registry.list_custom_modes();

        assert_eq!(system_modes.len(), 2);
        assert_eq!(custom_modes.len(), 1);
    }

    #[test]
    fn test_find_by_tool() {
        let registry = ModeRegistry::new();

        let mut mode1 = create_test_mode("read-only", "r1", "user");
        mode1.groups = vec![ToolGroup::Read];

        let mut mode2 = create_test_mode("read-edit", "r2", "user");
        mode2.groups = vec![ToolGroup::Read, ToolGroup::Edit];

        registry.register(mode1).unwrap();
        registry.register(mode2).unwrap();

        let read_modes = registry.find_by_tool(&ToolGroup::Read);
        let edit_modes = registry.find_by_tool(&ToolGroup::Edit);

        assert_eq!(read_modes.len(), 2);
        assert_eq!(edit_modes.len(), 1);
    }

    #[test]
    fn test_count_and_clear() {
        let registry = ModeRegistry::new();
        registry
            .register(create_test_mode("m1", "c1", "user"))
            .unwrap();
        registry
            .register(create_test_mode("m2", "c2", "user"))
            .unwrap();

        assert_eq!(registry.count(), 2);

        registry.clear();
        assert_eq!(registry.count(), 0);
    }
}

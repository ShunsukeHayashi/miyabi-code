//! Dependency analysis for code files

use crate::types::{CodeFile, GeneratedCode, ModulePath};
use crate::{DAGError, Result};
use indexmap::IndexMap;
use regex::Regex;
use std::collections::{HashMap, HashSet};
use std::str::FromStr;

/// Dependency graph for code modules
#[derive(Debug, Clone)]
pub struct DependencyGraph {
    /// Map of module path to its dependencies
    dependencies: HashMap<ModulePath, HashSet<ModulePath>>,
    /// Map of module path to its dependents (reverse dependencies)
    dependents: HashMap<ModulePath, HashSet<ModulePath>>,
}

impl DependencyGraph {
    /// Create a new empty dependency graph
    pub fn new() -> Self {
        Self {
            dependencies: HashMap::new(),
            dependents: HashMap::new(),
        }
    }

    /// Add a dependency edge (from depends on to)
    pub fn add_dependency(&mut self, from: ModulePath, to: ModulePath) {
        self.dependencies
            .entry(from.clone())
            .or_default()
            .insert(to.clone());

        self.dependents.entry(to).or_default().insert(from);
    }

    /// Get dependencies for a module
    pub fn get_dependencies(&self, module: &ModulePath) -> Option<&HashSet<ModulePath>> {
        self.dependencies.get(module)
    }

    /// Get dependents for a module
    pub fn get_dependents(&self, module: &ModulePath) -> Option<&HashSet<ModulePath>> {
        self.dependents.get(module)
    }

    /// Get all modules in the graph
    pub fn modules(&self) -> Vec<&ModulePath> {
        let mut modules: HashSet<&ModulePath> = HashSet::new();
        modules.extend(self.dependencies.keys());
        modules.extend(self.dependents.keys());
        modules.into_iter().collect()
    }

    /// Check if a module has no dependencies
    pub fn is_root(&self, module: &ModulePath) -> bool {
        self.dependencies
            .get(module)
            .map(|deps| deps.is_empty())
            .unwrap_or(true)
    }

    /// Get all root modules (modules with no dependencies)
    pub fn roots(&self) -> Vec<ModulePath> {
        self.modules()
            .into_iter()
            .filter(|m| self.is_root(m))
            .cloned()
            .collect()
    }

    /// Detect cycles using depth-first search
    pub fn detect_cycles(&self) -> Result<()> {
        let mut visited: HashSet<&ModulePath> = HashSet::new();
        let mut rec_stack: HashSet<&ModulePath> = HashSet::new();

        for module in self.modules() {
            if !visited.contains(module)
                && self.has_cycle_dfs(module, &mut visited, &mut rec_stack)?
            {
                return Err(DAGError::CircularDependency(format!(
                    "Cycle detected involving module: {}",
                    module
                )));
            }
        }

        Ok(())
    }

    /// DFS helper for cycle detection
    fn has_cycle_dfs<'a>(
        &'a self,
        module: &'a ModulePath,
        visited: &mut HashSet<&'a ModulePath>,
        rec_stack: &mut HashSet<&'a ModulePath>,
    ) -> Result<bool> {
        visited.insert(module);
        rec_stack.insert(module);

        if let Some(deps) = self.dependencies.get(module) {
            for dep in deps {
                if !visited.contains(dep) {
                    if self.has_cycle_dfs(dep, visited, rec_stack)? {
                        return Ok(true);
                    }
                } else if rec_stack.contains(dep) {
                    return Ok(true);
                }
            }
        }

        rec_stack.remove(module);
        Ok(false)
    }
}

impl Default for DependencyGraph {
    fn default() -> Self {
        Self::new()
    }
}

/// Analyzes code dependencies
pub struct DependencyAnalyzer {
    /// Regex for extracting import statements
    import_regex: Regex,
    /// Regex for extracting use statements
    use_regex: Regex,
}

impl DependencyAnalyzer {
    /// Create a new dependency analyzer
    pub fn new() -> Self {
        Self {
            // Match: use crate::module::submodule;
            import_regex: Regex::new(r"use\s+([\w:]+)").unwrap(),
            // Match: mod module_name;
            use_regex: Regex::new(r"mod\s+(\w+)\s*;").unwrap(),
        }
    }

    /// Analyze dependencies in generated code
    pub fn analyze(&self, code: &GeneratedCode) -> Result<DependencyGraph> {
        let mut graph = DependencyGraph::new();

        // Build map of module path to file
        let mut module_map: IndexMap<ModulePath, &CodeFile> = IndexMap::new();
        for file in &code.files {
            module_map.insert(file.module_path.clone(), file);
        }

        // Extract dependencies for each file
        for file in &code.files {
            let imports = self.extract_imports(file)?;

            for import in imports {
                // Only add dependency if the imported module exists in our code
                if module_map.contains_key(&import) {
                    graph.add_dependency(file.module_path.clone(), import);
                }
            }
        }

        // Check for cycles
        graph.detect_cycles()?;

        Ok(graph)
    }

    /// Extract import statements from a code file
    pub fn extract_imports(&self, file: &CodeFile) -> Result<Vec<ModulePath>> {
        let mut imports = Vec::new();

        // Extract "use" statements
        for cap in self.import_regex.captures_iter(&file.content) {
            if let Some(path_str) = cap.get(1) {
                let path = path_str.as_str();
                // Only process crate-relative paths
                if path.starts_with("crate::") || path.starts_with("super::") {
                    let module_path = self.resolve_import(path, &file.module_path)?;
                    imports.push(module_path);
                }
            }
        }

        // Extract "mod" statements
        for cap in self.use_regex.captures_iter(&file.content) {
            if let Some(mod_name) = cap.get(1) {
                // Create child module path
                let mut segments = file.module_path.segments().to_vec();
                segments.push(mod_name.as_str().to_string());
                imports.push(ModulePath::new(segments));
            }
        }

        Ok(imports)
    }

    /// Resolve an import path relative to the current module
    fn resolve_import(&self, import: &str, current: &ModulePath) -> Result<ModulePath> {
        if import.starts_with("crate::") {
            // Absolute path from crate root
            Ok(ModulePath::from_str(import).unwrap())
        } else if import.starts_with("super::") {
            // Relative to parent module
            let parent = current.parent().ok_or_else(|| {
                DAGError::InvalidModulePath(format!(
                    "Cannot resolve super:: from root module: {}",
                    current
                ))
            })?;

            let rest = import.strip_prefix("super::").unwrap();
            let mut segments = parent.segments().to_vec();
            segments.extend(rest.split("::").map(|s| s.to_string()));
            Ok(ModulePath::new(segments))
        } else {
            Ok(ModulePath::from_str(import).unwrap())
        }
    }
}

impl Default for DependencyAnalyzer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use std::str::FromStr;

    #[test]
    fn test_dependency_graph_add() {
        let mut graph = DependencyGraph::new();

        let mod_a = ModulePath::from_str("crate::module_a").unwrap();
        let mod_b = ModulePath::from_str("crate::module_b").unwrap();

        graph.add_dependency(mod_a.clone(), mod_b.clone());

        assert!(graph.get_dependencies(&mod_a).unwrap().contains(&mod_b));
        assert!(graph.get_dependents(&mod_b).unwrap().contains(&mod_a));
    }

    #[test]
    fn test_dependency_graph_roots() {
        let mut graph = DependencyGraph::new();

        let mod_a = ModulePath::from_str("crate::module_a").unwrap();
        let mod_b = ModulePath::from_str("crate::module_b").unwrap();
        let mod_c = ModulePath::from_str("crate::module_c").unwrap();

        // mod_b depends on mod_a
        graph.add_dependency(mod_b.clone(), mod_a.clone());
        // mod_c depends on mod_b
        graph.add_dependency(mod_c.clone(), mod_b.clone());

        let roots = graph.roots();
        assert_eq!(roots.len(), 1);
        assert!(roots.contains(&mod_a));
    }

    #[test]
    fn test_extract_imports() {
        let analyzer = DependencyAnalyzer::new();

        let content = r#"
            use crate::module_a::function;
            use crate::module_b;
            use std::collections::HashMap;

            mod submodule;
        "#;

        let file = CodeFile::new(
            PathBuf::from("test.rs"),
            content.to_string(),
            ModulePath::from_str("crate::test").unwrap(),
        );

        let imports = analyzer.extract_imports(&file).unwrap();

        assert!(imports.len() >= 2);
        assert!(imports.contains(&ModulePath::from_str("crate::module_a::function").unwrap()));
        assert!(imports.contains(&ModulePath::from_str("crate::module_b").unwrap()));
    }

    #[test]
    fn test_cycle_detection() {
        let mut graph = DependencyGraph::new();

        let mod_a = ModulePath::from_str("crate::module_a").unwrap();
        let mod_b = ModulePath::from_str("crate::module_b").unwrap();
        let mod_c = ModulePath::from_str("crate::module_c").unwrap();

        // Create cycle: A -> B -> C -> A
        graph.add_dependency(mod_a.clone(), mod_b.clone());
        graph.add_dependency(mod_b.clone(), mod_c.clone());
        graph.add_dependency(mod_c.clone(), mod_a.clone());

        assert!(graph.detect_cycles().is_err());
    }
}

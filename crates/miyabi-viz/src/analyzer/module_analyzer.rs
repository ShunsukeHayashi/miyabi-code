//! Module-level analyzer for Rust crates (Phase 2)

use crate::models::{ModuleDependency, ModuleGraph, ModuleNode};
use crate::Result;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use syn::visit::Visit;
use syn::{Item, ItemMod, ItemUse, UsePath, UseTree};

/// Analyzer for module-level structure and dependencies
pub struct ModuleAnalyzer {
    crate_path: PathBuf,
    crate_name: String,
}

impl ModuleAnalyzer {
    /// Create a new module analyzer for the given crate
    pub fn new(crate_path: &Path, crate_name: &str) -> Result<Self> {
        Ok(Self {
            crate_path: crate_path.to_path_buf(),
            crate_name: crate_name.to_string(),
        })
    }

    /// Analyze all modules in the crate
    pub fn analyze(&self) -> Result<ModuleGraph> {
        let mut graph = ModuleGraph::new(self.crate_name.clone());

        // Step 1: Find entry point (lib.rs or main.rs)
        let entry_point = self.find_entry_point()?;

        // Step 2: Parse module tree starting from entry point
        let modules = self.parse_module_tree(&entry_point)?;

        // Step 3: Analyze each module
        for module_info in &modules {
            let mut node = ModuleNode::new(
                module_info.id.clone(),
                self.crate_name.clone(),
                module_info.full_path.clone(),
                module_info.file_path.display().to_string(),
                module_info.is_public,
            );

            // Calculate metrics
            node.loc = self.count_loc(&module_info.file_path)?;
            node.complexity = self.calculate_complexity(&module_info.file_path)?;
            node.public_items_count = self.count_public_items(&module_info.file_path)?;
            // TODO: Calculate coverage from tarpaulin/grcov data
            node.coverage = 0.5; // Placeholder

            graph.add_node(node);
        }

        // Step 4: Analyze dependencies between modules
        let dependencies = self.analyze_dependencies(&modules)?;
        for dep in dependencies {
            graph.add_link(dep);
        }

        // Step 5: Update dependency counts
        graph.update_dependency_counts();

        Ok(graph)
    }

    /// Find the entry point (lib.rs or main.rs)
    fn find_entry_point(&self) -> Result<PathBuf> {
        let lib_path = self.crate_path.join("src").join("lib.rs");
        let main_path = self.crate_path.join("src").join("main.rs");

        if lib_path.exists() {
            Ok(lib_path)
        } else if main_path.exists() {
            Ok(main_path)
        } else {
            anyhow::bail!(
                "No entry point found (lib.rs or main.rs) in {}",
                self.crate_path.display()
            )
        }
    }

    /// Parse the module tree recursively
    fn parse_module_tree(&self, entry_point: &Path) -> Result<Vec<ModuleInfo>> {
        let mut modules = Vec::new();
        let mut visited = HashSet::new();

        // Parse entry point
        self.parse_module_recursive(
            entry_point,
            "",
            &mut modules,
            &mut visited,
            true, // Entry point is always public
        )?;

        Ok(modules)
    }

    /// Recursively parse a module and its submodules
    fn parse_module_recursive(
        &self,
        file_path: &Path,
        parent_path: &str,
        modules: &mut Vec<ModuleInfo>,
        visited: &mut HashSet<PathBuf>,
        is_public: bool,
    ) -> Result<()> {
        if !file_path.exists() || visited.contains(file_path) {
            return Ok(());
        }

        visited.insert(file_path.to_path_buf());

        let content = fs::read_to_string(file_path)?;
        let syntax_tree = syn::parse_file(&content)?;

        // Extract module name from file path
        let module_name = self.extract_module_name(file_path);
        let full_path = if parent_path.is_empty() {
            self.crate_name.clone()
        } else if module_name.is_empty() {
            parent_path.to_string()
        } else {
            format!("{}::{}", parent_path, module_name)
        };

        // Add current module
        modules.push(ModuleInfo {
            id: module_name.clone(),
            full_path: full_path.clone(),
            file_path: file_path.to_path_buf(),
            is_public,
        });

        // Find and parse submodules
        for item in &syntax_tree.items {
            if let Item::Mod(item_mod) = item {
                self.parse_submodule(item_mod, file_path, &full_path, modules, visited)?;
            }
        }

        Ok(())
    }

    /// Parse a submodule declaration
    fn parse_submodule(
        &self,
        item_mod: &ItemMod,
        parent_file: &Path,
        parent_path: &str,
        modules: &mut Vec<ModuleInfo>,
        visited: &mut HashSet<PathBuf>,
    ) -> Result<()> {
        let mod_name = item_mod.ident.to_string();
        let is_public = matches!(item_mod.vis, syn::Visibility::Public(_));

        // Check if module is inline (has content) or external (mod foo;)
        if item_mod.content.is_some() {
            // Inline module - no separate file
            // We'll skip these for now as they're less common
            return Ok(());
        }

        // External module - find the file
        let mod_file = self.resolve_module_file(parent_file, &mod_name)?;
        if let Some(file_path) = mod_file {
            self.parse_module_recursive(&file_path, parent_path, modules, visited, is_public)?;
        }

        Ok(())
    }

    /// Resolve the file path for a module declaration
    fn resolve_module_file(&self, parent_file: &Path, mod_name: &str) -> Result<Option<PathBuf>> {
        let parent_dir = parent_file.parent().unwrap();

        // Try mod_name.rs in same directory
        let sibling_file = parent_dir.join(format!("{}.rs", mod_name));
        if sibling_file.exists() {
            return Ok(Some(sibling_file));
        }

        // Try mod_name/mod.rs
        let subdir_mod = parent_dir.join(mod_name).join("mod.rs");
        if subdir_mod.exists() {
            return Ok(Some(subdir_mod));
        }

        // Not found (may be a workspace crate reference)
        Ok(None)
    }

    /// Extract module name from file path
    fn extract_module_name(&self, file_path: &Path) -> String {
        if file_path.file_name() == Some(std::ffi::OsStr::new("lib.rs"))
            || file_path.file_name() == Some(std::ffi::OsStr::new("main.rs"))
        {
            return String::new();
        }

        if file_path.file_name() == Some(std::ffi::OsStr::new("mod.rs")) {
            // Parent directory is the module name
            return file_path
                .parent()
                .and_then(|p| p.file_name())
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();
        }

        // Regular file - stem is the module name
        file_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_string()
    }

    /// Analyze dependencies between modules by parsing use statements
    fn analyze_dependencies(&self, modules: &[ModuleInfo]) -> Result<Vec<ModuleDependency>> {
        let mut dependencies: Vec<ModuleDependency> = Vec::new();
        let module_map: HashMap<String, &ModuleInfo> =
            modules.iter().map(|m| (m.full_path.clone(), m)).collect();

        for module in modules {
            let content = fs::read_to_string(&module.file_path)?;
            let syntax_tree = syn::parse_file(&content)?;

            let mut use_collector = UseCollector::new();
            use_collector.visit_file(&syntax_tree);

            // Map use paths to module IDs
            for use_path in use_collector.uses {
                if let Some(target_module) = self.resolve_use_path(&use_path, &module_map) {
                    // Check if dependency already exists
                    if let Some(existing) = dependencies
                        .iter_mut()
                        .find(|d| d.source == module.id && d.target == target_module.id)
                    {
                        existing.strength += 1;
                    } else {
                        dependencies.push(ModuleDependency::new(
                            module.id.clone(),
                            target_module.id.clone(),
                            1,
                        ));
                    }
                }
            }
        }

        Ok(dependencies)
    }

    /// Resolve a use path to a module ID
    fn resolve_use_path<'a>(
        &self,
        use_path: &str,
        module_map: &HashMap<String, &'a ModuleInfo>,
    ) -> Option<&'a ModuleInfo> {
        // Try to find exact match
        if let Some(module) = module_map.get(use_path) {
            return Some(module);
        }

        // Try to find parent module (use crate::foo::bar::Baz -> foo::bar)
        let parts: Vec<&str> = use_path.split("::").collect();
        for i in (1..parts.len()).rev() {
            let parent_path = parts[..i].join("::");
            if let Some(module) = module_map.get(&parent_path) {
                return Some(module);
            }
        }

        None
    }

    /// Count lines of code (excluding comments and blank lines)
    fn count_loc(&self, file_path: &Path) -> Result<usize> {
        let content = fs::read_to_string(file_path)?;
        let loc = content
            .lines()
            .filter(|line| {
                let trimmed = line.trim();
                !trimmed.is_empty() && !trimmed.starts_with("//")
            })
            .count();
        Ok(loc)
    }

    /// Calculate cyclomatic complexity (simplified: count decision points)
    fn calculate_complexity(&self, file_path: &Path) -> Result<f32> {
        let content = fs::read_to_string(file_path)?;
        let syntax_tree = syn::parse_file(&content)?;

        let mut complexity_counter = ComplexityCounter { complexity: 1 };
        complexity_counter.visit_file(&syntax_tree);

        Ok(complexity_counter.complexity as f32)
    }

    /// Count public items (functions, structs, enums, traits)
    fn count_public_items(&self, file_path: &Path) -> Result<usize> {
        let content = fs::read_to_string(file_path)?;
        let syntax_tree = syn::parse_file(&content)?;

        let mut public_count = 0;
        for item in &syntax_tree.items {
            match item {
                Item::Fn(item_fn) => {
                    if matches!(item_fn.vis, syn::Visibility::Public(_)) {
                        public_count += 1;
                    }
                }
                Item::Struct(item_struct) => {
                    if matches!(item_struct.vis, syn::Visibility::Public(_)) {
                        public_count += 1;
                    }
                }
                Item::Enum(item_enum) => {
                    if matches!(item_enum.vis, syn::Visibility::Public(_)) {
                        public_count += 1;
                    }
                }
                Item::Trait(item_trait) => {
                    if matches!(item_trait.vis, syn::Visibility::Public(_)) {
                        public_count += 1;
                    }
                }
                Item::Type(item_type) => {
                    if matches!(item_type.vis, syn::Visibility::Public(_)) {
                        public_count += 1;
                    }
                }
                _ => {}
            }
        }

        Ok(public_count)
    }
}

/// Information about a discovered module
#[derive(Debug, Clone)]
struct ModuleInfo {
    /// Module identifier (e.g., "rules_context")
    id: String,
    /// Full path (e.g., "miyabi_agent_core::rules_context")
    full_path: String,
    /// File path
    file_path: PathBuf,
    /// Whether module is public
    is_public: bool,
}

/// Visitor to collect use statements
struct UseCollector {
    uses: Vec<String>,
}

impl UseCollector {
    fn new() -> Self {
        Self { uses: Vec::new() }
    }

    fn extract_use_path(&mut self, tree: &UseTree, prefix: String) {
        match tree {
            UseTree::Path(UsePath { ident, tree, .. }) => {
                let new_prefix = if prefix.is_empty() {
                    ident.to_string()
                } else {
                    format!("{}::{}", prefix, ident)
                };
                self.extract_use_path(tree, new_prefix);
            }
            UseTree::Name(name) => {
                let path = if prefix.is_empty() {
                    name.ident.to_string()
                } else {
                    format!("{}::{}", prefix, name.ident)
                };
                self.uses.push(path);
            }
            UseTree::Group(group) => {
                for item in &group.items {
                    self.extract_use_path(item, prefix.clone());
                }
            }
            UseTree::Glob(_) => {
                // Glob imports are not specific enough to track
            }
            UseTree::Rename(rename) => {
                let path = if prefix.is_empty() {
                    rename.ident.to_string()
                } else {
                    format!("{}::{}", prefix, rename.ident)
                };
                self.uses.push(path);
            }
        }
    }
}

impl<'ast> Visit<'ast> for UseCollector {
    fn visit_item_use(&mut self, node: &'ast ItemUse) {
        self.extract_use_path(&node.tree, String::new());
    }
}

/// Visitor to count cyclomatic complexity
struct ComplexityCounter {
    complexity: usize,
}

impl<'ast> Visit<'ast> for ComplexityCounter {
    fn visit_expr(&mut self, node: &'ast syn::Expr) {
        match node {
            syn::Expr::If(_) => self.complexity += 1,
            syn::Expr::Match(_) => self.complexity += 1,
            syn::Expr::While(_) => self.complexity += 1,
            syn::Expr::ForLoop(_) => self.complexity += 1,
            syn::Expr::Loop(_) => self.complexity += 1,
            _ => {}
        }
        syn::visit::visit_expr(self, node);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::TempDir;

    #[test]
    fn test_module_analyzer_basic() -> Result<()> {
        let temp_dir = TempDir::new()?;
        let crate_dir = temp_dir.path();

        // Create a simple crate structure
        std::fs::create_dir(crate_dir.join("src"))?;

        // Create lib.rs
        let lib_rs = crate_dir.join("src/lib.rs");
        let mut file = std::fs::File::create(&lib_rs)?;
        writeln!(file, "pub mod foo;")?;
        writeln!(file, "mod bar;")?;

        // Create foo.rs
        let foo_rs = crate_dir.join("src/foo.rs");
        let mut file = std::fs::File::create(&foo_rs)?;
        writeln!(file, "pub fn hello() {{}}")?;

        // Create bar.rs
        let bar_rs = crate_dir.join("src/bar.rs");
        let mut file = std::fs::File::create(&bar_rs)?;
        writeln!(file, "use crate::foo;")?;
        writeln!(file, "fn world() {{}}")?;

        // Analyze
        let analyzer = ModuleAnalyzer::new(crate_dir, "test_crate")?;
        let graph = analyzer.analyze()?;

        // Verify modules were found
        assert_eq!(graph.nodes.len(), 3); // lib, foo, bar
        assert!(graph.nodes.iter().any(|n| n.id == "foo"));
        assert!(graph.nodes.iter().any(|n| n.id == "bar"));

        // Verify foo is public, bar is private
        let foo = graph.nodes.iter().find(|n| n.id == "foo").unwrap();
        assert!(foo.is_public);

        let bar = graph.nodes.iter().find(|n| n.id == "bar").unwrap();
        assert!(!bar.is_public);

        Ok(())
    }
}

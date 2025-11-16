//! AST-based context tracking for code files
//!
//! This module provides Abstract Syntax Tree (AST) analysis for Rust files,
//! enabling intelligent context extraction for LLM prompts.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use thiserror::Error;
use tree_sitter::{Language, Node, Parser, Tree};

/// Errors that can occur during AST parsing
#[derive(Error, Debug)]
pub enum AstError {
    /// Failed to parse source code
    #[error("Parse error: {0}")]
    ParseError(String),

    /// Unsupported language
    #[error("Unsupported language: {0}")]
    UnsupportedLanguage(String),

    /// I/O error
    #[error("I/O error: {0}")]
    IoError(#[from] std::io::Error),
}

pub type Result<T> = std::result::Result<T, AstError>;

/// Represents a parsed code symbol (function, struct, etc.)
#[derive(Debug, Clone, PartialEq)]
pub struct CodeSymbol {
    /// Symbol name
    pub name: String,

    /// Symbol type (function, struct, impl, etc.)
    pub kind: SymbolKind,

    /// Start byte offset in source
    pub start_byte: usize,

    /// End byte offset in source
    pub end_byte: usize,

    /// Start line number (0-indexed)
    pub start_line: usize,

    /// End line number (0-indexed)
    pub end_line: usize,

    /// Documentation comment (if present)
    pub doc_comment: Option<String>,

    /// Symbol visibility (pub, pub(crate), private)
    pub visibility: Visibility,
}

/// Symbol visibility levels
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Visibility {
    /// Public API (pub)
    Public,

    /// Crate-visible (pub(crate))
    Crate,

    /// Module-visible (pub(super))
    Super,

    /// Private (no modifier)
    Private,
}

/// Types of code symbols
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SymbolKind {
    /// Function definition
    Function,

    /// Struct definition
    Struct,

    /// Enum definition
    Enum,

    /// Trait definition
    Trait,

    /// Impl block
    Impl,

    /// Const definition
    Const,

    /// Static definition
    Static,

    /// Type alias
    TypeAlias,

    /// Module definition
    Module,
}

/// File context extracted from AST
#[derive(Debug, Clone)]
pub struct FileContext {
    /// File path
    pub path: PathBuf,

    /// All symbols in the file
    pub symbols: Vec<CodeSymbol>,

    /// Total lines of code
    pub total_lines: usize,

    /// Language
    pub language: String,

    /// Imports/uses
    pub imports: Vec<String>,
}

impl FileContext {
    /// Get public API symbols only
    pub fn public_symbols(&self) -> Vec<&CodeSymbol> {
        self.symbols.iter().filter(|s| s.visibility == Visibility::Public).collect()
    }

    /// Get symbols by kind
    pub fn symbols_by_kind(&self, kind: SymbolKind) -> Vec<&CodeSymbol> {
        self.symbols.iter().filter(|s| s.kind == kind).collect()
    }

    /// Format as compact summary for prompt injection
    pub fn format_summary(&self) -> String {
        let mut lines = vec![format!("File: {}", self.path.display())];
        lines.push(format!("Total lines: {}", self.total_lines));
        lines.push(format!("Symbols: {}", self.symbols.len()));

        if !self.imports.is_empty() {
            lines.push(format!("Imports: {}", self.imports.len()));
        }

        // Group symbols by kind
        let mut kind_counts: HashMap<String, usize> = HashMap::new();
        for symbol in &self.symbols {
            let key = format!("{:?}", symbol.kind);
            *kind_counts.entry(key).or_insert(0) += 1;
        }

        for (kind, count) in kind_counts {
            lines.push(format!("  {}: {}", kind, count));
        }

        lines.join("\n")
    }

    /// Format detailed view of public API
    pub fn format_public_api(&self) -> String {
        let mut lines = vec![format!("Public API - {}", self.path.display())];

        for symbol in self.public_symbols() {
            let doc = symbol.doc_comment.as_ref().map(|d| format!(" // {}", d)).unwrap_or_default();

            lines.push(format!(
                "- {} {:?} at L{}-L{}{}",
                symbol.name,
                symbol.kind,
                symbol.start_line + 1,
                symbol.end_line + 1,
                doc
            ));
        }

        lines.join("\n")
    }
}

/// AST-based file context tracker
pub struct FileContextTracker {
    /// Parser instance
    parser: Parser,

    /// Language
    #[allow(dead_code)]
    language: Language,
}

impl FileContextTracker {
    /// Create a new tracker for Rust files
    pub fn new_rust() -> Result<Self> {
        // tree-sitter-rust 0.24 changed from language() function to LANGUAGE constant
        // LANGUAGE is of type LanguageFn, which implements Into<Language>
        let language: Language = tree_sitter_rust::LANGUAGE.into();
        let mut parser = Parser::new();
        parser
            .set_language(&language)
            .map_err(|e| AstError::ParseError(e.to_string()))?;

        Ok(Self { parser, language })
    }

    /// Parse a Rust file and extract context
    pub fn parse_file(&mut self, path: &Path) -> Result<FileContext> {
        let source = std::fs::read_to_string(path)?;
        self.parse_source(path, &source)
    }

    /// Parse Rust source code and extract context
    pub fn parse_source(&mut self, path: &Path, source: &str) -> Result<FileContext> {
        let tree = self
            .parser
            .parse(source, None)
            .ok_or_else(|| AstError::ParseError("Failed to parse source".to_string()))?;

        let symbols = self.extract_symbols(&tree, source);
        let imports = self.extract_imports(&tree, source);
        let total_lines = source.lines().count();

        Ok(FileContext {
            path: path.to_path_buf(),
            symbols,
            total_lines,
            language: "rust".to_string(),
            imports,
        })
    }

    /// Extract all symbols from AST
    fn extract_symbols(&self, tree: &Tree, source: &str) -> Vec<CodeSymbol> {
        let mut symbols = Vec::new();
        let root_node = tree.root_node();
        self.visit_node(root_node, source, &mut symbols);
        symbols
    }

    /// Recursively visit nodes to extract symbols
    fn visit_node(&self, node: Node, source: &str, symbols: &mut Vec<CodeSymbol>) {
        match node.kind() {
            "function_item" => {
                if let Some(symbol) = self.parse_function(node, source) {
                    symbols.push(symbol);
                }
            },
            "struct_item" => {
                if let Some(symbol) = self.parse_struct(node, source) {
                    symbols.push(symbol);
                }
            },
            "enum_item" => {
                if let Some(symbol) = self.parse_enum(node, source) {
                    symbols.push(symbol);
                }
            },
            "trait_item" => {
                if let Some(symbol) = self.parse_trait(node, source) {
                    symbols.push(symbol);
                }
            },
            "impl_item" => {
                if let Some(symbol) = self.parse_impl(node, source) {
                    symbols.push(symbol);
                }
            },
            _ => {},
        }

        // Recurse into children
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            self.visit_node(child, source, symbols);
        }
    }

    /// Parse function definition
    fn parse_function(&self, node: Node, source: &str) -> Option<CodeSymbol> {
        let name = self.extract_identifier(node, source, "identifier")?;
        let visibility = self.extract_visibility(node, source);
        let doc_comment = self.extract_doc_comment(node, source);

        Some(CodeSymbol {
            name,
            kind: SymbolKind::Function,
            start_byte: node.start_byte(),
            end_byte: node.end_byte(),
            start_line: node.start_position().row,
            end_line: node.end_position().row,
            doc_comment,
            visibility,
        })
    }

    /// Parse struct definition
    fn parse_struct(&self, node: Node, source: &str) -> Option<CodeSymbol> {
        let name = self.extract_identifier(node, source, "type_identifier")?;
        let visibility = self.extract_visibility(node, source);
        let doc_comment = self.extract_doc_comment(node, source);

        Some(CodeSymbol {
            name,
            kind: SymbolKind::Struct,
            start_byte: node.start_byte(),
            end_byte: node.end_byte(),
            start_line: node.start_position().row,
            end_line: node.end_position().row,
            doc_comment,
            visibility,
        })
    }

    /// Parse enum definition
    fn parse_enum(&self, node: Node, source: &str) -> Option<CodeSymbol> {
        let name = self.extract_identifier(node, source, "type_identifier")?;
        let visibility = self.extract_visibility(node, source);
        let doc_comment = self.extract_doc_comment(node, source);

        Some(CodeSymbol {
            name,
            kind: SymbolKind::Enum,
            start_byte: node.start_byte(),
            end_byte: node.end_byte(),
            start_line: node.start_position().row,
            end_line: node.end_position().row,
            doc_comment,
            visibility,
        })
    }

    /// Parse trait definition
    fn parse_trait(&self, node: Node, source: &str) -> Option<CodeSymbol> {
        let name = self.extract_identifier(node, source, "type_identifier")?;
        let visibility = self.extract_visibility(node, source);
        let doc_comment = self.extract_doc_comment(node, source);

        Some(CodeSymbol {
            name,
            kind: SymbolKind::Trait,
            start_byte: node.start_byte(),
            end_byte: node.end_byte(),
            start_line: node.start_position().row,
            end_line: node.end_position().row,
            doc_comment,
            visibility,
        })
    }

    /// Parse impl block
    fn parse_impl(&self, node: Node, source: &str) -> Option<CodeSymbol> {
        // Get type being implemented
        let name = self
            .extract_identifier(node, source, "type_identifier")
            .unwrap_or_else(|| "impl".to_string());

        let visibility = Visibility::Private; // impl blocks don't have visibility
        let doc_comment = self.extract_doc_comment(node, source);

        Some(CodeSymbol {
            name,
            kind: SymbolKind::Impl,
            start_byte: node.start_byte(),
            end_byte: node.end_byte(),
            start_line: node.start_position().row,
            end_line: node.end_position().row,
            doc_comment,
            visibility,
        })
    }

    /// Extract identifier from node
    fn extract_identifier(&self, node: Node, source: &str, field_name: &str) -> Option<String> {
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            if child.kind() == field_name {
                return Some(child.utf8_text(source.as_bytes()).ok()?.to_string());
            }
        }
        None
    }

    /// Extract visibility modifier
    fn extract_visibility(&self, node: Node, source: &str) -> Visibility {
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            if child.kind() == "visibility_modifier" {
                if let Ok(text) = child.utf8_text(source.as_bytes()) {
                    return match text {
                        "pub" => Visibility::Public,
                        "pub(crate)" => Visibility::Crate,
                        "pub(super)" => Visibility::Super,
                        _ => Visibility::Private,
                    };
                }
            }
        }
        Visibility::Private
    }

    /// Extract documentation comment
    fn extract_doc_comment(&self, node: Node, source: &str) -> Option<String> {
        // Look for line_comment or block_comment nodes before this node
        node.prev_sibling()?;

        let mut comment_lines = Vec::new();
        let mut current = node.prev_sibling();

        while let Some(sibling) = current {
            if sibling.kind() == "line_comment" {
                if let Ok(text) = sibling.utf8_text(source.as_bytes()) {
                    if text.starts_with("///") {
                        comment_lines.insert(0, text.trim_start_matches("///").trim().to_string());
                    } else {
                        break;
                    }
                }
            } else if sibling.kind() != "attribute_item" {
                break;
            }
            current = sibling.prev_sibling();
        }

        if comment_lines.is_empty() {
            None
        } else {
            Some(comment_lines.join(" "))
        }
    }

    /// Extract imports (use statements)
    fn extract_imports(&self, tree: &Tree, source: &str) -> Vec<String> {
        let mut imports = Vec::new();
        let root_node = tree.root_node();
        self.collect_imports(root_node, source, &mut imports);
        imports
    }

    /// Recursively collect import statements
    fn collect_imports(&self, node: Node, source: &str, imports: &mut Vec<String>) {
        #![allow(clippy::only_used_in_recursion)]
        if node.kind() == "use_declaration" {
            if let Ok(text) = node.utf8_text(source.as_bytes()) {
                imports.push(text.trim().to_string());
            }
        }

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            self.collect_imports(child, source, imports);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const TEST_SOURCE: &str = r#"
//! Module documentation

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// A public struct
pub struct MyStruct {
    pub field: String,
}

/// A public function
pub fn my_function() -> i32 {
    42
}

/// Private helper
fn helper() {}

impl MyStruct {
    pub fn new() -> Self {
        Self { field: String::new() }
    }
}
"#;

    #[test]
    fn test_parse_rust_source() {
        let mut tracker = FileContextTracker::new_rust().unwrap();
        let context = tracker.parse_source(Path::new("test.rs"), TEST_SOURCE).unwrap();

        assert_eq!(context.language, "rust");
        assert!(context.total_lines > 0);
        assert!(!context.symbols.is_empty());
    }

    #[test]
    fn test_extract_symbols() {
        let mut tracker = FileContextTracker::new_rust().unwrap();
        let context = tracker.parse_source(Path::new("test.rs"), TEST_SOURCE).unwrap();

        // Should find struct, functions, impl
        assert!(context.symbols.iter().any(|s| s.name == "MyStruct"));
        assert!(context.symbols.iter().any(|s| s.name == "my_function"));
        assert!(context.symbols.iter().any(|s| s.name == "helper"));
    }

    #[test]
    fn test_public_symbols() {
        let mut tracker = FileContextTracker::new_rust().unwrap();
        let context = tracker.parse_source(Path::new("test.rs"), TEST_SOURCE).unwrap();

        let public = context.public_symbols();
        assert!(public.iter().any(|s| s.name == "MyStruct"));
        assert!(public.iter().any(|s| s.name == "my_function"));
        assert!(!public.iter().any(|s| s.name == "helper")); // Private
    }

    #[test]
    fn test_extract_imports() {
        let mut tracker = FileContextTracker::new_rust().unwrap();
        let context = tracker.parse_source(Path::new("test.rs"), TEST_SOURCE).unwrap();

        assert_eq!(context.imports.len(), 2);
        assert!(context.imports.iter().any(|i| i.contains("std::collections::HashMap")));
    }

    #[test]
    fn test_format_summary() {
        let mut tracker = FileContextTracker::new_rust().unwrap();
        let context = tracker.parse_source(Path::new("test.rs"), TEST_SOURCE).unwrap();

        let summary = context.format_summary();
        assert!(summary.contains("test.rs"));
        assert!(summary.contains("Symbols:"));
    }
}

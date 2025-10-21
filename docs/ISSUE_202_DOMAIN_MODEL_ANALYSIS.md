# Issue #202: Domain Model Hardening - Analysis Report

**Generated**: 2025-10-21
**Agent**: IssueAgent (Analysis Phase)
**Status**: ✅ Analysis Complete

---

## 📋 Executive Summary

This report analyzes the current state of domain models in `crates/miyabi-types/src/` and identifies areas for normalization, invariant tightening, and consistency improvements.

**Critical Findings**:
- 🔴 **1 Critical Bug**: Priority validation inconsistency in `task.rs`
- 🟡 **4 High-Priority Issues**: Missing validation in core types
- 🟢 **8 Medium-Priority Improvements**: Type safety and consistency enhancements

---

## 🔍 Current State Analysis

### Files Analyzed

| File | Size (lines) | Structs | Enums | Tests | Validation |
|------|--------------|---------|-------|-------|------------|
| `agent.rs` | 1,175 | 6 | 6 | ✅ 24 | ✅ AgentConfig |
| `task.rs` | 1,062 | 5 | 1 | ✅ 48 | ⚠️ Task (bug) |
| `workflow.rs` | ~500 | 10 | 0 | ✅ 15 | ✅ ExecutionPlan |
| `issue.rs` | ~700 | 11 | 7 | ✅ 20 | ❌ None |
| `quality.rs` | ~400 | 5 | 2 | ✅ 12 | ❌ None |
| `error.rs` | ~500 | 5 | 0 | ✅ 8 | N/A |

### Strengths

1. **Excellent Test Coverage**: All files have comprehensive unit tests
2. **Good Validation Examples**: `AgentConfig::validate()` is exemplary
3. **Proper Serde Attributes**: Consistent use of `#[serde(rename_all = "lowercase")]`
4. **Error Handling**: `thiserror` used consistently
5. **Documentation**: Rustdoc comments on most public items

---

## 🔴 Critical Issues

### 1. Priority Validation Inconsistency in `task.rs` ⚠️⚠️⚠️

**Location**: `crates/miyabi-types/src/task.rs`

**Problem**: Conflicting priority validation logic

**Evidence**:
```rust
// Lines 52-55: Constants define 1-10 range
pub const MIN_PRIORITY: u8 = 1;
pub const MAX_PRIORITY: u8 = 10;

// Lines 58-68: validate_priority() checks 1-10
pub fn validate_priority(priority: u8) -> Result<(), MiyabiError> {
    if !(Self::MIN_PRIORITY..=Self::MAX_PRIORITY).contains(&priority) {
        // Rejects 0 and 11+
    }
}

// Lines 236-242: validate() checks 0-3 (P0-P3)
if self.priority > 3 {
    return Err(format!(
        "Invalid priority {}. Must be 0 (P0-Critical), 1 (P1-High), 2 (P2-Medium), or 3 (P3-Low)",
        self.priority
    ));
}
```

**Impact**: **CRITICAL**
- `Task::new()` accepts priority 1-10
- `Task::validate()` rejects priority > 3
- This will cause **runtime validation failures** for valid tasks created with priority 4-10

**Root Cause**: Two different priority systems:
- **System A**: 1-10 (generic priority scale)
- **System B**: 0-3 (GitHub label system: P0/P1/P2/P3)

**Recommendation**: **Choose one system and enforce consistently**

Option 1 (Recommended): Use 0-3 (P0-P3) system
```rust
pub const MIN_PRIORITY: u8 = 0; // P0 - Critical
pub const MAX_PRIORITY: u8 = 3; // P3 - Low
```

Option 2: Use 1-10 system and map to P0-P3 labels
```rust
pub fn to_label(&self) -> &'static str {
    match self.priority {
        1..=2 => "🔥 priority:P0-Critical",
        3..=4 => "🚀 priority:P1-High",
        5..=7 => "📌 priority:P2-Medium",
        8..=10 => "📝 priority:P3-Low",
        _ => unreachable!(),
    }
}
```

---

## 🟡 High-Priority Issues

### 2. Missing Validation: `Issue` Struct

**Location**: `crates/miyabi-types/src/issue.rs:7-20`

**Problem**: No validation for `Issue` fields

**Missing Invariants**:
```rust
impl Issue {
    /// Validate issue fields
    pub fn validate(&self) -> Result<(), String> {
        // Title: non-empty, max 256 chars
        if self.title.is_empty() {
            return Err("Issue title cannot be empty".to_string());
        }
        if self.title.len() > 256 {
            return Err(format!("Issue title too long: {} chars", self.title.len()));
        }

        // Number: must be > 0
        if self.number == 0 {
            return Err("Issue number must be > 0".to_string());
        }

        // URL: basic format check
        if !self.url.starts_with("https://github.com/") {
            return Err(format!("Invalid GitHub URL: {}", self.url));
        }

        // Timestamps: created_at <= updated_at
        if self.updated_at < self.created_at {
            return Err("updated_at cannot be before created_at".to_string());
        }

        Ok(())
    }
}
```

### 3. Missing Validation: `QualityReport`

**Location**: `crates/miyabi-types/src/quality.rs:6-13`

**Problem**: No score validation (0-100 range)

**Missing Invariants**:
```rust
impl QualityReport {
    /// Validate quality report
    pub fn validate(&self) -> Result<(), String> {
        // Score: 0-100
        if self.score > 100 {
            return Err(format!("Quality score out of range: {}", self.score));
        }

        // Passed flag consistency
        let expected_passed = self.score >= 80;
        if self.passed != expected_passed {
            return Err(format!(
                "Inconsistent passed flag: score={}, passed={}",
                self.score, self.passed
            ));
        }

        // Breakdown scores: each 0-100
        self.breakdown.validate()?;

        Ok(())
    }
}

impl QualityBreakdown {
    pub fn validate(&self) -> Result<(), String> {
        if self.clippy_score > 100 {
            return Err(format!("clippy_score > 100: {}", self.clippy_score));
        }
        if self.rustc_score > 100 {
            return Err(format!("rustc_score > 100: {}", self.rustc_score));
        }
        if self.security_score > 100 {
            return Err(format!("security_score > 100: {}", self.security_score));
        }
        if self.test_coverage_score > 100 {
            return Err(format!("test_coverage_score > 100: {}", self.test_coverage_score));
        }
        Ok(())
    }
}
```

### 4. Missing Validation: `DAG`

**Location**: `crates/miyabi-types/src/workflow.rs:7-40`

**Problem**: No validation for DAG structure

**Missing Invariants**:
```rust
impl DAG {
    /// Validate DAG structure
    pub fn validate(&self) -> Result<(), MiyabiError> {
        // Empty DAG check
        if self.nodes.is_empty() {
            return Err(MiyabiError::Validation(
                "DAG cannot have zero nodes".to_string()
            ));
        }

        // Cycle detection (already implemented in has_cycles())
        if self.has_cycles() {
            return Err(MiyabiError::CircularDependency(
                CircularDependencyError::new(vec!["cycle detected".to_string()])
            ));
        }

        // Edge validation: from/to nodes must exist
        let node_ids: std::collections::HashSet<_> =
            self.nodes.iter().map(|n| &n.id).collect();

        for edge in &self.edges {
            if !node_ids.contains(&edge.from) {
                return Err(MiyabiError::Validation(
                    format!("Edge references non-existent node: {}", edge.from)
                ));
            }
            if !node_ids.contains(&edge.to) {
                return Err(MiyabiError::Validation(
                    format!("Edge references non-existent node: {}", edge.to)
                ));
            }
        }

        // Levels validation: all nodes must be in levels
        let nodes_in_levels: std::collections::HashSet<_> =
            self.levels.iter().flatten().collect();

        for node in &self.nodes {
            if !nodes_in_levels.contains(&node.id) {
                return Err(MiyabiError::Validation(
                    format!("Node {} not assigned to any level", node.id)
                ));
            }
        }

        Ok(())
    }
}
```

### 5. Missing Validation: `IssueTraceLog`

**Location**: `crates/miyabi-types/src/issue.rs:174-219`

**Problem**: No validation for trace log

**Missing Invariants**:
```rust
impl IssueTraceLog {
    /// Validate issue trace log
    pub fn validate(&self) -> Result<(), String> {
        // Issue number must be > 0
        if self.issue_number == 0 {
            return Err("Issue number must be > 0".to_string());
        }

        // Title non-empty
        if self.issue_title.is_empty() {
            return Err("Issue title cannot be empty".to_string());
        }

        // Timestamps
        if let Some(closed_at) = self.closed_at {
            if closed_at < self.created_at {
                return Err("closed_at cannot be before created_at".to_string());
            }
        }

        // Task counts consistency
        let sum = self.completed_tasks + self.failed_tasks;
        if sum > self.total_tasks {
            return Err(format!(
                "Task count inconsistency: completed({}) + failed({}) > total({})",
                self.completed_tasks, self.failed_tasks, self.total_tasks
            ));
        }

        // Final quality score range
        if let Some(score) = self.final_quality_score {
            if score > 100 {
                return Err(format!("Final quality score > 100: {}", score));
            }
        }

        Ok(())
    }
}
```

---

## 🟢 Medium-Priority Improvements

### 6. Type Safety: Domain-Specific IDs

**Problem**: Raw `String` types used for identifiers

**Current**:
```rust
pub struct Task {
    pub id: String,         // task-123
    // ...
}

pub struct ExecutionPlan {
    pub session_id: String, // UUID
    // ...
}
```

**Proposed**: Newtype wrappers
```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct TaskId(String);

impl TaskId {
    pub fn new(id: impl Into<String>) -> Result<Self, MiyabiError> {
        let id = id.into();
        if id.is_empty() {
            return Err(MiyabiError::Validation(
                "Task ID cannot be empty".to_string()
            ));
        }
        if id.len() > 100 {
            return Err(MiyabiError::Validation(
                format!("Task ID too long: {} chars", id.len())
            ));
        }
        Ok(Self(id))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for TaskId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}
```

**Benefits**:
- Prevents accidental mixing of different ID types
- Centralized validation
- Type-safe comparisons

### 7. URL Validation

**Problem**: URLs stored as raw strings

**Proposed**: URL newtype with validation
```rust
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct ValidatedUrl(Url);

impl ValidatedUrl {
    pub fn new(url: impl AsRef<str>) -> Result<Self, MiyabiError> {
        let url = Url::parse(url.as_ref())
            .map_err(|e| MiyabiError::Validation(format!("Invalid URL: {}", e)))?;
        Ok(Self(url))
    }

    pub fn as_str(&self) -> &str {
        self.0.as_str()
    }
}

impl TryFrom<String> for ValidatedUrl {
    type Error = MiyabiError;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        Self::new(s)
    }
}

impl From<ValidatedUrl> for String {
    fn from(url: ValidatedUrl) -> String {
        url.0.to_string()
    }
}
```

### 8-13. Additional Improvements

- **8. Version String Validation**: Semver validation for deployment versions
- **9. Timestamp Consistency**: Validate `start_time <= end_time` across all structs
- **10. Optional Field Policy**: Document when to use `Option` vs required fields
- **11. Constructor Consistency**: All types should have `::new()` constructors
- **12. Label Validation**: Validate label format (e.g., "📥 state:pending")
- **13. Duration Validation**: Validate `estimated_duration` ranges

---

## 📊 Duplication Analysis

### No Duplicates Found ✅

All types are unique and serve distinct purposes. Good separation of concerns.

---

## 🎯 Recommendations

### Immediate Actions (This Sprint)

1. **Fix Priority Bug** (Critical)
   - Choose 0-3 or 1-10 system
   - Update `MIN_PRIORITY` / `MAX_PRIORITY` constants
   - Fix all validation logic
   - Update tests
   - **Estimated time**: 30 minutes

2. **Add Validation Methods** (High Priority)
   - `Issue::validate()`
   - `QualityReport::validate()`
   - `DAG::validate()`
   - `IssueTraceLog::validate()`
   - **Estimated time**: 2 hours

3. **Add Tests for Validation** (High Priority)
   - Test valid inputs (happy path)
   - Test invalid inputs (error cases)
   - Test edge cases (empty, max length, etc.)
   - **Estimated time**: 1 hour

### Future Improvements (Next Sprint)

4. **Type Safety Enhancements** (Medium Priority)
   - Introduce newtype wrappers for IDs
   - Add URL validation
   - Add version string validation
   - **Estimated time**: 4 hours

5. **Documentation** (Medium Priority)
   - Document validation rules
   - Update Rustdoc comments
   - Add examples to docs
   - **Estimated time**: 2 hours

---

## 🔗 Related Issues

- Issue #201: Baseline & Guardrails Setup (dependency)
- Issue #203: Update Consumers (will be impacted by changes)

---

## ✅ Success Criteria

1. **Zero validation inconsistencies** - All types have consistent validation
2. **100% test coverage** - All validation paths tested
3. **Zero compilation errors** - All consumers compile successfully
4. **Documentation complete** - All invariants documented

---

**End of Analysis Report**

# Phase 2 Architectural Decision - Naming Conflict Resolution

**Date**: 2025-11-04 02:00:00 UTC
**Status**: 🚨 **REQUIRES DECISION**

---

## 🚨 Critical Issue Discovered

During Phase 2 analysis, I discovered a **naming conflict** between:

1. **miyabi-core::error::MiyabiError** (Phase 1) - **Trait** for unified error interface
2. **miyabi-types::error::MiyabiError** (Existing) - **Enum** as main error type

### Current State

**miyabi-core** (Phase 1 - NEW):
```rust
// Trait for unified error interface
pub trait MiyabiError: std::error::Error {
    fn code(&self) -> ErrorCode;
    fn user_message(&self) -> String;
    fn context(&self) -> Option<&dyn Any>;
}
```

**miyabi-types** (Existing - 625 lines):
```rust
// Main error enum for Miyabi operations
#[derive(Error, Debug)]
pub enum MiyabiError {
    Agent(#[from] AgentError),
    Escalation(#[from] EscalationError),
    CircularDependency(#[from] CircularDependencyError),
    Io(#[from] std::io::Error),
    Json(#[from] serde_json::Error),
    Http(String),
    GitHub(String),
    Git(String),
    // ... 15 total variants
}
```

---

## 📊 Analysis

### miyabi-types::MiyabiError Characteristics

**Strengths**:
- ✅ Well-structured with 15 comprehensive variants
- ✅ Domain-specific errors (AgentError, EscalationError, CircularDependencyError)
- ✅ Comprehensive test coverage (62 tests)
- ✅ Already used throughout the codebase
- ✅ Good error messages and display formatting

**Weaknesses**:
- ❌ Many variants use raw `String` (Http, GitHub, Git, Auth, Config, etc.)
- ❌ No error codes for programmatic handling
- ❌ No user-friendly message abstraction
- ❌ Limited context information

**Dependencies**:
- Uses types from `crate::agent` (AgentType, EscalationTarget, Severity)
- Foundation for all Miyabi error handling

### Scope

**Files Using miyabi-types::MiyabiError**: ~100+ files across workspace
**Breaking Change Impact**: **VERY HIGH** if renamed

---

## 🎯 Resolution Options

### Option 1: Rename miyabi-core Trait (RECOMMENDED)

**Approach**: Rename the Phase 1 trait to avoid conflict

**Before** (miyabi-core):
```rust
pub trait MiyabiError: std::error::Error { ... }
```

**After** (miyabi-core):
```rust
pub trait UnifiedError: std::error::Error {
    fn code(&self) -> ErrorCode;
    fn user_message(&self) -> String;
    fn context(&self) -> Option<&dyn Any>;
}

// Or alternative name:
pub trait ErrorCodeProvider: std::error::Error { ... }
```

**Pros**:
- ✅ Zero breaking changes to existing code
- ✅ Clear distinction (trait vs enum)
- ✅ Can proceed with Phase 2 immediately
- ✅ Existing codebase unaffected

**Cons**:
- ⚠️ Less intuitive name for the trait
- ⚠️ Need to update Phase 1 PR (#729)

**Implementation**:
1. Update miyabi-core trait name
2. Update miyabi-core RulesError implementation
3. Update miyabi-core exports
4. Update Phase 1 PR
5. Proceed with Phase 2

### Option 2: Rename miyabi-types Enum (NOT RECOMMENDED)

**Approach**: Rename the existing enum to `Error` or `MiyabiOperationError`

**Before** (miyabi-types):
```rust
pub enum MiyabiError { ... }
```

**After** (miyabi-types):
```rust
pub enum Error { ... }
// or
pub enum MiyabiOperationError { ... }
```

**Pros**:
- ✅ Keeps "MiyabiError" name for the trait (more intuitive)
- ✅ Aligns with Rust naming conventions (Error enum in error module)

**Cons**:
- ❌ **BREAKING CHANGE** across 100+ files
- ❌ High migration effort
- ❌ Disrupts ongoing development
- ❌ Requires updating all dependent crates

**Impact Assessment**: **TOO COSTLY**

### Option 3: Namespace Separation (ALTERNATIVE)

**Approach**: Keep both names, use full paths

```rust
// In miyabi-core
pub use error::MiyabiError as MiyabiErrorTrait;

// In miyabi-types
pub use error::MiyabiError as MiyabiError;  // Keep as-is

// Usage
impl miyabi_core::MiyabiErrorTrait for miyabi_types::MiyabiError { ... }
```

**Pros**:
- ✅ Both names preserved
- ✅ No breaking changes
- ✅ Clear via explicit imports

**Cons**:
- ⚠️ Confusing for developers
- ⚠️ Requires careful import management
- ⚠️ Error-prone

---

## 💡 Recommended Solution

**✅ Option 1: Rename miyabi-core Trait**

**New Name**: `UnifiedError`

**Rationale**:
1. **Minimal Impact**: Only affects Phase 1 code (not yet merged)
2. **Clear Semantics**: "UnifiedError" clearly indicates it's a trait for error unification
3. **No Breaking Changes**: Existing codebase completely unaffected
4. **Fast Implementation**: Can proceed with Phase 2 immediately

**Updated Architecture**:

```rust
// miyabi-core::error
pub trait UnifiedError: std::error::Error {
    fn code(&self) -> ErrorCode;
    fn user_message(&self) -> String;
    fn context(&self) -> Option<&dyn Any>;
}

pub enum CoreError {
    Io { ... },
    Parse { ... },
    Config(String),
    Internal(String),
}

impl UnifiedError for CoreError { ... }

// miyabi-types::error (unchanged)
pub enum MiyabiError {
    Agent(#[from] AgentError),
    // ... existing variants
}

// Phase 2: Implement UnifiedError for miyabi-types
impl miyabi_core::error::UnifiedError for MiyabiError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::Agent(_) => ErrorCode::AGENT_ERROR,
            Self::Io(_) => ErrorCode::IO_ERROR,
            // ... all variants
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::Agent(e) => format!("Agent {} failed: {}", e.agent_type, e.message),
            // ... user-friendly messages for all variants
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::Agent(e) => e.task_id.as_ref().map(|id| id as &dyn Any),
            Self::Escalation(e) => Some(&e.context as &dyn Any),
            // ... context for relevant variants
        }
    }
}
```

---

## 📋 Action Plan

### Phase 1.5: Fix Naming Conflict (Immediate)

1. **Update miyabi-core::error module**
   - Rename `MiyabiError` trait → `UnifiedError`
   - Update all trait implementations
   - Update module exports

2. **Update Phase 1 PR (#729)**
   - Update commit message
   - Update PR description
   - Note the rename decision

3. **Run Tests**
   - Verify no breakage
   - All tests still passing

**Estimated Time**: 30 minutes
**Risk**: Very low (only affects un-merged code)

### Phase 2: Migrate miyabi-types (Next)

1. **Implement UnifiedError for MiyabiError**
   - Add error codes for all 15 variants
   - Add user-friendly messages
   - Add context extraction

2. **Enhance Structured Errors**
   - Replace `String` variants with structured types
   - E.g., `Http(String)` → `Http { url: String, status: Option<u16>, source: Option<...> }`

3. **Add Error Code Constants**
   - Define all error codes in miyabi-core
   - Map miyabi-types variants to codes

**Estimated Time**: 2-3 hours
**Risk**: Low (backward compatible)

---

## 🎯 Decision Required

**Question**: Should we proceed with Option 1 (Rename miyabi-core trait to `UnifiedError`)?

**If Yes**:
- I'll immediately update Phase 1 code
- Update PR #729
- Proceed with Phase 2 migration

**If No** (Alternative preferred):
- Please specify preferred option
- I'll adjust the plan accordingly

---

**Recommendation**: ✅ **PROCEED WITH OPTION 1**

This is the fastest, safest path forward with minimal disruption.

---

**Report Generated**: 2025-11-04 02:00:00 UTC
**Phase**: Phase 2 Pre-Migration Analysis
**Status**: ⏸️ **AWAITING USER DECISION**

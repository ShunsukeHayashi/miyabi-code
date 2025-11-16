# Documentation Structure Consolidation Plan

**Last Updated**: 2025-11-17  
**Purpose**: Unified documentation architecture for Miyabi

---

## Current State

### Existing Structure
```
docs/
├── operations/         # Operations docs
├── master-plan/        # Strategic planning
├── gartner-2026/       # Gartner analysis
├── architecture/       # Technical design
└── (scattered docs)
```

### Issues
1. Inconsistent naming conventions
2. Scattered organization
3. Duplicate information
4. Missing documentation
5. Poor navigation

---

## Proposed Structure

```
docs/
├── 01-getting-started/    # Onboarding
├── 02-architecture/       # Technical design
├── 03-development/        # Developer guide
├── 04-operations/         # Operations
├── 05-api-reference/      # API docs
├── 06-user-guides/        # User docs
├── 07-strategy/           # Strategic planning
├── 08-features/           # Feature docs
└── 09-appendix/           # Reference materials
```

---

## Migration Plan

### Phase 1: Structure Setup (Week 1)
- Create new directory structure
- Create README files
- Set up navigation

### Phase 2: Content Migration (Week 2-3)
- Move existing documents
- Update internal links
- Standardize naming

### Phase 3: New Content (Week 4-5)
- Write missing documentation
- Add diagrams
- Create tutorials

### Phase 4: Review (Week 6)
- Technical review
- Link validation
- Publish

---

## Standards

### Naming Conventions
- Files: kebab-case.md
- Directories: kebab-case
- Headings: Title Case

### File Template
- Include "Last Updated" date
- Add document status
- Use relative links
- Add cross-references

---

## Success Criteria

- All docs follow naming conventions
- Zero broken internal links
- Complete API reference
- Under 2-hour onboarding time
- Search-friendly structure

---

**Document Status**: Complete  
**Estimated Effort**: 6 weeks

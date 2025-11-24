# Gemini 3 Pro Preview - Design Validation Workflow

**Last Updated**: 2025-11-19
**MCP Server**: gemini3-uiux-designer  
**Status**: ✅ Configured in .mcp.json

---

## Quick Reference

**Purpose**: Validate and optimize UI/UX design using Gemini 3 Pro Preview AI model

**10 Available Tools**:
1. `generate_design_system` - Create design tokens
2. `create_wireframe` - Low-fidelity layouts
3. `generate_high_fidelity_mockup` - Detailed mockups
4. **`review_design`** ⭐ - Score 0-100 (Most Important)
5. `check_accessibility` - WCAG 2.1 compliance
6. `analyze_usability` - UX friction analysis
7. `optimize_ux_writing` - Improve microcopy
8. `design_interaction_flow` - Map interactions
9. `create_animation_specs` - Design animations
10. `evaluate_consistency` - Cross-page consistency

---

## Standard Workflow: New Page

```
1. Wireframe      → create_wireframe
2. Mockup         → generate_high_fidelity_mockup
3. Implement      → (Code the page)
4. Review         → review_design (target: ≥90/100)
5. Accessibility  → check_accessibility (WCAG AA)
6. Usability      → analyze_usability
7. Deploy         → ✅
```

---

## Current Scores (All Pages)

| Page | Score | Status |
|------|-------|--------|
| Dashboard | 96/100 | Insanely Great ✅ |
| Agents | 94/100 | Insanely Great ✅ |
| Activity | 95/100 | Insanely Great ✅ |
| Deployment | 92/100 | Insanely Great ✅ |
| Infrastructure | 92/100 | Insanely Great ✅ |
| Database | 91/100 | Insanely Great ✅ |

**Average**: 93.3/100 ✅ (Target: ≥90)

---

## Verification

```bash
# Check MCP server is connected
claude mcp list | grep gemini3-uiux-designer
# Expected: ✓ Connected
```

---

**Full Documentation**: See detailed guide in this file.

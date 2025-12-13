# UI Widget Architecture

## Overview

Miyabi's ChatGPT UI integration uses **widgets** - HTML files that render in ChatGPT's interface via the `ui://widget/` protocol.

## Directory Structure

```
openai-apps/miyabi-app/
├── server/
│   ├── widgets/           # ✅ Widget HTML files (SINGLE SOURCE OF TRUTH)
│   │   ├── agent_cards.html
│   │   ├── onboarding_wizard.html
│   │   ├── quick_actions.html
│   │   └── ...
│   └── tools/
│       └── ui_tools.py    # Tool definitions with widget references
├── assets/                # Vite-built JavaScript/CSS
└── scripts/
    └── validate_widget_refs.py  # CI validation script
```

## Naming Convention

All widget files use **snake_case** naming:

| ✅ Correct | ❌ Wrong |
|-----------|----------|
| `agent_cards.html` | `agent-cards.html` |
| `onboarding_wizard.html` | `onboarding.html` |
| `quick_actions.html` | `quick-actions.html` |
| `toast_notification.html` | `notification.html` |

## Widget Reference Flow

```
ui_tools.py (WIDGET_MAP)
    ↓
widget_uri("onboarding")
    ↓
"ui://widget/onboarding_wizard.html"
    ↓
ChatGPT UI requests resource
    ↓
MCP resources/read endpoint
    ↓
main.py load_widget_html()
    ↓
server/widgets/onboarding_wizard.html
```

## Adding New Widgets

1. **Create widget file** in `server/widgets/` using snake_case:
   ```
   server/widgets/my_new_widget.html
   ```

2. **Add to WIDGET_MAP** in `ui_tools.py`:
   ```python
   WIDGET_MAP = {
       ...
       "my_new_widget": "my_new_widget.html",
   }
   ```

3. **Define tool** using `widget_uri()`:
   ```python
   ToolDefinition(
       name="show_my_widget",
       ...
       meta={
           "openai/outputTemplate": widget_uri("my_new_widget"),
           **WIDGET_META,
       },
   ),
   ```

4. **Run validation**:
   ```bash
   python openai-apps/miyabi-app/scripts/validate_widget_refs.py
   ```

## CI Validation

The `.github/workflows/ui-widget-validation.yml` workflow automatically validates widget references on:
- Push to `openai-apps/miyabi-app/server/tools/ui_tools.py`
- Push to `openai-apps/miyabi-app/server/widgets/**`
- Pull requests touching these files

## Troubleshooting

### Widget not displaying

1. **Check file exists**:
   ```bash
   ls openai-apps/miyabi-app/server/widgets/
   ```

2. **Validate references**:
   ```bash
   python openai-apps/miyabi-app/scripts/validate_widget_refs.py
   ```

3. **Check WIDGET_MAP** in `ui_tools.py` has correct mapping

### Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Widget not found" | Wrong filename in WIDGET_MAP | Match exact filename in widgets/ |
| Widget loads but empty | JS error | Check browser console |
| Widget shows raw HTML | CSP issue | Verify domain whitelist |

## Available Widgets

| Widget | File | Description |
|--------|------|-------------|
| Agent Cards | `agent_cards.html` | Display agent collection |
| Agent TCG | `agent_tcg.html` | Trading card style agent |
| Onboarding | `onboarding_wizard.html` | New user setup wizard |
| Quick Actions | `quick_actions.html` | Context-aware action buttons |
| Subscription | `subscription_manager.html` | Billing management |
| Notification | `toast_notification.html` | Toast messages |
| Project Status | `project_status.html` | Git/project overview |
| Issue List | `issue_list.html` | GitHub issues |
| PR List | `pr_list.html` | Pull requests |

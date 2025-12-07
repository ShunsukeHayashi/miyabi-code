# Agent Pane Mapping

## miyabi-main:6 (agents window)

| Pane ID | Agent Name | Role | Japanese |
|---------|------------|------|----------|
| `%18` | Shikiroon | Conductor/Orchestrator | 指揮郎 |
| `%19` | Kaede | CodeGen Specialist | 楓 |
| `%20` | Sakura | Review Specialist | 桜 |
| `%21` | Tsubaki | PR Manager | 椿 |
| `%22` | Botan | Deploy Specialist | 牡丹 |
| `%23` | Mitsukeroon | Issue Manager | 見付郎 |

## Quick Reference

### Conductor (指揮郎)
```bash
MIYABI_CONDUCTOR_PANE="%18"
```

### Get All Pane IDs
```bash
tmux list-panes -t miyabi-main:6 -F "#{pane_id} #{pane_current_command}"
```

### Check Pane Exists
```bash
tmux has-session -t %18 2>/dev/null && echo "exists"
```

## Communication Paths

```
                    指揮郎 (%18)
                   /   |   \
                  /    |    \
                 ↓     ↓     ↓
           楓(%19) 桜(%20) 見付郎(%23)
              |       |
              ↓       ↓
           椿(%21) ←──┘
              |
              ↓
          牡丹(%22)
```

## Workflow Patterns

### Issue → Deploy Flow
```
見付郎(%23) → 楓(%19) → 桜(%20) → 椿(%21) → 牡丹(%22)
     ↓            ↓          ↓          ↓          ↓
   指揮郎       指揮郎     指揮郎     指揮郎     指揮郎
    (%18)       (%18)      (%18)      (%18)      (%18)
```

### Bug Fix Flow
```
見付郎(%23) → 楓(%19) → 桜(%20) → 椿(%21)
                ↑______________|
                  (修正依頼)
```

## Environment Variables

```bash
export MIYABI_CONDUCTOR_PANE="%18"
export MIYABI_CODEGEN_PANE="%19"
export MIYABI_REVIEW_PANE="%20"
export MIYABI_PR_PANE="%21"
export MIYABI_DEPLOY_PANE="%22"
export MIYABI_ISSUE_PANE="%23"
```

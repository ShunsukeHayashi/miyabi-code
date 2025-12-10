---
name: tmux-permanent-pane-targeting
description: |
  Reliable tmux pane targeting using permanent IDs (%N) instead of unreliable index-based targeting (session:window.pane). Use this skill when sending commands to tmux panes, orchestrating multiple agents, debugging pane targeting issues, or implementing Control Mode integration. Triggers include "send to pane", "target pane", "pane ID", "tmux targeting", "wrong pane", "pane mismatch", "Control Mode", "%0 vs index".
---

# tmux Permanent Pane Targeting

Use permanent pane IDs (`%N`) for 100% reliable tmux pane targeting.

## The Problem

Index-based targeting is **unreliable**:

```bash
# DANGEROUS - Index can point to wrong pane!
tmux send-keys -t miyabi-dev:0.0 'command'  # May hit %2 instead of %0!

# Test proof:
tmux display-message -t %0 -p "Pane %0 = #{pane_id}"
# → Pane %0 = %0 (correct)

tmux display-message -t miyabi-dev:0.0 -p "Index 0.0 = #{pane_id}"
# → Index 0.0 = %2 (WRONG!)
```

## The Solution

**Always use permanent pane IDs** (`%0`, `%1`, `%2`, etc.):

```bash
# SAFE - Permanent ID is always correct
tmux send-keys -t %0 'command' && sleep 0.5 && tmux send-keys -t %0 Enter
```

## ID Namespaces

| Prefix | Entity | Example | Lifetime |
|--------|--------|---------|----------|
| `$N` | Session | `$0`, `$1` | Server lifetime |
| `@N` | Window | `@0`, `@12` | Server lifetime |
| `%N` | Pane | `%0`, `%7` | Server lifetime |

**IDs never change** during tmux server lifetime. They are monotonically increasing and never reused.

## Get Permanent IDs

### List all panes with IDs
```bash
tmux list-panes -a -F "#{session_name}:#{window_index}.#{pane_index} #{pane_id} #{pane_current_command}"
```

### Get current pane ID
```bash
tmux display-message -p "#{pane_id}"
```

### Build pane mapping
```bash
# Create session → pane_id map
declare -A PANE_MAP
while IFS=' ' read -r target pane_id; do
  PANE_MAP[$target]=$pane_id
done < <(tmux list-panes -a -F "#{session_name}:#{window_index}.#{pane_index} #{pane_id}")
```

## P0.2 Protocol with Permanent IDs

```bash
# Correct format (MANDATORY)
tmux send-keys -t %18 'message' && sleep 0.5 && tmux send-keys -t %18 Enter

# Never use index-based (FORBIDDEN)
tmux send-keys -t miyabi-orchestra:0.0 'message'  # DON'T DO THIS
```

## Rust Implementation

```rust
pub struct TmuxPane {
    pub session: String,
    pub window: usize,
    pub pane: usize,
    /// Permanent pane ID - ALWAYS use for targeting
    pub pane_id: Option<String>,
}

impl TmuxPane {
    pub fn target(&self) -> String {
        // Prefer permanent ID (reliable)
        if let Some(ref id) = self.pane_id {
            return id.clone();
        }
        // Fallback to index (unreliable)
        format!("{}:{}.{}", self.session, self.window, self.pane)
    }
}
```

## Control Mode (Advanced)

For structured communication, use Control Mode (`tmux -C`):

```bash
# Structured output with %begin/%end markers
echo "list-panes -a -F '#{pane_id}'" | tmux -C

# Response format:
# %begin 1764989889 2359 1
# %0
# %1
# %2
# %end 1764989889 2359 1
```

Benefits:
- Structured `%begin/%end/%error` blocks
- Automatic notifications (`%output`, `%layout-change`)
- Machine-parseable output

See `references/control-mode-protocol.md` for complete protocol.

## Migration Checklist

When updating code to use permanent IDs:

1. [ ] Replace `session:window.pane` with `%N` format
2. [ ] Fetch pane IDs at initialization
3. [ ] Store pane_id in agent/pane structs
4. [ ] Update targeting functions to prefer pane_id
5. [ ] Add fallback for backward compatibility

## Scripts

- `scripts/get_pane_map.sh` - Generate pane ID mapping
- `scripts/validate_targeting.sh` - Test targeting reliability

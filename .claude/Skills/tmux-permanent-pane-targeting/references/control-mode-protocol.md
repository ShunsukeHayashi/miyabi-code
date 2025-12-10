# tmux Control Mode Protocol Reference

Based on Mitchell Hashimoto's (@mitchellh) analysis of tmux source code.

## Activation

```bash
tmux -C        # Control mode
tmux -CC       # Control mode without echo
```

## Output Structure

All commands return structured output:

```
%begin <timestamp> <command_num> <flags>
[output lines]
%end <timestamp> <command_num> <flags>     # success
%error <timestamp> <command_num> <flags>   # failure
```

Example:
```
%begin 1764989889 2359 1
miyabi-dev:1.0 %0 zsh
miyabi-dev:1.1 %2 claude
%end 1764989889 2359 1
```

## Notifications (Asynchronous)

Control Mode automatically sends notifications:

| Notification | Description |
|-------------|-------------|
| `%output %N value` | Pane output |
| `%layout-change @N ...` | Layout changed |
| `%window-add @N` | Window created |
| `%window-close @N` | Window destroyed |
| `%session-changed $N name` | Session switched |
| `%sessions-changed` | Session list changed |
| `%pause %N` | Pause output for pane |
| `%continue %N` | Resume output for pane |

## Data Model

```
Server
├── Sessions ($N) - persistent contexts
│   └── Winlinks (indices) → Windows
├── Windows (@N) - global, can exist in multiple sessions
│   ├── Layout Tree (LEFTRIGHT/TOPBOTTOM/WINDOWPANE)
│   └── Panes (%N) - terminal subdivisions
└── Clients - connections
```

**Key insight**: Windows are global and can be linked to multiple sessions via winlinks.

## Character Escaping

Non-printable characters → octal `\XXX`
Backslash → `\\`

## Flow Control

- Buffer limits: 512B (low), 8192B (high)
- pause-after mode: Sends %pause when buffering exceeds threshold
- Max age without pause: 300,000ms (5 min) → client exits

## Source References (tmux.h)

```c
struct session      // lines 1415-1450
struct window       // lines 1263-1316
struct window_pane  // lines 1170-1259
struct layout_cell  // lines 1378-1393
struct client       // lines 1934-2116
```

## Control Mode Implementation (control.c)

```c
struct control_state  // lines 115-128
struct control_pane   // lines 44-60
```

## Practical Usage

### Get structured pane list
```bash
echo "list-panes -a -F '#{session_name}:#{window_index}.#{pane_index} #{pane_id}'" | tmux -C
```

### Subscribe to format changes
```bash
echo "refresh-client -B 'mysubscription:1:#{pane_id}'" | tmux -C
# Receives: %subscription-changed mysubscription ... : %0
```

### Execute with error handling
```bash
result=$(echo "send-keys -t %99 'test'" | tmux -C 2>&1)
if echo "$result" | grep -q "^%error"; then
    echo "Command failed"
fi
```

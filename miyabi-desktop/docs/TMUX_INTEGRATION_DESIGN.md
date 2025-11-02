# Tmux Integration Design Document

**Version**: 1.0.0
**Date**: 2025-11-01
**Status**: Design Phase

---

## 🎯 Overview

Integrate tmux session management into Miyabi Desktop App to support multiple external coding agents running in isolated tmux sessions. This feature allows users to manage Cloud Code (Skaffold), Codex (OpenAI API), and Gemini CLI (gcloud) through a unified desktop interface.

---

## 📋 Requirements

### Functional Requirements

1. **Tmux Session Management**
   - Create, list, attach, and kill tmux sessions
   - Support named sessions for each agent
   - Session persistence across app restarts
   - Multiple concurrent sessions

2. **External Agent Integration**
   - **Cloud Code**: Skaffold-based Kubernetes development (`skaffold dev --port-forward`)
   - **Codex**: OpenAI API via curl (`gpt-4o` model)
   - **Gemini CLI**: Google Cloud SDK (`gcloud ai-platform models predict gemini-pro`)
   - **Tone**: Placeholder (future implementation)

3. **YAML Configuration**
   - Define agents in YAML format
   - Support custom commands and session names
   - Validation and error handling
   - Hot-reload capability

4. **UI Components**
   - Tmux session list panel
   - Agent status indicators (running/stopped/error)
   - Session output viewer (integrated with xterm.js)
   - Control buttons (start/stop/restart)

### Non-Functional Requirements

- Performance: Low overhead for session management
- Security: Sanitize commands to prevent injection
- Reliability: Graceful degradation if tmux not installed
- Usability: Intuitive UI matching existing Miyabi design

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────┐
│         React Frontend (TypeScript)         │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │   TmuxManagerPanel.tsx                │ │
│  │   - Session list                      │ │
│  │   - Agent cards                       │ │
│  │   - Control buttons                   │ │
│  └───────────────────────────────────────┘ │
│                    │                        │
│                    │ Tauri IPC              │
└────────────────────┼────────────────────────┘
                     │
┌────────────────────┼────────────────────────┐
│         Rust Backend (Tauri)                │
│                    │                        │
│  ┌─────────────────▼───────────────────┐   │
│  │        tmux.rs                      │   │
│  │  - TmuxManager struct               │   │
│  │  - Session lifecycle                │   │
│  │  - Command execution                │   │
│  └─────────────────┬───────────────────┘   │
│                    │                        │
│  ┌─────────────────▼───────────────────┐   │
│  │     config/agents.rs                │   │
│  │  - YAML parser (serde_yaml)         │   │
│  │  - AgentConfig struct               │   │
│  │  - Validation                       │   │
│  └─────────────────┬───────────────────┘   │
│                    │                        │
│  ┌─────────────────▼───────────────────┐   │
│  │      lib.rs (Tauri commands)        │   │
│  │  - #[tauri::command] wrappers       │   │
│  │  - Error handling                   │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                     │
                     │ Process spawn
                     │
┌────────────────────▼────────────────────────┐
│            System (macOS)                   │
│                                             │
│  ┌───────────┐  ┌───────────┐  ┌────────┐ │
│  │   tmux    │  │ skaffold  │  │ gcloud │ │
│  │  sessions │  │    dev    │  │   ai   │ │
│  └───────────┘  └───────────┘  └────────┘ │
└─────────────────────────────────────────────┘
```

### Data Flow

1. **User triggers action** (e.g., "Start Cloud Code agent")
2. **React component** calls Tauri command via `invoke()`
3. **Tauri backend** receives command in `lib.rs`
4. **tmux.rs module** executes tmux command
5. **Process spawns** tmux session with agent-specific command
6. **Status update** sent back to frontend via Tauri events
7. **UI updates** to reflect new session state

---

## 📁 File Structure

```
miyabi-desktop/
├── src-tauri/
│   ├── src/
│   │   ├── tmux.rs              # New: Tmux session manager
│   │   ├── config/
│   │   │   └── agents.rs        # New: YAML parser & config
│   │   ├── lib.rs               # Modified: Add tmux commands
│   │   └── ...
│   └── Cargo.toml               # Modified: Add dependencies
│
├── src/
│   ├── components/
│   │   └── TmuxManager.tsx      # New: Tmux management UI
│   ├── stores/
│   │   └── tmuxStore.ts         # New: Zustand store for tmux
│   └── App.tsx                  # Modified: Add TmuxManager route
│
├── .miyabi/
│   └── agents.yaml              # New: Agent configuration
│
└── docs/
    └── TMUX_INTEGRATION_DESIGN.md  # This file
```

---

## 🔧 Implementation Details

### 1. Rust Backend: `tmux.rs`

**Dependencies** (add to `Cargo.toml`):
```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_yaml = "0.9"
tokio = { version = "1", features = ["process", "io-util"] }
anyhow = "1.0"
```

**Module Structure**:
```rust
// src-tauri/src/tmux.rs

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tokio::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TmuxSession {
    pub session_name: String,
    pub agent_name: String,
    pub status: SessionStatus,
    pub command: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SessionStatus {
    Running,
    Stopped,
    Error(String),
}

pub struct TmuxManager;

impl TmuxManager {
    pub async fn create_session(
        session_name: &str,
        command: &str,
    ) -> Result<()> {
        // Implementation
    }

    pub async fn list_sessions() -> Result<Vec<TmuxSession>> {
        // Implementation
    }

    pub async fn attach_session(session_name: &str) -> Result<()> {
        // Implementation
    }

    pub async fn kill_session(session_name: &str) -> Result<()> {
        // Implementation
    }

    pub async fn check_session_exists(session_name: &str) -> Result<bool> {
        // Implementation
    }
}
```

### 2. YAML Configuration: `agents.yaml`

**File Location**: `miyabi-desktop/.miyabi/agents.yaml`

**Schema**:
```yaml
# Tmux Agent Configuration
# Format: coding_agents list with session_name, command, description

coding_agents:
  - agent: Cloud Code
    session_name: cloud-code-session
    description: "Skaffold dev mode for Kubernetes local development"
    command: |
      skaffold dev --port-forward

  - agent: Codex (via OpenAI API)
    session_name: codex-session
    description: "OpenAI GPT-4o API for code generation"
    command: |
      curl https://api.openai.com/v1/chat/completions \
        -H "Authorization: Bearer $OPENAI_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
          "model": "gpt-4o",
          "messages": [
            {
              "role": "system",
              "content": "You are a coding assistant."
            },
            {
              "role": "user",
              "content": "Pythonでリストをソートする関数を書いてください。"
            }
          ]
        }' \
        -w "\n"

  - agent: Gemini CLI (via gcloud)
    session_name: gemini-cli-session
    description: "Google Cloud Gemini Pro model via gcloud CLI"
    command: |
      gcloud ai-platform models predict gemini-pro \
        --project=$GCLOUD_PROJECT \
        --region=us-central1 \
        --json-request=<(echo '{
          "instances": [
            { "prompt": "Write a TypeScript function to fetch data from an API." }
          ]
        }')

  - agent: Tone
    session_name: tone-session
    description: "Placeholder for future Tone agent integration"
    command: |
      echo "Tone agent placeholder - not implemented"; bash
```

**Rust Config Parser** (`config/agents.rs`):
```rust
// src-tauri/src/config/agents.rs

use serde::{Deserialize, Serialize};
use std::fs;
use anyhow::{Context, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    pub agent: String,
    pub session_name: String,
    pub description: String,
    pub command: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentsConfig {
    pub coding_agents: Vec<AgentConfig>,
}

impl AgentsConfig {
    pub fn load_from_file(path: &str) -> Result<Self> {
        let contents = fs::read_to_string(path)
            .context("Failed to read agents.yaml")?;
        let config: AgentsConfig = serde_yaml::from_str(&contents)
            .context("Failed to parse YAML")?;
        Ok(config)
    }

    pub fn validate(&self) -> Result<()> {
        // Validate required fields, command safety, etc.
        Ok(())
    }
}
```

### 3. Tauri Commands: `lib.rs`

**New Commands**:
```rust
// src-tauri/src/lib.rs

use crate::tmux::{TmuxManager, TmuxSession};
use crate::config::agents::AgentsConfig;

#[tauri::command]
async fn tmux_start_agent(agent_name: String) -> Result<(), String> {
    let config = AgentsConfig::load_from_file(".miyabi/agents.yaml")
        .map_err(|e| e.to_string())?;

    let agent = config.coding_agents
        .iter()
        .find(|a| a.agent == agent_name)
        .ok_or_else(|| format!("Agent '{}' not found", agent_name))?;

    TmuxManager::create_session(&agent.session_name, &agent.command)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn tmux_list_sessions() -> Result<Vec<TmuxSession>, String> {
    TmuxManager::list_sessions()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn tmux_kill_session(session_name: String) -> Result<(), String> {
    TmuxManager::kill_session(&session_name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn tmux_load_config() -> Result<AgentsConfig, String> {
    AgentsConfig::load_from_file(".miyabi/agents.yaml")
        .map_err(|e| e.to_string())
}
```

### 4. React Frontend: `TmuxManager.tsx`

**Component Structure**:
```tsx
// src/components/TmuxManager.tsx

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface AgentConfig {
  agent: string;
  session_name: string;
  description: string;
  command: string;
}

interface TmuxSession {
  session_name: string;
  agent_name: string;
  status: 'Running' | 'Stopped' | { Error: string };
  command: string;
}

export function TmuxManager() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [sessions, setSessions] = useState<TmuxSession[]>([]);

  useEffect(() => {
    loadConfig();
    refreshSessions();
  }, []);

  async function loadConfig() {
    const config = await invoke<{ coding_agents: AgentConfig[] }>(
      'tmux_load_config'
    );
    setAgents(config.coding_agents);
  }

  async function refreshSessions() {
    const sessions = await invoke<TmuxSession[]>('tmux_list_sessions');
    setSessions(sessions);
  }

  async function startAgent(agentName: string) {
    await invoke('tmux_start_agent', { agentName });
    await refreshSessions();
  }

  async function stopSession(sessionName: string) {
    await invoke('tmux_kill_session', { sessionName });
    await refreshSessions();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tmux Agent Manager</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const session = sessions.find(
            (s) => s.session_name === agent.session_name
          );
          const isRunning = session?.status === 'Running';

          return (
            <Card key={agent.session_name} className="p-4">
              <h3 className="font-semibold text-lg">{agent.agent}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {agent.description}
              </p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isRunning ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <span className="text-xs">
                  {isRunning ? 'Running' : 'Stopped'}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                {!isRunning ? (
                  <Button onClick={() => startAgent(agent.agent)}>
                    Start
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => stopSession(agent.session_name)}
                  >
                    Stop
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

### 5. Zustand Store: `tmuxStore.ts`

**State Management**:
```typescript
// src/stores/tmuxStore.ts

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

interface TmuxSession {
  session_name: string;
  agent_name: string;
  status: 'Running' | 'Stopped' | { Error: string };
  command: string;
}

interface TmuxStore {
  sessions: TmuxSession[];
  loading: boolean;
  error: string | null;

  fetchSessions: () => Promise<void>;
  startAgent: (agentName: string) => Promise<void>;
  killSession: (sessionName: string) => Promise<void>;
}

export const useTmuxStore = create<TmuxStore>((set) => ({
  sessions: [],
  loading: false,
  error: null,

  fetchSessions: async () => {
    set({ loading: true, error: null });
    try {
      const sessions = await invoke<TmuxSession[]>('tmux_list_sessions');
      set({ sessions, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  startAgent: async (agentName: string) => {
    set({ loading: true, error: null });
    try {
      await invoke('tmux_start_agent', { agentName });
      // Refresh sessions after starting
      const sessions = await invoke<TmuxSession[]>('tmux_list_sessions');
      set({ sessions, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  killSession: async (sessionName: string) => {
    set({ loading: true, error: null });
    try {
      await invoke('tmux_kill_session', { sessionName });
      // Refresh sessions after killing
      const sessions = await invoke<TmuxSession[]>('tmux_list_sessions');
      set({ sessions, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },
}));
```

---

## 🔒 Security Considerations

1. **Command Injection Prevention**
   - Sanitize all user-provided input
   - Use parameterized commands where possible
   - Whitelist allowed commands

2. **Environment Variable Handling**
   - Securely store API keys (Keychain on macOS)
   - Don't log sensitive data
   - Use `.env` files with proper gitignore

3. **Process Isolation**
   - Run agents in separate tmux sessions
   - Limit resource usage per session
   - Implement timeout mechanisms

---

## 🧪 Testing Strategy

### Unit Tests

- `tmux.rs`: Session creation, listing, killing
- `config/agents.rs`: YAML parsing, validation

### Integration Tests

- End-to-end session lifecycle
- Config file hot-reload
- Error handling scenarios

### Manual Testing

- macOS compatibility (primary target)
- tmux installation detection
- UI responsiveness

---

## 📋 Implementation Checklist

- [ ] Create `tmux.rs` module
- [ ] Implement `TmuxManager` struct and methods
- [ ] Create `config/agents.rs` for YAML parsing
- [ ] Add Tauri commands in `lib.rs`
- [ ] Create `.miyabi/agents.yaml` config file
- [ ] Implement `TmuxManager.tsx` React component
- [ ] Create `tmuxStore.ts` Zustand store
- [ ] Update `App.tsx` routing
- [ ] Add dependencies to `Cargo.toml`
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update documentation (README)
- [ ] Create user guide

---

## 🚀 Future Enhancements

1. **Advanced Features**
   - Terminal output streaming to xterm.js
   - Session recording and playback
   - Custom agent templates
   - Agent scheduling (cron-like)

2. **UI Improvements**
   - Drag-and-drop agent reordering
   - Session logs viewer
   - Resource usage monitoring
   - Dark/light theme support

3. **Integrations**
   - Claude Code integration
   - GitHub Copilot support
   - Custom agent plugins

---

## 📚 References

- [Tauri Docs](https://tauri.app/)
- [tmux Manual](https://man7.org/linux/man-pages/man1/tmux.1.html)
- [serde_yaml](https://docs.rs/serde_yaml/)
- [React Flow](https://reactflow.dev/)

---

**Next Steps**: Review this design document, then proceed with implementation using `agent-execution` or `rust-development` Skill.

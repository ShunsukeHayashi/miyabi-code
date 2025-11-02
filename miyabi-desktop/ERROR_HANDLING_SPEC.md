# Full Automation Error Handling Specification

## 🎯 Error Detection & Recovery Protocol

### Core Principle
**Every error must be detected, logged, reported to Claude Code, and trigger appropriate recovery actions.**

---

## 📋 Error Categories

### 1. **Dependency Errors**
| Error | Detection | Recovery |
|-------|-----------|----------|
| `tmux not installed` | Check `which tmux` | Display install command: `brew install tmux` |
| `claude CLI not found` | Check `which claude` | Display download link + instructions |
| `miyabi binary missing` | Check `target/release/miyabi` | Run `cargo build --release` |

**Implementation**:
```rust
fn check_dependencies() -> Result<(), Vec<String>> {
    let mut errors = Vec::new();
    
    if !Command::new("which").arg("tmux").status().ok().map(|s| s.success()).unwrap_or(false) {
        errors.push("tmux not found. Install: brew install tmux".to_string());
    }
    
    if !Command::new("which").arg("claude").status().ok().map(|s| s.success()).unwrap_or(false) {
        errors.push("Claude CLI not found. Install from: https://claude.com/code".to_string());
    }
    
    if !errors.is_empty() {
        return Err(errors);
    }
    Ok(())
}
```

---

### 2. **Configuration Errors**
| Error | Detection | Recovery |
|-------|-----------|----------|
| `.env file missing` | Check `repo_root/.env` exists | Create template with instructions |
| `Invalid repo path` | Validate path exists & readable | Show error + suggest fix |
| `GITHUB_REPOSITORY not set` | Parse .env file | Prompt user to configure |

**Implementation**:
```rust
fn validate_config(config: &AutomationConfig) -> Result<(), String> {
    if !config.repo_root.exists() {
        return Err(format!(
            "Repository path does not exist: {}\nPlease check your configuration.",
            config.repo_root.display()
        ));
    }
    
    if !config.repo_root.is_dir() {
        return Err(format!(
            "Repository path is not a directory: {}",
            config.repo_root.display()
        ));
    }
    
    Ok(())
}
```

---

### 3. **Session Management Errors**
| Error | Detection | Recovery |
|-------|-----------|----------|
| `Session already exists` | `tmux has-session` | Auto-cleanup + recreate (implemented ✅) |
| `Cannot create session` | Check tmux new-session output | Show tmux error + diagnostics |
| `Window creation failed` | Check new-window output | Cleanup partial session + retry |

**Implementation**: Already implemented in FullAutomationPanel.tsx (lines 223-266)

---

### 4. **Runtime Errors**
| Error | Detection | Recovery |
|-------|-----------|----------|
| `Claude Code crashes` | Monitor process status | Show crash log + offer restart button |
| `Codex fails` | Check exit code | Display error + suggest manual intervention |
| `Log dir permission denied` | Try mkdir + catch error | Show chmod command to fix |

**Implementation**:
```typescript
// Frontend: FullAutomationPanel.tsx
async function monitorProcessHealth() {
  const outputs = await fetchWindowOutputs();
  
  for (const output of outputs) {
    // Detect crash patterns
    if (output.output.includes('Segmentation fault') ||
        output.output.includes('panic') ||
        output.output.includes('Error:') ||
        output.output.includes('fatal:')) {
      
      setError(`${output.name} encountered an error. Check logs for details.`);
      
      // Send error to Claude Code window
      await safeInvoke('tmux_send_error_to_claude_code', {
        sessionName: session.session_name,
        error: {
          source: output.name,
          message: extractErrorMessage(output.output),
          timestamp: new Date().toISOString()
        }
      });
      
      // Offer recovery options
      setRecoveryOptions([
        { label: 'Restart Failed Process', action: 'restart' },
        { label: 'View Full Logs', action: 'logs' },
        { label: 'Stop Automation', action: 'stop' }
      ]);
    }
  }
}
```

---

### 5. **Network/GitHub API Errors**
| Error | Detection | Recovery |
|-------|-----------|----------|
| `GitHub token invalid` | Check API response 401 | Prompt token update |
| `Rate limit exceeded` | Check API response 429 | Show wait time + retry |
| `Network timeout` | Timeout on API calls | Retry with exponential backoff |

**Implementation**:
```rust
async fn fetch_github_issues(token: &str) -> Result<Vec<Issue>, GitHubError> {
    let response = reqwest::get(GITHUB_API_URL)
        .timeout(Duration::from_secs(10))
        .await
        .map_err(|e| {
            if e.is_timeout() {
                GitHubError::Timeout("GitHub API request timed out. Check network connection.".to_string())
            } else {
                GitHubError::Network(format!("Network error: {}", e))
            }
        })?;
    
    match response.status() {
        StatusCode::OK => { /* parse response */ },
        StatusCode::UNAUTHORIZED => Err(GitHubError::Auth("Invalid GitHub token. Update GITHUB_TOKEN in .env".to_string())),
        StatusCode::FORBIDDEN => {
            let reset_time = response.headers().get("X-RateLimit-Reset");
            Err(GitHubError::RateLimit(format!("Rate limit exceeded. Resets at: {:?}", reset_time)))
        },
        _ => Err(GitHubError::Unknown(format!("Unexpected status: {}", response.status())))
    }
}
```

---

## 🔄 Error → Claude Code → Recovery Flow

```
┌─────────────────────────────────────────────────────┐
│  1. Error Detected (anywhere in system)             │
│     - Dependency missing                             │
│     - Process crash                                  │
│     - Configuration invalid                          │
│     - Network failure                                │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  2. Error Logged & Reported                         │
│     - Write to .ai/logs/errors/                     │
│     - Display in UI error panel                     │
│     - Send to Claude Code window via tmux           │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  3. Claude Code Receives Error                      │
│     - Analyzes error type                           │
│     - Determines recovery strategy                  │
│     - Issues commands via Miyabi CLI                │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  4. Recovery Actions Executed                       │
│     - Auto-fix (e.g., install dependency)           │
│     - Delegate to Codex (e.g., fix code)            │
│     - Manual intervention prompt                    │
│     - Graceful degradation                          │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  5. Verification & Resume                           │
│     - Verify fix applied successfully               │
│     - Resume automation from checkpoint             │
│     - Update status in Monitor window               │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation Checklist

### Rust Backend (automation.rs)
- [ ] Add `check_dependencies()` function
- [ ] Add `validate_config()` function
- [ ] Implement process health monitoring
- [ ] Add GitHub API error handling
- [ ] Create error recovery commands
- [ ] Implement `tmux_send_error_to_claude_code` command

### TypeScript Frontend (FullAutomationPanel.tsx)
- [ ] Add `monitorProcessHealth()` function
- [ ] Implement error display UI
- [ ] Add recovery options buttons
- [ ] Create error → Claude Code messaging
- [ ] Add retry logic with exponential backoff
- [ ] Implement graceful degradation UI

### Testing
- [ ] Test all dependency errors
- [ ] Test configuration errors
- [ ] Test session management errors
- [ ] Test runtime crash scenarios
- [ ] Test GitHub API failures
- [ ] Verify Claude Code receives errors
- [ ] Verify recovery actions work

---

**Next Steps**: Implement all missing error handlers systematically, test each category, document results.


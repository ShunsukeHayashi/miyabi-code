---
title: "Pixel (Maestro) Usability Design - Mobile-First Autonomous Orchestration"
created: 2025-11-17
updated: 2025-11-17
author: "Claude Code - Mac Orchestrator"
category: "architecture"
tags: ["miyabi", "maestro", "pixel", "mobile", "usability", "termux", "lark"]
status: "published"
---

# Pixel (Maestro) Usability Design

**Version**: 1.0.0
**Layer**: Layer 1 - Maestro (Mobile Monitoring & Control)
**Device**: Google Pixel (Termux環境)
**Purpose**: モバイルファーストの自律実行制御インターフェース設計

---

## 🎯 Design Principles (設計原則)

### 1. Mobile-First Approach
- **タップ可能な大きめのボタン** - 指での操作を考慮
- **スワイプジェスチャー** - 左右スワイプでエージェント切り替え
- **音声フィードバック** - VOICEVOX統合で状態通知
- **バッテリー最適化** - 常時監視でもバッテリー消費を最小化

### 2. Instant Visibility (即座の可視性)
- **リアルタイム通知** - Larkでワークフロー実行状況を即座に通知
- **ステータスバッジ** - 各Coordinatorの稼働状態を色で表示
- **進捗インジケーター** - 実行中タスクの進捗をビジュアル表示

### 3. One-Tap Control (ワンタップ制御)
- **クイックアクション** - よく使うコマンドをショートカット化
- **コンテキストメニュー** - 長押しで詳細オプション表示
- **スマートサジェスト** - 履歴ベースのコマンド提案

---

## 📱 User Interface Design

### Main Dashboard (メインダッシュボード)

```
╔════════════════════════════════════════╗
║  🌸 Miyabi Society - Maestro Control  ║
║                                        ║
║  ┌──────────────────────────────────┐ ║
║  │  🟢 MUGEN  │  🟢 MAJIN │ 🟢 Mac  │ ║
║  └──────────────────────────────────┘ ║
║                                        ║
║  📊 Active Workflows (2)               ║
║  ┌──────────────────────────────────┐ ║
║  │ #1030 ✅ Completed               │ ║
║  │ MUGEN │ 4s │ System Verification │ ║
║  └──────────────────────────────────┘ ║
║                                        ║
║  ┌──────────────────────────────────┐ ║
║  │ #1029 🔄 Running...              │ ║
║  │ MAJIN │ 2m 15s │ GPU Training    │ ║
║  │ ████████░░░░░░░░  50%            │ ║
║  └──────────────────────────────────┘ ║
║                                        ║
║  [ 🚀 Launch New ]  [ 📜 History ]   ║
╚════════════════════════════════════════╝
```

### Quick Actions Menu (クイックアクションメニュー)

**Swipe Up from Bottom (下から上にスワイプ)**:

```
╔════════════════════════════════════════╗
║  ⚡ Quick Actions                      ║
║                                        ║
║  [ 🎯 Execute Issue ]                 ║
║  [ 🔄 Refresh Status ]                ║
║  [ 📊 View Metrics ]                  ║
║  [ 🛑 Emergency Stop ]                ║
║  [ 📞 Contact Human ]                 ║
║                                        ║
╚════════════════════════════════════════╝
```

### Notification Design (通知設計)

**Lark Notification Format**:

```
🤖 Miyabi Society - Workflow Update

📌 Issue #1030: System Verification

Status: 🔄 Started
Coordinator: MUGEN (ip-172-31-40-36)
Started: 2025-11-17 08:12:19 UTC

[📊 View Details] [🛑 Stop]
```

**Follow-up Notification on Completion**:

```
✅ Workflow Completed Successfully

Issue #1030: System Verification
Duration: 4 seconds
Coordinator: MUGEN

[📄 View Log] [🔁 Rerun]
```

---

## 🎮 Interaction Patterns

### 1. **Issue Execution Flow**

**From Pixel Device**:

```
1. Open Lark on Pixel
2. Navigate to Miyabi Society group
3. Type command:
   /codex 1030 auto

4. Receive instant confirmation:
   "✅ Workflow queued on coordinator: auto"

5. Real-time updates:
   "🔄 MUGEN started processing..."
   "📊 Progress: 50%..."
   "✅ Completed in 4s"
```

**Alternative - GitHub Mobile App**:

```
1. Open GitHub Mobile
2. Navigate to miyabi-private repo
3. Open issue #1030
4. Add label: "codex-execute"

5. Automatic trigger:
   - Workflow starts
   - Lark notification sent to Pixel
```

### 2. **Status Monitoring**

**Termux CLI (for power users)**:

```bash
# Quick status check
miyabi status

# Output:
╔═══════════════════════════════════════╗
║ Miyabi Society Status                 ║
╠═══════════════════════════════════════╣
║ MUGEN:  🟢 Online  │ Load: 15%       ║
║ MAJIN:  🟢 Online  │ Load: 60% (GPU) ║
║ Mac:    🟢 Online  │ Load: 25%       ║
╠═══════════════════════════════════════╣
║ Active Workflows: 1                   ║
║ Queued Tasks: 0                       ║
║ Failed (24h): 0                       ║
╚═══════════════════════════════════════╝

# Watch real-time (auto-refresh)
miyabi watch

# View specific workflow
miyabi logs 19422711157
```

### 3. **Emergency Control**

**Pixel Emergency Actions**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 🚨 Emergency Actions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Voice Command (VOICEVOX):
"ミヤビ、全タスクを停止"
→ All running tasks stopped

Lark Command:
/emergency stop all
→ Immediate shutdown of all coordinators

SMS Fallback (if internet down):
Send SMS to configured number:
"STOP ALL"
→ Triggers emergency shutdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔗 Integration Architecture

### Maestro ↔ Orchestrator Communication

```
┌──────────────────────────────────────────┐
│  Layer 1: Maestro (Pixel)                │
│  ─────────────────────────────────────   │
│  ✓ Lark App                              │
│  ✓ GitHub Mobile                         │
│  ✓ Termux CLI (miyabi command)           │
│  ✓ SSH Client (JuiceSSH / Termux)       │
└─────────────┬────────────────────────────┘
              │
              │ Real-time Status Updates
              │ (Lark Webhooks, MCP Servers)
              │
┌─────────────▼────────────────────────────┐
│  Layer 2: Orchestrator (Mac)             │
│  ─────────────────────────────────────   │
│  ✓ Workflow Dispatcher                   │
│  ✓ Status Aggregator                     │
│  ✓ Notification Engine (Lark MCP)        │
└─────────────┬────────────────────────────┘
              │
              │ Task Distribution
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼──────┐      ┌────▼──────┐
│  MUGEN   │      │  MAJIN    │
│ (Layer 3)│      │ (Layer 3) │
└──────────┘      └───────────┘
```

### Data Flow for Pixel Usability

```
Event: User triggers workflow via Lark
  ↓
1. Lark → Mac Orchestrator (MCP Server)
  ↓
2. Mac validates & dispatches to GitHub Actions
  ↓
3. Workflow starts on Coordinator (MUGEN/MAJIN)
  ↓
4. Coordinator → Mac (status update)
  ↓
5. Mac → Lark (notification to Pixel)
  ↓
6. Pixel displays notification
  ↓
7. User taps notification → Opens Lark with details
```

---

## 📊 Real-Time Metrics for Maestro

### Dashboard Metrics (Pixel Display)

**Performance Metrics**:
```
┌─────────────────────────────────┐
│  📈 Performance (Last 24h)      │
├─────────────────────────────────┤
│  Tasks Completed:     47        │
│  Success Rate:        95.7%     │
│  Avg Duration:        2m 15s    │
│  Total Compute Time:  1.8h      │
│                                 │
│  MUGEN Utilization:   65%       │
│  MAJIN Utilization:   40%       │
│  Mac Utilization:     30%       │
└─────────────────────────────────┘
```

**Cost Tracking** (important for cloud resources):
```
┌─────────────────────────────────┐
│  💰 Cost Estimate (This Month)  │
├─────────────────────────────────┤
│  MUGEN (EC2):      $42.50       │
│  MAJIN (EC2 GPU):  $125.80      │
│  GitHub Actions:   $0.00 (self) │
│  Total:            $168.30      │
│                                 │
│  Budget:           $200.00      │
│  Remaining:        $31.70       │
└─────────────────────────────────┘
```

---

## 🎯 Implementation Roadmap

### Phase 1: Basic Pixel Integration (Week 1)

**Tasks**:
- [ ] Setup Lark bot for Miyabi Society group
- [ ] Implement `/codex` command handler
- [ ] Create notification templates
- [ ] Test on Pixel device

**Deliverables**:
- Working Lark bot
- Basic notification flow
- Documentation

### Phase 2: Enhanced Monitoring (Week 2)

**Tasks**:
- [ ] Implement real-time status dashboard
- [ ] Add workflow progress tracking
- [ ] Integrate cost metrics
- [ ] VOICEVOX voice notifications

**Deliverables**:
- Real-time dashboard
- Cost tracking system
- Voice notification system

### Phase 3: Advanced Control (Week 3)

**Tasks**:
- [ ] Emergency stop functionality
- [ ] Workflow scheduling from Pixel
- [ ] Historical analytics
- [ ] Smart suggestions

**Deliverables**:
- Emergency control system
- Scheduling interface
- Analytics dashboard

### Phase 4: Mobile App (Future)

**Tasks**:
- [ ] Native Android app development
- [ ] Offline support
- [ ] Advanced visualizations
- [ ] Gesture controls

**Deliverables**:
- Miyabi Maestro mobile app
- App store submission

---

## 🛠️ Technical Implementation

### Lark Bot Configuration

**Setup Script** (`scripts/setup-lark-bot.sh`):

```bash
#!/bin/bash
# Lark Bot setup for Miyabi Society

# 1. Create bot in Lark Developer Console
echo "📱 Setting up Lark Bot..."

# 2. Configure webhook URL
export LARK_WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_WEBHOOK"

# 3. Setup MCP server for Lark integration
cd mcp-servers/lark-openapi-mcp-enhanced
npm install
npm run build

# 4. Configure Claude Code to use Lark MCP
cat >> ~/.config/claude-code/settings.json <<EOF
{
  "mcpServers": {
    "lark": {
      "command": "node",
      "args": ["$(pwd)/build/index.js"],
      "env": {
        "LARK_APP_ID": "${LARK_APP_ID}",
        "LARK_APP_SECRET": "${LARK_APP_SECRET}"
      }
    }
  }
}
EOF

echo "✅ Lark Bot configured successfully!"
```

### Notification Service

**File**: `crates/miyabi-notifications/src/lark.rs`

```rust
use serde_json::json;

pub struct LarkNotifier {
    webhook_url: String,
}

impl LarkNotifier {
    pub fn new(webhook_url: String) -> Self {
        Self { webhook_url }
    }

    pub async fn send_workflow_started(
        &self,
        issue_number: u32,
        coordinator: &str,
        workflow_url: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let payload = json!({
            "msg_type": "interactive",
            "card": {
                "header": {
                    "title": {
                        "content": "🤖 Workflow Started",
                        "tag": "plain_text"
                    },
                    "template": "blue"
                },
                "elements": [
                    {
                        "tag": "div",
                        "text": {
                            "content": format!("**Issue #{issue_number}**\\n\\nCoordinator: {coordinator}"),
                            "tag": "lark_md"
                        }
                    },
                    {
                        "tag": "action",
                        "actions": [
                            {
                                "tag": "button",
                                "text": {
                                    "content": "📊 View Details",
                                    "tag": "plain_text"
                                },
                                "url": workflow_url,
                                "type": "primary"
                            }
                        ]
                    }
                ]
            }
        });

        let client = reqwest::Client::new();
        client
            .post(&self.webhook_url)
            .json(&payload)
            .send()
            .await?;

        Ok(())
    }

    pub async fn send_workflow_completed(
        &self,
        issue_number: u32,
        duration: std::time::Duration,
        success: bool,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let status = if success { "✅ Success" } else { "❌ Failed" };
        let color = if success { "green" } else { "red" };

        let payload = json!({
            "msg_type": "interactive",
            "card": {
                "header": {
                    "title": {
                        "content": format!("{status} Workflow Completed"),
                        "tag": "plain_text"
                    },
                    "template": color
                },
                "elements": [
                    {
                        "tag": "div",
                        "text": {
                            "content": format!(
                                "**Issue #{issue_number}**\\n\\nDuration: {:.1}s",
                                duration.as_secs_f64()
                            ),
                            "tag": "lark_md"
                        }
                    }
                ]
            }
        });

        let client = reqwest::Client::new();
        client
            .post(&self.webhook_url)
            .json(&payload)
            .send()
            .await?;

        Ok(())
    }
}
```

### Termux CLI Tool

**File**: `crates/miyabi-cli/src/commands/status.rs`

```rust
use colored::*;
use tokio::time::{sleep, Duration};

pub async fn status_command(watch: bool) -> Result<(), Box<dyn std::error::Error>> {
    loop {
        // Clear screen for watch mode
        if watch {
            print!("\x1B[2J\x1B[1;1H");
        }

        println!("{}", "═".repeat(50).bright_cyan());
        println!("{}", " Miyabi Society Status ".bright_white().bold());
        println!("{}", "═".repeat(50).bright_cyan());

        // Check coordinator status
        let mugen_status = check_coordinator("mugen").await?;
        let majin_status = check_coordinator("majin").await?;
        let mac_status = check_coordinator("mac").await?;

        println!(
            "MUGEN:  {} │ Load: {}%",
            format_status(mugen_status.online),
            mugen_status.load
        );
        println!(
            "MAJIN:  {} │ Load: {}% (GPU)",
            format_status(majin_status.online),
            majin_status.load
        );
        println!(
            "Mac:    {} │ Load: {}%",
            format_status(mac_status.online),
            mac_status.load
        );

        println!("{}", "═".repeat(50).bright_cyan());

        // Active workflows
        let workflows = get_active_workflows().await?;
        println!("Active Workflows: {}", workflows.len());
        println!("Queued Tasks: 0");
        println!("Failed (24h): 0");

        println!("{}", "═".repeat(50).bright_cyan());

        if !watch {
            break;
        }

        sleep(Duration::from_secs(5)).await;
    }

    Ok(())
}

fn format_status(online: bool) -> String {
    if online {
        "🟢 Online".green().to_string()
    } else {
        "🔴 Offline".red().to_string()
    }
}
```

---

## 🎨 UI/UX Considerations for Pixel

### 1. **Touch Target Size**
- Minimum button size: 48x48 dp
- Spacing between elements: 8dp minimum
- Large tap areas for frequent actions

### 2. **Typography**
- Heading: 24sp, Bold
- Body: 16sp, Regular
- Monospace (for logs): 14sp

### 3. **Color Scheme**
```css
/* Miyabi Color Palette - Pixel Optimized */
--primary: #FF6B9D;      /* Pink/Sakura */
--secondary: #4ECDC4;    /* Teal */
--success: #45B7D1;      /* Blue */
--warning: #FFA07A;      /* Light Salmon */
--error: #FF6B6B;        /* Red */
--background: #1A1A2E;   /* Dark Navy */
--surface: #16213E;      /* Navy */
--text-primary: #EAEAEA; /* Light Gray */
--text-secondary: #9C9C9C; /* Gray */
```

### 4. **Accessibility**
- High contrast mode support
- Large text mode compatibility
- Screen reader friendly labels
- Haptic feedback for critical actions

---

## 📱 Termux-Specific Optimizations

### 1. **Battery Optimization**

```bash
# Create wake lock for important tasks
termux-wake-lock

# Release when idle
termux-wake-unlock

# Battery-aware scheduling
if [ $(termux-battery-status | jq .percentage) -lt 20 ]; then
  echo "⚠️ Low battery - deferring non-critical tasks"
  miyabi pause
fi
```

### 2. **Network Management**

```bash
# Check network type
NETWORK=$(termux-wifi-connectioninfo | jq -r .ssid)

# Optimize based on connection
if [ "$NETWORK" = "home_wifi" ]; then
  # Full speed on home network
  miyabi config set bandwidth unlimited
else
  # Conserve mobile data
  miyabi config set bandwidth limited
fi
```

### 3. **Storage Management**

```bash
# Auto-cleanup old logs
miyabi cleanup --older-than 7d

# Archive completed workflow logs
miyabi archive --to ~/storage/downloads/miyabi-logs/
```

---

## 🔊 VOICEVOX Integration for Pixel

### Voice Notification System

**Use Cases**:
1. Workflow completion notifications
2. Error alerts
3. Status updates
4. Emergency announcements

**Implementation**:

```bash
# Generate voice notification
echo "ワークフロー1030が正常に完了しました" | \
  miyabi voice generate --speaker 1 --output /tmp/notification.wav

# Play through Pixel speaker
termux-media-player play /tmp/notification.wav

# Background notification service
miyabi voice daemon start
```

**Voice Notification Preferences**:
```yaml
# ~/.config/miyabi/voice-notifications.yaml
enabled: true
speaker_id: 1  # VOICEVOX speaker
volume: 0.7
events:
  workflow_started: false     # Too frequent
  workflow_completed: true
  workflow_failed: true
  coordinator_offline: true
  emergency: true
```

---

## 📊 Analytics for Mobile View

### Daily Summary Report (Lark Card)

**Sent every morning at 9:00 JST**:

```
┌────────────────────────────────────┐
│  🌸 Miyabi Daily Report            │
│  2025-11-17                        │
├────────────────────────────────────┤
│  ✅ Workflows Completed:    12     │
│  ⚠️  Workflows Failed:      1      │
│  🔄 Currently Running:      2      │
│                                    │
│  Top Coordinators:                 │
│  1. MUGEN   (8 tasks, 66%)        │
│  2. MAJIN   (4 tasks, 33%)        │
│  3. Mac     (1 task,  8%)         │
│                                    │
│  💰 Today's Cost:      $5.60      │
│  📊 Avg Duration:      1m 45s     │
│                                    │
│  [📈 View Details] [⚙️ Settings]  │
└────────────────────────────────────┘
```

---

## 🚀 Quick Start for Pixel Users

### Setup Checklist

```
☐ 1. Install Termux on Pixel
☐ 2. Install required packages:
      pkg install git gh jq curl
☐ 3. Clone miyabi repository:
      git clone https://github.com/customer-cloud/miyabi-private
☐ 4. Install miyabi CLI:
      cargo install --path crates/miyabi-cli
☐ 5. Configure Lark integration:
      miyabi config set lark-webhook $LARK_WEBHOOK_URL
☐ 6. Test notification:
      miyabi test-notification
☐ 7. Start monitoring daemon:
      miyabi daemon start
```

### Daily Usage Pattern

**Morning**:
```bash
# Check overnight activity
miyabi summary --since yesterday

# Plan today's tasks
miyabi plan create --from-issues
```

**Throughout Day**:
```bash
# Quick status check (via Termux widget)
miyabi status --compact

# Execute ad-hoc task
miyabi execute 1030 --coordinator auto
```

**Evening**:
```bash
# Review completed tasks
miyabi report --today

# Schedule tomorrow's workflows
miyabi schedule --file schedule.yaml
```

---

## 🎯 Success Metrics

### KPIs for Pixel Usability

1. **Response Time**: User action → Visual feedback < 500ms
2. **Notification Delivery**: 99.9% reliability
3. **Battery Impact**: < 5% drain per 8 hours of monitoring
4. **User Satisfaction**: NPS score > 70
5. **Task Success Rate**: > 95% of triggered workflows complete successfully

---

## 🔮 Future Enhancements

### Planned Features

1. **AR Visualization**: Use Pixel camera for AR overlay of coordinator status
2. **Voice Control**: "Hey Google, start Miyabi workflow 1030"
3. **Gesture Shortcuts**: Double-tap notification to view details
4. **Offline Mode**: Queue tasks when offline, execute when online
5. **Predictive Scheduling**: AI suggests optimal times to run tasks
6. **Social Features**: Share workflow templates with team

---

## 📚 Related Documentation

- [[PANTHEON_HIERARCHY]] - Understanding the 4-layer architecture
- [[OUR_LEADERSHIP_PRINCIPLES]] - Guiding principles for all agents
- [[GITHUB_ACTIONS_AUTONOMOUS_EXECUTION]] - Workflow automation details
- [[MIYABI_SOCIETY_FORMULA]] - Mathematical foundation

---

**Version**: 1.0.0
**Status**: Published
**Last Updated**: 2025-11-17
**Author**: Claude Code - Mac Orchestrator

🌸 **Miyabi Society - Mobile-First Autonomous Orchestration** 🌸

---

## 📚 Related Documents

- [[miyabi-definition]]
- [[agents]]
- [[MIYABI_LARK_INTEGRATION_GUIDE]]

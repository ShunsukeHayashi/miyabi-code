# Miyabi + GWR (@humanu/orchestra) 完全統合プラン

**Plan ID**: 701
**Created**: 2025-11-02
**Status**: Planning Phase
**Complexity**: ⭐⭐⭐⭐⭐ (Very High)
**Estimated Duration**: 2-3 weeks

---

## 📋 Executive Summary

**目的**: `@humanu/orchestra` (gwr) の Git Worktree + tmux管理機能をmiyabi-desktopに完全統合し、全ての実行パターンで一貫した開発体験を提供する。

### 統合の全体像

```
┌─────────────────────────────────────────────────────────────┐
│                    Miyabi Ecosystem                         │
│                                                             │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ CLI Mode   │  │ Desktop GUI  │  │ Agent Execution  │   │
│  │ miyabi tui │  │ (Tauri+React)│  │ (Worktree+tmux)  │   │
│  └─────┬──────┘  └──────┬───────┘  └────────┬─────────┘   │
│        │                │                    │             │
│        └────────────────┼────────────────────┘             │
│                         │                                  │
│                ┌────────▼─────────┐                        │
│                │  GWR Integration │                        │
│                │  - Worktree View │                        │
│                │  - tmux Sessions │                        │
│                │  - AI Naming     │                        │
│                │  - Git Status    │                        │
│                └──────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

1. **Worktree視覚化** - 全Worktreeをツリー表示
2. **tmuxセッション統合** - 各Worktreeに紐づくtmuxセッション
3. **AI-powered naming** - Anthropic APIで自動命名
4. **リアルタイムGit status** - 変更状況の即座な可視化
5. **インタラクティブ操作** - キーボード/マウス両対応

---

## 🎯 全5つの実行パターン対応

### Pattern 1: CLI TUI Mode

**コマンド**: `miyabi tui`

**実装方針**: gwrを直接ラップ

```bash
# crates/miyabi-cli/src/commands/tui.rs
pub struct TuiCommand {
    issue: Option<u32>,      // 特定Issueにフォーカス
    worktree: Option<String>, // 特定Worktreeにフォーカス
    debug: bool,
}

impl TuiCommand {
    pub async fn execute(&self) -> Result<()> {
        // gwr起動
        std::process::Command::new("gwr")
            .args(self.build_args())
            .status()?;
        Ok(())
    }
}
```

**ユーザー体験**:
```bash
$ miyabi tui

┌─ Miyabi Worktree Manager ────────────────────┐
│ main (76f14edc2)                              │
│ ├── 📁 .worktrees/                             │
│ │   ├── 🟢 issue-270 (memory-leak-fix)        │
│ │   │   └── tmux: issue-270-session (active) │
│ │   └── 🟢 issue-271 (k8s-support)            │
│ │       └── tmux: issue-271-session (active) │
│                                               │
│ [c] Create  [d] Delete  [r] Rename  [q] Quit │
└───────────────────────────────────────────────┘
```

---

### Pattern 2: Desktop GUI Mode

**実装**: miyabi-desktopのWorktreeManagerコンポーネント

**アーキテクチャ**:
```
┌──────────────────────────────────────────┐
│        React Frontend                    │
│  ┌────────────────────────────────────┐  │
│  │  WorktreeManagerPanel.tsx          │  │
│  │  - ツリービュー (react-arborist)  │  │
│  │  - tmuxセッション一覧             │  │
│  │  - Git statusバッジ               │  │
│  │  - AI naming UI                   │  │
│  └────────────────────────────────────┘  │
│               │ Tauri IPC                 │
└───────────────┼───────────────────────────┘
                │
┌───────────────▼───────────────────────────┐
│        Rust Backend (Tauri)               │
│  ┌────────────────────────────────────┐   │
│  │  worktree.rs (New)                 │   │
│  │  - WorktreeManager                 │   │
│  │  - list_worktrees()                │   │
│  │  - create_worktree()               │   │
│  │  - delete_worktree()               │   │
│  └────────────────────────────────────┘   │
│  ┌────────────────────────────────────┐   │
│  │  tmux.rs (Enhanced)                │   │
│  │  - link worktree ↔ tmux session   │   │
│  │  - AI naming integration           │   │
│  └────────────────────────────────────┘   │
└───────────────────────────────────────────┘
```

**新規コンポーネント**:

1. **WorktreeManagerPanel.tsx**
   ```tsx
   interface Worktree {
     path: string;
     branch: string;
     commit: string;
     issue_number?: number;
     tmux_session?: TmuxSession;
     git_status: GitStatus;
   }

   export function WorktreeManagerPanel() {
     const [worktrees, setWorktrees] = useState<Worktree[]>([]);
     const [selectedWorktree, setSelectedWorktree] = useState<Worktree | null>(null);

     // ツリービュー実装
     // tmuxセッション制御
     // AI naming UI
   }
   ```

2. **WorktreeTreeView.tsx** (react-arborist使用)
   ```tsx
   import { Tree } from 'react-arborist';

   export function WorktreeTreeView({ worktrees }: Props) {
     return (
       <Tree
         data={transformToTreeData(worktrees)}
         renderNode={WorktreeNode}
         onSelect={handleSelect}
         onActivate={handleActivate}
       />
     );
   }
   ```

3. **WorktreeDetailPanel.tsx**
   ```tsx
   export function WorktreeDetailPanel({ worktree }: Props) {
     return (
       <div>
         {/* Git status */}
         <GitStatusBadges status={worktree.git_status} />

         {/* tmux session controls */}
         <TmuxSessionControls session={worktree.tmux_session} />

         {/* AI naming */}
         <AINamingInput worktree={worktree} />
       </div>
     );
   }
   ```

**ユーザー体験**:
```
┌─────────────────────────────────────────────────────────────┐
│  Worktree Manager                                    [⚙️ ❌] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Worktrees ──────────┐  ┌─ Details ─────────────────┐  │
│  │ 📁 main               │  │ Worktree: issue-270       │  │
│  │ └── .worktrees/       │  │ Branch: worktree/issue-270│  │
│  │     ├── 🟢 issue-270  │  │ Issue: #270 Fix memory leak│ │
│  │     │   └── tmux ✅   │  │                           │  │
│  │     └── 🟢 issue-271  │  │ Git Status:               │  │
│  │         └── tmux ✅   │  │   🌿 worktree/issue-270   │  │
│  │                       │  │   📝 Modified: 3          │  │
│  │ [+] Create Worktree   │  │   ✓ Staged: 1             │  │
│  │                       │  │                           │  │
│  └───────────────────────┘  │ tmux Session:             │  │
│                             │   Session: issue-270      │  │
│                             │   Status: Running         │  │
│                             │   [Attach] [Stop]         │  │
│                             │                           │  │
│                             │ AI Naming:                │  │
│                             │   [✨ Generate Name]      │  │
│                             └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

### Pattern 3: Agent Execution Mode (Worktree + tmux)

**実装**: Agent実行時に自動Worktree + tmuxセッション作成

**フロー**:
```
1. CoordinatorAgent: Issue #270を受信
2. WorktreeManager: .worktrees/issue-270 作成
3. TmuxManager: tmuxセッション "issue-270" 作成
4. CodeGenAgent: Worktree内で実行
5. WorktreeManager: GUIでリアルタイム監視
6. Cleanup: マージ → Worktree削除 → tmuxセッション終了
```

**実装**:
```rust
// crates/miyabi-worktree/src/lib.rs

pub struct WorktreeManager {
    repo_path: PathBuf,
    tmux_manager: TmuxManager,
}

impl WorktreeManager {
    pub async fn create_worktree_with_tmux(
        &self,
        issue_number: u32,
        agent_type: &str,
    ) -> Result<WorktreeSession> {
        // 1. Worktree作成
        let branch_name = format!("worktree/issue-{}", issue_number);
        let worktree_path = self.repo_path.join(format!(".worktrees/issue-{}", issue_number));

        Command::new("git")
            .args(["worktree", "add", worktree_path.to_str().unwrap(), "-b", &branch_name])
            .output()
            .await?;

        // 2. tmuxセッション作成
        let session_name = format!("issue-{}", issue_number);
        let command = format!("cd {} && bash", worktree_path.display());

        self.tmux_manager.create_session(&session_name, &command).await?;

        // 3. AI naming（オプション）
        let ai_name = self.generate_ai_name(issue_number).await?;
        self.tmux_manager.rename_session(&session_name, &ai_name).await?;

        // 4. WorktreeSession返却
        Ok(WorktreeSession {
            worktree_path,
            branch_name,
            session_name: ai_name,
            issue_number,
            agent_type: agent_type.to_string(),
        })
    }

    async fn generate_ai_name(&self, issue_number: u32) -> Result<String> {
        // Anthropic APIでIssueタイトルから命名
        let issue = self.github_client.get_issue(issue_number).await?;
        let prompt = format!(
            "Generate a concise worktree name (kebab-case, max 30 chars) for:\n{}",
            issue.title
        );

        let response = self.anthropic_client.complete(&prompt).await?;
        Ok(response.trim().to_string())
    }
}
```

**ユーザー体験**:
```bash
$ miyabi agent run coordinator --issue 270

[CoordinatorAgent] Starting execution for Issue #270
[WorktreeManager] Creating worktree: .worktrees/issue-270
[TmuxManager] Creating tmux session: issue-270
[AI Naming] Generating name... ✨
[TmuxManager] Renamed session: issue-270 → memory-leak-logger-fix
[CodeGenAgent] Executing in .worktrees/issue-270
[WorktreeManager] GUI updated - Live monitoring available
```

Desktop GUIでリアルタイム監視:
```
🟢 memory-leak-logger-fix
  └── tmux: memory-leak-logger-fix (active)
      📊 CPU: 45% | Memory: 1.2GB
      📝 Modified: 3 | Staged: 1
      ⏱️ Running: 5m 32s
```

---

### Pattern 4: Parallel Execution Mode

**コマンド**: `miyabi parallel --issues 270,271,272 --concurrency 3`

**実装**: 複数Worktree + tmuxセッションを並列管理

**フロー**:
```
CoordinatorAgent
  │
  ├─ Worktree #1: issue-270 + tmux:memory-leak-fix
  ├─ Worktree #2: issue-271 + tmux:k8s-support
  └─ Worktree #3: issue-272 + tmux:refactor-agent
  │
  └─ Desktop GUI: 3つのWorktreeを同時監視
```

**実装**:
```rust
pub async fn execute_parallel(
    &self,
    issues: Vec<u32>,
    concurrency: usize,
) -> Result<Vec<WorktreeSession>> {
    let semaphore = Arc::new(Semaphore::new(concurrency));

    let tasks: Vec<_> = issues
        .into_iter()
        .map(|issue_num| {
            let sem = semaphore.clone();
            let manager = self.clone();

            tokio::spawn(async move {
                let _permit = sem.acquire().await?;
                manager.create_worktree_with_tmux(issue_num, "CodeGenAgent").await
            })
        })
        .collect();

    let sessions = futures::future::try_join_all(tasks).await?;

    Ok(sessions)
}
```

**Desktop GUI表示**:
```
┌─ Parallel Execution (3/3 active) ────────────────┐
│                                                  │
│  🟢 memory-leak-logger-fix    ⏱️ 5m 32s          │
│     📝 Modified: 3 | ✓ Staged: 1                 │
│     🔧 CodeGenAgent executing...                 │
│                                                  │
│  🟢 k8s-support-implementation ⏱️ 3m 12s         │
│     📝 Modified: 7 | ✓ Staged: 3                 │
│     🔧 CodeGenAgent executing...                 │
│                                                  │
│  🟢 refactor-agent-structure   ⏱️ 8m 45s         │
│     📝 Modified: 12 | ✓ Staged: 5                │
│     🔧 ReviewAgent executing...                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### Pattern 5: Infinity Mode

**コマンド**: `miyabi infinity`

**実装**: 全Issueを自動処理、Worktree + tmuxを動的に管理

**フロー**:
```
InfinityAgent (Supervisor)
  │
  ├─ GitHub Issues取得 (全未処理Issue)
  ├─ Worktree作成 (concurrencyに基づく)
  ├─ tmuxセッション作成 (各Worktreeに紐付け)
  ├─ Agent実行 (自動割り当て)
  ├─ Desktop GUI: 全Worktreeをリアルタイム監視
  └─ 完了後: Cleanup & 次のIssue
```

**実装**:
```rust
pub async fn infinity_mode(&self, config: InfinityConfig) -> Result<()> {
    loop {
        // 1. 未処理Issue取得
        let pending_issues = self.github_client
            .list_issues(IssueState::Open, vec![])
            .await?;

        if pending_issues.is_empty() {
            println!("✅ All issues completed!");
            break;
        }

        // 2. 並列実行
        let batch = pending_issues
            .into_iter()
            .take(config.concurrency)
            .collect::<Vec<_>>();

        let sessions = self.execute_parallel(batch, config.concurrency).await?;

        // 3. Desktop GUIで監視
        self.emit_gui_update(sessions.clone()).await?;

        // 4. 完了待ち
        self.wait_for_completion(sessions).await?;

        // 5. Cleanup
        self.cleanup_completed_worktrees().await?;
    }

    Ok(())
}
```

**Desktop GUI表示**:
```
┌─ Infinity Mode (∞) ──────────────────────────────┐
│  Total Issues: 47 | Completed: 23 | Remaining: 24 │
│                                                   │
│  Active Worktrees (3):                            │
│  🟢 memory-leak-logger-fix    ⏱️ 5m 32s           │
│  🟢 k8s-support-implementation ⏱️ 3m 12s          │
│  🟢 refactor-agent-structure   ⏱️ 8m 45s          │
│                                                   │
│  Queued Issues (21):                              │
│  ⏳ #273 Add Docker support                       │
│  ⏳ #274 Update dependencies                      │
│  ⏳ #275 Improve error handling                   │
│  ... (18 more)                                    │
│                                                   │
│  [⏸️ Pause] [⏹️ Stop] [⚙️ Settings]                 │
└───────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture Design

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Interface Layer                        │
│                                                                 │
│  ┌──────────────┐              ┌─────────────────────────────┐ │
│  │  CLI (TUI)   │              │  Desktop GUI (Tauri+React)  │ │
│  │  miyabi tui  │              │  WorktreeManagerPanel.tsx   │ │
│  │  (gwr wrap)  │              │  WorktreeTreeView.tsx       │ │
│  └──────┬───────┘              └──────────┬──────────────────┘ │
│         │                                 │ Tauri IPC          │
└─────────┼─────────────────────────────────┼─────────────────────┘
          │                                 │
┌─────────┼─────────────────────────────────▼─────────────────────┐
│         │              Business Logic Layer                     │
│         │                                                       │
│  ┌──────▼────────────────────────────────────────────────┐     │
│  │           WorktreeManager (Rust)                      │     │
│  │  - create_worktree_with_tmux()                        │     │
│  │  - list_worktrees()                                   │     │
│  │  - delete_worktree()                                  │     │
│  │  - execute_parallel()                                 │     │
│  │  - infinity_mode()                                    │     │
│  └───────────────────┬───────────────────────────────────┘     │
│                      │                                         │
│  ┌───────────────────▼─────────┐  ┌───────────────────────┐   │
│  │   TmuxManager (Enhanced)    │  │  GitStatusProvider    │   │
│  │  - create_session()         │  │  - get_status()       │   │
│  │  - AI naming integration    │  │  - watch_changes()    │   │
│  │  - link to worktree         │  │                       │   │
│  └─────────────────────────────┘  └───────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │                                 │
┌─────────▼─────────────────────────────────▼─────────────────────┐
│                    System Layer                                 │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Git Worktree │  │ tmux sessions│  │ Anthropic API        │ │
│  │ .worktrees/  │  │ (sessions)   │  │ (AI naming)          │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

#### Frontend (React + TypeScript)

```
src/
├── components/
│   ├── WorktreeManager/
│   │   ├── WorktreeManagerPanel.tsx       # メインパネル
│   │   ├── WorktreeTreeView.tsx           # ツリービュー (react-arborist)
│   │   ├── WorktreeDetailPanel.tsx        # 詳細パネル
│   │   ├── WorktreeCreateDialog.tsx       # 作成ダイアログ
│   │   ├── AINamingInput.tsx              # AI命名UI
│   │   └── GitStatusBadges.tsx            # Git statusバッジ
│   └── TmuxManager/
│       ├── TmuxManager.tsx (既存)         # tmux管理パネル
│       └── TmuxSessionCard.tsx            # セッションカード
├── stores/
│   ├── worktreeStore.ts                   # Worktree状態管理 (Zustand)
│   └── tmuxStore.ts (既存)                # tmux状態管理
├── lib/
│   ├── worktree-api.ts                    # Worktree API calls
│   └── tauri-utils.ts (既存)              # Tauri utilities
└── types/
    └── worktree.ts                        # Worktree型定義
```

#### Backend (Rust + Tauri)

```
src-tauri/src/
├── worktree.rs (新規)                     # Worktree管理
│   ├── WorktreeManager struct
│   ├── create_worktree_with_tmux()
│   ├── list_worktrees()
│   ├── delete_worktree()
│   └── get_git_status()
├── tmux.rs (拡張)                          # tmux管理
│   ├── AI naming integration
│   ├── Worktree連携機能
│   └── rename_session()
├── ai_naming.rs (新規)                    # AI命名
│   ├── AnthropicClient
│   └── generate_worktree_name()
└── lib.rs
    ├── worktree_create_with_tmux
    ├── worktree_list
    ├── worktree_delete
    ├── worktree_get_git_status
    ├── ai_generate_name
    └── (既存tmuxコマンド)
```

---

## 📊 Data Flow

### Worktree作成フロー

```
User Action (Desktop GUI)
  │
  ├─ 1. "Create Worktree" button click
  │
  ├─ 2. WorktreeCreateDialog opens
  │      - Issue number input
  │      - Agent type selection
  │      - AI naming toggle
  │
  ├─ 3. invoke('worktree_create_with_tmux', { issueNumber, agentType, aiNaming })
  │
  ├─ 4. Rust Backend
  │      ├─ WorktreeManager::create_worktree_with_tmux()
  │      │   ├─ git worktree add .worktrees/issue-270 -b worktree/issue-270
  │      │   ├─ TmuxManager::create_session("issue-270", "cd .worktrees/issue-270 && bash")
  │      │   └─ AI naming (if enabled)
  │      │       └─ AnthropicClient::generate_name(issue_title)
  │      │           └─ TmuxManager::rename_session("issue-270", "memory-leak-fix")
  │      └─ Return WorktreeSession
  │
  ├─ 5. Frontend receives WorktreeSession
  │      └─ worktreeStore.addWorktree(session)
  │
  └─ 6. UI update
         └─ WorktreeTreeView re-renders with new worktree
```

### リアルタイムGit Status更新

```
Desktop GUI Background Process
  │
  ├─ setInterval(async () => {
  │    const worktrees = await invoke('worktree_list');
  │
  │    for (const wt of worktrees) {
  │      const status = await invoke('worktree_get_git_status', { path: wt.path });
  │      worktreeStore.updateGitStatus(wt.path, status);
  │    }
  │  }, 2000); // 2秒ごとに更新
  │
  └─ UI自動更新 (Zustand reactive)
```

---

## 🗺️ Implementation Roadmap

### Phase 1: Foundation (Week 1, Days 1-3)

**目標**: Rust backend基盤構築

#### Tasks:

1. **Cargo依存関係追加**
   ```toml
   # miyabi-desktop/src-tauri/Cargo.toml
   [dependencies]
   tokio = { version = "1", features = ["full"] }
   serde = { version = "1.0", features = ["derive"] }
   serde_json = "1.0"
   anyhow = "1.0"
   reqwest = { version = "0.11", features = ["json"] }  # Anthropic API
   ```

2. **worktree.rs実装**
   - `WorktreeManager` struct
   - `list_worktrees()` - 既存Worktree一覧取得
   - `create_worktree()` - Worktree作成
   - `delete_worktree()` - Worktree削除
   - `get_git_status()` - Git status取得

3. **ai_naming.rs実装**
   - `AnthropicClient` struct
   - `generate_name()` - Anthropic APIでIssueタイトル→Worktree名

4. **Tauri commands登録**
   - `worktree_list`
   - `worktree_create_with_tmux`
   - `worktree_delete`
   - `worktree_get_git_status`
   - `ai_generate_name`

**Deliverables**:
- ✅ `src-tauri/src/worktree.rs`
- ✅ `src-tauri/src/ai_naming.rs`
- ✅ Tauri commands in `lib.rs`
- ✅ Unit tests for `worktree.rs`

---

### Phase 2: Frontend Foundation (Week 1, Days 4-7)

**目標**: React components基盤構築

#### Tasks:

1. **依存関係追加**
   ```json
   // miyabi-desktop/package.json
   {
     "dependencies": {
       "react-arborist": "^3.4.0",  // ツリービュー
       "zustand": "^4.5.0",         // 状態管理 (既存)
       "lucide-react": "^0.263.0"   // アイコン (既存)
     }
   }
   ```

2. **Worktree型定義**
   ```typescript
   // src/types/worktree.ts
   export interface Worktree {
     path: string;
     branch: string;
     commit: string;
     issue_number?: number;
     tmux_session?: TmuxSession;
     git_status: GitStatus;
     created_at: string;
   }

   export interface GitStatus {
     branch: string;
     ahead: number;
     behind: number;
     modified: number;
     untracked: number;
     staged: number;
   }
   ```

3. **Zustand store作成**
   ```typescript
   // src/stores/worktreeStore.ts
   import { create } from 'zustand';

   interface WorktreeStore {
     worktrees: Worktree[];
     selectedWorktree: Worktree | null;
     loading: boolean;
     error: string | null;

     fetchWorktrees: () => Promise<void>;
     createWorktree: (issueNumber: number, agentType: string) => Promise<void>;
     deleteWorktree: (path: string) => Promise<void>;
     selectWorktree: (path: string) => void;
     updateGitStatus: (path: string, status: GitStatus) => void;
   }

   export const useWorktreeStore = create<WorktreeStore>((set, get) => ({
     // ... implementation
   }));
   ```

4. **WorktreeManagerPanel.tsx作成**
   - レイアウト: 左側ツリービュー、右側詳細パネル
   - ツールバー: Create, Refresh, Settings

**Deliverables**:
- ✅ `src/types/worktree.ts`
- ✅ `src/stores/worktreeStore.ts`
- ✅ `src/components/WorktreeManager/WorktreeManagerPanel.tsx`
- ✅ `src/lib/worktree-api.ts`

---

### Phase 3: Tree View Implementation (Week 2, Days 1-3)

**目標**: インタラクティブなツリービュー実装

#### Tasks:

1. **WorktreeTreeView.tsx実装**
   ```tsx
   import { Tree, NodeRendererProps } from 'react-arborist';

   export function WorktreeTreeView({ worktrees }: Props) {
     const treeData = useMemo(() => {
       return {
         id: 'root',
         name: 'main',
         children: worktrees.map(wt => ({
           id: wt.path,
           name: extractWorktreeName(wt.path),
           worktree: wt,
           children: wt.tmux_session ? [
             {
               id: `${wt.path}-tmux`,
               name: `tmux: ${wt.tmux_session.session_name}`,
               type: 'tmux',
             }
           ] : [],
         })),
       };
     }, [worktrees]);

     return (
       <Tree
         data={treeData}
         openByDefault={false}
         width="100%"
         height={600}
         indent={24}
         rowHeight={36}
         overscanCount={1}
       >
         {WorktreeNode}
       </Tree>
     );
   }
   ```

2. **WorktreeNode.tsx実装**
   ```tsx
   function WorktreeNode({ node, style, dragHandle }: NodeRendererProps<TreeNode>) {
     const worktree = node.data.worktree;

     return (
       <div style={style} className="flex items-center gap-2 px-2 hover:bg-gray-100">
         {node.data.type === 'worktree' && (
           <>
             <FolderIcon className="w-4 h-4" />
             <span className="font-medium">{node.data.name}</span>
             {worktree.git_status && (
               <GitStatusBadges status={worktree.git_status} />
             )}
           </>
         )}
         {node.data.type === 'tmux' && (
           <>
             <TerminalIcon className="w-4 h-4 text-green-500" />
             <span className="text-sm text-gray-600">{node.data.name}</span>
           </>
         )}
       </div>
     );
   }
   ```

3. **GitStatusBadges.tsx実装**
   - Modified filesバッジ
   - Untracked filesバッジ
   - Staged filesバッジ
   - Ahead/Behindバッジ

**Deliverables**:
- ✅ `src/components/WorktreeManager/WorktreeTreeView.tsx`
- ✅ `src/components/WorktreeManager/WorktreeNode.tsx`
- ✅ `src/components/WorktreeManager/GitStatusBadges.tsx`

---

### Phase 4: Detail Panel & Actions (Week 2, Days 4-5)

**目標**: 詳細パネルとアクション実装

#### Tasks:

1. **WorktreeDetailPanel.tsx実装**
   - Worktree情報表示（パス、ブランチ、コミット）
   - Git status詳細表示
   - tmuxセッション制御
   - Delete Worktreeボタン

2. **WorktreeCreateDialog.tsx実装**
   ```tsx
   export function WorktreeCreateDialog({ open, onClose }: Props) {
     const [issueNumber, setIssueNumber] = useState('');
     const [agentType, setAgentType] = useState('CodeGenAgent');
     const [enableAiNaming, setEnableAiNaming] = useState(true);

     const handleCreate = async () => {
       await worktreeStore.createWorktree(
         parseInt(issueNumber),
         agentType,
         enableAiNaming
       );
       onClose();
     };

     return (
       <Dialog open={open} onOpenChange={onClose}>
         {/* Form fields */}
       </Dialog>
     );
   }
   ```

3. **tmux統合**
   - Attach to tmux sessionボタン
   - Stop tmux sessionボタン
   - tmux output表示（既存TmuxManagerコンポーネント再利用）

**Deliverables**:
- ✅ `src/components/WorktreeManager/WorktreeDetailPanel.tsx`
- ✅ `src/components/WorktreeManager/WorktreeCreateDialog.tsx`

---

### Phase 5: AI Naming Integration (Week 2, Days 6-7)

**目標**: AI powered naming実装

#### Tasks:

1. **AINamingInput.tsx実装**
   ```tsx
   export function AINamingInput({ worktree }: Props) {
     const [generating, setGenerating] = useState(false);
     const [suggestedName, setSuggestedName] = useState('');

     const handleGenerate = async () => {
       setGenerating(true);
       try {
         const name = await invoke<string>('ai_generate_name', {
           issueNumber: worktree.issue_number,
         });
         setSuggestedName(name);
       } finally {
         setGenerating(false);
       }
     };

     const handleApply = async () => {
       await invoke('tmux_rename_session', {
         oldName: worktree.tmux_session.session_name,
         newName: suggestedName,
       });
       // Refresh worktrees
     };

     return (
       <div className="space-y-2">
         <Button onClick={handleGenerate} disabled={generating}>
           {generating ? <Loader2 className="animate-spin" /> : <Sparkles />}
           Generate Name
         </Button>
         {suggestedName && (
           <div className="flex gap-2">
             <Input value={suggestedName} readOnly />
             <Button onClick={handleApply}>Apply</Button>
           </div>
         )}
       </div>
     );
   }
   ```

2. **Anthropic API統合（Backend）**
   ```rust
   // src-tauri/src/ai_naming.rs
   use reqwest::Client;
   use serde::{Deserialize, Serialize};

   pub struct AnthropicClient {
       api_key: String,
       client: Client,
   }

   impl AnthropicClient {
       pub async fn generate_worktree_name(&self, issue_title: &str) -> Result<String> {
           let prompt = format!(
               "Generate a concise Git worktree name (kebab-case, max 30 chars) for this issue:\n{}",
               issue_title
           );

           let response = self.client
               .post("https://api.anthropic.com/v1/messages")
               .header("x-api-key", &self.api_key)
               .header("anthropic-version", "2023-06-01")
               .json(&json!({
                   "model": "claude-3-5-sonnet-20241022",
                   "max_tokens": 100,
                   "messages": [{
                       "role": "user",
                       "content": prompt,
                   }],
               }))
               .send()
               .await?;

           let result: AnthropicResponse = response.json().await?;
           Ok(result.content[0].text.trim().to_string())
       }
   }
   ```

**Deliverables**:
- ✅ `src/components/WorktreeManager/AINamingInput.tsx`
- ✅ `src-tauri/src/ai_naming.rs` (enhanced)
- ✅ Environment variable `ANTHROPIC_API_KEY` support

---

### Phase 6: CLI Integration (Week 3, Days 1-2)

**目標**: `miyabi tui` コマンド実装

#### Tasks:

1. **crates/miyabi-cli/src/commands/tui.rs作成**
   ```rust
   use clap::Parser;
   use anyhow::Result;

   #[derive(Parser, Debug)]
   #[command(about = "Launch Miyabi Worktree TUI (powered by gwr)")]
   pub struct TuiCommand {
       /// Focus on specific issue number
       #[arg(short, long)]
       issue: Option<u32>,

       /// Focus on specific worktree
       #[arg(short, long)]
       worktree: Option<String>,

       /// Enable debug mode
       #[arg(short, long)]
       debug: bool,
   }

   impl TuiCommand {
       pub async fn execute(&self) -> Result<()> {
           let mut cmd = std::process::Command::new("gwr");

           if self.debug {
               cmd.arg("--debug");
           }

           // TODO: Issue/worktreeフォーカス機能を実装
           // gwrがこの機能をサポートしていれば追加

           cmd.status()?;
           Ok(())
       }
   }
   ```

2. **miyabi CLIにコマンド登録**
   ```rust
   // crates/miyabi-cli/src/commands/mod.rs
   pub mod tui;
   pub use tui::TuiCommand;

   // crates/miyabi-cli/src/main.rs
   #[derive(Parser)]
   enum Commands {
       // ... existing commands
       Tui(TuiCommand),
   }
   ```

**Deliverables**:
- ✅ `crates/miyabi-cli/src/commands/tui.rs`
- ✅ `miyabi tui` command working

---

### Phase 7: Parallel & Infinity Mode Integration (Week 3, Days 3-5)

**目標**: 並列実行とInfinity modeでのWorktree管理

#### Tasks:

1. **WorktreeManager拡張（並列実行対応）**
   ```rust
   impl WorktreeManager {
       pub async fn execute_parallel(
           &self,
           issues: Vec<u32>,
           concurrency: usize,
       ) -> Result<Vec<WorktreeSession>> {
           let semaphore = Arc::new(Semaphore::new(concurrency));

           let tasks = issues
               .into_iter()
               .map(|issue_num| {
                   let sem = semaphore.clone();
                   let manager = self.clone();

                   tokio::spawn(async move {
                       let _permit = sem.acquire().await?;
                       manager.create_worktree_with_tmux(issue_num, "CodeGenAgent").await
                   })
               })
               .collect::<Vec<_>>();

           futures::future::try_join_all(tasks).await
       }

       pub async fn infinity_mode(&self, config: InfinityConfig) -> Result<()> {
           loop {
               let pending_issues = self.fetch_pending_issues().await?;

               if pending_issues.is_empty() {
                   break;
               }

               let batch = pending_issues.into_iter().take(config.concurrency).collect();
               let sessions = self.execute_parallel(batch, config.concurrency).await?;

               // Desktop GUIで監視
               self.emit_gui_update(sessions.clone()).await?;

               self.wait_for_completion(sessions).await?;
               self.cleanup_completed_worktrees().await?;
           }

           Ok(())
       }
   }
   ```

2. **Desktop GUI拡張（並列表示）**
   - ParallelExecutionPanel.tsx作成
   - 複数Worktreeの同時監視UI
   - Progress bar追加

3. **Infinity Mode UI**
   - InfinityModePanel.tsx作成
   - Queuedissues表示
   - Pause/Stop/Settings controls

**Deliverables**:
- ✅ Parallel execution support in WorktreeManager
- ✅ `src/components/ParallelExecutionPanel.tsx`
- ✅ `src/components/InfinityModePanel.tsx`

---

### Phase 8: Testing & Documentation (Week 3, Days 6-7)

**目標**: テスト追加とドキュメント整備

#### Tasks:

1. **Unit Tests**
   ```rust
   // src-tauri/src/worktree.rs
   #[cfg(test)]
   mod tests {
       use super::*;

       #[tokio::test]
       async fn test_create_worktree() {
           // ...
       }

       #[tokio::test]
       async fn test_list_worktrees() {
           // ...
       }

       #[tokio::test]
       async fn test_ai_naming() {
           // ...
       }
   }
   ```

2. **Integration Tests**
   ```typescript
   // miyabi-desktop/src/components/WorktreeManager/__tests__/WorktreeManagerPanel.test.tsx
   describe('WorktreeManagerPanel', () => {
     it('should render worktree tree', () => {
       // ...
     });

     it('should create new worktree', async () => {
       // ...
     });

     it('should delete worktree', async () => {
       // ...
     });
   });
   ```

3. **Documentation**
   - `docs/GWR_INTEGRATION.md` - 統合ガイド
   - `docs/WORKTREE_UI_GUIDE.md` - UI使用ガイド
   - `CHANGELOG.md` 更新

**Deliverables**:
- ✅ Unit tests (80%+ coverage)
- ✅ Integration tests
- ✅ Documentation完成

---

## 📁 File Structure

### 新規作成ファイル

```
miyabi-desktop/
├── src/
│   ├── components/
│   │   └── WorktreeManager/
│   │       ├── WorktreeManagerPanel.tsx        # ✨ New
│   │       ├── WorktreeTreeView.tsx            # ✨ New
│   │       ├── WorktreeNode.tsx                # ✨ New
│   │       ├── WorktreeDetailPanel.tsx         # ✨ New
│   │       ├── WorktreeCreateDialog.tsx        # ✨ New
│   │       ├── AINamingInput.tsx               # ✨ New
│   │       ├── GitStatusBadges.tsx             # ✨ New
│   │       ├── ParallelExecutionPanel.tsx      # ✨ New
│   │       └── InfinityModePanel.tsx           # ✨ New
│   ├── stores/
│   │   └── worktreeStore.ts                    # ✨ New
│   ├── lib/
│   │   └── worktree-api.ts                     # ✨ New
│   └── types/
│       └── worktree.ts                         # ✨ New
│
├── src-tauri/src/
│   ├── worktree.rs                             # ✨ New
│   ├── ai_naming.rs                            # ✨ New
│   ├── tmux.rs                                 # 🔧 Enhanced
│   └── lib.rs                                  # 🔧 Enhanced
│
└── docs/
    ├── GWR_INTEGRATION.md                      # ✨ New
    └── WORKTREE_UI_GUIDE.md                    # ✨ New

crates/miyabi-cli/src/commands/
└── tui.rs                                      # ✨ New
```

### 変更ファイル

```
miyabi-desktop/
├── src/App.tsx                                 # 🔧 Modified (add Worktree panel)
├── package.json                                # 🔧 Modified (add react-arborist)
└── src-tauri/Cargo.toml                        # 🔧 Modified (add reqwest)

crates/miyabi-cli/src/
├── commands/mod.rs                             # 🔧 Modified (add tui module)
└── main.rs                                     # 🔧 Modified (add TuiCommand)

CLAUDE.md                                       # 🔧 Modified (update docs)
```

---

## 📦 Dependencies

### Frontend Dependencies

```json
{
  "dependencies": {
    "react-arborist": "^3.4.0",     // ツリービュー
    "zustand": "^4.5.0",            // 状態管理 (既存)
    "lucide-react": "^0.263.0",     // アイコン (既存)
    "@tauri-apps/api": "^2.0.0"     // Tauri API (既存)
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "vitest": "^1.0.0"
  }
}
```

### Backend Dependencies

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
thiserror = "1.0"
reqwest = { version = "0.11", features = ["json"] }  # Anthropic API
```

---

## 🧪 Testing Strategy

### Unit Tests (Rust)

```rust
// src-tauri/src/worktree.rs

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_create_worktree() {
        let temp_dir = TempDir::new().unwrap();
        let manager = WorktreeManager::new(temp_dir.path().to_path_buf());

        let session = manager.create_worktree_with_tmux(270, "CodeGenAgent").await.unwrap();

        assert_eq!(session.issue_number, 270);
        assert!(session.worktree_path.exists());
    }

    #[tokio::test]
    async fn test_list_worktrees() {
        let manager = WorktreeManager::new(PathBuf::from("."));
        let worktrees = manager.list_worktrees().await.unwrap();

        assert!(worktrees.len() >= 0);
    }

    #[tokio::test]
    async fn test_ai_naming() {
        let client = AnthropicClient::new("test-key");
        let name = client.generate_worktree_name("Fix memory leak in logger.rs").await.unwrap();

        assert!(name.len() <= 30);
        assert!(name.contains("-"));
    }
}
```

### Integration Tests (TypeScript)

```typescript
// src/components/WorktreeManager/__tests__/WorktreeManagerPanel.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { WorktreeManagerPanel } from '../WorktreeManagerPanel';

describe('WorktreeManagerPanel', () => {
  it('should render worktree tree', () => {
    render(<WorktreeManagerPanel />);
    expect(screen.getByText('Worktree Manager')).toBeInTheDocument();
  });

  it('should create new worktree', async () => {
    render(<WorktreeManagerPanel />);

    const createButton = screen.getByText('Create Worktree');
    fireEvent.click(createButton);

    const issueInput = screen.getByLabelText('Issue Number');
    fireEvent.change(issueInput, { target: { value: '270' } });

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    // Assert worktree created
    await screen.findByText('issue-270');
  });

  it('should delete worktree', async () => {
    render(<WorktreeManagerPanel />);

    const worktreeNode = screen.getByText('issue-270');
    fireEvent.click(worktreeNode);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Assert worktree deleted
    expect(screen.queryByText('issue-270')).not.toBeInTheDocument();
  });
});
```

### E2E Tests

```bash
# Tauri E2E tests
cd miyabi-desktop
npm run test:e2e

# Test scenarios:
# 1. Create worktree → tmux session created
# 2. Delete worktree → tmux session terminated
# 3. AI naming → session renamed
# 4. Parallel execution → multiple worktrees created
# 5. Infinity mode → queue processing
```

---

## 🚀 Migration Path

### Backward Compatibility

既存の機能を壊さないように、段階的に統合：

1. **Phase 1**: TmuxManager（既存）を維持
2. **Phase 2**: WorktreeManager追加（新規）
3. **Phase 3**: 両方を統合
4. **Phase 4**: UI統一（オプション）

### Feature Flags

```typescript
// src/config/features.ts

export const FEATURES = {
  WORKTREE_MANAGER: true,        // Worktree UI有効化
  AI_NAMING: true,               // AI naming有効化
  PARALLEL_EXECUTION: true,      // 並列実行UI有効化
  INFINITY_MODE: false,          // Infinity mode（experimental）
};
```

```rust
// src-tauri/src/config.rs

#[derive(Debug, Deserialize)]
pub struct Features {
    pub worktree_manager: bool,
    pub ai_naming: bool,
    pub parallel_execution: bool,
    pub infinity_mode: bool,
}
```

---

## 📝 Detailed Specifications

### Worktree作成仕様

**Input**:
- `issue_number: u32` - Issue番号
- `agent_type: String` - Agent種別（CodeGenAgent, ReviewAgent, etc.）
- `enable_ai_naming: bool` - AI命名を有効化するか

**Process**:
1. Git worktree作成: `.worktrees/issue-{number}`
2. ブランチ作成: `worktree/issue-{number}`
3. tmuxセッション作成: `issue-{number}`
4. (Optional) AI naming: Anthropic APIでIssueタイトル→Worktree名
5. (Optional) セッションリネーム: `issue-270` → `memory-leak-fix`
6. `.agent-context.json` + `EXECUTION_CONTEXT.md` 生成

**Output**:
```rust
pub struct WorktreeSession {
    pub worktree_path: PathBuf,
    pub branch_name: String,
    pub session_name: String,
    pub issue_number: u32,
    pub agent_type: String,
    pub created_at: chrono::DateTime<Utc>,
}
```

### AI Naming仕様

**Anthropic API Call**:
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 100,
  "messages": [
    {
      "role": "user",
      "content": "Generate a concise Git worktree name (kebab-case, max 30 chars) for this issue:\nFix memory leak in logger.rs"
    }
  ]
}
```

**Response**:
```json
{
  "content": [
    {
      "text": "memory-leak-logger-fix"
    }
  ]
}
```

**Constraints**:
- kebab-case形式
- 最大30文字
- 英数字とハイフンのみ
- 先頭・末尾にハイフンなし

### Git Status取得仕様

**Command**:
```bash
cd .worktrees/issue-270
git status --porcelain
git rev-parse --abbrev-ref HEAD
git rev-list --left-right --count HEAD...@{upstream}
```

**Output**:
```rust
pub struct GitStatus {
    pub branch: String,          // "worktree/issue-270"
    pub ahead: usize,            // 3
    pub behind: usize,           // 0
    pub modified: usize,         // 5
    pub untracked: usize,        // 2
    pub staged: usize,           // 1
}
```

---

## 🎨 UI Design Mockup

### WorktreeManagerPanel (Desktop GUI)

```
┌─────────────────────────────────────────────────────────────────┐
│  Worktree Manager                         [🔄 Refresh] [⚙️ ❌]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Worktrees ──────────────┐  ┌─ Details ──────────────────┐  │
│  │                           │  │                            │  │
│  │ 📁 main (76f14edc2)       │  │ Worktree Details           │  │
│  │ └── 📂 .worktrees/        │  │ ────────────────────────── │  │
│  │     ├── 🟢 issue-270      │  │ Path:                      │  │
│  │     │   └── 🟢 tmux ✅    │  │ .worktrees/issue-270       │  │
│  │     │                     │  │                            │  │
│  │     ├── 🟢 issue-271      │  │ Branch:                    │  │
│  │     │   └── 🟢 tmux ✅    │  │ worktree/issue-270         │  │
│  │     │                     │  │                            │  │
│  │     └── 🟢 issue-272      │  │ Issue:                     │  │
│  │         └── 🟢 tmux ✅    │  │ #270 Fix memory leak       │  │
│  │                           │  │                            │  │
│  │ ─────────────────────────│  │ Git Status:                │  │
│  │ [+] Create Worktree       │  │ 🌿 worktree/issue-270      │  │
│  │ [🔄] Refresh              │  │ 📝 Modified: 3             │  │
│  │                           │  │ ➕ Untracked: 2            │  │
│  └───────────────────────────┘  │ ✓ Staged: 1                │  │
│                                 │ ⬆️ Ahead: 3 commits        │  │
│                                 │                            │  │
│                                 │ tmux Session:              │  │
│                                 │ ────────────────────────── │  │
│                                 │ Name: memory-leak-fix      │  │
│                                 │ Status: 🟢 Running         │  │
│                                 │ Uptime: 5m 32s             │  │
│                                 │                            │  │
│                                 │ [📎 Attach] [⏹️ Stop]       │  │
│                                 │                            │  │
│                                 │ AI Naming:                 │  │
│                                 │ ────────────────────────── │  │
│                                 │ [✨ Generate Name]         │  │
│                                 │                            │  │
│                                 │ Actions:                   │  │
│                                 │ ────────────────────────── │  │
│                                 │ [🗑️ Delete Worktree]       │  │
│                                 │ [📊 View Logs]             │  │
│                                 └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Parallel Execution Panel

```
┌─────────────────────────────────────────────────────────────────┐
│  Parallel Execution                                     [⏸️ ⏹️] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Active Worktrees: 3 / 3                                        │
│  Total Progress: ████████░░ 75% (3/4 completed)                 │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🟢 memory-leak-logger-fix                  ⏱️ 5m 32s       │ │
│  │ Progress: ████████████░░░ 80%                               │ │
│  │ Status: CodeGenAgent executing...                           │ │
│  │ 📝 Modified: 3 | ✓ Staged: 1                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🟢 k8s-support-implementation              ⏱️ 3m 12s       │ │
│  │ Progress: ██████████░░░░░ 60%                               │ │
│  │ Status: CodeGenAgent executing...                           │ │
│  │ 📝 Modified: 7 | ✓ Staged: 3                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✅ refactor-agent-structure                ⏱️ 8m 45s       │ │
│  │ Progress: ████████████████ 100%                             │ │
│  │ Status: Completed ✓                                         │ │
│  │ 📝 Modified: 0 | ✓ Staged: 0                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Success Criteria

### Phase 1-2 (Week 1)
- ✅ Rust backend: WorktreeManager実装完了
- ✅ Tauri commands: worktree操作可能
- ✅ Frontend: 基本UI表示
- ✅ Unit tests: 80%+ coverage

### Phase 3-5 (Week 2)
- ✅ Tree View: インタラクティブなWorktree表示
- ✅ Detail Panel: Git status, tmux統合
- ✅ AI Naming: Anthropic API統合
- ✅ Integration tests: 主要フロー網羅

### Phase 6-8 (Week 3)
- ✅ CLI: `miyabi tui` コマンド動作
- ✅ Parallel Execution: 複数Worktree同時管理
- ✅ Infinity Mode: 全Issue自動処理
- ✅ Documentation: 完全なガイド作成

---

## 🔗 Related Documents

- [TMUX_INTEGRATION_DESIGN.md](../miyabi-desktop/docs/TMUX_INTEGRATION_DESIGN.md) - 既存tmux統合設計
- [.claude/context/worktree.md](../.claude/context/worktree.md) - Worktreeプロトコル
- [.claude/context/agents.md](../.claude/context/agents.md) - Agent仕様
- [gwr Documentation](https://github.com/humanu/orchestra) - gwr公式ドキュメント

---

## 📊 Estimated Timeline

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Phase 1 | 3 days | Rust backend foundation |
| Phase 2 | 4 days | Frontend foundation |
| Phase 3 | 3 days | Tree View implementation |
| Phase 4 | 2 days | Detail Panel & Actions |
| Phase 5 | 2 days | AI Naming integration |
| Phase 6 | 2 days | CLI integration |
| Phase 7 | 3 days | Parallel & Infinity mode |
| Phase 8 | 2 days | Testing & Documentation |
| **Total** | **21 days** | **Full integration complete** |

---

## 🎯 Next Steps

1. **Review this plan** - チーム全体でレビュー
2. **Create GitHub Issues** - 各Phaseごとにissue作成
3. **Setup development environment** - gwr インストール確認
4. **Start Phase 1** - Rust backend実装開始

---

**Plan Author**: Claude Code
**Last Updated**: 2025-11-02
**Status**: Ready for Implementation ✅

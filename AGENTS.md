# Miyabi Agents Overview

**Last Updated**: 2025-11-03  
**Version**: 3.0.0  
**Maintained by**: Miyabi Team

---

## 🎯 Mandatory Protocols (必須プロトコル)

- **Rule 1 – Task Execution Protocol**  
  すべてのタスクは必ず Sub-Agent または Skill (`agent-execution`, `rust-development`, `documentation-generation` など) を経由して実施すること。直接実装は厳禁。
- **Rule 2 – MCP First Approach**  
  作業開始前に `claude mcp list` を実行し、利用可能な MCP サーバーを確認すること。詳細: `.claude/MCP_INTEGRATION_PROTOCOL.md`
- **Rule 3 – tmux send-keys Protocol (CRITICAL)**  
  tmux 上の Claude Code セッションへ入力する際は  
  `tmux send-keys -t <PANE> "command" && sleep 0.1 && tmux send-keys -t <PANE> Enter`  
  を厳守。`sleep` なしや `Enter` 省略は動作不良の原因となる。詳細: `.claude/TMUX_OPERATIONS.md`
- **Rule 4 – Context7 Usage**  
  外部ライブラリ情報は必ず Context7 経由で取得すること。例: `Use context7 to get the latest Tokio async runtime documentation`
- **Rule 5 – Inter-Agent Relay Protocol**  
  各エージェントはタスク完了・中断時に必ず次の担当エージェントへメッセージでトリガーを渡し、報告ループを維持すること。メッセージは `tmux send-keys -t <PANE> "message" && sleep 0.1 && tmux send-keys -t <PANE> Enter` 構文で送信する。自動化が必要な場合はメッセージに `[[exec:実行したいコマンド]]` を含め、`scripts/miyabi-skill-proxy.sh watch` を起動してホスト側で処理させる。

---

## 🤖 Agent Portfolio（稼働中 20 Agents）

### 🎭 Coding Agents (6) — Miyabi Orchestra v2.0

Water Spider v2.0 が自動でメッセージ中継を行い、W1-W5 までのワークフロー自動化 (100%) を実現。

| Agent | Character | Workflow Stage | tmux Pane | Status |
|-------|-----------|----------------|-----------|--------|
| IssueAgent | みつけるん | W1: Issue Triage | `%10` | ✅ Active |
| CoordinatorAgent | しきるん | W2: Task Decomposition | `%11` | ✅ Active |
| CodeGenAgent | カエデ | W3: Code Implementation | `%2` | ✅ Active |
| ReviewAgent | サクラ | W4: Code Review | `%5` | ✅ Active |
| PRAgent | ツバキ | W3: Pull Request | `%3` | ✅ Active |
| DeploymentAgent | ボタン | W5: Deployment | `%4` | ✅ Active |

**Workflow Chain**
```
みつけるん → しきるん → カエデ → サクラ → ツバキ → ボタン
```

**Reference**: `.claude/agents/tmux_agents_control.md`

### 💼 Business Agents (14) — Rust Implementation Complete

#### 🎯 戦略・企画系 (6)
- AIEntrepreneurAgent（あきんどさん）: 包括的ビジネスプラン
- ProductConceptAgent（けいかくん）: 収益モデル・USP
- ProductDesignAgent（つくるん2号）: サービス詳細設計
- FunnelDesignAgent（みちしるべん）: 顧客導線設計
- PersonaAgent（よみとるん）: ターゲット定義
- SelfAnalysisAgent（しらべるん）: キャリア分析

#### 📢 マーケティング系 (5)
- MarketResearchAgent（しらべるん2号）: 市場/競合調査
- MarketingAgent（ひろめるん）: 広告・SEO・SNS戦略
- ContentCreationAgent（かくちゃん）: コンテンツ制作計画
- SNSStrategyAgent（つぶやくん）: SNS 戦略立案
- YouTubeAgent（どうがくん）: YouTube 運用最適化

#### 🤝 営業・顧客管理系 (3)
- SalesAgent（うるん）: セールスプロセス整備
- CRMAgent（ささえるん）: 顧客体験向上
- AnalyticsAgent（かぞえるん）: KPI/PDCA 分析

**Specs**: `.claude/agents/specs/`  
**Prompts**: `.claude/agents/prompts/`  
**Character List**: `.claude/agents/AGENT_CHARACTERS.md`

---

## 🗺️ Planned & Upcoming Agents

### Coding Agents (計画中)

| Agent | Role | Status |
|-------|------|--------|
| RefresherAgent（アサガオ） | Issue 状態監視・自動更新 | 📋 Spec |
| DiscordCommunityAgent | Discord コミュニティ運用 | 📋 Spec |
| HooksIntegrationAgent | Git Hooks 統合 | 📋 Spec |
| ImageGenAgent (Dev) | 画像生成ワークフロー | 📋 Spec |

### Business Agents (計画中)

| Agent | Role |
|-------|------|
| HonokaAgent | AI 秘書・タスク管理支援 |
| JonathanIveDesignAgent | デザイン戦略/UI・UX |
| LPGenAgent | LP 自動生成 |
| NoteAgent | note.com 記事生成 |
| SlideGenAgent | プレゼン資料生成 |
| NarrationAgent | VOICEVOX ナレーション |
| ImageGenAgent (Biz) | 画像生成（マーケ用途） |

---

## 🎨 キャラクター命名と同時実行ルール

- 🔴 リーダー枠 (1): あきんどさん — 単独実行推奨
- 🟢 実行枠 (10): けいかくん・つくるん2号・かくちゃん など — 並列実行可
- 🔵 分析枠 (3): しらべるん・しらべるん2号・かぞえるん — 並列実行可

呼び出し例:  
`「あきんどさん でビジネスプラン作成」`  
`「かくちゃん と どうがくん を並列実行してコンテンツ制作」`

詳細: `.claude/agents/AGENT_CHARACTERS.md`

---

## 🚀 Execution Interfaces

- **CLI**  
  `codex`  
  並列実行: `codex` (マルチペインで同時起動)
- **tmux Orchestra**  
  `./scripts/miyabi-orchestra-interactive.sh` または `./scripts/miyabi-orchestra.sh coding-ensemble`
- **Rust API**  
  `crates/miyabi-agent-business/src/` と `crates/miyabi-agent-core/src/` の `BaseAgent` 実装を参照
- **MCP Server**  
  JSON-RPC 2.0 経由で `agents/<name>/execute` メソッドを呼び出し可能

---

## 🔗 Related Documentation

- `.claude/context/agents.md` – 詳細な背景情報
- `.claude/context/core-rules.md` – クリティカルルールの原典
- `.claude/context/worktree.md` – Worktree プロトコル
- `docs/AGENT_OPERATIONS_MANUAL.md` – 運用マニュアル
- `docs/CLAUDE_CODE_COMMANDS.md` – Claude Code コマンド集

---

## 🗂️ Change Log

- **2025-11-03**: Miyabi Orchestra v2.0 反映、Agent カタログを全面更新、tmux プロトコル追記

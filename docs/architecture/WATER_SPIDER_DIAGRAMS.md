# Water Spider Orchestrator - PlantUML Diagrams

**作成日**: 2025-10-23
**バージョン**: v1.0.0

完全非同期並列実行システムの全体像を4種類のアーキテクチャ図で可視化しました。

---

## 📊 生成された図の一覧

### 1. System Architecture (システム全体構成)
**ファイル**: `Water Spider Orchestrator - System Architecture.png` (391KB)
**PlantUML**: `water-spider-architecture.puml`

**内容**:
- GitHub OS層（Issue Storage, Webhooks, API, Actions）
- Task Scheduler Service層（4コンポーネント: Collector, Calculator, Queue, Dispatcher）
- Self-hosted Runner層（Claude Code Sessions, Worktree管理）
- GitHub Results層（Issue Comments, PR Creation, Issue Close）
- 各層間の通信フロー
- Task Queue の3種類（Priority, Blocked, Running）

**用途**: システム全体の構造を理解する際に参照

---

### 2. Task Flow Sequence (タスク実行フロー)
**ファイル**: `Water Spider Orchestrator - Task Flow Sequence.png` (390KB)
**PlantUML**: `water-spider-sequence.puml`

**内容**:
- Issue作成から完了までの完全フロー
- 7つのフェーズ:
  1. Issue Creation & Labeling
  2. Priority Calculation
  3. Task Dispatch
  4. Worktree Creation
  5. Claude Code Execution (時間最小化)
  6. Cleanup & Integration
  7. Dependency Resolution

**用途**: Issue処理の時系列を理解する際に参照

---

### 3. State Transitions (状態遷移図)
**ファイル**: `Water Spider Orchestrator - State Transitions.png` (250KB)
**PlantUML**: `water-spider-states.puml`

**内容**:
- Issueの完全ライフサイクル
- 状態:
  - Created → Priority Queue / Blocked Queue
  - Running Queue (Dispatched → Worktree Created → Session Executing)
  - Session Phases (Phase 1-4, 各< 3秒)
  - Completed (PR Created → Issue Closed)
  - Failed (Error Logged → Manual Intervention)

**用途**: Issue状態管理を理解する際に参照

---

### 4. Deployment Architecture (物理構成図)
**ファイル**: `Water Spider Orchestrator - Deployment Architecture.png` (380KB)
**PlantUML**: `water-spider-deployment.puml`

**内容**:
- GitHub Cloud (github.com)
  - Issue Storage, GitHub API, GitHub Actions, Packages
- VPS / Cloud Server ($5-10/month)
  - Task Scheduler Service (24/7常駐)
  - Redis (Queue Storage)
  - Monitoring (Prometheus + Grafana)
- Self-hosted Runners (Mac mini LAN)
  - Mac mini #1 (192.168.3.27): Primary Runner (3 parallel sessions)
  - Mac mini #2 (192.168.3.26): Secondary Runner (2 parallel sessions)
- Developer MacBook (Manual Execution)
- Local Network (192.168.3.0/24)

**用途**: 物理配置とコスト計画を理解する際に参照

---

## 🔧 PlantUMLファイルの編集

### 再生成コマンド

```bash
# 個別生成
plantuml -tpng docs/water-spider-architecture.puml
plantuml -tpng docs/water-spider-sequence.puml
plantuml -tpng docs/water-spider-states.puml
plantuml -tpng docs/water-spider-deployment.puml

# 一括生成
cd docs && plantuml -tpng water-spider-*.puml
```

### オンラインプレビュー

PlantUMLファイルをオンラインでプレビュー:
- [PlantText](https://www.planttext.com/)
- [PlantUML Web Server](http://www.plantuml.com/plantuml/uml/)

---

## 📝 設計原則の可視化

全4つの図は、以下の設計原則を反映しています：

1. **セッション時間最小化** (可能な限り短縮)
   - Sequence図で時間フローを可視化
   - State図でPhase 1-4の実行フローを記載

2. **完全非同期並列実行** (無制限)
   - Architecture図でTask Queueの3種類を表示
   - Deployment図で5並列実行環境を示す

3. **GitHub OS中心アーキテクチャ**
   - Architecture図でGitHub層を最上位に配置
   - 全通信がGitHubを経由

4. **Self-hosted Runnerによるローカル実行**
   - Deployment図でMac mini LAN統合を詳細化

5. **1 Session = 1 Issue (厳密対応)**
   - Architecture図でWorktree単位のセッション分離を表示
   - State図で厳密な1対1マッピングを明記

6. **ログベース通信 (Human-in-the-loop禁止)**
   - Sequence図でIssue commentへのログ記録フローを明示
   - State図で@mentionエスカレーションを明記

---

## 🎯 想定読者別の推奨図

### 開発者向け
1. **System Architecture** - システム全体の構造把握
2. **Task Flow Sequence** - 実装時の処理フロー理解

### プロジェクトマネージャー向け
1. **State Transitions** - Issue管理フローの把握
2. **Task Flow Sequence** - タスク完了までの時間見積もり

### インフラエンジニア向け
1. **Deployment Architecture** - 物理構成とコスト計画
2. **System Architecture** - サービス間通信の理解

### 経営者 / 意思決定者向け
1. **Deployment Architecture** - インフラコスト ($5-10/month)
2. **State Transitions** - 自動化による効率化効果

---

## 🔗 関連ドキュメント

- [WATER_SPIDER_ORCHESTRATOR_DESIGN.md](WATER_SPIDER_ORCHESTRATOR_DESIGN.md) - 設計書 (1,236行)
- [水蜘蛛解説動画](../tools/output/water-spider-kakeai/water-spider-orchestrator.mp4) - 霊夢×魔理沙 (12:35)
- [掛け合い台本](../tools/water-spider-kakeai.txt) - 184発話

---

## 📦 ファイルサイズ一覧

```
-rw-r--r--  391KB  Water Spider Orchestrator - System Architecture.png
-rw-r--r--  390KB  Water Spider Orchestrator - Task Flow Sequence.png
-rw-r--r--  250KB  Water Spider Orchestrator - State Transitions.png
-rw-r--r--  380KB  Water Spider Orchestrator - Deployment Architecture.png
-------------------------------------------------------------
合計:       1.4MB
```

---

**作成ツール**: PlantUML v1.2025.9
**テーマ**: materia-outline
**生成日時**: 2025-10-23 23:55-23:56

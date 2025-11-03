# Miyabi Schemas

**Miyabi Orchestra設定のYAML Schema定義**

---

## 📋 Quick Links

### Master Configuration
- **Current Config**: [../ orchestra-config.yaml](../orchestra-config.yaml) - 490行の完全設定ファイル
- **Integration Guide**: [../MIYABI_ORCHESTRA_INTEGRATION.md](../MIYABI_ORCHESTRA_INTEGRATION.md) - 完全統合ガイド

### Schema Files (このディレクトリ)
- **JSON Schema**: [orchestra-config.schema.yaml](./orchestra-config.schema.yaml) - 12KB、7セクション
- **Example Config**: [orchestra-config.example.yaml](./orchestra-config.example.yaml) - サンプル設定
- **This Documentation**: [README.md](./README.md) - 使い方・FAQ

### User Guides
- **Quick Start**: [../../docs/QUICK_START_3STEPS.md](../../docs/QUICK_START_3STEPS.md) - 3分でセットアップ
- **Your Setup**: [../../docs/YOUR_CURRENT_SETUP.md](../../docs/YOUR_CURRENT_SETUP.md) - 現在の構成
- **tmux Guide**: [../../docs/TMUX_QUICKSTART.md](../../docs/TMUX_QUICKSTART.md) - 5分で基本操作

---

## 📋 概要

このディレクトリには、Miyabi Orchestra（並列Agent実行システム）の設定ファイルを検証するためのYAML Schemaが含まれています。

**Purpose**:
- orchestra-config.yamlの構造を定義
- VS Codeでの自動補完とバリデーション
- 設定ミスの早期検出

---

## 📂 ファイル構成

```
.claude/schemas/
├── README.md                           # このファイル
├── orchestra-config.schema.yaml        # YAML Schema定義
└── orchestra-config.example.yaml       # サンプル設定ファイル
```

---

## 🚀 使い方

### 1. サンプル設定ファイルをコピー

```bash
cp .claude/schemas/orchestra-config.example.yaml orchestra-config.yaml
```

### 2. 設定ファイルを編集

```yaml
# orchestra-config.yaml

orchestration:
  max_retries: 3
  timeout_seconds: 300

ensemble:
  type: coding  # coding | hybrid | demo
  num_agents: 4

agents:
  - name: カエデ
    type: CodeGenAgent
    pane_id: "%2"
    role: Rustコード実装担当
```

### 3. Schemaに基づいて検証

**方法A: VS Code（推奨）**

`.vscode/settings.json`に以下を追加：

```json
{
  "yaml.schemas": {
    ".claude/schemas/orchestra-config.schema.yaml": "orchestra-config.yaml"
  }
}
```

**方法B: yamllint**

```bash
yamllint -f parsable orchestra-config.yaml
```

**方法C: yq + jq**

```bash
# YAMLをJSONに変換してJSON Schema検証
yq eval -o=json orchestra-config.yaml | \
  jq -s '.[0] as $data | .[1] as $schema | $data | .. | objects | select(.orchestration) | .orchestration.max_retries'
```

---

## 📖 Schema詳細

### 主要セクション

#### 1. `orchestration`（必須）

Agent実行のライフサイクル管理とリトライ戦略。

```yaml
orchestration:
  max_retries: 3              # 最大リトライ回数（0-10）
  initial_backoff_ms: 100     # 初期バックオフ（10-5000ms）
  backoff_multiplier: 2.0     # バックオフ乗数（1.0-5.0）
  max_backoff_ms: 10000       # 最大バックオフ（1000-60000ms）
  timeout_seconds: 300        # タイムアウト（10-3600秒）
```

#### 2. `ensemble`（必須）

tmux paneのレイアウトとAgent配置。

```yaml
ensemble:
  type: coding                # coding | hybrid | demo | custom
  num_agents: 4               # Agent数（1-20）
  layout: tiled               # tiled | even-horizontal | even-vertical
  custom_layout: "1a2b,..."   # カスタムレイアウト（オプション）
```

**Ensemble Types**:
- **coding**: Coding Ensemble（5-pane: Conductor + 4 Coding Agents）
- **hybrid**: Hybrid Ensemble（7-pane: Conductor + 3 Coding + 3 Business Agents）
- **demo**: Quick Demo（2-pane: Conductor + 1 Agent）
- **custom**: カスタム構成

#### 3. `agents`

Agent定義リスト。

```yaml
agents:
  - name: カエデ                     # Agent名
    type: CodeGenAgent             # AgentType（E3）
    pane_id: "%2"                  # tmux pane ID
    pane_index: 1                  # pane index（0始まり）
    role: Rustコード実装担当          # 役割説明
    authority: 🔵実行権限           # 権限レベル
    escalation_target: TechLead    # エスカレーション先
```

**Agent Types**:

**Coding Agents（7種類）**:
- CoordinatorAgent
- CodeGenAgent
- ReviewAgent
- IssueAgent
- PRAgent
- DeploymentAgent
- RefresherAgent

**Business Agents（14種類）**:
- AIEntrepreneurAgent
- ProductConceptAgent
- ProductDesignAgent
- FunnelDesignAgent
- PersonaAgent
- SelfAnalysisAgent
- MarketResearchAgent
- MarketingAgent
- ContentCreationAgent
- SNSStrategyAgent
- YouTubeAgent
- SalesAgent
- CRMAgent
- AnalyticsAgent

**Authority Levels**:
- 🔴統括権限: CoordinatorAgent
- 🔵実行権限: Coding/Business Agents
- 🟢分析権限: Analytics系Agents

#### 4. `tmux`（オプション）

tmux固有の設定。

```yaml
tmux:
  session_name: miyabi
  window_name: coding-ensemble
  prefix_key: C-a                      # C-a (Kamui) | C-b (Standard)
  pane_border_status: top              # off | top | bottom
  pane_border_format: " 🎹 #{pane_title} "
```

#### 5. `metrics`（オプション）

実行メトリクスの収集と保存。

```yaml
metrics:
  enabled: true
  output_dir: .ai/logs/metrics
  format: json                         # json | yaml | csv
  include_fields:
    - start_time
    - end_time
    - duration_ms
    - success
```

#### 6. `logging`（オプション）

ログ出力設定。

```yaml
logging:
  level: info                          # trace | debug | info | warn | error
  output: both                         # stdout | file | both
  file_path: .ai/logs/orchestra.log
```

#### 7. `reporting`（オプション）

Agentの報告プロトコル設定。

```yaml
reporting:
  format: "[{agent_name}] {message}"
  conductor_pane: "%1"
  send_delay_ms: 100
```

---

## 🎯 ユースケース

### ケース1: Coding Ensemble（推奨）

```yaml
ensemble:
  type: coding
  num_agents: 4

agents:
  - { name: カエデ, type: CodeGenAgent, pane_id: "%2" }
  - { name: サクラ, type: ReviewAgent, pane_id: "%5" }
  - { name: ツバキ, type: PRAgent, pane_id: "%3" }
  - { name: ボタン, type: DeploymentAgent, pane_id: "%4" }
```

**用途**: Issue実装・バグ修正・リファクタリング

### ケース2: Hybrid Ensemble（上級者向け）

```yaml
ensemble:
  type: hybrid
  num_agents: 6

agents:
  # Coding Track
  - { name: CodeGen, type: CodeGenAgent, pane_id: "%27" }
  - { name: Review, type: ReviewAgent, pane_id: "%28" }
  - { name: PR, type: PRAgent, pane_id: "%25" }
  # Business Track
  - { name: MarketResearch, type: MarketResearchAgent, pane_id: "%29" }
  - { name: Content, type: ContentCreationAgent, pane_id: "%30" }
  - { name: Analytics, type: AnalyticsAgent, pane_id: "%31" }
```

**用途**: 技術実装 + ビジネス戦略同時展開

### ケース3: Quick Demo

```yaml
ensemble:
  type: demo
  num_agents: 1

agents:
  - { name: TestAgent, type: CodeGenAgent, pane_id: "%27" }
```

**用途**: 最小構成で動作確認

---

## 📊 Entity-Relation Model統合

このSchemaは、Miyabiの[Entity-Relation Model](../../docs/architecture/ENTITY_RELATION_MODEL.md)と統合されています。

### Entity参照

- **E3 (Agent)**: `agents[].type`
- **E7 (Command)**: `reporting.format`
- **E12 (Worktree)**: `orchestration.timeout_seconds`

### Relationship参照

- **R9**: Agent executes Task → `orchestration`セクション
- **R15**: Command invoked-by Agent → `reporting`セクション

---

## 🔗 関連ドキュメント

- **Entity-Relation Model**: [docs/architecture/ENTITY_RELATION_MODEL.md](../../docs/architecture/ENTITY_RELATION_MODEL.md)
- **Agent仕様**: [.claude/agents/specs/](../agents/specs/)
- **tmux Operations**: [.claude/TMUX_OPERATIONS.md](../TMUX_OPERATIONS.md)
- **Quick Start**: [docs/QUICK_START_3STEPS.md](../../docs/QUICK_START_3STEPS.md)

---

## ❓ FAQ

### Q1: `pane_id`はどうやって確認しますか？

```bash
tmux list-panes -F "#{pane_index}: #{pane_id}"

# 出力例:
# 0: %1  ← Conductor
# 1: %2  ← カエデ
# 2: %5  ← サクラ
```

### Q2: カスタムレイアウトの作成方法は？

```bash
# 現在のレイアウトを取得
tmux list-windows -F "#{window_layout}"

# 出力をcustom_layoutにコピー
```

### Q3: Schemaのバージョン管理は？

Schemaは`$id`フィールドでバージョン管理されています：

```yaml
$id: "https://github.com/ShunsukeHayashi/Miyabi/schemas/orchestra-config.schema.yaml"
```

---

**🎭 Miyabi Orchestra - YAML Schema Definition**

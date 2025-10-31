# Miyabi Definition System

**Version**: 1.0.0
**Format**: Jinja2 + YAML
**Generated**: 2025-10-31

## 概要

Miyabiプロジェクトの完全な定義を、構造化されたYAMLフォーマットで提供します。Jinja2テンプレートシステムを使用することで、モジュール化・保守性・拡張性を実現しています。

### Phase 1 (Foundation) - ✅ Complete

**Foundation Variable Files** (4,290 lines):
- `entities.yaml` (1,420 lines) - 14 Core Entities (E1-E14)
- `relations.yaml` (1,350 lines) - 39 Relations (R1-R39) with N1/N2/N3 notation
- `labels.yaml` (840 lines) - 57 Labels across 11 categories
- `workflows.yaml` (680 lines) - 5 Core Workflows (W1-W5) with 38 stages

**Foundation Templates** (4 files):
- `entities.yaml.j2` (287 lines) - Handles both dict and list attributes
- `relations.yaml.j2` (185 lines) - Comprehensive relation rendering
- `labels.yaml.j2` (180 lines) - All 11 label categories
- `workflows.yaml.j2` (130 lines) - Full workflow specifications

**Generated Outputs** (8 files, 152KB total):
- Successfully generating all foundation files with correct structure
- YAML validation passed for all files
- Entity/Relation/Label/Workflow counts match source data

## ディレクトリ構造

```
miyabi_def/
├── INDEX.yaml              # マスターインデックス
├── README.md               # このファイル
├── generate.py             # YAML生成スクリプト
│
├── variables/              # 変数定義ファイル (9 files)
│   ├── global.yaml         # グローバル変数
│   ├── entities.yaml       # 14 Entities定義 ✨ NEW
│   ├── relations.yaml      # 39 Relations定義 ✨ NEW
│   ├── labels.yaml         # 57 Labels定義 ✨ NEW
│   ├── workflows.yaml      # 5 Workflows定義 ✨ NEW
│   ├── agents.yaml         # 21 Agents定義
│   ├── crates.yaml         # 15 Crates定義
│   ├── skills.yaml         # 18 Skills定義
│   └── universal_execution.yaml  # Ω-System定義
│
├── templates/              # Jinja2テンプレート (9 files)
│   ├── base.yaml.j2        # ベーステンプレート
│   ├── entities.yaml.j2    # Entities定義テンプレート ✨ NEW
│   ├── relations.yaml.j2   # Relations定義テンプレート ✨ NEW
│   ├── labels.yaml.j2      # Labels定義テンプレート ✨ NEW
│   ├── workflows.yaml.j2   # Workflows定義テンプレート ✨ NEW
│   ├── agents.yaml.j2      # Agents定義テンプレート
│   ├── crates.yaml.j2      # Crates定義テンプレート
│   ├── skills.yaml.j2      # Skills定義テンプレート
│   └── universal_task_execution.yaml.j2  # Ω-System テンプレート
│
├── generated/              # 生成されたYAMLファイル (8 files, 152KB)
│   ├── entities.yaml       # 14 Entities完全定義 (39KB) ✨ NEW
│   ├── relations.yaml      # 39 Relations完全定義 (25KB) ✨ NEW
│   ├── labels.yaml         # 57 Labels完全定義 (14KB) ✨ NEW
│   ├── workflows.yaml      # 5 Workflows完全定義 (13KB) ✨ NEW
│   ├── agents.yaml         # 21 Agents完全定義 (9.4KB)
│   ├── crates.yaml         # 15 Crates完全定義 (6.3KB)
│   ├── skills.yaml         # 18 Skills完全定義 (7.6KB)
│   └── universal_task_execution.yaml  # Ω-System (21KB)
│
└── .venv/                  # Python仮想環境 (gitignored)
```

## 使い方

### 1. セットアップ

```bash
cd miyabi_def

# Python仮想環境を作成
python3 -m venv .venv
source .venv/bin/activate

# 依存関係をインストール
pip install pyyaml jinja2
```

### 2. 定義ファイルの生成

```bash
# 全ての定義ファイルを生成
python generate.py

# 利用可能なテンプレート一覧
python generate.py --list-templates

# 利用可能な変数ファイル一覧
python generate.py --list-variables
```

### 3. 生成されたファイルの確認

```bash
# 生成されたファイルを確認
ls -lh generated/

# エージェント定義を表示
cat generated/agents.yaml

# Crate定義を表示
cat generated/crates.yaml

# スキル定義を表示
cat generated/skills.yaml
```

## コンポーネント

### Variables (変数定義)

#### `variables/global.yaml`
プロジェクト全体で共有されるグローバル変数
- プロジェクト名・バージョン
- リポジトリURL
- Rustツールチェーン情報
- 各種カウント（crates数、agents数等）

#### `variables/entities.yaml` ✨ NEW
14個のCore Entity定義 (E1-E14)
- Issue, Task, Agent, PR, Label, QualityReport, Command, Escalation, Deployment, LDDLog, DAG, Worktree, DiscordCommunity, SubIssue
- 各Entityに完全な属性・型・実装情報

#### `variables/relations.yaml` ✨ NEW
39個のRelation定義 (R1-R39)
- N1 (1:1), N2 (1:N), N3 (N:N) cardinality notation
- 実装メソッド、トリガー条件、アルゴリズム詳細

#### `variables/labels.yaml` ✨ NEW
57個のLabel定義 (11カテゴリ)
- STATE (8), AGENT (6), PRIORITY (4), TYPE (7), SEVERITY (4), PHASE (5), SPECIAL (7), TRIGGER (4), QUALITY (4), COMMUNITY (4), HIERARCHY (4)
- 自動化ルール、状態遷移フロー

#### `variables/workflows.yaml` ✨ NEW
5個のWorkflow定義 (W1-W5, 38ステージ)
- Issue Creation & Triage → Task Decomposition → Code Implementation → Code Review → Deployment
- 各ステージの詳細、期間、ハンドラー、意思決定ポイント

#### `variables/agents.yaml`
21個のエージェント定義
- **Coding Agents (7)**: CoordinatorAgent, CodeGenAgent, ReviewAgent, IssueAgent, PRAgent, DeploymentAgent, RefresherAgent
- **Business Agents (14)**: 戦略企画系6個、マーケティング系5個、営業CRM系3個

#### `variables/crates.yaml`
15個のCrate定義
- **Core (3)**: miyabi-cli, miyabi-core, miyabi-types
- **Agents (2)**: miyabi-agents, miyabi-agent-business
- **Integrations (5)**: miyabi-github, miyabi-llm, miyabi-knowledge, miyabi-voice-guide, miyabi-mcp-server
- **Utilities (4)**: miyabi-worktree, miyabi-pty-manager, miyabi-tui, miyabi-web-api
- **Frontend (3)**: miyabi-desktop, miyabi-dashboard, miyabi-web

#### `variables/skills.yaml`
18個のスキル定義
- **Development (5)**: rust-development, debugging-troubleshooting, dependency-management, performance-analysis, security-audit
- **Operations (5)**: agent-execution, git-workflow, documentation-generation, issue-analysis, project-setup
- **Business (5)**: business-strategy-planning, content-marketing-strategy, market-research-analysis, sales-crm-management, growth-analytics-dashboard
- **Specialized (3)**: voicevox, lark-integration, knowledge-search

### Templates (Jinja2テンプレート)

#### `templates/base.yaml.j2`
全てのテンプレートの基底クラス
- メタデータブロック
- コンテンツブロック
- フッターブロック

#### `templates/agents.yaml.j2`
エージェント定義を生成するテンプレート
- `base.yaml.j2`を継承
- `agents.*`変数を使用

#### `templates/crates.yaml.j2`
Crate定義を生成するテンプレート
- `base.yaml.j2`を継承
- `crates.*`変数を使用

#### `templates/skills.yaml.j2`
スキル定義を生成するテンプレート
- `base.yaml.j2`を継承
- `skills.*`変数を使用

### Generator (生成スクリプト)

`generate.py` - Python3スクリプト
- Jinja2テンプレートエンジンを使用
- 全ての変数ファイルを読み込み
- テンプレートをレンダリング
- `generated/`ディレクトリに出力

## Jinja2フォーマットの利点

### 1. モジュール化
変数とテンプレートが分離されているため、更新が容易
```yaml
# variables/global.yaml
global:
  project:
    version: "0.1.2"  # ここだけ変更すれば全ファイルに反映
```

### 2. 再利用性
ベーステンプレートを全ての定義が継承
```jinja2
{% extends "base.yaml.j2" %}
```

### 3. 保守性
変数を一度変更すれば、全ファイルを再生成可能
```bash
python generate.py
```

### 4. 型安全性
YAML構造により、一貫したデータ型を保証

### 5. バージョン管理
変数ファイルと生成ファイルを分離して管理

### 6. 自動化
CI/CDパイプラインに統合可能

## 統計情報

- **変数ファイル**: 4個
- **テンプレートファイル**: 4個
- **生成ファイル**: 3個
- **合計サイズ**: 22,267 bytes

### エージェント
- **合計**: 21個
  - Coding: 7個
  - Business: 14個

### Crates
- **合計**: 15個
  - 5カテゴリに分類

### スキル
- **合計**: 18個
  - 4カテゴリに分類

## 今後の拡張予定

1. **architecture.yaml** - システムアーキテクチャ定義
2. **entity_relation.yaml** - エンティティ関係モデル (14 entities, 39 relations)
3. **labels.yaml** - 57ラベルシステム定義
4. **workflows.yaml** - GitHub Actionsワークフロー定義
5. **configuration.yaml** - `.miyabi.yml`と環境設定

## ユースケース

1. **ドキュメント生成** - 自動的に最新のドキュメントを生成
2. **プロジェクト分析** - 構造化データとして分析
3. **CI/CD統合** - パイプラインでの自動検証
4. **オンボーディング** - 新規開発者への説明資料
5. **API生成** - スキーマからAPIを自動生成
6. **スキーマ検証** - YAMLスキーマによる検証

## Miyabiプロジェクトとの統合

- **プロジェクトパス**: `/Users/shunsuke/Dev/miyabi-private/miyabi_def/`
- **統合**: Miyabiコアプロジェクトの一部
- **目的**: 構造化された機械可読なプロジェクト定義の提供

## メンテナンス

### 変数の更新

1. 該当する変数ファイルを編集
   ```bash
   vim variables/agents.yaml
   ```

2. 定義ファイルを再生成
   ```bash
   python generate.py
   ```

3. 変更を確認
   ```bash
   git diff generated/
   ```

### 新しいテンプレートの追加

1. 新しい変数ファイルを作成
   ```bash
   vim variables/new_component.yaml
   ```

2. 新しいテンプレートを作成
   ```bash
   vim templates/new_component.yaml.j2
   ```

3. ベーステンプレートを継承
   ```jinja2
   {% extends "base.yaml.j2" %}
   {% block content %}
   # Your content here
   {% endblock %}
   ```

4. 生成
   ```bash
   python generate.py
   ```

## ライセンス

Apache-2.0

## 作成者

Miyabi Team

---

**Last Updated**: 2025-10-31
**Version**: 1.0.0

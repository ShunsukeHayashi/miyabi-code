---
title: "Miyabi × Obsidian - Complete Integration Plan"
created: 2025-11-18
updated: 2025-11-18
author: "Claude Code"
category: "planning"
tags: ["miyabi", "obsidian", "integration", "architecture", "knowledge-base"]
status: "published"
---

# 🌸 Miyabi × Obsidian - 完全統合計画

**Version**: 1.0.0
**Target**: Miyabi v2.1.0+
**Scope**: プロジェクト全体のObsidian統合戦略

---

## 📋 Executive Summary

Miyabiプロジェクトの全コンポーネント（21 Agents、15 Crates、5 Workflows、14 Entities、miyabi_def定義システム）とObsidianを統合し、**完全な知識管理・可視化・自動化システム**を構築します。

### 🎯 統合目標

1. **ゼロ・マニュアル原則**: ドキュメント手動作成ゼロ
2. **リアルタイム可視化**: Agent活動をリアルタイム表示
3. **双方向同期**: Obsidian ↔ GitHub完全同期
4. **プラグイン拡張**: Miyabi専用機能追加
5. **ナレッジ統合**: 全情報を検索可能に

### 📊 統合範囲

| 領域 | 現状 | 統合後 | 効果 |
|------|------|--------|------|
| **ドキュメント** | 手動作成18ファイル | 自動生成200+ファイル | **10倍** |
| **可視化** | なし | Entity-Relation図、Workflow図 | **新規** |
| **検索** | grep | セマンティック検索 | **高精度** |
| **Agent統合** | ログのみ | 実行履歴・レポート自動生成 | **自動化** |
| **GitHub連携** | 片方向 | 双方向同期 | **完全統合** |

---

## 🏗️ Integration Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Miyabi Project                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  miyabi_def  │───▶│   Obsidian   │◀───│ Git Worktree │     │
│  │  (定義YAML)  │    │    Vault     │    │  (.ai/logs)  │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         │                    ▲                    │            │
│         │                    │                    │            │
│         ▼                    │                    ▼            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  21 Agents   │────│ Agent Logs   │    │GitHub Issues │     │
│  │  (Rust/tmux) │    │ (Markdown)   │    │   (API)      │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         │                    │                    │            │
│         │                    │                    │            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────────────────────────────────────────────┐       │
│  │           miyabi-knowledge (Qdrant Vector DB)       │       │
│  │              + Obsidian Knowledge Base              │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
[miyabi_def/*.yaml]
    ↓ (generate.py)
[Generated Markdown]
    ↓ (sync)
[Obsidian Vault]
    ↓ (embed)
[Qdrant Vector DB]
    ↓ (search)
[Agent Context]
```

---

## 🔟 Ten Integration Areas

### 1️⃣ miyabi_def → Obsidian Auto-Generation

**目的**: 定義YAMLから完全なObsidianドキュメント自動生成

#### 実装

**新規Crateの作成**: `miyabi-obsidian-generator`

```rust
// crates/miyabi-obsidian-generator/src/lib.rs
use serde::Deserialize;
use std::path::PathBuf;

pub struct ObsidianGenerator {
    vault_path: PathBuf,
    template_engine: TemplateEngine,
}

impl ObsidianGenerator {
    /// Generate all documents from miyabi_def
    pub async fn generate_all(&self) -> Result<GenerationReport> {
        // 1. Load miyabi_def variables
        let entities = self.load_yaml("miyabi_def/variables/entities.yaml")?;
        let relations = self.load_yaml("miyabi_def/variables/relations.yaml")?;
        let labels = self.load_yaml("miyabi_def/variables/labels.yaml")?;
        let workflows = self.load_yaml("miyabi_def/variables/workflows.yaml")?;
        let agents = self.load_yaml("miyabi_def/variables/agents.yaml")?;

        // 2. Generate Entity documents
        for entity in entities {
            self.generate_entity_doc(entity).await?;
        }

        // 3. Generate Relation documents
        for relation in relations {
            self.generate_relation_doc(relation).await?;
        }

        // 4. Generate Workflow visualizations
        for workflow in workflows {
            self.generate_workflow_doc(workflow).await?;
        }

        // 5. Generate Agent specifications
        for agent in agents {
            self.generate_agent_doc(agent).await?;
        }

        // 6. Generate cross-reference index
        self.generate_index().await?;

        Ok(GenerationReport::success())
    }

    /// Generate Entity document with frontmatter and links
    async fn generate_entity_doc(&self, entity: Entity) -> Result<()> {
        let template = r#"---
title: "{{ entity.name }} ({{ entity.id }})"
created: {{ now }}
updated: {{ now }}
author: "Miyabi Auto-Generator"
category: "entities"
tags: ["miyabi", "entity", "{{ entity.category }}"]
status: "published"
---

# {{ entity.name }}

**ID**: {{ entity.id }}
**Type**: {{ entity.entity_type }}
**Implementation**: `{{ entity.implementation_file }}`

## 📝 Description

{{ entity.description }}

## 🔗 Attributes

{% for attr in entity.attributes %}
### {{ attr.name }}

- **Type**: `{{ attr.type }}`
- **Required**: {{ attr.required }}
- **Description**: {{ attr.description }}
{% if attr.example %}
- **Example**: `{{ attr.example }}`
{% endif %}
{% endfor %}

## 🔄 Relations

### Outgoing Relations

{% for relation in entity.outgoing_relations %}
- [[{{ relation.target_entity }}]] via [[{{ relation.name }}]] ({{ relation.cardinality }})
{% endfor %}

### Incoming Relations

{% for relation in entity.incoming_relations %}
- [[{{ relation.source_entity }}]] via [[{{ relation.name }}]] ({{ relation.cardinality }})
{% endfor %}

## 📖 Related Documents

- [[Entity-Relation-Model]]
- [[Workflows]]
{% for agent in entity.related_agents %}
- [[{{ agent }}]]
{% endfor %}

## 🔍 Search Tags

#entity #{{ entity.id }} #{{ entity.category }}
"#;

        let output = self.template_engine.render(template, &entity)?;
        let file_path = self.vault_path
            .join("entities")
            .join(format!("{}.md", entity.id));

        fs::write(file_path, output).await?;
        Ok(())
    }
}
```

#### 生成されるドキュメント

**エンティティごと**: 14ファイル
```
entities/
├── E1-Issue.md
├── E2-Task.md
├── E3-Agent.md
├── E4-PR.md
├── E5-Label.md
├── E6-QualityReport.md
├── E7-Command.md
├── E8-Escalation.md
├── E9-Deployment.md
├── E10-LDDLog.md
├── E11-DAG.md
├── E12-Worktree.md
├── E13-DiscordCommunity.md
└── E14-SubIssue.md
```

**リレーションごと**: 39ファイル
```
relations/
├── R1-Issue-analyzed-by-Agent.md
├── R2-Issue-decomposed-into-Task.md
├── R3-Issue-tagged-with-Label.md
...
└── R39-SubIssue-resolved-by-PR.md
```

**ワークフローごと**: 5ファイル
```
workflows/
├── W1-Issue-Creation-Triage.md
├── W2-Task-Decomposition-Planning.md
├── W3-Code-Implementation.md
├── W4-Code-Review-QA.md
└── W5-Deployment-Monitoring.md
```

**Agentごと**: 21ファイル
```
agents/
├── coding/
│   ├── IssueAgent.md
│   ├── CoordinatorAgent.md
│   ├── CodeGenAgent.md
│   ├── ReviewAgent.md
│   ├── PRAgent.md
│   ├── DeploymentAgent.md
│   └── RefresherAgent.md
└── business/
    ├── AIEntrepreneurAgent.md
    ├── ProductConceptAgent.md
    ...
    └── AnalyticsAgent.md
```

**ラベルごと**: 57ファイル (カテゴリ別)
```
labels/
├── state/
│   ├── pending.md
│   ├── analyzing.md
│   ...
├── agent/
│   ├── agent-coordinator.md
│   ...
├── priority/
│   ├── P0-Critical.md
│   ...
...
```

**合計**: **136 auto-generated documents**

#### CLI統合

```bash
# 全ドキュメント生成
miyabi obsidian generate --all

# 特定カテゴリのみ
miyabi obsidian generate --entities
miyabi obsidian generate --workflows
miyabi obsidian generate --agents

# インクリメンタル更新
miyabi obsidian sync

# 検証
miyabi obsidian validate
```

---

### 2️⃣ Agent Execution Logs → Obsidian

**目的**: Agent実行履歴を自動的にObsidianに記録

#### 実装

**既存の`.ai/logs/`との統合**

```rust
// crates/miyabi-logging-monitor/src/obsidian_logger.rs
pub struct ObsidianLogger {
    vault_path: PathBuf,
    log_dir: PathBuf, // .ai/logs/
}

impl ObsidianLogger {
    /// Agent実行完了時に自動呼び出し
    pub async fn log_agent_execution(&self, execution: AgentExecution) -> Result<()> {
        let doc = self.create_execution_document(execution)?;

        // 1. Daily noteに追記
        let daily_note_path = self.get_daily_note_path();
        self.append_to_daily_note(daily_note_path, &doc).await?;

        // 2. Agent別ログファイルに記録
        let agent_log_path = self.vault_path
            .join("agents")
            .join(format!("{}-logs.md", execution.agent_name));
        self.append_to_agent_log(agent_log_path, &doc).await?;

        // 3. Issue別ログファイルに記録
        if let Some(issue_number) = execution.issue_number {
            let issue_log_path = self.vault_path
                .join("issues")
                .join(format!("issue-{}.md", issue_number));
            self.append_to_issue_log(issue_log_path, &doc).await?;
        }

        Ok(())
    }

    fn create_execution_document(&self, exec: AgentExecution) -> Result<String> {
        let template = r#"
## {{ timestamp }} - {{ agent_name }}

**Issue**: {% if issue_number %}#{{ issue_number }}{% else %}N/A{% endif %}
**Task**: {{ task_description }}
**Duration**: {{ duration }}
**Status**: {% if success %}✅ Success{% else %}❌ Failed{% endif %}

### Execution Details

```
{{ execution_log }}
```

### Results

{% if success %}
{{ results }}
{% else %}
**Error**: {{ error_message }}
{% endif %}

### Related Links

- [[{{ agent_name }}]]
{% if issue_number %}- [[issue-{{ issue_number }}]]{% endif %}
- [[{{ date }}-daily-note]]

---
"#;

        self.template_engine.render(template, &exec)
    }
}
```

#### ドキュメント構造

**Daily Notes**: 自動生成
```
daily-notes/
├── 2025-11-18-daily-note.md
├── 2025-11-19-daily-note.md
...
```

**Agent Logs**: Agent別実行履歴
```
agents/
├── CodeGenAgent-logs.md
├── ReviewAgent-logs.md
...
```

**Issue Logs**: Issue別の全Activity
```
issues/
├── issue-270.md    # Issue #270の全ログ
├── issue-271.md
...
```

---

### 3️⃣ miyabi-knowledge ↔ Obsidian Integration

**目的**: Qdrant Vector DBとObsidian完全統合

#### アーキテクチャ

```
┌────────────────────────────────────────────────┐
│         Obsidian Vault (Markdown)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Entity   │  │ Agent    │  │ Daily    │     │
│  │ Docs     │  │ Logs     │  │ Notes    │     │
│  └──────────┘  └──────────┘  └──────────┘     │
└────────────┬───────────────────────────────────┘
             │
             │ (Embedding)
             ▼
┌────────────────────────────────────────────────┐
│      miyabi-knowledge (Qdrant Vector DB)       │
│  ┌──────────────────────────────────────┐     │
│  │   Collection: obsidian-docs          │     │
│  │   - 384/1536 dimensions              │     │
│  │   - Metadata: category, tags, date   │     │
│  └──────────────────────────────────────┘     │
└────────────┬───────────────────────────────────┘
             │
             │ (Search)
             ▼
┌────────────────────────────────────────────────┐
│          Agent Context Loading                 │
│  - Semantic search                             │
│  - Metadata filtering                          │
│  - Automatic context inclusion                 │
└────────────────────────────────────────────────┘
```

#### 実装

```rust
// crates/miyabi-knowledge/src/obsidian.rs
pub struct ObsidianKnowledgeIntegration {
    knowledge_manager: KnowledgeManager,
    vault_path: PathBuf,
}

impl ObsidianKnowledgeIntegration {
    /// Obsidian vaultの全ドキュメントをインデックス
    pub async fn index_vault(&self) -> Result<IndexReport> {
        let mut indexed = 0;

        // 1. Vault内の全Markdownファイルを取得
        let markdown_files = self.find_all_markdown_files().await?;

        for file_path in markdown_files {
            // 2. フロントマターをパース
            let frontmatter = self.parse_frontmatter(&file_path)?;

            // 3. 本文を取得
            let content = fs::read_to_string(&file_path).await?;

            // 4. Embedding生成
            let embedding = self.knowledge_manager
                .generate_embedding(&content)
                .await?;

            // 5. Qdrantに保存
            self.knowledge_manager.store_document(Document {
                id: file_path.to_string(),
                content,
                embedding,
                metadata: Metadata {
                    title: frontmatter.title,
                    category: frontmatter.category,
                    tags: frontmatter.tags,
                    created: frontmatter.created,
                    updated: frontmatter.updated,
                },
            }).await?;

            indexed += 1;
        }

        Ok(IndexReport { indexed })
    }

    /// セマンティック検索 + メタデータフィルタ
    pub async fn search(
        &self,
        query: &str,
        filters: SearchFilters,
    ) -> Result<Vec<SearchResult>> {
        self.knowledge_manager.search_with_filters(query, filters).await
    }
}
```

#### CLI統合

```bash
# Obsidian vault全体をインデックス
miyabi knowledge index-obsidian

# セマンティック検索
miyabi knowledge search "How to implement Agent coordination?"

# カテゴリフィルタ付き検索
miyabi knowledge search "workflows" --category entities

# タグフィルタ付き検索
miyabi knowledge search "deployment" --tags agent,deployment
```

---

### 4️⃣ Workflow Visualization (Mermaid)

**目的**: W1-W5ワークフローをMermaid図で可視化

#### 実装

**自動生成するMermaid図**

```markdown
---
title: "W1: Issue Creation & Triage"
created: 2025-11-18
category: "workflows"
tags: ["workflow", "W1", "triage"]
---

# W1: Issue Creation & Triage Workflow

## 📊 Workflow Diagram

\`\`\`mermaid
graph TD
    A[Issue Created] --> B{Valid Issue?}
    B -->|Yes| C[IssueAgent: Analyze]
    B -->|No| D[Close: Invalid]
    C --> E{Has Dependencies?}
    E -->|Yes| F[Create DAG]
    E -->|No| G[Assign Labels]
    F --> G
    G --> H{Agent Assignment}
    H -->|Simple| I[agent:codegen]
    H -->|Complex| J[agent:coordinator]
    H -->|Business| K[agent:business]
    I --> L[STATE: Ready]
    J --> L
    K --> L
    L --> M[Trigger W2]
\`\`\`

## ⏱️ Duration

**Expected**: ~5 minutes
**Range**: 2-10 minutes

## 🎯 Stages

### Stage 1: Issue Validation (30s)
- Check issue format
- Verify required fields
- Assign initial labels

### Stage 2: Dependency Analysis (1-2min)
- Scan for related issues
- Build dependency graph
- Create [[DAG]]

### Stage 3: Agent Assignment (1-2min)
- Determine task complexity
- Select appropriate agent
- Add `agent:*` label

### Stage 4: Prioritization (1min)
- Assess urgency
- Assign priority label
- Set milestone

## 🔄 Related Workflows

- Next: [[W2-Task-Decomposition-Planning]]
- Related: [[SubIssue-Hierarchy]]

## 📖 Related Entities

- [[E1-Issue]]
- [[E3-Agent]]
- [[E5-Label]]
- [[E11-DAG]]

## 🤖 Responsible Agents

- [[IssueAgent]] (Primary)
- [[CoordinatorAgent]] (Complex cases)
\`\`\`
```

**全5ワークフローに対して自動生成**

---

### 5️⃣ Entity-Relation Diagram (Mermaid)

**目的**: 14 Entities + 39 Relations を完全可視化

#### 実装

```rust
// crates/miyabi-obsidian-generator/src/mermaid.rs
pub struct MermaidGenerator;

impl MermaidGenerator {
    /// Generate complete ER diagram
    pub fn generate_er_diagram(
        entities: &[Entity],
        relations: &[Relation],
    ) -> String {
        let mut mermaid = String::from("```mermaid\nerDiagram\n");

        // Define entities
        for entity in entities {
            mermaid.push_str(&format!(
                "    {} {{\n",
                entity.id
            ));

            for attr in &entity.attributes {
                mermaid.push_str(&format!(
                    "        {} {}\n",
                    attr.type_name, attr.name
                ));
            }

            mermaid.push_str("    }\n");
        }

        // Define relations
        for relation in relations {
            let cardinality_symbol = match relation.cardinality.as_str() {
                "1:1" => "||--||",
                "1:N" => "||--o{",
                "N:1" => "}o--||",
                "N:N" => "}o--o{",
                _ => "--",
            };

            mermaid.push_str(&format!(
                "    {} {} {} : {}\n",
                relation.source,
                cardinality_symbol,
                relation.target,
                relation.name
            ));
        }

        mermaid.push_str("```\n");
        mermaid
    }
}
```

#### 生成例

```markdown
---
title: "Entity-Relation Model - Complete Diagram"
created: 2025-11-18
category: "architecture"
tags: ["miyabi", "entity-relation", "diagram"]
---

# Entity-Relation Model

## 🏗️ Complete ER Diagram

\`\`\`mermaid
erDiagram
    E1_Issue {
        int number
        string title
        string description
        string state
        datetime created_at
    }

    E2_Task {
        string id
        string description
        string status
        int priority
    }

    E3_Agent {
        string name
        string type
        string[] capabilities
    }

    E4_PR {
        int number
        string title
        string state
    }

    E1_Issue ||--o{ E2_Task : "decomposed-into"
    E1_Issue ||--|| E4_PR : "creates"
    E3_Agent ||--o{ E2_Task : "executes"
    E3_Agent ||--o{ E4_PR : "generates"
    ...
\`\`\`

## 📊 Entity Summary

Total: **14 Entities**, **39 Relations**

### Entities by Category

- **Core** (5): Issue, Task, Agent, PR, Label
- **Quality** (2): QualityReport, Escalation
- **Operations** (4): Deployment, LDDLog, DAG, Worktree
- **Integration** (2): Command, DiscordCommunity
- **Hierarchy** (1): SubIssue

## 🔗 Relation Summary

### By Cardinality

- **1:1**: 8 relations
- **1:N**: 22 relations
- **N:1**: 4 relations
- **N:N**: 5 relations

## 📖 Related Documents

{% for entity in entities %}
- [[{{ entity.id }}]]
{% endfor %}
\`\`\`
```

---

### 6️⃣ Daily Notes Auto-Generation

**目的**: Agent活動を自動的に日報として記録

#### 実装

```rust
// crates/miyabi-obsidian-generator/src/daily_notes.rs
pub struct DailyNoteGenerator {
    vault_path: PathBuf,
}

impl DailyNoteGenerator {
    /// Generate or update today's daily note
    pub async fn update_daily_note(&self) -> Result<()> {
        let today = Local::now().format("%Y-%m-%d").to_string();
        let file_path = self.vault_path
            .join("daily-notes")
            .join(format!("{}-daily-note.md", today));

        // 既存ファイルがあれば読み込み、なければ新規作成
        let existing_content = if file_path.exists() {
            fs::read_to_string(&file_path).await?
        } else {
            self.create_daily_note_template(&today)
        };

        // 今日のAgent実行ログを集計
        let agent_logs = self.collect_todays_logs().await?;

        // セクション追加
        let updated_content = self.append_agent_activities(
            existing_content,
            agent_logs,
        );

        fs::write(file_path, updated_content).await?;
        Ok(())
    }

    fn create_daily_note_template(&self, date: &str) -> String {
        format!(r#"---
title: "Daily Note - {date}"
created: {date}
updated: {date}
author: "Miyabi Auto-Generator"
category: "daily-notes"
tags: ["daily-note", "{date}"]
status: "published"
---

# 📅 {date}

## 🎯 Daily Summary

**Total Agent Executions**: 0
**Issues Processed**: 0
**PRs Created**: 0
**Deployments**: 0

## 🤖 Agent Activities

### Coding Agents

<!-- Auto-generated content will be appended here -->

### Business Agents

<!-- Auto-generated content will be appended here -->

## 📊 Statistics

<!-- Auto-generated statistics -->

## 🔗 Related Issues

<!-- Auto-generated issue links -->

---

Generated by Miyabi Auto-Generator
"#, date = date)
    }
}
```

#### Daily Note Example

```markdown
---
title: "Daily Note - 2025-11-18"
created: 2025-11-18
updated: 2025-11-18 18:30:00
category: "daily-notes"
tags: ["daily-note", "2025-11-18"]
---

# 📅 2025-11-18

## 🎯 Daily Summary

**Total Agent Executions**: 23
**Issues Processed**: 5
**PRs Created**: 3
**Deployments**: 1

## 🤖 Agent Activities

### Coding Agents

#### 09:15 - CodeGenAgent
- **Issue**: [[issue-270]]
- **Task**: Implement OAuth callback handler
- **Duration**: 45min
- **Status**: ✅ Success

#### 10:30 - ReviewAgent
- **PR**: #1008
- **Task**: Code review for OAuth implementation
- **Duration**: 20min
- **Status**: ✅ Approved

#### 14:00 - DeploymentAgent
- **Target**: Staging
- **Task**: Deploy OAuth feature
- **Duration**: 15min
- **Status**: ✅ Success

### Business Agents

#### 11:00 - MarketingAgent
- **Task**: Generate blog post outline
- **Duration**: 30min
- **Status**: ✅ Success

## 📊 Statistics

| Metric | Count |
|--------|-------|
| Issues Created | 2 |
| Issues Closed | 3 |
| PRs Merged | 2 |
| Code Review Comments | 15 |
| Deployments | 1 |

## 🔗 Related Issues

- [[issue-270]] - OAuth Implementation
- [[issue-271]] - Documentation Update
- [[issue-272]] - Performance Optimization

## 📝 Notes

- OAuth feature完了、Staging環境で動作確認済み
- 次: Production デプロイ予定（2025-11-19）
```

---

### 7️⃣ Miyabi Obsidian Plugin Development

**目的**: Obsidian専用プラグインでMiyabi機能を統合

#### プラグイン機能

**Phase 1: Core Features**

1. **Agent Status Panel**
   - リアルタイムAgent状態表示
   - tmux Pane接続状態
   - 実行中タスク一覧

2. **Issue Browser**
   - GitHub Issues一覧
   - フィルタリング・ソート
   - Obsidian内でIssue作成

3. **Workflow Tracker**
   - W1-W5進捗表示
   - ボトルネック検出
   - 予測完了時刻

4. **Knowledge Search**
   - セマンティック検索UI
   - Qdrant統合
   - 検索結果プレビュー

**Phase 2: Advanced Features**

5. **Live Agent Monitor**
   - Agent実行ログストリーミング
   - エラー通知
   - パフォーマンスメトリクス

6. **Git Worktree Manager**
   - Worktree一覧・作成・削除
   - ブランチ切り替え
   - マージ操作

7. **Voice Narration Player**
   - VOICEVOX統合
   - 音声再生コントロール
   - 字幕表示

8. **3D Molecular Visualization**
   - miyabi-viz統合
   - Entity-Relation 3D表示
   - インタラクティブ操作

#### 実装

**TypeScript Plugin Structure**

```typescript
// plugins/miyabi-obsidian/src/main.ts
import { Plugin, WorkspaceLeaf } from 'obsidian';
import { MiyabiAPI } from './api';
import { AgentStatusView } from './views/agent-status';
import { IssueBrowserView } from './views/issue-browser';
import { WorkflowTrackerView } from './views/workflow-tracker';

export default class MiyabiPlugin extends Plugin {
    api: MiyabiAPI;

    async onload() {
        console.log('Loading Miyabi Plugin');

        // 1. Initialize Miyabi API connection
        this.api = new MiyabiAPI({
            mcpServerUrl: 'http://localhost:3000',
            githubToken: this.settings.githubToken,
        });

        // 2. Register custom views
        this.registerView(
            'miyabi-agent-status',
            (leaf) => new AgentStatusView(leaf, this.api)
        );

        this.registerView(
            'miyabi-issue-browser',
            (leaf) => new IssueBrowserView(leaf, this.api)
        );

        this.registerView(
            'miyabi-workflow-tracker',
            (leaf) => new WorkflowTrackerView(leaf, this.api)
        );

        // 3. Add ribbon icons
        this.addRibbonIcon('bot', 'Miyabi Agent Status', () => {
            this.activateView('miyabi-agent-status');
        });

        // 4. Add commands
        this.addCommand({
            id: 'miyabi-sync-issues',
            name: 'Sync GitHub Issues',
            callback: async () => {
                await this.api.syncIssues();
                new Notice('Issues synced successfully!');
            },
        });

        this.addCommand({
            id: 'miyabi-generate-docs',
            name: 'Generate Documentation from miyabi_def',
            callback: async () => {
                await this.api.generateDocs();
                new Notice('Documentation generated!');
            },
        });
    }
}

// plugins/miyabi-obsidian/src/views/agent-status.ts
export class AgentStatusView extends ItemView {
    api: MiyabiAPI;
    statusInterval: number;

    constructor(leaf: WorkspaceLeaf, api: MiyabiAPI) {
        super(leaf);
        this.api = api;
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl('h2', { text: 'Miyabi Agent Status' });

        // Agent status container
        const statusDiv = container.createDiv('miyabi-agent-status');

        // Start real-time updates
        this.statusInterval = window.setInterval(async () => {
            const status = await this.api.getAgentStatus();
            this.renderAgentStatus(statusDiv, status);
        }, 2000); // Update every 2 seconds
    }

    renderAgentStatus(container: HTMLElement, status: AgentStatus[]) {
        container.empty();

        for (const agent of status) {
            const agentDiv = container.createDiv('agent-item');

            // Agent name with status indicator
            const nameEl = agentDiv.createEl('div', {
                cls: `agent-name ${agent.status}`,
                text: agent.name,
            });

            // Current task
            if (agent.currentTask) {
                agentDiv.createEl('div', {
                    cls: 'agent-task',
                    text: `Task: ${agent.currentTask.description}`,
                });

                // Progress bar
                const progressDiv = agentDiv.createDiv('progress-bar');
                const progressFill = progressDiv.createDiv('progress-fill');
                progressFill.style.width = `${agent.currentTask.progress}%`;
            } else {
                agentDiv.createEl('div', {
                    cls: 'agent-idle',
                    text: 'Idle',
                });
            }
        }
    }

    async onClose() {
        // Clean up interval
        if (this.statusInterval) {
            window.clearInterval(this.statusInterval);
        }
    }
}
```

#### Miyabi API Client

```typescript
// plugins/miyabi-obsidian/src/api.ts
export class MiyabiAPI {
    private mcpServerUrl: string;
    private githubToken: string;

    constructor(config: MiyabiAPIConfig) {
        this.mcpServerUrl = config.mcpServerUrl;
        this.githubToken = config.githubToken;
    }

    /// Get current status of all agents
    async getAgentStatus(): Promise<AgentStatus[]> {
        const response = await fetch(`${this.mcpServerUrl}/agents/status`);
        return await response.json();
    }

    /// Sync GitHub Issues to Obsidian
    async syncIssues(): Promise<SyncResult> {
        const response = await fetch(`${this.mcpServerUrl}/sync/issues`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.githubToken}`,
            },
        });
        return await response.json();
    }

    /// Generate documentation from miyabi_def
    async generateDocs(): Promise<GenerationResult> {
        const response = await fetch(`${this.mcpServerUrl}/obsidian/generate`, {
            method: 'POST',
        });
        return await response.json();
    }

    /// Search knowledge base
    async searchKnowledge(query: string): Promise<SearchResult[]> {
        const response = await fetch(`${this.mcpServerUrl}/knowledge/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });
        return await response.json();
    }
}
```

---

### 8️⃣ GitHub Issues ↔ Obsidian Bidirectional Sync

**目的**: GitHub IssuesとObsidian完全双方向同期

#### アーキテクチャ

```
┌────────────────────────────────────────────────┐
│            GitHub Issues (Source)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Issue    │  │ Comments │  │ Events   │     │
│  │ #270     │  │          │  │          │     │
│  └──────────┘  └──────────┘  └──────────┘     │
└────────────┬───────────────────────────────────┘
             │
             │ (Webhooks / API Polling)
             ▼
┌────────────────────────────────────────────────┐
│        Miyabi Sync Service (Rust)              │
│  ┌──────────────────────────────────────┐     │
│  │   - GitHub Webhook Handler           │     │
│  │   - Conflict Resolution               │     │
│  │   - Change Detection                  │     │
│  └──────────────────────────────────────┘     │
└────────────┬───────────────────────────────────┘
             │
             │ (File I/O)
             ▼
┌────────────────────────────────────────────────┐
│         Obsidian Vault (Markdown)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ issue-   │  │ issue-   │  │ issue-   │     │
│  │ 270.md   │  │ 271.md   │  │ 272.md   │     │
│  └──────────┘  └──────────┘  └──────────┘     │
└────────────────────────────────────────────────┘
```

#### 実装

```rust
// crates/miyabi-github-sync/src/lib.rs
pub struct GitHubObsidianSync {
    github_client: GitHubClient,
    vault_path: PathBuf,
    sync_state: SyncState,
}

impl GitHubObsidianSync {
    /// Full bidirectional sync
    pub async fn sync(&mut self) -> Result<SyncReport> {
        let mut report = SyncReport::default();

        // 1. Fetch all GitHub Issues
        let github_issues = self.github_client.list_issues().await?;

        // 2. Scan all Obsidian issue documents
        let obsidian_issues = self.scan_obsidian_issues().await?;

        // 3. Three-way merge
        for issue_number in self.all_issue_numbers(&github_issues, &obsidian_issues) {
            let sync_result = self.sync_issue(issue_number).await?;
            report.add(sync_result);
        }

        Ok(report)
    }

    async fn sync_issue(&self, issue_number: u64) -> Result<IssueSyncResult> {
        let github_issue = self.github_client.get_issue(issue_number).await?;
        let obsidian_doc_path = self.vault_path
            .join("issues")
            .join(format!("issue-{}.md", issue_number));

        let obsidian_issue = if obsidian_doc_path.exists() {
            Some(self.parse_obsidian_issue(&obsidian_doc_path).await?)
        } else {
            None
        };

        match (github_issue, obsidian_issue) {
            // GitHub only: Create Obsidian doc
            (Some(gh), None) => {
                self.create_obsidian_doc(&gh).await?;
                Ok(IssueSyncResult::Created)
            }

            // Obsidian only: Create GitHub issue
            (None, Some(obs)) => {
                self.create_github_issue(&obs).await?;
                Ok(IssueSyncResult::Created)
            }

            // Both exist: Merge
            (Some(gh), Some(obs)) => {
                self.merge_issue_changes(gh, obs).await
            }

            // Neither exists: Skip
            (None, None) => Ok(IssueSyncResult::Skipped),
        }
    }

    async fn merge_issue_changes(
        &self,
        github: GitHubIssue,
        obsidian: ObsidianIssue,
    ) -> Result<IssueSyncResult> {
        // Compare timestamps
        if github.updated_at > obsidian.updated_at {
            // GitHub is newer: Update Obsidian
            self.update_obsidian_from_github(&github).await?;
            Ok(IssueSyncResult::UpdatedObsidian)
        } else if obsidian.updated_at > github.updated_at {
            // Obsidian is newer: Update GitHub
            self.update_github_from_obsidian(&obsidian).await?;
            Ok(IssueSyncResult::UpdatedGitHub)
        } else {
            // Same: No change
            Ok(IssueSyncResult::NoChange)
        }
    }

    async fn create_obsidian_doc(&self, issue: &GitHubIssue) -> Result<()> {
        let doc = format!(r#"---
title: "Issue #{number}: {title}"
created: {created_at}
updated: {updated_at}
author: "{author}"
category: "issues"
tags: [{tags}]
status: "{state}"
github_url: "{url}"
---

# Issue #{number}: {title}

**State**: {state}
**Assignees**: {assignees}
**Labels**: {labels}
**Milestone**: {milestone}

## Description

{body}

## Comments

{comments}

## Events

{events}

## Related Issues

{related_issues}

---

Synced from GitHub: {sync_time}
"#,
            number = issue.number,
            title = issue.title,
            created_at = issue.created_at,
            updated_at = issue.updated_at,
            author = issue.user.login,
            tags = issue.labels.iter().map(|l| format!("\"{}\"", l.name)).collect::<Vec<_>>().join(", "),
            state = issue.state,
            url = issue.html_url,
            assignees = issue.assignees.iter().map(|a| a.login.clone()).collect::<Vec<_>>().join(", "),
            labels = issue.labels.iter().map(|l| l.name.clone()).collect::<Vec<_>>().join(", "),
            milestone = issue.milestone.as_ref().map(|m| m.title.clone()).unwrap_or_default(),
            body = issue.body.as_ref().unwrap_or(&String::new()),
            comments = self.format_comments(&issue.comments).await?,
            events = self.format_events(&issue.events).await?,
            related_issues = self.find_related_issues(issue).await?,
            sync_time = Local::now(),
        );

        let file_path = self.vault_path
            .join("issues")
            .join(format!("issue-{}.md", issue.number));

        fs::write(file_path, doc).await?;
        Ok(())
    }
}
```

#### CLI統合

```bash
# 完全同期（双方向）
miyabi sync obsidian --bidirectional

# GitHub → Obsidian 片方向
miyabi sync obsidian --from-github

# Obsidian → GitHub 片方向
miyabi sync obsidian --to-github

# 特定Issueのみ同期
miyabi sync obsidian --issue 270

# Watch mode (自動同期)
miyabi sync obsidian --watch
```

---

### 9️⃣ tmux Orchestra Visualization

**目的**: tmux Orchestraの状態をObsidianで可視化

#### 実装

**リアルタイムOrchestra Dashboard**

```markdown
---
title: "tmux Orchestra - Live Dashboard"
created: 2025-11-18
updated: 2025-11-18 (Auto-refresh every 5s)
category: "monitoring"
tags: ["tmux", "orchestra", "monitoring"]
---

# 🎭 tmux Orchestra - Live Status

**Last Updated**: 2025-11-18 18:45:32
**Session**: miyabi-orchestra
**Active Agents**: 5/6

## 🎵 Ensemble Status

\`\`\`mermaid
gantt
    title Agent Execution Timeline
    dateFormat HH:mm

    section Coding
    CodeGenAgent     :active, 14:00, 45m
    ReviewAgent      :done, 14:30, 20m
    PRAgent          :15:00, 10m

    section Business
    MarketingAgent   :done, 11:00, 30m
    SalesAgent       :crit, 16:00, 60m
\`\`\`

## 🤖 Agent Panes

### %2 - CodeGenAgent (カエデ)
- **Status**: 🟢 Active
- **Current Task**: Issue #270 - OAuth Implementation
- **Progress**: 78% (35/45 min)
- **CPU**: 45%
- **Memory**: 1.2GB

### %5 - ReviewAgent (サクラ)
- **Status**: ⚪ Idle
- **Last Task**: PR #1008 Review (Completed 14:50)
- **CPU**: 2%
- **Memory**: 0.3GB

### %3 - PRAgent (ツバキ)
- **Status**: 🟡 Pending
- **Next Task**: Create PR for Issue #270
- **ETA**: 15:00

### %4 - DeploymentAgent (ボタン)
- **Status**: ⚪ Idle
- **Last Deployment**: Staging @ 14:15

## 📊 Orchestra Metrics

| Metric | Value | Trend |
|--------|-------|-------|
| **Total Executions** | 23 | ↗️ +5 |
| **Success Rate** | 95.7% | ↗️ |
| **Avg Duration** | 28min | ↘️ -3min |
| **Active Worktrees** | 3 | → |
| **Queue Length** | 2 | ↘️ -1 |

## 🔔 Recent Activities

### 18:45 - CodeGenAgent
✅ Completed OAuth token validation

### 18:43 - ReviewAgent
💬 Added review comment to PR #1008

### 18:40 - DeploymentAgent
✅ Health check passed on Staging

## ⚠️ Alerts

- 🟡 **Queue Building**: 2 issues waiting for assignment
- 🔵 **Info**: Staging deployment available for testing

## 📈 Performance Graph

\`\`\`chart
type: line
data:
  labels: [14:00, 15:00, 16:00, 17:00, 18:00]
  datasets:
    - label: Active Agents
      data: [2, 3, 4, 3, 2]
    - label: Completed Tasks
      data: [5, 8, 12, 18, 23]
\`\`\`

---

🔄 Auto-refreshed every 5 seconds by Miyabi Orchestra Monitor
```

---

### 🔟 VOICEVOX Voice Narration Integration

**目的**: Agent活動を音声ナレーションで通知

#### 実装

**音声ガイドの自動生成とObsidian統合**

```rust
// crates/miyabi-voice-guide/src/obsidian_narration.rs
pub struct ObsidianNarrationIntegration {
    voicevox_client: VoicevoxClient,
    vault_path: PathBuf,
}

impl ObsidianNarrationIntegration {
    /// Generate narration from daily note
    pub async fn generate_daily_narration(&self, date: &str) -> Result<PathBuf> {
        // 1. Load daily note
        let daily_note_path = self.vault_path
            .join("daily-notes")
            .join(format!("{}-daily-note.md", date));
        let content = fs::read_to_string(&daily_note_path).await?;

        // 2. Extract key activities
        let activities = self.extract_activities(&content)?;

        // 3. Generate narration script
        let script = self.create_narration_script(activities);

        // 4. Generate audio using VOICEVOX
        let audio_path = self.voicevox_client
            .generate_audio(&script, VoiceCharacter::Zundamon)
            .await?;

        // 5. Save narration metadata to Obsidian
        let narration_doc = format!(r#"---
title: "Voice Narration - {date}"
created: {date}
category: "narration"
tags: ["voicevox", "narration", "daily-summary"]
audio_file: "{audio_path}"
---

# 🎤 Daily Narration - {date}

## 📝 Script

{script}

## 🎵 Audio

[Download Audio]({audio_path})

\`\`\`embed
audio: {audio_path}
\`\`\`

## 📊 Statistics

- **Duration**: {duration}
- **Character**: ずんだもん
- **Activities Covered**: {activity_count}

## 🔗 Related

- [[{date}-daily-note]]
"#,
            date = date,
            audio_path = audio_path.display(),
            script = script,
            duration = "2min 35s",
            activity_count = activities.len(),
        );

        let narration_path = self.vault_path
            .join("narration")
            .join(format!("{}-narration.md", date));

        fs::write(&narration_path, narration_doc).await?;

        Ok(audio_path)
    }
}
```

---

## 📅 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Duration**: 2 weeks
**Priority**: P0

#### Week 1
- ✅ Day 1-2: `miyabi-obsidian-generator` Crate作成
- ✅ Day 3-4: miyabi_def → Obsidian自動生成実装
- ✅ Day 5: CLI統合 (`miyabi obsidian generate`)

#### Week 2
- ⬜ Day 6-7: Agent実行ログ→Obsidian統合
- ⬜ Day 8-9: Daily Notes自動生成
- ⬜ Day 10: Phase 1テスト・検証

**Deliverables**:
- 136 auto-generated documents
- Daily notes システム
- CLI commands

---

### Phase 2: Knowledge Integration (Week 3-4)

**Duration**: 2 weeks
**Priority**: P1

#### Week 3
- ⬜ Day 11-12: miyabi-knowledge ↔ Obsidian統合
- ⬜ Day 13-14: セマンティック検索UI実装

#### Week 4
- ⬜ Day 15-16: Mermaid図自動生成 (ER, Workflow)
- ⬜ Day 17-18: GitHub Issues双方向同期
- ⬜ Day 19-20: Phase 2テスト・検証

**Deliverables**:
- Vector DB統合
- 自動図生成
- Issue同期システム

---

### Phase 3: Plugin Development (Week 5-8)

**Duration**: 4 weeks
**Priority**: P2

#### Week 5-6: Core Plugin
- ⬜ Day 21-25: Obsidian Plugin基本構造
- ⬜ Day 26-30: Agent Status Panel実装

#### Week 7-8: Advanced Features
- ⬜ Day 31-35: Issue Browser、Workflow Tracker
- ⬜ Day 36-40: Knowledge Search UI、tmux Monitor

**Deliverables**:
- Miyabi Obsidian Plugin v1.0.0
- 4つの主要ビュー

---

### Phase 4: Advanced Integration (Week 9-12)

**Duration**: 4 weeks
**Priority**: P3

#### Week 9-10: Visualization
- ⬜ Day 41-45: tmux Orchestra可視化
- ⬜ Day 46-50: 3D Molecular Visualization統合

#### Week 11-12: Voice & Polish
- ⬜ Day 51-55: VOICEVOX音声ナレーション統合
- ⬜ Day 56-60: 全体テスト・ドキュメント・リリース

**Deliverables**:
- Orchestra Dashboard
- Voice Narration システム
- Complete Integration v1.0.0

---

## 🛠️ Technical Specifications

### New Crates

#### 1. miyabi-obsidian-generator
```toml
[package]
name = "miyabi-obsidian-generator"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_yaml = "0.9"
tera = "1.19"  # Jinja2-like template engine
tokio = { version = "1.35", features = ["full"] }
chrono = "0.4"
anyhow = "1.0"
```

#### 2. miyabi-github-sync
```toml
[package]
name = "miyabi-github-sync"
version = "0.1.0"
edition = "2021"

[dependencies]
octocrab = "0.32"  # GitHub API client
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
```

### Obsidian Plugin

#### Package Structure
```
plugins/miyabi-obsidian/
├── manifest.json
├── package.json
├── tsconfig.json
├── src/
│   ├── main.ts
│   ├── api.ts
│   ├── settings.ts
│   ├── views/
│   │   ├── agent-status.ts
│   │   ├── issue-browser.ts
│   │   ├── workflow-tracker.ts
│   │   └── knowledge-search.ts
│   └── styles.css
└── README.md
```

---

## 💡 Use Cases

### Use Case 1: Agent Developer

**Scenario**: 新しいAgentを実装する開発者

**Workflow**:
1. Obsidianで`[[E3-Agent]]`を開き、Agent仕様を確認
2. 関連する`[[R9-Agent-executes-Task]]`を参照
3. 既存Agentの実装例を検索: "How to implement Agent execute?"
4. 実装後、`miyabi obsidian generate --agents`で自動ドキュメント更新

**Benefits**:
- 仕様書とコードが常に同期
- 実装例をセマンティック検索で即座に発見
- ドキュメント作成不要

---

### Use Case 2: Project Manager

**Scenario**: プロジェクト進捗を把握したいPM

**Workflow**:
1. Obsidianを開き、今日のDaily Noteを確認
2. tmux Orchestra Dashboardで現在のAgent状態を確認
3. Workflow Trackerで各ワークフローの進捗を確認
4. ボトルネックを発見し、リソース再配分を決定

**Benefits**:
- リアルタイム進捗可視化
- データ駆動の意思決定
- 手動レポート作成不要

---

### Use Case 3: Business Analyst

**Scenario**: 市場調査結果を活用したいアナリスト

**Workflow**:
1. ObsidianのKnowledge Searchで"market research results"を検索
2. MarketingAgentの過去レポートを確認
3. 関連するIssueやPRをObsidian内でブラウズ
4. 新しいInsightをObsidianに記録し、自動的にVector DBにインデックス

**Benefits**:
- 全ての知識が一元管理
- セマンティック検索で関連情報を即座に発見
- GitHub Issuesとシームレスに連携

---

## 📊 Benefits & Effects

### Quantitative Benefits

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Documentation Files** | 18 | 200+ | **11x** |
| **Doc Creation Time** | 2h/doc | 0min | **100% reduction** |
| **Search Accuracy** | 60% (grep) | 90% (semantic) | **+30%** |
| **Context Loading Time** | 5min | 10s | **96% reduction** |
| **Knowledge Retrieval** | Manual | Automatic | **100% automation** |

### Qualitative Benefits

1. **ゼロ・ドキュメンテーション負荷**
   - 全ドキュメント自動生成
   - 常に最新状態を維持
   - 手動更新不要

2. **完全な可視化**
   - Entity-Relation全体像
   - Workflow進捗
   - Agent活動

3. **知識の民主化**
   - 全員が同じ情報にアクセス
   - セマンティック検索で専門知識不要
   - オンボーディング時間短縮

4. **開発者体験向上**
   - コンテキスト切り替え不要
   - Obsidian内で全て完結
   - プラグインで機能拡張可能

---

## 🔧 Maintenance

### Auto-Update Schedule

```yaml
# .github/workflows/obsidian-sync.yml
name: Obsidian Auto-Sync

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  push:
    paths:
      - 'miyabi_def/variables/**'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate Obsidian Docs
        run: miyabi obsidian generate --all

      - name: Sync GitHub Issues
        run: miyabi sync obsidian --bidirectional

      - name: Commit & Push
        run: |
          git config user.name "Miyabi Bot"
          git config user.email "bot@miyabi.dev"
          git add docs/obsidian-vault/
          git commit -m "docs(obsidian): auto-sync [skip ci]"
          git push
```

---

## 📚 Related Documents

- [[miyabi-definition]]
- [[agents]]
- [[Entity-Relation-Model]]
- [[Workflows]]
- [[tmux-Orchestra]]
- [[miyabi-knowledge]]

---

## 🎯 Success Criteria

### Phase 1 Success Metrics
- ✅ 136+ documents auto-generated
- ✅ Daily notes working
- ✅ CLI commands functional

### Phase 2 Success Metrics
- ✅ Vector DB contains all Obsidian docs
- ✅ Semantic search accuracy >85%
- ✅ GitHub sync <5min latency

### Phase 3 Success Metrics
- ✅ Plugin published to Obsidian Community
- ✅ 4+ views implemented
- ✅ Real-time updates working

### Phase 4 Success Metrics
- ✅ Full integration complete
- ✅ Voice narration working
- ✅ 3D visualization functional

---

## 🚀 Getting Started

### Quick Start

```bash
# 1. Install dependencies
cd crates/miyabi-obsidian-generator
cargo build --release

# 2. Generate initial documentation
miyabi obsidian generate --all

# 3. Index to knowledge base
miyabi knowledge index-obsidian

# 4. Start sync service
miyabi sync obsidian --watch

# 5. Open Obsidian vault
open docs/obsidian-vault/
```

### Plugin Installation

```bash
# 1. Build plugin
cd plugins/miyabi-obsidian
npm install
npm run build

# 2. Copy to Obsidian plugins directory
cp -r . ~/.obsidian/plugins/miyabi

# 3. Enable in Obsidian settings
# Settings → Community Plugins → Miyabi → Enable
```

---

## 📝 Conclusion

この完全統合計画により、Miyabiプロジェクトの**全ての知識・活動・進捗**がObsidianで一元管理され、**自動化・可視化・検索可能**になります。

**Total Investment**: 12週間
**Expected ROI**: 文書化時間 100% 削減、知識検索精度 30% 向上

---

🌸 **Miyabi × Obsidian - Beauty in Knowledge Integration** 🌸

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-18
**Author**: Claude Code
**Status**: Published

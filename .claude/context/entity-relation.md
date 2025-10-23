# Entity-Relation Model

**Priority**: ⭐⭐⭐

## 🔗 12種類のコアEntity

すべてのプロジェクトコンポーネントはEntityで統合的に管理されています。

| ID | Entity | Rust型定義 | 説明 |
|----|--------|-----------|------|
| E1 | **Issue** | `crates/miyabi-types/src/issue.rs` | GitHub Issue |
| E2 | **Task** | `crates/miyabi-types/src/task.rs` | 分解されたタスク |
| E3 | **Agent** | `crates/miyabi-types/src/agent.rs` | 自律実行Agent |
| E4 | **PR** | `crates/miyabi-github/src/pr.rs` | Pull Request |
| E5 | **Label** | `docs/LABEL_SYSTEM_GUIDE.md` | GitHub Label（53個） |
| E6 | **QualityReport** | `crates/miyabi-types/src/quality.rs` | 品質レポート |
| E7 | **Command** | `.claude/commands/*.md` | Claude Codeコマンド |
| E8 | **Escalation** | `crates/miyabi-types/src/error.rs` | エスカレーション |
| E9 | **Deployment** | `crates/miyabi-agents/src/deployment.rs` | デプロイ情報 |
| E10 | **LDDLog** | `crates/miyabi-types/src/workflow.rs` | LDDログ |
| E11 | **DAG** | `crates/miyabi-types/src/workflow.rs` | タスク依存グラフ |
| E12 | **Worktree** | `crates/miyabi-worktree/src/lib.rs` | Git Worktree |

## 📊 27の関係性

### Issue処理フロー
- **R1**: Issue --analyzed-by-→ Agent (IssueAgent)
- **R2**: Issue --decomposed-into-→ Task[] (CoordinatorAgent)
- **R3**: Issue --tagged-with-→ Label[]
- **R4**: Issue --creates-→ PR

### Agent実行
- **R9**: Agent --executes-→ Task
- **R10**: Agent --generates-→ PR
- **R11**: Agent --creates-→ QualityReport
- **R12**: Agent --triggers-→ Escalation
- **R13**: Agent --performs-→ Deployment

### Task管理
- **R5**: Task --assigned-to-→ Agent
- **R6**: Task --depends-on-→ Task (DAG)
- **R7**: Task --executes-in-→ Worktree

**完全な関係性リスト**: `docs/ENTITY_RELATION_MODEL.md`

## 🔤 N1/N2/N3記法 - LLM最適化ワークフロー表記

**階層的なワークフロー表記システム**

### 記法構造
```
N1:EntityName $H→ N2:ProcessingEntity $L→ N3:OutputEntity
```

**階層定義**:
- **N1 (Primary)**: ルートEntity（Issue, UserRequest等）
- **N2 (Processing)**: 処理Entity（Agent, Task等）
- **N3 (Output)**: 出力Entity（PR, QualityReport等）

**依存度マーカー**:
- **$H (High)**: 必須依存 - クリティカルパス
- **$L (Low)**: オプション依存 - 拡張機能

### 使用例

**Issue処理ワークフロー**:
```
N1:Issue $H→ N2:IssueAgent $H→ N3:LabeledIssue
N1:Issue $H→ N2:CoordinatorAgent $H→ N3:TaskDecomposition
```

**コード生成ワークフロー**:
```
N1:Task $H→ N2:CodeGenAgent $H→ N3:GeneratedCode
N2:CodeGenAgent $H→ N2:ReviewAgent $H→ N3:QualityReport
```

### Rust API
```rust
use miyabi_types::workflow::{EntityRelationMap, EntityLevel, RelationStrength};

let mut map = EntityRelationMap::new();
let issue = map.add_entity("Issue", EntityLevel::N1Primary);
let coordinator = map.add_entity("CoordinatorAgent", EntityLevel::N2Processing);
map.add_relation(issue, coordinator, RelationStrength::High)?;
```

**Rust型定義**: `crates/miyabi-types/src/workflow.rs`

## 📁 88ファイルの統合テンプレート

すべてのテンプレートはEntity-Relationモデルに基づいて管理されています。

**カテゴリ**:
- **Coding Agent仕様** (7ファイル): `.claude/agents/specs/coding/*.md`
- **Business Agent仕様** (14ファイル): `.claude/agents/specs/business/*.md`
- **Coding Agent実行プロンプト** (6ファイル): `.claude/agents/prompts/coding/*.md`
- **Claude Codeコマンド** (9ファイル): `.claude/commands/*.md`
- **Rust型定義** (7ファイル): `crates/miyabi-types/src/*.rs`
- **ドキュメント** (20+ファイル): `docs/*.md`

**完全なインデックス**: `docs/TEMPLATE_MASTER_INDEX.md`

## 🔗 Related Modules

- **Labels**: [labels.md](./labels.md) - 53 Label体系
- **Agents**: [agents.md](./agents.md) - 21 Agents概要
- **Architecture**: [architecture.md](./architecture.md) - Rust型定義パス

## 📖 Detailed Documentation

- **Entity-Relation Model**: `docs/ENTITY_RELATION_MODEL.md` (完全仕様)
- **Template Master Index**: `docs/TEMPLATE_MASTER_INDEX.md` (88ファイル)
- **Agent SDK Integration**: `docs/AGENT_SDK_LABEL_INTEGRATION.md`

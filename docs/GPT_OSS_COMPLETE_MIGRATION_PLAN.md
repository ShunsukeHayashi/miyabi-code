# Claude Code → GPT-OSS-20B 完全移行計画

## 📋 概要

Miyabiプロジェクトの全Agentシステムを、Claude Code依存から完全にGPT-OSS-20Bベースの自立実行システムに移行する。

**目標**: 外部APIに依存せず、Mac mini LLMサーバーのみで完全に動作する自律型Agent実装

---

## 🎯 現在の状況分析

### 現在のアーキテクチャ（Claude Code依存）

```
┌─────────────────────────────────────────────────────────┐
│ CoordinatorAgent (Rust)                                  │
│ - Issue分析・Task分解                                      │
│ - DAG構築・依存関係解決                                     │
│ - Worktree作成・管理                                       │
└─────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Worktree #1 │ │ Worktree #2 │ │ Worktree #3 │
│ Issue #270  │ │ Issue #271  │ │ Issue #272  │
│             │ │             │ │             │
│ Claude Code │ │ Claude Code │ │ Claude Code │ ← ❌ 外部API依存
│ CLI実行     │ │ CLI実行     │ │ CLI実行     │
└─────────────┘ └─────────────┘ └─────────────┘
```

### 目標アーキテクチャ（GPT-OSS-20B完全自立）

```
┌─────────────────────────────────────────────────────────┐
│ CoordinatorAgent (Rust)                                  │
│ - Issue分析・Task分解                                      │
│ - DAG構築・依存関係解決                                     │
│ - Worktree作成・管理                                       │
└─────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Worktree #1 │ │ Worktree #2 │ │ Worktree #3 │
│ Issue #270  │ │ Issue #271  │ │ Issue #272  │
│             │ │             │ │             │
│ GPT-OSS-20B │ │ GPT-OSS-20B │ │ GPT-OSS-20B │ ← ✅ Mac mini LLM
│ 直接実行    │ │ 直接実行    │ │ 直接実行    │
└─────────────┘ └─────────────┘ └─────────────┘
        │           │           │
        │           │           │
        ▼           ▼           ▼
┌─────────────────────────────────────────────────────────┐
│ Mac mini LLM Server (192.168.3.27:11434)                │
│ - Ollama + gpt-oss:20b (16GB)                           │
│ - OpenAI-compatible API                                  │
│ - 並列実行対応（複数Worktree同時処理）                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 影響範囲調査結果

### 変更が必要な7つのAgent

#### 1. **CoordinatorAgent** (`crates/miyabi-agents/src/coordinator.rs`)
- **現在**: Task分解のみ実装、実行はWorktree + Claude Code CLI委譲
- **変更内容**: GPT-OSS-20BのFunction Calling使用でTask分解
- **優先度**: P1 (他のAgentを呼び出すため最優先)

#### 2. **CodeGenAgent** (`crates/miyabi-agents/src/codegen.rs`)
- **現在**: `execute_claude_code()` で未実装のCLI呼び出し
- **変更内容**:
  - LLM直接呼び出しでコード生成
  - `generate_code_with_llm()` メソッド実装
  - プロンプトテンプレート作成（Rustコード生成特化）
  - git操作（commit）の自動化
- **優先度**: P0 (最も使用頻度が高い)

#### 3. **ReviewAgent** (`crates/miyabi-agents/src/review.rs`)
- **現在**: cargo clippy + audit実行のみ、LLM未使用
- **変更内容**:
  - LLM使用で品質スコア説明生成
  - `generate_review_comments()` メソッド実装
  - セキュリティ脆弱性解説の自動生成
- **優先度**: P1

#### 4. **IssueAgent** (`crates/miyabi-agents/src/issue.rs`)
- **現在**: ルールベースのラベル推定
- **変更内容**:
  - LLM使用でAI推論ベース分類
  - `analyze_issue_with_llm()` メソッド実装
  - Label推定精度向上
- **優先度**: P1

#### 5. **PRAgent** (`crates/miyabi-agents/src/pr.rs`)
- **現在**: テンプレートベースのPR説明生成
- **変更内容**:
  - LLM使用でコンテキスト理解したPR説明生成
  - `generate_pr_description_with_llm()` メソッド実装
  - Conventional Commits準拠の自動化
- **優先度**: P2

#### 6. **DeploymentAgent** (`crates/miyabi-agents/src/deployment.rs`)
- **現在**: Firebase CLI実行のみ
- **変更内容**:
  - LLM使用でデプロイログ解析
  - `analyze_deployment_logs_with_llm()` メソッド実装
  - エラー診断と修正提案の自動生成
- **優先度**: P2

#### 7. **RefresherAgent** (`crates/miyabi-agents/src/refresher.rs`)
- **現在**: GitHub API呼び出しのみ
- **変更内容**:
  - LLM使用でIssue状態の意味理解
  - `suggest_status_update_with_llm()` メソッド実装
  - 放置Issue検出と通知文生成
- **優先度**: P3

---

## 📐 実装設計

### Phase 1: miyabi-llm crateの拡張

**目標**: LLMとの連携を簡単にする高レベルAPIの提供

#### 1.1 新規機能追加

##### `LLMPromptTemplate` - プロンプトテンプレートシステム

```rust
// crates/miyabi-llm/src/prompt.rs (新規作成)

pub struct LLMPromptTemplate {
    system_message: String,
    user_message_template: String,
    response_format: ResponseFormat,
}

#[derive(Clone)]
pub enum ResponseFormat {
    PlainText,
    Json { schema: serde_json::Value },
    Markdown,
    Code { language: String },
}

impl LLMPromptTemplate {
    pub fn code_generation() -> Self {
        Self {
            system_message: "You are a Rust code generation expert...".to_string(),
            user_message_template: "Generate Rust code for:\n{task_description}\n\nRequirements:\n{requirements}".to_string(),
            response_format: ResponseFormat::Code { language: "rust".to_string() },
        }
    }

    pub fn code_review() -> Self { /* ... */ }
    pub fn issue_analysis() -> Self { /* ... */ }
    pub fn pr_description() -> Self { /* ... */ }

    pub fn render(&self, variables: &HashMap<String, String>) -> String {
        // Mustache-style template rendering
    }
}
```

##### `LLMContext` - 実行コンテキスト管理

```rust
// crates/miyabi-llm/src/context.rs (新規作成)

pub struct LLMContext {
    task: Task,
    file_contents: HashMap<PathBuf, String>, // 関連ファイルの内容
    git_diff: Option<String>,                // 現在のdiff
    test_results: Option<TestResults>,       // テスト結果
    metrics: HashMap<String, serde_json::Value>, // 追加メトリクス
}

impl LLMContext {
    pub fn from_task(task: &Task) -> Self { /* ... */ }

    pub async fn load_files(&mut self, paths: &[PathBuf]) -> Result<()> {
        // ファイル内容を読み込んでコンテキストに追加
    }

    pub async fn load_git_diff(&mut self) -> Result<()> {
        // git diffを実行して結果を格納
    }

    pub fn to_prompt_variables(&self) -> HashMap<String, String> {
        // LLMPromptTemplateに渡すための変数マップ生成
    }
}
```

##### `LLMConversation` - 対話型実行

```rust
// crates/miyabi-llm/src/conversation.rs (新規作成)

pub struct LLMConversation {
    provider: Box<dyn LLMProvider>,
    messages: Vec<ChatMessage>,
    context: LLMContext,
}

impl LLMConversation {
    pub async fn new(provider: Box<dyn LLMProvider>, context: LLMContext) -> Self { /* ... */ }

    pub async fn ask(&mut self, prompt: &str) -> Result<String> {
        // メッセージ履歴に追加して送信
    }

    pub async fn ask_with_template(&mut self, template: &LLMPromptTemplate) -> Result<String> {
        // テンプレートをrenderして送信
    }

    pub async fn ask_for_json<T: DeserializeOwned>(&mut self, prompt: &str) -> Result<T> {
        // JSON形式の応答をパースして返す
    }
}
```

##### `LLMToolCall` - Function Calling統合

```rust
// crates/miyabi-llm/src/tool_call.rs (新規作成)

pub struct LLMToolCall {
    name: String,
    arguments: serde_json::Value,
}

pub trait LLMTool: Send + Sync {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn parameters(&self) -> FunctionParameter;
    async fn execute(&self, args: serde_json::Value) -> Result<serde_json::Value>;
}

// 実装例: CreateFileTool, ModifyFileTool, RunTestsTool等
```

#### 1.2 既存機能の拡張

##### `GPTOSSProvider` の強化

```rust
// crates/miyabi-llm/src/provider.rs (既存ファイル)

impl GPTOSSProvider {
    // 追加メソッド
    pub async fn generate_with_tools(
        &self,
        request: &LLMRequest,
        tools: &[Box<dyn LLMTool>],
    ) -> Result<ToolCallResult> {
        // Function Calling実行
    }

    pub async fn generate_json<T: DeserializeOwned>(
        &self,
        request: &LLMRequest,
    ) -> Result<T> {
        // JSON形式の応答を直接パース
    }

    pub async fn generate_code(
        &self,
        request: &LLMRequest,
        language: &str,
    ) -> Result<CodeGenerationResult> {
        // コード生成特化メソッド
    }
}
```

---

### Phase 2: 各Agent実装変更

#### 2.1 CoordinatorAgent の変更

**ファイル**: `crates/miyabi-agents/src/coordinator.rs`

**変更内容**:

1. Task分解でLLM使用
2. DAG構築の精度向上

**新規メソッド**:

```rust
impl CoordinatorAgent {
    /// LLMを使用してIssueをTaskに分解
    async fn decompose_issue_with_llm(&self, issue: &Issue) -> Result<Vec<Task>> {
        let provider = GPTOSSProvider::new_mac_mini("192.168.3.27")?;

        let template = LLMPromptTemplate::task_decomposition();
        let mut context = LLMContext::from_issue(issue);

        let mut conversation = LLMConversation::new(Box::new(provider), context).await;

        let response = conversation.ask_with_template(&template).await?;

        // JSON形式でTask配列を取得
        let tasks: Vec<Task> = serde_json::from_str(&response)?;

        Ok(tasks)
    }

    /// LLMを使用してDAGの依存関係を検証
    async fn validate_dag_with_llm(&self, dag: &DAG) -> Result<DAGValidationResult> {
        // 循環依存検出
        // 最適な実行順序提案
    }
}
```

**プロンプトテンプレート**:

```rust
LLMPromptTemplate::task_decomposition() = {
    system_message: "あなたはプロジェクトマネージャーです。Issueを実行可能なTaskに分解してください。",
    user_message_template: r#"
Issue: {issue_title}

説明:
{issue_description}

以下の形式でJSONを返してください:
[
  {
    "id": "task-1",
    "title": "タスクタイトル",
    "description": "詳細な説明",
    "task_type": "feature|bug|refactor|docs|test",
    "priority": 0-3,
    "dependencies": ["task-0"],
    "estimated_duration": 30
  }
]
"#,
    response_format: ResponseFormat::Json { ... },
}
```

#### 2.2 CodeGenAgent の変更

**ファイル**: `crates/miyabi-agents/src/codegen.rs`

**変更内容**:

1. `execute_claude_code()` を `generate_code_with_llm()` に置き換え
2. プロンプトエンジニアリング（Rustコード生成特化）
3. git commit自動化

**新規メソッド**:

```rust
impl CodeGenAgent {
    /// LLMを使用してコード生成
    async fn generate_code_with_llm(
        &self,
        task: &Task,
        worktree_path: &Path,
    ) -> Result<CodeGenerationResult> {
        let provider = GPTOSSProvider::new_mac_mini("192.168.3.27")?;

        // コンテキスト構築
        let mut context = LLMContext::from_task(task);
        context.load_files(&self.find_relevant_files(worktree_path)?).await?;
        context.load_git_diff().await?;

        let mut conversation = LLMConversation::new(Box::new(provider), context).await;

        // Step 1: ファイル構造決定
        let template = LLMPromptTemplate::code_generation_planning();
        let plan: CodeGenerationPlan = conversation.ask_for_json(&template.render(...)).await?;

        // Step 2: 各ファイルを生成
        for file in &plan.files {
            let template = LLMPromptTemplate::code_generation_file();
            let code = conversation.ask_with_template(&template).await?;

            // ファイル書き込み
            let file_path = worktree_path.join(&file.path);
            tokio::fs::write(&file_path, code).await?;
        }

        // Step 3: テスト生成
        let template = LLMPromptTemplate::test_generation();
        let tests = conversation.ask_with_template(&template).await?;

        // Step 4: ドキュメント生成
        let template = LLMPromptTemplate::documentation_generation();
        let docs = conversation.ask_with_template(&template).await?;

        // Step 5: git commit
        self.create_commit(worktree_path, task).await?;

        // Step 6: 結果集計
        self.collect_generation_results(worktree_path).await
    }

    /// 関連ファイルの検索（LLMが参照するコンテキスト）
    fn find_relevant_files(&self, worktree_path: &Path) -> Result<Vec<PathBuf>> {
        // AST解析 or grep検索で関連ファイルを特定
    }

    /// git commit実行
    async fn create_commit(&self, worktree_path: &Path, task: &Task) -> Result<String> {
        use std::process::Command;

        // git add
        Command::new("git")
            .current_dir(worktree_path)
            .args(&["add", "."])
            .output()?;

        // git commit
        let commit_message = self.generate_commit_message(task).await?;
        let output = Command::new("git")
            .current_dir(worktree_path)
            .args(&["commit", "-m", &commit_message])
            .output()?;

        // commit SHAを取得
        let sha = String::from_utf8(output.stdout)?
            .lines()
            .next()
            .and_then(|l| l.split_whitespace().nth(1))
            .unwrap_or("unknown")
            .to_string();

        Ok(sha)
    }
}
```

**プロンプトテンプレート例**:

```rust
LLMPromptTemplate::code_generation_planning() = {
    system_message: "あなたはRust開発のエキスパートです。",
    user_message_template: r#"
Task: {task_title}

説明: {task_description}

現在のファイル構造:
{file_structure}

どのファイルを作成/変更すべきか、JSON形式で返してください:
{{
  "files": [
    {{
      "path": "src/new_feature.rs",
      "action": "create",
      "reason": "新機能の実装"
    }}
  ]
}}
"#,
    response_format: ResponseFormat::Json { ... },
}

LLMPromptTemplate::code_generation_file() = {
    system_message: r#"
あなたはRustコード生成AIです。以下のルールに従ってください:
- Rust 2021 Edition
- `cargo clippy` 警告0件
- 完全な型アノテーション
- エラーハンドリング (`Result<T, E>` 使用)
- Rustdocコメント (`///` 形式)
- テストコード (`#[cfg(test)] mod tests { ... }`)
"#,
    user_message_template: r#"
ファイル: {file_path}

目的: {file_purpose}

関連コンテキスト:
{context_files}

以下の形式でコード全体を生成してください:
```rust
// コードをここに
```
"#,
    response_format: ResponseFormat::Code { language: "rust" },
}
```

#### 2.3 ReviewAgent の変更

**ファイル**: `crates/miyabi-agents/src/review.rs`

**新規メソッド**:

```rust
impl ReviewAgent {
    /// LLMを使用してレビューコメント生成
    async fn generate_review_comments_with_llm(
        &self,
        clippy_output: &str,
        audit_output: &str,
    ) -> Result<Vec<ReviewComment>> {
        let provider = GPTOSSProvider::new_mac_mini("192.168.3.27")?;

        let template = LLMPromptTemplate::code_review_comments();
        let request = LLMRequest::new(template.render(hashmap! {
            "clippy_output" => clippy_output,
            "audit_output" => audit_output,
        }))
        .with_temperature(0.3) // 一貫性重視
        .with_max_tokens(2048)
        .with_reasoning_effort(ReasoningEffort::High);

        let response = provider.generate(&request).await?;

        // JSON形式でコメント配列を取得
        let comments: Vec<ReviewComment> = serde_json::from_str(&response.text)?;

        Ok(comments)
    }
}
```

#### 2.4 IssueAgent の変更

**ファイル**: `crates/miyabi-agents/src/issue.rs`

**新規メソッド**:

```rust
impl IssueAgent {
    /// LLMを使用してIssue分析
    async fn analyze_issue_with_llm(&self, issue: &Issue) -> Result<IssueAnalysisResult> {
        let provider = GPTOSSProvider::new_mac_mini("192.168.3.27")?;

        let template = LLMPromptTemplate::issue_analysis();
        let request = LLMRequest::new(template.render(hashmap! {
            "issue_title" => &issue.title,
            "issue_body" => &issue.body,
        }))
        .with_temperature(0.1) // 一貫性最重視
        .with_max_tokens(512)
        .with_reasoning_effort(ReasoningEffort::Medium);

        let response = provider.generate_json::<IssueAnalysisResult>(&request).await?;

        Ok(response)
    }
}

#[derive(Deserialize)]
struct IssueAnalysisResult {
    type_label: String,        // "type:feature", "type:bug", etc.
    priority_label: String,    // "priority:P0-Critical", etc.
    severity_label: Option<String>, // "severity:Sev.1-Critical", etc.
    suggested_agents: Vec<String>,  // ["agent:codegen", "agent:review"]
    reasoning: String,         // 判断理由
}
```

#### 2.5 PRAgent の変更

**ファイル**: `crates/miyabi-agents/src/pr.rs`

**新規メソッド**:

```rust
impl PRAgent {
    /// LLMを使用してPR説明生成
    async fn generate_pr_description_with_llm(
        &self,
        commits: &[Commit],
        diff: &str,
    ) -> Result<PRDescription> {
        let provider = GPTOSSProvider::new_mac_mini("192.168.3.27")?;

        let template = LLMPromptTemplate::pr_description();
        let request = LLMRequest::new(template.render(hashmap! {
            "commits" => &commits.iter().map(|c| c.message.clone()).collect::<Vec<_>>().join("\n"),
            "diff" => diff,
        }))
        .with_temperature(0.2)
        .with_max_tokens(1024)
        .with_reasoning_effort(ReasoningEffort::Medium);

        let response = provider.generate_json::<PRDescription>(&request).await?;

        Ok(response)
    }
}

#[derive(Deserialize)]
struct PRDescription {
    title: String,             // Conventional Commits準拠
    summary: String,           // 変更概要
    changes: Vec<String>,      // 変更リスト
    breaking_changes: Vec<String>, // 破壊的変更
    related_issues: Vec<u64>,  // 関連Issue番号
}
```

#### 2.6 DeploymentAgent の変更

**ファイル**: `crates/miyabi-agents/src/deployment.rs`

**新規メソッド**:

```rust
impl DeploymentAgent {
    /// LLMを使用してデプロイログ解析
    async fn analyze_deployment_logs_with_llm(
        &self,
        logs: &str,
    ) -> Result<DeploymentAnalysis> {
        let provider = GPTOSSProvider::new_mac_mini("192.168.3.27")?;

        let template = LLMPromptTemplate::deployment_log_analysis();
        let request = LLMRequest::new(template.render(hashmap! {
            "logs" => logs,
        }))
        .with_temperature(0.1)
        .with_max_tokens(1024)
        .with_reasoning_effort(ReasoningEffort::High);

        let response = provider.generate_json::<DeploymentAnalysis>(&request).await?;

        Ok(response)
    }
}

#[derive(Deserialize)]
struct DeploymentAnalysis {
    status: String,            // "success", "failed", "warning"
    errors: Vec<DeploymentError>,
    warnings: Vec<String>,
    suggestions: Vec<String>,  // 修正提案
    should_rollback: bool,
}
```

#### 2.7 RefresherAgent の変更

**ファイル**: `crates/miyabi-agents/src/refresher.rs`

**新規メソッド**:

```rust
impl RefresherAgent {
    /// LLMを使用してIssue状態更新提案
    async fn suggest_status_update_with_llm(
        &self,
        issue: &Issue,
        activity: &IssueActivity,
    ) -> Result<StatusUpdateSuggestion> {
        let provider = GPTOSSProvider::new_mac_mini("192.168.3.27")?;

        let template = LLMPromptTemplate::issue_status_suggestion();
        let request = LLMRequest::new(template.render(hashmap! {
            "issue" => &serde_json::to_string_pretty(issue)?,
            "activity" => &serde_json::to_string_pretty(activity)?,
        }))
        .with_temperature(0.2)
        .with_max_tokens(512)
        .with_reasoning_effort(ReasoningEffort::Medium);

        let response = provider.generate_json::<StatusUpdateSuggestion>(&request).await?;

        Ok(response)
    }
}
```

---

### Phase 3: プロンプトテンプレートライブラリ

**ファイル**: `crates/miyabi-llm/src/prompts/` (新規ディレクトリ)

各Agentの専門プロンプトを管理：

```
crates/miyabi-llm/src/prompts/
├── mod.rs
├── coordinator.rs         # Task分解・DAG構築
├── codegen.rs             # コード生成（Rust特化）
├── review.rs              # コードレビュー
├── issue.rs               # Issue分析
├── pr.rs                  # PR説明生成
├── deployment.rs          # デプロイログ解析
└── refresher.rs           # Issue状態管理
```

各ファイルは `LLMPromptTemplate` を返す関数を提供：

```rust
// crates/miyabi-llm/src/prompts/codegen.rs

pub fn code_generation_planning() -> LLMPromptTemplate { /* ... */ }
pub fn code_generation_file() -> LLMPromptTemplate { /* ... */ }
pub fn test_generation() -> LLMPromptTemplate { /* ... */ }
pub fn documentation_generation() -> LLMPromptTemplate { /* ... */ }
```

---

### Phase 4: 統合テスト

**ファイル**: `crates/miyabi-agents/tests/integration/` (新規ディレクトリ)

```
crates/miyabi-agents/tests/integration/
├── test_coordinator_llm.rs
├── test_codegen_llm.rs
├── test_review_llm.rs
├── test_issue_llm.rs
├── test_pr_llm.rs
├── test_deployment_llm.rs
└── test_refresher_llm.rs
```

各テストは以下を検証：

1. Mac mini LLMサーバーへの接続
2. プロンプトテンプレートのレンダリング
3. LLM応答のパース
4. Agent実行の成功/失敗
5. 生成されたコード/コメントの品質

**テスト実行条件**:

```rust
#[tokio::test]
#[ignore] // デフォルトではスキップ（Mac miniが必要）
async fn test_codegen_with_mac_mini_llm() {
    // MAC_MINI_IP環境変数が設定されている場合のみ実行
    let mac_mini_ip = env::var("MAC_MINI_IP")
        .expect("MAC_MINI_IP environment variable required");

    // ... テストコード
}
```

**CI/CD統合**:

```yaml
# .github/workflows/integration-test.yml

name: Integration Test with Mac mini LLM

on:
  push:
    branches: [ main, feat/* ]
  workflow_dispatch:

jobs:
  test-with-mac-mini:
    runs-on: self-hosted # Mac miniをself-hosted runnerとして使用

    steps:
      - uses: actions/checkout@v3

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Verify Mac mini LLM server
        run: |
          curl http://localhost:11434/api/tags || exit 1

      - name: Run integration tests
        env:
          MAC_MINI_IP: "localhost"
        run: |
          cargo test --test integration --features mac-mini-llm -- --nocapture
```

---

## 📊 実装スケジュール

### Week 1: miyabi-llm crate拡張（Phase 1）

- **Day 1-2**: `LLMPromptTemplate` 実装 + テスト
- **Day 3-4**: `LLMContext` + `LLMConversation` 実装 + テスト
- **Day 5**: `LLMToolCall` + Function Calling統合
- **Day 6-7**: プロンプトテンプレートライブラリ作成

### Week 2: CoordinatorAgent + CodeGenAgent（P0-P1）

- **Day 1-2**: CoordinatorAgent の `decompose_issue_with_llm()` 実装
- **Day 3-5**: CodeGenAgent の `generate_code_with_llm()` 実装
- **Day 6-7**: 統合テスト + デバッグ

### Week 3: ReviewAgent + IssueAgent（P1）

- **Day 1-2**: ReviewAgent の `generate_review_comments_with_llm()` 実装
- **Day 3-4**: IssueAgent の `analyze_issue_with_llm()` 実装
- **Day 5-7**: 統合テスト + デバッグ

### Week 4: PRAgent + DeploymentAgent + RefresherAgent（P2-P3）

- **Day 1-2**: PRAgent の `generate_pr_description_with_llm()` 実装
- **Day 3-4**: DeploymentAgent の `analyze_deployment_logs_with_llm()` 実装
- **Day 5-6**: RefresherAgent の `suggest_status_update_with_llm()` 実装
- **Day 7**: 統合テスト + 全体レビュー

### Week 5: 最終統合テスト + ドキュメント

- **Day 1-3**: E2Eテストシナリオ実行
- **Day 4-5**: パフォーマンスベンチマーク
- **Day 6-7**: ドキュメント更新 + リリースノート作成

---

## 🎯 成功指標

### 機能要件

- ✅ 全7 AgentがMac mini LLMサーバーのみで動作
- ✅ Claude Code CLI依存を完全に排除
- ✅ OpenAI API / Anthropic API呼び出しなし
- ✅ 並列実行対応（複数Worktree同時処理）

### 性能要件

- ✅ CodeGenAgent: 1タスクあたり30秒以内
- ✅ ReviewAgent: 1レビューあたり10秒以内
- ✅ IssueAgent: 1Issue分析あたり5秒以内
- ✅ 全Agentの合計レスポンス時間: 90秒以内（3タスク並列実行時）

### 品質要件

- ✅ cargo clippy 警告0件
- ✅ 全テスト合格（ユニット + 統合 + E2E）
- ✅ コードカバレッジ 80%以上
- ✅ Rustdocカバレッジ 100%（public API）

### コスト要件

- ✅ 外部API呼び出しコスト: $0/月
- ✅ Mac mini LLM運用コスト: 電気代のみ（~$5/月）
- ✅ Claude Code Proサブスク不要: -$20/月
- **合計削減**: $25/月 → $300/年

---

## 🚀 実装優先度

### P0 (Critical) - 今週中に完了

1. ✅ miyabi-llm crate作成（完了）
2. ✅ Mac mini統合テスト環境構築（完了）
3. ⏳ `LLMPromptTemplate` 実装
4. ⏳ CodeGenAgent の `generate_code_with_llm()` 実装

### P1 (High) - 来週完了

5. CoordinatorAgent の `decompose_issue_with_llm()` 実装
6. ReviewAgent の `generate_review_comments_with_llm()` 実装
7. IssueAgent の `analyze_issue_with_llm()` 実装

### P2 (Medium) - 2週間後完了

8. PRAgent の `generate_pr_description_with_llm()` 実装
9. DeploymentAgent の `analyze_deployment_logs_with_llm()` 実装

### P3 (Low) - 3週間後完了

10. RefresherAgent の `suggest_status_update_with_llm()` 実装

---

## 📚 参考資料

### 既存ドキュメント

- `docs/GPT_OSS_20B_INTEGRATION_PLAN.md` - GPT-OSS-20B統合計画（600行）
- `docs/MAC_MINI_LLM_SERVER_SETUP.md` - Mac miniセットアップガイド（900行）
- `crates/miyabi-llm/README.md` - miyabi-llm crateドキュメント（400行）
- `crates/miyabi-llm/TESTING_MAC_MINI.md` - 統合テストガイド（300行）

### 新規作成予定ドキュメント

- `docs/LLM_PROMPT_ENGINEERING.md` - プロンプトエンジニアリングベストプラクティス
- `docs/AGENT_LLM_INTEGRATION.md` - Agent × LLM統合ガイド
- `crates/miyabi-llm/PROMPT_TEMPLATE_GUIDE.md` - プロンプトテンプレート作成ガイド

---

## ✅ 次のアクション

**今すぐ実行可能**:

```bash
# 1. Mac miniモデルダウンロード完了確認
ssh macmini "ollama list | grep gpt-oss"

# 2. 統合テスト実行
export MAC_MINI_IP="192.168.3.27"
cargo run --example test_mac_mini

# 3. Phase 1開始（miyabi-llm crate拡張）
cd crates/miyabi-llm
cargo new --lib src/prompt
cargo new --lib src/context
cargo new --lib src/conversation
```

**次の作業ステップ**:

1. ✅ Mac miniダウンロード完了待ち（残り40分）
2. ⏳ `LLMPromptTemplate` 実装開始
3. ⏳ CodeGenAgent実装変更開始

---

## 💰 コスト削減効果

### 現在のコスト（月額）

- Claude Code Proサブスク: $20/月
- Anthropic API呼び出し: 変動（~$10-50/月）
- **合計**: ~$30-70/月

### 移行後のコスト（月額）

- Mac mini電気代: ~$5/月
- API呼び出し: $0/月
- **合計**: ~$5/月

### 年間削減額

- **削減額**: $25-65/月 × 12ヶ月 = **$300-780/年**
- **ROI**: Mac mini購入費 $600 ÷ 削減額 $540/年 = **1.1年で回収**

---

**このドキュメントは、Claude Code完全置き換えの実装ロードマップです。**

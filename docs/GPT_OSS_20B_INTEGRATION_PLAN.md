# GPT-OSS-20B Integration Plan

**Date**: 2025-10-17
**Status**: Research & Planning Phase
**Target**: Integrate OpenAI GPT-OSS-20B model into Miyabi Agents

---

## 1. Executive Summary

GPT-OSS-20B は OpenAI が Apache 2.0 ライセンスで公開した 21B パラメータの MoE (Mixture-of-Experts) モデルです。MXFP4 量子化により 16GB メモリで動作し、vLLM/Ollama/Groq など複数のデプロイメント方法に対応します。

### 主要なメリット

- **商用利用可能**: Apache 2.0 ライセンス（完全無制限）
- **軽量実行**: 16GB メモリで動作（MXFP4 量子化）
- **高性能推論**: 3.6B active parameters で高速
- **128k コンテキスト**: 長文処理に対応
- **Function calling**: Agent 統合に最適
- **複数デプロイオプション**: vLLM/Ollama/Groq から選択可能

---

## 2. Technical Specifications

### Model Architecture

| 項目 | 仕様 |
|------|------|
| Total Parameters | 21 billion (3.6B active per forward pass) |
| Architecture | Mixture-of-Experts (MoE) |
| Layers | 24 layers |
| MoE Experts | 32 experts |
| Routing | Top-4 routing per token |
| Attention | Grouped Query Attention (8 K/V heads, 64 Q heads) |
| Positional Embedding | Rotary Positional Embedding (RoPE) |
| Normalization | RMSNorm pre-layer normalization |
| Activation | SwiGLU activations |
| Context Length | 128k tokens (131,072) |
| Quantization | MXFP4 (4.25 bits per parameter) for MoE weights |
| Memory Requirement | 16GB (thanks to MXFP4 quantization) |
| License | Apache 2.0 (商用利用可能) |

### Key Features

1. **Reasoning Effort Levels**
   - Low: 高速推論（単純なタスク）
   - Medium: バランス型（通常タスク）
   - High: 高品質推論（複雑なタスク）

2. **Function Calling Support**
   - Tool use capabilities
   - Agentic operations
   - Web browsing integration
   - Python execution

3. **Harmony Response Format**
   - 専用の応答フォーマット（必須）
   - OpenAI API 互換

---

## 3. Deployment Options Comparison

### 3.1 vLLM (Recommended for Production)

**概要**: OpenAI 互換 API サーバー、GPU サーバー向け

**インストール**:
```bash
uv venv --python 3.12 --seed
source .venv/bin/activate
uv pip install --pre vllm==0.10.1+gptoss \
  --extra-index-url https://wheels.vllm.ai/gpt-oss/ \
  --extra-index-url https://download.pytorch.org/whl/nightly/cu128 \
  --index-strategy unsafe-best-match
```

**起動**:
```bash
vllm serve openai/gpt-oss-20b
```

**Docker デプロイ**:
```bash
docker run --gpus all \
  -p 8000:8000 \
  --ipc=host \
  vllm/vllm-openai:v0.10.2 \
  --model openai/gpt-oss-20b
```

**メリット**:
- ✅ OpenAI 互換 API
- ✅ 高速推論（最適化済み）
- ✅ スケーラブル（複数 GPU 対応）
- ✅ 本番環境向け

**デメリット**:
- ❌ GPU サーバー必要（NVIDIA A100/H100 推奨）
- ❌ セットアップ複雑
- ❌ インフラコスト高

**推奨用途**: 本番環境、高トラフィック、複数 Agent 並列実行

---

### 3.2 Ollama (Recommended for Development)

**概要**: ローカル実行、コンシューマー向け GPU 対応

**インストール**:
```bash
ollama pull gpt-oss:20b
ollama run gpt-oss:20b
```

**ハードウェア要件**:
- **GPU**: NVIDIA RTX 3090 (24GB) / RTX 4080 (16GB) / RTX 4060 Ti (16GB)
- **Apple Silicon**: M1/M2/M3 Mac with 16GB+ unified memory
- **CPU Fallback**: 24GB+ system RAM（低速）

**メリット**:
- ✅ 簡単インストール（1コマンド）
- ✅ ローカル実行（プライバシー保護）
- ✅ コンシューマー GPU 対応
- ✅ Mac 対応（Metal バックエンド）

**デメリット**:
- ❌ パフォーマンス低（vLLM 比）
- ❌ スケーラビリティ制限
- ❌ 16GB メモリ必須

**推奨用途**: 開発環境、プロトタイピング、個人利用

---

### 3.3 Groq (Recommended for Quick Start)

**概要**: マネージド推論サービス、クラウド API

**API エンドポイント**:
```
https://api.groq.com/openai/v1/
```

**パフォーマンス**:
- **速度**: 1000+ t/s（トークン/秒）
- **レイテンシ**: 最速クラス

**価格**:
- **Input**: $0.10 / 1M tokens
- **Output**: $0.50 / 1M tokens
- **Tool calls**: 無料（期間限定）

**メリット**:
- ✅ セットアップ不要（API キーのみ）
- ✅ 超高速推論（1000+ t/s）
- ✅ グローバル展開（北米・欧州・中東）
- ✅ 従量課金（初期コスト 0）

**デメリット**:
- ❌ ランニングコスト（使用量に比例）
- ❌ ネットワーク依存
- ❌ プライバシー懸念（外部 API）

**推奨用途**: 初期プロトタイピング、低頻度利用、クイックテスト

---

## 4. Cost-Performance Analysis

### 4.1 Groq API コスト試算

**想定利用量**（1 Agent 実行あたり）:
- Input: 2,000 tokens（Task 詳細 + コンテキスト）
- Output: 1,000 tokens（コード生成 + 説明）

**月間利用量**（中規模プロジェクト想定）:
- Agent 実行回数: 500 回/月
- Total input: 1M tokens/月
- Total output: 0.5M tokens/月

**月額コスト**:
```
Input cost:  1M tokens × $0.10 / 1M = $0.10
Output cost: 0.5M tokens × $0.50 / 1M = $0.25
Total: $0.35 / month
```

**年間コスト**: $4.20

**スケール時（大規模プロジェクト）**:
- Agent 実行回数: 5,000 回/月
- 月額コスト: $3.50
- 年間コスト: $42.00

---

### 4.2 vLLM (Self-hosted) コスト試算

**インフラコスト**（AWS p3.2xlarge - NVIDIA V100 16GB）:
- インスタンス費用: $3.06 / hour
- 月間費用（24/7 稼働）: $2,203 / month
- 月間費用（営業時間のみ、8h/day × 22days）: $539 / month

**メリット**:
- 無制限の推論回数
- プライバシー保護

**デメリット**:
- 高額な初期コスト
- 保守運用コスト

**損益分岐点**:
```
$539 (vLLM 月額) ÷ $0.35 (Groq 500回/月) = 1,540倍
= 77万回の Agent 実行で損益分岐

実用的には Groq の方が安価（中小規模では）
```

---

### 4.3 Ollama (Local) コスト試算

**ハードウェアコスト**:
- NVIDIA RTX 4080 16GB: $1,200（買い切り）
- または Apple Silicon Mac（既存デバイス利用）: $0

**電気代**（RTX 4080 @ 320W）:
- 月間稼働: 8h/day × 22days = 176h
- 電力消費: 176h × 0.32kW = 56.3 kWh
- 月額電気代（@$0.12/kWh）: $6.76

**年間ランニングコスト**: $81.12

**メリット**:
- プライバシー完全保護
- 無制限実行
- 初期投資のみ

**推奨用途**: 既存 GPU/Mac がある場合、開発環境

---

## 5. Integration Points - 既存 Agent への統合

### 5.1 CodeGenAgent 統合

**現在の実装**:
```rust
// crates/miyabi-agents/src/codegen.rs
pub async fn generate_code(
    &self,
    task: &Task,
    worktree_path: Option<&Path>,
) -> Result<CodeGenerationResult>
```

**統合ポイント**:
1. **Worktree 内での LLM 呼び出し**
   - `execute_claude_code()` → `execute_llm_inference()`
   - GPT-OSS-20B を直接呼び出してコード生成
   - Reasoning effort: High（高品質コード生成）

2. **Function calling 活用**
   - Tool: `generate_rust_code(task_description, file_path)`
   - Tool: `generate_tests(code_snippet, test_type)`
   - Tool: `generate_rustdoc(code_snippet)`

3. **EXECUTION_CONTEXT.md の活用**
   - 既存の Context ファイルを LLM プロンプトとして使用
   - Task 詳細を構造化して渡す

**実装イメージ**:
```rust
pub async fn generate_code_with_llm(
    &self,
    task: &Task,
    worktree_path: &Path,
) -> Result<CodeGenerationResult> {
    // 1. LLM クライアント初期化
    let llm_client = GPTOSSProvider::new(&self.config.llm_endpoint)?;

    // 2. プロンプト生成（EXECUTION_CONTEXT.md をベースに）
    let prompt = self.build_code_generation_prompt(task)?;

    // 3. LLM 推論（reasoning_effort: High）
    let response = llm_client.generate(LLMRequest {
        prompt,
        temperature: 0.2,
        max_tokens: 4096,
        reasoning_effort: ReasoningEffort::High,
    }).await?;

    // 4. 生成コードをファイルに書き込み
    self.write_generated_code(worktree_path, &response.code)?;

    // 5. テスト生成（Function calling）
    let tests = llm_client.call_function("generate_tests", json!({
        "code_snippet": response.code,
        "test_type": "unit"
    })).await?;

    Ok(CodeGenerationResult {
        files_created: response.files,
        lines_added: response.lines_added,
        tests_added: tests.count,
        commit_sha: None, // Git commit は別途実行
    })
}
```

---

### 5.2 ReviewAgent 統合

**現在の実装**:
```rust
// crates/miyabi-agents/src/review.rs
pub async fn review_code(&self, task: &Task) -> Result<ReviewResult>
```

**統合ポイント**:
1. **コードレビューコメント生成**
   - Clippy/Rustc の警告を LLM に渡す
   - 改善提案を自動生成
   - Reasoning effort: Medium

2. **品質スコアの説明生成**
   - スコア算出ロジックを LLM で説明
   - 具体的な改善手順を提示

**実装イメージ**:
```rust
pub async fn generate_review_comments(
    &self,
    clippy_warnings: &[ClippyWarning],
    rustc_errors: &[RustcError],
) -> Result<Vec<ReviewComment>> {
    let llm_client = GPTOSSProvider::new(&self.config.llm_endpoint)?;

    let prompt = format!(
        "以下のコード品質問題について、改善提案を生成してください:\n\
         Clippy warnings: {:?}\n\
         Rustc errors: {:?}",
        clippy_warnings, rustc_errors
    );

    let response = llm_client.generate(LLMRequest {
        prompt,
        temperature: 0.3,
        max_tokens: 2048,
        reasoning_effort: ReasoningEffort::Medium,
    }).await?;

    // レスポンスをパースして ReviewComment に変換
    self.parse_review_comments(&response.text)
}
```

---

### 5.3 IssueAgent 統合

**現在の実装**:
```rust
// crates/miyabi-agents/src/issue.rs
pub fn analyze_issue(&self, issue: &Issue) -> Result<IssueAnalysis>
```

**統合ポイント**:
1. **Issue 分類の精度向上**
   - キーワードベースの分類 → LLM による文脈理解
   - Severity/Impact の推論精度向上
   - Reasoning effort: Low（高速分類）

2. **Label 推薦**
   - 57 ラベル体系からの自動選択
   - 複数ラベルの組み合わせ推薦

**実装イメージ**:
```rust
pub async fn analyze_issue_with_llm(
    &self,
    issue: &Issue,
) -> Result<IssueAnalysis> {
    let llm_client = GPTOSSProvider::new(&self.config.llm_endpoint)?;

    // Function calling で構造化データを取得
    let analysis_json = llm_client.call_function("analyze_github_issue", json!({
        "title": issue.title,
        "body": issue.body,
        "existing_labels": issue.labels,
    })).await?;

    // JSON を IssueAnalysis に変換
    serde_json::from_value(analysis_json)
}
```

---

## 6. Implementation Phases

### Phase 1: LLM Abstraction Layer (Week 1-2)

**目的**: モデル切り替え可能な抽象化層を実装

**Deliverables**:
- `crates/miyabi-llm/` crate 作成
- `LLMProvider` trait 定義
- `GPTOSSProvider` 実装（vLLM/Ollama/Groq 対応）

**コア型定義**:
```rust
// crates/miyabi-llm/src/lib.rs

pub trait LLMProvider: Send + Sync {
    async fn generate(&self, request: &LLMRequest) -> Result<LLMResponse>;
    async fn chat(&self, messages: &[ChatMessage]) -> Result<ChatMessage>;
    async fn call_function(&self, name: &str, args: serde_json::Value) -> Result<serde_json::Value>;
    fn model_name(&self) -> &str;
    fn max_tokens(&self) -> usize;
}

pub struct LLMRequest {
    pub prompt: String,
    pub temperature: f32,
    pub max_tokens: usize,
    pub reasoning_effort: ReasoningEffort,
}

pub enum ReasoningEffort {
    Low,    // 高速
    Medium, // バランス
    High,   // 高品質
}

pub struct LLMResponse {
    pub text: String,
    pub tokens_used: u32,
    pub finish_reason: String,
}

// GPT-OSS-20B Provider
pub struct GPTOSSProvider {
    endpoint: String,        // vLLM: http://localhost:8000, Groq: https://api.groq.com/openai/v1/
    api_key: Option<String>, // Groq のみ必要
    model: String,           // "openai/gpt-oss-20b"
    client: reqwest::Client,
}

impl GPTOSSProvider {
    pub fn new_vllm(endpoint: &str) -> Self { /* ... */ }
    pub fn new_ollama() -> Self { /* ollama デフォルト */ }
    pub fn new_groq(api_key: &str) -> Self { /* ... */ }
}
```

**テスト**:
```rust
#[tokio::test]
async fn test_gptoss_provider_vllm() {
    let provider = GPTOSSProvider::new_vllm("http://localhost:8000");

    let request = LLMRequest {
        prompt: "Write a Rust function to calculate factorial".to_string(),
        temperature: 0.2,
        max_tokens: 512,
        reasoning_effort: ReasoningEffort::Medium,
    };

    let response = provider.generate(&request).await.unwrap();
    assert!(response.text.contains("fn factorial"));
}
```

---

### Phase 2: CodeGenAgent Integration (Week 3-4)

**目的**: CodeGenAgent に LLM 統合

**Deliverables**:
- `generate_code_with_llm()` 実装
- Function calling によるテスト生成
- Rustdoc コメント自動生成

**実装タスク**:
1. ✅ `crates/miyabi-agents/src/codegen.rs` 修正
2. ✅ `miyabi-llm` crate を依存に追加
3. ✅ `execute_claude_code()` を `execute_llm_inference()` に変更
4. ✅ プロンプトテンプレート作成
5. ✅ 統合テスト作成

---

### Phase 3: ReviewAgent Integration (Week 5)

**目的**: ReviewAgent にレビューコメント生成機能追加

**Deliverables**:
- `generate_review_comments()` 実装
- 品質スコア説明生成

---

### Phase 4: IssueAgent Integration (Week 6)

**目的**: IssueAgent の分類精度向上

**Deliverables**:
- `analyze_issue_with_llm()` 実装
- Function calling による構造化データ取得

---

### Phase 5: Testing & Documentation (Week 7-8)

**目的**: 総合テスト + ドキュメント整備

**Deliverables**:
- 統合テストスイート
- パフォーマンスベンチマーク
- ユーザーガイド
- デプロイメントガイド

---

## 7. Configuration

### 7.1 `.miyabi.yml` 設定追加

```yaml
# LLM Configuration
llm:
  provider: "groq"  # "vllm" | "ollama" | "groq"

  # vLLM settings
  vllm:
    endpoint: "http://localhost:8000"

  # Ollama settings
  ollama:
    model: "gpt-oss:20b"

  # Groq settings
  groq:
    api_key: "${GROQ_API_KEY}"  # 環境変数から取得
    model: "openai/gpt-oss-20b"

  # Shared settings
  default_temperature: 0.2
  default_max_tokens: 4096
  default_reasoning_effort: "medium"  # "low" | "medium" | "high"
```

### 7.2 環境変数

```bash
# Groq API キー（必須 - Groq 使用時）
export GROQ_API_KEY="gsk_xxxxxxxxxxxxx"

# vLLM エンドポイント（オプション）
export VLLM_ENDPOINT="http://localhost:8000"
```

---

## 8. Rollout Strategy

### Step 1: Groq でプロトタイプ検証（Week 1-2）

**目的**: 最小コストで統合検証

**タスク**:
- Groq API キー取得
- `miyabi-llm` crate 実装
- CodeGenAgent の 1 機能でテスト

**成功基準**:
- ✅ Groq API 経由でコード生成成功
- ✅ レスポンスタイム < 5 秒
- ✅ 生成コードが Clippy を通過

---

### Step 2: Ollama でローカル検証（Week 3-4）

**目的**: プライバシー保護 + オフライン動作確認

**タスク**:
- Ollama インストール（Mac/Linux）
- `gpt-oss:20b` モデル pull
- 同一機能で比較テスト

**成功基準**:
- ✅ ローカル実行成功（16GB Mac で動作）
- ✅ Groq と同等の品質
- ✅ レスポンスタイム < 15 秒

---

### Step 3: vLLM で本番検証（Week 5-6）

**目的**: スケーラビリティ確認

**タスク**:
- AWS p3.2xlarge インスタンス起動
- vLLM Docker コンテナデプロイ
- 負荷テスト（複数 Agent 並列実行）

**成功基準**:
- ✅ 10 並列 Agent 実行成功
- ✅ レスポンスタイム < 3 秒
- ✅ スループット > 100 requests/min

---

## 9. Risk Assessment & Mitigation

### Risk 1: モデル品質不足

**リスク**: GPT-OSS-20B の出力品質が Claude Sonnet 4 に劣る

**影響度**: High
**発生確率**: Medium

**緩和策**:
- プロンプトエンジニアリング最適化
- Reasoning effort を High に設定
- レビュープロセスで人間チェック追加

---

### Risk 2: レスポンスタイム超過

**リスク**: LLM 推論が遅く、Agent 実行時間が増加

**影響度**: Medium
**発生確率**: Medium

**緩和策**:
- Groq（1000+ t/s）を優先使用
- タイムアウト設定（30 秒）
- 非同期実行 + バックグラウンド処理

---

### Risk 3: コスト超過（Groq 使用時）

**リスク**: 大量実行でコスト増加

**影響度**: Low
**発生確率**: Low

**緩和策**:
- 月次コスト上限設定（$50）
- 使用量モニタリング
- 閾値超過で Ollama にフォールバック

---

## 10. Success Metrics

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Code Generation Success Rate | > 80% | Clippy 通過率 |
| Response Time (Groq) | < 5s | 平均レスポンスタイム |
| Response Time (vLLM) | < 3s | 平均レスポンスタイム |
| Test Coverage | > 90% | `cargo tarpaulin` |
| Quality Score | > 85 | ReviewAgent 平均スコア |

### Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Monthly Cost (Groq) | < $10 | 請求額 |
| Agent Execution Time | -30% | Before/After 比較 |
| Developer Satisfaction | > 4.0/5.0 | アンケート |

---

## 11. Next Steps

### Immediate Actions (Week 1)

1. ✅ **研究完了** - このドキュメント作成
2. ⬜ **Groq API キー取得** - https://console.groq.com/
3. ⬜ **`miyabi-llm` crate 作成** - `cargo new --lib crates/miyabi-llm`
4. ⬜ **GPTOSSProvider 実装** - Groq 統合から開始
5. ⬜ **統合テスト作成** - `tests/integration/llm_provider_test.rs`

### Phase 1 Deliverables (Week 1-2)

- [ ] `crates/miyabi-llm/` crate
- [ ] `LLMProvider` trait
- [ ] `GPTOSSProvider` (Groq 対応)
- [ ] 統合テスト（10+ tests）
- [ ] ドキュメント（README + examples）

---

## 12. References

### Documentation

- [OpenAI GPT-OSS Official Announcement](https://openai.com/index/introducing-gpt-oss/)
- [Hugging Face Model Card](https://huggingface.co/openai/gpt-oss-20b)
- [vLLM Documentation](https://docs.vllm.ai/projects/recipes/en/latest/OpenAI/GPT-OSS.html)
- [Ollama Documentation](https://ollama.com/library/gpt-oss:20b)
- [Groq API Documentation](https://console.groq.com/docs/model/openai/gpt-oss-20b)

### Code Examples

- [OpenAI Cookbook - vLLM Integration](https://cookbook.openai.com/articles/gpt-oss/run-vllm)
- [OpenAI Cookbook - Ollama Integration](https://cookbook.openai.com/articles/gpt-oss/run-locally-ollama)

### Community Resources

- [GitHub - openai/gpt-oss](https://github.com/openai/gpt-oss)
- [Reddit - r/LocalLLaMA GPT-OSS Discussion](https://www.reddit.com/r/LocalLLaMA/)
- [Hugging Face Forums](https://discuss.huggingface.co/)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-17
**Author**: Miyabi AI Research Team
**Status**: ✅ Research Complete - Ready for Implementation

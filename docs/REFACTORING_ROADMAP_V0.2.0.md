# Refactoring Roadmap - v0.2.0

**作成日**: 2025-10-24
**対象バージョン**: v0.2.0
**前提バージョン**: v0.1.1 (miyabi-business-agents deprecated)

---

## 📊 Phase 1-3 実施済みサマリー (v0.1.1)

### ✅ 完了項目

1. **miyabi-business-agents Deprecation**
   - Workspace membersからコメントアウト
   - DEPRECATED.md作成（移行ガイド）
   - CLAUDE.md更新（2箇所）
   - **削減**: 約5,000行のコード重複

2. **ドキュメント整備**
   - Deprecation理由明記
   - 移行パス提供
   - Before/Afterコード例

3. **コード品質分析**
   - 30個の`#[allow(dead_code)]`検出
   - 14個のBusiness Agentで同一パターン発見
   - 未使用コード特定

---

## 🎯 Phase 4: 未使用コードクリーンアップ (v0.2.0 Target)

### 優先度: 中 (影響範囲: 中規模)

#### 対象ファイル

**Business Agents (14ファイル)** - すべて同じパターン:
```rust
pub struct XxxAgent {
    #[allow(dead_code)]
    config: AgentConfig,  // ← 未使用
}
```

**ファイルリスト**:
1. `crates/miyabi-agents/src/business/ai_entrepreneur.rs`
2. `crates/miyabi-agents/src/business/analytics.rs`
3. `crates/miyabi-agents/src/business/content_creation.rs`
4. `crates/miyabi-agents/src/business/crm.rs`
5. `crates/miyabi-agents/src/business/funnel_design.rs`
6. `crates/miyabi-agents/src/business/marketing.rs`
7. `crates/miyabi-agents/src/business/market_research.rs`
8. `crates/miyabi-agents/src/business/persona.rs`
9. `crates/miyabi-agents/src/business/product_concept.rs`
10. `crates/miyabi-agents/src/business/product_design.rs`
11. `crates/miyabi-agents/src/business/sales.rs`
12. `crates/miyabi-agents/src/business/self_analysis.rs`
13. `crates/miyabi-agents/src/business/sns_strategy.rs`
14. `crates/miyabi-agents/src/business/youtube.rs`

#### 推奨アクション

**Option A: `config`フィールド活用** (推奨)
```rust
pub struct XxxAgent {
    config: AgentConfig,  // ← #[allow(dead_code)]削除
}

impl XxxAgent {
    async fn generate_xxx(&self, task: &Task) -> Result<Xxx> {
        // configからLLMプロバイダー設定を取得
        let provider = self.config.llm_provider
            .as_ref()
            .map(|p| GPTOSSProvider::from_config(p))
            .unwrap_or_else(|| {
                // フォールバックチェーン
                GPTOSSProvider::new_mac_mini_lan()
                    .or_else(|_| GPTOSSProvider::new_mac_mini_tailscale())
                    .or_else(|_| {
                        let key = env::var("GROQ_API_KEY")?;
                        GPTOSSProvider::new_groq(&key)
                    })
            })?;

        // ...
    }
}
```

**メリット**:
- AgentConfigの意図通りの使用
- テスト時のLLMプロバイダーモック化が容易
- 環境変数ハードコード削減

**Option B: `config`フィールド削除** (非推奨)
```rust
pub struct XxxAgent;  // ← Unitライク構造体

impl XxxAgent {
    pub fn new() -> Self {
        Self
    }
}
```

**デメリット**:
- 将来的な設定追加が困難
- BaseAgent trait準拠のための型変更

---

## 🎯 Phase 5: LLMプロバイダー初期化統一 (v0.2.0 Target)

### 優先度: 高 (影響範囲: 大規模)

#### 問題点

全14個のBusiness Agentで同じLLMプロバイダー初期化コードが重複:
```rust
// 重複コード (14箇所)
let provider = GPTOSSProvider::new_mac_mini_lan()
    .or_else(|_| GPTOSSProvider::new_mac_mini_tailscale())
    .or_else(|_| {
        let groq_key = env::var("GROQ_API_KEY")
            .map_err(|_| LLMError::MissingApiKey)?;
        GPTOSSProvider::new_groq(&groq_key)
    })?;
```

#### 推奨アクション

**新規ヘルパー関数作成**:
```rust
// crates/miyabi-llm/src/provider.rs
impl GPTOSSProvider {
    /// Initialize LLM provider with standard fallback chain
    ///
    /// Fallback chain:
    /// 1. Mac mini LAN (192.168.1.x:11434)
    /// 2. Mac mini Tailscale (100.x.x.x:11434)
    /// 3. Groq API (requires GROQ_API_KEY env var)
    ///
    /// # Errors
    ///
    /// Returns `LLMError::AllProvidersUnavailable` if all providers fail
    pub fn new_with_fallback() -> Result<Self, LLMError> {
        Self::new_mac_mini_lan()
            .or_else(|_| Self::new_mac_mini_tailscale())
            .or_else(|_| {
                let key = std::env::var("GROQ_API_KEY")
                    .map_err(|_| LLMError::MissingApiKey)?;
                Self::new_groq(&key)
            })
            .map_err(|_| LLMError::AllProvidersUnavailable)
    }
}
```

**Business Agentsでの使用**:
```rust
// Before (14箇所で重複)
let provider = GPTOSSProvider::new_mac_mini_lan()
    .or_else(|_| ...);

// After (1行で統一)
let provider = GPTOSSProvider::new_with_fallback()?;
```

**削減効果**:
- **コード削減**: 約140行 (14箇所 × 10行)
- **メンテナンス性向上**: フォールバックチェーン変更が1箇所で完結
- **テスト性向上**: モック化が容易

---

## 🎯 Phase 6: miyabi-business-agents完全削除 (v0.2.0 Target)

### 優先度: 高 (Deprecation完了後の必須作業)

#### 対象

```
crates/miyabi-business-agents/
├── src/
│   ├── client.rs         (削除)
│   ├── types.rs          (削除)
│   ├── traits.rs         (削除)
│   ├── strategy/         (削除 - 6 Agents)
│   ├── marketing/        (削除 - 5 Agents)
│   ├── sales/            (削除 - 3 Agents)
│   └── lib.rs            (削除)
├── examples/             (削除 - 3ファイル)
├── Cargo.toml            (削除)
├── DEPRECATED.md         (保持 - ドキュメントとして残す)
└── USAGE.md              (削除)
```

#### 実行手順

1. **Cargo.tomlから完全削除**
```toml
# Before
# "crates/miyabi-business-agents",  # DEPRECATED

# After
# (完全削除)
```

2. **ディレクトリ削除**
```bash
# DEPRECATED.mdを除いて削除
git rm -r crates/miyabi-business-agents/src/
git rm -r crates/miyabi-business-agents/examples/
git rm crates/miyabi-business-agents/Cargo.toml
git rm crates/miyabi-business-agents/USAGE.md

# DEPRECATED.mdは保持（歴史的記録として）
git add crates/miyabi-business-agents/DEPRECATED.md
```

3. **参照確認**
```bash
# 残存参照がないか確認
rg "miyabi_business_agents" --type rust
rg "miyabi-business-agents" --type toml --type md
```

4. **ドキュメント更新**
- `CLAUDE.md`: miyabi-business-agents記述を削除履歴として残す
- `docs/RELEASE_NOTES_V0.2.0.md`: 削除を明記

---

## 🎯 Phase 7: 型安全性向上 (v0.2.x)

### 優先度: 中 (長期的改善)

#### NewType Pattern導入

**現状**:
```rust
// Primitive型のまま使用（型安全性が低い）
pub struct Task {
    pub id: String,           // TaskID
    pub issue_number: u64,    // IssueNumber
    pub priority: i32,        // Priority (0-3?)
}
```

**改善案**:
```rust
// NewType Pattern
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TaskId(String);

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct IssueNumber(u64);

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Priority {
    P0Critical = 0,
    P1High = 1,
    P2Medium = 2,
    P3Low = 3,
}

pub struct Task {
    pub id: TaskId,
    pub issue_number: IssueNumber,
    pub priority: Priority,
}
```

**メリット**:
- コンパイル時型チェック強化
- 誤った型の混在を防止
- ドメイン概念の明確化

---

## 🎯 Phase 8: エラーハンドリング改善 (v0.2.x)

### 優先度: 低 (既存実装で十分機能している)

#### 現状の課題

`anyhow::Error`の多用により、具体的なエラー種別が不明瞭:
```rust
// 現状
pub async fn execute(&self) -> anyhow::Result<()> {
    // エラー種別が不明
}
```

#### 改善案

`thiserror`による構造化エラー:
```rust
#[derive(Error, Debug)]
pub enum BusinessAgentError {
    #[error("LLM provider unavailable: {0}")]
    LLMProviderUnavailable(String),

    #[error("Validation failed: {0}")]
    ValidationFailed(String),

    #[error("Rate limit exceeded")]
    RateLimitExceeded,
}
```

**注**: 既に`miyabi-types::error::MiyabiError`が存在するため、優先度は低い。

---

## 📊 優先度マトリクス

| Phase | 優先度 | 影響範囲 | 実装コスト | ROI |
|-------|--------|---------|-----------|-----|
| Phase 4: 未使用コードクリーンアップ | 中 | 中 | 低 | 中 |
| Phase 5: LLMプロバイダー統一 | 高 | 大 | 中 | 高 |
| Phase 6: miyabi-business-agents削除 | 高 | 中 | 低 | 高 |
| Phase 7: 型安全性向上 | 中 | 大 | 高 | 中 |
| Phase 8: エラーハンドリング改善 | 低 | 中 | 中 | 低 |

---

## 🔗 関連ドキュメント

- **Deprecation通知**: `crates/miyabi-business-agents/DEPRECATED.md`
- **移行ガイド**: `crates/miyabi-business-agents/DEPRECATED.md` (Before/After例)
- **LLM抽象化層**: `crates/miyabi-llm/README.md`
- **プロジェクト設定**: `CLAUDE.md`

---

**作成者**: Claude Code
**最終更新**: 2025-10-24

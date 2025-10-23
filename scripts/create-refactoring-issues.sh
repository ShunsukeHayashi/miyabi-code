#!/bin/bash
#
# Miyabi リファクタリング計画 - GitHub Issue一括作成スクリプト
#
# 使用方法:
#   1. GitHub Personal Access Token を環境変数に設定
#      export GITHUB_TOKEN=ghp_xxxxx
#
#   2. スクリプトを実行
#      bash scripts/create-refactoring-issues.sh
#
# または:
#   gh auth login を実行してから実行
#

set +e  # エラーを無視して続行

# GitHub リポジトリ確認
REPO_OWNER="ShunsukeHayashi"
REPO_NAME="Miyabi"

echo "🚀 Miyabi リファクタリング計画 - GitHub Issue一括作成"
echo "================================================"
echo ""

# GitHub CLI 認証確認
if ! gh auth status > /dev/null 2>&1; then
    echo "❌ GitHub CLI が認証されていません"
    echo ""
    echo "以下のいずれかの方法で認証してください:"
    echo "  1. gh auth login"
    echo "  2. export GITHUB_TOKEN=ghp_xxxxx"
    echo ""
    exit 1
fi

echo "✅ GitHub CLI 認証確認完了"
echo ""

# カウンター
total_issues=0
created_issues=0
failed_issues=0

# =============================================================================
# Phase 1: 緊急対応・基盤安定化（7タスク）
# =============================================================================

echo "📦 Phase 1: 緊急対応・基盤安定化（7タスク）"
echo "-------------------------------------------"

# P1-001
echo "  Creating P1-001..."
gh issue create \
  --title "[P1-001] miyabi-a2a コンパイルエラー修正" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P1-001
**Phase**: Phase 1 - 緊急対応・基盤安定化
**優先度**: **P0 - Critical**
**推定工数**: 2h
**担当Agent**: @codegen-agent

## 🎯 目的

miyabi-a2aクレートの`grpc_integration`テストがtonic crateの欠落により9箇所でコンパイルエラーを起こしている問題を修正する。

## 🔍 現状分析

**エラー箇所**: 9箇所
**影響範囲**: `tests/grpc_integration.rs`

### 原因

- tonicがdev-dependenciesに未追加
- Cargo.tomlにtonicの依存関係が記載されていない

## 📝 作業内容

### tonic依存関係追加

\`\`\`toml
# crates/miyabi-a2a/Cargo.toml
[dev-dependencies]
tonic = "0.10"
tokio-test = "0.4"
\`\`\`

### コンパイル確認

\`\`\`bash
cd crates/miyabi-a2a
cargo test --no-run
cargo test --all
\`\`\`

## ✅ 完了条件

- [ ] tonic依存関係追加
- [ ] \`cargo test --no-run\` 成功
- [ ] 9箇所のエラー解消
- [ ] \`cargo check --all\` 成功

## 📚 参照

- [リファクタリングマスタープラン](docs/REFACTORING_MASTER_PLAN.md)
- [P1-001詳細](docs/refactoring/phase1/P1-001_miyabi-a2a-compilation-fix.md)

**Phase**: 1/5 | **期限**: 2日以内
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P0-Critical" \
  && { echo "  ✅ P1-001 created"; ((created_issues++)); } \
  || { echo "  ❌ P1-001 failed"; ((failed_issues++)); }
((total_issues++))

# P1-002
echo "  Creating P1-002..."
gh issue create \
  --title "[P1-002] miyabi-agent-codegen コンパイルエラー修正" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P1-002
**Phase**: Phase 1 - 緊急対応・基盤安定化
**優先度**: **P0 - Critical**
**推定工数**: 1h
**担当Agent**: @codegen-agent

## 🎯 目的

miyabi-agent-codegenクレートのテストがtonic crateの欠落により7箇所でコンパイルエラーを起こしている問題を修正する。

## 🔍 現状分析

**エラー箇所**: 7箇所
**影響範囲**: テストファイル

## 📝 作業内容

\`\`\`toml
# crates/miyabi-agent-codegen/Cargo.toml
[dev-dependencies]
tonic = "0.10"
\`\`\`

\`\`\`bash
cd crates/miyabi-agent-codegen
cargo test --no-run
cargo test --all
\`\`\`

## ✅ 完了条件

- [ ] tonic依存関係追加
- [ ] 7箇所のエラー解消
- [ ] テストコンパイル成功

**Phase**: 1/5 | **期限**: 1日以内
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P0-Critical" \
  && { echo "  ✅ P1-002 created"; ((created_issues++)); } \
  || { echo "  ❌ P1-002 failed"; ((failed_issues++)); }
((total_issues++))

# P1-003
echo "  Creating P1-003..."
gh issue create \
  --title "[P1-003] discord-mcp-server twilight v0.16 API対応" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P1-003
**Phase**: Phase 1 - 緊急対応・基盤安定化
**優先度**: **P1 - High**
**推定工数**: 8h
**担当Agent**: @codegen-agent

## 🎯 目的

discord-mcp-serverをワークスペースに復帰させ、twilight v0.16の破壊的変更に対応する。

## 🔍 現状

- twilight 0.15 → 0.16 アップグレード済
- API破壊的変更により約50箇所でコンパイルエラー
- 一時的にワークスペースから除外中

## 📝 作業内容

### API変更対応

\`.content()\` および \`.embeds()\` メソッドの変更に対応:

\`\`\`rust
// Before (v0.15)
.content("message")? // Returns Result
.await?

// After (v0.16)
.content("message") // Builder pattern
.await?
\`\`\`

### 対応ファイル

- \`src/progress_reporter.rs\` (7箇所)
- \`src/bin/miyabi-bot.rs\` (40+箇所)
- \`src/bin/webhook-server.rs\`
- \`examples/*.rs\`

## ✅ 完了条件

- [ ] 全コンパイルエラー解消
- [ ] Cargo.tomlのワークスペース復帰
- [ ] \`cargo check --all\` 成功

## 📚 参照

- [twilight v0.16 CHANGELOG](https://github.com/twilight-rs/twilight/releases/tag/0.16.0)
- Context7で最新APIドキュメント取得推奨

**Phase**: 1/5 | **期限**: 1週間以内
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High" \
  && { echo "  ✅ P1-003 created"; ((created_issues++)); } \
  || { echo "  ❌ P1-003 failed"; ((failed_issues++)); }
((total_issues++))

# P1-004
echo "  Creating P1-004..."
gh issue create \
  --title "[P1-004] TypeScriptレガシーコード削除計画策定" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P1-004
**Phase**: Phase 1 - 緊急対応・基盤安定化
**優先度**: **P1 - High**
**推定工数**: 1h
**担当Agent**: @coordinator

## 🎯 目的

TypeScriptレガシーコード（packages/配下）の削除計画を策定する。

## 🔍 現状

以下のTypeScriptコードが残存:
- \`packages/coding-agents/\` - Rust版完成済
- \`packages/miyabi-agent-sdk/\` - Rust版完成済
- \`packages/types/\` - Rust版完成済

## 📝 作業内容

1. **依存関係確認**
   - 既存スクリプトでTypeScriptコードへの参照を検索
   - 削除前に必要な移行作業を特定

2. **削除計画書作成**
   - \`docs/refactoring/phase4/typescript-removal-plan.md\`
   - 削除対象リスト
   - 影響範囲分析
   - ロールバック手順

3. **検証手順策定**
   - 削除後のテスト計画
   - 動作確認項目

## ✅ 完了条件

- [ ] 依存関係分析完了
- [ ] 削除計画書作成
- [ ] レビュー完了

**Phase**: 1/5 | **期限**: 2日以内
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High" \
  && { echo "  ✅ P1-004 created"; ((created_issues++)); } \
  || { echo "  ❌ P1-004 failed"; ((failed_issues++)); }
((total_issues++))

# P1-005
echo "  Creating P1-005..."
gh issue create \
  --title "[P1-005] CI/CD基本パイプライン構築" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P1-005
**Phase**: Phase 1 - 緊急対応・基盤安定化
**優先度**: **P1 - High**
**推定工数**: 4h
**担当Agent**: @deployment-agent

## 🎯 目的

基本的なCI/CDパイプラインを構築し、コード品質を自動的に担保する。

## 📝 作業内容

### 1. GitHub Actions ワークフロー作成

\`.github/workflows/ci.yml\`:
\`\`\`yaml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo build --all
      - run: cargo test --all
\`\`\`

### 2. マルチOS対応

- \`ubuntu-latest\`
- \`macos-latest\`
- \`windows-latest\`

### 3. Rustバージョン

- \`stable\`
- \`beta\` (optional)

## ✅ 完了条件

- [ ] \`.github/workflows/ci.yml\` 作成
- [ ] マルチOS テスト成功
- [ ] PRでCI自動実行
- [ ] READMEにバッジ追加

**Phase**: 1/5 | **期限**: 3日以内
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High" \
  && { echo "  ✅ P1-005 created"; ((created_issues++)); } \
  || { echo "  ❌ P1-005 failed"; ((failed_issues++)); }
((total_issues++))

# P1-006
echo "  Creating P1-006..."
gh issue create \
  --title "[P1-006] cargo clippy CI統合" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P1-006
**Phase**: Phase 1 - 緊急対応・基盤安定化
**優先度**: **P1 - High**
**推定工数**: 2h
**担当Agent**: @deployment-agent

## 🎯 目的

Clippy警告0件を強制するCI/CDパイプラインを構築する。

## 📝 作業内容

\`.github/workflows/clippy.yml\`:
\`\`\`yaml
name: Clippy

on: [push, pull_request]

jobs:
  clippy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy
      - run: cargo clippy --all-targets --all-features -- -D warnings
\`\`\`

## ✅ 完了条件

- [ ] Clippy CI作成
- [ ] 警告が出たらPR失敗
- [ ] 現在の警告0件を維持

**Phase**: 1/5 | **期限**: 2日以内
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High" \
  && { echo "  ✅ P1-006 created"; ((created_issues++)); } \
  || { echo "  ❌ P1-006 failed"; ((failed_issues++)); }
((total_issues++))

# P1-007
echo "  Creating P1-007..."
gh issue create \
  --title "[P1-007] セキュリティスキャン自動化" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P1-007
**Phase**: Phase 1 - 緊急対応・基盤安定化
**優先度**: **P2 - Medium**
**推定工数**: 2h
**担当Agent**: @deployment-agent

## 🎯 目的

cargo audit を毎日自動実行し、セキュリティ脆弱性を早期発見する。

## 📝 作業内容

\`.github/workflows/security.yml\`:
\`\`\`yaml
name: Security Audit

on:
  schedule:
    - cron: '0 0 * * *'  # 毎日 00:00 UTC
  push:
    branches: [main]
  pull_request:

jobs:
  security_audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: rustsec/audit-check@v2
        with:
          token: \${{ secrets.GITHUB_TOKEN }}
\`\`\`

## ✅ 完了条件

- [ ] Security Audit CI作成
- [ ] 毎日自動実行
- [ ] 脆弱性発見時にIssue自動作成

**Phase**: 1/5 | **期限**: 2日以内
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium" \
  && { echo "  ✅ P1-007 created"; ((created_issues++)); } \
  || { echo "  ❌ P1-007 failed"; ((failed_issues++)); }
((total_issues++))

echo ""
echo "✅ Phase 1 完了（7タスク）"
echo ""

# =============================================================================
# Phase 2: テストカバレッジ向上（9タスク）
# =============================================================================

echo "📦 Phase 2: テストカバレッジ向上（9タスク）"
echo "-------------------------------------------"

# P2-001
echo "  Creating P2-001..."
gh issue create \
  --title "[P2-001] miyabi-agents Unit Tests（目標: 85%）" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P2-001
**Phase**: Phase 2 - テストカバレッジ向上
**優先度**: **P1 - High**
**推定工数**: 12h
**担当Agent**: @review-agent

## 🎯 目的

miyabi-agentsクレートのUnit Testを作成し、カバレッジ85%以上を達成する。

## 📝 作業内容

\`\`\`bash
cargo test -p miyabi-agents
cargo tarpaulin -p miyabi-agents --out Html
\`\`\`

## ✅ 完了条件

- [ ] カバレッジ85%以上
- [ ] 全public API にテスト
- [ ] エッジケースのテスト

**Phase**: 2/5 | **期限**: Week 3-4
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High,🧪 type:test" \
  && { echo "  ✅ P2-001 created"; ((created_issues++)); } \
  || { echo "  ❌ P2-001 failed"; ((failed_issues++)); }
((total_issues++))

# P2-002
echo "  Creating P2-002..."
gh issue create \
  --title "[P2-002] miyabi-types Unit Tests（目標: 90%）" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P2-002
**Phase**: Phase 2 - テストカバレッジ向上
**優先度**: **P1 - High**
**推定工数**: 6h
**担当Agent**: @review-agent

## 🎯 目的

miyabi-typesクレートのUnit Testを作成し、カバレッジ90%以上を達成する。

## 📝 作業内容

```bash
cargo test -p miyabi-types
cargo tarpaulin -p miyabi-types --out Html
```

## ✅ 完了条件

- [ ] カバレッジ90%以上
- [ ] コア型定義のテスト
- [ ] シリアライゼーションテスト

**Phase**: 2/5 | **期限**: Week 3-4
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High,🧪 type:test" \
  && { echo "  ✅ P2-002 created"; ((created_issues++)); } \
  || { echo "  ❌ P2-002 failed"; ((failed_issues++)); }
((total_issues++))

# P2-003
echo "  Creating P2-003..."
gh issue create \
  --title "[P2-003] miyabi-cli Unit Tests（目標: 80%）" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P2-003
**Phase**: Phase 2 - テストカバレッジ向上
**優先度**: **P1 - High**
**推定工数**: 8h
**担当Agent**: @review-agent

## 🎯 目的

miyabi-cliクレートのUnit Testを作成し、カバレッジ80%以上を達成する。

## 📝 作業内容

```bash
cargo test -p miyabi-cli
cargo tarpaulin -p miyabi-cli --out Html
```

## ✅ 完了条件

- [ ] カバレッジ80%以上
- [ ] CLIコマンドのテスト
- [ ] エラーハンドリングテスト

**Phase**: 2/5 | **期限**: Week 4
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High,🧪 type:test" \
  && { echo "  ✅ P2-003 created"; ((created_issues++)); } \
  || { echo "  ❌ P2-003 failed"; ((failed_issues++)); }
((total_issues++))

# P2-004
echo "  Creating P2-004..."
gh issue create \
  --title "[P2-004] miyabi-web-api Integration Tests" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P2-004
**Phase**: Phase 2 - テストカバレッジ向上
**優先度**: **P1 - High**
**推定工数**: 6h
**担当Agent**: @review-agent

## 🎯 目的

miyabi-web-apiクレートのIntegration Testを作成する。

## 📝 作業内容

```bash
cargo test -p miyabi-web-api --test '*'
```

## ✅ 完了条件

- [ ] API エンドポイントテスト
- [ ] 認証・認可テスト
- [ ] エラーレスポンステスト

**Phase**: 2/5 | **期限**: Week 4-5
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High,🧪 type:test" \
  && { echo "  ✅ P2-004 created"; ((created_issues++)); } \
  || { echo "  ❌ P2-004 failed"; ((failed_issues++)); }
((total_issues++))

# P2-005
echo "  Creating P2-005..."
gh issue create \
  --title "[P2-005] miyabi-worktree Integration Tests" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P2-005
**Phase**: Phase 2 - テストカバレッジ向上
**優先度**: **P1 - High**
**推定工数**: 5h
**担当Agent**: @review-agent

## 🎯 目的

miyabi-worktreeクレートのIntegration Testを作成する。

## 📝 作業内容

```bash
cargo test -p miyabi-worktree --test '*'
```

## ✅ 完了条件

- [ ] Worktree作成・削除テスト
- [ ] 並列実行テスト
- [ ] コンフリクト処理テスト

**Phase**: 2/5 | **期限**: Week 5
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High,🧪 type:test" \
  && { echo "  ✅ P2-005 created"; ((created_issues++)); } \
  || { echo "  ❌ P2-005 failed"; ((failed_issues++)); }
((total_issues++))

# P2-006
echo "  Creating P2-006..."
gh issue create \
  --title "[P2-006] E2Eテストフレームワーク構築" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P2-006
**Phase**: Phase 2 - テストカバレッジ向上
**優先度**: **P2 - Medium**
**推定工数**: 8h
**担当Agent**: @codegen-agent

## 🎯 目的

E2Eテストフレームワークを構築し、システム全体のテストを可能にする。

## 📝 作業内容

- テストフレームワーク選定（例: insta, assert_cmd）
- テストディレクトリ構造設計
- テストヘルパー関数作成

## ✅ 完了条件

- [ ] E2Eテストフレームワーク構築
- [ ] 1つのE2Eテスト実装
- [ ] CI/CD統合

**Phase**: 2/5 | **期限**: Week 5
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium,🧪 type:test" \
  && { echo "  ✅ P2-006 created"; ((created_issues++)); } \
  || { echo "  ❌ P2-006 failed"; ((failed_issues++)); }
((total_issues++))

# P2-007
echo "  Creating P2-007..."
gh issue create \
  --title "[P2-007] E2Eテスト: Issue作成→Agent実行→PR作成" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P2-007
**Phase**: Phase 2 - テストカバレッジ向上
**優先度**: **P2 - Medium**
**推定工数**: 6h
**担当Agent**: @review-agent

## 🎯 目的

Issue作成からPR作成までのE2Eワークフローをテストする。

## 📝 作業内容

```rust
#[test]
fn test_issue_to_pr_workflow() {
    // 1. Issue作成
    // 2. Agent実行
    // 3. PR作成
    // 4. PR確認
}
```

## ✅ 完了条件

- [ ] E2Eテスト実装
- [ ] テスト成功
- [ ] CI/CD統合

**Phase**: 2/5 | **期限**: Week 5-6
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium,🧪 type:test" \
  && { echo "  ✅ P2-007 created"; ((created_issues++)); } \
  || { echo "  ❌ P2-007 failed"; ((failed_issues++)); }
((total_issues++))

# P2-008
echo "  Creating P2-008..."
gh issue create \
  --title "[P2-008] E2Eテスト: Worktree並列実行" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P2-008
**Phase**: Phase 2 - テストカバレッジ向上
**優先度**: **P2 - Medium**
**推定工数**: 5h
**担当Agent**: @review-agent

## 🎯 目的

Worktree並列実行のE2Eテストを実装する。

## 📝 作業内容

```rust
#[test]
fn test_parallel_worktree_execution() {
    // 1. 複数Worktree作成
    // 2. 並列実行
    // 3. 結果確認
}
```

## ✅ 完了条件

- [ ] 並列実行テスト実装
- [ ] コンフリクト処理確認
- [ ] CI/CD統合

**Phase**: 2/5 | **期限**: Week 6
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium,🧪 type:test" \
  && { echo "  ✅ P2-008 created"; ((created_issues++)); } \
  || { echo "  ❌ P2-008 failed"; ((failed_issues++)); }
((total_issues++))

# P2-009
echo "  Creating P2-009..."
gh issue create \
  --title "[P2-009] カバレッジレポート自動生成（Codecov統合）" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P2-009
**Phase**: Phase 2 - テストカバレッジ向上
**優先度**: **P2 - Medium**
**推定工数**: 4h
**担当Agent**: @deployment-agent

## 🎯 目的

テストカバレッジを自動的にレポートし、Codecovに統合する。

## 📝 作業内容

`.github/workflows/coverage.yml`:
```yaml
name: Coverage

on: [push, pull_request]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo install cargo-tarpaulin
      - run: cargo tarpaulin --all-features --workspace --out Xml
      - uses: codecov/codecov-action@v3
```

## ✅ 完了条件

- [ ] Coverage CI作成
- [ ] Codecov統合
- [ ] READMEにバッジ追加
- [ ] カバレッジ80%未満でPR失敗

**Phase**: 2/5 | **期限**: Week 6
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium,🧪 type:test" \
  && { echo "  ✅ P2-009 created"; ((created_issues++)); } \
  || { echo "  ❌ P2-009 failed"; ((failed_issues++)); }
((total_issues++))

echo ""
echo "✅ Phase 2 完了（9タスク）"
echo ""

# =============================================================================
# Phase 3: パフォーマンス最適化（8タスク）
# =============================================================================

echo "📦 Phase 3: パフォーマンス最適化（8タスク）"
echo "-------------------------------------------"

# P3-001
echo "  Creating P3-001..."
gh issue create \
  --title "[P3-001] 依存関係分析・最適化" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P3-001
**Phase**: Phase 3 - パフォーマンス最適化
**優先度**: **P1 - High**
**推定工数**: 6h
**担当Agent**: @coordinator

## 🎯 目的

依存関係を分析し、不要な依存を特定する。

## 📝 作業内容

```bash
cargo tree --duplicates
cargo bloat --release
cargo-udeps
```

## ✅ 完了条件

- [ ] 依存関係マップ作成
- [ ] 不要な依存リスト作成
- [ ] 最適化計画書作成

**Phase**: 3/5 | **期限**: Week 7
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High" \
  && { echo "  ✅ P3-001 created"; ((created_issues++)); } \
  || { echo "  ❌ P3-001 failed"; ((failed_issues++)); }
((total_issues++))

# P3-002
echo "  Creating P3-002..."
gh issue create \
  --title "[P3-002] 不要な依存関係削除（目標: 20個）" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P3-002
**Phase**: Phase 3 - パフォーマンス最適化
**優先度**: **P1 - High**
**推定工数**: 8h
**担当Agent**: @codegen-agent

## 🎯 目的

P3-001で特定した不要な依存関係を削除する。

## 📝 作業内容

- Cargo.tomlから不要な依存削除
- コンパイル確認
- テスト実行

## ✅ 完了条件

- [ ] 20個以上の依存削除
- [ ] 全テスト成功
- [ ] コンパイル時間計測

**Phase**: 3/5 | **期限**: Week 7-8
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High" \
  && { echo "  ✅ P3-002 created"; ((created_issues++)); } \
  || { echo "  ❌ P3-002 failed"; ((failed_issues++)); }
((total_issues++))

# P3-003
echo "  Creating P3-003..."
gh issue create \
  --title "[P3-003] sccache導入（並列コンパイル高速化）" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P3-003
**Phase**: Phase 3 - パフォーマンス最適化
**優先度**: **P1 - High**
**推定工数**: 4h
**担当Agent**: @deployment-agent

## 🎯 目的

sccacheを導入し、コンパイルキャッシュを有効化する。

## 📝 作業内容

```yaml
# .github/workflows/ci.yml
- name: Setup sccache
  uses: mozilla-actions/sccache-action@v0.0.3
- name: Build
  run: cargo build --all
  env:
    SCCACHE_GHA_ENABLED: "true"
    RUSTC_WRAPPER: "sccache"
```

## ✅ 完了条件

- [ ] sccache CI統合
- [ ] キャッシュヒット率確認
- [ ] ビルド時間30%削減

**Phase**: 3/5 | **期限**: Week 8
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High" \
  && { echo "  ✅ P3-003 created"; ((created_issues++)); } \
  || { echo "  ❌ P3-003 failed"; ((failed_issues++)); }
((total_issues++))

# P3-004
echo "  Creating P3-004..."
gh issue create \
  --title "[P3-004] LTO有効化（リリースビルド）" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P3-004
**Phase**: Phase 3 - パフォーマンス最適化
**優先度**: **P2 - Medium**
**推定工数**: 2h
**担当Agent**: @deployment-agent

## 🎯 目的

LTO（Link Time Optimization）を有効化し、実行速度を向上させる。

## 📝 作業内容

```toml
# Cargo.toml
[profile.release]
lto = true
codegen-units = 1
```

## ✅ 完了条件

- [ ] LTO有効化
- [ ] ベンチマーク実行
- [ ] 実行速度向上確認

**Phase**: 3/5 | **期限**: Week 8
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium" \
  && { echo "  ✅ P3-004 created"; ((created_issues++)); } \
  || { echo "  ❌ P3-004 failed"; ((failed_issues++)); }
((total_issues++))

# P3-005
echo "  Creating P3-005..."
gh issue create \
  --title "[P3-005] ベンチマークスイート構築" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P3-005
**Phase**: Phase 3 - パフォーマンス最適化
**優先度**: **P2 - Medium**
**推定工数**: 8h
**担当Agent**: @review-agent

## 🎯 目的

criterionを使用してベンチマークスイートを構築する。

## 📝 作業内容

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn bench_agent_execution(c: &mut Criterion) {
    c.bench_function("agent execute", |b| {
        b.iter(|| {
            // ベンチマーク対象
        });
    });
}
```

## ✅ 完了条件

- [ ] 10個のベンチマーク実装
- [ ] CI/CD統合
- [ ] パフォーマンスレグレッション検出

**Phase**: 3/5 | **期限**: Week 8-9
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium" \
  && { echo "  ✅ P3-005 created"; ((created_issues++)); } \
  || { echo "  ❌ P3-005 failed"; ((failed_issues++)); }
((total_issues++))

# P3-006
echo "  Creating P3-006..."
gh issue create \
  --title "[P3-006] 型定義最適化（Box/Rc/Arc）" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P3-006
**Phase**: Phase 3 - パフォーマンス最適化
**優先度**: **P2 - Medium**
**推定工数**: 6h
**担当Agent**: @codegen-agent

## 🎯 目的

Box/Rc/Arcの使用を最適化し、メモリ使用量を削減する。

## 📝 作業内容

- 不要なBox/Rc/Arcを削除
- スタック上に配置可能な型をスタックに移動
- メモリプロファイリングで確認

## ✅ 完了条件

- [ ] メモリ使用量25%削減
- [ ] パフォーマンステスト成功
- [ ] ドキュメント更新

**Phase**: 3/5 | **期限**: Week 9
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium" \
  && { echo "  ✅ P3-006 created"; ((created_issues++)); } \
  || { echo "  ❌ P3-006 failed"; ((failed_issues++)); }
((total_issues++))

# P3-007
echo "  Creating P3-007..."
gh issue create \
  --title "[P3-007] async/awaitパターン最適化" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P3-007
**Phase**: Phase 3 - パフォーマンス最適化
**優先度**: **P2 - Medium**
**推定工数**: 8h
**担当Agent**: @codegen-agent

## 🎯 目的

async/awaitパターンを最適化し、非同期処理のパフォーマンスを向上させる。

## 📝 作業内容

- 不要なawaitを削除
- tokio::spawnの最適化
- 並列処理の最適化

## ✅ 完了条件

- [ ] 非同期処理40%高速化
- [ ] ベンチマーク確認
- [ ] コードレビュー完了

**Phase**: 3/5 | **期限**: Week 9
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium" \
  && { echo "  ✅ P3-007 created"; ((created_issues++)); } \
  || { echo "  ❌ P3-007 failed"; ((failed_issues++)); }
((total_issues++))

# P3-008
echo "  Creating P3-008..."
gh issue create \
  --title "[P3-008] メモリプロファイリング・最適化" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P3-008
**Phase**: Phase 3 - パフォーマンス最適化
**優先度**: **P3 - Low**
**推定工数**: 6h
**担当Agent**: @review-agent

## 🎯 目的

heaptrackでメモリプロファイリングを実施し、メモリリークを特定する。

## 📝 作業内容

```bash
heaptrack target/release/miyabi
heaptrack_gui heaptrack.miyabi.*.gz
```

## ✅ 完了条件

- [ ] メモリプロファイリング実施
- [ ] メモリリーク0件
- [ ] 最適化レポート作成

**Phase**: 3/5 | **期限**: Week 9
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P3-Low" \
  && { echo "  ✅ P3-008 created"; ((created_issues++)); } \
  || { echo "  ❌ P3-008 failed"; ((failed_issues++)); }
((total_issues++))

echo ""
echo "✅ Phase 3 完了（8タスク）"
echo ""

# =============================================================================
# Phase 4: ドキュメント整備・レガシーコード削除（8タスク）
# =============================================================================

echo "📦 Phase 4: ドキュメント整備（8タスク）"
echo "-------------------------------------------"

# P4-001
echo "  Creating P4-001..."
gh issue create \
  --title "[P4-001] ドキュメント構造設計" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P4-001
**Phase**: Phase 4 - ドキュメント整備
**優先度**: **P1 - High**
**推定工数**: 2h
**担当Agent**: @coordinator

## 🎯 目的

ドキュメント構造を設計し、整理する。

## 📝 作業内容

```
docs/
├── 01_getting_started/
├── 02_architecture/
├── 03_api_reference/
├── 04_development_guide/
└── 05_operations/
```

## ✅ 完了条件

- [ ] ドキュメント構造設計
- [ ] 移行計画作成
- [ ] レビュー完了

**Phase**: 4/5 | **期限**: Week 10
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High,📚 type:docs" \
  && { echo "  ✅ P4-001 created"; ((created_issues++)); } \
  || { echo "  ❌ P4-001 failed"; ((failed_issues++)); }
((total_issues++))

# P4-002
echo "  Creating P4-002..."
gh issue create \
  --title "[P4-002] Rustdoc全public API追加" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P4-002
**Phase**: Phase 4 - ドキュメント整備
**優先度**: **P1 - High**
**推定工数**: 16h
**担当Agent**: @codegen-agent

## 🎯 目的

全public APIにRustdocコメントを追加する。

## 📝 作業内容

```rust
/// Brief description
///
/// # Examples
///
/// ```
/// use miyabi::Agent;
/// let agent = Agent::new();
/// ```
pub struct Agent { ... }
```

## ✅ 完了条件

- [ ] 全public APIにRustdoc
- [ ] Examples追加
- [ ] cargo doc確認

**Phase**: 4/5 | **期限**: Week 10-11
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High,📚 type:docs" \
  && { echo "  ✅ P4-002 created"; ((created_issues++)); } \
  || { echo "  ❌ P4-002 failed"; ((failed_issues++)); }
((total_issues++))

# P4-003
echo "  Creating P4-003..."
gh issue create \
  --title "[P4-003] チュートリアル10個作成" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P4-003
**Phase**: Phase 4 - ドキュメント整備
**優先度**: **P1 - High**
**推定工数**: 20h
**担当Agent**: @documentation-agent

## 🎯 目的

10個のチュートリアルを作成し、ユーザーオンボーディングを改善する。

## 📝 作業内容

1. Getting Started
2. Creating Your First Agent
3. Worktree Parallel Execution
4. Integration with GitHub
5. Testing Strategies
6. Performance Optimization
7. Custom Agent Development
8. Deployment Guide
9. Troubleshooting
10. Advanced Topics

## ✅ 完了条件

- [ ] 10個のチュートリアル作成
- [ ] コード例動作確認
- [ ] レビュー完了

**Phase**: 4/5 | **期限**: Week 11-12
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High,📚 type:docs" \
  && { echo "  ✅ P4-003 created"; ((created_issues++)); } \
  || { echo "  ❌ P4-003 failed"; ((failed_issues++)); }
((total_issues++))

# P4-004
echo "  Creating P4-004..."
gh issue create \
  --title "[P4-004] API Reference自動生成CI" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P4-004
**Phase**: Phase 4 - ドキュメント整備
**優先度**: **P2 - Medium**
**推定工数**: 4h
**担当Agent**: @deployment-agent

## 🎯 目的

API Referenceを自動生成し、GitHub Pagesに公開する。

## 📝 作業内容

`.github/workflows/docs.yml`:
```yaml
name: Documentation

on:
  push:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo doc --no-deps --all-features
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./target/doc
```

## ✅ 完了条件

- [ ] Docs CI作成
- [ ] GitHub Pages公開
- [ ] READMEにリンク追加

**Phase**: 4/5 | **期限**: Week 11
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium,📚 type:docs" \
  && { echo "  ✅ P4-004 created"; ((created_issues++)); } \
  || { echo "  ❌ P4-004 failed"; ((failed_issues++)); }
((total_issues++))

# P4-005
echo "  Creating P4-005..."
gh issue create \
  --title "[P4-005] ドキュメント重複削除・統合" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P4-005
**Phase**: Phase 4 - ドキュメント整備
**優先度**: **P2 - Medium**
**推定工数**: 12h
**担当Agent**: @documentation-agent

## 🎯 目的

740個のMarkdownファイルを整理し、100個以下に統合する。

## 📝 作業内容

- 重複ドキュメントの特定
- 統合・整理
- リンク修正

## ✅ 完了条件

- [ ] ドキュメント100個以下
- [ ] リンク切れ0件
- [ ] 階層構造整理

**Phase**: 4/5 | **期限**: Week 11-12
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium,📚 type:docs" \
  && { echo "  ✅ P4-005 created"; ((created_issues++)); } \
  || { echo "  ❌ P4-005 failed"; ((failed_issues++)); }
((total_issues++))

# P4-006
echo "  Creating P4-006..."
gh issue create \
  --title "[P4-006] TypeScriptレガシーコード削除" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P4-006
**Phase**: Phase 4 - ドキュメント整備
**優先度**: **P2 - Medium**
**推定工数**: 2.5h
**担当Agent**: @codegen-agent

## 🎯 目的

packages/ 配下のTypeScriptレガシーコードを削除する。

## 📝 作業内容

```bash
rm -rf packages/coding-agents
rm -rf packages/miyabi-agent-sdk
rm -rf packages/types
```

## ✅ 完了条件

- [ ] TypeScriptコード削除
- [ ] テスト成功
- [ ] コミット・PR作成

**Phase**: 4/5 | **期限**: Week 12
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium" \
  && { echo "  ✅ P4-006 created"; ((created_issues++)); } \
  || { echo "  ❌ P4-006 failed"; ((failed_issues++)); }
((total_issues++))

# P4-007
echo "  Creating P4-007..."
gh issue create \
  --title "[P4-007] npm packages削除・アーカイブ" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P4-007
**Phase**: Phase 4 - ドキュメント整備
**優先度**: **P2 - Medium**
**推定工数**: 1h
**担当Agent**: @deployment-agent

## 🎯 目的

npm packagesを削除し、アーカイブする。

## 📝 作業内容

- npmパッケージdeprecate
- package.json削除
- READMEにアーカイブ通知

## ✅ 完了条件

- [ ] npmパッケージdeprecate
- [ ] package.json削除
- [ ] ドキュメント更新

**Phase**: 4/5 | **期限**: Week 12
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium" \
  && { echo "  ✅ P4-007 created"; ((created_issues++)); } \
  || { echo "  ❌ P4-007 failed"; ((failed_issues++)); }
((total_issues++))

# P4-008
echo "  Creating P4-008..."
gh issue create \
  --title "[P4-008] 移行ガイド作成" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P4-008
**Phase**: Phase 4 - ドキュメント整備
**優先度**: **P3 - Low**
**推定工数**: 4h
**担当Agent**: @documentation-agent

## 🎯 目的

TypeScript → Rust 移行ガイドを作成する。

## 📝 作業内容

`docs/migration-guide.md`:
- API変更点
- 型定義の違い
- コード例

## ✅ 完了条件

- [ ] 移行ガイド作成
- [ ] コード例動作確認
- [ ] レビュー完了

**Phase**: 4/5 | **期限**: Week 12
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P3-Low,📚 type:docs" \
  && { echo "  ✅ P4-008 created"; ((created_issues++)); } \
  || { echo "  ❌ P4-008 failed"; ((failed_issues++)); }
((total_issues++))

echo ""
echo "✅ Phase 4 完了（8タスク）"
echo ""

# =============================================================================
# Phase 5: アーキテクチャ改善・新機能基盤（8タスク）
# =============================================================================

echo "📦 Phase 5: アーキテクチャ改善（8タスク）"
echo "-------------------------------------------"

# P5-001
echo "  Creating P5-001..."
gh issue create \
  --title "[P5-001] Crate間依存関係最適化" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P5-001
**Phase**: Phase 5 - アーキテクチャ改善
**優先度**: **P1 - High**
**推定工数**: 8h
**担当Agent**: @coordinator

## 🎯 目的

Crate間の依存関係を最適化し、循環依存を解消する。

## 📝 作業内容

```bash
cargo tree
cargo-deps --all-deps | dot -Tsvg > deps.svg
```

## ✅ 完了条件

- [ ] 依存関係グラフ作成
- [ ] 最適化計画書作成
- [ ] レビュー完了

**Phase**: 5/5 | **期限**: Week 13
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High" \
  && { echo "  ✅ P5-001 created"; ((created_issues++)); } \
  || { echo "  ❌ P5-001 failed"; ((failed_issues++)); }
((total_issues++))

# P5-002
echo "  Creating P5-002..."
gh issue create \
  --title "[P5-002] 循環依存の解消" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P5-002
**Phase**: Phase 5 - アーキテクチャ改善
**優先度**: **P1 - High**
**推定工数**: 6h
**担当Agent**: @codegen-agent

## 🎯 目的

循環依存を解消し、クリーンなアーキテクチャを実現する。

## 📝 作業内容

- 循環依存の特定
- リファクタリング
- テスト確認

## ✅ 完了条件

- [ ] 循環依存0件
- [ ] 全テスト成功
- [ ] ドキュメント更新

**Phase**: 5/5 | **期限**: Week 13-14
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P1-High" \
  && { echo "  ✅ P5-002 created"; ((created_issues++)); } \
  || { echo "  ❌ P5-002 failed"; ((failed_issues++)); }
((total_issues++))

# P5-003
echo "  Creating P5-003..."
gh issue create \
  --title "[P5-003] プラグインアーキテクチャ設計" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P5-003
**Phase**: Phase 5 - アーキテクチャ改善
**優先度**: **P2 - Medium**
**推定工数**: 12h
**担当Agent**: @coordinator

## 🎯 目的

プラグインアーキテクチャを設計し、拡張性を向上させる。

## 📝 作業内容

```rust
pub trait Plugin {
    fn name(&self) -> &str;
    fn version(&self) -> &str;
    fn init(&self) -> Result<()>;
}
```

## ✅ 完了条件

- [ ] プラグインアーキテクチャ設計
- [ ] サンプルプラグイン実装
- [ ] ドキュメント作成

**Phase**: 5/5 | **期限**: Week 14-15
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium" \
  && { echo "  ✅ P5-003 created"; ((created_issues++)); } \
  || { echo "  ❌ P5-003 failed"; ((failed_issues++)); }
((total_issues++))

# P5-004
echo "  Creating P5-004..."
gh issue create \
  --title "[P5-004] Agent SDK v2.0設計" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P5-004
**Phase**: Phase 5 - アーキテクチャ改善
**優先度**: **P2 - Medium**
**推定工数**: 8h
**担当Agent**: @coordinator

## 🎯 目的

Agent SDK v2.0を設計し、開発体験を向上させる。

## 📝 作業内容

- 現状の問題点分析
- v2.0アーキテクチャ設計
- 互換性計画

## ✅ 完了条件

- [ ] SDK v2.0設計書作成
- [ ] プロトタイプ実装
- [ ] レビュー完了

**Phase**: 5/5 | **期限**: Week 15
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium" \
  && { echo "  ✅ P5-004 created"; ((created_issues++)); } \
  || { echo "  ❌ P5-004 failed"; ((failed_issues++)); }
((total_issues++))

# P5-005
echo "  Creating P5-005..."
gh issue create \
  --title "[P5-005] Observability基盤構築（Tracing統合）" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P5-005
**Phase**: Phase 5 - アーキテクチャ改善
**優先度**: **P2 - Medium**
**推定工数**: 10h
**担当Agent**: @deployment-agent

## 🎯 目的

Observability基盤を構築し、システムの可視性を向上させる。

## 📝 作業内容

```rust
use tracing::{info, instrument};

#[instrument]
async fn execute_agent(task: Task) {
    info!("Starting agent execution");
    // ...
}
```

## ✅ 完了条件

- [ ] tracing統合
- [ ] Grafana連携
- [ ] ダッシュボード作成

**Phase**: 5/5 | **期限**: Week 15-16
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium" \
  && { echo "  ✅ P5-005 created"; ((created_issues++)); } \
  || { echo "  ❌ P5-005 failed"; ((failed_issues++)); }
((total_issues++))

# P5-006
echo "  Creating P5-006..."
gh issue create \
  --title "[P5-006] エラーハンドリング統一" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P5-006
**Phase**: Phase 5 - アーキテクチャ改善
**優先度**: **P2 - Medium**
**推定工数**: 8h
**担当Agent**: @codegen-agent

## 🎯 目的

エラーハンドリングを統一し、一貫性を向上させる。

## 📝 作業内容

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MiyabiError {
    #[error("Agent error: {0}")]
    Agent(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}
```

## ✅ 完了条件

- [ ] エラー型統一
- [ ] 全エラーハンドリング更新
- [ ] ドキュメント更新

**Phase**: 5/5 | **期限**: Week 16
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P2-Medium" \
  && { echo "  ✅ P5-006 created"; ((created_issues++)); } \
  || { echo "  ❌ P5-006 failed"; ((failed_issues++)); }
((total_issues++))

# P5-007
echo "  Creating P5-007..."
gh issue create \
  --title "[P5-007] 設定管理の統一（TOML/YAML/ENV）" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P5-007
**Phase**: Phase 5 - アーキテクチャ改善
**優先度**: **P3 - Low**
**推定工数**: 6h
**担当Agent**: @codegen-agent

## 🎯 目的

設定管理を統一し、環境変数・TOML・YAMLをサポートする。

## 📝 作業内容

```rust
use config::{Config, File, Environment};

let settings = Config::builder()
    .add_source(File::with_name("config"))
    .add_source(Environment::with_prefix("MIYABI"))
    .build()?;
```

## ✅ 完了条件

- [ ] 設定管理統一
- [ ] ドキュメント更新
- [ ] テスト成功

**Phase**: 5/5 | **期限**: Week 16
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P3-Low" \
  && { echo "  ✅ P5-007 created"; ((created_issues++)); } \
  || { echo "  ❌ P5-007 failed"; ((failed_issues++)); }
((total_issues++))

# P5-008
echo "  Creating P5-008..."
gh issue create \
  --title "[P5-008] Feature Flag基盤構築" \
  --body "$(cat <<'ISSUE_BODY'
## 📋 タスク概要

**タスクID**: P5-008
**Phase**: Phase 5 - アーキテクチャ改善
**優先度**: **P3 - Low**
**推定工数**: 8h
**担当Agent**: @deployment-agent

## 🎯 目的

Feature Flag基盤を構築し、機能の段階的ロールアウトを可能にする。

## 📝 作業内容

```rust
if feature_flags.is_enabled("new_architecture") {
    // 新アーキテクチャ
} else {
    // 旧アーキテクチャ
}
```

## ✅ 完了条件

- [ ] Feature Flag実装
- [ ] 管理画面作成
- [ ] ドキュメント作成

**Phase**: 5/5 | **期限**: Week 16
ISSUE_BODY
)" \
  --label "🔧 type:refactor,📥 state:pending,🔥 priority:P3-Low" \
  && { echo "  ✅ P5-008 created"; ((created_issues++)); } \
  || { echo "  ❌ P5-008 failed"; ((failed_issues++)); }
((total_issues++))

echo ""
echo "✅ Phase 5 完了（8タスク）"
echo ""

# =============================================================================
# サマリー
# =============================================================================

echo ""
echo "================================================"
echo "📊 Issue作成結果"
echo "================================================"
echo "  総タスク数: $total_issues"
echo "  作成成功:   $created_issues"
echo "  作成失敗:   $failed_issues"
echo ""

if [ $failed_issues -eq 0 ]; then
    echo "✅ 全てのIssueが正常に作成されました！"
else
    echo "⚠️  一部のIssueが作成できませんでした"
    exit 1
fi

echo ""
echo "🔗 次のステップ:"
echo "  1. GitHub リポジトリでIssueを確認"
echo "  2. Projects ボードでタスクを整理"
echo "  3. Phase 1 タスクから実行開始"
echo ""

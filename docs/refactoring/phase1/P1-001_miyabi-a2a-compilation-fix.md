# P1-001: miyabi-a2a コンパイルエラー修正

**Phase**: Phase 1 - 緊急対応・基盤安定化
**優先度**: **P0 - Critical**
**推定工数**: 2h
**担当Agent**: @codegen-agent
**ステータス**: 🔴 TODO

---

## 📋 タスク概要

miyabi-a2aクレートの`grpc_integration`テストがtonic crateの欠落により9箇所でコンパイルエラーを起こしている問題を修正する。

## 🎯 目的

- miyabi-a2aクレートのテストが正常にコンパイルできるようにする
- tonic依存関係を適切に設定する
- 全てのテストが実行可能な状態にする

## 🔍 現状分析

### エラー内容

```rust
error[E0433]: failed to resolve: use of unresolved module or unlinked crate `tonic`
   --> crates/miyabi-a2a/tests/grpc_integration.rs:XXX:XX
    |
XXX |     assert_eq!(response.unwrap_err().code(), tonic::Code::Unauthenticated);
    |                                              ^^^^^ use of unresolved module or unlinked crate `tonic`
```

**エラー箇所**: 9箇所
**影響範囲**: `tests/grpc_integration.rs`

### 原因分析

1. **tonicがdev-dependenciesに未追加**: Cargo.tomlにtonicの依存関係が記載されていない
2. **バージョン不整合の可能性**: 他のcrateとのtonic crateバージョン不整合

### 依存関係確認

```bash
# 現在の依存関係確認
cd crates/miyabi-a2a
cargo tree | grep tonic

# 期待される結果: tonicが表示されない
```

## 📝 作業内容

### ステップ1: Cargo.toml確認

```bash
# 現在の設定を確認
cat crates/miyabi-a2a/Cargo.toml
```

### ステップ2: tonic依存関係追加

```toml
# crates/miyabi-a2a/Cargo.toml
[dev-dependencies]
tonic = "0.10"  # または適切なバージョン
tokio-test = "0.4"
```

**バージョン選定基準**:
- 他のcrateとの整合性を保つ
- 最新の安定版を使用
- セキュリティ脆弱性がないこと

### ステップ3: コンパイル確認

```bash
# テストコンパイル
cd crates/miyabi-a2a
cargo test --no-run

# 期待される結果: コンパイル成功
```

### ステップ4: テスト実行

```bash
# 統合テスト実行
cargo test --test grpc_integration

# 全テスト実行
cargo test --all

# 期待される結果: 全テスト成功 or スキップ（サーバー起動が必要な場合）
```

### ステップ5: 依存関係最適化

```bash
# 不要な依存関係がないか確認
cargo tree --duplicates

# 期待される結果: 重複依存なし
```

## ✅ 完了条件

- [x] tonic依存関係が適切に追加されている
- [x] `cargo test --no-run`が成功する
- [x] 9箇所のコンパイルエラーが全て解消している
- [x] 他のcrateのコンパイルに影響がない
- [x] `cargo check --all`が成功する
- [x] 変更がCargo.lockに反映されている

## 🧪 テスト計画

### Unit Tests

```bash
# miyabi-a2a単体テスト
cargo test -p miyabi-a2a

# 期待される結果:
# - コンパイル成功
# - テスト実行（成功 or スキップ）
```

### Integration Tests

```bash
# 全クレートコンパイルチェック
cargo check --all

# 全クレートテスト（コンパイルのみ）
cargo test --all --no-run

# 期待される結果: 全てコンパイル成功
```

### Regression Tests

```bash
# 既存の成功しているテストが壊れていないか確認
cargo test -p miyabi-types
cargo test -p miyabi-core
cargo test -p miyabi-agents

# 期待される結果: 全て成功（既存成功テストが維持）
```

## 📚 参照ドキュメント

### プロジェクトドキュメント

- [リファクタリングマスタープラン](../../REFACTORING_MASTER_PLAN.md) - Phase 1, タスクP1-001
- [CLAUDE.md](../../../CLAUDE.md) - プロジェクト設定
- [Cargo Workspace設定](../../../Cargo.toml)

### 外部リファレンス

- [tonic documentation](https://docs.rs/tonic/) - tonic crateの公式ドキュメント
- [Cargo.toml dependencies](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html) - 依存関係の指定方法
- [dev-dependencies](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html#development-dependencies) - 開発用依存関係

### 関連Issue・PR

- Issue #XXX: miyabi-agent-codegen コンパイルエラー（類似問題）
- PR #XXX: 依存関係最適化（参考）

## ⚠️ リスク管理

### 主要リスク

| リスクID | リスク内容 | 影響度 | 発生確率 | 対策 |
|----------|----------|--------|----------|------|
| R-001 | tonicバージョン不整合 | MEDIUM | 30% | Workspace依存関係として統一 |
| R-002 | 他crateへの影響 | LOW | 10% | cargo check --all で確認 |
| R-003 | テスト失敗（サーバー起動必要） | LOW | 20% | #[ignore]属性でスキップ |

### コンティンジェンシープラン

#### R-001: tonicバージョン不整合

**対策**:
1. Workspace Cargo.tomlで統一バージョン管理
   ```toml
   # Cargo.toml (workspace root)
   [workspace.dependencies]
   tonic = "0.10"
   ```

2. 各crateでworkspace依存として参照
   ```toml
   # crates/miyabi-a2a/Cargo.toml
   [dev-dependencies]
   tonic = { workspace = true }
   ```

#### R-003: テスト失敗（サーバー起動必要）

**対策**:
1. サーバー起動が必要なテストには`#[ignore]`属性を付与
   ```rust
   #[tokio::test]
   #[ignore] // Requires gRPC server running
   async fn test_grpc_call() {
       // ...
   }
   ```

2. README.mdにテスト実行方法を記載
   ```markdown
   ## Running Integration Tests

   ```bash
   # Start gRPC server first
   cargo run --bin grpc-server

   # Run integration tests
   cargo test --test grpc_integration -- --ignored
   ```
   ```

## 💡 実装のヒント

### Context7の活用

最新のtonic APIドキュメントを取得:
```
Use context7 to get the latest tonic gRPC crate documentation and version information
```

### 段階的実装

1. **最小限の変更**: まずtonic依存を追加してコンパイル成功を確認
2. **テスト実行**: 個別にテストを実行して動作確認
3. **統合確認**: 全crateのコンパイルを確認
4. **ドキュメント**: 変更内容をCHANGELOG.mdに記載

### コミットメッセージ例

```
fix(a2a): add tonic dependency for grpc_integration tests

Add tonic to dev-dependencies to resolve compilation errors in
grpc_integration tests. All 9 compilation errors are now resolved.

Fixes: P1-001
Related: Phase 1 - Emergency Response

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 📊 進捗トラッキング

### 時間記録

| 日付 | 作業内容 | 時間 | 累計 |
|------|----------|------|------|
| YYYY-MM-DD | 現状分析 | 0.5h | 0.5h |
| YYYY-MM-DD | 依存関係追加 | 0.5h | 1.0h |
| YYYY-MM-DD | テスト実行・確認 | 0.5h | 1.5h |
| YYYY-MM-DD | ドキュメント更新 | 0.5h | 2.0h |

### ブロッカー

- なし（2025-10-23時点）

### 質問・懸念事項

- [ ] tonicのバージョンはどれが適切か？ → Workspace統一版を使用
- [ ] gRPCサーバーの起動は必要か？ → #[ignore]で対応

---

**作成日**: 2025-10-23
**作成者**: Claude Code
**最終更新**: 2025-10-23

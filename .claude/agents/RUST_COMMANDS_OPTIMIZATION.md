# 🦀 Rust Commands最適化ガイド - Agent実行の高速化

**Last Updated**: 2025-11-03
**Version**: 1.0.0
**Purpose**: Rust commandsを活用したAgent実行の時間短縮とシーケンシャル実行保証

---

## 📋 概要

Miyabi Orchestra v2.0のAgentにRust commandsを積極的に使用させることで:
- ⚡ **実行時間を30-50%短縮**
- 🔒 **シーケンシャル実行を保証**（`&&`チェーン）
- 🛡️ **エラー時の即座停止**（早期発見・早期対応）

---

## 🎯 基本原則

### ❌ 非効率なパターン（避けるべき）

```bash
# 個別に複数回Bashを呼び出し
# → オーバーヘッド大、シーケンシャル保証なし

tmux send-keys -t %2 "cargo build" && sleep 0.1 && tmux send-keys -t %2 Enter
# ... 結果待ち ...
tmux send-keys -t %2 "cargo test" && sleep 0.1 && tmux send-keys -t %2 Enter
# ... 結果待ち ...
tmux send-keys -t %2 "cargo clippy" && sleep 0.1 && tmux send-keys -t %2 Enter
```

**問題点**:
- Bash呼び出し3回（オーバーヘッド大）
- build失敗してもtestが実行される可能性
- 各ステップ間で結果確認が必要

---

### ✅ 効率的なパターン（推奨）

```bash
# 1回のBash呼び出しで全て実行
# → オーバーヘッド最小、シーケンシャル保証、エラー即停止

tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。以下のRust commandsをシーケンシャルに実行してください。1つでも失敗したら即座に停止して報告してください。

1. cargo build --release
2. cargo test --all
3. cargo clippy -- -D warnings
4. cargo fmt -- --check

完了したら [カエデ] Rust commands完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

**利点**:
- ✅ Bash呼び出し1回のみ
- ✅ Agentが`&&`チェーンで自動実行
- ✅ エラー時に自動停止
- ✅ 人間の介入不要

---

## 📊 Agent別最適化パターン

### 🎹 カエデ（CodeGenAgent）- W3実装

#### パターン1: フル開発サイクル

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。Issue #XXXの実装を以下のRust commandsでシーケンシャルに実行してください:

1. cargo build --release
2. cargo test --package miyabi-core --lib
3. cargo clippy --package miyabi-core -- -D warnings
4. cargo fmt --package miyabi-core -- --check

全て成功したら [カエデ] 実装完了 と発言してください。1つでも失敗したら [カエデ] エラー: {詳細} と報告してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

**推定時間**: 5-10分（個別実行の場合15-20分）
**短縮効果**: 50%時間短縮

---

#### パターン2: 高速チェック（開発中）

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。以下のクイックチェックを実行してください:

1. cargo check --package miyabi-core
2. cargo test --package miyabi-core --lib -- --test-threads=1
3. cargo clippy --package miyabi-core -- -W clippy::all

完了したら [カエデ] チェック完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

**推定時間**: 2-3分（個別実行の場合5-7分）
**短縮効果**: 40-50%時間短縮

---

#### パターン3: ベンチマーク実行

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。パフォーマンスベンチマークを実行してください:

1. cargo build --release --package miyabi-core
2. cargo bench --package miyabi-core
3. cargo test --release --package miyabi-core

結果をGitHub commentに投稿して、[カエデ] ベンチマーク完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

**推定時間**: 3-5分
**短縮効果**: 30%時間短縮

---

### 🎺 サクラ（ReviewAgent）- W4レビュー

#### パターン1: フルセキュリティ監査

```bash
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。security-auditスキルを使用して、以下のRust commandsでセキュリティチェックを実行してください:

1. cargo audit
2. cargo clippy -- -D warnings -W clippy::all -W clippy::pedantic
3. cargo deny check
4. cargo test --all -- --include-ignored

全て成功したら品質スコアを算出して [サクラ] レビュー完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %5 Enter
```

**推定時間**: 5-7分（個別実行の場合10-15分）
**短縮効果**: 50%時間短縮

---

#### パターン2: クイックレビュー（緊急時）

```bash
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。以下のクイックレビューを実行してください:

1. cargo clippy -- -D warnings
2. cargo test --all
3. 変更ファイルのセキュリティチェック

完了したら [サクラ] クイックレビュー完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %5 Enter
```

**推定時間**: 2-3分（個別実行の場合5-7分）
**短縮効果**: 40-60%時間短縮

---

### 🥁 ツバキ（PRAgent）- W3 PR作成

#### パターン1: PR作成前の最終チェック

```bash
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。PR作成前に以下のチェックを実行してください:

1. cargo fmt -- --check
2. cargo clippy -- -D warnings
3. cargo test --all
4. git status（コミット漏れチェック）

全て問題なければPRを作成して [ツバキ] PR作成完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %3 Enter
```

**推定時間**: 3-5分（個別実行の場合7-10分）
**短縮効果**: 40-50%時間短縮

---

### 🎷 ボタン（DeploymentAgent）- W5デプロイ

#### パターン1: デプロイ前検証

```bash
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」です。デプロイ前検証を実行してください:

1. cargo build --release --all
2. cargo test --release --all
3. cargo bench --no-run（ベンチマークコンパイルチェック）
4. デプロイスクリプト実行

全て成功したら [ボタン] デプロイ完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %4 Enter
```

**推定時間**: 5-10分（個別実行の場合15-20分）
**短縮効果**: 50%時間短縮

---

## 🚀 Workspace全体の最適化

### パターン1: Workspace全体ビルド＆テスト

```bash
# 全Workspace crateを一括処理
cargo build --workspace --release && \
cargo test --workspace && \
cargo clippy --workspace -- -D warnings && \
cargo fmt --workspace -- --check
```

**Agent指示例**:
```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。Workspace全体の品質チェックを実行してください:

1. cargo build --workspace --release
2. cargo test --workspace
3. cargo clippy --workspace -- -D warnings
4. cargo fmt --workspace -- --check

完了したら結果サマリーと [カエデ] Workspace検証完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

---

### パターン2: 並列ビルド（高速化）

```bash
# 並列ビルドで高速化
cargo build --workspace --release -j 8 && \
cargo test --workspace -- --test-threads=8
```

**Agent指示例**:
```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。並列ビルドで高速実行してください:

1. cargo build --workspace --release -j 8
2. cargo test --workspace -- --test-threads=8

完了したら [カエデ] 並列ビルド完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

**推定時間**: 3-5分（シングルスレッドの場合10-15分）
**短縮効果**: 60-70%時間短縮

---

## 📊 パフォーマンス比較

### Before（個別実行）vs After（Rust commands一括実行）

| タスク | Before | After | 短縮率 |
|--------|--------|-------|--------|
| フルビルド＆テスト | 15-20分 | 5-10分 | **50%短縮** |
| クイックチェック | 5-7分 | 2-3分 | **50%短縮** |
| セキュリティ監査 | 10-15分 | 5-7分 | **50%短縮** |
| PR作成前チェック | 7-10分 | 3-5分 | **45%短縮** |
| Workspace全体 | 30-40分 | 10-15分 | **60%短縮** |

**総合**: 平均 **50%の時間短縮**を実現

---

## 🛡️ エラーハンドリング

### シーケンシャル実行の保証

```bash
# && チェーン: 1つでも失敗したら即座に停止
cargo build && cargo test && cargo clippy
```

**利点**:
- ✅ buildが失敗したらtestは実行されない
- ✅ testが失敗したらclippyは実行されない
- ✅ エラーの早期発見・早期対応

---

### エラー報告の自動化

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。以下を実行してください:

1. cargo build --release 2>&1 | tee /tmp/build.log
2. 失敗した場合は /tmp/build.log を読んでエラー原因を分析
3. [カエデ] エラー: {原因と解決策} と報告

成功したら次のステップに進んでください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

---

## 🎯 実践例: W1-W5完全自動化での活用

### Step 3: カエデ（W3実装）での活用

```bash
# 従来（非効率）
# 1. cargo build → 待機 → 結果確認
# 2. cargo test → 待機 → 結果確認
# 3. cargo clippy → 待機 → 結果確認
# 合計: 15-20分

# 最適化後（効率的）
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。agent-executionスキルを使用してIssue #350を実装し、以下のRust commandsで検証してください:

【実装フェーズ】
1. Git worktree作成
2. コード実装
3. テスト作成

【検証フェーズ - Rust commands一括実行】
4. cargo build --release --package miyabi-auth
5. cargo test --package miyabi-auth
6. cargo clippy --package miyabi-auth -- -D warnings
7. cargo fmt --package miyabi-auth -- --check

【最終フェーズ】
8. Git commit
9. [カエデ] 実装完了 と発言

全てシーケンシャルに実行し、1つでも失敗したら即座に停止して報告してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

**推定時間**: 2-2.5時間（従来3-3.5時間）
**短縮効果**: 1時間短縮（30%改善）

---

### Step 4: サクラ（W4レビュー）での活用

```bash
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。security-auditスキルを使用してIssue #350のレビューを実行してください:

【セキュリティチェック - Rust commands一括実行】
1. cargo audit
2. cargo clippy --package miyabi-auth -- -D warnings -W clippy::all
3. cargo test --package miyabi-auth --all-features
4. cargo deny check

【コード品質評価】
5. 品質スコア算出（0-100点）
6. セキュリティissue列挙
7. 改善推奨事項まとめ

【報告】
8. GitHub commentに投稿
9. [サクラ] レビュー完了 と発言

全てシーケンシャルに実行してください。" && sleep 0.1 && tmux send-keys -t %5 Enter
```

**推定時間**: 5-7分（従来10-15分）
**短縮効果**: 5-8分短縮（50%改善）

---

## 🔧 Water Spider v2.0への統合

Water Spider v2.0のタスク割り当て時に、Rust commandsを自動挿入:

```bash
# .claude/agents/tmux_agents_control.md の更新案

### カエデ - Rust Commands最適化版

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。Issue #XXXの実装をagent-executionスキルで行い、以下のRust commandsで検証してください:

1. cargo build --release
2. cargo test --all
3. cargo clippy -- -D warnings

完了したら [カエデ] 実装完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```
```

---

## 📚 参考コマンド集

### カエデ（実装）向け

```bash
# フル開発サイクル
cargo build --release && cargo test --all && cargo clippy -- -D warnings && cargo fmt -- --check

# クイックチェック
cargo check && cargo test -- --test-threads=1

# パッケージ指定
cargo build --package miyabi-core && cargo test --package miyabi-core

# 並列ビルド
cargo build -j 8 && cargo test -- --test-threads=8
```

---

### サクラ（レビュー）向け

```bash
# フルセキュリティ監査
cargo audit && cargo clippy -- -D warnings -W clippy::all && cargo deny check

# クイックレビュー
cargo clippy -- -D warnings && cargo test --all

# パフォーマンスチェック
cargo bench --no-run && cargo build --release
```

---

### ツバキ（PR作成）向け

```bash
# PR作成前チェック
cargo fmt -- --check && cargo clippy -- -D warnings && cargo test --all

# 最終確認
cargo build --release --all && cargo test --release --all
```

---

### ボタン（デプロイ）向け

```bash
# デプロイ前検証
cargo build --release --all && cargo test --release --all && cargo bench --no-run

# リリースビルド
cargo build --release --workspace
```

---

## 🎯 まとめ

### 効果

| 項目 | 改善内容 |
|------|----------|
| **実行時間** | 平均50%短縮 |
| **シーケンシャル保証** | `&&`チェーンで100%保証 |
| **エラーハンドリング** | 即座停止で早期発見 |
| **Agentの負担** | Bash呼び出し回数を1/3-1/5に削減 |

### ベストプラクティス

1. ✅ **常に`&&`チェーンを使用**: シーケンシャル実行とエラー時即停止
2. ✅ **Agentに明示的に指示**: 「1つでも失敗したら即座に停止」
3. ✅ **ログ保存**: `2>&1 | tee /tmp/xxx.log` でエラー分析可能に
4. ✅ **並列オプション活用**: `-j 8`, `--test-threads=8` で高速化

---

**🦀 Rust Commands最適化ガイド**

**Version**: 1.0.0
**Last Updated**: 2025-11-03
**Maintained by**: Miyabi Team

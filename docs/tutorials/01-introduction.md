# チュートリアル: Miyabi入門

**🎯 このチュートリアルのゴール**: Miyabiを理解し、初めてのIssue処理を実行する

**対象**: Miyabiを初めて使う人

**所要時間**: 約15分

---

## 📚 この章で学ぶこと

1. ✅ Miyabiとは何か？
2. ✅ なぜMiyabiを使うのか？
3. ✅ インストール方法
4. ✅ 初めてのIssue処理
5. ✅ 次のステップ

---

## Miyabiとは？

### 一言で言うと

**Miyabi（雅）** は、GitHub IssueからProduction環境まで、開発プロセス全体を完全自動化するRust製フレームワークです。

### コンセプト

**雅（みやび）** = 優雅でシンプルな美しさ

複雑な開発プロセスを、たった1つのコマンドで実行できるように。

```bash
# これだけで、Issue → コード生成 → テスト → レビュー → PR → デプロイ
miyabi work-on 1
```

---

## なぜMiyabiを使うのか？

### 従来の開発プロセス

```
📝 Issue作成
  ↓ （あなたが手動で）
💻 要件分析・設計
  ↓ （あなたが手動で）
✍️ コード実装
  ↓ （あなたが手動で）
🧪 テスト作成
  ↓ （あなたが手動で）
🔍 コードレビュー
  ↓ （あなたが手動で）
📄 PR作成
  ↓ （あなたが手動で）
🚀 デプロイ
  ↓
✅ 完了

⏱️ 所要時間: 3時間〜2日
```

### Miyabiの開発プロセス

```
📝 Issue作成
  ↓
🤖 miyabi work-on 1
  ↓ （21個のAgentが自動実行）
✅ 完了

⏱️ 所要時間: 10-15分
```

---

### Miyabiの3つの強み

#### 1. ⚡ 圧倒的な速度

- **TypeScript → Rust移行**: 実行時間50%削減
- **並列実行**: Git Worktreeによる真の並列処理
- **10-15分**: Issue → PR作成まで

#### 2. 🛡️ 高い品質

- **83%**: 自動生成コードのテストカバレッジ
- **100点満点**: 品質スコアリング機能
- **735+**: テストケース数（全テスト合格）

#### 3. 🤖 完全自動化

- **21個のAgent**: 7つのCoding + 14のBusiness
- **53ラベル体系**: GitHub OSとしての状態管理
- **ゼロコンフリクト**: Worktreeベースの並列実行

---

## インストール

### 前提条件

以下がインストールされていることを確認してください：

```bash
# Rust (1.70+)
rustc --version

# Git (2.x)
git --version

# GitHub CLI
gh --version
```

---

### ステップ 1: Miyabiのインストール

#### Option A: Cargo経由（推奨）

```bash
# crates.io からインストール
cargo install miyabi-cli

# インストール確認
miyabi --version
```

#### Option B: ソースからビルド

```bash
# リポジトリをクローン
git clone https://github.com/ShunsukeHayashi/Miyabi.git
cd Miyabi

# ビルド
cargo build --release

# パスを通す
export PATH="$PWD/target/release:$PATH"

# 確認
miyabi --version
```

**期待される出力**:
```
miyabi 1.0.0
```

---

### ステップ 2: プロジェクトの初期化

#### 新規プロジェクトの場合

```bash
# 新しいプロジェクトを作成
miyabi init my-awesome-project

# プロジェクトに移動
cd my-awesome-project
```

#### 既存プロジェクトの場合

```bash
# 既存プロジェクトに移動
cd existing-project

# Miyabiを追加
miyabi install
```

---

### ステップ 3: 環境変数の設定

```bash
# GitHub Personal Access Tokenを取得
# https://github.com/settings/tokens
# 必要なスコープ: repo, workflow, write:packages

# 環境変数を設定
export GITHUB_TOKEN=ghp_your_token_here

# オプション: Anthropic API Key（高度な機能用）
export ANTHROPIC_API_KEY=sk-ant-your_key_here

# 確認
miyabi status
```

**期待される出力**:
```
✅ Miyabi Status

GitHub:
  ✅ トークン設定済み
  ✅ リポジトリ: your-org/your-repo
  ✅ ブランチ: main

Agent:
  ✅ 21個のAgent利用可能
  ✅ Worktree機能: 有効

準備完了！ 🚀
```

---

## 初めてのIssue処理

### ステップ 1: Issueを作成

```bash
# GitHub UIで作成するか、CLIで作成
gh issue create \
  --title "Add Hello World function" \
  --body "Hello Worldを返す関数を追加する" \
  --label "✨ type:feature,📥 state:pending"
```

**期待される出力**:
```
Created issue #1
https://github.com/your-org/your-repo/issues/1
```

---

### ステップ 2: Miyabiで自動処理

```bash
# Issue #1を処理
miyabi work-on 1
```

**期待される出力**:

```
🚀 Miyabi - Issue #1 を処理中...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 1: Issue分析
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔵 みつけるん (IssueAgent) 起動中...
  📖 Issue #1 を分析中...
  🏷️ ラベル推定: ✨ type:feature, ⚠️ priority:P2-Medium
  📊 複雑度: 低
  ⏱️  推定時間: 10分

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 2: タスク分解
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 しきるん (CoordinatorAgent) 起動中...
  ✂️ タスク分解中...
    Task 1: 関数実装（5分）
    Task 2: テスト作成（3分）
    Task 3: ドキュメント（2分）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 3: コード生成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟢 つくるん (CodeGenAgent) 起動中...
  📝 ファイル作成中: src/lib.rs
  📝 ファイル作成中: tests/hello_test.rs
  ✅ コード生成完了！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 4: 品質レビュー
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟢 めだまん (ReviewAgent) 起動中...
  🔍 cargo clippy: ✅ 警告なし
  🧪 cargo test: ✅ 全テスト合格
  📊 カバレッジ: 90%
  ⭐ 品質スコア: 95点 / 100点

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 5: PR作成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟢 かくちゃん (PRAgent) 起動中...
  📄 PR #2 を作成中...
  ✅ PR作成完了！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 完了！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Issue #1 → PR #2
📊 所要時間: 8分
⭐ 品質スコア: 95点

次のステップ:
  gh pr view 2      # PRを確認
  gh pr merge 2     # PRをマージ
```

---

### ステップ 3: PRを確認してマージ

```bash
# PRを確認
gh pr view 2

# PRをマージ
gh pr merge 2 --squash --delete-branch
```

---

## おめでとうございます！🎉

あなたは初めてのMiyabi Issue処理を完了しました！

**実行したこと**:
- ✅ Issue作成
- ✅ Miyabi自動処理（8分）
- ✅ PR作成・マージ

**Miyabiが自動でやったこと**:
- ✅ Issue分析
- ✅ タスク分解
- ✅ コード生成
- ✅ テスト作成
- ✅ 品質レビュー
- ✅ PR作成

---

## よくある質問

### Q1. エラーが出た場合は？

**ステップ1: ログを確認**
```bash
# 今日のログを確認
cat .ai/logs/$(date +%Y-%m-%d).md
```

**ステップ2: ステータス確認**
```bash
miyabi status
```

**ステップ3: トラブルシューティング**
```bash
# GitHubトークンを再設定
export GITHUB_TOKEN=ghp_your_token_here

# 再実行
miyabi work-on 1
```

---

### Q2. どのIssueがMiyabiで処理できる？

**処理可能なIssue**:
- ✅ 明確な要件が書かれている
- ✅ 適切なラベルが付いている（type:*, state:pending）
- ✅ 小〜中規模のタスク

**処理が難しいIssue**:
- ❌ 要件が曖昧
- ❌ ラベルがない
- ❌ 巨大すぎるタスク

**Tips**: 大きなIssueは複数の小さいIssueに分割しましょう。

---

### Q3. 生成されたコードは本番で使える？

**はい、ただし注意点があります**:

✅ **そのまま使える場合**:
- シンプルなCRUD API
- ユーティリティ関数
- テストコード

⚠️ **レビューが必要な場合**:
- セキュリティが重要な機能
- 複雑なビジネスロジック
- パフォーマンスが重要な箇所

**推奨**: Miyabiが生成したコードをベースに、人間がレビュー・調整する

---

## ベストプラクティス

### ✅ Do（推奨）

1. **明確なIssue記述**
   ```markdown
   ## 目的
   何を実現したいか明確に

   ## 仕様
   具体的な要件を箇条書き

   ## 受け入れ基準
   - [ ] 完了条件1
   - [ ] 完了条件2
   ```

2. **適切なラベル付与**
   ```bash
   # 必須
   --label "✨ type:feature"
   --label "📥 state:pending"

   # 推奨
   --label "⚠️ priority:P2-Medium"
   ```

3. **小さく分割**
   - 1 Issue = 1 機能
   - 推定時間: 30分以内

---

### ❌ Don't（避ける）

1. **曖昧なIssue**
   ```bash
   # ❌ NG
   --title "バグ修正"

   # ✅ OK
   --title "Fix: ログイン時の500エラー"
   ```

2. **ラベルなし**
   ```bash
   # ❌ NG: ラベルがない
   gh issue create --title "..." --body "..."

   # ✅ OK: ラベル付き
   gh issue create --title "..." --body "..." --label "type:bug,state:pending"
   ```

3. **巨大なIssue**
   ```bash
   # ❌ NG
   "ユーザー管理システム全体を実装"

   # ✅ OK: 分割する
   "Issue #1: ユーザー登録API"
   "Issue #2: ユーザーログインAPI"
   "Issue #3: プロフィール編集API"
   ```

---

## 次のステップ

### このチュートリアルで学んだこと ✅

- ✅ Miyabiとは何か
- ✅ インストール方法
- ✅ 初めてのIssue処理
- ✅ ベストプラクティス

### 次に学ぶこと

1. **[Agent基本操作](02-agent-basics.md)** - 21個のAgentの詳細
2. **[並列実行の実践](03-parallel-execution.md)** - 複数Issueの高速処理
3. **[Label Systemの基礎](04-label-basics.md)** - 53ラベル体系の活用

---

## 📚 参考リソース

### ドキュメント
- **[CLAUDE.md](../../CLAUDE.md)** - プロジェクト全体のコンテキスト
- **[Quick Start Guide](../.claude/QUICK_START.md)** - 3分で始めるMiyabi
- **[Troubleshooting](../.claude/TROUBLESHOOTING.md)** - トラブル対処法

### コミュニティ
- **GitHub**: https://github.com/ShunsukeHayashi/Miyabi
- **Discord**: https://discord.gg/Urx8547abS
- **Landing Page**: https://shunsukehayashi.github.io/Miyabi

---

**🚀 次のドキュメント**: [Agent基本操作](02-agent-basics.md)

---

🤖 Generated with Claude Code

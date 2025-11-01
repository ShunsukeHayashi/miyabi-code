# Codexセッション向けテスト指示

**送信元**: Claude Code (メインセッション)
**送信日時**: 2025-10-17
**優先度**: 高

---

## 📋 テスト目的

Codexセッションが`.claude/CODEX_SESSION_README.md`を正しく参照し、Miyabiプロジェクトで有効に機能することを確認します。

---

## 🎯 テスト実行手順

### ステップ1: コンテキストファイル確認

**指示**:
```
.claude/CODEX_SESSION_README.md を読んで、Miyabiプロジェクトの概要を説明してください。
以下を含めて：
1. プロジェクトの目的
2. 使用言語とバージョン
3. 主要コンポーネント（Agent Systemの数）
4. 基本的なCLIコマンド
```

**期待される応答**:
- 目的: 自律型AI開発フレームワーク
- 言語: Rust 2021 Edition
- Agent System: 21個（Coding 7個 + Business 14個）
- コマンド: `cargo build --release`, `./target/release/miyabi status`等

**判定基準**:
- ✅ PASS: 全4項目を正確に説明
- ⚠️ WARN: 一部情報が不正確
- ❌ FAIL: ファイルを参照できていない

---

### ステップ2: Rustコマンド実行

**指示**:
```
以下のコマンドを順次実行してください：

1. cargo --version
2. cargo build --release
3. 実行結果を報告
```

**期待される動作**:
- `cargo --version` でRustバージョンが表示される
- `cargo build --release` が実行される（成功/失敗問わず）
- 実行時間とエラー有無が報告される

**判定基準**:
- ✅ PASS: コマンドが実行され、結果が報告される
- ⚠️ WARN: ビルドエラーが発生するが、報告は正常
- ❌ FAIL: コマンドが実行できない

---

### ステップ3: Git Status確認

**指示**:
```
git status を実行し、以下を確認してください：
1. 現在のブランチ
2. リモートとの差分（何コミット先行しているか）
3. 未追跡ファイルのリスト
```

**期待される応答**:
- ブランチ: main
- リモート: origin/mainより11コミット先行
- 未追跡: `.claude/Skills/*`, `ai-partner-app/`, `docs/*_REPORT.md`

**判定基準**:
- ✅ PASS: 全情報を正確に報告
- ⚠️ WARN: 一部情報が不正確
- ❌ FAIL: git statusが実行できない

---

### ステップ4: ファイル構造理解

**指示**:
```
crates/ディレクトリ配下のクレートをリストアップし、各クレートの役割を簡潔に説明してください。
```

**期待される応答**:
- `miyabi-cli`: CLIツール（bin）
- `miyabi-agents`: Agent実装
- `miyabi-types`: コア型定義
- `miyabi-core`: 共通ユーティリティ
- `miyabi-github`: GitHub API統合
- `miyabi-worktree`: Git Worktree管理
- `miyabi-llm`: LLM統合
- `miyabi-potpie`: Potpie統合

**判定基準**:
- ✅ PASS: 全8クレートを正確に説明
- ⚠️ WARN: 一部クレートの説明が不正確
- ❌ FAIL: クレートを認識できない

---

### ステップ5: 報告プロトコル準拠

**指示**:
```
これまでのテスト結果を、`.claude/templates/reporting-protocol.md`に準拠した形式で報告してください。

報告者: Claude Code (AI Assistant) - Session: Codex
```

**期待される形式**:
```markdown
## 📋 Claude Code (Codex Session) からの作業報告

**報告者**: Claude Code (AI Assistant) - Session: Codex
**報告日時**: 2025-10-17
**セッション**: AI CLI統合テスト - Codexセッション

---

### ✅ 完了した作業

#### テスト1: コンテキストファイル確認
**結果**: [PASS/WARN/FAIL]
[詳細]

#### テスト2: Rustコマンド実行
**結果**: [PASS/WARN/FAIL]
[詳細]

#### テスト3: Git Status確認
**結果**: [PASS/WARN/FAIL]
[詳細]

#### テスト4: ファイル構造理解
**結果**: [PASS/WARN/FAIL]
[詳細]

---

### 📊 テスト結果サマリー

| テスト | 結果 | 備考 |
|--------|------|------|
| コンテキスト参照 | | |
| Rustコマンド | | |
| Git操作 | | |
| ファイル構造 | | |

**総合判定**: [PASS/WARN/FAIL]

---

**報告終了**
Claude Code (Codex Session)
```

**判定基準**:
- ✅ PASS: テンプレート形式に完全準拠
- ⚠️ WARN: 一部セクションが欠けている
- ❌ FAIL: テンプレートを使用していない

---

## 📊 テスト完了後の対応

### メインセッション（Claude Code）への報告

上記の報告書を作成したら、以下の方法でメインセッションに伝えてください：

1. **報告書を.claude/test-results/配下に保存**
   ```bash
   mkdir -p .claude/test-results
   # 報告書を .claude/test-results/codex-test-result.md に保存
   ```

2. **Git commit**
   ```bash
   git add .claude/test-results/codex-test-result.md
   git commit -m "test: Codex session integration test results"
   ```

3. **メインセッションが結果を確認**
   - Claude Codeメインセッションがcommitを認識
   - テスト結果を分析し、最適化を実施

---

## ⚠️ 注意事項

### 1. ネットワーク制限

ネットワーク制限により以下は実行不可能です：
- `gh auth login`
- GitHub API直接呼び出し
- NPMパッケージのインストール

これらのコマンドでエラーが発生しても、テスト失敗とはみなしません。

### 2. 環境変数

`.env`ファイルから環境変数を読み込む必要があります：
```bash
source .env
```

または `.claude/CODEX_SESSION_README.md` に記載された方法で設定してください。

### 3. 並列実行

メインセッション（Claude Code）が並行して作業している可能性があります。
以下の操作は避けてください：
- 大規模なファイル編集
- 複数ファイルの同時変更
- Git pushコマンド（メインセッションが実行）

---

## 🔗 参考ドキュメント

- **テストプラン**: `.claude/docs/AI_CLI_INTEGRATION_TEST_PLAN.md`
- **Codex README**: `.claude/CODEX_SESSION_README.md`
- **報告プロトコル**: `.claude/templates/reporting-protocol.md`
- **プロジェクトコンテキスト**: `CLAUDE.md`, `AGENTS.md`

---

## 🎯 テスト成功の定義

### 最小要件（PASS基準）

以下のすべてを満たすこと：
- ✅ コンテキストファイルを正しく参照できる
- ✅ cargoコマンドが実行できる
- ✅ git statusが実行できる
- ✅ 報告プロトコルに準拠した報告書を作成できる

### 理想的な結果

上記に加えて：
- ✅ 全8クレートを正確に理解
- ✅ 未追跡ファイルの適切な判断
- ✅ 実行時間やエラー内容の詳細な報告

---

**テスト実行をお願いします。結果を楽しみにしています！**

**送信元**: Claude Code (メインセッション)

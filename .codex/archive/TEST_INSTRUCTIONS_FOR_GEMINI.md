# Gemini CLI向けテスト指示

**送信元**: Codex (メインセッション)
**送信日時**: 2025-10-17
**優先度**: 高

---

## 📋 テスト目的

Gemini CLIが`GEMINI.md`を正しく参照し、@file記法でプロジェクトファイルにアクセスし、Miyabiプロジェクトで有効に機能することを確認します。

---

## 🎯 テスト実行手順

### 準備: Gemini CLI起動

```bash
cd /Users/a003/dev/miyabi-private
gemini
```

---

### テスト1: GEMINI.md参照

**Gemini CLI内で実行**:
```
@GEMINI.md このファイルの内容を要約してください。特に以下を含めて：
1. プロジェクトの目的
2. 使用言語
3. Agent Systemの数
4. よく使うコマンド
```

**期待される応答**:
- 目的: 自律型AI開発フレームワーク
- 言語: Rust 2021 Edition
- Agent: 21個（Coding 7 + Business 14）
- コマンド: `cargo build --release`, `./target/release/miyabi status`等

**判定基準**:
- ✅ PASS: 全4項目を正確に説明
- ⚠️ WARN: 一部情報が不正確
- ❌ FAIL: ファイルを参照できていない

---

### テスト2: 複数ファイル参照

**Gemini CLI内で実行**:
```
@GEMINI.md と @CLAUDE.md を比較してください。
GEMINIファイルは簡潔版で、CLAUDEファイルは詳細版という違いを理解できていますか？
```

**期待される応答**:
- GEMINI.md: クイックリファレンス、Gemini CLI専用
- CLAUDE.md: 完全なプロジェクトコンテキスト、開発者向け詳細
- 共通情報: Agent System、Rustバージョン、基本コマンド

**判定基準**:
- ✅ PASS: 両ファイルの違いと共通点を正確に説明
- ⚠️ WARN: 一部比較が不正確
- ❌ FAIL: 複数ファイル参照が機能しない

---

### テスト3: ディレクトリ構造理解

**Gemini CLI内で実行**:
```
@crates/ このディレクトリの構造を説明してください。
各クレートの名前と役割を簡潔にリストアップしてください。
```

**期待される応答**:
- `miyabi-cli/`: CLIツール（bin）
- `miyabi-agents/`: Agent実装
- `miyabi-types/`: コア型定義
- `miyabi-core/`: 共通ユーティリティ
- `miyabi-github/`: GitHub API統合
- `miyabi-worktree/`: Git Worktree管理
- `miyabi-llm/`: LLM統合
- `miyabi-potpie/`: Potpie統合

**判定基準**:
- ✅ PASS: 全8クレートを認識・説明
- ⚠️ WARN: 一部クレートの説明が不正確
- ❌ FAIL: ディレクトリを認識できない

---

### テスト4: Rustファイル参照

**Gemini CLI内で実行**:
```
@crates/miyabi-cli/src/main.rs このファイルのmain関数を要約してください。
何をしているファイルか説明してください。
```

**期待される応答**:
- Miyabi CLI binaryのエントリーポイント
- clapを使ったCLI引数パース
- サブコマンド処理（status, agent, etc.）
- 環境変数読み込み

**判定基準**:
- ✅ PASS: main関数の役割を正確に説明
- ⚠️ WARN: 一部説明が不正確
- ❌ FAIL: Rustファイルを参照できない

---

### テスト5: インタラクティブ質問応答

**Gemini CLI内で実行**:
```
Miyabiプロジェクトで新しいAgentを追加したい場合、どのディレクトリにファイルを作成すればいいですか？
手順も簡潔に教えてください。
```

**期待される応答**:
1. `crates/miyabi-agents/src/`に新しいRustファイル作成
2. `BaseAgent` traitを実装
3. `.codex/agents/specs/`にAgent仕様ドキュメント追加
4. `.codex/agents/prompts/`に実行プロンプト追加（オプション）

**判定基準**:
- ✅ PASS: 正確な手順を説明
- ⚠️ WARN: 手順が不完全だが概ね正確
- ❌ FAIL: 手順が不正確または説明できない

---

### テスト6: トラブルシューティング理解

**Gemini CLI内で実行**:
```
@GEMINI.md の「Common Issues」セクションを読んで、
「GITHUB_TOKEN not set」エラーの解決方法を教えてください。
```

**期待される応答**:
- 解決策1: `export GITHUB_TOKEN=ghp_xxx`
- 解決策2: `.env`ファイルに記載
- 確認方法: `echo $GITHUB_TOKEN`

**判定基準**:
- ✅ PASS: 正確な解決方法を説明
- ⚠️ WARN: 一部手順が不正確
- ❌ FAIL: トラブルシューティング情報を参照できない

---

## 📊 テスト結果保存

### /copyコマンドで結果をコピー

Gemini CLI内で以下を実行：
```
/copy
```

これにより、最後の出力（テスト結果サマリー）がクリップボードにコピーされます。

### ファイルに保存

ターミナルで以下を実行：
```bash
mkdir -p .codex/test-results
pbpaste > .codex/test-results/gemini-test-result.md
```

---

## 📋 テスト結果報告形式

以下の形式で結果をまとめてください（Gemini CLI内で作成）:

```markdown
## Gemini CLI テスト結果

### テスト実行情報
- **実行日時**: 2025-10-17
- **Gemini CLIバージョン**: 0.9.0
- **プロジェクト**: Miyabi

---

### テスト1: GEMINI.md参照
**結果**: [PASS/WARN/FAIL]
**詳細**: [説明]

### テスト2: 複数ファイル参照
**結果**: [PASS/WARN/FAIL]
**詳細**: [説明]

### テスト3: ディレクトリ構造理解
**結果**: [PASS/WARN/FAIL]
**詳細**: [説明]

### テスト4: Rustファイル参照
**結果**: [PASS/WARN/FAIL]
**詳細**: [説明]

### テスト5: インタラクティブ質問応答
**結果**: [PASS/WARN/FAIL]
**詳細**: [説明]

### テスト6: トラブルシューティング理解
**結果**: [PASS/WARN/FAIL]
**詳細**: [説明]

---

### 📊 テスト結果サマリー

| テスト | 結果 | 備考 |
|--------|------|------|
| GEMINI.md参照 | | |
| 複数ファイル参照 | | |
| ディレクトリ構造 | | |
| Rustファイル参照 | | |
| 質問応答 | | |
| トラブルシューティング | | |

**総合判定**: [PASS/WARN/FAIL]

---

**テスト終了**
Gemini CLI
```

---

## 🎯 テスト完了後の対応

### 結果ファイルをGit commit

```bash
cd /Users/a003/dev/miyabi-private
git add .codex/test-results/gemini-test-result.md
git commit -m "test: Gemini CLI integration test results"
```

### メインセッション（Codex）への通知

メインセッションが自動的にcommitを認識し、テスト結果を分析します。

---

## ⚠️ 注意事項

### 1. ファイル参照の制限

Gemini CLIでは以下の制限があります：
- 大きなファイル（1000行以上）は一部のみ参照推奨
- バイナリファイルは参照不可
- ディレクトリ全体を一度に読み込むのは避ける

**推奨される使い方**:
```
# ❌ 避けるべき
@crates/ すべてのファイルを読み込んで分析

# ✅ 推奨
@crates/ ディレクトリ構造を説明
@crates/miyabi-cli/src/main.rs:1-50 先頭50行を要約
```

### 2. インタラクティブモードの活用

Gemini CLIはインタラクティブ対話に強みがあります：
- 1つのコマンドごとに結果を確認
- 追加質問で深掘り
- /copyで重要な出力を保存

### 3. VS Code統合（オプション）

VS Code統合ターミナルで実行すると、開いているファイルのコンテキストを自動認識します。

---

## 🔗 参考ドキュメント

- **テストプラン**: `.codex/docs/AI_CLI_INTEGRATION_TEST_PLAN.md`
- **Gemini CLI指示書**: `.codex/gemini-instructions.md`
- **プロジェクトコンテキスト**: `GEMINI.md`
- **AI CLI完全ガイド**: `.codex/docs/AI_CLI_COMPLETE_GUIDE.md`

---

## 🎯 テスト成功の定義

### 最小要件（PASS基準）

以下のすべてを満たすこと：
- ✅ GEMINI.mdを正しく参照できる
- ✅ @file記法でファイルにアクセスできる
- ✅ ディレクトリ構造を理解できる
- ✅ インタラクティブ質問に正確に答えられる

### 理想的な結果

上記に加えて：
- ✅ 複数ファイルを同時参照できる
- ✅ Rustファイルの内容を理解できる
- ✅ トラブルシューティング情報を活用できる
- ✅ /copyコマンドで結果を効率的に保存できる

---

## 💡 Gemini CLIの強み

このテストで確認したいGemini CLIの強み：
1. **即座の質問応答**: 対話的に追加質問できる
2. **@file記法**: ファイル参照が簡潔
3. **VS Code統合**: コンテキスト自動認識
4. **軽量**: Codexよりも起動・応答が高速

これらが Miyabi プロジェクトで有効に機能することを確認してください。

---

**テスト実行をお願いします。Gemini CLIの力を発揮してください！**

**送信元**: Codex (メインセッション)

# Gemini CLI への指示

**送信者**: Codex (AI Assistant)
**送信日時**: 2025-10-17
**優先度**: 中

---

## 📝 指示内容

### タスク概要

Gemini CLIを使用して、以下のクイックタスクを実行してください：

1. 未追跡ファイルの内容確認
2. Skills関連ファイルの要約
3. レポートファイルの分析
4. .gitignore推奨事項の提案

---

## 🎯 具体的なタスク

### タスク1: Skills関連ファイルの確認

**実行コマンド**（Gemini CLI内で実行）:
```
@.codex/Skills/content-marketing-strategy/ このディレクトリの内容を要約して。重要なファイルか一時ファイルか判断して。
```

**同様に確認**:
- `.codex/Skills/growth-analytics-dashboard/`
- `.codex/Skills/market-research-analysis/`
- `.codex/Skills/sales-crm-management/`

**期待する出力**:
- 各Skillsディレクトリの目的
- 含まれるファイル一覧
- コミット対象にすべきか、.gitignoreに追加すべきか

---

### タスク2: レポートファイルの分析

**実行コマンド**:
```
@docs/DEBUG_SESSION_REPORT.md このレポートの内容を要約して。重要な情報が含まれているか判断して。
```

**同様に確認**:
- `@docs/PERFORMANCE_REPORT.md`
- `@docs/SKILLS_TEST_COMPLETE_REPORT.md`

**期待する出力**:
- 各レポートの主要内容
- 保存すべき重要情報の有無
- コミット推奨 or 削除推奨の判断

---

### タスク3: ai-partner-app/ ディレクトリの調査

**実行コマンド**:
```
@ai-partner-app/ このディレクトリの構造を確認して。Miyabiプロジェクトの一部か、独立したプロジェクトか判断して。
```

**期待する出力**:
- ディレクトリ構造
- package.jsonやCargo.tomlの有無
- プロジェクトの関連性
- 処理方針（統合 or 分離 or 削除）

---

### タスク4: .gitignore推奨事項の作成

**実行コマンド**:
```
現在の未追跡ファイルを分析して、.gitignoreに追加すべきパターンを提案して。以下のファイル・ディレクトリを考慮して：

- .codex/Skills/*
- ai-partner-app/
- docs/*_REPORT.md

プロジェクトの性質（Rust + TypeScript + AI Agents）を考慮した.gitignoreパターンを提案してください。
```

**期待する出力**:
```gitignore
# AI Skills (テスト用)
.codex/Skills/*/temp/
.codex/Skills/*/cache/

# 一時レポート
docs/*_REPORT.md
docs/debug-*.md

# アプリケーション固有
ai-partner-app/node_modules/
ai-partner-app/dist/
```

---

## 📊 出力形式

各タスクの結果を以下の形式でまとめてください：

```markdown
## Gemini CLI 分析結果

### 1. Skills関連ファイル

**content-marketing-strategy/**:
- 目的: [要約]
- 重要度: [高/中/低]
- 推奨: [コミット/削除/.gitignore]

### 2. レポートファイル

**DEBUG_SESSION_REPORT.md**:
- 内容: [要約]
- 重要情報: [有/無]
- 推奨: [保存/削除]

### 3. ai-partner-app/

- 種類: [Miyabi統合/独立プロジェクト/テスト]
- 推奨: [統合/分離/削除]

### 4. .gitignore推奨パターン

```gitignore
[提案されたパターン]
```

---

**分析終了**
Gemini CLI
```

---

## 🚀 実行手順

### ステップ1: Gemini CLI起動

```bash
cd /Users/a003/dev/miyabi-private
gemini
```

### ステップ2: コンテキスト設定

Gemini CLI起動後、以下を実行：

```
プロジェクト情報:
- 名前: Miyabi
- 言語: Rust 2021 Edition + TypeScript
- 目的: 自律型AI開発フレームワーク
- GitHub: ShunsukeHayashi/miyabi-private

現在のタスク: 未追跡ファイルの整理とGit管理の最適化
```

### ステップ3: タスク実行

上記「具体的なタスク」のコマンドを順次実行

### ステップ4: 結果をファイルに保存

Gemini CLI内で：

```
/copy
```

その後、ターミナルで：

```bash
# クリップボードからファイルに保存
pbpaste > .codex/gemini-analysis-results.md
```

---

## ⚠️ 注意事項

1. **ファイル参照構文**
   - Gemini CLIでは`@path/to/file`で参照
   - 相対パスはプロジェクトルートから

2. **インタラクティブモード**
   - 1つのコマンドごとに結果を確認
   - 必要に応じて追加質問

3. **VS Code統合**
   - VS Code統合ターミナルで実行すると、コンテキスト認識が向上

4. **出力のコピー**
   - 重要な分析結果は`/copy`でクリップボードにコピー
   - ファイルに保存して後で参照可能

---

## 🔗 関連ドキュメント

- **Gemini CLI使い方**: `.codex/docs/AI_CLI_COMPLETE_GUIDE.md` (Section 2)
- **比較ガイド**: `.codex/docs/AI_CLI_COMPARISON.md`
- **プロジェクトコンテキスト**: `CLAUDE.md`

---

**指示終了**
Codex

**この指示を基に、ターミナルでGemini CLIを起動して実行してください。**

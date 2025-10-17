# AI CLI統合テストプラン - Codex × Gemini CLI × Claude Code

## 概要

このドキュメントは、Miyabiプロジェクトで3つのAI CLIツール（Claude Code、Codex、Gemini CLI）が正しく連携動作することを確認するためのテストプランです。

**目的**: 各AI CLIツールがMiyabiプロジェクトのコンテキストを正確に理解し、有効に機能することを検証する。

**実行者**: Claude Code (メインセッション)
**対象セッション**: Codex (別スレッド)、Gemini CLI (別プロセス)

---

## 🎯 テスト目標

1. **Codexセッション**: AGENTS.md/CLAUDE.mdを参照し、Miyabiコマンドを実行できる
2. **Gemini CLI**: @file記法でファイル参照し、プロジェクト構造を理解できる
3. **相互連携**: 各AI CLIが他のセッションの成果物を認識・活用できる

---

## 📋 Phase 1: Codexセッション動作確認

### テスト1.1: コンテキストファイル参照

**目的**: CodexがAGENTS.md/CLAUDE.mdを正しく参照できるか確認

**Codexへの指示**:
```markdown
Miyabiプロジェクトの概要を教えてください。以下の情報を含めて：
1. プロジェクトの目的
2. 使用言語（Rustバージョン含む）
3. 主要なコンポーネント（Agent System等）
4. CLIコマンドの基本的な使い方
```

**期待される応答**:
- Rust 2021 Editionと記載
- 21個のAgent（Coding: 7個、Business: 14個）と記載
- `miyabi init`, `miyabi status`, `miyabi agent run`等のコマンド説明
- GitHub OS統合について言及

**判定基準**:
- ✅ PASS: 上記4点すべてを正確に説明
- ❌ FAIL: 情報が不正確、または古い情報を参照

---

### テスト1.2: Rustコマンド実行

**目的**: Codexがcargoコマンドを正しく実行できるか確認

**Codexへの指示**:
```markdown
Miyabiプロジェクトのビルドとテストを実行してください。
以下の順序で：
1. cargo build --release
2. cargo test --all
3. 結果を報告
```

**期待される動作**:
- `cargo build --release` が成功
- `cargo test --all` が実行される（一部失敗は許容）
- 実行時間とエラー数を報告

**判定基準**:
- ✅ PASS: コマンドが実行され、結果が報告される
- ⚠️ WARN: テストの一部が失敗するが、報告は正常
- ❌ FAIL: コマンドが実行されない、または結果が報告されない

---

### テスト1.3: Git操作

**目的**: Codexがgit statusを確認し、未追跡ファイルを認識できるか

**Codexへの指示**:
```markdown
現在のgit statusを確認し、未追跡ファイルをリストアップしてください。
各ファイル/ディレクトリについて、コミット対象にすべきか判断してください。
```

**期待される応答**:
- `.claude/Skills/*` - コミット対象
- `ai-partner-app/` - コミット対象
- `docs/*_REPORT.md` - コミット対象

**判定基準**:
- ✅ PASS: 全未追跡ファイルを認識し、適切な判断
- ⚠️ WARN: 一部ファイルの判断が不正確
- ❌ FAIL: 未追跡ファイルを認識できない

---

### テスト1.4: 報告プロトコル準拠

**目的**: Codexが報告プロトコルテンプレートを使用できるか確認

**Codexへの指示**:
```markdown
これまでのテスト結果を、`.claude/templates/reporting-protocol.md`のテンプレートに従って報告してください。
```

**期待される応答形式**:
```markdown
## 📋 Claude Code (Codex Session) からの作業報告

**報告者**: Claude Code (AI Assistant) - Session: Codex
**報告日時**: 2025-10-17
**セッション**: AI CLI統合テスト実行

---

### ✅ 完了した作業
[テスト結果]

---

**報告終了**
Claude Code (Codex Session)
```

**判定基準**:
- ✅ PASS: テンプレート形式に完全準拠
- ⚠️ WARN: 一部セクションが欠けている
- ❌ FAIL: テンプレートを使用していない

---

## 📋 Phase 2: Gemini CLIセッション動作確認

### テスト2.1: ファイル参照（@file記法）

**目的**: Gemini CLIが@file記法でファイルを正しく参照できるか確認

**Gemini CLIへの指示**:
```bash
cd /Users/a003/dev/miyabi-private
gemini

# Gemini CLI内で実行
@CLAUDE.md このファイルの内容を要約してください。特に「Agent System」セクションに注目して。
```

**期待される応答**:
- プロジェクト概要の要約
- 21個のAgent（Coding 7個、Business 14個）の記載
- Git Worktree並列実行アーキテクチャの説明

**判定基準**:
- ✅ PASS: ファイル内容を正確に要約
- ⚠️ WARN: 一部情報が欠落しているが概ね正確
- ❌ FAIL: ファイルを参照できない、または内容が不正確

---

### テスト2.2: 複数ファイル参照

**目的**: Gemini CLIが複数ファイルを同時参照できるか確認

**Gemini CLIへの指示**:
```
@CLAUDE.md と @AGENTS.md を比較して、共通する情報と異なる情報を教えてください。
```

**期待される応答**:
- 共通: Agent System、Rust 2021 Edition等
- 差異: CLAUDE.mdは開発者向け、AGENTS.mdはより詳細

**判定基準**:
- ✅ PASS: 両ファイルを正確に比較
- ⚠️ WARN: 一部比較が不正確
- ❌ FAIL: 複数ファイル参照が機能しない

---

### テスト2.3: ディレクトリ構造理解

**目的**: Gemini CLIがプロジェクト構造を理解できるか確認

**Gemini CLIへの指示**:
```
@crates/ このディレクトリの構造を説明してください。各クレートの役割も含めて。
```

**期待される応答**:
- `miyabi-cli`: CLIツール（bin）
- `miyabi-agents`: Agent実装
- `miyabi-types`: コア型定義
- `miyabi-core`: 共通ユーティリティ
- その他のクレート

**判定基準**:
- ✅ PASS: 全8クレートを正確に説明
- ⚠️ WARN: 一部クレートの説明が不正確
- ❌ FAIL: ディレクトリ構造を理解できない

---

### テスト2.4: インタラクティブ質問応答

**目的**: Gemini CLIが対話的に質問に答えられるか確認

**Gemini CLIへの指示**:
```
Miyabiプロジェクトで新しいAgentを追加したい場合、どのファイルを編集すればいいですか？
手順を教えてください。
```

**期待される応答**:
1. `crates/miyabi-agents/src/`に新しいファイル作成
2. `BaseAgent` traitを実装
3. `#[cfg(test)]`でテスト追加
4. ドキュメント追加（`.claude/agents/specs/`）

**判定基準**:
- ✅ PASS: 正確な手順を説明
- ⚠️ WARN: 手順が不完全だが概ね正確
- ❌ FAIL: 手順が不正確または説明できない

---

## 📋 Phase 3: Codex用コンテキスト最適化

### 最適化3.1: .claude/settings.json調整

**課題**: Codexセッションで特定のhooksが不要な可能性

**対応**:
- `.claude/settings.local.json`でCodexセッション専用設定を作成
- 軽量化されたhooks設定

**作成ファイル**: `.claude/settings.local.json`
```json
{
  "hooks": {
    "UserPromptSubmit": [],
    "SessionStart": [
      {
        "command": "echo '🔧 Codex Session Started' && git status --short",
        "description": "Show git status on Codex session start"
      }
    ]
  }
}
```

---

### 最適化3.2: Codex専用README作成

**課題**: CodexがMiyabiプロジェクトの概要を素早く把握する必要

**対応**: `.claude/CODEX_SESSION_README.md`作成

**内容**:
- プロジェクト概要（簡潔版）
- よく使うコマンド
- ファイル構造（主要ディレクトリのみ）
- トラブルシューティング（頻出3-5項目）

---

### 最適化3.3: Codex実行スクリプト

**課題**: Codexから直接miyabiコマンドを実行する際の環境変数設定

**対応**: `.claude/scripts/codex-miyabi.sh`作成

```bash
#!/bin/bash
# Codex Session - Miyabi Command Wrapper

# Load .env if exists
if [[ -f .env ]]; then
  source .env
fi

# Execute miyabi command
./target/release/miyabi "$@"
```

---

## 📋 Phase 4: Gemini CLI用コンテキスト作成

### 作成4.1: GEMINI.md（プロジェクトルート）

**目的**: Gemini CLIがプロジェクトを理解するための簡潔なコンテキスト

**ファイル**: `/Users/a003/dev/miyabi-private/GEMINI.md`

**内容**:
```markdown
# Miyabi Project - Gemini CLI Context

## Quick Info
- **Language**: Rust 2021 Edition
- **Purpose**: Autonomous AI development framework
- **Repository**: ShunsukeHayashi/miyabi-private

## Quick Commands
```bash
# Build
cargo build --release

# Test
cargo test --all

# Run CLI
./target/release/miyabi status
```

## File Structure
```
crates/          # Rust workspace (8 crates)
.claude/         # Claude Code configuration
docs/            # Documentation
```

## Common Issues
1. **GITHUB_TOKEN not set**: `export GITHUB_TOKEN=ghp_xxx`
2. **Build fails**: `cargo clean && cargo build`
3. **Tests fail**: Check `.env` file

## Agent System
- 21 Agents total (7 Coding + 14 Business)
- See: `.claude/agents/` for details

## For More Details
- Developer guide: `CLAUDE.md`
- Agent guide: `AGENTS.md`
- Quick start: `QUICKSTART-JA.md`
```

---

### 作成4.2: Gemini CLI用エイリアス

**目的**: Gemini CLIでよく使うコマンドを短縮

**ファイル**: `.claude/gemini-aliases.sh`

```bash
#!/bin/bash
# Gemini CLI Aliases for Miyabi Project

# Source this file in your shell: source .claude/gemini-aliases.sh

alias gm-status='gemini "@git status の結果を要約して"'
alias gm-build='gemini "@cargo build の最適な方法を提案して"'
alias gm-test='gemini "@cargo test の結果を分析して"'
alias gm-agent='gemini "@.claude/agents/ 配下のAgentをリストアップして"'
```

---

## 📋 Phase 5: 統合テスト

### テスト5.1: 3セッション並行実行

**シナリオ**: 同一プロジェクトで3つのAI CLIを並行使用

**実行手順**:
1. **Claude Code（このセッション）**: AGENTS.md編集
2. **Codex（別ターミナル）**: cargo test実行
3. **Gemini CLI（別ターミナル）**: ファイル分析

**期待される動作**:
- 各セッションが独立して動作
- ファイル競合が発生しない
- 各セッションが他の成果物を認識

**判定基準**:
- ✅ PASS: 3セッションすべてが正常動作
- ⚠️ WARN: 一部競合が発生するが回復可能
- ❌ FAIL: 重大な競合または動作停止

---

### テスト5.2: 相互参照テスト

**シナリオ**: 各AI CLIが他のセッションの出力を参照

**実行手順**:
1. **Claude Code**: ドキュメント作成 → `.claude/docs/NEW_FEATURE.md`
2. **Codex**: 上記ファイルを参照してコード実装提案
3. **Gemini CLI**: Codexの提案を要約

**期待される動作**:
- Codexが新規ドキュメントを参照
- Gemini CLIがCodexの提案を理解

**判定基準**:
- ✅ PASS: 相互参照が正常に機能
- ⚠️ WARN: 一部情報が欠落するが概ね機能
- ❌ FAIL: 相互参照が機能しない

---

### テスト5.3: 報告書統合

**シナリオ**: 各AI CLIの報告書を1つに統合

**実行手順**:
1. **Claude Code**: テスト結果報告作成
2. **Codex**: 報告プロトコル準拠で追加報告
3. **Gemini CLI**: 両報告を要約

**期待される出力**:
```markdown
## 📊 AI CLI統合テスト結果サマリー

### Claude Code
- AGENTS.md編集: ✅ 完了
- ドキュメント作成: ✅ 完了

### Codex
- cargo test実行: ✅ 成功
- 報告書作成: ✅ 完了

### Gemini CLI
- ファイル分析: ✅ 完了
- 統合要約: ✅ 完了

**総合判定**: ✅ PASS
```

**判定基準**:
- ✅ PASS: 統合報告が作成される
- ⚠️ WARN: 一部情報が欠落
- ❌ FAIL: 統合が機能しない

---

## 📋 Phase 6: ドキュメント更新

### 更新6.1: AI_CLI_COMPLETE_GUIDE.md

**追加セクション**:
- 「Codexセッション特有の設定」
- 「Gemini CLIコンテキストファイル」
- 「テスト結果に基づくトラブルシューティング」

---

### 更新6.2: トラブルシューティング追加

**AI_CLI_COMPARISON.md**に追加:

```markdown
### Codex特有の問題

#### 問題: Codexがcargoコマンドを実行できない
**原因**: PATHに`~/.cargo/bin`が含まれていない
**解決策**:
```bash
export PATH="$HOME/.cargo/bin:$PATH"
source .claude/scripts/codex-miyabi.sh
```

#### 問題: Codexが.envを読み込まない
**原因**: セッション起動時に.envが読み込まれていない
**解決策**: `.claude/scripts/codex-miyabi.sh`を使用

### Gemini CLI特有の問題

#### 問題: @fileがRustファイルを正しく参照できない
**原因**: ファイルサイズが大きすぎる
**解決策**: 特定の関数のみを参照
```
@crates/miyabi-cli/src/main.rs:1-50 main関数を説明して
```

#### 問題: Gemini CLIがプロジェクトコンテキストを理解しない
**原因**: GEMINI.mdが存在しない
**解決策**: `GEMINI.md`をプロジェクトルートに作成
```

---

## 📊 テスト実行記録

### 実行日時
- **開始**: 2025-10-17 [時刻]
- **完了**: 2025-10-17 [時刻]

### 実行者
- **メインセッション**: Claude Code
- **Codexセッション**: [実行者名]
- **Gemini CLIセッション**: [実行者名]

### 結果サマリー

| Phase | Test | Status | Notes |
|-------|------|--------|-------|
| Phase 1 | 1.1 コンテキスト参照 | | |
| Phase 1 | 1.2 Rustコマンド | | |
| Phase 1 | 1.3 Git操作 | | |
| Phase 1 | 1.4 報告プロトコル | | |
| Phase 2 | 2.1 ファイル参照 | | |
| Phase 2 | 2.2 複数ファイル参照 | | |
| Phase 2 | 2.3 ディレクトリ構造 | | |
| Phase 2 | 2.4 対話的質問 | | |
| Phase 5 | 5.1 並行実行 | | |
| Phase 5 | 5.2 相互参照 | | |
| Phase 5 | 5.3 報告書統合 | | |

### 総合判定
- [ ] ✅ PASS - 全テスト成功
- [ ] ⚠️ WARN - 一部テスト失敗、使用可能
- [ ] ❌ FAIL - 重大な問題、修正必要

---

## 🔗 関連ドキュメント

- **AI CLI完全ガイド**: `.claude/docs/AI_CLI_COMPLETE_GUIDE.md`
- **AI CLI比較**: `.claude/docs/AI_CLI_COMPARISON.md`
- **報告プロトコル**: `.claude/templates/reporting-protocol.md`
- **Gemini CLI指示書**: `.claude/gemini-instructions.md`

---

**テストプランバージョン**: v1.0.0
**最終更新**: 2025-10-17
**作成者**: Claude Code

# Stream Deck - Claude Code Integration

**Last Updated**: 2025-10-26

Stream DeckボタンからClaude Codeのコマンドを直接実行できるようにする統合スクリプト集です。

---

## 📁 Directory Structure

```
tools/stream-deck/
├── README.md                    # このファイル
├── 05-send-to-claude.sh        # 🔧 コアスクリプト（全ボタンが依存）
│
├── 01-next.sh                  # ▶️  Next
├── 02-continue.sh              # ⏩ Continue
├── 03-fix.sh                   # 🔧 Fix & Test
├── 04-help.sh                  # ❓ Help
│
├── 10-commit.sh                # 📝 Git Commit
├── 11-pr.sh                    # 🚀 Create PR
│
├── 20-voice-on.sh              # 🔊 Voice Command ON
├── 21-zundamon-mode.sh         # 🎤 Zundamon Reading Mode
│
├── 25-agent-run.sh             # 🤖 Agent Run (latest Issue)
├── 26-infinity-sprint.sh       # ♾️  Infinity Sprint Launch
│
└── 30-infinity.sh              # 🌀 Infinity Mode (レガシー)
```

---

## 🎯 Core Script: `05-send-to-claude.sh`

**全てのボタンスクリプトが依存するコアスクリプト**

### 機能

1. **メッセージをクリップボードにコピー**
2. **VS Codeをアクティブ化**
3. **Claude Codeを起動** (`Cmd+L`)
4. **メッセージを貼り付け** (`Cmd+V`)
5. **送信** (Enter)
6. **リトライ機構** (最大2回)
7. **ログ記録** (`/tmp/stream-deck-messages.log`)

### 使用方法

```bash
# 基本使用
./05-send-to-claude.sh "Your message here"

# 例1: 通常メッセージ送信
./05-send-to-claude.sh "Next"

# 例2: スラッシュコマンド送信
./05-send-to-claude.sh "/voicevox \"やぁやぁ！\" 3 1.2"

# 例3: Agent実行コマンド
./05-send-to-claude.sh "/agent-run coordinator --issue 270"
```

### 技術詳細

**AppleScript使用**:
```bash
osascript -e 'tell application "Visual Studio Code" to activate' \
          -e 'delay 1.2' \
          -e 'tell application "System Events" to keystroke "l" using command down' \
          -e 'delay 1.0' \
          -e 'tell application "System Events" to keystroke "v" using command down' \
          -e 'delay 0.6' \
          -e 'tell application "System Events" to key code 36'
```

**遅延設定**:
- アクティベーション後: `1.2秒`
- Cmd+L後: `1.0秒`
- 貼り付け後: `0.6秒`

**リトライ機構**:
- 最大リトライ数: 2回
- リトライ間隔: 1秒

---

## 📋 Basic Buttons (01-04)

### 01-next.sh - Next ボタン
```bash
./01-next.sh
# → "Next" を送信
```

### 02-continue.sh - Continue ボタン
```bash
./02-continue.sh
# → "Continue" を送信
```

### 03-fix.sh - Fix & Test ボタン
```bash
./03-fix.sh
# → "Fix the build errors and make sure all tests pass" を送信
```

### 04-help.sh - Help ボタン
```bash
./04-help.sh
# → "Help" を送信
```

---

## 🔊 Voice Commands (20-21)

### 20-voice-on.sh - Voice Command ON

**機能**: VOICEVOX音声システムを起動

```bash
./20-voice-on.sh
```

**実行内容**:
```bash
/voicevox "やぁやぁ！ずんだもんなのだ！音声システムが起動したのだ！" 3 1.2
```

**話者ID**: 3 (ずんだもん)
**速度**: 1.2倍速

### 21-zundamon-mode.sh - Zundamon Reading Mode

**機能**: Infinity Sprintログ監視 + 音声通知モード起動

```bash
./21-zundamon-mode.sh
```

**実行内容**:
```bash
/watch-sprint
```

**音声通知内容**:
- Sprint開始: "スプリントが始まるのだ！"
- タスク成功: "やったのだ！完了したのだ！"
- タスク失敗: "失敗したのだ！でも諦めないのだ！"
- 全完了: "全部終わったのだ！お疲れ様なのだ！"

---

## 🤖 Agent Commands (25-26)

### 25-agent-run.sh - Agent Run (Latest Issue)

**機能**: 最新の未処理Issue (`🤖agent-execute`ラベル付き) に対してCoordinatorAgentを実行

```bash
./25-agent-run.sh
```

**実行フロー**:
1. GitHub CLIで最新Issue番号を取得
2. `/agent-run coordinator --issue <NUMBER>` を送信
3. Claude CodeがAgent実行を開始

**前提条件**:
- GitHub CLI (`gh`) がインストール済み
- `GITHUB_TOKEN` 環境変数が設定済み
- `🤖agent-execute` ラベルが付いたIssueが存在

### 26-infinity-sprint.sh - Infinity Sprint Launch

**機能**: 無限自律実行モードを起動（全Issue自動処理）

```bash
./26-infinity-sprint.sh
```

**実行内容**:
```bash
/miyabi-infinity
```

**特徴**:
- 自動Issue取得
- 並列実行 (max 3並列)
- 失敗時自動リトライ
- 音声通知対応

**前提条件**:
- `🤖agent-execute` ラベルが付いたIssueが1件以上存在

---

## 🛠️ Git Commands (10-11)

### 10-commit.sh - Git Commit

```bash
./10-commit.sh
```

**実行内容**:
```bash
"Please create a git commit with all changes"
```

### 11-pr.sh - Create PR

```bash
./11-pr.sh
```

**実行内容**:
```bash
"Please create a pull request for the current branch"
```

---

## 📖 Available Claude Code Commands

Stream Deckから実行可能な全スラッシュコマンド一覧:

### 🛠️ Development
- `/create-issue` - GitHub Issue作成
- `/test` - テスト実行
- `/verify` - システム動作確認
- `/review` - コード品質レビュー

### 🤖 Agent
- `/agent-run <agent> --issue <N>` - Agent実行
- `/miyabi-auto` - 全自動開発モード
- `/miyabi-infinity` - Infinity Sprint
- `/miyabi-todos` - TODO自動Issue化

### 🔒 Security
- `/security-scan` - セキュリティスキャン

### 🚀 Deployment
- `/deploy [target]` - デプロイ実行

### 📝 Documentation
- `/generate-docs` - ドキュメント自動生成
- `/generate-lp` - ランディングページ生成

### 📊 Reports
- `/daily-update` - 開発進捗レポート
- `/check-benchmark` - ベンチマーク実装チェック

### 🔔 Notifications
- `/session-end` - セッション終了通知

### 🔊 VoiceVox
- `/voicevox "text" [speaker] [speed]` - テキスト読み上げ
- `/narrate` - Git commit ナレーション
- `/watch-sprint` - Sprint監視 + 音声通知

**詳細**: `.claude/commands/INDEX.md` を参照

---

## ✨ カスタムボタンの作り方

### Step 1: スクリプトファイル作成

```bash
#!/bin/bash
# Stream Deck: Custom Button
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# メッセージまたはコマンドを送信
"$SCRIPT_DIR/05-send-to-claude.sh" "Your message or /command here"
```

### Step 2: 実行権限付与

```bash
chmod +x tools/stream-deck/99-custom-button.sh
```

### Step 3: Stream Deckに登録

1. Stream Deckアプリを開く
2. 新しいボタンを追加
3. **Action**: System > Open
4. **Path**: `/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/99-custom-button.sh`
5. アイコンとラベルを設定

### 例1: "/verify コマンド" ボタン

```bash
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/verify"
```

### 例2: "Issue作成" ボタン

```bash
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/create-issue"
```

### 例3: "セッション終了" ボタン

```bash
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/session-end"
```

---

## 🔧 Troubleshooting

### Q1: ボタンを押しても何も起きない

**確認事項**:
```bash
# 1. スクリプトが存在するか
ls -la tools/stream-deck/05-send-to-claude.sh

# 2. 実行権限があるか
ls -l tools/stream-deck/*.sh

# 3. ログを確認
tail -f /tmp/stream-deck-messages.log
```

**解決策**:
```bash
# 実行権限を付与
chmod +x tools/stream-deck/*.sh
```

### Q2: VS Codeがアクティブにならない

**原因**: AppleScriptアクセシビリティ権限が必要

**解決策**:
1. システム環境設定 > セキュリティとプライバシー > プライバシー > アクセシビリティ
2. Stream Deckまたはターミナルを追加
3. チェックボックスを有効化

### Q3: メッセージが送信されない

**確認事項**:
```bash
# AppleScriptを手動実行してテスト
osascript -e 'tell application "Visual Studio Code" to activate'
```

**解決策**:
- 遅延時間を増やす (`delay 1.2` → `delay 2.0`)
- リトライ回数を増やす (`MAX_RETRIES=2` → `MAX_RETRIES=3`)

### Q4: コマンドが認識されない

**確認**: コマンドファイルが存在するか
```bash
ls -la .claude/commands/
```

**確認**: コマンド名が正しいか
```bash
cat .claude/commands/INDEX.md
```

---

## 📊 Usage Logs

### ログファイル

```bash
/tmp/stream-deck-messages.log
```

### ログ形式

```
[2025-10-26 12:34:56] Sending: Next
[2025-10-26 12:34:57] Success (attempt 1)
[2025-10-26 12:35:10] Sending: /voicevox "やぁやぁ！" 3 1.2
[2025-10-26 12:35:12] Success (attempt 1)
[2025-10-26 12:36:00] Sending: /agent-run coordinator --issue 270
[2025-10-26 12:36:02] Failed after 2 attempts
```

### ログ確認コマンド

```bash
# リアルタイム監視
tail -f /tmp/stream-deck-messages.log

# 最新10件
tail -10 /tmp/stream-deck-messages.log

# 失敗したコマンドのみ表示
grep "Failed" /tmp/stream-deck-messages.log

# 今日のログ
grep "$(date +%Y-%m-%d)" /tmp/stream-deck-messages.log
```

---

## 🔗 Related Documentation

- **Claude Code Commands**: `.claude/commands/INDEX.md`
- **Skills**: `.claude/Skills/README.md`
- **VOICEVOX Integration**: `docs/VOICEVOX_HOOKS_QUICKSTART.md`
- **Agent Specs**: `.claude/agents/specs/`

---

## 🎨 Recommended Button Layout

### Stream Deck配置例 (15キーモデル)

```
┌────────┬────────┬────────┬────────┬────────┐
│  Next  │Continue│  Fix   │  Help  │ Commit │
│   01   │   02   │   03   │   04   │   10   │
├────────┼────────┼────────┼────────┼────────┤
│   PR   │ Agent  │Infinity│ Voice  │Zundamon│
│   11   │   25   │   26   │   20   │   21   │
├────────┼────────┼────────┼────────┼────────┤
│ Verify │ Review │Security│  Docs  │  Test  │
│  /verify│ /review│/sec-scan│/gen-docs│ /test │
└────────┴────────┴────────┴────────┴────────┘
```

---

## 🚀 Performance Tips

### 最適化ポイント

1. **遅延時間調整**: 高速なマシンでは遅延を短縮可能
   ```bash
   # 高速版（M1 Mac等）
   delay 0.8  # アクティベーション
   delay 0.6  # Cmd+L
   delay 0.3  # 貼り付け
   ```

2. **並列実行**: 複数ボタンを連続で押さない
   - 前のコマンドが完了してから次を実行

3. **ログローテーション**: 定期的にログをクリア
   ```bash
   # 月次ローテーション
   mv /tmp/stream-deck-messages.log /tmp/stream-deck-messages-$(date +%Y-%m).log
   ```

---

**このREADMEは Stream Deck ↔ Claude Code統合の完全ガイドです。**

🤖 Generated with [Claude Code](https://claude.com/claude-code)

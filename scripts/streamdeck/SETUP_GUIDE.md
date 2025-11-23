# 🎮 Stream Deck Mobile セットアップガイド

**所要時間**: 約30分
**難易度**: ★☆☆☆☆ (Easy)

---

## 📱 準備するもの

1. **Stream Deck Mobile app** (iOS/Android)
2. **Elgato Stream Deck** (Mac app) - インストール済み
3. **スマートフォン** - MacとWi-Fi接続
4. **このスクリプト集** - `~/Dev/miyabi-private/scripts/streamdeck/`

---

## 🚀 セットアップ手順

### Step 1: Stream Deck Mobileアプリをインストール

1. App Store / Google Playで「Stream Deck Mobile」を検索
2. インストール
3. 起動して、Macと同じWi-Fiに接続

### Step 2: MacのStream Deckアプリで検出

1. Mac側で **Elgato Stream Deck** アプリを起動（完了済み ✅）
2. 左下の **歯車アイコン** → **デバイス**
3. 「Stream Deck Mobile」が表示されたらペアリング
4. スマホ側で承認

### Step 3: プロファイルを作成

1. Stream Deckアプリで右上の **プロファイルアイコン** をクリック
2. 「新規プロファイル」を5回作成：
   - `Miyabi-Main` (メインダッシュボード)
   - `Miyabi-Agents` (エージェント制御)
   - `Miyabi-Dev` (開発ツール)
   - `Miyabi-Monitor` (モニタリング)
   - `Miyabi-Quick` (クイックアクション)

### Step 4: ボタンを設定 (Profile 1: Main Dashboard)

#### Button 1: 🎯 Start Miyabi

1. 左のアクションリストから **「システム」→「開く」** をドラッグ
2. ボタン1の位置にドロップ
3. 設定:
   - **アプリケーション/ファイル**: `/Users/shunsuke/Dev/miyabi-private/scripts/streamdeck/01-start-miyabi.sh`
   - **タイトル**: `Start Miyabi`
   - **アイコン**: 🎯 または好きな画像
   - **背景色**: 緑 (#00FF00)

#### Button 2: 🎭 Orchestra Mode

1. 同様に **「システム」→「開く」** をドラッグ
2. 設定:
   - **ファイル**: `02-orchestra-mode.sh`
   - **タイトル**: `Orchestra`
   - **アイコン**: 🎭
   - **背景色**: 紫 (#9B59B6)

#### Button 3: 📊 Status Check

- **ファイル**: `03-status-check.sh`
- **タイトル**: `Status`
- **アイコン**: 📊
- **背景色**: 青 (#3498DB)

#### Button 4: 🔄 Sync All

- **ファイル**: `04-sync-all.sh`
- **タイトル**: `Sync`
- **アイコン**: 🔄
- **背景色**: オレンジ (#FF9800)

#### Button 5: ⚙️ Next Profile

1. **「Stream Deck」→「プロファイルを切り替え」** をドラッグ
2. 設定:
   - **プロファイル**: `Miyabi-Agents`
   - **タイトル**: `Next`
   - **アイコン**: ⚙️
   - **背景色**: グレー (#95A5A6)

#### Button 6-8: Agent Controls

- **Button 6**: `06-agent-tsubaki.sh` (🌸 Tsubaki)
- **Button 7**: `07-agent-kaede.sh` (🍁 Kaede)
- **Button 8**: `08-agent-sakura.sh` (🌺 Sakura)

#### Button 9-10: SSH Connections

- **Button 9**: `09-ssh-mugen.sh` (🌊 MUGEN)
- **Button 10**: `10-ssh-majin.sh` (⚡ MAJIN)

#### Button 11-15: Tools

- **Button 11**: `11-issue-create.sh` (📝 Issue)
- **Button 12**: `12-lark-notify.sh` (💬 Lark)
- **Button 13**: `13-voice-input.sh` (🎤 Voice)
- **Button 14**: `14-deploy-now.sh` (🚀 Deploy)
- **Button 15**: `15-stop-all.sh` (🛑 Stop - **赤色**)

---

## 🎨 デザインのコツ

### 色分けルール

| 色 | 用途 | 例 |
|----|------|-----|
| 🟢 緑 | 起動・開始 | Start, Run, Enable |
| 🔵 青 | 情報・状態 | Status, Info, Check |
| 🟡 黄 | 注意 | Warning, Caution |
| 🔴 赤 | 停止・削除 | Stop, Delete, Emergency |
| 🟣 紫 | Agent・AI | Orchestra, Agents |
| ⚫ 黒/グレー | システム | Settings, Config |

### アイコン選択

1. **絵文字を使う** - 直感的で分かりやすい
2. **Stream Deckアイコンライブラリ** - プロフェッショナル
3. **カスタム画像** - PNG/JPGファイルをアップロード

### フォルダ機能

複数のプロファイルをフォルダにまとめると管理しやすい：
- `📁 Miyabi` フォルダ作成
  - `Miyabi-Main`
  - `Miyabi-Agents`
  - など

---

## 🧪 テスト手順

### 1. 個別ボタンテスト

Stream Deck Mobileで各ボタンを1つずつタップして動作確認：

```bash
# Macのターミナルで確認
tail -f /tmp/miyabi-*.log
```

### 2. Profile切り替えテスト

Main → Agents → Dev → Monitor → Quick → Main の順に切り替え

### 3. 統合テスト

実際のワークフローをシミュレート：
1. **Start Miyabi** → Miyabi起動
2. **Status Check** → 状態確認
3. **Orchestra Mode** → 14 Agents展開
4. **Agent Tsubaki** → メッセージ送信
5. **Stop All** → 全停止

---

## 🔧 トラブルシューティング

### 問題1: ボタンを押しても動作しない

**原因**: スクリプトの実行権限がない

**解決策**:
```bash
chmod +x ~/Dev/miyabi-private/scripts/streamdeck/*.sh
```

### 問題2: "Operation not permitted" エラー

**原因**: macOSのセキュリティ設定

**解決策**:
1. **システム環境設定** → **セキュリティとプライバシー**
2. **プライバシー** タブ → **アクセシビリティ**
3. **Stream Deck** アプリにチェック

### 問題3: tmux paneが見つからない

**原因**: tmuxセッションが起動していない

**解決策**:
```bash
# Orchestra起動
tmux new-session -s orchestra
```

### 問題4: スマホとMacが接続できない

**原因**: Wi-Fi設定

**解決策**:
1. 同じWi-Fiネットワークに接続
2. ファイアウォール設定を確認
3. Stream Deckアプリを再起動

---

## 💡 カスタマイズ例

### 例1: Pixel音声入力をカスタマイズ

`13-voice-input.sh` を編集：

```bash
#!/bin/bash
# Custom voice input with Gemini

adb shell "am broadcast --user 0 -a com.termux.RUN_COMMAND --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/home/.shortcuts/voice-gemini.sh'"

# 結果をLarkに通知
~/Dev/miyabi-private/scripts/streamdeck/12-lark-notify.sh "音声入力完了"
```

### 例2: Issue作成をワンタップ化

`11-issue-create.sh` を編集：

```bash
#!/bin/bash
# Quick issue with template

TEMPLATE="Bug report from Stream Deck Mobile"

cd ~/Dev/miyabi-private
gh issue create \
  --title "$(date '+%Y-%m-%d') - Mobile Report" \
  --body "$TEMPLATE" \
  --label "P2,type:bug,source:mobile"

osascript -e 'display notification "Issue作成完了" with title "✅ Stream Deck"'
```

### 例3: マルチアクションボタン

1つのボタンで複数の操作を実行：

```bash
#!/bin/bash
# Multi-action: Status + Sync + Notify

# 1. Status check
~/Dev/miyabi-private/scripts/streamdeck/03-status-check.sh

# 2. Sync
~/Dev/miyabi-private/scripts/streamdeck/04-sync-all.sh

# 3. Notify team
~/Dev/miyabi-private/scripts/streamdeck/12-lark-notify.sh "システム更新完了"
```

---

## 📊 完成イメージ

セットアップ完了後、スマートフォンから：

```
┌────────────────────────────────────┐
│     Miyabi Control Panel 🎮       │
├────────────────────────────────────┤
│ [ Start ] [ Orch ] [ Status ]...  │
│ [ Agent1] [ Agent2] [ Agent3]...  │
│ [ Issue ] [ Lark  ] [ Voice ]...  │
└────────────────────────────────────┘
         ↓ One Tap Control
    Complete Miyabi Operations
```

---

## 🎯 次のステップ

1. ✅ Profile 1 (Main Dashboard) セットアップ
2. 🔄 Profile 2-5 も同様にセットアップ
3. 📱 スマホからテスト実行
4. 🎨 アイコン・色をカスタマイズ
5. 🚀 実運用開始！

---

**Miyabiを手のひらから完全コントロール** 🎮✨

質問・問題があれば、`scripts/streamdeck/README.md` を参照してください。

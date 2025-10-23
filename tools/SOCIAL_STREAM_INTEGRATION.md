# Social Stream Ninja × Miyabi Narration System - 統合設計書

**バージョン**: v1.0.0
**作成日**: 2025-10-23
**目的**: リアルタイム開発ライブストリーミング実現

---

## 📋 概要

Social Stream Ninjaを使用して、Miyabi開発進捗をYouTube/Twitchでリアルタイム配信するための統合システム。

### 目標

1. ✅ Git commits → ゆっくり解説音声 → ライブストリーミング
2. ✅ OBS統合（オーバーレイ + 音声）
3. ✅ 視聴者チャットインタラクション
4. ✅ 自動化（Git push → 即座にナレーション生成）

---

## 🏗️ システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│ Miyabi Development                                       │
│ - Git commits (開発進捗)                                 │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ miyabi-narrate.sh --stream                               │
│ - Phase 1: Script Generation (Git → Yukkuri Dialogue)   │
│ - Phase 2: VOICEVOX Audio Synthesis                     │
│ - Phase 2.5: BytePlus ARK API Thumbnail                 │
│ - Phase 3: Video Generation (Optional)                  │
│ - Phase 4: Social Stream Ninja Integration (NEW!)       │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ social-stream-client.py (WebSocket Client)              │
│ - Connect to wss://io.socialstream.ninja                │
│ - Send narration text via sendChat action               │
│ - Real-time progress metrics display                    │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ Social Stream Ninja Server                              │
│ - WebSocket relay (wss://io.socialstream.ninja)         │
│ - Channel-based routing (Channel 1-9)                   │
│ - Message broadcasting to all clients                   │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ OBS Studio                                               │
│ - Browser Source #1: Social Stream Ninja Overlay        │
│   (https://socialstream.ninja/dock.html?session=XXX)    │
│ - Browser Source #2: Featured Chat                      │
│   (https://socialstream.ninja/featured.html?session=XXX)│
│ - Audio Input #1: VOICEVOX Audio (virtual audio cable)  │
│ - Video Source: Development Screen Capture              │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ YouTube Live / Twitch                                    │
│ - Live streaming output                                 │
│ - Viewer chat integration                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔌 Social Stream Ninja API統合

### WebSocket接続

**エンドポイント**: `wss://io.socialstream.ninja`

**接続方法**:
```python
import websocket
import json

# セッションIDを生成（任意の文字列、例: miyabi-narrate-{timestamp}）
session_id = "miyabi-narrate-20251023"

# チャンネル指定
# - IN_CHANNEL: メッセージ受信チャンネル (1-9)
# - OUT_CHANNEL: メッセージ送信チャンネル (1-9)
in_channel = 1  # メインチャンネル
out_channel = 1  # メインチャンネル

# WebSocket接続
ws = websocket.create_connection(
    f"wss://io.socialstream.ninja/join/{session_id}/{in_channel}/{out_channel}"
)

# または、接続後にjoinメッセージ送信
ws = websocket.create_connection("wss://io.socialstream.ninja")
ws.send(json.dumps({
    "join": session_id,
    "in": in_channel,
    "out": out_channel
}))
```

### メッセージ送信

#### 1. チャットメッセージ送信

**アクション**: `sendChat`

```python
message = {
    "action": "sendChat",
    "value": "🎤 霊夢: こんにちは！今日もMiyabiの開発進捗を報告するわ！"
}
ws.send(json.dumps(message))
```

#### 2. 外部コンテンツ送信（カスタムフォーマット）

**アクション**: `extContent`

```python
content = {
    "chatname": "🎤 霊夢",
    "chatmessage": "accessibilityモジュールでドキュメントを更新したわ！",
    "chatimg": "https://example.com/reimu-avatar.png",  # オプション
    "type": "miyabi-narration",  # カスタムタイプ
}

message = {
    "action": "extContent",
    "value": json.dumps(content)
}
ws.send(json.dumps(message))
```

#### 3. 進捗メトリクス送信

```python
# コミット数・音声ファイル数を表示
metrics = {
    "chatname": "📊 Miyabi Stats",
    "chatmessage": f"過去3日分: {commit_count}コミット、{audio_count}音声ファイル生成完了！",
    "type": "miyabi-metrics"
}

message = {
    "action": "extContent",
    "value": json.dumps(metrics)
}
ws.send(json.dumps(message))
```

---

## 📝 実装計画

### Phase 13.3: social-stream-client.py 実装

**ファイル**: `tools/social-stream-client.py`

**機能**:
1. WebSocket接続管理
2. メッセージ送信（チャット、外部コンテンツ、メトリクス）
3. エラーハンドリング＆再接続ロジック
4. セッションID管理（`.miyabi-stream-session` ファイル）

**CLI インターフェース**:
```bash
# セッション開始
python3 social-stream-client.py --start --session miyabi-narrate

# メッセージ送信
python3 social-stream-client.py --send "霊夢: こんにちは！"

# 外部コンテンツ送信
python3 social-stream-client.py --send-content '{"chatname": "霊夢", "chatmessage": "..."}'

# セッション情報表示
python3 social-stream-client.py --info

# セッション終了
python3 social-stream-client.py --stop
```

---

### Phase 13.4: miyabi-narrate.sh --stream オプション

**新オプション**: `-l, --stream` (Live Streaming mode)

**実装内容**:
```bash
# Phase 4: Social Stream Ninja Integration (オプション)
if $STREAM_MODE; then
    echo ""
    log_info "📡 Phase 4: Social Stream Ninja統合中..."

    # セッション開始
    python3 social-stream-client.py --start --session "miyabi-narrate-$(date +%s)" || {
        log_error "Social Stream Ninja接続失敗"
        log_warn "ストリーミングなしで続行します"
    }

    # 台本からメッセージを送信
    while IFS= read -r line; do
        if [[ $line =~ ^霊夢:|^魔理沙: ]]; then
            python3 social-stream-client.py --send "$line"
            sleep 2  # メッセージ間隔
        fi
    done < "$OUTPUT_DIR/script.md"

    # 進捗メトリクス送信
    python3 social-stream-client.py --send-content "{
        \"chatname\": \"📊 Miyabi Stats\",
        \"chatmessage\": \"過去${DAYS}日分: ${COMMIT_COUNT}コミット、${AUDIO_COUNT}音声ファイル生成完了！\",
        \"type\": \"miyabi-metrics\"
    }"

    log_success "Social Stream Ninja統合完了"
fi
```

**使用例**:
```bash
# フル機能（Engine起動 + サムネイル + 動画 + ストリーミング）
./miyabi-narrate.sh -d 7 -s -t -v -l
```

---

## 🎮 OBS Studio セットアップ

### 1. Social Stream Ninja Overlay（Browser Source）

**URL**:
```
https://socialstream.ninja/dock.html?session=miyabi-narrate&channel=1
```

**設定**:
- 幅: 400px
- 高さ: 600px
- カスタムCSS: テーマ適用（後述）
- リフレッシュレート: 60fps

### 2. Featured Chat（Browser Source）

**URL**:
```
https://socialstream.ninja/featured.html?session=miyabi-narrate&channel=1
```

**設定**:
- 幅: 800px
- 高さ: 200px
- 自動スクロール: 有効

### 3. VOICEVOX Audio入力

**方法**: Virtual Audio Cable使用

**macOS**:
```bash
# BlackHole インストール（仮想音声デバイス）
brew install blackhole-2ch

# VOICEVOX Engineの音声出力を BlackHole にルーティング
# OBSで BlackHole を音声入力ソースに追加
```

**Windows**:
```bash
# VB-CABLE Virtual Audio Device インストール
# https://vb-audio.com/Cable/

# VOICEVOX Engineの音声出力を CABLE Input にルーティング
# OBSで CABLE Output を音声入力ソースに追加
```

---

## 🎨 カスタムテーマ

### Miyabi専用CSSテーマ

**適用先**: Social Stream Ninja Overlay (dock.html)

```css
/* Miyabi Cyberpunk Theme */
body {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
}

/* Chat message container */
.msg {
    background: rgba(14, 47, 68, 0.8);
    border-left: 4px solid #00d4ff;
    border-radius: 8px;
    padding: 12px;
    margin: 8px 0;
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
    animation: slideIn 0.3s ease-out;
}

/* Speaker name styling */
.chatname {
    color: #00d4ff;
    font-weight: 600;
    text-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
}

/* Message text */
.chatmessage {
    color: #e0e0e0;
    font-size: 1.1em;
    line-height: 1.5;
}

/* Metrics message */
[data-type="miyabi-metrics"] {
    background: rgba(128, 0, 255, 0.2);
    border-left-color: #8000ff;
}

[data-type="miyabi-metrics"] .chatname {
    color: #8000ff;
}

/* Animation */
@keyframes slideIn {
    from {
        transform: translateX(-20px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Progress indicator */
.progress-bar {
    width: 100%;
    height: 4px;
    background: #1a1a2e;
    border-radius: 2px;
    overflow: hidden;
}

.progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #00d4ff 0%, #8000ff 100%);
    animation: progress 3s ease-in-out infinite;
}

@keyframes progress {
    0% { width: 0%; }
    50% { width: 100%; }
    100% { width: 0%; }
}
```

---

## 🤖 自動化（GitHub Actions統合）

### ワークフロー例

**ファイル**: `.github/workflows/narration-stream.yml`

```yaml
name: Miyabi Narration Live Stream

on:
  schedule:
    # 毎日18:00 JST (09:00 UTC)
    - cron: '0 9 * * *'
  workflow_dispatch:  # 手動実行も可能

jobs:
  narration-stream:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip3 install python-dotenv requests websocket-client

      - name: Setup VOICEVOX Engine
        run: |
          # Docker版VOICEVOX Engineを起動
          docker run -d -p 50021:50021 voicevox/voicevox_engine:latest

      - name: Generate narration and stream
        env:
          ARK_API_KEY: ${{ secrets.ARK_API_KEY }}
        run: |
          cd tools
          ./miyabi-narrate.sh -d 3 -s -t -v -l

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: narration-output
          path: tools/output/
```

---

## 📊 視聴者インタラクション

### チャットコマンド対応（将来実装）

**例**:
- `!progress` - 現在の開発進捗を表示
- `!commits` - 今日のコミット数を表示
- `!audio` - 音声ファイル数を表示
- `!next` - 次の開発予定を表示

**実装方法**:
```python
# social-stream-client.py にリスニング機能追加
def on_message(ws, message):
    data = json.loads(message)

    if data.get("type") == "youtube" or data.get("type") == "twitch":
        chat_message = data.get("chatmessage", "")

        if chat_message == "!progress":
            # 進捗情報を返信
            send_chat(ws, f"現在の進捗: {commit_count}コミット完了！")

        elif chat_message == "!commits":
            send_chat(ws, f"今日のコミット数: {commit_count}件")
```

---

## 🧪 テスト計画

### Phase 13.5: 統合テスト

**テストシナリオ**:
1. ✅ WebSocket接続確立
2. ✅ メッセージ送信（チャット、外部コンテンツ、メトリクス）
3. ✅ OBS Browser Source表示確認
4. ✅ VOICEVOX音声のOBS入力確認
5. ✅ YouTube Live / Twitchテスト配信
6. ✅ 視聴者チャットインタラクション
7. ✅ 自動化ワークフロー実行

**コマンド**:
```bash
# ローカルテスト
./miyabi-narrate.sh -d 1 -s -t -v -l

# OBSでプレビュー確認
# → Browser Sourceが正常に表示されるか
# → 音声が正常に入力されるか

# YouTube/Twitchテスト配信（非公開）
# → ストリームキー設定
# → 配信開始
# → 視聴者チャットテスト
```

---

## 📚 参考ドキュメント

**Social Stream Ninja**:
- 公式サイト: https://socialstream.ninja/
- GitHub: https://github.com/steveseguin/social_stream
- API Documentation: https://socialstream.ninja/api.md
- Discord Community: https://discord.socialstream.ninja

**Miyabi Narration System**:
- README.md: tools/README.md
- Thumbnail Generation: tools/THUMBNAIL_GENERATION_README.md
- Video Generator: tools/video-generator.py

**OBS Studio**:
- 公式サイト: https://obsproject.com/
- Browser Source Plugin
- Virtual Audio Cable Setup

---

## 🔮 将来の拡張

**Phase 14: AI Chatbot統合**
- Claude Sonnet 4による視聴者質問自動応答
- 開発内容の自動説明
- コード例の自動生成

**Phase 15: Analytics Dashboard**
- 配信統計（視聴者数、チャット数、滞在時間）
- エンゲージメント分析
- 人気トピック抽出

**Phase 16: Multi-Platform Streaming**
- YouTube + Twitch + Facebook Live 同時配信
- プラットフォーム別チャット統合
- プラットフォーム別統計

---

**作成者**: Claude Code (AI Assistant)
**プロジェクト**: Miyabi - 自律型開発フレームワーク
**バージョン**: v1.0.0 (2025-10-23)

# 🚀 Discord TTS Bot - クイックセットアップガイド

**かわいい声で読み上げるDiscordボットを5ステップでセットアップ！**

---

## 📋 ステップ1: Discord Bot作成（5分）

### 1-1. Discord Developer Portalにアクセス

🔗 **https://discord.com/developers/applications**

### 1-2. 新しいアプリケーションを作成

1. 右上の「**New Application**」ボタンをクリック
2. アプリ名を入力（例: `Miyabi TTS Bot`）
3. 「**Create**」をクリック

### 1-3. Botユーザーを作成

1. 左メニューから「**Bot**」を選択
2. 「**Add Bot**」をクリック
3. 「**Yes, do it!**」をクリック

### 1-4. Bot Tokenを取得 ⭐重要⭐

1. 「**TOKEN**」セクションで「**Reset Token**」をクリック
2. トークンが表示されます（**一度しか表示されません！必ずコピー**）
3. トークンをメモ帳等に保存しておく

```
例: MTQyOTA3MzYxOTA1MjQwMDgwMg.GxYz9a.example_token_here_do_not_share
```

### 1-5. Bot権限を設定

1. 「**Privileged Gateway Intents**」で以下を有効化：
   - ✅ **MESSAGE CONTENT INTENT**
   - ✅ **SERVER MEMBERS INTENT**
   - ✅ **PRESENCE INTENT**（任意）

2. 「**Save Changes**」をクリック

---

## 📋 ステップ2: Botをサーバーに招待

### 2-1. 招待URLを生成

1. 左メニューから「**OAuth2**」→「**URL Generator**」を選択
2. 「**SCOPES**」で以下を選択：
   - ✅ `bot`
   - ✅ `applications.commands`（任意）

3. 「**BOT PERMISSIONS**」で以下を選択：
   - ✅ **Read Messages/View Channels**
   - ✅ **Send Messages**
   - ✅ **Connect** (ボイスチャンネル接続)
   - ✅ **Speak** (ボイスチャンネル発言)
   - ✅ **Use Voice Activity**

### 2-2. Botを招待

1. 画面下部に生成されたURLをコピー
2. ブラウザで開く
3. Botを追加したいサーバーを選択
4. 「**認証**」をクリック

✅ Botがサーバーに追加されました！

---

## 📋 ステップ3: チャンネルIDを取得

### 3-1. Discord開発者モードを有効化

1. Discordを開く
2. 「**ユーザー設定**」⚙️ をクリック
3. 「**詳細設定**」→「**開発者モード**」を **ON** にする

### 3-2. Webhook投稿先チャンネルIDを取得

1. Webhook投稿用のテキストチャンネル（例: `#実況配信`）を右クリック
2. 「**IDをコピー**」をクリック
3. IDをメモ（例: `1429073619052400802`）

### 3-3. ボイスチャンネルIDを取得（任意）

1. 読み上げ先のボイスチャンネル（例: `🎤 読み上げ部屋`）を右クリック
2. 「**IDをコピー**」をクリック
3. IDをメモ

---

## 📋 ステップ4: .envファイルを設定

### 4-1. .envファイルをコピー

```bash
cd integrations/discord-tts-bot
cp .env.example .env
```

### 4-2. .envファイルを編集

```bash
nano .env
# または
code .env  # VS Code
```

### 4-3. 必須項目を入力

```bash
# Discord Bot Token（ステップ1-4で取得）
DISCORD_BOT_TOKEN=MTQyOTA3MzYxOTA1MjQwMDgwMg.GxYz9a.example_token

# Webhook投稿先チャンネルID（ステップ3-2で取得）
TARGET_CHANNEL_ID=1429073619052400802

# ボイスチャンネルID（ステップ3-3で取得、任意）
DISCORD_VOICE_CHANNEL_ID=1234567890123456789
```

### 4-4. VOICEVOXキャラクター選択（任意）

お好みのキャラクターを選んでください！

```bash
# デフォルト: ずんだもん（かわいい萌え声）
VOICEVOX_SPEAKER_ID=1

# その他の人気キャラクター：
# VOICEVOX_SPEAKER_ID=2   # 四国めたん（元気な声）
# VOICEVOX_SPEAKER_ID=3   # 春日部つむぎ（優しい声）
# VOICEVOX_SPEAKER_ID=8   # 雨晴はう（落ち着いた声）
```

---

## 📋 ステップ5: Pythonパッケージのインストール

### 5-1. FFmpegのインストール（音声再生に必要）

#### macOS
```bash
brew install ffmpeg
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

### 5-2. Python仮想環境を作成

```bash
cd integrations/discord-tts-bot

# 仮想環境作成
python3 -m venv venv

# 仮想環境を有効化
source venv/bin/activate  # macOS/Linux
# または
venv\Scripts\activate     # Windows
```

### 5-3. 依存パッケージをインストール

```bash
pip install -r requirements.txt
```

---

## 🎉 完了！起動してみましょう！

### VOICEVOXを起動（Docker版）

```bash
# VOICEVOXコンテナが起動していない場合
docker start voicevox_miyabi

# または新規起動
docker run -d -p 50021:50021 --name voicevox_miyabi voicevox/voicevox_engine:cpu-ubuntu20.04-latest
```

### Discord Botを起動

```bash
cd integrations/discord-tts-bot
source venv/bin/activate  # 仮想環境有効化
python3 bot.py
```

✅ 成功すると以下のログが表示されます：
```
INFO - Logged in as Miyabi TTS Bot (ID: 123456789)
INFO - VOICEVOX API: http://localhost:50021
INFO - Speaker ID: 1
INFO - Auto-joined voice channel: 🎤 読み上げ部屋
INFO - Bot is ready! 🎤
```

---

## 🎤 テスト実行！

### テスト1: Webhook経由で投稿

```bash
# Miyabiプロジェクトから通知
./scripts/discord-notify.sh "🎮 テスト！かわいい声で読み上げます！"
```

→ ボイスチャンネルで「テスト！かわいい声で読み上げます！」と再生されます✨

### テスト2: Discordコマンド

Discordのテキストチャンネルで：

```
!say こんにちは！YouTube LIVE実況モード開始です！
```

→ ボイスチャンネルで読み上げられます✨

### テスト3: 音声キャラクター変更

```
!speaker 2
!say 四国めたんの声に変わりました！
```

---

## 🎯 使い方まとめ

### 自動読み上げ（メイン機能）

Webhookから投稿されたメッセージを自動的に読み上げます。

```bash
./scripts/discord-notify.sh "🚀 作業開始！Issue #270を処理します！"
```

### コマンド一覧

| コマンド | 説明 | 例 |
|---------|------|-----|
| `!join` | ボイスチャンネルに参加 | `!join` |
| `!leave` | ボイスチャンネルから退出 | `!leave` |
| `!say <text>` | テキストを読み上げ | `!say こんにちは！` |
| `!speaker <id>` | 音声キャラクター変更 | `!speaker 1` |
| `!status` | Bot状態確認 | `!status` |

---

## 🔧 トラブルシューティング

### Q1: Bot Tokenエラー

```
discord.errors.LoginFailure: Improper token has been passed.
```

**解決策**:
- `.env` ファイルの `DISCORD_BOT_TOKEN` が正しいか確認
- トークンが期限切れの場合は再発行（Discord Developer Portal）

### Q2: VOICEVOXに接続できない

```
requests.exceptions.ConnectionError: Connection refused
```

**解決策**:
```bash
# VOICEVOXコンテナが起動しているか確認
docker ps | grep voicevox

# 起動していなければ起動
docker start voicevox_miyabi

# APIが応答するか確認
curl http://localhost:50021/speakers
```

### Q3: 音声が再生されない

**解決策**:
1. FFmpegがインストールされているか確認
   ```bash
   ffmpeg -version
   ```

2. PyNaClがインストールされているか確認
   ```bash
   pip list | grep PyNaCl
   ```

3. ボイスチャンネルに誰かいるか確認（自分だけでもOK）

### Q4: Botがボイスチャンネルに参加できない

**解決策**:
1. Bot権限を確認（Connect, Speak権限が必要）
2. `.env` の `DISCORD_VOICE_CHANNEL_ID` が正しいか確認
3. 手動参加を試す：
   ```
   !join
   ```

---

## 🚀 本番運用（systemdサービス化）

### サービスファイル作成

```bash
sudo nano /etc/systemd/system/discord-tts-bot.service
```

```ini
[Unit]
Description=Discord TTS Bot with VOICEVOX
After=network.target docker.service

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/miyabi-private/integrations/discord-tts-bot
ExecStart=/path/to/venv/bin/python3 bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### サービス有効化

```bash
sudo systemctl daemon-reload
sudo systemctl enable discord-tts-bot
sudo systemctl start discord-tts-bot
sudo systemctl status discord-tts-bot
```

---

## 🎵 YouTube LIVE実況モードをお楽しみください！ ✨

**質問・問題があれば README.md を参照してください！**

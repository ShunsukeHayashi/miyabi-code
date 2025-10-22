# 🎤 Discord TTS Bot with VOICEVOX

**YouTube LIVE実況モード対応 - かわいい声で読み上げるDiscordボット**

Webhook経由で投稿されたメッセージを、VOICEVOX（日本語TTS）を使ってかわいい声でDiscordボイスチャンネルで読み上げます！

## ✨ 特徴

- 🎵 **かわいい声で読み上げ** - VOICEVOXの高品質なキャラクターボイス
- 🔄 **Webhook自動監視** - Webhookからの投稿を自動検知
- 🎮 **キュー管理** - 複数メッセージを順番に再生
- 🤖 **自動参加** - ボイスチャンネルに自動参加
- 💬 **コマンド対応** - `!join`, `!leave`, `!say` 等

## 📋 必要なもの

1. **Python 3.9+**
2. **Discord Bot Token** - [Discord Developer Portal](https://discord.com/developers/applications)で作成
3. **VOICEVOX Engine** - Docker または アプリ版
4. **FFmpeg** - 音声再生に必要

## 🚀 セットアップ

### 1. VOICEVOXのセットアップ

#### Docker版（推奨）

```bash
# VOICEVOXコンテナを起動（初回はイメージダウンロードに時間がかかります）
docker run -d -p 50021:50021 --name voicevox_miyabi voicevox/voicevox_engine:cpu-ubuntu20.04-latest

# 起動確認
curl http://localhost:50021/speakers
```

#### アプリ版

1. [VOICEVOX公式サイト](https://voicevox.hiroshiba.jp/)からダウンロード
2. アプリを起動（自動的に http://localhost:50021 でAPIサーバーが起動します）

### 2. FFmpegのインストール

#### macOS

```bash
brew install ffmpeg
```

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install ffmpeg
```

### 3. Discord Botの作成

1. [Discord Developer Portal](https://discord.com/developers/applications)にアクセス
2. 「New Application」をクリック
3. アプリ名を入力（例: Miyabi TTS Bot）
4. 左メニュー「Bot」→「Add Bot」をクリック
5. 「Token」をコピー（後で使います）
6. 「Privileged Gateway Intents」で以下を有効化：
   - ✅ MESSAGE CONTENT INTENT
   - ✅ SERVER MEMBERS INTENT
7. 左メニュー「OAuth2」→「URL Generator」で以下を選択：
   - Scopes: `bot`
   - Bot Permissions:
     - ✅ Read Messages/View Channels
     - ✅ Send Messages
     - ✅ Connect
     - ✅ Speak
8. 生成されたURLをブラウザで開き、Botをサーバーに追加

### 4. Botの設定

```bash
# .envファイルを作成
cp .env.example .env

# .envファイルを編集
nano .env
```

**必須設定**:
- `DISCORD_BOT_TOKEN`: Discord Botトークン
- `TARGET_CHANNEL_ID`: Webhookチャンネルのチャンネル ID（右クリック→IDをコピー）
- `DISCORD_VOICE_CHANNEL_ID`: 自動参加するボイスチャンネル ID（任意）

**チャンネルIDの取得方法**:
1. Discordで「設定」→「詳細設定」→「開発者モード」を有効化
2. チャンネルを右クリック→「IDをコピー」

### 5. Pythonパッケージのインストール

```bash
# 仮想環境を作成（推奨）
python3 -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# 依存関係をインストール
pip install -r requirements.txt
```

### 6. Botの起動

```bash
python3 bot.py
```

成功すると以下のようなログが表示されます：
```
INFO - Logged in as Miyabi TTS Bot (ID: 123456789)
INFO - VOICEVOX API: http://localhost:50021
INFO - Speaker ID: 1
INFO - Bot is ready! 🎤
```

## 🎵 使い方

### 自動読み上げ

Webhookからメッセージが投稿されると、自動的にボイスチャンネルで読み上げます。

例：
```bash
# Miyabiプロジェクトから通知を送信
./scripts/discord-notify.sh "🎮 作業開始！Issue #270を処理します！"
```

→ ボイスチャンネルで「作業開始！Issue270を処理します！」と読み上げられます✨

### コマンド

| コマンド | 説明 | 例 |
|---------|------|-----|
| `!join` | ボイスチャンネルに参加 | `!join` |
| `!leave` | ボイスチャンネルから退出 | `!leave` |
| `!say <text>` | テキストを読み上げ | `!say こんにちは！` |
| `!speaker <id>` | 音声キャラクター変更 | `!speaker 1` |
| `!status` | Bot状態確認 | `!status` |

### 音声キャラクター（Speaker ID）

| ID | キャラクター | 声の特徴 |
|----|-------------|---------|
| 1 | ずんだもん | かわいい萌え声 ⭐推奨 |
| 2 | 四国めたん | 元気な声 |
| 3 | 春日部つむぎ | 優しい声 |
| 8 | 雨晴はう | 落ち着いた声 |

全キャラクター一覧：
```bash
curl http://localhost:50021/speakers | jq
```

## 🔧 トラブルシューティング

### VOICEVOXに接続できない

```bash
# VOICEVOXが起動しているか確認
curl http://localhost:50021/speakers

# Dockerコンテナの状態確認
docker ps -a | grep voicevox

# コンテナログ確認
docker logs voicevox_miyabi
```

### Botがボイスチャンネルに参加できない

- **権限確認**: Botに「接続」「発言」権限があるか確認
- **Developer Mode**: Discord設定で「開発者モード」を有効にし、チャンネルIDを正しく取得
- **FFmpeg確認**: `ffmpeg -version` でFFmpegがインストールされているか確認

### 音声が再生されない

```bash
# FFmpegのインストール確認
ffmpeg -version

# PyNaClのインストール確認
pip list | grep PyNaCl
```

## 📊 ログ確認

```bash
# Botのログ出力
python3 bot.py

# INFO - Generating TTS for: 🎮 作業開始！...
# INFO - TTS playback completed
```

## 🎨 カスタマイズ

### デフォルト音声の変更

`.env` ファイルで `VOICEVOX_SPEAKER_ID` を変更：

```bash
VOICEVOX_SPEAKER_ID=2  # 四国めたん（元気な声）
```

### 特定チャンネルのみ監視

`.env` ファイルで `TARGET_CHANNEL_ID` を設定：

```bash
TARGET_CHANNEL_ID=1429073619052400802  # Webhookチャンネル
```

## 🚀 本番運用

### systemdサービス化（Linux）

```bash
# サービスファイル作成
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

[Install]
WantedBy=multi-user.target
```

```bash
# サービス有効化
sudo systemctl enable discord-tts-bot
sudo systemctl start discord-tts-bot
sudo systemctl status discord-tts-bot
```

## 📝 ライセンス

MIT License

## 🙏 謝辞

- [VOICEVOX](https://voicevox.hiroshiba.jp/) - 高品質な日本語TTSエンジン
- [discord.py](https://discordpy.readthedocs.io/) - Discord Bot Framework

---

**🎤 YouTube LIVE実況モードをお楽しみください！** ✨

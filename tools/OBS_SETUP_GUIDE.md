# OBS Studio セットアップガイド - Miyabi Narration System統合

**対象**: macOS
**OBS バージョン**: 30.x+
**作成日**: 2025-10-23

---

## 📋 概要

このガイドでは、OBS StudioにSocial Stream NinjaとMiyabi Narration Systemを統合し、YouTube/Twitchでライブストリーミングを実現します。

---

## ✅ 前提条件

- ✅ OBS Studio インストール済み (`/Applications/OBS.app`)
- ✅ VOICEVOX Engine 動作確認済み（port 50021）
- ✅ Social Stream Ninja リポジトリクローン済み
- ✅ miyabi-narrate.sh 動作確認済み

---

## 🎬 Phase 13.3: OBS Studio セットアップ

### Step 1: OBSを起動

```bash
open -a OBS
```

または、Finderから `/Applications/OBS.app` をダブルクリック

---

### Step 2: シーンコレクション作成

**シーン名**: `Miyabi Development Stream`

**構成**:
```
Miyabi Development Stream
├── Source 1: Display Capture（開発画面）
├── Source 2: Browser Source（Social Stream Ninja Dock）
├── Source 3: Browser Source（Featured Chat）
├── Source 4: Image（Miyabi Logo）← オプション
└── Audio Input: BlackHole 2ch（VOICEVOX音声）
```

---

### Step 3: Browser Source #1 - Social Stream Ninja Dock

**名前**: `Social Stream Ninja - Dock`

**設定**:
1. **Sources** → **+** → **Browser**
2. **Create New**で名前を入力: `Social Stream Ninja - Dock`
3. **Properties**:

```
URL:
https://socialstream.ninja/dock.html?session=miyabi-narrate&channel=1&view&compact&lightmode

Width: 400
Height: 800

Custom CSS:
/* Miyabi Cyberpunk Theme */
body {
    background: linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%);
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
}

.msg {
    background: rgba(14, 47, 68, 0.9);
    border-left: 4px solid #00d4ff;
    border-radius: 8px;
    padding: 12px;
    margin: 8px 0;
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
    animation: slideIn 0.3s ease-out;
}

.chatname {
    color: #00d4ff;
    font-weight: 600;
    text-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
    font-size: 1.1em;
}

.chatmessage {
    color: #e0e0e0;
    font-size: 1.05em;
    line-height: 1.6;
    margin-top: 6px;
}

[data-type="miyabi-metrics"] {
    background: rgba(128, 0, 255, 0.25);
    border-left-color: #8000ff;
}

[data-type="miyabi-metrics"] .chatname {
    color: #8000ff;
    text-shadow: 0 0 8px rgba(128, 0, 255, 0.6);
}

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

/* Scrollbar styling */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
}

::-webkit-scrollbar-thumb {
    background: #00d4ff;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #00b8e6;
}
```

4. **Shutdown source when not visible**: チェック
5. **Refresh browser when scene becomes active**: チェック
6. **OK** をクリック

**配置**:
- X: 1520 (右側)
- Y: 140 (上から少し下)
- Width: 400
- Height: 800

---

### Step 4: Browser Source #2 - Featured Chat

**名前**: `Social Stream Ninja - Featured`

**設定**:
1. **Sources** → **+** → **Browser**
2. **Create New**で名前を入力: `Social Stream Ninja - Featured`
3. **Properties**:

```
URL:
https://socialstream.ninja/featured.html?session=miyabi-narrate&channel=1&autoshow&fade=10

Width: 1200
Height: 150

Custom CSS:
/* Featured Message Overlay */
body {
    background: transparent;
    overflow: hidden;
}

#container {
    background: linear-gradient(90deg, rgba(0, 212, 255, 0.15) 0%, rgba(128, 0, 255, 0.15) 100%);
    border: 2px solid #00d4ff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 24px rgba(0, 212, 255, 0.5);
    backdrop-filter: blur(10px);
}

#author {
    color: #00d4ff;
    font-size: 1.4em;
    font-weight: 700;
    text-shadow: 0 0 12px rgba(0, 212, 255, 0.8);
    margin-bottom: 10px;
}

#content {
    color: #ffffff;
    font-size: 1.6em;
    line-height: 1.5;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

/* Fade in/out animation */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

#container {
    animation: fadeIn 0.5s ease-out;
}
```

4. **Shutdown source when not visible**: チェック
5. **Refresh browser when scene becomes active**: チェック
6. **OK** をクリック

**配置**:
- X: 360 (中央)
- Y: 880 (下部)
- Width: 1200
- Height: 150

---

### Step 5: Display Capture（開発画面）

**名前**: `Development Screen`

**設定**:
1. **Sources** → **+** → **Display Capture**
2. **Create New**で名前を入力: `Development Screen`
3. **Display**: メインディスプレイを選択
4. **OK** をクリック

**配置**:
- Transform → Fit to Screen
- Order: 一番下（背景）

---

### Step 6: Audio Input - BlackHole 2ch設定

#### 6-1. BlackHoleインストール

```bash
# BlackHoleをインストール（仮想音声デバイス）
brew install blackhole-2ch

# または、直接ダウンロード
# https://existential.audio/blackhole/
```

#### 6-2. Audio MIDI Setup設定

```bash
# Audio MIDI Setupを開く
open -a "Audio MIDI Setup"
```

**Multi-Output Device作成**:
1. 左下の **+** ボタン → **Create Multi-Output Device**
2. **Use**にチェック:
   - ✅ BlackHole 2ch
   - ✅ MacBook Pro Speakers（または外部スピーカー）
3. 名前を変更: `VOICEVOX Output`

**System Preferences設定**:
1. **System Settings** → **Sound** → **Output**
2. **VOICEVOX Output** を選択

#### 6-3. OBS Audio Input追加

1. **OBS** → **Settings** → **Audio**
2. **Mic/Auxiliary Audio**:
   - **Mic/Auxiliary Audio 1**: BlackHole 2ch
3. **OK** をクリック

---

## 🧪 Phase 13.4: VOICEVOX音声ルーティングテスト

### テスト手順

#### 1. VOICEVOXサンプル音声再生

```bash
# サンプル音声を再生（BlackHole経由）
afplay -v 1.0 /Users/a003/dev/miyabi-private/tools/output/audio/speaker0_000.wav
```

**確認**:
- OBSの**Audio Mixer**で **Mic/Auxiliary Audio 1** のメーターが反応するか

#### 2. リアルタイム音声テスト

```bash
# VOICEVOX Engineでテスト音声合成
curl -X POST "http://127.0.0.1:50021/audio_query?text=こんにちは&speaker=0" | \
curl -X POST "http://127.0.0.1:50021/synthesis?speaker=0" \
  -H "Content-Type: application/json" \
  -d @- \
  --output /tmp/test_voice.wav

# 再生
afplay /tmp/test_voice.wav
```

**確認**:
- OBSでメーターが反応
- 実際の音声が聞こえる（スピーカー経由）

---

## 🔗 Phase 13.5: Social Stream Ninja接続テスト

### Step 1: ローカルテスト用HTMLページ作成

**ファイル**: `test-social-stream.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Social Stream Ninja - Test</title>
    <script>
        let ws;
        const session_id = "miyabi-narrate-test";

        function connect() {
            ws = new WebSocket(`wss://io.socialstream.ninja/join/${session_id}/1/1`);

            ws.onopen = function() {
                console.log("✅ Connected to Social Stream Ninja");
                document.getElementById("status").textContent = "Connected ✅";
            };

            ws.onmessage = function(event) {
                console.log("📨 Message received:", event.data);
            };

            ws.onerror = function(error) {
                console.error("❌ WebSocket error:", error);
                document.getElementById("status").textContent = "Error ❌";
            };

            ws.onclose = function() {
                console.log("🔌 Disconnected");
                document.getElementById("status").textContent = "Disconnected 🔌";
            };
        }

        function sendMessage() {
            const message = document.getElementById("message").value;
            const payload = {
                action: "sendChat",
                value: message
            };
            ws.send(JSON.stringify(payload));
            console.log("📤 Message sent:", message);
        }

        window.onload = function() {
            connect();
        };
    </script>
</head>
<body>
    <h1>Social Stream Ninja - Test Client</h1>
    <p>Status: <span id="status">Connecting...</span></p>
    <input type="text" id="message" placeholder="Enter message" value="🎤 霊夢: こんにちは！">
    <button onclick="sendMessage()">Send</button>
</body>
</html>
```

### Step 2: OBSでテストページを確認

1. **OBS** で **Social Stream Ninja - Dock** Sourceを選択
2. テストHTMLページから **Send** ボタンをクリック
3. OBS Browser Sourceにメッセージが表示されるか確認

---

## 📡 Phase 13.6: YouTube Live / Twitch接続

### YouTube Live設定

1. **YouTube Studio** → **Create** → **Go live**
2. **Stream key** をコピー

**OBS設定**:
1. **Settings** → **Stream**
2. **Service**: YouTube - RTMPS
3. **Server**: Primary YouTube ingest server
4. **Stream Key**: ペースト
5. **OK** → **Start Streaming**

---

### Twitch設定

1. **Twitch Dashboard** → **Settings** → **Stream**
2. **Primary Stream key** をコピー

**OBS設定**:
1. **Settings** → **Stream**
2. **Service**: Twitch
3. **Server**: Auto (Recommended)
4. **Stream Key**: ペースト
5. **OK** → **Start Streaming**

---

## 🎨 カスタマイズ例

### ロゴ画像追加

**ファイル**: `miyabi-logo.png` (準備)

**OBS設定**:
1. **Sources** → **+** → **Image**
2. **Create New**: `Miyabi Logo`
3. **Image File**: `miyabi-logo.png` を選択
4. **配置**: 左上（X: 20, Y: 20）
5. **サイズ**: 150x150

---

### 進捗バー追加（Browser Source）

**HTML**:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: transparent;
        }
        .progress-container {
            background: rgba(0, 0, 0, 0.6);
            border-radius: 10px;
            padding: 15px;
        }
        .progress-bar {
            width: 100%;
            height: 30px;
            background: #1a1a2e;
            border-radius: 15px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00d4ff 0%, #8000ff 100%);
            animation: progress 5s ease-in-out infinite;
        }
        @keyframes progress {
            0% { width: 0%; }
            50% { width: 100%; }
            100% { width: 0%; }
        }
        .text {
            color: #00d4ff;
            font-size: 18px;
            margin-top: 10px;
            text-align: center;
            text-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
        }
    </style>
</head>
<body>
    <div class="progress-container">
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
        <div class="text">Miyabi Development Progress</div>
    </div>
</body>
</html>
```

---

## 🐛 トラブルシューティング

### Q1: Browser Sourceが表示されない

**対処法**:
1. **Properties** → **Refresh browser when scene becomes active** をチェック
2. Browser Sourceを右クリック → **Interact**
3. F12でDeveloper Toolsを開いてエラー確認

---

### Q2: 音声が聞こえない（BlackHole）

**対処法**:
```bash
# BlackHoleが認識されているか確認
system_profiler SPAudioDataType

# Multi-Output Deviceを再設定
open -a "Audio MIDI Setup"
```

---

### Q3: Social Stream Ninja接続エラー

**対処法**:
1. セッションIDを確認（英数字のみ、スペース不可）
2. WebSocket接続確認: `wss://io.socialstream.ninja` にアクセス可能か
3. ファイアウォール設定確認

---

## 📚 参考リンク

**OBS Studio**:
- 公式サイト: https://obsproject.com/
- macOS版: https://obsproject.com/download#mac
- Wiki: https://obsproject.com/wiki/

**BlackHole**:
- 公式サイト: https://existential.audio/blackhole/
- GitHub: https://github.com/ExistentialAudio/BlackHole

**Social Stream Ninja**:
- 公式サイト: https://socialstream.ninja/
- Dock Page: https://socialstream.ninja/dock.html
- Featured Page: https://socialstream.ninja/featured.html

---

## ✅ 完了チェックリスト

- [ ] OBS Studio起動確認
- [ ] シーンコレクション作成
- [ ] Browser Source #1 (Dock) 追加
- [ ] Browser Source #2 (Featured) 追加
- [ ] Display Capture追加
- [ ] BlackHoleインストール
- [ ] Multi-Output Device作成
- [ ] OBS Audio Input設定
- [ ] VOICEVOX音声ルーティングテスト
- [ ] Social Stream Ninja接続テスト
- [ ] YouTube Live / Twitch接続テスト

---

**作成者**: Claude Code (AI Assistant)
**最終更新**: 2025-10-23
**バージョン**: v1.0.0

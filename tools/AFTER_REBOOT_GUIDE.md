# 🔄 再起動後クイックガイド - BlackHole 2ch 設定

**目的**: BlackHole 2chインストール後の再起動完了後の設定手順

---

## ✅ Step 1: BlackHole 2ch 確認

### ターミナルで確認

```bash
system_profiler SPAudioDataType | grep -A 10 "BlackHole"
```

**期待される出力**:
```
BlackHole 2ch:

  Manufacturer: Existential Audio Inc.
  Output Channels: 2
  Current SampleRate: 48000
  ...
```

✅ 上記のような出力が表示されれば、BlackHole 2chのインストールが正常に完了しています。

---

## ✅ Step 2: Audio MIDI Setup で Multi-Output Device 作成

### 2.1 Audio MIDI Setup を開く

```bash
open -a "Audio MIDI Setup"
```

### 2.2 BlackHole 2ch が表示されることを確認

左側のデバイスリストに **「BlackHole 2ch」** が表示されているはずです。

### 2.3 Multi-Output Device を作成

1. **左下の「+」ボタンをクリック**
2. **「Create Multi-Output Device」を選択**

### 2.4 デバイスを選択

右側の **Use** リストで、以下の2つにチェック:

- ✅ **BlackHole 2ch**
- ✅ **MacBook Pro Speakers**（または外部スピーカー）

### 2.5 デバイス名を変更

1. 作成されたMulti-Output Deviceを**右クリック**
2. **「Rename」**を選択
3. 名前を `VOICEVOX Output` に変更

### 2.6 Sample Rate を統一

両方のデバイスで同じSample Rateを設定:
- BlackHole 2ch: **48000 Hz**
- Speakers: **48000 Hz**

---

## ✅ Step 3: System Sound Output 設定

### 3.1 System Settings を開く

```bash
open "x-apple.systempreferences:com.apple.preference.sound"
```

または、手動で:
- Apple Menu → System Settings → Sound → Output

### 3.2 VOICEVOX Output を選択

出力デバイス一覧から **「VOICEVOX Output」** を選択

**これにより**:
- システム音声 → VOICEVOX Output → BlackHole + Speakers に送信
- BlackHole経由でOBSに取り込み
- 同時にスピーカーからも音が聞こえる

---

## ✅ Step 4: VOICEVOX Engine 起動（オプション）

音声合成をテストする場合:

```bash
cd /Users/a003/dev/voicevox_engine
export PATH="$HOME/.local/bin:$PATH"
uv run run.py --enable_mock --host 127.0.0.1 --port 50021 > /tmp/voicevox_engine.log 2>&1 &
```

---

## ✅ Step 5: 動作確認テスト

### Test 1: システム音声テスト

```bash
afplay /System/Library/Sounds/Ping.aiff
```

**確認項目**:
- ✅ スピーカーから音が聞こえる
- ✅ （OBS起動時）OBS Audio Mixerで **Mic/Aux** のメーターが反応

---

### Test 2: VOICEVOX音声テスト

```bash
cd /Users/a003/dev/miyabi-private/tools
afplay output/audio/speaker0_000.wav
```

**確認項目**:
- ✅ スピーカーから霊夢の声が聞こえる
- ✅ （OBS起動時）OBS Audio Mixerで **Mic/Aux** のメーターが反応

---

## ✅ Step 6: OBS Studio 設定

### 6.1 OBS Studio を起動

```bash
open -a "OBS"
```

### 6.2 Audio Input 設定

1. **OBS → Settings → Audio**
2. **Mic/Auxiliary Audio 1**: `BlackHole 2ch` を選択
3. **Apply** → **OK**

### 6.3 Audio Mixer 確認

OBSのメインウィンドウで **Audio Mixer** セクションを確認:
- **Mic/Aux** が表示されている
- ミュートされていない（スピーカーアイコンに斜線がない）

---

## ✅ Step 7: Browser Source 追加

### 7.1 Sources に Browser Source を追加

1. **OBS → Sources → +（Add）→ Browser**
2. **Name**: `Social Stream Ninja Dock`
3. **Create New** → **OK**

### 7.2 Browser Source 設定

**URL**:
```
https://socialstream.ninja/dock.html?session=miyabi-narrate-1761208340&channel=1
```

**Width**: `1920`
**Height**: `1080`

**オプション**:
- ✅ **Shutdown source when not visible**
- ✅ **Refresh browser when scene becomes active**

### 7.3 カスタムCSS（オプション）

詳細は `OBS_SETUP_GUIDE.md` の「Custom CSS Theming」セクション参照

---

## ✅ Step 8: 統合テスト

### フルワークフロー実行

```bash
cd /Users/a003/dev/miyabi-private/tools
./miyabi-narrate.sh -d 1 -l
```

**期待される結果**:
- ✅ Git commits → 台本 → 音声 → Social Stream Ninja
- ✅ OBS Browser Sourceにメッセージ表示
- ✅ OBS Audio Mixerでメーター反応

---

## 🎯 完了チェックリスト

- [ ] BlackHole 2chがシステムに認識されている
- [ ] Multi-Output Device (VOICEVOX Output) 作成完了
- [ ] System Sound Outputが「VOICEVOX Output」に設定
- [ ] OBS Audio Inputが「BlackHole 2ch」に設定
- [ ] OBS Browser Sourceが追加されている
- [ ] Test 1: システム音声テスト成功
- [ ] Test 2: VOICEVOX音声テスト成功
- [ ] Test 8: フルワークフロー統合テスト成功

---

## 📚 参考ドキュメント

- **詳細設定**: `BLACKHOLE_MANUAL_INSTALL.md`
- **OBSセットアップ**: `OBS_SETUP_GUIDE.md`
- **トラブルシューティング**: `PHASE_13_5_TEST_REPORT.md`

---

## 🐛 トラブルシューティング

### Q: BlackHole 2chが表示されない

**対処法**:
```bash
# インストール確認
brew list | grep blackhole

# 再インストール
brew reinstall blackhole-2ch

# 再起動
sudo reboot
```

---

### Q: Multi-Output Deviceが作成できない

**対処法**:
1. Audio MIDI Setupを完全に終了
2. 再度開く
3. BlackHole 2chが表示されているか確認
4. 表示されていない場合は再起動

---

### Q: OBSで音が聞こえない

**確認項目**:
- [ ] System Sound Outputが「VOICEVOX Output」になっているか
- [ ] OBS Settings → Audio → Mic/Auxiliary Audio 1が「BlackHole 2ch」になっているか
- [ ] OBS Audio Mixerで「Mic/Aux」が表示されているか
- [ ] OBS Audio Mixerで「Mic/Aux」がミュートされていないか

---

**作成者**: Claude Code (AI Assistant)
**作成日**: 2025-10-23
**バージョン**: v1.0.0

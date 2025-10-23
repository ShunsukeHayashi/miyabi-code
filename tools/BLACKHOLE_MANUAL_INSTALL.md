# BlackHole 手動インストールガイド

**目的**: VOICEVOX音声をOBS Studioに取り込むための仮想音声デバイスのインストール

---

## 📦 方法1: Homebrew経由でインストール（推奨）

### ターミナルで実行

```bash
# BlackHole 2chをインストール
brew install blackhole-2ch
```

**管理者パスワードの入力が必要です**

インストール完了後、以下のメッセージが表示されます：
```
You must reboot for the installation of blackhole-2ch to take effect.
```

**重要**: インストール後に再起動が必要です

---

## 📦 方法2: 公式サイトから直接ダウンロード

### Step 1: ダウンロード

公式サイトからダウンロード: https://existential.audio/blackhole/

**ファイル**: `BlackHole2ch.v0.6.1.pkg` (約2MB)

### Step 2: インストール

1. ダウンロードした `.pkg` ファイルをダブルクリック
2. インストーラーの指示に従う
3. 管理者パスワードを入力
4. **インストール完了後、Macを再起動**

---

## ✅ インストール確認

再起動後、以下のコマンドで確認：

```bash
# システム音声デバイス一覧を表示
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

---

## 🎛️ Multi-Output Device 作成

BlackHoleインストール後、以下の手順で Multi-Output Device を作成します：

### Step 1: Audio MIDI Setup を開く

```bash
open -a "Audio MIDI Setup"
```

または、Spotlight検索で "Audio MIDI Setup" を検索

### Step 2: Multi-Output Device 作成

1. 左下の **+** ボタンをクリック
2. **Create Multi-Output Device** を選択
3. 右側の **Use** リストで以下をチェック：
   - ✅ **BlackHole 2ch**
   - ✅ **MacBook Pro Speakers**（または外部スピーカー）

4. デバイス名を変更:
   - 右クリック → **Rename** → `VOICEVOX Output`

### Step 3: Sample Rateを統一

両方のデバイスで同じSample Rateを設定：
- BlackHole 2ch: **48000 Hz**
- Speakers: **48000 Hz**

---

## 🔊 System Sound Output 設定

### macOS Sound Settings

1. **System Settings** → **Sound** → **Output**
2. **VOICEVOX Output** を選択

**これにより**:
- システム音声 → VOICEVOX Output → BlackHole + Speakers に送信
- BlackHole経由でOBSに取り込み
- 同時にスピーカーからも音が聞こえる

---

## 🎬 OBS Studio Audio Input 設定

### Step 1: OBS Settingsを開く

```
OBS Studio → Settings → Audio
```

### Step 2: Mic/Auxiliary Audio 設定

**Mic/Auxiliary Audio 1**:
- **Device**: BlackHole 2ch

**Mic/Auxiliary Audio 2**:
- **Device**: Disabled（または他のマイク）

### Step 3: Audio Mixerで確認

OBSのメインウィンドウで **Audio Mixer** を確認：
- **Mic/Aux** のメーターが表示されている

---

## 🧪 テスト手順

### Test 1: システム音声テスト

```bash
# システム音声を再生
afplay /System/Library/Sounds/Ping.aiff
```

**確認**:
- ✅ スピーカーから音が聞こえる
- ✅ OBS Audio Mixerで **Mic/Aux** のメーターが反応

---

### Test 2: VOICEVOX音声テスト

```bash
# VOICEVOX生成音声を再生
cd /Users/a003/dev/miyabi-private/tools
afplay output/audio/speaker0_000.wav
```

**確認**:
- ✅ スピーカーから音が聞こえる（霊夢の声）
- ✅ OBS Audio Mixerで **Mic/Aux** のメーターが反応
- ✅ メーターの動きが音声の強さに応じて変化

---

### Test 3: リアルタイムVOICEVOX音声テスト

```bash
# VOICEVOXエンジンでテスト音声生成
curl -X POST "http://127.0.0.1:50021/audio_query?text=こんにちは、これはテストです&speaker=0" \
  -H "Content-Type: application/json" \
  | curl -X POST "http://127.0.0.1:50021/synthesis?speaker=0" \
    -H "Content-Type: application/json" \
    -d @- \
    --output /tmp/voicevox_test.wav

# 再生
afplay /tmp/voicevox_test.wav
```

**確認**:
- ✅ "こんにちは、これはテストです" と聞こえる
- ✅ OBS Audio Mixerでメーターが反応

---

## 🐛 トラブルシューティング

### Q1: BlackHoleが見つからない

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

### Q2: Multi-Output Deviceが作成できない

**対処法**:
1. Audio MIDI Setupを完全に終了
2. 再度開く
3. BlackHole 2chが表示されているか確認
4. 表示されていない場合は再起動

---

### Q3: OBSで音が聞こえない

**確認項目**:
- [ ] System Sound Output が "VOICEVOX Output" になっているか
- [ ] OBS Settings → Audio → Mic/Auxiliary Audio 1 が "BlackHole 2ch" になっているか
- [ ] OBS Audio Mixerで "Mic/Aux" が表示されているか
- [ ] OBS Audio Mixerで "Mic/Aux" がミュートされていないか（スピーカーアイコン）

---

### Q4: 音が聞こえるが録音されない

**対処法**:
```bash
# BlackHoleのサンプルレートを確認
system_profiler SPAudioDataType | grep -A 20 "BlackHole"

# 48000 Hz になっているか確認
# 異なる場合は Audio MIDI Setup で変更
```

---

### Q5: 音が二重に聞こえる

**原因**: Multi-Output Device に同じデバイスが2つ選択されている

**対処法**:
1. Audio MIDI Setup を開く
2. Multi-Output Device (VOICEVOX Output) を選択
3. **Use** リストで重複を削除

---

## 📊 完了チェックリスト

- [ ] BlackHole 2ch インストール完了
- [ ] Mac再起動完了
- [ ] BlackHoleがシステムに認識されている（`system_profiler` で確認）
- [ ] Multi-Output Device (VOICEVOX Output) 作成完了
- [ ] System Sound Output が "VOICEVOX Output" に設定
- [ ] OBS Audio Input が "BlackHole 2ch" に設定
- [ ] Test 1: システム音声テスト成功
- [ ] Test 2: VOICEVOX音声テスト成功
- [ ] Test 3: リアルタイム音声テスト成功

---

## 🔄 アンインストール方法（参考）

BlackHoleが不要になった場合：

```bash
brew uninstall blackhole-2ch
```

または、公式アンインストーラー:
```bash
# ダウンロード: https://existential.audio/blackhole/
# BlackHoleUninstaller.pkg を実行
```

---

## 📚 参考リンク

- **BlackHole 公式サイト**: https://existential.audio/blackhole/
- **GitHub**: https://github.com/ExistentialAudio/BlackHole
- **ドキュメント**: https://github.com/ExistentialAudio/BlackHole/wiki

---

**作成者**: Claude Code (AI Assistant)
**作成日**: 2025-10-23
**バージョン**: v1.0.0

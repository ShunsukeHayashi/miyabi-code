# Stream Deck クイックセットアップ 📱

**5分でセットアップ完了！**

---

## ステップ1️⃣: アプリインストール

📱 **Stream Deck Mobile** をインストール
- iOS: App Store
- Android: Google Play

---

## ステップ2️⃣: プロファイル作成

1. アプリを開く
2. 「+」→ 新しいプロファイル
3. 名前: **Miyabi Development**

---

## ステップ3️⃣: ボタン追加

### テンプレート

**全てのボタン共通設定**:
- アクション: `System` → `Open`
- Application/File: 👇以下のパスを入力

---

### ボタン1: 🔊 音声通知

```
パス:
/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/01-notify-voice.sh

引数:
タスク完了しました

タイトル: Voice Notify
アイコン: 🔊
```

---

### ボタン2: 🏗️ ビルド

```
パス:
/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/02-build-release.sh

タイトル: Build
アイコン: 🏗️
```

---

### ボタン3: ✅ テスト

```
パス:
/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/03-run-tests.sh

タイトル: Test
アイコン: ✅
```

---

### ボタン4: 📊 Git

```
パス:
/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/04-git-status.sh

タイトル: Git
アイコン: 📊
```

---

### ボタン5: ▶️ Next

```
パス:
/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh

引数: next

タイトル: Next
アイコン: ▶️
```

---

### ボタン6: ⏭️ Continue

```
パス:
/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh

引数: continue

タイトル: Continue
アイコン: ⏭️
```

---

### ボタン7: 🔧 Fix

```
パス:
/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh

引数: fix

タイトル: Fix
アイコン: 🔧
```

---

### ボタン8: ∞ Infinity

```
パス:
/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh

引数: infinity

タイトル: Infinity
アイコン: ∞
```

---

### ボタン9: ❓ Help

```
パス:
/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh

引数: help

タイトル: Help
アイコン: ❓
```

---

## ステップ4️⃣: Mac設定

### アクセシビリティ権限

1. システム設定を開く
2. プライバシーとセキュリティ
3. アクセシビリティ
4. Stream Deck を✅ON

---

## 完了！ 🎉

### 使い方

1. MacでVS Code起動
2. iPhoneでStream Deckアプリ起動
3. ボタンをタップ！

---

## トラブルシューティング 🔧

### ボタンが動かない

✅ パスをコピペし直す
✅ 実行権限を確認:
```bash
chmod +x tools/stream-deck/*.sh
```

### VS Codeに送信されない

✅ アクセシビリティ権限を確認
✅ VS Codeを前面に表示

### 音声が聞こえない

✅ VOICEVOXワーカーを起動:
```bash
tools/voicevox_worker.sh &
```

---

## パスをコピー 📋

Macでこのコマンドを実行:

```bash
cd /Users/shunsuke/Dev/miyabi-private
tools/stream-deck/setup-stream-deck.sh
```

パス情報が表示されます！

---

**詳細**: `docs/STREAM_DECK_SETUP_GUIDE.md`

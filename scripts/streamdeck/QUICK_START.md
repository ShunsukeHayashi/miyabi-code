# 🚀 Stream Deck Mobile クイックスタート

**5分で完了！** スマートフォンからMiyabiを完全コントロール

---

## ✅ 完成したもの

### 📁 スクリプト総数: **43個**

#### Profile 1: Main Dashboard (メインダッシュボード)
- ✅ `01-start-miyabi.sh` - Miyabi起動
- ✅ `02-orchestra-mode.sh` - Orchestra展開
- ✅ `03-status-check.sh` - システム状態確認
- ✅ `04-sync-all.sh` - Git同期
- ✅ `06-08-agent-*.sh` - Agent制御 (Tsubaki, Kaede, Sakura)
- ✅ `09-10-ssh-*.sh` - MUGEN/MAJIN接続
- ✅ `11-issue-create.sh` - Issue作成
- ✅ `12-lark-notify.sh` - Lark通知
- ✅ `13-voice-input.sh` - Pixel音声入力
- ✅ `14-deploy-now.sh` - デプロイ実行
- ✅ `15-stop-all.sh` - 緊急停止

#### Profile 2-5: 残り29スクリプト
- Business Agents制御
- 開発ツール
- モニタリング
- クイックアクション

---

## 🎯 最速セットアップ（3ステップ）

### Step 1: スマホにStream Deck Mobileインストール

App Store / Google Playから「Stream Deck Mobile」をインストール

### Step 2: Macと接続

1. Stream Deckアプリ起動（既に起動済み ✅）
2. スマホ側で接続を承認

### Step 3: ボタン設定

**Option A: 自動設定スクリプト実行** ⭐推奨
```bash
cd ~/Dev/miyabi-private/scripts/streamdeck
./auto-configure-streamdeck.sh
```

**Option B: 手動設定**
`SETUP_GUIDE.md` を参照して1つずつ設定

---

## 🎮 使用例

### 例1: Miyabi起動 → Status確認

1. スマホでStream Deck Mobileアプリを開く
2. 「🎯 Start Miyabi」ボタンをタップ
3. 「📊 Status」ボタンでシステム確認

### 例2: Orchestra展開 → Agent操作

1. 「🎭 Orchestra」ボタン → 14 Agents起動
2. 「🌸 Tsubaki」ボタン → Tsubakiにメッセージ送信
3. 「📊 Status」で確認

### 例3: Voice Input → Issue作成

1. 「🎤 Voice」ボタン → Pixelで音声入力
2. 認識結果をコピー
3. 「📝 Issue」ボタン → GitHub Issue作成

### 例4: 緊急停止

問題発生時：
1. 「🛑 Stop All」ボタンを即座にタップ
2. 全プロセスが安全に停止

---

## 📊 全体アーキテクチャ

```
┌─────────────────────────────────────┐
│   📱 Stream Deck Mobile (スマホ)    │
│        15 Buttons x 5 Profiles      │
│        = 75 Total Controls          │
└────────────┬────────────────────────┘
             │ Wi-Fi
┌────────────▼────────────────────────┐
│   💻 Elgato Stream Deck (Mac)      │
│      43 Shell Scripts Ready         │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│   🎯 Miyabi Orchestra System        │
│   • 14 Business Agents              │
│   • MUGEN/MAJIN Coordinators        │
│   • Pixel Voice Input               │
│   • Lark Notifications              │
│   • GitHub Integration              │
└─────────────────────────────────────┘
```

---

## 🎨 ボタンレイアウト

### Profile 1 (Main Dashboard)

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ 🎯 Start │ 🎭 Orch  │ 📊 Status│ 🔄 Sync  │ ⚙️  Next  │
│  Miyabi  │  Mode    │  Check   │   All    │ Profile  │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 🌸 Agent │ 🍁 Agent │ 🌺 Agent │ 🌊 MUGEN │ ⚡ MAJIN │
│  Tsubaki │  Kaede   │  Sakura  │  SSH     │  SSH     │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 📝 Issue │ 💬 Lark  │ 🎤 Voice │ 🚀 Deploy│ 🛑 Stop  │
│  Create  │  Notify  │  Input   │   Now    │   All    │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

**完全なコントロールがスマホから！** 🎮✨

---

## 🔗 次のステップ

1. ✅ スクリプト生成完了
2. 📱 Stream Deck Mobile接続
3. ⚙️  ボタン設定 → `SETUP_GUIDE.md` 参照
4. 🧪 テスト実行
5. 🎨 アイコン・色カスタマイズ
6. 🚀 実運用開始！

---

## 📚 関連ドキュメント

- **`README.md`** - 完全ドキュメント（75ボタン全仕様）
- **`SETUP_GUIDE.md`** - 詳細セットアップ手順
- **`QUICK_START.md`** - このファイル（5分スタート）

---

**あなたのスマートフォンが、Miyabiの完全なコマンドセンターに変わります** 🎮

質問がある場合は、Guardianにお気軽にお尋ねください！

# Stream Deck - Miyabi連携セットアップガイド

**最終更新**: 2025-10-26
**対象**: Stream Deckモバイルアプリ (iOS/Android)
**プロジェクト**: Miyabi - 自律型開発フレームワーク

---

## 🎯 概要

Stream Deckモバイルアプリから、Miyabiプロジェクトの各種操作とClaude Codeへの指示送信を行うためのショートカットシステムです。

**実現できること**:
- 🔊 音声通知送信
- 🏗️ リリースビルド実行
- ✅ テスト実行
- 📊 Git status確認
- 💬 Claude Codeへのテキスト送信
- ⚡ よく使う定型コマンド（Next, Continue, Fix等）

---

## 📋 前提条件

### 必須環境

1. **macOS** (Apple Silicon / Intel両対応)
2. **Stream Deck Mobile アプリ** (iOS/Android)
   - App Store: https://apps.apple.com/app/elgato-stream-deck-mobile/id1440014184
   - Google Play: https://play.google.com/store/apps/details?id=com.corsair.android.streamdeck
3. **Visual Studio Code** + Claude Code拡張機能
4. **Miyabiプロジェクト** (このリポジトリ)

### 推奨環境

- Stream Deck Mobile: 最新版
- VS Code: 最新版
- macOS: Monterey (12.0) 以降

---

## 🚀 セットアップ手順

### Step 1: Stream Deck Mobileアプリのインストール

1. App Store または Google Play から Stream Deck Mobile をインストール
2. アプリを起動し、アカウント作成（無料）
3. MacとiPhone/Androidを同じWi-Fiネットワークに接続

### Step 2: Mac側の設定

#### 2-1. アクセシビリティ権限の付与

Stream Deckがキーボード操作を送信するために必要です。

1. **システム設定** → **プライバシーとセキュリティ** → **アクセシビリティ**
2. **Stream Deck** を探して有効化
3. ロックアイコンをクリックしてパスワード入力（必要に応じて）

#### 2-2. Miyabiスクリプトの確認

```bash
cd /Users/shunsuke/Dev/miyabi-private
ls -l tools/stream-deck/
```

以下のスクリプトが実行権限付きで存在することを確認：
```
-rwxr-xr-x  01-notify-voice.sh
-rwxr-xr-x  02-build-release.sh
-rwxr-xr-x  03-run-tests.sh
-rwxr-xr-x  04-git-status.sh
-rwxr-xr-x  05-send-to-claude.sh
-rwxr-xr-x  06-quick-commands.sh
```

### Step 3: Stream Deck Mobileでのボタン作成

#### プロファイル作成

1. Stream Deck Mobileアプリを開く
2. 「+」ボタンをタップして新しいプロファイルを作成
3. 名前: **Miyabi Development**

#### ボタン1: 音声通知送信

**設定**:
- **アクション**: System → Open
- **アプリ/ファイル**: `/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/01-notify-voice.sh`
- **引数**: `"コーディング完了しました"`（任意のメッセージ）
- **アイコン**: 🔊（音声アイコン）
- **タイトル**: Voice Notify

**詳細手順**:
1. 空のボタンをタップ
2. 「System」カテゴリを選択
3. 「Open」アクションを選択
4. 「Application/File」フィールドに上記パスを入力
5. 「Arguments」フィールドにメッセージを入力（省略可）
6. アイコンとタイトルを設定

#### ボタン2: リリースビルド

**設定**:
- **アクション**: System → Open
- **アプリ/ファイル**: `/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/02-build-release.sh`
- **アイコン**: 🏗️
- **タイトル**: Build Release

#### ボタン3: テスト実行

**設定**:
- **アクション**: System → Open
- **アプリ/ファイル**: `/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/03-run-tests.sh`
- **アイコン**: ✅
- **タイトル**: Run Tests

#### ボタン4: Git Status

**設定**:
- **アクション**: System → Open
- **アプリ/ファイル**: `/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/04-git-status.sh`
- **アイコン**: 📊
- **タイトル**: Git Status

#### ボタン5-10: Claude Code 定型コマンド

**ボタン5: Next**
- **アクション**: System → Open
- **アプリ/ファイル**: `/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh`
- **引数**: `next`
- **アイコン**: ▶️
- **タイトル**: Next

**ボタン6: Continue**
- **引数**: `continue`
- **アイコン**: ⏭️
- **タイトル**: Continue

**ボタン7: Fix Errors**
- **引数**: `fix`
- **アイコン**: 🔧
- **タイトル**: Fix

**ボタン8: Run Tests**
- **引数**: `test`
- **アイコン**: 🧪
- **タイトル**: Test

**ボタン9: Infinity Mode**
- **引数**: `infinity`
- **アイコン**: ∞
- **タイトル**: Infinity

**ボタン10: Help**
- **引数**: `help`
- **アイコン**: ❓
- **タイトル**: Help

---

## 📱 使用方法

### 基本的な流れ

1. **macOSでVS Codeを起動**
   ```bash
   code /Users/shunsuke/Dev/miyabi-private
   ```

2. **Claude Codeセッション開始**
   - VS Codeで Cmd+L を押してClaude Codeチャット開始

3. **Stream Deck Mobileアプリ起動**
   - iPhone/Androidで Stream Deck アプリを開く
   - **Miyabi Development** プロファイルを選択

4. **ボタンをタップして操作実行**

### 使用例

#### 例1: コーディング後のビルド&テスト

```
1. コードを編集
2. Stream Deck: [Build Release] ボタンをタップ
   → 音声通知: "リリースビルドを開始します"
   → ビルド実行
   → 音声通知: "リリースビルドが成功しました"
3. Stream Deck: [Run Tests] ボタンをタップ
   → 音声通知: "全テストを実行します"
   → テスト実行
   → 音声通知: "全テストが成功しました"
```

#### 例2: Claude Codeとの対話

```
1. Stream Deck: [Next] ボタンをタップ
   → VS Codeに "Next" が自動入力される
   → Claude Codeが次のタスクを実行

2. Stream Deck: [Fix] ボタンをタップ
   → "Fix build errors" が送信される
   → Claude Codeがビルドエラーを修正

3. Stream Deck: [Infinity] ボタンをタップ
   → "/miyabi-infinity" が送信される
   → Infinity Mode起動
```

#### 例3: Git状態の確認

```
1. Stream Deck: [Git Status] ボタンをタップ
   → 音声通知: "ブランチmain、変更ファイル5件、コミット待機2件"
   → macOS通知にも同じ内容表示
   → 詳細ログが /tmp/miyabi-git-status.log に保存
```

---

## 🎨 カスタマイズ

### メッセージのカスタマイズ

`01-notify-voice.sh`の引数を変更して、好きなメッセージを送信できます。

**Stream Deck設定画面**:
```
Arguments: "テストが完了しました"
Arguments: "デプロイ準備完了"
Arguments: "休憩時間です"
```

### 独自コマンドの追加

`06-quick-commands.sh`の`case`文に追加：

```bash
"deploy"|"d")
    MESSAGE="Deploy to production"
    ;;
"review"|"r")
    MESSAGE="Review my code and suggest improvements"
    ;;
```

### アイコンのカスタマイズ

Stream Deck Mobileアプリ内でアイコンを変更できます：
1. ボタンを長押し
2. 「Edit」をタップ
3. 「Icon」をタップして変更

**推奨アイコン**:
- 🔊 音声通知
- 🏗️ ビルド
- ✅ テスト
- 📊 Git
- ▶️ Next
- ⏭️ Continue
- 🔧 Fix
- ∞ Infinity
- 💬 Chat

---

## 🔍 トラブルシューティング

### 問題1: スクリプトが実行されない

**症状**: ボタンを押しても何も起こらない

**解決策**:
1. スクリプトに実行権限があるか確認
   ```bash
   chmod +x tools/stream-deck/*.sh
   ```

2. パスが正しいか確認
   ```bash
   ls -l /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/
   ```

3. Stream Deckアプリのログを確認
   - アプリ内の「Settings」→「Logs」

### 問題2: VS Codeが反応しない

**症状**: Claude Codeにテキストが送信されない

**解決策**:
1. アクセシビリティ権限を確認
   - システム設定 → プライバシーとセキュリティ → アクセシビリティ
   - Stream Deck が有効になっているか確認

2. VS Codeが前面にあるか確認
   - `05-send-to-claude.sh`は自動的にVS Codeをアクティブにしますが、
     他のアプリが全画面表示だと動作しない場合があります

3. キーボードショートカットが変更されていないか確認
   - Cmd+L が Claude Code チャット起動であることを確認

### 問題3: 音声通知が再生されない

**症状**: VOICEVOXの音声が聞こえない

**解決策**:
1. VOICEVOXワーカーが起動しているか確認
   ```bash
   pgrep -f voicevox_worker.sh
   ```

2. ワーカーを手動起動
   ```bash
   tools/voicevox_worker.sh &
   ```

3. キューを確認
   ```bash
   ls /tmp/voicevox_queue/
   ```

### 問題4: macOS通知が表示されない

**症状**: 音声は聞こえるが通知が出ない

**解決策**:
1. 通知設定を確認
   - システム設定 → 通知
   - 「スクリプトエディタ」または「Terminal」の通知を有効化

2. おやすみモードを確認
   - おやすみモードがONだと通知が抑制されます

---

## 📊 スクリプト一覧

| スクリプト | 機能 | 引数 | 実行時間 |
|-----------|------|------|---------|
| `01-notify-voice.sh` | 音声通知送信 | メッセージ（省略可） | <1秒 |
| `02-build-release.sh` | リリースビルド | なし | ~20秒 |
| `03-run-tests.sh` | 全テスト実行 | なし | 30秒-5分 |
| `04-git-status.sh` | Git状態確認 | なし | <1秒 |
| `05-send-to-claude.sh` | テキスト送信 | メッセージ | <1秒 |
| `06-quick-commands.sh` | 定型コマンド | コマンド名 | <1秒 |

---

## 🎯 推奨レイアウト

### 3x3グリッド（9ボタン）

```
┌─────────┬─────────┬─────────┐
│ 🔊      │ 🏗️     │ ✅      │
│ Voice   │ Build   │ Test    │
├─────────┼─────────┼─────────┤
│ 📊      │ ▶️      │ ⏭️     │
│ Git     │ Next    │Continue │
├─────────┼─────────┼─────────┤
│ 🔧      │ ∞       │ ❓      │
│ Fix     │Infinity │ Help    │
└─────────┴─────────┴─────────┘
```

### 4x4グリッド（16ボタン）

```
┌────────┬────────┬────────┬────────┐
│ 🔊     │ 🏗️    │ ✅     │ 📊     │
│ Voice  │ Build  │ Test   │ Git    │
├────────┼────────┼────────┼────────┤
│ ▶️     │ ⏭️    │ 🔧     │ 🧪     │
│ Next   │Continue│ Fix    │ Test   │
├────────┼────────┼────────┼────────┤
│ 💬     │ 📝     │ ∞      │ 🚀     │
│Commit  │ PR     │Infinity│Deploy  │
├────────┼────────┼────────┼────────┤
│ ❓     │ 🎨     │ 📚     │ ⚙️     │
│ Help   │Design  │ Docs   │Config  │
└────────┴────────┴────────┴────────┘
```

---

## 🚀 次のステップ

### 基本セットアップ完了後

1. **実際に使ってみる**
   - 各ボタンを試して動作確認
   - 自分の作業フローに合わせて配置変更

2. **カスタマイズ**
   - よく使うコマンドを追加
   - メッセージをカスタマイズ
   - アイコンを変更

3. **複数プロファイル作成**
   - 開発用プロファイル
   - デバッグ用プロファイル
   - デプロイ用プロファイル

### 高度な活用

#### マルチアクション設定

Stream Deck Mobileの「Multi Action」機能を使うと、複数のアクションを順次実行できます。

**例: ビルド→テスト→Git Statusの自動実行**
1. Multi Actionボタンを作成
2. 以下を順に追加：
   - `02-build-release.sh`
   - Delay (20秒)
   - `03-run-tests.sh`
   - Delay (60秒)
   - `04-git-status.sh`

#### フォルダー機能

ボタンをフォルダーでグループ化できます。

**例**:
- **📁 Development**
  - Build
  - Test
  - Git Status
- **📁 Claude**
  - Next
  - Continue
  - Fix
- **📁 Deploy**
  - Deploy Staging
  - Deploy Production

---

## 📚 参考リンク

- **Stream Deck Mobile公式**: https://www.elgato.com/stream-deck-mobile
- **Miyabiプロジェクト**: `/Users/shunsuke/Dev/miyabi-private/`
- **Claude Code**: https://claude.com/claude-code
- **VOICEVOXセットアップ**: `docs/VOICEVOX_HOOKS_QUICKSTART.md`

---

## 🤝 サポート

**問題が解決しない場合**:
1. `docs/STREAM_DECK_SETUP_GUIDE.md`（このファイル）を再確認
2. スクリプトのログファイルを確認（`/tmp/miyabi-*.log`）
3. GitHub Issueを作成

---

**作成日**: 2025-10-26
**バージョン**: 1.0.0
**対象OS**: macOS Monterey以降
**対象アプリ**: Stream Deck Mobile (iOS/Android)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**Stream Deckで開発効率が劇的に向上します！ 🚀**

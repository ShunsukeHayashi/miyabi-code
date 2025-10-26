# Stream Deck ボタン引数設定ガイド

**最終更新**: 2025-10-26
**対象**: Stream Deck Mobile (iOS/Android)

このガイドでは、Stream Deck Mobileアプリでボタンの引数を設定する方法を詳しく解説します。

---

## 📱 基本設定手順

### Step 1: ボタン編集画面を開く

1. **Stream Deck Mobileアプリ**を起動
2. 設定したいボタンを**長押し**
3. 表示されるメニューから「**Edit**」をタップ

### Step 2: Actionを設定

1. **Action**セクションで「**System**」を選択
2. 「**Open**」を選択
3. **Path**フィールドにスクリプトのフルパスを入力
4. **Arguments**フィールドに引数を入力 ← **ここが重要！**

---

## 🎯 Arguments フィールドの入力方法

### 基本ルール

```
✅ 正しい入力:
next                    # シンプルな引数（クォート不要）
continue                # 単語1つ
fix                     # 短い単語
--issue 270            # フラグ付き引数
"Build completed!"     # スペースを含む場合のみクォート

❌ 間違った入力:
"next"                 # 不要なクォート
next continue          # 複数引数（スクリプト側で対応必要）
Next                   # 大文字小文字を確認（スクリプト依存）
```

---

## 📋 実際の設定例

### 例1: Quick Commands ボタン（引数あり）

**ボタン名**: ▶️ Next

```
┌──────────────────────────────────────┐
│ Action: System → Open                │
├──────────────────────────────────────┤
│ Path:                                 │
│ /Users/shunsuke/Dev/miyabi-private/  │
│ tools/stream-deck/                    │
│ 06-quick-commands.sh                  │
├──────────────────────────────────────┤
│ Arguments:                            │
│ next                    ← ここに入力！│
├──────────────────────────────────────┤
│ Title: Next                           │
│ Icon: 01-next.jpeg                    │
└──────────────────────────────────────┘
```

**他の引数例**:
- `continue` - 継続コマンド
- `fix` - エラー修正コマンド
- `help` - ヘルプ表示
- `commit` - コミット作成
- `pr` - PR作成
- `infinity` - Infinityモード起動

### 例2: Build Release ボタン（引数なし）

**ボタン名**: 🏗️ Build

```
┌──────────────────────────────────────┐
│ Action: System → Open                │
├──────────────────────────────────────┤
│ Path:                                 │
│ /Users/shunsuke/Dev/miyabi-private/  │
│ tools/stream-deck/                    │
│ 02-build-release.sh                   │
├──────────────────────────────────────┤
│ Arguments:                            │
│ （空欄のまま）          ← 引数不要！  │
├──────────────────────────────────────┤
│ Title: Build                          │
│ Icon: 05-build.jpeg                   │
└──────────────────────────────────────┘
```

### 例3: Voice Notification ボタン（カスタムメッセージ）

**ボタン名**: 🔊 Voice

```
┌──────────────────────────────────────┐
│ Action: System → Open                │
├──────────────────────────────────────┤
│ Path:                                 │
│ /Users/shunsuke/Dev/miyabi-private/  │
│ tools/stream-deck/                    │
│ 01-notify-voice.sh                    │
├──────────────────────────────────────┤
│ Arguments:                            │
│ "作業を開始します"    ← クォート推奨│
├──────────────────────────────────────┤
│ Title: Voice                          │
│ Icon: 29-voice.jpeg                   │
└──────────────────────────────────────┘
```

**日本語メッセージ例**:
- `"ビルドを開始します"`
- `"テストが完了しました"`
- `"休憩時間です"`

---

## 📊 全32ボタンの引数一覧

### Row 1: Claude Code基本操作

| ボタン | スクリプト | 引数 | 説明 |
|--------|-----------|------|------|
| 1. Next | 06-quick-commands.sh | `next` | 次へ進む |
| 2. Continue | 06-quick-commands.sh | `continue` | 継続実行 |
| 3. Fix | 06-quick-commands.sh | `fix` | エラー修正 |
| 4. Help | 06-quick-commands.sh | `help` | ヘルプ表示 |

### Row 2: ビルド・テスト

| ボタン | スクリプト | 引数 | 説明 |
|--------|-----------|------|------|
| 5. Build | 02-build-release.sh | **（空欄）** | リリースビルド |
| 6. Test | 03-run-tests.sh | **（空欄）** | 全テスト実行 |
| 7. Clippy | 07-clippy.sh | **（空欄）** | Clippy実行 |
| 8. Format | 08-format.sh | **（空欄）** | コードフォーマット |

### Row 3: Git操作

| ボタン | スクリプト | 引数 | 説明 |
|--------|-----------|------|------|
| 9. Git | 04-git-status.sh | **（空欄）** | Git状態確認 |
| 10. Commit | 06-quick-commands.sh | `commit` | コミット作成 |
| 11. PR | 06-quick-commands.sh | `pr` | PR作成 |
| 12. Push | 09-git-push.sh | **（空欄）** | リモートプッシュ |

### Row 4: Agent実行

| ボタン | スクリプト | 引数 | 説明 |
|--------|-----------|------|------|
| 13. Coordinator | 10-agent-coordinator.sh | **（空欄）** | Coordinator Agent |
| 14. CodeGen | 11-agent-codegen.sh | **（空欄）** | CodeGen Agent |
| 15. Review | 12-agent-review.sh | **（空欄）** | Review Agent |
| 16. Deploy | 13-agent-deploy.sh | **（空欄）** | Deploy Agent |

### Row 5: ドキュメント・解析

| ボタン | スクリプト | 引数 | 説明 |
|--------|-----------|------|------|
| 17. Docs | 14-generate-docs.sh | **（空欄）** | ドキュメント生成 |
| 18. Analyze | 15-analyze-code.sh | **（空欄）** | コード解析 |
| 19. Benchmark | 16-benchmark.sh | **（空欄）** | ベンチマーク |
| 20. Profile | 17-profile.sh | **（空欄）** | プロファイリング |

### Row 6: デプロイ・インフラ

| ボタン | スクリプト | 引数 | 説明 |
|--------|-----------|------|------|
| 21. Deploy Prod | 18-deploy-prod.sh | **（空欄）** | 本番デプロイ |
| 22. Rollback | 19-rollback.sh | **（空欄）** | ロールバック |
| 23. Logs | 20-view-logs.sh | **（空欄）** | ログ表示 |
| 24. Monitor | 21-monitor.sh | **（空欄）** | モニタリング |

### Row 7: ユーティリティ

| ボタン | スクリプト | 引数 | 説明 |
|--------|-----------|------|------|
| 25. Clean | 22-clean-build.sh | **（空欄）** | ビルドクリーン |
| 26. Cache | 23-clear-cache.sh | **（空欄）** | キャッシュクリア |
| 27. Deps | 24-update-deps.sh | **（空欄）** | 依存関係更新 |
| 28. Audit | 25-security-audit.sh | **（空欄）** | セキュリティ監査 |

### Row 8: カスタム・拡張

| ボタン | スクリプト | 引数 | 説明 |
|--------|-----------|------|------|
| 29. Voice | 01-notify-voice.sh | `"カスタムメッセージ"` | 音声通知 |
| 30. Infinity | 06-quick-commands.sh | `infinity` | Infinityモード |
| 31. Session | 26-session-end.sh | **（空欄）** | セッション終了 |
| 32. Custom | 27-custom.sh | `（カスタム）` | カスタムコマンド |

---

## 🔧 よくある質問

### Q1: 引数が認識されない

**原因**: スペースや特殊文字が含まれている
**解決**: クォートで囲む

```bash
# 間違い
Arguments: Build completed

# 正しい
Arguments: "Build completed"
```

### Q2: 引数を複数渡したい

**原因**: Stream Deck Mobileの制限
**解決方法**:

**方法A**: スクリプト側で対応
```bash
# 27-custom.sh を編集
ARG1="$1"
ARG2="$2"
```

**方法B**: 引数を1つの文字列にまとめる
```bash
Arguments: "arg1,arg2,arg3"

# スクリプト側で分解
IFS=',' read -ra ARGS <<< "$1"
```

### Q3: 日本語引数が文字化けする

**原因**: エンコーディング問題
**解決**: スクリプト先頭に追加

```bash
#!/bin/bash
export LANG=ja_JP.UTF-8
```

### Q4: 引数の順序を変えたい

**原因**: 複数引数の順序が重要
**解決**: スクリプト内でパース

```bash
while [[ $# -gt 0 ]]; do
  case $1 in
    --issue)
      ISSUE="$2"
      shift 2
      ;;
    --branch)
      BRANCH="$2"
      shift 2
      ;;
  esac
done
```

---

## 💡 高度な使い方

### カスタム引数を使った動的実行

**例: Issue番号を指定してAgent実行**

```bash
# 新しいスクリプト作成: tools/stream-deck/28-agent-with-issue.sh
#!/bin/bash
ISSUE_NUM="${1:-270}"
MESSAGE="Run the Coordinator agent for issue #${ISSUE_NUM}"
$(dirname "$0")/05-send-to-claude.sh "$MESSAGE"
```

**Stream Deckボタン設定**:
```
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/28-agent-with-issue.sh
Arguments: 275
```

### Multi Actionで複数引数を順次実行

```
Multi Action:
  Step 1: 02-build-release.sh
  Step 2: 03-run-tests.sh
  Step 3: 06-quick-commands.sh → 引数: commit
  Step 4: 09-git-push.sh
```

---

## 📝 トラブルシューティング

### スクリプトが実行されない

1. **Pathの確認**
   ```bash
   ls -la /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
   ```

2. **実行権限の確認**
   ```bash
   chmod +x tools/stream-deck/*.sh
   ```

3. **手動テスト**
   ```bash
   bash tools/stream-deck/06-quick-commands.sh next
   ```

### 引数が渡されていない

**デバッグ用スクリプト作成**:
```bash
#!/bin/bash
echo "Received arguments: $@" > /tmp/stream-deck-debug.log
echo "Arg 1: $1" >> /tmp/stream-deck-debug.log
echo "Arg 2: $2" >> /tmp/stream-deck-debug.log
```

**ログ確認**:
```bash
cat /tmp/stream-deck-debug.log
```

---

## ✅ セットアップチェックリスト

- [ ] スクリプトパスをフルパスで入力
- [ ] 実行権限を確認（`chmod +x`）
- [ ] 引数が必要なボタンのみArgumentsを入力
- [ ] スペースを含む引数はクォートで囲む
- [ ] アイコンファイルを選択（オプション）
- [ ] ボタンタイトルを設定
- [ ] 手動テストで動作確認

---

## 🔗 関連ドキュメント

- **完全レイアウト**: [FULL_LAYOUT_8x4.md](FULL_LAYOUT_8x4.md)
- **クイックリファレンス**: [QUICK_REFERENCE_8x4.md](QUICK_REFERENCE_8x4.md)
- **セットアップガイド**: [STREAM_DECK_SETUP_GUIDE.md](../docs/STREAM_DECK_SETUP_GUIDE.md)
- **アイコン生成**: [ICON_GENERATION_GUIDE.md](ICON_GENERATION_GUIDE.md)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**Stream Deckの引数設定をマスターして、開発効率を最大化しましょう！** 🚀

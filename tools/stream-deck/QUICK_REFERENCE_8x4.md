# Stream Deck クイックリファレンス - 8行×4列

**最終更新**: 2025-10-26
**ボタン数**: 32個

---

## 📱 簡単セットアップ（3ステップ）

### Step 1: セットアップスクリプト実行
```bash
cd /Users/shunsuke/Dev/miyabi-private
tools/stream-deck/setup-stream-deck.sh
```

### Step 2: Stream Deck Mobileアプリをインストール
- iOS: App Store → "Stream Deck Mobile"
- Android: Google Play → "Stream Deck Mobile"

### Step 3: プロファイルをインポート
1. アプリでプロファイルをインポート
2. ファイル: `miyabi-full-layout-8x4.streamDeckProfile`
3. または手動で32ボタンを設定

---

## 🔢 ボタン配置（8行×4列）

```
Row 1 [Claude Code基本]  ▶️Next  ⏭️Cont   🔧Fix   ❓Help
Row 2 [ビルド・テスト]   🏗️Build ✅Test   📎Clip  💅Fmt
Row 3 [Git操作]          📊Git   💬Commit 🔀PR    🚀Push
Row 4 [Agent実行]        🎯Coord ⚙️Code  🔍Rev   🚢Deploy
Row 5 [ドキュメント]     📚Docs  🔬Anlz   🏁Bench ⚡Prof
Row 6 [デプロイ]         🌐Deploy⏪Roll   📝Logs  📡Mon
Row 7 [ユーティリティ]   🧹Clean 💾Cache  📦Deps  🔒Audit
Row 8 [カスタム]         🔊Voice ∞Inf    🔄Sess  ⚙️Custom
```

---

## 📋 全ボタン一覧

### Row 1: Claude Code基本操作

| ボタン | スクリプト | 引数 | 機能 |
|-------|-----------|------|------|
| ▶️ Next | 06-quick-commands.sh | next | 次のタスクへ |
| ⏭️ Continue | 06-quick-commands.sh | continue | 継続実行 |
| 🔧 Fix | 06-quick-commands.sh | fix | エラー修正 |
| ❓ Help | 06-quick-commands.sh | help | ヘルプ表示 |

### Row 2: ビルド・テスト

| ボタン | スクリプト | 機能 |
|-------|-----------|------|
| 🏗️ Build | 02-build-release.sh | リリースビルド |
| ✅ Test | 03-run-tests.sh | 全テスト実行 |
| 📎 Clippy | 07-clippy.sh | Clippy実行 |
| 💅 Format | 08-format.sh | フォーマット |

### Row 3: Git操作

| ボタン | スクリプト | 引数 | 機能 |
|-------|-----------|------|------|
| 📊 Git | 04-git-status.sh | - | Git状態確認 |
| 💬 Commit | 06-quick-commands.sh | commit | コミット作成 |
| 🔀 PR | 06-quick-commands.sh | pr | PR作成 |
| 🚀 Push | 09-git-push.sh | - | リモートプッシュ |

### Row 4: Agent実行

| ボタン | スクリプト | 機能 |
|-------|-----------|------|
| 🎯 Coordinator | 10-agent-coordinator.sh | タスク調整 |
| ⚙️ CodeGen | 11-agent-codegen.sh | コード生成 |
| 🔍 Review | 12-agent-review.sh | コードレビュー |
| 🚢 Deploy | 13-agent-deploy.sh | デプロイ管理 |

### Row 5: ドキュメント・解析

| ボタン | スクリプト | 機能 |
|-------|-----------|------|
| 📚 Docs | 14-generate-docs.sh | ドキュメント生成 |
| 🔬 Analyze | 15-analyze-code.sh | コード解析 |
| 🏁 Benchmark | 16-benchmark.sh | ベンチマーク |
| ⚡ Profile | 17-profile.sh | プロファイリング |

### Row 6: デプロイ・インフラ

| ボタン | スクリプト | 機能 |
|-------|-----------|------|
| 🌐 Deploy | 18-deploy-prod.sh | 本番デプロイ |
| ⏪ Rollback | 19-rollback.sh | ロールバック |
| 📝 Logs | 20-view-logs.sh | ログ表示 |
| 📡 Monitor | 21-monitor.sh | モニタリング |

### Row 7: ユーティリティ

| ボタン | スクリプト | 機能 |
|-------|-----------|------|
| 🧹 Clean | 22-clean-build.sh | ビルドクリーン |
| 💾 Cache | 23-clear-cache.sh | キャッシュクリア |
| 📦 Deps | 24-update-deps.sh | 依存関係更新 |
| 🔒 Audit | 25-security-audit.sh | セキュリティ監査 |

### Row 8: カスタム・拡張

| ボタン | スクリプト | 引数 | 機能 |
|-------|-----------|------|------|
| 🔊 Voice | 01-notify-voice.sh | (任意) | 音声通知 |
| ∞ Infinity | 06-quick-commands.sh | infinity | Infinityモード |
| 🔄 Session | 26-session-end.sh | - | セッション終了 |
| ⚙️ Custom | 27-custom.sh | (任意) | カスタムコマンド |

---

## 🎯 使用例

### 開発フロー
```
1. ▶️ Next        - 次のタスク開始
2. 🏗️ Build       - ビルド実行
3. ✅ Test        - テスト実行
4. 📎 Clippy      - 品質チェック
5. 💬 Commit      - コミット作成
6. 🚀 Push        - リモートプッシュ
```

### デバッグフロー
```
1. 🔧 Fix         - エラー修正指示
2. 💅 Format      - コード整形
3. 📝 Logs        - ログ確認
4. 🧹 Clean       - クリーン実行
5. 🏗️ Build       - 再ビルド
```

### デプロイフロー
```
1. ✅ Test        - 全テスト実行
2. 📚 Docs        - ドキュメント更新
3. 🔀 PR          - PR作成
4. 🌐 Deploy      - 本番デプロイ
5. 📡 Monitor     - 監視開始
```

---

## ⚙️ カスタマイズ

### 音声メッセージ変更
```bash
# Stream Deck設定で引数を変更
引数: "ビルドが完了しました"
```

### カスタムコマンド追加
```bash
# 27-custom.shを使用
引数: "Your custom command here"
```

---

## 🔗 詳細ドキュメント

- **完全レイアウト設計**: `FULL_LAYOUT_8x4.md`
- **詳細セットアップ**: `STREAM_DECK_SETUP_GUIDE.md`
- **スクリプトリスト**: `paths.txt`

---

## 📞 サポート

**問題が発生した場合**:
1. セットアップスクリプトを再実行
2. 実行権限を確認: `chmod +x tools/stream-deck/*.sh`
3. パスが正しいか確認

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**32ボタンで開発ワークフロー全体を完全制御！** 🚀

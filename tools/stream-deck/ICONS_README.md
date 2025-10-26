# Stream Deck アイコン集

**生成日**: 2025-10-26
**アイコン数**: 32個
**解像度**: 1024x1024px
**フォーマット**: JPEG
**API**: BytePlus Ark (Seedream 4.0)

---

## 📁 ディレクトリ構成

```
tools/stream-deck/icons/
├── 01-next.jpeg          - Next（次へ）
├── 02-continue.jpeg      - Continue（継続）
├── 03-fix.jpeg           - Fix（修正）
├── 04-help.jpeg          - Help（ヘルプ）
├── 05-build.jpeg         - Build（ビルド）
├── 06-test.jpeg          - Test（テスト）
├── 07-clippy.jpeg        - Clippy（品質チェック）
├── 08-format.jpeg        - Format（フォーマット）
├── 09-git.jpeg           - Git（Git操作）
├── 10-commit.jpeg        - Commit（コミット）
├── 11-pr.jpeg            - PR（プルリクエスト）
├── 12-push.jpeg          - Push（プッシュ）
├── 13-coordinator.jpeg   - Coordinator Agent
├── 14-codegen.jpeg       - CodeGen Agent
├── 15-review.jpeg        - Review Agent
├── 16-deploy.jpeg        - Deploy Agent
├── 17-docs.jpeg          - Docs（ドキュメント）
├── 18-analyze.jpeg       - Analyze（解析）
├── 19-benchmark.jpeg     - Benchmark（ベンチマーク）
├── 20-profile.jpeg       - Profile（プロファイル）
├── 21-deploy-prod.jpeg   - Deploy Prod（本番デプロイ）
├── 22-rollback.jpeg      - Rollback（ロールバック）
├── 23-logs.jpeg          - Logs（ログ）
├── 24-monitor.jpeg       - Monitor（モニタリング）
├── 25-clean.jpeg         - Clean（クリーン）
├── 26-cache.jpeg         - Cache（キャッシュ）
├── 27-deps.jpeg          - Deps（依存関係）
├── 28-audit.jpeg         - Audit（監査）
├── 29-voice.jpeg         - Voice（音声通知）
├── 30-infinity.jpeg      - Infinity（無限モード）
├── 31-session.jpeg       - Session（セッション）
└── 32-custom.jpeg        - Custom（カスタム）
```

---

## 🎨 デザインスタイル

### 統一仕様
- **スタイル**: ミニマリスト、フラットデザイン
- **背景**: 白背景
- **形状**: クリーンな幾何学デザイン
- **色**: 機能別カラーコーディング
- **品質**: 高品質、シャープな詳細

### カラーテーマ

| Row | テーマ | カラー |
|-----|--------|--------|
| Row 1 | Claude Code操作 | Blue, Cyan, Orange, Purple |
| Row 2 | ビルド・テスト | Yellow-Orange, Green, Blue-Purple, Pink-Magenta |
| Row 3 | Git操作 | Orange, Green-Blue, Purple, Red-Orange |
| Row 4 | Agent実行 | Red-Pink, Blue-Cyan, Purple-Blue, Navy |
| Row 5 | ドキュメント | Blue, Teal-Green, Black-White, Yellow-Orange |
| Row 6 | デプロイ | Green-Blue, Orange-Red, Gray-Blue, Green |
| Row 7 | ユーティリティ | Blue-Green, Purple, Brown-Orange, Red |
| Row 8 | カスタム | Blue-Purple, Rainbow, Cyan-Blue, Orange-Yellow |

---

## 🔄 再生成方法

### 全アイコンを再生成
```bash
bash tools/stream-deck/generate-all-icons.sh
```

### 特定のアイコンのみ再生成
スクリプトを編集して必要な行のみ実行

### API設定
```bash
API_KEY="fdc9e681-e525-4122-9ed1-2d896f2cb11c"
```

---

## 📱 Stream Deckでの使用方法

### アイコンの設定

1. Stream Deck Mobileアプリを開く
2. ボタンを長押し → 「Edit」
3. 「Icon」をタップ
4. 「Choose from Files」を選択
5. 対応する`.jpeg`ファイルを選択

### 推奨設定

- **サイズ**: オリジナル（1024x1024px）
- **位置**: 中央配置
- **背景**: 透明またはダーク

---

## 🎯 アイコンとボタンの対応表

| アイコン | ボタン名 | スクリプト | 機能 |
|---------|---------|-----------|------|
| 01-next | Next | 06-quick-commands.sh next | 次へ進む |
| 02-continue | Continue | 06-quick-commands.sh continue | 継続実行 |
| 03-fix | Fix | 06-quick-commands.sh fix | エラー修正 |
| 04-help | Help | 06-quick-commands.sh help | ヘルプ表示 |
| 05-build | Build | 02-build-release.sh | リリースビルド |
| 06-test | Test | 03-run-tests.sh | 全テスト実行 |
| 07-clippy | Clippy | 07-clippy.sh | Clippy実行 |
| 08-format | Format | 08-format.sh | コードフォーマット |
| 09-git | Git | 04-git-status.sh | Git状態確認 |
| 10-commit | Commit | 06-quick-commands.sh commit | コミット作成 |
| 11-pr | PR | 06-quick-commands.sh pr | PR作成 |
| 12-push | Push | 09-git-push.sh | リモートプッシュ |
| 13-coordinator | Coordinator | 10-agent-coordinator.sh | Coordinator Agent |
| 14-codegen | CodeGen | 11-agent-codegen.sh | CodeGen Agent |
| 15-review | Review | 12-agent-review.sh | Review Agent |
| 16-deploy | Deploy | 13-agent-deploy.sh | Deploy Agent |
| 17-docs | Docs | 14-generate-docs.sh | ドキュメント生成 |
| 18-analyze | Analyze | 15-analyze-code.sh | コード解析 |
| 19-benchmark | Benchmark | 16-benchmark.sh | ベンチマーク |
| 20-profile | Profile | 17-profile.sh | プロファイリング |
| 21-deploy-prod | Deploy Prod | 18-deploy-prod.sh | 本番デプロイ |
| 22-rollback | Rollback | 19-rollback.sh | ロールバック |
| 23-logs | Logs | 20-view-logs.sh | ログ表示 |
| 24-monitor | Monitor | 21-monitor.sh | モニタリング |
| 25-clean | Clean | 22-clean-build.sh | ビルドクリーン |
| 26-cache | Cache | 23-clear-cache.sh | キャッシュクリア |
| 27-deps | Deps | 24-update-deps.sh | 依存関係更新 |
| 28-audit | Audit | 25-security-audit.sh | セキュリティ監査 |
| 29-voice | Voice | 01-notify-voice.sh | 音声通知 |
| 30-infinity | Infinity | 06-quick-commands.sh infinity | Infinityモード |
| 31-session | Session | 26-session-end.sh | セッション終了 |
| 32-custom | Custom | 27-custom.sh | カスタムコマンド |

---

## 📊 生成統計

- **総アイコン数**: 32個
- **合計ファイルサイズ**: 約4-5MB
- **平均ファイルサイズ**: 140-150KB/個
- **生成時間**: 約2-3分
- **API呼び出し数**: 32回
- **成功率**: 100%

---

## 🔗 関連ドキュメント

- **セットアップガイド**: [STREAM_DECK_SETUP_GUIDE.md](../docs/STREAM_DECK_SETUP_GUIDE.md)
- **完全レイアウト**: [FULL_LAYOUT_8x4.md](FULL_LAYOUT_8x4.md)
- **クイックリファレンス**: [QUICK_REFERENCE_8x4.md](QUICK_REFERENCE_8x4.md)
- **アイコン生成ガイド**: [ICON_GENERATION_GUIDE.md](ICON_GENERATION_GUIDE.md)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**美しいAI生成アイコンで、Stream Deckをさらに魅力的に！** ✨

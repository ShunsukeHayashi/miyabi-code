# Stream Deck スクリプト リナンバリング計画

## 目的
8×4 = 32ボタンに合わせて、スクリプトを 01-32 の連番に統一

## 新しいナンバリング

### Row 1: Claude Code基本操作 (01-04)
- 01-next.sh           (NEW - quick/01-next.sh)
- 02-continue.sh       (NEW - quick/02-continue.sh)
- 03-fix.sh            (NEW - quick/03-fix.sh)
- 04-help.sh           (NEW - quick/04-help.sh)

### Row 2: ビルド・テスト (05-08)
- 05-build.sh          (現 02-build-release.sh)
- 06-test.sh           (現 03-run-tests.sh)
- 07-clippy.sh         (既存)
- 08-format.sh         (既存)

### Row 3: Git操作 (09-12)
- 09-git-status.sh     (現 04-git-status.sh)
- 10-commit.sh         (NEW - quick/10-commit.sh)
- 11-pr.sh             (NEW - quick/11-pr.sh)
- 12-push.sh           (現 09-git-push.sh)

### Row 4: Agent実行 (13-16)
- 13-agent-coordinator.sh (現 10-agent-coordinator.sh)
- 14-agent-codegen.sh     (現 11-agent-codegen.sh)
- 15-agent-review.sh      (現 12-agent-review.sh)
- 16-agent-deploy.sh      (現 13-agent-deploy.sh)

### Row 5: ドキュメント・解析 (17-20)
- 17-docs.sh           (現 14-generate-docs.sh)
- 18-analyze.sh        (現 15-analyze-code.sh)
- 19-benchmark.sh      (現 16-benchmark.sh)
- 20-profile.sh        (現 17-profile.sh)

### Row 6: デプロイ・インフラ (21-24)
- 21-deploy-prod.sh    (現 18-deploy-prod.sh)
- 22-rollback.sh       (現 19-rollback.sh)
- 23-logs.sh           (現 20-view-logs.sh)
- 24-monitor.sh        (現 21-monitor.sh)

### Row 7: ユーティリティ (25-28)
- 25-clean.sh          (現 22-clean-build.sh)
- 26-cache.sh          (現 23-clear-cache.sh)
- 27-deps.sh           (現 24-update-deps.sh)
- 28-audit.sh          (現 25-security-audit.sh)

### Row 8: カスタム・拡張 (29-32)
- 29-voice.sh          (現 01-notify-voice.sh)
- 30-infinity.sh       (NEW - quick/30-infinity.sh)
- 31-session.sh        (現 26-session-end.sh)
- 32-custom.sh         (現 27-custom.sh)

## 廃止するファイル
- quick/ ディレクトリ（メインディレクトリに統合）
- 05-send-to-claude.sh (内部関数として統合)
- 06-quick-commands.sh (各スクリプトに統合)

## 実装順序
1. Row 1 の新規スクリプト作成 (01-04)
2. Row 2-8 の既存スクリプトをリネーム
3. 旧ファイルの削除
4. ドキュメント更新

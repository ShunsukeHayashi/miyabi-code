# Stream Deck 引数不要セットアップガイド

**最終更新**: 2025-10-26
**対象**: Stream Deck Mobile (Arguments フィールドがない場合)

Stream Deck Mobile で Arguments（引数）フィールドが表示されない場合の代替セットアップ方法です。

---

## 🎯 解決策：個別スクリプト方式

引数を使わず、各ボタン専用のスクリプトファイルを用意しました。

### ディレクトリ構成

```
tools/stream-deck/
├── quick/                    # ← NEW! 引数不要スクリプト
│   ├── 01-next.sh           # Next コマンド
│   ├── 02-continue.sh       # Continue コマンド
│   ├── 03-fix.sh            # Fix コマンド
│   ├── 04-help.sh           # Help コマンド
│   ├── 10-commit.sh         # Commit コマンド
│   ├── 11-pr.sh             # PR コマンド
│   └── 30-infinity.sh       # Infinity モード
├── 02-build-release.sh      # Build（変更なし）
├── 03-run-tests.sh          # Test（変更なし）
├── 04-git-status.sh         # Git Status（変更なし）
└── ...
```

---

## 📱 Row 1: Claude Code基本操作 - 新しい設定

### ボタン1: ▶️ Next

```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/01-next.sh
Arguments: （何も設定しない・表示されない）
Title: Next
Icon: 01-next.jpeg
```

### ボタン2: ⏭️ Continue

```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/02-continue.sh
Arguments: （何も設定しない・表示されない）
Title: Continue
Icon: 02-continue.jpeg
```

### ボタン3: 🔧 Fix

```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/03-fix.sh
Arguments: （何も設定しない・表示されない）
Title: Fix
Icon: 03-fix.jpeg
```

### ボタン4: ❓ Help

```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/04-help.sh
Arguments: （何も設定しない・表示されない）
Title: Help
Icon: 04-help.jpeg
```

---

## 📋 Row 2-3: ビルド・テスト・Git（変更なし）

### Row 2: ビルド・テスト (5-8)

**ボタン5: Build**
```
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/02-build-release.sh
```

**ボタン6: Test**
```
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/03-run-tests.sh
```

**ボタン7: Clippy**
```
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/07-clippy.sh
```

**ボタン8: Format**
```
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/08-format.sh
```

### Row 3: Git操作 (9-12)

**ボタン9: Git Status**
```
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/04-git-status.sh
```

**ボタン10: Commit** ← NEW!
```
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/10-commit.sh
```

**ボタン11: PR** ← NEW!
```
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/11-pr.sh
```

**ボタン12: Push**
```
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/09-git-push.sh
```

---

## 📋 Row 4-8: Agent・その他（変更なし）

Row 4 以降は元のスクリプトをそのまま使用します（引数不要）。

### Row 4: Agent実行 (13-16)

| ボタン | スクリプトパス |
|--------|---------------|
| 13. Coordinator | `tools/stream-deck/10-agent-coordinator.sh` |
| 14. CodeGen | `tools/stream-deck/11-agent-codegen.sh` |
| 15. Review | `tools/stream-deck/12-agent-review.sh` |
| 16. Deploy | `tools/stream-deck/13-agent-deploy.sh` |

### Row 5: ドキュメント・解析 (17-20)

| ボタン | スクリプトパス |
|--------|---------------|
| 17. Docs | `tools/stream-deck/14-generate-docs.sh` |
| 18. Analyze | `tools/stream-deck/15-analyze-code.sh` |
| 19. Benchmark | `tools/stream-deck/16-benchmark.sh` |
| 20. Profile | `tools/stream-deck/17-profile.sh` |

### Row 6: デプロイ・インフラ (21-24)

| ボタン | スクリプトパス |
|--------|---------------|
| 21. Deploy Prod | `tools/stream-deck/18-deploy-prod.sh` |
| 22. Rollback | `tools/stream-deck/19-rollback.sh` |
| 23. Logs | `tools/stream-deck/20-view-logs.sh` |
| 24. Monitor | `tools/stream-deck/21-monitor.sh` |

### Row 7: ユーティリティ (25-28)

| ボタン | スクリプトパス |
|--------|---------------|
| 25. Clean | `tools/stream-deck/22-clean-build.sh` |
| 26. Cache | `tools/stream-deck/23-clear-cache.sh` |
| 27. Deps | `tools/stream-deck/24-update-deps.sh` |
| 28. Audit | `tools/stream-deck/25-security-audit.sh` |

### Row 8: カスタム・拡張 (29-32)

| ボタン | スクリプトパス |
|--------|---------------|
| 29. Voice | `tools/stream-deck/01-notify-voice.sh` |
| 30. Infinity | `tools/stream-deck/quick/30-infinity.sh` ← NEW! |
| 31. Session | `tools/stream-deck/26-session-end.sh` |
| 32. Custom | `tools/stream-deck/27-custom.sh` |

---

## 🔧 簡単セットアップ手順

### Step 1: Stream Deck Mobile アプリで新しいページを作成

1. Stream Deck Mobile を開く
2. 「+」ボタンで新しいページを作成
3. ページ名を「Miyabi」に設定

### Step 2: ボタンを1つずつ設定

**ボタン1 (Next) の設定例**:

1. 空白ボタンをタップ → 「+」をタップ
2. **System** → **Open** を選択
3. **Path** をタップして入力:
   ```
   /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/01-next.sh
   ```
4. **Title** に「Next」と入力
5. **Icon** でアイコン選択（オプション）
6. 「Save」をタップ

### Step 3: 残りのボタンも同様に設定

**Row 1 (1-4)** は `quick/` ディレクトリのスクリプトを使用
**Row 2-8 (5-32)** は通常のスクリプトを使用

---

## ✅ クイック確認

ターミナルで以下を実行して、各スクリプトが正しく動作するか確認：

```bash
# Row 1 のテスト
bash /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/01-next.sh
# → "Next" が VS Code に送信される

bash /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/02-continue.sh
# → "Continue" が VS Code に送信される

bash /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/03-fix.sh
# → "Fix the build errors..." が VS Code に送信される

bash /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/04-help.sh
# → "Help" が VS Code に送信される
```

---

## 📋 全32ボタン完全パスリスト

コピペ用のパス一覧：

### Row 1: Claude Code基本操作
```
1. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/01-next.sh
2. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/02-continue.sh
3. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/03-fix.sh
4. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/04-help.sh
```

### Row 2: ビルド・テスト
```
5. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/02-build-release.sh
6. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/03-run-tests.sh
7. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/07-clippy.sh
8. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/08-format.sh
```

### Row 3: Git操作
```
9. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/04-git-status.sh
10. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/10-commit.sh
11. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/11-pr.sh
12. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/09-git-push.sh
```

### Row 4: Agent実行
```
13. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/10-agent-coordinator.sh
14. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/11-agent-codegen.sh
15. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/12-agent-review.sh
16. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/13-agent-deploy.sh
```

### Row 5: ドキュメント・解析
```
17. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/14-generate-docs.sh
18. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/15-analyze-code.sh
19. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/16-benchmark.sh
20. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/17-profile.sh
```

### Row 6: デプロイ・インフラ
```
21. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/18-deploy-prod.sh
22. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/19-rollback.sh
23. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/20-view-logs.sh
24. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/21-monitor.sh
```

### Row 7: ユーティリティ
```
25. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/22-clean-build.sh
26. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/23-clear-cache.sh
27. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/24-update-deps.sh
28. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/25-security-audit.sh
```

### Row 8: カスタム・拡張
```
29. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/01-notify-voice.sh
30. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/30-infinity.sh
31. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/26-session-end.sh
32. /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/27-custom.sh
```

---

## 🎨 アイコン設定

アイコンは `tools/stream-deck/icons/` ディレクトリにあります：

```
01-next.jpeg, 02-continue.jpeg, 03-fix.jpeg, 04-help.jpeg, ...
```

Stream Deck Mobile でアイコンを設定する方法：
1. ボタン編集画面で「Icon」をタップ
2. 「Choose from Files」を選択
3. 対応する `.jpeg` ファイルを選択

---

## ❓ トラブルシューティング

### Q: ボタンを押しても何も起きない

**確認**:
1. Stream Deck Mobile が Mac に接続されているか
2. macOS の Accessibility 権限が有効か
   - System Settings → Privacy & Security → Accessibility
   - Stream Deck Mobile を許可

### Q: スクリプトパスをコピペしても動かない

**確認**:
- パスが `/Users/shunsuke/...` で始まっているか（フルパス）
- 相対パスや `~` は使えません

### Q: 実行権限エラー

**解決**:
```bash
chmod +x /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/*.sh
chmod +x /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/quick/*.sh
```

---

## 🔗 関連ドキュメント

- **完全レイアウト**: [FULL_LAYOUT_8x4.md](FULL_LAYOUT_8x4.md)
- **トラブルシューティング**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **アイコンREADME**: [ICONS_README.md](ICONS_README.md)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**引数不要で簡単セットアップ！Stream Deckで快適な開発環境を！** 🚀

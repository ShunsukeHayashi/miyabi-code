# Stream Deck トラブルシューティングガイド

**最終更新**: 2025-10-26

このガイドでは、Stream Deck Mobile の設定に関するよくある問題と解決方法を説明します。

---

## 🚨 問題: 全てのボタンが "Next" しか送信できない

### 原因1: 全てのボタンの引数が `next` になっている

**確認方法**:
1. Stream Deck Mobile で各ボタンを長押し → Edit
2. Arguments フィールドを確認
3. 全て `next` になっていないか確認

**解決方法**:
各ボタンに正しい引数を設定する

```
ボタン1 (Next):      Arguments = next
ボタン2 (Continue):  Arguments = continue
ボタン3 (Fix):       Arguments = fix
ボタン4 (Help):      Arguments = help
```

### 原因2: 全てのボタンが同じスクリプトパスになっている

**確認方法**:
1. 各ボタンの Edit 画面を開く
2. Path フィールドを確認
3. 全て `06-quick-commands.sh` になっているか確認

**解決方法**:

**Row 1 (1-4): Claude Code基本操作**
- 全て `06-quick-commands.sh` でOK
- 引数で区別する

**Row 2 (5-8): ビルド・テスト**
- **ボタン5**: `02-build-release.sh` (引数なし)
- **ボタン6**: `03-run-tests.sh` (引数なし)
- **ボタン7**: `07-clippy.sh` (引数なし)
- **ボタン8**: `08-format.sh` (引数なし)

**Row 3 (9-12): Git操作**
- **ボタン9**: `04-git-status.sh` (引数なし)
- **ボタン10**: `06-quick-commands.sh` (引数 `commit`)
- **ボタン11**: `06-quick-commands.sh` (引数 `pr`)
- **ボタン12**: `09-git-push.sh` (引数なし)

### 原因3: スクリプトパスが間違っている

**確認方法**:
Path フィールドの内容を確認

**間違った例**:
```
❌ 06-quick-commands.sh
❌ tools/stream-deck/06-quick-commands.sh
❌ ~/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
```

**正しい例**:
```
✅ /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
```

### 原因4: スクリプトに実行権限がない

**確認方法**:
```bash
ls -la /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/*.sh
```

**解決方法**:
```bash
cd /Users/shunsuke/Dev/miyabi-private
chmod +x tools/stream-deck/*.sh
```

---

## 📋 正しい設定例（全32ボタン）

### Row 1: Claude Code基本操作 (1-4)

**ボタン1: Next**
```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
Arguments: next
Title: Next
Icon: 01-next.jpeg
```

**ボタン2: Continue**
```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
Arguments: continue
Title: Continue
Icon: 02-continue.jpeg
```

**ボタン3: Fix**
```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
Arguments: fix
Title: Fix
Icon: 03-fix.jpeg
```

**ボタン4: Help**
```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
Arguments: help
Title: Help
Icon: 04-help.jpeg
```

### Row 2: ビルド・テスト (5-8)

**ボタン5: Build**
```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/02-build-release.sh
Arguments: （空欄）
Title: Build
Icon: 05-build.jpeg
```

**ボタン6: Test**
```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/03-run-tests.sh
Arguments: （空欄）
Title: Test
Icon: 06-test.jpeg
```

**ボタン7: Clippy**
```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/07-clippy.sh
Arguments: （空欄）
Title: Clippy
Icon: 07-clippy.jpeg
```

**ボタン8: Format**
```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/08-format.sh
Arguments: （空欄）
Title: Format
Icon: 08-format.jpeg
```

### Row 3: Git操作 (9-12)

**ボタン9: Git Status**
```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/04-git-status.sh
Arguments: （空欄）
Title: Git
Icon: 09-git.jpeg
```

**ボタン10: Commit**
```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
Arguments: commit
Title: Commit
Icon: 10-commit.jpeg
```

**ボタン11: PR**
```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
Arguments: pr
Title: PR
Icon: 11-pr.jpeg
```

**ボタン12: Push**
```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/09-git-push.sh
Arguments: （空欄）
Title: Push
Icon: 12-push.jpeg
```

---

## 🔧 デバッグ方法

### ステップ1: ボタン設定の確認

各ボタンを Edit して、以下を確認：
- [ ] Path が正しいフルパスになっている
- [ ] Arguments が正しく設定されている（または空欄）
- [ ] Action が "System → Open" になっている

### ステップ2: スクリプトの手動テスト

ターミナルで直接実行してテスト：

```bash
# Row 1 ボタンのテスト
bash /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh next
bash /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh continue
bash /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh fix
bash /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh help

# Row 2 ボタンのテスト
bash /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/02-build-release.sh
bash /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/03-run-tests.sh
```

### ステップ3: デバッグログの確認

スクリプトにデバッグ出力を追加：

```bash
#!/bin/bash
# デバッグ用
echo "Script: $(basename "$0")" >> /tmp/stream-deck-debug.log
echo "Arguments: $@" >> /tmp/stream-deck-debug.log
echo "Timestamp: $(date)" >> /tmp/stream-deck-debug.log
echo "---" >> /tmp/stream-deck-debug.log

# 元のスクリプトの内容...
```

ログ確認：
```bash
tail -f /tmp/stream-deck-debug.log
```

### ステップ4: Stream Deck アプリの再起動

1. Stream Deck Mobile アプリを完全終了
2. macOS側の Stream Deck プロセスを確認
3. 両方を再起動

---

## 📱 Stream Deck Mobile の設定確認チェックリスト

### 基本設定
- [ ] macOS と同じWiFiに接続している
- [ ] Stream Deck Mobile が macOS に接続されている
- [ ] macOS の Accessibility 権限が有効

### ボタン設定
- [ ] Action: System → Open
- [ ] Path: フルパス（`/Users/...` で始まる）
- [ ] Arguments: スクリプトに応じて設定（空欄可）
- [ ] Title: ボタン名
- [ ] Icon: アイコン画像（オプション）

### スクリプト設定
- [ ] 実行権限がある（`chmod +x`）
- [ ] パスが正しい
- [ ] シェバン行がある（`#!/bin/bash`）
- [ ] スクリプトが単体で動作する

---

## 💡 よくある間違いと修正方法

### 間違い1: 相対パスを使用
```
❌ Arguments: tools/stream-deck/06-quick-commands.sh
✅ Path: /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh
```

### 間違い2: 引数を Path に含める
```
❌ Path: /Users/.../06-quick-commands.sh next
✅ Path: /Users/.../06-quick-commands.sh
✅ Arguments: next
```

### 間違い3: クォートの誤用
```
❌ Arguments: "next"
✅ Arguments: next

❌ Arguments: Build completed
✅ Arguments: "Build completed"  # スペースを含む場合のみ
```

### 間違い4: スクリプト名の誤記
```
❌ 06-quick-command.sh  # 's' が抜けている
✅ 06-quick-commands.sh
```

---

## 🔗 関連ドキュメント

- **引数設定ガイド**: [BUTTON_ARGUMENTS_GUIDE.md](BUTTON_ARGUMENTS_GUIDE.md)
- **完全レイアウト**: [FULL_LAYOUT_8x4.md](FULL_LAYOUT_8x4.md)
- **セットアップガイド**: [../docs/STREAM_DECK_SETUP_GUIDE.md](../docs/STREAM_DECK_SETUP_GUIDE.md)

---

## 📞 サポート

問題が解決しない場合は、以下の情報を収集してください：

1. **Stream Deck設定のスクリーンショット**
   - ボタンの Edit 画面
   - Path と Arguments の内容

2. **ターミナルでの実行結果**
   ```bash
   bash /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/06-quick-commands.sh next
   ```

3. **デバッグログ**
   ```bash
   cat /tmp/stream-deck-debug.log
   ```

4. **スクリプトの権限確認**
   ```bash
   ls -la /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/*.sh
   ```

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**Stream Deckの設定を正しく行って、スムーズな開発体験を！** 🚀

# 🚀 A2A Communication Quick Reference

**Version**: 2.0 | **Last Updated**: 2025-12-06

---

## ⚡ P0.2 必須フォーマット

```bash
tmux send-keys -t %PANE_ID 'MESSAGE' && sleep 0.5 && tmux send-keys -t %PANE_ID Enter
```

---

## 📍 現在のAgent配置（aa:1）

| Pane | Agent | 役割 | 環境変数 |
|------|-------|------|----------|
| `%101` | しきるん | Conductor | `$MIYABI_CONDUCTOR_PANE` |
| `%102` | カエデ | CodeGen | `$MIYABI_CODEGEN_PANE` |
| `%103` | サクラ | Review | `$MIYABI_REVIEW_PANE` |
| `%104` | ツバキ | PR | `$MIYABI_PR_PANE` |
| `%105` | ボタン | Deploy | `$MIYABI_DEPLOY_PANE` |

> ⚠️ **注意**: ペインIDはセッション再作成時に変更されます。環境変数を使用してください。

---

## 📨 メッセージテンプレート

### 環境変数設定（推奨）
```bash
# セッション開始時に設定
export MIYABI_CONDUCTOR_PANE=${MIYABI_CONDUCTOR_PANE:-%101}
export MIYABI_CODEGEN_PANE=${MIYABI_CODEGEN_PANE:-%102}
export MIYABI_REVIEW_PANE=${MIYABI_REVIEW_PANE:-%103}
export MIYABI_PR_PANE=${MIYABI_PR_PANE:-%104}
export MIYABI_DEPLOY_PANE=${MIYABI_DEPLOY_PANE:-%105}
```

### 完了報告
```bash
tmux send-keys -t $MIYABI_CONDUCTOR_PANE '[カエデ] 完了: Issue #XXX 実装完了' && sleep 0.5 && tmux send-keys -t $MIYABI_CONDUCTOR_PANE Enter
```

### エラー報告
```bash
tmux send-keys -t $MIYABI_CONDUCTOR_PANE '[ボタン] エラー: Deploy failed - reason' && sleep 0.5 && tmux send-keys -t $MIYABI_CONDUCTOR_PANE Enter
```

### 進捗報告
```bash
tmux send-keys -t $MIYABI_CONDUCTOR_PANE '[カエデ] 進行中: 60% (3/5 files)' && sleep 0.5 && tmux send-keys -t $MIYABI_CONDUCTOR_PANE Enter
```

### Agent間リレー
```bash
tmux send-keys -t $MIYABI_REVIEW_PANE '[カエデ→サクラ] レビュー依頼: PR #XXX' && sleep 0.5 && tmux send-keys -t $MIYABI_REVIEW_PANE Enter
```

### 承認要求
```bash
tmux send-keys -t $MIYABI_CONDUCTOR_PANE '[ボタン] 確認: 本番デプロイ準備完了' && sleep 0.5 && tmux send-keys -t $MIYABI_CONDUCTOR_PANE Enter
```

---

## 🔄 通信ルール

| ✅ Do | ❌ Don't |
|-------|---------|
| 環境変数 or 永続ID使用 | インデックス使用 (`miyabi:6.0`) |
| PUSH報告（自発的） | PULL監視（ポーリング） |
| `sleep 0.5`必須 | sleep省略 |
| 構造化メッセージ | 非構造化テキスト |

---

## 📊 監視コマンド

```bash
# ペイン出力確認
tmux capture-pane -t $MIYABI_CONDUCTOR_PANE -p | tail -20

# エラー検索
tmux capture-pane -t $MIYABI_CONDUCTOR_PANE -p | grep -E "(error|failed)"

# 全ペイン一覧
tmux list-panes -a -F "#{pane_id} #{pane_title}"
```

---

## 🆘 トラブルシューティング

**メッセージ未着**: `sleep 0.5`確認、ペインID確認  
**ペイン消失**: `tmux list-panes -a`で存在確認  
**誤配信**: インデックス→永続ID変更

---

## 📚 関連ドキュメント

- `TMUX_A2A_COMMUNICATION_PROTOCOL.md` - 完全版プロトコル
- `GUARDIAN_OPERATOR_INTEGRATION.md` - Guardian-Operator統合
- `SESSION_MANAGEMENT_QUICK_REFERENCE.md` - セッション管理

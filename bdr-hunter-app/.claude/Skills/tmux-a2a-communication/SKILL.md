# tmux Agent-to-Agent (A2A) Communication Skill

**Version**: 1.0.0
**Purpose**: Claude.ai ↔ Orchestra Agent 間のメッセージング

---

## 概要

このスキルは、Claude.ai (Conductor) から Orchestra Agent (tmux panes) への効果的な通信パターンを定義します。

---

## 通信アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│  Claude.ai (Conductor)                                  │
│    ↓ MCP: Miyabi:tmux_send_keys                        │
├─────────────────────────────────────────────────────────┤
│  miyabi-orchestra (tmux session)                        │
│  ┌──────────┬──────────┬──────────┐                    │
│  │ %18      │ %19      │ %20      │                    │
│  │ CodeGen  │ Review   │ Issue    │                    │
│  ├──────────┼──────────┼──────────┤                    │
│  │ %21      │ %22      │ %23      │                    │
│  │ PR       │ Deploy   │ Refresh  │                    │
│  └──────────┴──────────┴──────────┘                    │
└─────────────────────────────────────────────────────────┘
```

---

## メッセージ送信方法

### 方法1: Miyabi MCP (推奨)

```typescript
// Claude.aiから使用
Miyabi:tmux_send_keys({
  session: "miyabi-orchestra",
  window: 1,
  keys: "YOUR_MESSAGE_HERE"
})
```

### 方法2: 直接pane指定

```typescript
// 特定のpaneに送信
// Note: ツールによってはpane_idパラメータが必要
```

---

## メッセージフォーマット

### タスク依頼
```
TASK: [タスク名]
## 要件
- 要件1
- 要件2
## 実行コマンド
[コマンド]
## 期待する出力
[出力形式]
```

### Git操作依頼
```
GIT: [操作種別]
## ファイル
- file1.tsx
- file2.ts
## コミットメッセージ
[メッセージ]
## ブランチ
[ブランチ名]
```

### レビュー依頼
```
REVIEW: [対象]
## ファイル
- [ファイルパス]
## 観点
- [観点1]
- [観点2]
## 重要度
[high/medium/low]
```

### フィードバック報告
```
FEEDBACK: [タスク名]
## ステータス
[success/failure/in_progress]
## 結果
[結果詳細]
## 次のアクション
- [アクション1]
- [アクション2]
```

---

## Pane役割マッピング

| Pane | Agent | 担当タスク |
|------|-------|-----------|
| %18 | CodeGen | コード生成、ビルド、リファクタリング |
| %19 | Review | コードレビュー、品質チェック |
| %20 | Issue | Issue作成/更新、ドキュメント |
| %21 | PR | PR作成、Git操作、マージ |
| %22 | Deploy | デプロイ、環境構築 |
| %23 | Refresh | コンテキスト更新、同期 |

---

## エラー時の対処

### tmux接続エラー
```
エラー: no server running on /tmp/tmux-1000/default
原因: Claude.ai環境とtmuxサーバーが別マシン
対処: 
  1. MacBook/MUGENのtmuxに接続していることを確認
  2. MCP設定でリモートtmux接続を使用
```

### メッセージ未到達
```
原因: pane IDが変更された可能性
対処:
  1. Miyabi:tmux_list_sessions で現在のpane確認
  2. 正しいpane IDで再送信
```

---

## 使用例

### 例1: ビルド実行依頼
```typescript
Miyabi:tmux_send_keys({
  session: "miyabi-orchestra",
  keys: `TASK: Build BDR Hunter App
## 実行コマンド
cd bdr-hunter-app && npm run build
## 期待する出力
ビルド成功メッセージ`
})
```

### 例2: Git commit依頼
```typescript
Miyabi:tmux_send_keys({
  session: "miyabi-orchestra", 
  keys: `GIT: Commit Landing Page
## ファイル
- app/page.tsx
## コミットメッセージ
feat: implement Jonathan Ive style landing page
## ブランチ
main`
})
```

---

## ベストプラクティス

1. **明確なタスク形式** - TASK/GIT/REVIEW/FEEDBACK プレフィックス使用
2. **構造化メッセージ** - ## セクションで整理
3. **期待値の明示** - 出力形式を指定
4. **エラーハンドリング** - 失敗時の対処法を含める

---

#skill #a2a #tmux #orchestra #communication

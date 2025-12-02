# Orchestra Management Skill

**Version**: 1.0.0
**Purpose**: Claude.ai ↔ Orchestra Agent 連携の最適化

---

## 概要

このスキルは、Claude.ai環境からMiyabi Orchestra (tmux multi-agent) を効果的に制御するためのベストプラクティスを提供します。

---

## 環境判定

### Claude.ai環境の特徴
- `/Users/...` パスへの直接bash実行不可
- MCP経由でファイル読み書き可能
- miyabi-tmux MCPツールで間接的にtmux操作

### Claude Code環境の特徴
- 直接bash実行可能
- ローカルファイルシステムに完全アクセス

### 判定方法
```
1. bash_tool で echo $HOME を試行
2. 成功 → Claude Code環境
3. 失敗 → Claude.ai環境 → Orchestra経由で操作
```

---

## Orchestra Pane構成

| Pane ID | Role | 用途 |
|---------|------|------|
| %18 | **CodeGen Agent** | コード生成・ビルド |
| %19 | **Review Agent** | コードレビュー |
| %20 | **Issue Agent** | Issue管理・ドキュメント |
| %21 | **PR Agent** | PR作成・Git操作 |
| %22 | **Deploy Agent** | デプロイ |
| %23 | **Refresher Agent** | コンテキスト更新 |

---

## タスク送信パターン

### 1. ビルドタスク
```
送信先: %18 (CodeGen Agent)
メッセージ:
TASK: [タスク名]
## 要件
- ...
## 実行コマンド
npm run build
```

### 2. Git操作タスク
```
送信先: %21 (PR Agent)
メッセージ:
GIT TASK: [操作名]
## コマンド
git add .
git commit -m "..."
git push
```

### 3. レビュータスク
```
送信先: %19 (Review Agent)
メッセージ:
REVIEW: [ファイルパス]
## 観点
- コード品質
- デザインシステム準拠
```

---

## ツール使い分け

| 操作 | Claude.ai | Claude Code |
|------|-----------|-------------|
| ファイル読み込み | Miyabi:read_file | cat / view |
| ファイル書き込み | Miyabi:write_file | echo / create_file |
| ビルド実行 | Orchestra経由 | 直接 npm run build |
| Git操作 | Orchestra経由 | 直接 git |

---

## エラーハンドリング

### bash_tool失敗時
```
エラー: cd: can't cd to /Users/...
対処: Orchestra Agent経由でコマンド実行
```

### tmux接続失敗時
```
エラー: no server running on /tmp/tmux-...
対処: 別マシン (MacBook/MUGEN) のtmuxに接続
```

### GitHub認証失敗時
```
エラー: No GitHub token available
対処: Orchestra Agentで gh auth login 実行
```

---

## ベストプラクティス

1. **最初に環境確認** - bash_toolの動作確認
2. **ファイル操作はMCP経由** - Miyabi:read_file / Miyabi:write_file
3. **ビルド/GitはOrchestra経由** - 並列実行可能
4. **フィードバックはObsidian記録** - Miyabi:obsidian_create_note

---

#skill #orchestra #claude-ai #miyabi

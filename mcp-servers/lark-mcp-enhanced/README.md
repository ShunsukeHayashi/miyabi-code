# Lark MCP Enhanced for Miyabi

Feishu/Lark OpenAPI MCPツール with 自動権限管理機能 for Miyabi private project.

## 機能

- **自動権限管理**: `hayashi.s@customercloud.ai` に自動的に権限を付与
- **Base管理**: Base作成、テーブル管理、レコード操作
- **ドキュメント管理**: ドキュメント作成、編集、検索
- **コラボレーション**: メッセージ、カレンダー、タスク管理
- **AI機能**: Genesis AIシステム

## 使用方法

### 基本起動
```bash
npm start
```

### 機能別起動
```bash
# Base機能のみ
npm run start:base

# ドキュメント機能のみ
npm run start:docs

# コラボレーション機能
npm run start:collab

# AI機能
npm run start:genesis
```

## 自動権限管理

- Base作成時: 自動的に `hayashi.s@customercloud.ai` に編集権限を付与
- ドキュメント作成時: 自動的に `hayashi.s@customercloud.ai` に編集権限を付与
- 手動権限管理: `auto_permission_manager` ツールで任意のリソースに権限を付与

## Miyabi統合

このMCPサーバーはMiyabi private projectの一部として統合されています。

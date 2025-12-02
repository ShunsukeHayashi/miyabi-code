# AntiGravity - Context Index

このディレクトリには、AIエージェントが参照するコンテキストモジュールが格納されています。

## 📂 Structure

```
context/
├── agents.md        # エージェント定義・役割
├── development.md   # 開発ガイドライン
├── architecture.md  # アーキテクチャ概要
├── mcp.md          # MCP統合ガイド
└── worktree.md     # Worktree運用ガイド
```

## 🎯 Usage

エージェントは作業開始前に関連するコンテキストを読み込みます：

```python
# MCP経由でコンテキスト取得
miyabi-rules:miyabi_rules_get_context(module_name="agents")
```

## 📋 Modules

| Module | Description | Priority |
|--------|-------------|----------|
| agents | エージェント定義 | P1 |
| development | 開発ルール | P1 |
| architecture | システム構成 | P2 |
| mcp | MCP統合 | P0 |
| worktree | Git Worktree | P2 |

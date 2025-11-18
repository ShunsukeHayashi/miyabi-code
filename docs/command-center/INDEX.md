# Miyabi Multi-Session Command Center - Documentation Index

**Version**: 1.0.0
**Status**: ✅ Active
**Last Updated**: 2025-11-18

---

## 📖 ドキュメント構成

### 🎯 エントリーポイント

**[README.md](README.md)** - プロジェクト全体のナビゲーション
- 統合コマンドセンターの概要
- Guardian-Operator関係の説明
- クイックスタートガイド
- 典型的なワークフロー例

👉 **まずここから読んでください**

---

### 📚 コアドキュメント

#### 1. [GUARDIAN_OPERATOR_INTEGRATION.md](GUARDIAN_OPERATOR_INTEGRATION.md)
**対象**: Guardian・Operator両方
**内容**: 統合プロトコル全体の詳細仕様
- Guardian（人間）とOperator（Claude）の役割定義
- P0/P1プロトコル詳細
- ワークフロー・承認フロー
- トラブルシューティング

**読むタイミング**: プロトコルの詳細を理解したい時

---

#### 2. [PROJECT_CUSTOM_INSTRUCTIONS.md](PROJECT_CUSTOM_INSTRUCTIONS.md)
**対象**: Operator（Claude）
**内容**: Operatorの動作指針・プロトコル
- 核心原則（P0/P1）
- 利用可能なMCPツール
- 標準動作プロトコル
- リスク判定基準
- コミュニケーションスタイル

**読むタイミング**: Operatorの動作を確認したい時

---

#### 3. [SESSION_MANAGEMENT_QUICK_REFERENCE.md](SESSION_MANAGEMENT_QUICK_REFERENCE.md)
**対象**: Guardian（人間）
**内容**: よく使うコマンド・操作のクイックリファレンス
- 状態確認コマンド
- タスク実行コマンド
- メッセージ送信
- シナリオ別ガイド
- Tips & Tricks

**読むタイミング**: 特定の操作方法を知りたい時

---

### 🛠️ セッション定義

#### 4. [SOCAI_SESSION_DEFINITION.md](SOCAI_SESSION_DEFINITION.md)
**対象**: Guardian・Operator両方
**内容**: SOCAIセッション（ソーシャル/ビジネス）の定義
- セッション構成（7 windows）
- Business Agents配置
- 起動手順
- 統合方法

**読むタイミング**: SOCAIセッションを起動する時

---

## 🔗 関連ドキュメント

### Miyabiプロジェクト

- **[CLAUDE.md](../../CLAUDE.md)** - Miyabi基本ルール（P0-P3）
- **[.claude/agents/](../../.claude/agents/)** - Agent仕様・プロンプト
- **[.claude/context/](../../.claude/context/)** - コンテキストモジュール

### MCP Servers

- **[mcp-servers/miyabi-tmux-server/](../../mcp-servers/miyabi-tmux-server/)** - tmux管理MCPサーバー
- **[mcp-servers/miyabi-rules-server/](../../mcp-servers/miyabi-rules-server/)** - ルール検証MCPサーバー

---

## 📊 読む順序（推奨）

### 初めての方

```
1. README.md
   ↓
2. GUARDIAN_OPERATOR_INTEGRATION.md（概要セクション）
   ↓
3. SESSION_MANAGEMENT_QUICK_REFERENCE.md（基本コマンド）
   ↓
4. 実際に使ってみる
```

### Operatorとして動作する場合（Claude）

```
1. PROJECT_CUSTOM_INSTRUCTIONS.md（全セクション）
   ↓
2. README.md（ワークフロー例）
   ↓
3. GUARDIAN_OPERATOR_INTEGRATION.md（詳細プロトコル）
```

### 新しいセッション追加時

```
1. SOCAI_SESSION_DEFINITION.md（構成例）
   ↓
2. 新セッション定義作成
   ↓
3. README.mdに追加
```

---

## 🎯 ユースケース別ガイド

### 「何ができるの？」

👉 **README.md** - 主要機能セクション

### 「どうやって使うの？」

👉 **SESSION_MANAGEMENT_QUICK_REFERENCE.md**

### 「プロトコルの詳細は？」

👉 **GUARDIAN_OPERATOR_INTEGRATION.md**

### 「Operatorの動作は？」

👉 **PROJECT_CUSTOM_INSTRUCTIONS.md**

### 「新しいセッション作りたい」

👉 **SOCAI_SESSION_DEFINITION.md**（参考例）

---

## 🔄 更新履歴

- **2025-11-18**: 初版作成、5ドキュメント統合完了

---

## 📞 サポート

質問や不明点は、Operatorに聞いてください：

```
Guardian: "〜について教えて"
Operator: [適切なドキュメントセクションを案内]
```

---

**統合コマンドセンターへようこそ！** 🎯

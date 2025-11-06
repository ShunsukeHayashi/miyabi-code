# Codex Hooks

**Version**: 1.0.0
**Last Updated**: 2025-11-06

---

## 📋 Overview

Codex Hooks システム - イベント駆動型自動化フレームワーク

### Features

- ✅ イベント駆動型実行
- ✅ JSON設定ファイル管理
- ✅ タイムアウト機能
- ✅ 条件付き実行
- ✅ 環境変数サポート

---

## 🔧 Configuration

設定ファイル: `hooks-config.json`

JSONスキーマ: `.codex/schemas/hooks-config.schema.json`

### サンプル設定

```json
{
  "auto_format": {
    "event": "tool_after",
    "command": ".codex/hooks/auto-format.sh",
    "timeout_ms": 10000,
    "enabled": true,
    "conditions": {
      "tool_names": ["Write", "Edit"]
    },
    "description": "コード自動フォーマット"
  }
}
```

---

## 📁 Available Hooks

1. **auto-format.sh** - コード自動フォーマット (Rust/TypeScript)
2. **validate-typescript.sh** - TypeScript型チェック
3. **log-commands.sh** - コマンド実行ログ
4. **agent-event.sh** - Agent実行イベントログ

---

## 🚀 Usage

### Hook実行フロー

```
Event発生
  ↓
hooks-config.json 確認
  ↓
条件マッチ?
  ↓ YES
Hook実行 (timeout付き)
  ↓
ログ記録
```

### 手動テスト

```bash
# Hook単体テスト
./.codex/hooks/auto-format.sh

# JSON設定検証
ajv validate -s .codex/schemas/hooks-config.schema.json -d hooks-config.json
```

---

## 📖 Documentation

詳細: `.codex/guides/HOOKS_IMPLEMENTATION.md`

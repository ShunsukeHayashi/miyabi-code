# Context Statistics & Tool Search Optimization

現在のコンテキスト消費量とTool Search最適化状況を表示します。

## 実行手順

### 1. Tool Searchカタログ統計を取得

```
mcp__miyabi-tool-search__get_catalog_stats
```

結果を以下の形式で表示:

| 項目 | 値 |
|------|-----|
| 総ツール数 | {totalTools} |
| 常時ロード | {alwaysLoadedCount} |
| 遅延ロード | {deferredCount} |

### 2. 常時ロードツール一覧を取得

```
mcp__miyabi-tool-search__get_always_loaded_tools
```

### 3. コンテキスト消費量を計算・表示

以下の形式でレポートを生成:

---

## Context Statistics Report

**生成日時**: {現在時刻}

### 現在ロード中のツール

システムプロンプトに含まれるツール定義を以下のカテゴリでカウント:

| カテゴリ | ツール数 | トークン推定 |
|----------|----------|--------------|
| Built-in | 17 | ~5,100 |
| MCP Tools | {MCP数} | ~{MCP数*300} |
| **合計** | **{合計}** | **~{合計*300}** |

### Tool Search最適化状況

| 指標 | Before | After (理論値) | 削減率 |
|------|--------|----------------|--------|
| ロードツール数 | {現在} | 7 | {削減%}% |
| トークン消費 | ~{現在*300} | ~2,100 | {削減%}% |

### カテゴリ別内訳

```
mcp__miyabi-tool-search__get_catalog_stats
```

の結果から`byCategory`を表示

### defer_loading対応状況

- [ ] Claude Code側の対応: **未実装**
- [x] miyabi-tool-search実装: **完了**
- [x] カタログ作成: **105ツール登録済み**

### 推奨アクション

1. Claude Code更新時にdefer_loading対応を確認
2. 高頻度使用ツールの常時ロード設定見直し
3. 不要なMCPサーバーの無効化検討

---

## 関連ドキュメント

- `.claude/context/tool-search-optimization.md` - 最適化ガイド
- `reports/2025-11-29-tool-search-context-optimization-report.md` - 詳細レポート

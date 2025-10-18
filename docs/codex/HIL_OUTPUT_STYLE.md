# Codex HIL Output Style (Terminal)

目的: ターミナルでの視認性を最優先した Human-in-the-Loop 出力スタイルを提供します。

## 切替方法

- 環境変数:
  - `CODEX_HIL_STYLE=compact` | `plain` | `rich`
  - 互換: `MIYABI_OUTPUT=compact|plain|rich`
- デフォルト:
  - CI または 非TTY: `compact`
  - それ以外: `rich`

## ポリシー（compact / plain）
- 絵文字・グラデーション・装飾ボックスを抑制
- 見出しは1行＋ASCIIの線で区切り（過剰余白なし）
- スピナー無効化（進捗は静的テキスト）
- 色は最小限（`plain`は無色）
- 記号は `OK|WARN|ERR|INFO` など固定幅ラベル

## 実装
- `packages/coding-agents/ui/logger.ts` に `OutputMode` を追加し、各メソッドでスタイル分岐
- 非TTY/CIでは自動的に `compact` を選択

## 例
```bash
CODEX_HIL_STYLE=compact npm run agents:status
MIYABI_OUTPUT=plain npm run agents:verify
```

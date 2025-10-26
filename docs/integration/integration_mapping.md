# Integration Mapping Template

本テンプレートは、YAML Context Engineering Agentが連携するツールやAPIを体系的に把握するためのものです。

## 1. Integration Matrix
| ツール/サービス | 役割 | 入力チャネル | 出力チャネル | 備考 |
| ---------------- | ---- | ------------ | ------------ | ---- |
| Devin | プロジェクト計画 | `.ai/` ストーリー/タスク | PRD/ARCHへのフィードバック | |
| Cursor | IDE/レビュー | Gitブランチ | レビューコメント | |
| Roo | 静的解析 | CI/CD | リンティングレポート | |
| その他 | | | | |

## 2. Data Contracts
- メッセージ形式:
  ```yaml
  message:
    source: "codex"
    target: "cursor"
    payload:
      type: "handoff_summary"
      content: "..."
  ```
- スキーマ管理: `.ai/agent_specification.yaml`

## 3. Sequence Diagrams
- **コンテンツ抽出フロー**: （記入予定）
- **ログ連携フロー**: （記入予定）

## 4. Operational Considerations
- レート制限:
- 認証/認可:
- エラーハンドリング方針:

## 5. Change Management
| 変更種別 | 手続き | 承認者 |
| -------- | ------ | ------ |
| API仕様変更 | PRD/ARCH改訂 → レビュー → 承認 | ユーザー |
| ツール追加 | 影響評価 → docs更新 → アナウンス | プロジェクトオーナー |

> 連携情報を更新した際は、AGENTS.mdと@memory-bank.mdcにも通知してください。

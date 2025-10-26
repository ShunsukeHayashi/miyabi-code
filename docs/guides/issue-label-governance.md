# Issue Label Governance Guide

## 1. 目的
自律運用憲法 (AGENTS.md v5.0) に準拠した課題管理を安定させるため、GitHub Issue ラベルの体系と運用ルールを定義する。ラベルは以下を満たすことを目的とする。

- 自律オペレーションの状態・優先度・リスクを即時に可視化
- プロトコル遵守状況を GitHub Actions によって自動追跡
- ダッシュボード／レポートの集計軸として利用可能
- 今後の憲法アップデート時に参照しやすい単一情報源 (Single Source of Truth)

## 2. ラベル体系
ラベル名は `カテゴリ:ラベル` 形式とし、カテゴリ名でソートした際に意味が読み取れるよう統一する。カラー値は `#RRGGBB` 形式。

### 2.1 ステータス管理 (Lifecycle)
| ラベル | カラー | 用途 | 適用フェーズ |
| --- | --- | --- | --- |
| `status:triage` | `#e4e669` | 受付直後。分類・要件確認待ち | Issue起票直後 |
| `status:in-progress` | `#fbca04` | 担当Agentが着手済み | 実装進行時 |
| `status:review` | `#1f78d1` | レビュー・検証待ち | PR提出後 |
| `status:blocked` | `#d876e3` | 外部要因または依存タスクで停止 | 障害・待機発生時 |
| `status:ready-for-release` | `#0e8a16` | リリース承認済みで配信待ち | Progressive Delivery直前 |
| `status:done` | `#006b75` | 完了。ログ更新およびナレッジ反映済み | クローズ時 |

### 2.2 優先度・重大度 (Priority / Impact)
| ラベル | カラー | 用途 | 適用フェーズ |
| --- | --- | --- | --- |
| `priority:P0-critical` | `#b60205` | 即時対応が必要な致命障害 | 経済非常事態・自律回復失敗時 |
| `priority:P1-high` | `#d93f0b` | 24時間以内対応が必要 | 主要機能障害発生時 |
| `priority:P2-medium` | `#f9d0c4` | 2スプリント以内で解決 | 通常改善 |
| `priority:P3-low` | `#c0e4e7` | 後回し可能。計画時考慮 | Nice-to-have |

### 2.3 ワークタイプ (Work Type)
| ラベル | カラー | 用途 | 適用フェーズ |
| --- | --- | --- | --- |
| `type:feature` | `#0b5394` | 新規機能／エージェント追加 | Epic / Story 起票時 |
| `type:improvement` | `#1c4587` | 既存機能改善・UX向上 | 継続改善タスク |
| `type:bug` | `#d73a4a` | バグ／欠陥修正 | テスト・運用で検出時 |
| `type:maintenance` | `#6f42c1` | 依存更新・インフラ作業 | 定常運用 |
| `type:documentation` | `#5319e7` | ドキュメント整備 | ナレッジ更新 |
| `type:research` | `#8a2be2` | 検証・PoC・実験 | 新規調査 |
| `type:policy` | `#663399` | 憲法・プロトコル改訂 | Mandate関連 |

### 2.4 プロトコル監視 (Protocol Hooks)
| ラベル | カラー | 用途 | 適用フェーズ |
| --- | --- | --- | --- |
| `protocol:economic-breaker` | `#fef2c0` | 経済的サーキットブレーカー関連 | CostMonitoringAgent 連動時 |
| `protocol:knowledge-persistence` | `#bfe5bf` | ナレッジ蓄積／Vector検索必須案件 | 知識永続化処理時 |
| `protocol:handshake` | `#ffd33d` | 人間Guardianへのハンドシェイク発動 | 自律回復失敗後 |
| `protocol:onboarding` | `#9be9a8` | 新規エージェント追加プロセス | agent-onboarding.yml 発火時 |

### 2.5 インシデント & リスク
| ラベル | カラー | 用途 | 適用フェーズ |
| --- | --- | --- | --- |
| `incident:active` | `#cf222e` | 進行中のインシデント | IncidentCommander 稼働時 |
| `incident:postmortem-required` | `#fdaeb7` | ポストモーテム未完了 | 収束直後 |
| `risk:security` | `#b31d28` | セキュリティ・シークレット関連リスク | Vault / Secrets 問題時 |
| `risk:compliance` | `#ff9f1c` | 方針・法令遵守リスク | ガバナンス確認時 |
| `risk:dependency` | `#d4c5f9` | 外部依存リスク | サードパーティ障害時 |

### 2.6 メタ運用・補助
| ラベル | カラー | 用途 | 適用フェーズ |
| --- | --- | --- | --- |
| `meta:auto-generated` | `#cccccc` | エージェント／Actions による自動起票 | 自動生成 Issue |
| `meta:needs-context` | `#fef3c7` | 追加情報・ログ待ち | トリアージ中 |
| `meta:tracking` | `#0366d6` | 長期追跡・定期報告 | OKR／定期レポート |
| `meta:blocked-external` | `#f6c6c7` | 外部承認・第三者依存で停滞 | 依存先待ち |

## 3. 命名・併用ルール
- ラベルは原則として 1 系統あたり 1 つを必須付与 (`status:*`, `type:*`, `priority:*` など)。
- プロトコル系 (`protocol:*`) は、該当ワークフローや GitHub Actions から自動付与・除去できるよう、命名を固定。
- `priority:P0-critical` と `incident:active` はセットで運用し、緊急対応タスクをダッシュボードで抽出可能にする。
- `meta:auto-generated` が付与された Issue は、処理完了後に手動で除去しヒューマン追跡案件を明確化する。

## 4. 運用フロー
1. **起票時**: `status:triage`、適切な `type:*`、必要に応じて `priority:*` を付与。自動起票は `meta:auto-generated` を必須化。
2. **トリアージ**: 情報不足なら `meta:needs-context` を追加。プロトコル対象案件は `protocol:*` を設定。
3. **実行中**: 着手時に `status:in-progress` へ変更。外部依存で停止した場合は `status:blocked` + `meta:blocked-external`。
4. **レビュー/検証**: 実装完了で `status:review`。リリース可否判定後 `status:ready-for-release`。
5. **完了**: `status:done`。インシデント案件はポストモーテム完了後に `incident:postmortem-required` を除去し、ナレッジリポジトリへ反映。

## 5. GitHub 反映手順
### 5.1 `gh` CLI を用いた一括作成
```bash
gh label create "status:triage" --color e4e669 --description "受付直後でトリアージ待ち"
gh label create "status:in-progress" --color fbca04 --description "実装が進行中"
# ... (残りのラベルも同様に作成)
```
> 既存ラベルを更新する場合は `gh label edit <name> --color <hex> --description <desc>` を利用する。

### 5.2 GitHub MCP サーバー (`mcpcurl`) 経由での自動化
```bash
PAT=$(sed -n 's/^GITHUB_PERSONAL_ACCESS_TOKEN[[:space:]]*=[[:space:]]*//p' .env)
external/github-mcp-server/mcpcurl \
  --stdio-server-cmd "docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN=$PAT ghcr.io/github/github-mcp-server" \
  tools create_label \
  --owner ShunsukeHayashi \
  --repo Autonomous-Operations \
  --name "status:triage" \
  --color "e4e669" \
  --description "受付直後でトリアージ待ち"
```
同スクリプトを `labels/bootstrap.sh` 等にまとめることで、環境構築時に再実行可能な IaC へ拡張できる。

## 6. 保守と将来拡張
- ラベルは四半期毎にレビューし、未使用ラベルは削除または統合する。
- 新しいプロトコルを追加する際は、`protocol:*` 命名規則を継承し GitHub Actions からの付与ロジックを同時に更新する。
- ダッシュボード／プロジェクトボードでの利用を想定し、命名の整合性を保つ。必要に応じて `projects/` 配下の設定ファイルに反映する。
- 本ガイドを基に AGENTS.md の該当章をアップデートする場合、変更履歴と承認プロセスを Issue + PR で管理する。


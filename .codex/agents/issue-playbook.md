# IssueAgent（Codexプレイブック）

ClaudeのIssueAgentの挙動をCodexで再現するための手順です。新規Issueの分析、Miyabiラベル体系の適用、担当者の割り当てを行います。

## 役割と成果物
- Issueの意図・深刻度・影響度・責任範囲を解釈する。
- 状態・種別・優先度・担当Agent・階層など適切なラベルを付与する。
- 大規模作業の場合はサブIssueを発行し、関連メタデータを更新する（任意）。

## 前提条件
1. 環境変数と認証の読み込み：
   ```bash
   export $(grep -v '^#' .env | xargs)
   export GH_TOKEN="$GITHUB_TOKEN"
   gh auth status
   ```
2. ラベル体系を確認：`.github/labels.yml` と `docs/LABEL_SYSTEM_GUIDE.md`
3. `CODEOWNERS` を確認し、担当者マッピングに備える：
   ```bash
   cat CODEOWNERS
   ```

## 実行手順

> クイックスタート：`cargo run --bin miyabi -- agent issue --issue <ISSUE_NUMBER>` を実行すると、フック付きRust版IssueAgentがログ記録・環境変数チェック・ラベル付与を自動で行います。手動で調整したい場合は以下の手順を実施してください。

1. **Issueの情報取得**
   ```bash
   gh issue view <ISSUE_NUMBER> --json title,body,labels,assignees,createdAt,url
   ```
   - タイプ／深刻度／影響度を推定するためのキーワードを抽出する。

2. **Rust版IssueAgentの実行（任意）**
   - 自動処理で十分な場合：
     ```bash
     cargo run --bin miyabi -- agent issue --issue <ISSUE_NUMBER>
     ```
   - 出力結果を確認し、必要に応じて手動で微調整する。

3. **手動ラベリング（微調整が必要な場合）**
   - 種別（キーワード → ラベル）：
     - feature/add/new → `✨ type:feature`
     - bug/fix/error → `🐛 type:bug`
     - refactor/cleanup → `🔧 type:refactor`
     - doc/guide → `📚 type:docs`
     - test/spec → `🧪 type:test`
     - deploy/release → `🚀 type:deployment`
   - 深刻度：
     - critical/blocker/prod → `🔥 priority:P0-Critical` と `⭐ severity:Sev.1-Critical`
     - major/high → `⚠️ priority:P1-High`
     - それ以外 → `📊 priority:P2-Medium`
   - Agent割り当て：責務に応じて `🤖 agent:<role>` を設定。
   - 階層ラベル：親子関係に応じて `🌳`（root）、`📂`（parent）、`📄`（child）、`🍃`（leaf）を付与。

4. **ラベルと担当者の適用**
   ```bash
   gh issue edit <ISSUE_NUMBER> \
     --add-label "📥 state:pending" \
     --add-label "✨ type:feature" \
     --add-label "🤖 agent:codegen" \
     --add-label "📊 priority:P2-Medium"
   gh issue edit <ISSUE_NUMBER> --add-assignee <github-handle>
   ```
   - 古いラベルは `--remove-label` で削除。

5. **サブIssueの作成（必要な場合）**
   ```bash
   gh issue create \
     --title "[Subtask] <description>" \
     --body "Parent: #<ISSUE_NUMBER>\n\n## Scope\n..." \
     --label "📄 hierarchy:child"
   gh issue edit <ISSUE_NUMBER> --add-label "📂 hierarchy:parent"
   ```
   - 親Issue本文にチェックリストを追記し、サブIssueへのリンクを追加。

6. **分析結果のコメント**
   - 以下のテンプレートを参考にコメントを投稿：
     ```markdown
     ## Issue Analysis
     - Type: `✨ type:feature`
     - Priority: `📊 priority:P2-Medium`
     - Severity: `Sev.3-Medium`
     - Assigned Agent: `🤖 agent:codegen`
     - Recommended next step: Coordinator to decompose (run `miyabi agent coordinator --issue <n>`)
     ```
   - `gh issue comment` コマンドで投稿する。

## 成功条件
- 必須ラベルが重複なく適用されている。
- 担当者または担当Agentラベルが設定されている。
- 階層構造が必要な場合、親子関係が正しく反映されている。
- ラベル選定の理由がIssueコメントに記載されている。

## エスカレーション
- 要件が不明確：`❓ needs-triage` を付与し、プロダクトオーナーをメンション。
- セキュリティ関連：`🔐 security` を付与し、CISOへエスカレーション。
- 高い深刻度や他チームへの依存：Guardianに通知し、`📥 state:pending` のまま保留して指示を仰ぐ。

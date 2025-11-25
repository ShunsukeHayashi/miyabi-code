---
title: "Obsidian Documentation メンテナンスガイド"
created: 2025-11-25
updated: 2025-11-25
author: "Claude Code"
category: "guide"
tags: ["miyabi", "documentation", "maintenance", "obsidian"]
status: "published"
---

# Obsidian Documentation メンテナンスガイド

このガイドでは、Miyabi Obsidian Documentation Systemの継続的な更新・メンテナンス手順を説明します。

## 📑 目次

- [[#1. 新規Entity追加|新規Entity追加]]
- [[#2. 新規Agent追加|新規Agent追加]]
- [[#3. 新規Relation追加|新規Relation追加]]
- [[#4. 新規Workflow追加|新規Workflow追加]]
- [[#5. PlantUML図の更新|PlantUML図の更新]]
- [[#6. 定期メンテナンス|定期メンテナンス]]

---

## 1. 新規Entity追加

### 1.1 YAML定義追加

```yaml
# miyabi_def/variables/entities.yaml に追加
E{N}:
  name: "EntityName"
  description: "エンティティの説明"
  managed_by:
    - "Agent名"
  related_entities:
    - "E1"
    - "E2"
```

### 1.2 マークダウンファイル作成

`docs/obsidian-vault/entities/E{N}.md` を作成：

```markdown
---
title: "E{N} - EntityName"
entity_id: "E{N}"
created: YYYY-MM-DD
tags: ["miyabi", "entity", "E{N}"]
status: "active"
---

# E{N} - EntityName

## 概要
エンティティの説明

## 管理Agent
- [[AgentName]]

## 関連Entity
- [[E1]]
- [[E2]]

## 関連Relation
- [[R{X}]]
```

### 1.3 インデックス更新

`docs/obsidian-vault/entities/INDEX.md` に追加：

```markdown
| [[E{N}]] | EntityName | 説明 |
```

### 1.4 クロスリファレンス更新

- 関連Agentのドキュメントに `[[E{N}]]` リンクを追加
- 関連Workflowのドキュメントを更新

---

## 2. 新規Agent追加

### 2.1 YAML定義追加

```yaml
# miyabi_def/variables/agents.yaml に追加
AgentName:
  type: "Coding" | "Business"
  layer: 3 | 4
  nickname: "ニックネーム"
  status: "deployed" | "planned"
  manages:
    - "E1"
```

### 2.2 マークダウンファイル作成

`docs/obsidian-vault/agents/{AgentName}.md` を作成：

```markdown
---
title: "AgentName"
agent_type: "Coding" | "Business"
layer: 3 | 4
created: YYYY-MM-DD
tags: ["miyabi", "agent", "AgentName"]
status: "deployed"
---

# AgentName (ニックネーム)

## 概要
Agentの説明

## タイプ
- **カテゴリ**: Coding / Business
- **レイヤー**: Layer 3 / Layer 4
- **ステータス**: Deployed / Planned

## 管理Entity
- [[E1]]
- [[E2]]

## 実行方法
```bash
miyabi agent run {agent-name} --issue <number>
```
```

### 2.3 インデックス更新

`docs/obsidian-vault/agents/INDEX.md` に追加：

```markdown
| [[AgentName]] | ニックネーム | Coding/Business | Layer N |
```

---

## 3. 新規Relation追加

### 3.1 マークダウンファイル作成

`docs/obsidian-vault/relations/R{N}.md` を作成：

```markdown
---
title: "R{N} - RelationName"
relation_id: "R{N}"
created: YYYY-MM-DD
tags: ["miyabi", "relation", "R{N}"]
---

# R{N} - RelationName

## 概要
Relationの説明

## ソースEntity
- [[E{X}]]

## ターゲットEntity
- [[E{Y}]]

## カーディナリティ
1:N / N:M / 1:1
```

### 3.2 インデックス更新

`docs/obsidian-vault/relations/INDEX.md` に追加

---

## 4. 新規Workflow追加

### 4.1 マークダウンファイル作成

`docs/obsidian-vault/workflows/W{N}.md` を作成：

```markdown
---
title: "W{N} - WorkflowName"
workflow_id: "W{N}"
created: YYYY-MM-DD
tags: ["miyabi", "workflow", "W{N}"]
---

# W{N} - WorkflowName

## 概要
Workflowの説明

## ステップ

### Step 1: {ステップ名}
- **担当Agent**: [[AgentName]]
- **入力Entity**: [[E{X}]]
- **出力Entity**: [[E{Y}]]

### Step 2: {ステップ名}
...

## 実行方法
```bash
miyabi workflow run {workflow-name}
```
```

### 4.2 インデックス更新

`docs/obsidian-vault/workflows/INDEX.md` に追加

---

## 5. PlantUML図の更新

### 5.1 PUMLファイル編集

`.claude/context/{diagram-name}.puml` を編集

### 5.2 構文チェックとPNG生成

```bash
cd .claude/context
plantuml -tpng -o ../../docs/obsidian-vault/assets/diagrams *.puml
```

### 5.3 PNG生成確認

生成されたPNGファイルを確認：
- `docs/obsidian-vault/assets/diagrams/*.png`

### 5.4 Obsidianで確認

Obsidianを開いて画像が正しく表示されることを確認

---

## 6. 定期メンテナンス

### 6.1 月次チェック

- [ ] デッドリンクチェック
- [ ] 画像表示チェック
- [ ] タグ整合性チェック
- [ ] 新規追加内容の反映確認

### 6.2 四半期レビュー

- [ ] ドキュメント構造見直し
- [ ] 新規機能への対応確認
- [ ] 不要なドキュメントの整理

### 6.3 デッドリンクチェック方法

```bash
# すべての内部リンクを抽出
grep -roh '\[\[[^]]*\]\]' docs/obsidian-vault/ | sort | uniq -c | sort -rn

# 存在しないファイルへのリンクを検出
for link in $(grep -roh '\[\[[^]|]*' docs/obsidian-vault/ | sed 's/\[\[//g' | sort | uniq); do
  if [ ! -f "docs/obsidian-vault/$link.md" ] && [ ! -f "docs/obsidian-vault/$link" ]; then
    echo "Missing: $link"
  fi
done
```

---

## 📂 関連ファイル

| ファイル | 説明 |
|---------|------|
| [[INDEX]] | メインインデックス |
| [[entities/INDEX]] | Entity一覧 |
| [[agents/INDEX]] | Agent一覧 |
| [[relations/INDEX]] | Relation一覧 |
| [[workflows/INDEX]] | Workflow一覧 |
| [[DIAGRAMS_GALLERY]] | ダイアグラム一覧 |
| [[QUICK_REFERENCE]] | クイックリファレンス |

---

## ⚠️ 注意事項

1. **バックアップ**: 大きな変更を行う前に必ずバックアップを取る
2. **YAML構文**: YAML定義ファイルの構文エラーに注意
3. **PlantUML構文**: PNG生成前に必ず構文チェックを実施
4. **リンク整合性**: クロスリファレンスの整合性を維持

---

*Last updated: 2025-11-25*
*Author: Claude Code*

# Miyabi Definition Automation Guide

**Last Updated**: 2025-11-04  
**Scope**: `/Users/shunsuke/Dev/miyabi-private/miyabi_def`

---

## 🎯 ゴール

人間が入力する最初の意図（Intent）だけから、Miyabi 定義ファイル一式を自動生成できるようにするための手順と仕組みをまとめます。テンプレート + 変数という従来方式に、Intent 駆動の動的パイプラインを追加しました。

---

## 1. ファイル構成の追加

```
miyabi_def/
├── intent-schema.yaml          # Intent 定義スキーマ
├── intents/
│   └── sample-product-intent.yaml
├── generate.py                 # Intent 対応 CLI に拡張
```

- **intent-schema.yaml**  
  Intent ファイルの構造を定義（JSON Schema 互換）。最低限 `project` と `outputs` を含む。

- **intents/*.yaml**  
  実際の Intent 例。`sample-product-intent.yaml` にはエージェント構成や領域などを記述。

---

## 2. Intent ファイルの書き方

```yaml
project:
  name: "Miyabi Commerce Pilot"
  summary: "マーケットプレイス機能の自律実装を自動化"

intent:
  objective: "バックログからデプロイまでを全自動化"
  constraints:
    - "Agent数は10以下"

outputs:
  templates:
    - world
    - entities
    - workflows
    - agents

variables:
  project:
    domain: "e-commerce"

agents:
  include:
    - CoordinatorAgent
    - CodeGenAgent
```

- `outputs.templates` にはテンプレートの **エイリアス** またはファイル名（`.j2` 省略可）を列挙。  
- `variables` 以下の値はテンプレート変数にマージされる。  
- `intent` 全体は `{{ intent }}` としてテンプレートから参照可能。

---

## 3. CLI での実行

### セットアップ

```bash
cd miyabi_def
python3 -m venv .venv
source .venv/bin/activate
pip install pyyaml jinja2
```

### Intent 付き生成

```bash
# Intent を指定して生成
python generate.py --intent intents/sample-product-intent.yaml

# 出力先をカスタマイズ
python generate.py --intent my-intent.yaml --output-dir ./generated-intents
```

CLI は以下を自動で行います。

1. 既存の `variables/*.yaml` をロード  
2. Intent からテンプレート計画（Template Plan）を決定  
3. Intent 変数をマージ (`{{ intent }}` として参照可能)  
4. テンプレートを計画順にレンダリング  
5. `generated/` 以下へ書き出し

### テンプレートエイリアス

| エイリアス | 対応テンプレート |
|------------|-----------------|
| `world` | `world_definition.yaml.j2` |
| `step_back` | `step_back_question_method.yaml.j2` |
| `entities` | `entities.yaml.j2` |
| `relations` | `relations.yaml.j2` |
| `labels` | `labels.yaml.j2` |
| `workflows` | `workflows.yaml.j2` |
| `agents` | `agents.yaml.j2` |
| `skills` | `skills.yaml.j2` |
| `crates` | `crates.yaml.j2` |
| `universal` | `universal_task_execution.yaml.j2` |
| `agent_execution_maximization` | `agent_execution_maximization.yaml.j2` |

記述が無い場合は既定のテンプレート順（上記一覧の順番）を使用します。

---

## 4. 動的依存解決（プランニング）

Intent で指定されたテンプレートのみを生成するため、内部で **Template Plan** を構築するようになりました。全体の依存順は `MiyabiDefinitionGenerator.DEFAULT_TEMPLATE_ORDER` に定義されています。Intent にテンプレートが指定されていない場合も、この既定順が利用されます。

今後、テンプレート間の依存関係を DAG として外部ファイル化し、Intent に応じて自動的に依存テンプレートを追加する機能を追加予定です。

---

## 5. 変数マージのルール

1. `variables/*.yaml` を読み込み、単一の辞書にマージ（深いマージ対応）。  
2. Intent の `variables` が存在すれば、既存辞書に対して再帰的に上書き。  
3. Intent 全体を `intent` キーで追加。テンプレートで参照可能（例：`{{ intent.project.name }}`）。

---

## 6. バリデーション & 監視

- Intent ファイルは `intent-schema.yaml` に沿って記述する。  
- 生成後は `generated/*.yaml` のスキーマチェックやリンクチェックを CI に追加予定。  
- Template Plan のログ（生成対象テンプレート一覧）が CLI 出力に表示されるため、人間オペレーターは生成内容を即座に確認できる。

---

## 7. 今後の拡張アイデア

- Intent → ワークフロー → Issue → Agent 実装までを一本化する「フルオーケストレーション」スクリプト  
- Intent から `.claude/` / `.codex/` 側の設定（agents, commands, guides）まで同期生成  
- Intent Expo（Intent を保存・検索して再利用できる UI）  
- CI で Intent を読み込み、`generated/` の差分がないか検証する Guard Rail

---

これで、人間が記述した Intent を入口として Miyabi 定義群を動的に生成するパイプラインが整いました。テンプレートや変数を拡張すれば、さらに多くの成果物を自動生成に組み込めます。

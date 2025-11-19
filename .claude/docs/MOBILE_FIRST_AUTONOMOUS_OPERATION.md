# モバイルファースト完全自律オペレーション

**Version**: 1.0.0
**Last Updated**: 2025-11-15
**Vision**: "スマホからタスクを投げるだけ - あとは全自動"

---

## 🎯 コンセプト

### ユーザー体験

```
あなた（スマホ）
  ↓
  「明日朝までにnoteの記事を書いて投稿しなければいけない」
  ↓ タップで投稿

  [画面を閉じる - 寝る - 朝起きる]

  ↓ 通知
  「✅ noteの記事が投稿されました！」
```

**黒い画面を見ない。待たない。任せるだけ。**

---

## 🏗️ 全体アーキテクチャ

```
┌──────────────────────────────────────────────────────┐
│  Input Layer（入力層）                                │
│                                                       │
│  📱 Smartphone Apps                                   │
│  ├─ Lark Bot                                          │
│  ├─ LINE Official Account                             │
│  ├─ Miyabi Mobile App                                 │
│  ├─ Notion Integration                                │
│  └─ Voice Input (Siri/Google Assistant)               │
│                                                       │
│  入力例:                                               │
│  「明日朝までにnoteの記事を書いて投稿」               │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│  Interpretation Layer（解釈層）                       │
│                                                       │
│  🧠 Task Decomposition Engine                         │
│  - 自然言語理解（Claude API）                         │
│  - タスク分解・計画生成                               │
│  - エージェント選定                                   │
│  - 実行順序決定（DAG生成）                            │
│                                                       │
│  出力:                                                 │
│  Task Graph（実行計画）                               │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│  Orchestration Layer（オーケストレーション層）        │
│                                                       │
│  🎼 Orchestrator (Layer 2)                            │
│  - Task Queueにタスク投入                             │
│  - エージェント起動・監視                             │
│  - 依存関係管理                                       │
│  - 進捗追跡                                           │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│  Execution Layer（実行層）                            │
│                                                       │
│  🤖 Miyabi Society Agents（Headless Mode）            │
│  ├─ ContentCreationAgent → 記事執筆                   │
│  ├─ ReviewAgent → 校正                                │
│  ├─ ImageGenAgent → アイキャッチ作成                  │
│  ├─ SEOAgent → SEO最適化                              │
│  └─ DeploymentAgent → note投稿                        │
│                                                       │
│  実行形式: claude -p "prompt + template"              │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│  Notification Layer（通知層）                         │
│                                                       │
│  📢 Push Notifications                                │
│  ├─ 開始通知: "記事作成を開始しました"                │
│  ├─ 進捗通知: "記事執筆完了（1/4）"                   │
│  ├─ コールアウト: "確認事項があります"                │
│  └─ 完了通知: "✅ noteの記事が投稿されました！"       │
│                                                       │
│  通知先: Lark / LINE / Miyabi App                     │
└──────────────────────────────────────────────────────┘
```

---

## 📱 Input Layer詳細

### サポートするインターフェース

#### 1. Lark Bot（推奨）

**使用例**:
```
あなた: @miyabi 明日朝までにnoteの記事を書いて投稿して

Miyabi Bot:
  ✅ タスクを受け付けました

  タスクID: task-20251115-001
  内容: note記事作成・投稿
  締切: 2025-11-16 09:00

  以下のエージェントを起動します:
  - ContentCreationAgent
  - ReviewAgent
  - ImageGenAgent
  - DeploymentAgent

  進捗は随時お知らせします。
```

**実装**:
- Lark Open API
- Webhook受信
- タスクJSON生成
- タスクキューへ投入

#### 2. LINE Official Account

**使用例**:
```
あなた: 明日朝までにnoteの記事を書いて投稿

Miyabi LINE:
  承知しました！
  記事作成を開始します📝

  完了したらお知らせします✨
```

#### 3. Miyabi Mobile App

**UI例**:
```
┌────────────────────────────┐
│  🌸 Miyabi                  │
├────────────────────────────┤
│                            │
│  新しいタスク              │
│  ┌────────────────────┐    │
│  │ 明日朝までにnote   │    │
│  │ の記事を書いて投稿 │    │
│  └────────────────────┘    │
│                            │
│  [📅 締切: 明日 09:00]     │
│  [⚡ 優先度: 高]           │
│                            │
│  [　　　投稿する　　　]    │
│                            │
└────────────────────────────┘
```

#### 4. Notion Integration

**使用例**:
```
Notionデータベース「Miyabi Tasks」

新しいページ作成:
  Title: 明日朝までにnoteの記事を書いて投稿
  Due Date: 2025-11-16
  Status: Todo

→ 自動でMiyabiに同期 → タスクキュー投入
```

#### 5. 音声入力

**使用例**:
```
あなた: 「Hey Siri, Miyabiに明日朝までにnoteの記事を書いて投稿するように伝えて」

Siri: 「Miyabiにメッセージを送信しました」

→ Shortcuts経由でLark/LINEに送信
```

---

## 🧠 Interpretation Layer詳細

### Task Decomposition Engine

#### 入力: 自然言語タスク

```
「明日朝までにnoteの記事を書いて投稿しなければいけない」
```

#### 処理: Claude APIで解釈

```bash
# .claude/scripts/interpret-task.sh

claude -p "
あなたはTask Decomposition Engineです。
与えられた自然言語タスクを解釈し、実行可能なサブタスクに分解してください。

タスク: ${user_input}

出力形式（JSON）:
{
  \"task_name\": \"タスク名\",
  \"description\": \"説明\",
  \"deadline\": \"ISO 8601\",
  \"priority\": \"P0 | P1 | P2 | P3\",
  \"subtasks\": [
    {
      \"agent\": \"エージェント名\",
      \"action\": \"実行内容\",
      \"input\": {...},
      \"dependencies\": [\"subtask-id\"]
    }
  ]
}
"
```

#### 出力: Task Graph（DAG）

```json
{
  "task_id": "task-20251115-001",
  "task_name": "note記事作成・投稿",
  "description": "noteに記事を書いて投稿する",
  "deadline": "2025-11-16T09:00:00+09:00",
  "priority": "P1",
  "subtasks": [
    {
      "subtask_id": "st-001",
      "agent": "ContentCreationAgent",
      "action": "記事執筆",
      "input": {
        "topic": "自動推定 or ユーザー指定",
        "length": "2000-3000文字",
        "tone": "カジュアル",
        "target_audience": "一般読者"
      },
      "dependencies": [],
      "estimated_duration": "30m"
    },
    {
      "subtask_id": "st-002",
      "agent": "ReviewAgent",
      "action": "校正",
      "input": {
        "article": "output of st-001"
      },
      "dependencies": ["st-001"],
      "estimated_duration": "10m"
    },
    {
      "subtask_id": "st-003",
      "agent": "ImageGenAgent",
      "action": "アイキャッチ生成",
      "input": {
        "style": "modern",
        "colors": ["#FF6B6B", "#4ECDC4"]
      },
      "dependencies": ["st-001"],
      "estimated_duration": "15m"
    },
    {
      "subtask_id": "st-004",
      "agent": "SEOAgent",
      "action": "SEO最適化",
      "input": {
        "article": "output of st-002",
        "keywords": ["自動推定"]
      },
      "dependencies": ["st-002"],
      "estimated_duration": "10m"
    },
    {
      "subtask_id": "st-005",
      "agent": "DeploymentAgent",
      "action": "note投稿",
      "input": {
        "article": "output of st-004",
        "image": "output of st-003",
        "publish_date": "2025-11-16T09:00:00+09:00"
      },
      "dependencies": ["st-004", "st-003"],
      "estimated_duration": "5m"
    }
  ],
  "total_estimated_duration": "70m",
  "execution_strategy": "parallel_where_possible"
}
```

---

## 🎼 Orchestration Layer詳細

### Orchestrator の役割

#### 1. Task Graph を Task Queue に展開

```bash
# Orchestrator内部処理

task_graph=".claude/tasks/graphs/task-20251115-001.json"

# 各サブタスクをタスクキューに投入
jq -r '.subtasks[] | @json' "$task_graph" | while read subtask; do
  subtask_id=$(echo "$subtask" | jq -r '.subtask_id')

  # タスクJSONを生成
  cat > ".claude/tasks/pending/${subtask_id}.json" << EOF
{
  "task_id": "${subtask_id}",
  "parent_task_id": "task-20251115-001",
  "from": "orchestrator",
  "to": "$(echo $subtask | jq -r '.agent')",
  "priority": "P1",
  "directive": "$(echo $subtask | jq -r '.action')",
  "execution": {
    "type": "headless",
    "prompt": "$(echo $subtask | jq -r '.agent' | tr 'A-Z' 'a-z').txt",
    "template": "${subtask_id}_input.json"
  },
  "dependencies": $(echo $subtask | jq '.dependencies'),
  "input": $(echo $subtask | jq '.input'),
  "status": "pending"
}
EOF
done
```

#### 2. 依存関係を管理

```python
# Pseudo-code

def can_execute(task):
    for dep_id in task.dependencies:
        dep_task = get_task(dep_id)
        if dep_task.status != "completed":
            return False
    return True

# メインループ
while True:
    pending_tasks = scan_pending_tasks()

    for task in pending_tasks:
        if can_execute(task):
            execute_headless_agent(task)

    sleep(30)  # 30秒毎にポーリング
```

#### 3. 並列実行の最適化

```
Task Graph:
                st-001 (記事執筆)
                  /    \
                 /      \
          st-002         st-003
         (校正)      (画像生成)
                 \      /
                  \    /
                  st-004
                (SEO最適化)
                     |
                  st-005
                (投稿)

実行順序:
  1. st-001を実行
  2. st-001完了後、st-002とst-003を並列実行
  3. 両方完了後、st-004を実行
  4. st-004完了後、st-005を実行

総実行時間:
  Sequential: 70分
  Parallel: 45分（35%短縮）
```

---

## 🤖 Execution Layer詳細

### エージェント実行

各サブタスクは独立したヘッドレスエージェントとして実行：

```bash
# st-001の実行例

cd ~/Dev/miyabi-private && \
claude -p "$(cat .claude/prompts/content-creation-agent.txt)

$(cat .claude/templates/st-001_input.json)" \
> .claude/logs/st-001_20251115.log 2>&1 &
```

### エージェント間のデータ受け渡し

```
st-001 (記事執筆)
  ↓ output: article.md

st-002 (校正)
  ↓ input: article.md
  ↓ output: article_reviewed.md

st-004 (SEO最適化)
  ↓ input: article_reviewed.md
  ↓ output: article_final.md
```

実装:

```json
// st-002のinputテンプレート
{
  "article_path": ".claude/output/st-001/article.md",
  "review_criteria": ["grammar", "clarity", "tone"],
  "output_path": ".claude/output/st-002/article_reviewed.md"
}
```

---

## 📢 Notification Layer詳細

### 通知のタイミング

| イベント | 通知内容 | 優先度 |
|---------|---------|--------|
| タスク開始 | "記事作成を開始しました" | 低 |
| サブタスク完了 | "記事執筆完了（1/5）" | 低 |
| 50%完了 | "半分完了しました！" | 中 |
| コールアウト | "🔔 確認事項があります" | 高 |
| タスク完了 | "✅ noteの記事が投稿されました！" | 高 |
| エラー | "❌ エラーが発生しました" | 緊急 |

### 通知の実装

```bash
# .claude/scripts/notify.sh

notify_lark() {
    local title=$1
    local message=$2
    local priority=$3

    curl -X POST "https://open.feishu.cn/open-apis/bot/v2/hook/${LARK_WEBHOOK_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"msg_type\": \"post\",
        \"content\": {
          \"post\": {
            \"zh_cn\": {
              \"title\": \"${title}\",
              \"content\": [[{
                \"tag\": \"text\",
                \"text\": \"${message}\"
              }]]
            }
          }
        }
      }"
}

# 使用例
notify_lark "タスク完了" "✅ noteの記事が投稿されました！" "high"
```

---

## 🔄 完全フロー例

### ケーススタディ: note記事投稿

#### Step 1: タスク投入（スマホ）

```
時刻: 2025-11-15 22:00

あなた（Larkから）:
@miyabi 明日朝9時までにnoteの記事を書いて投稿して
テーマ: 「完全自律型AI開発の未来」
長さ: 2500文字くらい
トーン: カジュアルだけどプロフェッショナル
```

#### Step 2: 解釈・分解（30秒）

```
Task Decomposition Engine:
  ✅ タスク解釈完了
  ✅ 5つのサブタスクに分解
  ✅ 実行計画（DAG）生成
  ✅ 推定実行時間: 45分
```

#### Step 3: 通知（開始）

```
Lark通知:
  ✅ タスクを受け付けました

  タスクID: task-20251115-001
  締切: 明日 09:00

  実行計画:
  1. 記事執筆（30分）
  2. 校正（10分）|| 画像生成（15分）
  3. SEO最適化（10分）
  4. 投稿（5分）

  予定完了時刻: 23:15
```

#### Step 4: 実行（バックグラウンド）

```
[22:00:30] st-001開始: ContentCreationAgent
[22:30:45] st-001完了: article.md生成

[22:30:50] st-002開始: ReviewAgent (並列)
[22:30:50] st-003開始: ImageGenAgent (並列)

[22:40:50] st-002完了: article_reviewed.md
[22:45:50] st-003完了: cover_image.png

[22:46:00] st-004開始: SEOAgent
[22:56:00] st-004完了: article_final.md

[22:56:05] st-005開始: DeploymentAgent
[22:58:30] st-005完了: note投稿成功
```

#### Step 5: 通知（完了）

```
Lark通知:
  ✅ タスク完了！

  noteの記事が投稿されました

  📝 記事: https://note.com/your-account/n/xxxxx
  📊 文字数: 2,547文字
  🎨 アイキャッチ: 生成済み
  🔍 SEO: 最適化済み

  実行時間: 58分
  完了時刻: 22:58
```

#### 結果

```
あなた:
  - スマホから1回タスク投入しただけ
  - 画面を見ずに済んだ（寝てた）
  - 朝起きたら記事が投稿済み

Miyabi Society:
  - 5つのエージェントが連携実行
  - 並列実行で35%高速化
  - 完全自動で完了
```

---

## 🎯 実装ロードマップ

### Phase 1: 基盤（2週間）

- [ ] Task Decomposition Engine実装
- [ ] Orchestrator DAG実行機能
- [ ] 基本通知機能（Lark）

### Phase 2: エージェント連携（3週間）

- [ ] ContentCreationAgent headless化
- [ ] ReviewAgent headless化
- [ ] ImageGenAgent headless化
- [ ] DeploymentAgent headless化
- [ ] エージェント間データ受け渡し

### Phase 3: モバイルUI（2週間）

- [ ] Lark Bot完全版
- [ ] LINE Official Account
- [ ] Miyabi Mobile App (React Native)
- [ ] Notion Integration

### Phase 4: 拡張（継続）

- [ ] 音声入力対応
- [ ] 学習・最適化
- [ ] 71タスク全対応

---

## 📊 期待される効果

### 従来のワークフロー

```
1. PCを開く（5分）
2. タスクを書く（10分）
3. コマンド実行（30秒）
4. 画面を見ながら待つ（60分）
5. エラー対応（10分）
6. 結果確認（5分）

合計: 90分（そのうち60分は待ち時間）
```

### 新しいワークフロー

```
1. スマホからタスク投稿（30秒）
2. 通知を待つ（0分 - 他のことができる）
3. 完了通知を確認（10秒）

合計: 40秒の実作業
実際の処理時間: 45分（並列化により短縮）
```

**時間削減**: 98.9%（実作業時間ベース）
**体感時間**: 99.3%削減（待ち時間含む）

---

## 🔗 技術スタック

### Backend

- **Orchestrator**: Rust (Tokio async runtime)
- **Task Queue**: JSON files + SQLite (将来: Redis)
- **Agents**: Claude Code CLI (headless mode)
- **API**: Axum web framework

### Mobile

- **Lark Bot**: Lark Open API + Webhook
- **LINE**: Messaging API
- **Miyabi App**: React Native + Expo
- **Backend**: Rust + Axum

### Integrations

- **Notion**: Notion API
- **Voice**: Shortcuts (iOS) + Google Assistant
- **Monitoring**: Prometheus + Grafana

---

## 🌟 将来の拡張

### v2.0: AI Planning

```
あなた: 「来月のマーケティング施策を全部やっといて」

Miyabi:
  AIが自動で計画立案:
  - 市場調査
  - コンテンツ作成
  - SNS投稿スケジュール
  - 広告運用
  - 効果測定レポート

  全て自動実行 → 月次レポートのみ確認
```

### v3.0: 予測実行

```
Miyabiが学習:
  「毎週月曜にnote記事を投稿している」

  ↓

  自動提案:
  「今週もnote記事を書きますか？」

  ↓

  予測実行:
  タスクを言わなくても自動で準備
```

---

## 📝 まとめ

### この仕組みで実現すること

1. **完全ハンズフリー**
   - スマホから投げるだけ
   - 黒い画面を見ない
   - 待たない

2. **スケーラブル**
   - 71タスク全対応可能
   - Miyabi Society全エージェント活用
   - 並列実行で高速化

3. **モバイルファースト**
   - どこからでもタスク投入
   - リアルタイム通知
   - 進捗確認

4. **完全自律**
   - エージェントが連鎖実行
   - 自動で最適化
   - コールアウト時のみ介入

---

**Vision**: "スマホからタスクを投げるだけ - あとは全自動"
**Status**: Phase 1 設計完了
**Next**: Task Decomposition Engine実装

🌸 **Miyabi Society - Mobile First Autonomy** 🌸

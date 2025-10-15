#!/bin/bash

# Phase 5 Remaining Sub-Issues Creation Script
# Creates Level 2-6 sub-issues (23 issues total)

echo "Creating Level 2 sub-issues (T2.1-T2.4)..."

# Level 2: Curriculum Design
declare -a level2_tasks=(
  "T2.1|全体学習目標設定|T1.7"
  "T2.2|レベル別目標設計（初級・中級・上級）|T2.1"
  "T2.3|レッスンプラン作成（Week 1-4サンプル）|T2.2"
  "T2.4|課題・ワーク設計|T2.3"
)

for task in "${level2_tasks[@]}"; do
  IFS='|' read -r task_id title deps <<< "$task"
  gh issue create --title "[Phase 5][Level 2] $task_id - $title" \
    --body "**親Issue**: #24 | **Level**: 2 - カリキュラム設計 | **依存**: $deps | **Agent**: ProductDesignAgent（つくるん）

🌸 Part of Phase 5" --label "enhancement"
done

echo "Creating Level 3 sub-issues (T3.1-T3.7)..."

# Level 3: Tech Stack Selection
declare -a level3_tasks=(
  "T3.1|フロントエンド技術選定（React + Next.js + Tailwind CSS）|T0.*"
  "T3.2|バックエンド技術選定（Node.js + TypeScript + Express）|T0.*"
  "T3.3|データベース選定（PostgreSQL + Redis）|T0.*"
  "T3.4|インフラ選定（GitHub Actions + Vercel + AWS）|T0.*"
  "T3.5|決済システム選定（Stripe）|T0.*"
  "T3.6|CRM/MA選定（HubSpot Starter）|T0.*"
  "T3.7|開発コスト試算|T3.1-T3.6"
)

for task in "${level3_tasks[@]}"; do
  IFS='|' read -r task_id title deps <<< "$task"
  gh issue create --title "[Phase 5][Level 3] $task_id - $title" \
    --body "**親Issue**: #24 | **Level**: 3 - 技術スタック選定 | **依存**: $deps | **Agent**: ProductDesignAgent（つくるん）

🌸 Part of Phase 5" --label "enhancement"
done

echo "Creating Level 4 sub-issues (T4.1-T4.4)..."

# Level 4: MVP Definition
declare -a level4_tasks=(
  "T4.1|MVPに含める必須機能リスト（CLI、Agent SDK、Worktree並列実行、Label体系）|T3.7"
  "T4.2|MVPから削減する機能リスト（Web UI、マーケットプレイス、エンタープライズ機能）|T4.1"
  "T4.3|MVP開発ロードマップ作成|T4.2"
  "T4.4|MVP完成時の成功指標設定|T4.3"
)

for task in "${level4_tasks[@]}"; do
  IFS='|' read -r task_id title deps <<< "$task"
  gh issue create --title "[Phase 5][Level 4] $task_id - $title" \
    --body "**親Issue**: #24 | **Level**: 4 - MVP定義 | **依存**: $deps | **Agent**: ProductDesignAgent（つくるん）

🌸 Part of Phase 5" --label "enhancement"
done

echo "Creating Level 5 sub-issues (T5.1-T5.5)..."

# Level 5: Prototype Design
declare -a level5_tasks=(
  "T5.1|ランディングページのワイヤーフレーム|T4.4"
  "T5.2|ダッシュボードのワイヤーフレーム|T4.4"
  "T5.3|レッスン画面のワイヤーフレーム（コンテンツ視聴）|T4.4"
  "T5.4|UI/UXデザイン案（カラーパレット・タイポグラフィ）|T5.1-T5.3"
  "T5.5|ユーザーフロー設計|T5.4"
)

for task in "${level5_tasks[@]}"; do
  IFS='|' read -r task_id title deps <<< "$task"
  gh issue create --title "[Phase 5][Level 5] $task_id - $title" \
    --body "**親Issue**: #24 | **Level**: 5 - プロトタイプ設計 | **依存**: $deps | **Agent**: ProductDesignAgent（つくるん）

🌸 Part of Phase 5" --label "enhancement"
done

echo "Creating Level 6 sub-issues (T6.1-T6.4)..."

# Level 6: Document Generation
declare -a level6_tasks=(
  "T6.1|docs/product/product-detail.md 生成|T1.7, T2.4"
  "T6.2|docs/product/tech-stack.md 生成|T3.7"
  "T6.3|docs/product/mvp-definition.md 生成|T4.4"
  "T6.4|docs/product/prototype-design.md 生成|T5.5"
)

for task in "${level6_tasks[@]}"; do
  IFS='|' read -r task_id title deps <<< "$task"
  gh issue create --title "[Phase 5][Level 6] $task_id - $title" \
    --body "**親Issue**: #24 | **Level**: 6 - ドキュメント生成 | **依存**: $deps | **Agent**: ProductDesignAgent（つくるん）

🌸 Part of Phase 5" --label "enhancement"
done

echo "✅ All Level 2-6 sub-issues created!"
echo "Total: 23 issues (Level 2: 4, Level 3: 7, Level 4: 4, Level 5: 5, Level 6: 4)"

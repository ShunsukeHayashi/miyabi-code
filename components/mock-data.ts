import type { Alert, ReferenceLink, TimelineEvent } from './types'

export const timelineEvents: TimelineEvent[] = [
  {
    id: 'evt-001',
    title: 'Issue #758 スコープ確定',
    description: 'CoordinatorAgent が Issue #758 のスプリントスコープと必要なコンポーネントを定義しました。',
    timestamp: '2025-11-05T08:05:00+09:00',
    agent: 'CoordinatorAgent',
    category: 'issue',
    tags: ['scoping', 'planning'],
    link: 'https://github.com/customer-cloud/miyabi-private/issues/758'
  },
  {
    id: 'evt-002',
    title: 'Next.js Mission Control 初期化',
    description: 'Kaede (Pane 2) が Next.js Mission Control プロジェクトの初期セットアップを完了しました。',
    timestamp: '2025-11-05T08:20:00+09:00',
    agent: 'CodeGenAgent',
    category: 'development',
    tags: ['setup', 'frontend']
  },
  {
    id: 'evt-003',
    title: 'ドキュメントインデックス更新',
    description: 'Knowledge Graph 同期が完了し、新しい ReferenceHub リンクが利用可能になりました。',
    timestamp: '2025-11-05T08:45:00+09:00',
    agent: 'KnowledgeAgent',
    category: 'knowledge',
    tags: ['knowledge-base']
  },
  {
    id: 'evt-004',
    title: 'ReviewAgent チェック準備',
    description: 'ReviewAgent が Mission Control UI 向けのチェックリストを生成しました。',
    timestamp: '2025-11-05T09:10:00+09:00',
    agent: 'ReviewAgent',
    category: 'review',
    tags: ['quality', 'ui']
  },
  {
    id: 'evt-005',
    title: '自動デプロイパイプライン確認',
    description: 'DeploymentAgent が最新の Vercel 設定を検証しました。',
    timestamp: '2025-11-05T09:25:00+09:00',
    agent: 'DeploymentAgent',
    category: 'deployment',
    tags: ['vercel', 'pipeline']
  }
]

export const alerts: Alert[] = [
  {
    id: 'alert-001',
    title: 'Knowledge base 同期遅延',
    message: '最新の entity-relations データが未同期です。同期ジョブを実行してください。',
    severity: 'warning',
    createdAt: '2025-11-05T08:55:00+09:00',
    relatedAgent: 'RefresherAgent',
    acknowledged: false,
    link: 'https://docs.miyabi.dev/knowledge/sync'
  },
  {
    id: 'alert-002',
    title: 'CI テスト遅延',
    message: '最終テスト実行から 6 時間が経過しました。Rust ワークスペースのテスト実行を検討してください。',
    severity: 'info',
    createdAt: '2025-11-05T09:05:00+09:00',
    relatedAgent: 'ReviewAgent',
    acknowledged: true
  },
  {
    id: 'alert-003',
    title: 'High Priority Issue',
    message: 'Issue #531 が P1 状態です。継続的なモニタリングが必要です。',
    severity: 'critical',
    createdAt: '2025-11-05T09:15:00+09:00',
    relatedAgent: 'CoordinatorAgent',
    acknowledged: false,
    link: 'https://github.com/customer-cloud/miyabi-private/issues/531'
  }
]

export const referenceLinks: ReferenceLink[] = [
  {
    id: 'ref-001',
    title: 'CLAUDE.md - Control Document',
    description: 'プロジェクト全体の統制ルールとエージェント運用ガイドライン。',
    url: 'https://github.com/customer-cloud/miyabi-private/blob/main/CLAUDE.md',
    category: 'protocol',
    tags: ['rules', 'overview']
  },
  {
    id: 'ref-002',
    title: 'Worktree Protocol',
    description: 'Git Worktree を用いた並列開発ワークフローの詳細。',
    url: 'https://github.com/customer-cloud/miyabi-private/blob/main/docs/WORKTREE_PROTOCOL.md',
    category: 'workflow',
    tags: ['git', 'parallel']
  },
  {
    id: 'ref-003',
    title: 'Architecture Overview',
    description: 'Miyabi エージェントシステムのアーキテクチャ概要。',
    url: 'https://github.com/customer-cloud/miyabi-private/blob/main/.claude/context/architecture.md',
    category: 'architecture',
    tags: ['agents', 'system']
  },
  {
    id: 'ref-004',
    title: 'Label System Guide',
    description: '53 ラベル体系と分類フローの完全ガイド。',
    url: 'https://github.com/customer-cloud/miyabi-private/blob/main/docs/LABEL_SYSTEM_GUIDE.md',
    category: 'guideline',
    tags: ['labels', 'classification']
  }
]

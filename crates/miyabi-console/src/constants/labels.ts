/**
 * Miyabi Label System - 53 Labels across 11 Categories
 * Based on: docs/LABEL_SYSTEM_GUIDE.md
 */

export interface LabelDefinition {
  name: string;
  color: string;
  description: string;
  category: string;
}

export const LABEL_CATEGORIES = {
  TYPE: 'Type',
  PRIORITY: 'Priority',
  STATUS: 'Status',
  AGENT: 'Agent',
  COMPONENT: 'Component',
  DIFFICULTY: 'Difficulty',
  SIZE: 'Size',
  PHASE: 'Phase',
  BUSINESS: 'Business',
  TECHNICAL: 'Technical',
  WORKFLOW: 'Workflow',
} as const;

export const LABELS: LabelDefinition[] = [
  // Type (7 labels)
  { name: 'type:feature', color: '#0052CC', description: '新機能追加', category: LABEL_CATEGORIES.TYPE },
  { name: 'type:bug', color: '#D73A4A', description: 'バグ修正', category: LABEL_CATEGORIES.TYPE },
  { name: 'type:refactor', color: '#FFA500', description: 'リファクタリング', category: LABEL_CATEGORIES.TYPE },
  { name: 'type:docs', color: '#0075CA', description: 'ドキュメント', category: LABEL_CATEGORIES.TYPE },
  { name: 'type:test', color: '#1D76DB', description: 'テスト追加', category: LABEL_CATEGORIES.TYPE },
  { name: 'type:perf', color: '#FF6B6B', description: 'パフォーマンス改善', category: LABEL_CATEGORIES.TYPE },
  { name: 'type:security', color: '#8B0000', description: 'セキュリティ対応', category: LABEL_CATEGORIES.TYPE },

  // Priority (4 labels)
  { name: 'priority:critical', color: '#B60205', description: '緊急対応必須', category: LABEL_CATEGORIES.PRIORITY },
  { name: 'priority:high', color: '#D93F0B', description: '高優先度', category: LABEL_CATEGORIES.PRIORITY },
  { name: 'priority:medium', color: '#FBCA04', description: '中優先度', category: LABEL_CATEGORIES.PRIORITY },
  { name: 'priority:low', color: '#0E8A16', description: '低優先度', category: LABEL_CATEGORIES.PRIORITY },

  // Status (6 labels)
  { name: 'status:blocked', color: '#D73A4A', description: 'ブロック中', category: LABEL_CATEGORIES.STATUS },
  { name: 'status:in-progress', color: '#FBCA04', description: '作業中', category: LABEL_CATEGORIES.STATUS },
  { name: 'status:review', color: '#0075CA', description: 'レビュー待ち', category: LABEL_CATEGORIES.STATUS },
  { name: 'status:ready', color: '#0E8A16', description: '準備完了', category: LABEL_CATEGORIES.STATUS },
  { name: 'status:backlog', color: '#FFFFFF', description: 'バックログ', category: LABEL_CATEGORIES.STATUS },
  { name: 'status:wontfix', color: '#CCCCCC', description: '対応しない', category: LABEL_CATEGORIES.STATUS },

  // Agent (7 labels)
  { name: 'agent:coordinator', color: '#FF69B4', description: 'CoordinatorAgent担当', category: LABEL_CATEGORIES.AGENT },
  { name: 'agent:codegen', color: '#32CD32', description: 'CodeGenAgent担当', category: LABEL_CATEGORIES.AGENT },
  { name: 'agent:review', color: '#FFD700', description: 'ReviewAgent担当', category: LABEL_CATEGORIES.AGENT },
  { name: 'agent:issue', color: '#87CEEB', description: 'IssueAgent担当', category: LABEL_CATEGORIES.AGENT },
  { name: 'agent:pr', color: '#9370DB', description: 'PRAgent担当', category: LABEL_CATEGORIES.AGENT },
  { name: 'agent:deploy', color: '#FF6347', description: 'DeploymentAgent担当', category: LABEL_CATEGORIES.AGENT },
  { name: 'agent:refresher', color: '#20B2AA', description: 'RefresherAgent担当', category: LABEL_CATEGORIES.AGENT },

  // Component (8 labels)
  { name: 'component:core', color: '#006B75', description: 'miyabi-core', category: LABEL_CATEGORIES.COMPONENT },
  { name: 'component:agents', color: '#1D76DB', description: 'miyabi-agents', category: LABEL_CATEGORIES.COMPONENT },
  { name: 'component:github', color: '#0E8A16', description: 'miyabi-github', category: LABEL_CATEGORIES.COMPONENT },
  { name: 'component:worktree', color: '#5319E7', description: 'miyabi-worktree', category: LABEL_CATEGORIES.COMPONENT },
  { name: 'component:llm', color: '#C5DEF5', description: 'miyabi-llm', category: LABEL_CATEGORIES.COMPONENT },
  { name: 'component:cli', color: '#BFD4F2', description: 'miyabi-cli', category: LABEL_CATEGORIES.COMPONENT },
  { name: 'component:mcp', color: '#D4C5F9', description: 'miyabi-mcp-server', category: LABEL_CATEGORIES.COMPONENT },
  { name: 'component:knowledge', color: '#F9C5D4', description: 'miyabi-knowledge', category: LABEL_CATEGORIES.COMPONENT },

  // Difficulty (3 labels)
  { name: 'difficulty:easy', color: '#7057FF', description: '初心者向け', category: LABEL_CATEGORIES.DIFFICULTY },
  { name: 'difficulty:medium', color: '#008672', description: '中級者向け', category: LABEL_CATEGORIES.DIFFICULTY },
  { name: 'difficulty:hard', color: '#E99695', description: '上級者向け', category: LABEL_CATEGORIES.DIFFICULTY },

  // Size (4 labels)
  { name: 'size:XS', color: '#C2E0C6', description: '1時間以内', category: LABEL_CATEGORIES.SIZE },
  { name: 'size:S', color: '#BFD4F2', description: '1-4時間', category: LABEL_CATEGORIES.SIZE },
  { name: 'size:M', color: '#FEF2C0', description: '4-8時間', category: LABEL_CATEGORIES.SIZE },
  { name: 'size:L', color: '#F9C5D4', description: '8時間以上', category: LABEL_CATEGORIES.SIZE },

  // Phase (6 labels)
  { name: 'phase:planning', color: '#D4C5F9', description: '計画フェーズ', category: LABEL_CATEGORIES.PHASE },
  { name: 'phase:design', color: '#C5DEF5', description: '設計フェーズ', category: LABEL_CATEGORIES.PHASE },
  { name: 'phase:implementation', color: '#BFD4F2', description: '実装フェーズ', category: LABEL_CATEGORIES.PHASE },
  { name: 'phase:testing', color: '#F9C5D4', description: 'テストフェーズ', category: LABEL_CATEGORIES.PHASE },
  { name: 'phase:deployment', color: '#FEF2C0', description: 'デプロイフェーズ', category: LABEL_CATEGORIES.PHASE },
  { name: 'phase:maintenance', color: '#C2E0C6', description: '保守フェーズ', category: LABEL_CATEGORIES.PHASE },

  // Business (4 labels)
  { name: 'business:marketing', color: '#FF1493', description: 'マーケティング', category: LABEL_CATEGORIES.BUSINESS },
  { name: 'business:sales', color: '#32CD32', description: 'セールス', category: LABEL_CATEGORIES.BUSINESS },
  { name: 'business:analytics', color: '#4169E1', description: 'データ分析', category: LABEL_CATEGORIES.BUSINESS },
  { name: 'business:strategy', color: '#FFD700', description: '戦略・企画', category: LABEL_CATEGORIES.BUSINESS },

  // Technical (3 labels)
  { name: 'tech:rust', color: '#CE422B', description: 'Rust開発', category: LABEL_CATEGORIES.TECHNICAL },
  { name: 'tech:typescript', color: '#3178C6', description: 'TypeScript開発', category: LABEL_CATEGORIES.TECHNICAL },
  { name: 'tech:infrastructure', color: '#326CE5', description: 'インフラ・CI/CD', category: LABEL_CATEGORIES.TECHNICAL },

  // Workflow (1 label)
  { name: 'good-first-issue', color: '#7057FF', description: '初めての貢献に最適', category: LABEL_CATEGORIES.WORKFLOW },
];

/**
 * Get labels by category
 */
export const getLabelsByCategory = (category: string): LabelDefinition[] => {
  return LABELS.filter((label) => label.category === category);
};

/**
 * Get all categories with label counts
 */
export const getCategoriesWithCounts = () => {
  const categories = new Map<string, number>();
  LABELS.forEach((label) => {
    categories.set(label.category, (categories.get(label.category) || 0) + 1);
  });
  return Array.from(categories.entries()).map(([name, count]) => ({ name, count }));
};

/**
 * Get label by name
 */
export const getLabelByName = (name: string): LabelDefinition | undefined => {
  return LABELS.find((label) => label.name === name);
};

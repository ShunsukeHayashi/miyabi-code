/**
 * Workflow Custom Nodes Export
 *
 * React Flow カスタムノードコンポーネントのエクスポート
 * Issue #427: Phase 2.2実装
 */

import AgentNode, { AgentNodeData } from './AgentNode';
import IssueNode, { IssueNodeData } from './IssueNode';
import ConditionNode, { ConditionNodeData } from './ConditionNode';

// カスタムノードタイプマッピング
export const nodeTypes = {
  agentNode: AgentNode,
  issueNode: IssueNode,
  conditionNode: ConditionNode,
};

// 型エクスポート
export type { AgentNodeData, IssueNodeData, ConditionNodeData };

// コンポーネントエクスポート
export { AgentNode, IssueNode, ConditionNode };

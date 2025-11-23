/**
 * Workflow Custom Nodes & Components Export
 *
 * React Flow カスタムノードコンポーネントのエクスポート
 * Issue #427: Phase 2.2 & 2.3実装
 */

import AgentNode, { AgentNodeData } from './AgentNode';
import IssueNode, { IssueNodeData } from './IssueNode';
import ConditionNode, { ConditionNodeData } from './ConditionNode';
import AgentPalette, { AgentPaletteProps } from './AgentPalette';

// カスタムノードタイプマッピング
export const nodeTypes = {
  agentNode: AgentNode,
  issueNode: IssueNode,
  conditionNode: ConditionNode,
};

// 型エクスポート
export type { AgentNodeData, IssueNodeData, ConditionNodeData, AgentPaletteProps };

// コンポーネントエクスポート
export { AgentNode, IssueNode, ConditionNode, AgentPalette };
export default AgentPalette;

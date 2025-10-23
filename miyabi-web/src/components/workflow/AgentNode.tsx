import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * AgentNode - カスタムAgentノードコンポーネント
 *
 * React FlowカスタムNodeとして、Agent固有の情報を表示
 * Issue #427: Phase 2.2実装
 *
 * 機能:
 * - Agent種別アイコン表示
 * - Agent名表示
 * - 実行ステータスバッジ
 * - 入力/出力ハンドル
 *
 * Design: Ive-style (grayscale, minimal)
 */

export interface AgentNodeData {
  agentType: 'Coordinator' | 'CodeGen' | 'Review' | 'Deployment' | 'PR' | 'Issue';
  label?: string;
  status?: 'idle' | 'running' | 'completed' | 'failed';
  description?: string;
}

const agentConfig = {
  Coordinator: {
    icon: '🎯',
    color: 'bg-blue-50 border-blue-200',
    description: 'タスク統括',
  },
  CodeGen: {
    icon: '✨',
    color: 'bg-purple-50 border-purple-200',
    description: 'コード生成',
  },
  Review: {
    icon: '🔍',
    color: 'bg-green-50 border-green-200',
    description: '品質レビュー',
  },
  Deployment: {
    icon: '🚀',
    color: 'bg-orange-50 border-orange-200',
    description: 'デプロイ',
  },
  PR: {
    icon: '📝',
    color: 'bg-indigo-50 border-indigo-200',
    description: 'PR作成',
  },
  Issue: {
    icon: '🎫',
    color: 'bg-pink-50 border-pink-200',
    description: 'Issue分析',
  },
};

const statusConfig = {
  idle: { label: '待機中', color: 'bg-gray-100 text-gray-700' },
  running: { label: '実行中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '完了', color: 'bg-green-100 text-green-700' },
  failed: { label: '失敗', color: 'bg-red-100 text-red-700' },
};

function AgentNode({ data, selected }: NodeProps<any>) {
  const typedData = data as AgentNodeData;
  const config = agentConfig[typedData.agentType];
  const status = typedData.status ? statusConfig[typedData.status] : null;

  return (
    <Card
      className={`
        min-w-[200px] p-4 border-2 transition-all
        ${config.color}
        ${selected ? 'ring-2 ring-blue-400 shadow-lg' : 'shadow-sm'}
      `}
      data-ai-component="agent-node"
      data-ai-agent-type={typedData.agentType}
      data-ai-status={typedData.status}
    >
      {/* 入力ハンドル */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
        data-ai-handle="input"
      />

      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl" data-ai-label="agent-icon">
          {config.icon}
        </span>
        <div className="flex-1">
          <div className="font-medium text-sm" data-ai-label="agent-type">
            {typedData.agentType}Agent
          </div>
          <div className="text-xs text-gray-500" data-ai-label="agent-description">
            {typedData.description || config.description}
          </div>
        </div>
      </div>

      {/* ステータスバッジ */}
      {status && (
        <Badge
          variant="secondary"
          className={`text-xs ${status.color}`}
          data-ai-badge="status"
        >
          {status.label}
        </Badge>
      )}

      {/* カスタムラベル */}
      {typedData.label && typedData.label !== `${typedData.agentType}Agent` && (
        <div className="mt-2 text-xs text-gray-600" data-ai-label="custom-label">
          {typedData.label}
        </div>
      )}

      {/* 出力ハンドル */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
        data-ai-handle="output"
      />
    </Card>
  );
}

export default memo(AgentNode);

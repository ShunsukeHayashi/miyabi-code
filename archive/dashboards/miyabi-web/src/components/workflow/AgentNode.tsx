import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * AgentNode - カスタムAgentノードコンポーネント
 *
 * React FlowカスタムNodeとして、Agent固有の情報を表示
 * Issue #427: Phase 3 - API統合版
 *
 * 機能:
 * - 21 Agents対応 (7 Coding + 14 Business)
 * - Agent種別アイコン表示
 * - Agent名表示
 * - Capabilities表示
 * - 実行ステータスバッジ
 * - 入力/出力ハンドル
 * - カテゴリ別カラースキーム (Purple=Coding, Green=Business)
 *
 * Design: Ive-style (grayscale, minimal) + Category colors
 */

export interface AgentNodeData {
  // API agent metadata
  id?: string;
  name?: string;
  category?: 'coding' | 'business';
  description?: string;
  icon?: string;
  capabilities?: string[];

  // Legacy support
  agentType?: 'Coordinator' | 'CodeGen' | 'Review' | 'Deployment' | 'PR' | 'Issue';
  label?: string;
  status?: 'idle' | 'running' | 'completed' | 'failed';
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

  // Support both new API format and legacy format
  const isCoding = typedData.category === 'coding';
  const isLegacy = Boolean(typedData.agentType && !typedData.category);

  // Get display values
  const displayIcon = typedData.icon || (typedData.agentType ? agentConfig[typedData.agentType]?.icon : '🤖');
  const displayName = typedData.name || (typedData.agentType ? `${typedData.agentType}Agent` : 'Agent');
  const displayDescription = typedData.description || (typedData.agentType ? agentConfig[typedData.agentType]?.description : '');

  // Determine color scheme
  let colorScheme = '';
  if (isLegacy && typedData.agentType) {
    colorScheme = agentConfig[typedData.agentType].color;
  } else if (typedData.category) {
    colorScheme = isCoding ? 'bg-purple-50 border-purple-300' : 'bg-green-50 border-green-300';
  } else {
    colorScheme = 'bg-gray-50 border-gray-300';
  }

  const status = typedData.status ? statusConfig[typedData.status] : null;

  return (
    <Card
      className={`
        min-w-[200px] max-w-[280px] p-4 border-2 transition-all
        ${colorScheme}
        ${
          selected
            ? isCoding
              ? 'ring-2 ring-purple-400 shadow-lg'
              : isLegacy
              ? 'ring-2 ring-blue-400 shadow-lg'
              : 'ring-2 ring-green-400 shadow-lg'
            : 'shadow-sm'
        }
      `}
      data-ai-component="agent-node"
      data-ai-agent-id={typedData.id}
      data-ai-agent-type={typedData.agentType}
      data-ai-category={typedData.category}
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
      <div className="flex items-start gap-2 mb-2">
        <span className="text-2xl" data-ai-label="agent-icon">
          {displayIcon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate" data-ai-label="agent-name">
            {displayName}
          </div>
          <div className="text-xs text-gray-500 line-clamp-2" data-ai-label="agent-description">
            {displayDescription}
          </div>
        </div>
      </div>

      {/* Capabilities (API format only) */}
      {typedData.capabilities && typedData.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {typedData.capabilities.slice(0, 2).map((cap, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className={`text-xs ${
                isCoding ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {cap}
            </Badge>
          ))}
          {typedData.capabilities.length > 2 && (
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
              +{typedData.capabilities.length - 2}
            </Badge>
          )}
        </div>
      )}

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
      {typedData.label && typedData.label !== displayName && (
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

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * IssueNode - カスタムIssueノードコンポーネント
 *
 * React FlowカスタムNodeとして、Issue情報を表示
 * Issue #427: Phase 2.2実装
 *
 * 機能:
 * - Issue番号表示
 * - Issue タイトル表示
 * - ラベル表示
 * - 状態表示 (open/closed)
 *
 * Design: Ive-style (grayscale, minimal)
 */

export interface IssueNodeData {
  issueNumber: number;
  title: string;
  state?: 'open' | 'closed';
  labels?: string[];
  repository?: string;
}

const stateConfig = {
  open: { label: 'Open', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Closed', color: 'bg-red-100 text-red-700' },
};

function IssueNode({ data, selected }: NodeProps<any>) {
  const typedData = data as IssueNodeData;
  const state = typedData.state ? stateConfig[typedData.state] : stateConfig.open;

  return (
    <Card
      className={`
        min-w-[250px] max-w-[300px] p-4 border-2 transition-all
        bg-yellow-50 border-yellow-200
        ${selected ? 'ring-2 ring-blue-400 shadow-lg' : 'shadow-sm'}
      `}
      data-ai-component="issue-node"
      data-ai-issue-number={typedData.issueNumber}
      data-ai-state={typedData.state}
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
        <span className="text-xl" data-ai-label="issue-icon">
          🎫
        </span>
        <div className="flex-1">
          <div className="font-medium text-sm" data-ai-label="issue-number">
            Issue #{typedData.issueNumber}
          </div>
          {typedData.repository && (
            <div className="text-xs text-gray-500" data-ai-label="repository">
              {typedData.repository}
            </div>
          )}
        </div>
        <Badge
          variant="secondary"
          className={`text-xs ${state.color}`}
          data-ai-badge="state"
        >
          {state.label}
        </Badge>
      </div>

      {/* タイトル */}
      <div
        className="text-sm mb-2 line-clamp-2"
        data-ai-label="issue-title"
      >
        {typedData.title}
      </div>

      {/* ラベル */}
      {typedData.labels && typedData.labels.length > 0 && (
        <div className="flex flex-wrap gap-1" data-ai-list="labels">
          {typedData.labels.slice(0, 3).map((label) => (
            <Badge
              key={label}
              variant="outline"
              className="text-xs bg-white"
              data-ai-badge="label"
            >
              {label}
            </Badge>
          ))}
          {typedData.labels.length > 3 && (
            <Badge variant="outline" className="text-xs bg-white">
              +{typedData.labels.length - 3}
            </Badge>
          )}
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

export default memo(IssueNode);

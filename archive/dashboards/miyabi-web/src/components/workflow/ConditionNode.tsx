import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';

/**
 * ConditionNode - カスタム条件分岐ノードコンポーネント
 *
 * React FlowカスタムNodeとして、条件分岐ロジックを表示
 * Issue #427: Phase 2.2実装
 *
 * 機能:
 * - 条件式表示
 * - 複数出力ハンドル (true/false)
 * - ダイアモンド形状
 *
 * Design: Ive-style (grayscale, minimal)
 */

export interface ConditionNodeData {
  condition: string;
  description?: string;
  trueLabel?: string;
  falseLabel?: string;
}

function ConditionNode({ data, selected }: NodeProps<any>) {
  const typedData = data as ConditionNodeData;
  return (
    <div className="relative" data-ai-component="condition-node">
      {/* 入力ハンドル */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
        data-ai-handle="input"
      />

      {/* ダイアモンド形状のカード */}
      <Card
        className={`
          w-[140px] h-[140px] rotate-45 border-2 transition-all
          bg-amber-50 border-amber-300
          ${selected ? 'ring-2 ring-blue-400 shadow-lg' : 'shadow-sm'}
        `}
        data-ai-shape="diamond"
      >
        {/* コンテンツ（回転を戻す） */}
        <div className="-rotate-45 flex items-center justify-center h-full p-4">
          <div className="text-center">
            <div className="text-lg mb-1" data-ai-label="condition-icon">
              ⚡
            </div>
            <div
              className="text-xs font-medium line-clamp-2"
              data-ai-label="condition"
            >
              {typedData.condition}
            </div>
            {typedData.description && (
              <div
                className="text-xs text-gray-500 mt-1 line-clamp-1"
                data-ai-label="description"
              >
                {typedData.description}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* True出力ハンドル（右） */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="w-3 h-3 !bg-green-500 border-2 border-white"
        data-ai-handle="output-true"
        style={{ top: '50%' }}
      />

      {/* False出力ハンドル（左） */}
      <Handle
        type="source"
        position={Position.Left}
        id="false"
        className="w-3 h-3 !bg-red-500 border-2 border-white"
        data-ai-handle="output-false"
        style={{ top: '50%' }}
      />

      {/* ラベル表示（出力） */}
      <div className="absolute -right-14 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium">
        {typedData.trueLabel || 'True'}
      </div>
      <div className="absolute -left-14 top-1/2 -translate-y-1/2 text-xs text-red-600 font-medium">
        {typedData.falseLabel || 'False'}
      </div>
    </div>
  );
}

export default memo(ConditionNode);

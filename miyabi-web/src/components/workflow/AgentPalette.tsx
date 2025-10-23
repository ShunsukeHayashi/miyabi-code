import { DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';

/**
 * AgentPalette - ドラッグ可能なAgentパレットコンポーネント
 *
 * Issue #427: Phase 2.3実装
 *
 * 機能:
 * - Agentノードのドラッグ&ドロップ
 * - Issueノード追加
 * - Conditionノード追加
 *
 * Design: Ive-style (grayscale, minimal)
 */

export interface AgentPaletteProps {
  onAddNode?: (type: 'agent' | 'issue' | 'condition' | 'input' | 'output', agentType?: string) => void;
}

const agents = [
  { type: 'Coordinator', icon: '🎯', description: 'タスク統括' },
  { type: 'CodeGen', icon: '✨', description: 'コード生成' },
  { type: 'Review', icon: '🔍', description: '品質レビュー' },
  { type: 'Deployment', icon: '🚀', description: 'デプロイ' },
  { type: 'PR', icon: '📝', description: 'PR作成' },
  { type: 'Issue', icon: '🎫', description: 'Issue分析' },
];

export default function AgentPalette({ onAddNode }: AgentPaletteProps) {
  // ドラッグ開始ハンドラ
  const onDragStart = (event: DragEvent<HTMLButtonElement>, nodeType: string, agentType?: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    if (agentType) {
      event.dataTransfer.setData('agentType', agentType);
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card className="w-64 m-4 p-4 overflow-y-auto" data-ai-component="agent-palette">
      {/* Agent セクション */}
      <h3 className="text-lg font-light mb-4" data-ai-label="palette-title">
        Agent
      </h3>
      <div className="space-y-2">
        {agents.map((agent) => (
          <Button
            key={agent.type}
            variant="outline"
            className="w-full justify-start text-left cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => onDragStart(e, 'agent', agent.type)}
            onClick={() => onAddNode?.('agent', agent.type)}
            data-ai-action="add-agent"
            data-ai-agent-type={agent.type}
            data-ai-draggable="true"
          >
            <span className="mr-2">{agent.icon}</span>
            <div>
              <div className="font-medium">{agent.type}</div>
              <div className="text-xs text-gray-500">{agent.description}</div>
            </div>
          </Button>
        ))}
      </div>

      {/* その他ノード セクション */}
      <h3 className="text-lg font-light mb-4 mt-6" data-ai-label="other-nodes">
        その他
      </h3>
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start text-left cursor-grab active:cursor-grabbing"
          draggable
          onDragStart={(e) => onDragStart(e, 'issue')}
          onClick={() => onAddNode?.('issue')}
          data-ai-action="add-node"
          data-ai-node-type="issue"
          data-ai-draggable="true"
        >
          <span className="mr-2">🎫</span>
          <div>
            <div className="font-medium">Issue</div>
            <div className="text-xs text-gray-500">Issue情報</div>
          </div>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start text-left cursor-grab active:cursor-grabbing"
          draggable
          onDragStart={(e) => onDragStart(e, 'condition')}
          onClick={() => onAddNode?.('condition')}
          data-ai-action="add-node"
          data-ai-node-type="condition"
          data-ai-draggable="true"
        >
          <span className="mr-2">⚡</span>
          <div>
            <div className="font-medium">Condition</div>
            <div className="text-xs text-gray-500">条件分岐</div>
          </div>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start cursor-pointer"
          onClick={() => onAddNode?.('input')}
          data-ai-action="add-node"
          data-ai-node-type="input"
        >
          <Plus className="h-4 w-4 mr-2" />
          入力ノード
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start cursor-pointer"
          onClick={() => onAddNode?.('output')}
          data-ai-action="add-node"
          data-ai-node-type="output"
        >
          <Plus className="h-4 w-4 mr-2" />
          出力ノード
        </Button>
      </div>

      {/* ヘルプテキスト */}
      <div className="mt-6 p-3 bg-gray-50 rounded-md text-xs text-gray-600">
        <div className="font-medium mb-1">💡 使い方</div>
        <div>
          • ドラッグしてキャンバスに配置
          <br />
          • クリックで素早く追加
          <br />
          • ノード同士を接続してワークフロー作成
        </div>
      </div>
    </Card>
  );
}

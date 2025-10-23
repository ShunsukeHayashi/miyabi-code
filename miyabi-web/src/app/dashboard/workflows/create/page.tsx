'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Save,
  ArrowLeft,
  Play,
  Trash2,
  Plus,
} from 'lucide-react';

/**
 * ワークフローエディタページ
 *
 * React Flowを使用したビジュアルワークフローエディタ
 * Issue #427: Phase 2.1実装
 *
 * 機能:
 * - ドラッグ&ドロップでノード配置
 * - ノード間の接続（エッジ）
 * - ワークフロー保存
 * - Agent選択パレット
 *
 * Design: Ive-style (grayscale, minimal, large fonts)
 */
export default function WorkflowCreatePage() {
  const router = useRouter();

  // ワークフロー基本情報
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // エッジ接続ハンドラ
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // ノード追加ハンドラ（後でAgentパレットから呼び出す）
  const addNode = useCallback(
    (type: string, agentType?: string) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: type === 'agent' ? 'default' : type,
        position: {
          x: Math.random() * 400,
          y: Math.random() * 400,
        },
        data: {
          label: agentType ? `${agentType}Agent` : `${type} Node`,
          agentType,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  // ワークフロー保存ハンドラ
  const handleSave = async () => {
    if (!workflowName.trim()) {
      alert('ワークフロー名を入力してください');
      return;
    }

    const workflow = {
      name: workflowName,
      description: workflowDescription,
      definition: {
        nodes,
        edges,
      },
      status: 'inactive',
    };

    try {
      // TODO: API統合 (Phase 2.4)
      console.log('Saving workflow:', workflow);

      // モック保存（ローカルストレージ）
      const existingWorkflows = JSON.parse(
        localStorage.getItem('miyabi_workflows') || '[]'
      );
      localStorage.setItem(
        'miyabi_workflows',
        JSON.stringify([...existingWorkflows, workflow])
      );

      alert('ワークフローを保存しました');
      router.push('/dashboard/workflows');
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('保存に失敗しました');
    }
  };

  // 戻るボタン
  const handleBack = () => {
    if (nodes.length > 0 || workflowName.trim()) {
      if (!confirm('変更が保存されていません。戻りますか？')) {
        return;
      }
    }
    router.push('/dashboard/workflows');
  };

  return (
    <div
      className="h-screen flex flex-col"
      data-ai-component="workflow-editor-page"
      data-ai-description="React Flow visual workflow editor"
    >
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              data-ai-action="back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
            <div>
              <Input
                type="text"
                placeholder="ワークフロー名を入力..."
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-2xl font-light border-none focus-visible:ring-0 px-0"
                data-ai-input="workflow-name"
              />
              <Textarea
                placeholder="説明を入力..."
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                className="text-sm text-gray-500 border-none focus-visible:ring-0 px-0 resize-none"
                rows={1}
                data-ai-input="workflow-description"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNodes([]);
                setEdges([]);
              }}
              data-ai-action="clear"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              クリア
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              data-ai-action="test-run"
              data-ai-state="disabled"
            >
              <Play className="h-4 w-4 mr-2" />
              テスト実行
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              data-ai-action="save"
            >
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </div>
        </div>
      </div>

      {/* メインエディタエリア */}
      <div className="flex flex-1 overflow-hidden">
        {/* Agentパレット（左サイドバー） */}
        <Card className="w-64 m-4 p-4 overflow-y-auto">
          <h3 className="text-lg font-light mb-4" data-ai-label="palette-title">
            Agent
          </h3>
          <div className="space-y-2">
            {[
              { type: 'Coordinator', icon: '🎯', description: 'タスク統括' },
              { type: 'CodeGen', icon: '✨', description: 'コード生成' },
              { type: 'Review', icon: '🔍', description: '品質レビュー' },
              { type: 'Deployment', icon: '🚀', description: 'デプロイ' },
              { type: 'PR', icon: '📝', description: 'PR作成' },
              { type: 'Issue', icon: '🎫', description: 'Issue分析' },
            ].map((agent) => (
              <Button
                key={agent.type}
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => addNode('agent', agent.type)}
                data-ai-action="add-agent"
                data-ai-agent-type={agent.type}
              >
                <span className="mr-2">{agent.icon}</span>
                <div>
                  <div className="font-medium">{agent.type}</div>
                  <div className="text-xs text-gray-500">{agent.description}</div>
                </div>
              </Button>
            ))}
          </div>

          <h3 className="text-lg font-light mb-4 mt-6" data-ai-label="other-nodes">
            その他
          </h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addNode('input')}
              data-ai-action="add-node"
              data-ai-node-type="input"
            >
              <Plus className="h-4 w-4 mr-2" />
              入力ノード
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addNode('output')}
              data-ai-action="add-node"
              data-ai-node-type="output"
            >
              <Plus className="h-4 w-4 mr-2" />
              出力ノード
            </Button>
          </div>
        </Card>

        {/* React Flowキャンバス */}
        <div className="flex-1 m-4" data-ai-component="react-flow-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            attributionPosition="bottom-left"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
            <Controls />
            <MiniMap
              nodeColor="#9ca3af"
              maskColor="rgba(0, 0, 0, 0.1)"
              style={{
                backgroundColor: '#f9fafb',
              }}
            />
          </ReactFlow>
        </div>
      </div>

      {/* フッター（統計情報） */}
      <div className="border-t border-gray-200 bg-white px-6 py-2 text-sm text-gray-500">
        <div className="flex items-center gap-6">
          <span data-ai-metric="node-count">ノード: {nodes.length}</span>
          <span data-ai-metric="edge-count">接続: {edges.length}</span>
          <span className="ml-auto" data-ai-status="unsaved">
            {nodes.length > 0 || workflowName.trim() ? '未保存の変更があります' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

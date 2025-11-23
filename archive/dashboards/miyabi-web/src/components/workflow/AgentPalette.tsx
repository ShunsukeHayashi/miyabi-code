'use client';

import { DragEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';

/**
 * AgentPalette - ドラッグ可能なAgentパレットコンポーネント
 *
 * Issue #427: Phase 2.3実装 - API統合版
 *
 * 機能:
 * - API経由で21 Agents取得 (7 Coding + 14 Business)
 * - Agentノードのドラッグ&ドロップ
 * - カテゴリフィルター (Coding / Business)
 * - 検索機能
 *
 * Design: Ive-style (grayscale, minimal)
 */

export interface AgentPaletteProps {
  onAddNode?: (type: 'agent' | 'issue' | 'condition' | 'input' | 'output', agentType?: string) => void;
}

interface AgentMetadata {
  id: string;
  name: string;
  category: 'coding' | 'business';
  description: string;
  icon: string;
  capabilities: string[];
}

export default function AgentPalette({ onAddNode }: AgentPaletteProps) {
  const [agents, setAgents] = useState<AgentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'coding' | 'business'>('all');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/v1/agents`);
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const codingCount = agents.filter((a) => a.category === 'coding').length;
  const businessCount = agents.filter((a) => a.category === 'business').length;

  // ドラッグ開始ハンドラ
  const onDragStart = (event: DragEvent<HTMLButtonElement>, nodeType: string, agent?: AgentMetadata) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    if (agent) {
      event.dataTransfer.setData('agentType', agent.id);
      event.dataTransfer.setData('agentData', JSON.stringify(agent));
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  if (loading) {
    return (
      <Card className="w-64 m-4 p-4" data-ai-component="agent-palette">
        <div className="text-center text-gray-500">Loading agents...</div>
      </Card>
    );
  }

  return (
    <Card className="w-64 m-4 p-4 overflow-y-auto max-h-screen" data-ai-component="agent-palette">
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({agents.length})
        </button>
        <button
          onClick={() => setSelectedCategory('coding')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedCategory === 'coding'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Coding ({codingCount})
        </button>
        <button
          onClick={() => setSelectedCategory('business')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedCategory === 'business'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Business ({businessCount})
        </button>
      </div>

      {/* Agent List */}
      <h3 className="text-lg font-light mb-3" data-ai-label="palette-title">
        Agents
      </h3>
      <div className="space-y-2 mb-6">
        {filteredAgents.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">No agents found</div>
        ) : (
          filteredAgents.map((agent) => (
            <Button
              key={agent.id}
              variant="outline"
              className={`w-full justify-start text-left cursor-grab active:cursor-grabbing p-3 h-auto ${
                agent.category === 'coding'
                  ? 'border-purple-200 hover:bg-purple-50'
                  : 'border-green-200 hover:bg-green-50'
              }`}
              draggable
              onDragStart={(e) => onDragStart(e, 'agent', agent)}
              onClick={() => onAddNode?.('agent', agent.id)}
              data-ai-action="add-agent"
              data-ai-agent-type={agent.id}
              data-ai-draggable="true"
            >
              <span className="mr-2 text-xl">{agent.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{agent.name}</div>
                <div className="text-xs text-gray-500 line-clamp-2">{agent.description}</div>
                {agent.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agent.capabilities.slice(0, 2).map((cap, idx) => (
                      <span
                        key={idx}
                        className={`px-1.5 py-0.5 rounded text-xs ${
                          agent.category === 'coding'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {cap}
                      </span>
                    ))}
                    {agent.capabilities.length > 2 && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        +{agent.capabilities.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Button>
          ))
        )}
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

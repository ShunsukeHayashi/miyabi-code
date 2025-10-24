'use client';

import { useCallback, useState, useMemo } from 'react';
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
  BackgroundVariant,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import AgentPalette from '@/components/workflow/AgentPalette';
import AgentNode from '@/components/workflow/AgentNode';
import { Button } from '@/components/ui/button';

export default function WorkflowEditorPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');

  // Register custom node types
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      agentNode: AgentNode,
      issueNode: require('@/components/workflow/IssueNode').default,
      conditionNode: require('@/components/workflow/ConditionNode').default,
    }),
    []
  );

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const agentDataString = event.dataTransfer.getData('agentData');

      if (!type) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      if (type === 'agent' && agentDataString) {
        try {
          const agentData = JSON.parse(agentDataString);
          const newNode = {
            id: `${agentData.id}-${Date.now()}`,
            type: 'agentNode',
            position,
            data: agentData,
          };
          setNodes((nds) => nds.concat(newNode));
        } catch (error) {
          console.error('Error parsing agent data:', error);
        }
      } else if (type === 'issue') {
        const newNode = {
          id: `issue-${Date.now()}`,
          type: 'issueNode',
          position,
          data: {
            issueNumber: 0,
            title: 'New Issue',
            state: 'open' as const,
            labels: [],
          },
        };
        setNodes((nds) => nds.concat(newNode));
      } else if (type === 'condition') {
        const newNode = {
          id: `condition-${Date.now()}`,
          type: 'conditionNode',
          position,
          data: {
            condition: 'status === "success"',
            description: 'Branch condition',
            trueLabel: 'True',
            falseLabel: 'False',
          },
        };
        setNodes((nds) => nds.concat(newNode));
      }
    },
    [setNodes]
  );

  const handleSave = async () => {
    const workflow = {
      name: workflowName,
      nodes,
      edges,
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow),
      });

      if (response.ok) {
        alert('Workflow saved successfully!');
      } else {
        alert('Failed to save workflow');
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Error saving workflow');
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the workflow?')) {
      setNodes([]);
      setEdges([]);
    }
  };

  const handleExecute = () => {
    alert('Workflow execution will be implemented in Phase 3');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Agent Palette */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Agent Palette</h2>
          <p className="text-sm text-gray-600 mt-1">
            Drag agents to the canvas to build your workflow
          </p>
        </div>
        <AgentPalette />
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-xl font-semibold border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              placeholder="Workflow Name"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="outline" onClick={handleSave}>
              Save
            </Button>
            <Button onClick={handleExecute}>
              Execute
            </Button>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* Status Bar */}
        <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>Nodes: {nodes.length}</span>
            <span>Edges: {edges.length}</span>
          </div>
          <div>
            <span className="text-blue-600 font-medium">Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}

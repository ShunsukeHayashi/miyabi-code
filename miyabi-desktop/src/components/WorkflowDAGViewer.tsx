import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { AgentMetadata, AVAILABLE_AGENTS } from "../lib/agent-api";
import { AgentIcon } from "./AgentIcon";

/**
 * Agent Node data structure
 */
interface AgentNodeData {
  agent: AgentMetadata;
  status: "idle" | "running" | "completed" | "failed";
  duration?: number;
}

/**
 * Custom Agent Node Component
 */
function AgentNode({ data }: { data: AgentNodeData }) {
  const { agent, status, duration } = data;

  const statusColors = {
    idle: "bg-gray-100 border-gray-300",
    running: "bg-blue-50 border-blue-400 animate-pulse",
    completed: "bg-green-50 border-green-400",
    failed: "bg-red-50 border-red-400",
  };

  const statusIcons = {
    idle: "○",
    running: "⏳",
    completed: "✓",
    failed: "✗",
  };

  return (
    <div
      className={`px-6 py-4 rounded-xl border-2 transition-all duration-200 ${statusColors[status]} min-w-[200px]`}
      style={{
        boxShadow: status === "running" ? "0 4px 12px rgba(59, 130, 246, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Status Indicator */}
      <div className="flex items-center justify-between mb-2">
        <AgentIcon
          agentType={agent.type}
          backgroundColor={agent.color}
          size={18}
        />
        <span className="text-xl">{statusIcons[status]}</span>
      </div>

      {/* Agent Name */}
      <div className="mb-1">
        <div className="text-sm font-light text-gray-900">
          {agent.characterName}
        </div>
        <div className="text-xs font-light text-gray-500">
          {agent.displayName}
        </div>
      </div>

      {/* Duration */}
      {duration && (
        <div className="text-xs font-light text-gray-400 mt-2">
          {(duration / 1000).toFixed(1)}s
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  agentNode: AgentNode,
};

/**
 * Sample workflow DAG data
 */
const createSampleWorkflow = () => {
  const coordinatorAgent = AVAILABLE_AGENTS.find((a) => a.type === "coordinator_agent")!;
  const codegenAgent = AVAILABLE_AGENTS.find((a) => a.type === "code_gen_agent")!;
  const reviewAgent = AVAILABLE_AGENTS.find((a) => a.type === "review_agent")!;
  const deploymentAgent = AVAILABLE_AGENTS.find((a) => a.type === "deployment_agent")!;
  const prAgent = AVAILABLE_AGENTS.find((a) => a.type === "pr_agent")!;

  const nodes: Node<AgentNodeData>[] = [
    {
      id: "coordinator",
      type: "agentNode",
      position: { x: 400, y: 50 },
      data: {
        agent: coordinatorAgent,
        status: "completed",
        duration: 2340,
      },
    },
    {
      id: "codegen-1",
      type: "agentNode",
      position: { x: 200, y: 200 },
      data: {
        agent: codegenAgent,
        status: "completed",
        duration: 45600,
      },
    },
    {
      id: "codegen-2",
      type: "agentNode",
      position: { x: 600, y: 200 },
      data: {
        agent: codegenAgent,
        status: "running",
      },
    },
    {
      id: "review",
      type: "agentNode",
      position: { x: 200, y: 350 },
      data: {
        agent: reviewAgent,
        status: "idle",
      },
    },
    {
      id: "pr",
      type: "agentNode",
      position: { x: 400, y: 500 },
      data: {
        agent: prAgent,
        status: "idle",
      },
    },
    {
      id: "deployment",
      type: "agentNode",
      position: { x: 400, y: 650 },
      data: {
        agent: deploymentAgent,
        status: "idle",
      },
    },
  ];

  const edges: Edge[] = [
    {
      id: "e-coordinator-codegen1",
      source: "coordinator",
      target: "codegen-1",
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: coordinatorAgent.color, strokeWidth: 2 },
    },
    {
      id: "e-coordinator-codegen2",
      source: "coordinator",
      target: "codegen-2",
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: coordinatorAgent.color, strokeWidth: 2 },
    },
    {
      id: "e-codegen1-review",
      source: "codegen-1",
      target: "review",
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: codegenAgent.color, strokeWidth: 2 },
    },
    {
      id: "e-review-pr",
      source: "review",
      target: "pr",
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: reviewAgent.color, strokeWidth: 2 },
    },
    {
      id: "e-codegen2-pr",
      source: "codegen-2",
      target: "pr",
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: codegenAgent.color, strokeWidth: 2 },
    },
    {
      id: "e-pr-deployment",
      source: "pr",
      target: "deployment",
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: prAgent.color, strokeWidth: 2 },
    },
  ];

  return { nodes, edges };
};

/**
 * Workflow DAG Viewer Component
 */
export function WorkflowDAGViewer() {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => createSampleWorkflow(), []);
  const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Delay ReactFlow rendering to avoid initialization race condition
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      // Remove undefined handles to avoid React Flow warnings
      const cleanParams: Partial<Connection> = { ...params };
      if (cleanParams.sourceHandle === undefined) delete cleanParams.sourceHandle;
      if (cleanParams.targetHandle === undefined) delete cleanParams.targetHandle;
      return setEdges((eds) => addEdge(cleanParams as Connection, eds));
    },
    [setEdges]
  );

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-light text-gray-900 mb-2">
            ワークフローDAG
          </h2>
          <p className="text-sm font-light text-gray-600 mb-4">
            エージェントの実行フローと依存関係をビジュアル化
          </p>

          {/* Usage Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-blue-900 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">使い方</span>
            </div>
            <div className="text-xs text-blue-800 space-y-1">
              <p>• <strong>ノードをドラッグ</strong>してレイアウトを調整できます</p>
              <p>• <strong>マウスホイール</strong>でズームイン/アウト</p>
              <p>• <strong>ノードをクリック</strong>すると詳細情報が表示されます（予定）</p>
              <p>• 右下の<strong>ミニマップ</strong>で全体を把握できます</p>
              <p>• <strong>色付きの丸</strong>は各エージェントの種類を表します</p>
            </div>
          </div>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 bg-gray-50">
        {isReady ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            {/* Controls (Zoom, Fit, etc.) */}
            <Controls className="bg-white rounded-lg shadow-lg border border-gray-200" />

            {/* MiniMap */}
            <MiniMap
              className="bg-white rounded-lg shadow-lg border border-gray-200"
              nodeColor={(node) => {
                const data = node.data as AgentNodeData;
                return data.agent.color;
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />

            {/* Background */}
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#d1d5db" />
          </ReactFlow>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 mx-auto border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
              <p className="text-sm font-light">Loading workflow...</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-6 text-xs font-light text-gray-500">
          <div className="flex items-center space-x-2">
            <span className="text-lg">○</span>
            <span>Idle</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">⏳</span>
            <span>Running</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg text-green-500">✓</span>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg text-red-500">✗</span>
            <span>Failed</span>
          </div>
          <div className="ml-auto flex items-center space-x-2 text-gray-400">
            <span>Drag to move • Scroll to zoom • Click node for details</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default WorkflowDAGViewer;

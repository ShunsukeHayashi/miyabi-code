import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ==================== Workflow Types ====================

export type WorkflowNodeStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export type WorkflowNodeType = 
  | 'task_analysis'
  | 'code_generation' 
  | 'code_review'
  | 'testing'
  | 'deployment'
  | 'documentation'
  | 'issue_management'
  | 'pr_management';

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  title: string;
  description?: string;
  status: WorkflowNodeStatus;
  agentId?: string;
  agentName?: string;
  issueNumber?: number;
  startedAt?: string;
  completedAt?: string;
  duration?: number; // in milliseconds
  dependencies: string[]; // node IDs that must complete before this node
  outputs: Record<string, any>; // results/artifacts from this node
  metadata: Record<string, any>;
  position: {
    x: number;
    y: number;
  };
}

export interface WorkflowEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition?: string; // optional condition for edge activation
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  issueNumber?: number;
  status: WorkflowNodeStatus;
  createdAt: string;
  updatedAt: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  currentActiveNodes: string[]; // currently executing node IDs
  metadata: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowNodeStatus;
  startedAt: string;
  completedAt?: string;
  triggerType: 'manual' | 'automatic' | 'scheduled';
  triggeredBy: string; // user or agent name
  results: Record<string, any>;
}

// ==================== Store State ====================

interface WorkflowState {
  workflows: Record<string, Workflow>;
  executions: Record<string, WorkflowExecution>;
  activeWorkflowId: string | null;
  selectedNodeId: string | null;
  isConnecting: boolean; // for UI edge creation mode
  connectionSource: string | null; // source node ID when creating edge
  realTimeUpdates: boolean;
  lastSyncTimestamp: string | null;
}

// ==================== Store Actions ====================

interface WorkflowActions {
  // Workflow Management
  createWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  duplicateWorkflow: (id: string) => string;
  setActiveWorkflow: (id: string | null) => void;
  
  // Node Management
  addNode: (workflowId: string, node: Omit<WorkflowNode, 'id'>) => string;
  updateNode: (workflowId: string, nodeId: string, updates: Partial<WorkflowNode>) => void;
  removeNode: (workflowId: string, nodeId: string) => void;
  updateNodePosition: (workflowId: string, nodeId: string, position: { x: number; y: number }) => void;
  updateNodeStatus: (workflowId: string, nodeId: string, status: WorkflowNodeStatus) => void;
  setSelectedNode: (nodeId: string | null) => void;
  
  // Edge Management
  addEdge: (workflowId: string, edge: Omit<WorkflowEdge, 'id'>) => string;
  removeEdge: (workflowId: string, edgeId: string) => void;
  startConnection: (sourceNodeId: string) => void;
  finishConnection: (targetNodeId: string) => void;
  cancelConnection: () => void;
  
  // Execution Management
  startExecution: (workflowId: string, triggerType: WorkflowExecution['triggerType'], triggeredBy: string) => string;
  updateExecution: (id: string, updates: Partial<WorkflowExecution>) => void;
  stopExecution: (id: string) => void;
  
  // Real-time Updates
  enableRealTimeUpdates: () => void;
  disableRealTimeUpdates: () => void;
  syncFromServer: () => Promise<void>;
  handleRealtimeEvent: (event: any) => void;
  
  // Utilities
  getWorkflowById: (id: string) => Workflow | undefined;
  getNodeById: (workflowId: string, nodeId: string) => WorkflowNode | undefined;
  getExecutableNodes: (workflowId: string) => WorkflowNode[];
  validateWorkflow: (workflow: Workflow) => { isValid: boolean; errors: string[] };
  exportWorkflow: (id: string) => string; // JSON export
  importWorkflow: (json: string) => string; // returns new workflow ID
  
  // Cleanup
  reset: () => void;
}

// ==================== Store Implementation ====================

const initialState: WorkflowState = {
  workflows: {},
  executions: {},
  activeWorkflowId: null,
  selectedNodeId: null,
  isConnecting: false,
  connectionSource: null,
  realTimeUpdates: false,
  lastSyncTimestamp: null,
};

export const useWorkflowStore = create<WorkflowState & WorkflowActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    // Workflow Management
    createWorkflow: (workflow) => {
      const id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const newWorkflow: Workflow = {
        ...workflow,
        id,
        createdAt: now,
        updatedAt: now,
        status: 'pending',
        currentActiveNodes: [],
      };
      
      set((state) => ({
        workflows: {
          ...state.workflows,
          [id]: newWorkflow,
        },
      }));
      
      return id;
    },
    
    updateWorkflow: (id, updates) => {
      set((state) => {
        const workflow = state.workflows[id];
        if (!workflow) return state;
        
        return {
          workflows: {
            ...state.workflows,
            [id]: {
              ...workflow,
              ...updates,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    },
    
    deleteWorkflow: (id) => {
      set((state) => {
        const { [id]: deleted, ...remaining } = state.workflows;
        return {
          workflows: remaining,
          activeWorkflowId: state.activeWorkflowId === id ? null : state.activeWorkflowId,
        };
      });
    },
    
    duplicateWorkflow: (id) => {
      const workflow = get().workflows[id];
      if (!workflow) return '';
      
      const newId = get().createWorkflow({
        ...workflow,
        name: `${workflow.name} (Copy)`,
        nodes: workflow.nodes.map(node => ({
          ...node,
          id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending',
          startedAt: undefined,
          completedAt: undefined,
          duration: undefined,
        })),
        edges: workflow.edges.map(edge => ({
          ...edge,
          id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        })),
      });
      
      return newId;
    },
    
    setActiveWorkflow: (id) => {
      set({ activeWorkflowId: id });
    },
    
    // Node Management
    addNode: (workflowId, node) => {
      const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newNode: WorkflowNode = {
        ...node,
        id: nodeId,
      };
      
      set((state) => {
        const workflow = state.workflows[workflowId];
        if (!workflow) return state;
        
        return {
          workflows: {
            ...state.workflows,
            [workflowId]: {
              ...workflow,
              nodes: [...workflow.nodes, newNode],
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
      
      return nodeId;
    },
    
    updateNode: (workflowId, nodeId, updates) => {
      set((state) => {
        const workflow = state.workflows[workflowId];
        if (!workflow) return state;
        
        const nodeIndex = workflow.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return state;
        
        const updatedNodes = [...workflow.nodes];
        updatedNodes[nodeIndex] = {
          ...updatedNodes[nodeIndex],
          ...updates,
        };
        
        return {
          workflows: {
            ...state.workflows,
            [workflowId]: {
              ...workflow,
              nodes: updatedNodes,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    },
    
    removeNode: (workflowId, nodeId) => {
      set((state) => {
        const workflow = state.workflows[workflowId];
        if (!workflow) return state;
        
        // Remove node and all connected edges
        const filteredNodes = workflow.nodes.filter(n => n.id !== nodeId);
        const filteredEdges = workflow.edges.filter(
          e => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId
        );
        
        return {
          workflows: {
            ...state.workflows,
            [workflowId]: {
              ...workflow,
              nodes: filteredNodes,
              edges: filteredEdges,
              currentActiveNodes: workflow.currentActiveNodes.filter(id => id !== nodeId),
              updatedAt: new Date().toISOString(),
            },
          },
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        };
      });
    },
    
    updateNodePosition: (workflowId, nodeId, position) => {
      get().updateNode(workflowId, nodeId, { position });
    },
    
    updateNodeStatus: (workflowId, nodeId, status) => {
      const now = new Date().toISOString();
      const updates: Partial<WorkflowNode> = { status };
      
      if (status === 'in_progress' && !get().getNodeById(workflowId, nodeId)?.startedAt) {
        updates.startedAt = now;
      } else if (['completed', 'failed', 'cancelled'].includes(status)) {
        const node = get().getNodeById(workflowId, nodeId);
        updates.completedAt = now;
        if (node?.startedAt) {
          updates.duration = new Date(now).getTime() - new Date(node.startedAt).getTime();
        }
      }
      
      get().updateNode(workflowId, nodeId, updates);
      
      // Update workflow current active nodes
      set((state) => {
        const workflow = state.workflows[workflowId];
        if (!workflow) return state;
        
        let currentActiveNodes = [...workflow.currentActiveNodes];
        
        if (status === 'in_progress' && !currentActiveNodes.includes(nodeId)) {
          currentActiveNodes.push(nodeId);
        } else if (['completed', 'failed', 'cancelled'].includes(status)) {
          currentActiveNodes = currentActiveNodes.filter(id => id !== nodeId);
        }
        
        return {
          workflows: {
            ...state.workflows,
            [workflowId]: {
              ...workflow,
              currentActiveNodes,
            },
          },
        };
      });
    },
    
    setSelectedNode: (nodeId) => {
      set({ selectedNodeId: nodeId });
    },
    
    // Edge Management
    addEdge: (workflowId, edge) => {
      const edgeId = `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newEdge: WorkflowEdge = {
        ...edge,
        id: edgeId,
      };
      
      set((state) => {
        const workflow = state.workflows[workflowId];
        if (!workflow) return state;
        
        // Check for duplicate edges
        const existingEdge = workflow.edges.find(
          e => e.sourceNodeId === edge.sourceNodeId && e.targetNodeId === edge.targetNodeId
        );
        if (existingEdge) return state;
        
        return {
          workflows: {
            ...state.workflows,
            [workflowId]: {
              ...workflow,
              edges: [...workflow.edges, newEdge],
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
      
      return edgeId;
    },
    
    removeEdge: (workflowId, edgeId) => {
      set((state) => {
        const workflow = state.workflows[workflowId];
        if (!workflow) return state;
        
        return {
          workflows: {
            ...state.workflows,
            [workflowId]: {
              ...workflow,
              edges: workflow.edges.filter(e => e.id !== edgeId),
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    },
    
    startConnection: (sourceNodeId) => {
      set({
        isConnecting: true,
        connectionSource: sourceNodeId,
      });
    },
    
    finishConnection: (targetNodeId) => {
      const { connectionSource, activeWorkflowId } = get();
      if (!connectionSource || !activeWorkflowId) return;
      
      get().addEdge(activeWorkflowId, {
        sourceNodeId: connectionSource,
        targetNodeId,
      });
      
      get().cancelConnection();
    },
    
    cancelConnection: () => {
      set({
        isConnecting: false,
        connectionSource: null,
      });
    },
    
    // Execution Management
    startExecution: (workflowId, triggerType, triggeredBy) => {
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const execution: WorkflowExecution = {
        id: executionId,
        workflowId,
        status: 'in_progress',
        startedAt: now,
        triggerType,
        triggeredBy,
        results: {},
      };
      
      set((state) => ({
        executions: {
          ...state.executions,
          [executionId]: execution,
        },
      }));
      
      // Update workflow status
      get().updateWorkflow(workflowId, { status: 'in_progress' });
      
      return executionId;
    },
    
    updateExecution: (id, updates) => {
      set((state) => {
        const execution = state.executions[id];
        if (!execution) return state;
        
        const updatedExecution = { ...execution, ...updates };
        
        if (['completed', 'failed', 'cancelled'].includes(updatedExecution.status) && !execution.completedAt) {
          updatedExecution.completedAt = new Date().toISOString();
        }
        
        return {
          executions: {
            ...state.executions,
            [id]: updatedExecution,
          },
        };
      });
    },
    
    stopExecution: (id) => {
      get().updateExecution(id, { status: 'cancelled' });
    },
    
    // Real-time Updates
    enableRealTimeUpdates: () => {
      set({ realTimeUpdates: true });
    },
    
    disableRealTimeUpdates: () => {
      set({ realTimeUpdates: false });
    },
    
    syncFromServer: async () => {
      // TODO: Implement server synchronization
      set({ lastSyncTimestamp: new Date().toISOString() });
    },
    
    handleRealtimeEvent: (event) => {
      // TODO: Handle real-time events from WebSocket/SSE
      console.log('Received real-time event:', event);
    },
    
    // Utilities
    getWorkflowById: (id) => {
      return get().workflows[id];
    },
    
    getNodeById: (workflowId, nodeId) => {
      const workflow = get().workflows[workflowId];
      return workflow?.nodes.find(n => n.id === nodeId);
    },
    
    getExecutableNodes: (workflowId) => {
      const workflow = get().workflows[workflowId];
      if (!workflow) return [];
      
      return workflow.nodes.filter(node => {
        // Node is executable if all dependencies are completed
        return node.dependencies.every(depId => {
          const depNode = workflow.nodes.find(n => n.id === depId);
          return depNode?.status === 'completed';
        });
      });
    },
    
    validateWorkflow: (workflow) => {
      const errors: string[] = [];
      
      // Check for circular dependencies
      const visited = new Set<string>();
      const visiting = new Set<string>();
      
      const hasCycle = (nodeId: string): boolean => {
        if (visiting.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;
        
        visiting.add(nodeId);
        
        const node = workflow.nodes.find(n => n.id === nodeId);
        if (node) {
          for (const depId of node.dependencies) {
            if (hasCycle(depId)) return true;
          }
        }
        
        visiting.delete(nodeId);
        visited.add(nodeId);
        return false;
      };
      
      for (const node of workflow.nodes) {
        if (hasCycle(node.id)) {
          errors.push(`Circular dependency detected involving node ${node.id}`);
          break;
        }
      }
      
      // Check for orphaned nodes (no incoming or outgoing edges)
      const connectedNodes = new Set<string>();
      workflow.edges.forEach(edge => {
        connectedNodes.add(edge.sourceNodeId);
        connectedNodes.add(edge.targetNodeId);
      });
      
      const orphanedNodes = workflow.nodes.filter(node => !connectedNodes.has(node.id));
      if (orphanedNodes.length > 1) {
        errors.push(`Multiple orphaned nodes detected: ${orphanedNodes.map(n => n.title).join(', ')}`);
      }
      
      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    
    exportWorkflow: (id) => {
      const workflow = get().workflows[id];
      if (!workflow) return '';
      
      return JSON.stringify(workflow, null, 2);
    },
    
    importWorkflow: (json) => {
      try {
        const workflow = JSON.parse(json) as Workflow;
        const newId = get().createWorkflow({
          name: workflow.name,
          description: workflow.description,
          issueNumber: workflow.issueNumber,
          nodes: workflow.nodes,
          edges: workflow.edges,
          metadata: workflow.metadata,
        });
        return newId;
      } catch (error) {
        console.error('Failed to import workflow:', error);
        return '';
      }
    },
    
    reset: () => {
      set(initialState);
    },
  }))
);

// ==================== Selector Hooks ====================

export const useActiveWorkflow = () => {
  return useWorkflowStore((state) => {
    const activeId = state.activeWorkflowId;
    return activeId ? state.workflows[activeId] : null;
  });
};

export const useWorkflowNodes = (workflowId: string | null) => {
  return useWorkflowStore((state) => {
    return workflowId ? state.workflows[workflowId]?.nodes || [] : [];
  });
};

export const useWorkflowEdges = (workflowId: string | null) => {
  return useWorkflowStore((state) => {
    return workflowId ? state.workflows[workflowId]?.edges || [] : [];
  });
};

export const useSelectedNode = () => {
  return useWorkflowStore((state) => {
    const selectedId = state.selectedNodeId;
    const activeWorkflowId = state.activeWorkflowId;
    
    if (!selectedId || !activeWorkflowId) return null;
    
    const workflow = state.workflows[activeWorkflowId];
    return workflow?.nodes.find(n => n.id === selectedId) || null;
  });
};

export const useWorkflowExecutions = (workflowId: string) => {
  return useWorkflowStore((state) => {
    return Object.values(state.executions).filter(exec => exec.workflowId === workflowId);
  });
};

// ==================== Default Workflow Templates ====================

export const createDefaultWorkflow = (issueNumber?: number): Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'> => {
  const baseNodes: Omit<WorkflowNode, 'id'>[] = [
    {
      type: 'task_analysis',
      title: 'Task Analysis',
      description: 'Analyze and decompose the task requirements',
      status: 'pending',
      dependencies: [],
      outputs: {},
      metadata: {},
      position: { x: 100, y: 100 },
    },
    {
      type: 'code_generation',
      title: 'Code Generation',
      description: 'Generate implementation code',
      status: 'pending',
      dependencies: [], // Will be set after node creation
      outputs: {},
      metadata: {},
      position: { x: 300, y: 100 },
    },
    {
      type: 'code_review',
      title: 'Code Review',
      description: 'Review generated code for quality and correctness',
      status: 'pending',
      dependencies: [], // Will be set after node creation
      outputs: {},
      metadata: {},
      position: { x: 500, y: 100 },
    },
    {
      type: 'testing',
      title: 'Testing',
      description: 'Run tests and validate implementation',
      status: 'pending',
      dependencies: [], // Will be set after node creation
      outputs: {},
      metadata: {},
      position: { x: 300, y: 250 },
    },
  ];
  
  return {
    name: issueNumber ? `Issue #${issueNumber} Workflow` : 'New Workflow',
    description: issueNumber ? `Automated workflow for Issue #${issueNumber}` : '',
    issueNumber,
    status: 'pending',
    nodes: baseNodes,
    edges: [],
    currentActiveNodes: [],
    metadata: {},
  };
};
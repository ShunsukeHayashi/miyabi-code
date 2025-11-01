/**
 * Funnel Builder Component (T030)
 *
 * Visual drag-and-drop funnel builder using react-flow.
 * Allows users to create marketing funnels by connecting pages together.
 */

import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { PageNode } from './PageNode';
import { PageNodeData } from './types';
import { Toolbar } from './Toolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { PageType, FunnelType } from '@/types';
import { api } from '@/lib/api';
import { useParams } from 'react-router-dom';

const nodeTypes: NodeTypes = {
  page: PageNode,
};

const initialNodes: Node<PageNodeData>[] = [];
const initialEdges: Edge[] = [];

export const FunnelBuilder: React.FC = () => {
  const { funnelId } = useParams<{ funnelId: string }>();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<PageNodeData> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load funnel and pages
  React.useEffect(() => {
    if (funnelId) {
      loadFunnel(funnelId);
    }
  }, [funnelId]);

  const loadFunnel = async (id: string) => {
    try {
      const funnel = await api.getFunnel(id);
      const pagesResponse = await api.getPages({ funnel_id: id });

      // Convert pages to nodes
      const loadedNodes: Node<PageNodeData>[] = pagesResponse.items.map((page, index) => ({
        id: page.id,
        type: 'page',
        position: { x: 250 * index, y: 100 },
        data: {
          id: page.id,
          name: page.name,
          title: page.title,
          pageType: page.page_type,
          status: page.status,
          conversions: page.total_conversions,
          visits: page.total_visits,
          conversionRate: page.conversion_rate,
        },
      }));

      setNodes(loadedNodes);
    } catch (error) {
      console.error('Failed to load funnel:', error);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<PageNodeData>) => {
      setSelectedNode(node);
    },
    []
  );

  const handleAddPage = useCallback(
    (pageType: PageType) => {
      const newNode: Node<PageNodeData> = {
        id: `page-${Date.now()}`,
        type: 'page',
        position: {
          x: Math.random() * 500,
          y: Math.random() * 300,
        },
        data: {
          id: '',
          name: `New ${pageType} Page`,
          title: `New ${pageType} Page`,
          pageType,
          status: 'Draft' as const,
          conversions: 0,
          visits: 0,
          conversionRate: 0,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  const handleDeletePage = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));

      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [setNodes, setEdges, selectedNode]
  );

  const handleUpdatePage = useCallback(
    (nodeId: string, updates: Partial<PageNodeData>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...updates,
              },
            };
          }
          return node;
        })
      );

      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) =>
          prev
            ? {
                ...prev,
                data: {
                  ...prev.data,
                  ...updates,
                },
              }
            : null
        );
      }
    },
    [setNodes, selectedNode]
  );

  const handleSaveFunnel = async () => {
    if (!funnelId) return;

    setIsSaving(true);
    try {
      // Save all pages
      for (const node of nodes) {
        const pageData = node.data;

        if (pageData.id) {
          // Update existing page
          await api.updatePage(pageData.id, {
            name: pageData.name,
            title: pageData.title,
            page_type: pageData.pageType,
            status: pageData.status,
          });
        } else {
          // Create new page
          const newPage = await api.createPage({
            funnel_id: funnelId,
            name: pageData.name,
            title: pageData.title,
            slug: pageData.name.toLowerCase().replace(/\s+/g, '-'),
            page_type: pageData.pageType,
          });

          // Update node with new page ID
          handleUpdatePage(node.id, { id: newPage.id });
        }
      }

      // TODO: Save edges/connections to database
      // This would require a new API endpoint for funnel flow configuration

      alert('Funnel saved successfully!');
    } catch (error) {
      console.error('Failed to save funnel:', error);
      alert('Failed to save funnel. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Toolbar
        onAddPage={handleAddPage}
        onSave={handleSaveFunnel}
        isSaving={isSaving}
      />

      <div className="flex-1 flex">
        <div className="flex-1 bg-gray-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {selectedNode && (
          <PropertiesPanel
            node={selectedNode}
            onUpdate={(updates) => handleUpdatePage(selectedNode.id, updates)}
            onDelete={() => handleDeletePage(selectedNode.id)}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
};

'use client';

import { useEffect, useRef, useState } from 'react';
import ForceGraph3D from '3d-force-graph';
import type { MiyabiGraphData, CrateNode, DAGMode } from '@/types/graph';

interface MiyabiViewerProps {
  data: MiyabiGraphData;
  dagMode?: DAGMode;
  onNodeClick?: (node: CrateNode) => void;
}

export default function MiyabiViewer({ data, dagMode = 'td', onNodeClick }: MiyabiViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    // Clear any existing graph
    if (graphRef.current) {
      graphRef.current._destructor();
    }

    // Create new graph
    const graph = ForceGraph3D()(containerRef.current)
      .graphData(data)
      .dagMode(dagMode)
      .dagLevelDistance(100)
      .backgroundColor('#0a0a0a')
      // Node configuration
      .nodeLabel((node: any) => {
        const n = node as CrateNode;
        return `
          <div style="background: rgba(0,0,0,0.8); padding: 8px; border-radius: 4px; font-family: monospace;">
            <div style="font-weight: bold; color: ${n.color};">${n.id}</div>
            <div style="color: #888; font-size: 12px; margin-top: 4px;">
              Category: ${n.group}<br/>
              Size: ${Math.round(Math.pow(10, n.val) * 100)} LOC<br/>
              Opacity: ${(n.opacity * 100).toFixed(0)}%
            </div>
          </div>
        `;
      })
      .nodeColor((node: any) => (node as CrateNode).color)
      .nodeOpacity((node: any) => (node as CrateNode).opacity)
      .nodeVal((node: any) => (node as CrateNode).val * 3) // Scale up for visibility
      .nodeResolution(16)
      // Link configuration
      .linkColor((link: any) => link.color || '#ffffff')
      .linkWidth((link: any) => link.width || 1)
      .linkOpacity(0.6)
      .linkDirectionalArrowLength(3.5)
      .linkDirectionalArrowRelPos(1)
      // Interaction
      .onNodeClick((node: any) => {
        if (onNodeClick) {
          onNodeClick(node as CrateNode);
        }
        // Focus camera on node
        const distance = 200;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
        graph.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          node,
          1000
        );
      })
      .onNodeHover((node: any) => {
        containerRef.current!.style.cursor = node ? 'pointer' : 'default';
      })
      // Performance
      .warmupTicks(100)
      .cooldownTicks(200)
      .cooldownTime(15000);

    graphRef.current = graph;
    setIsLoading(false);

    // Cleanup
    return () => {
      if (graphRef.current) {
        graphRef.current._destructor();
      }
    };
  }, [data, dagMode, onNodeClick]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-white text-xl">Loading molecular structure...</div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

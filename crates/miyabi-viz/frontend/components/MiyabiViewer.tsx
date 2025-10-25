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
      .nodeColor((node: any) => {
        const n = node as CrateNode;
        // Use category colors for better visibility
        const categoryColors: { [key: string]: string } = {
          'Core': '#FF6B6B',        // Red
          'Agent': '#4ECDC4',       // Cyan
          'Integration': '#45B7D1', // Light Blue
          'Infrastructure': '#96CEB4', // Green
          'Tool': '#FFEAA7',        // Yellow
          'Test': '#DFE6E9',        // Gray
          'Business': '#A29BFE',    // Purple
          'Other': '#636E72',       // Dark Gray
        };
        return categoryColors[n.group] || n.color;
      })
      .nodeOpacity((node: any) => {
        const n = node as CrateNode;
        // Use opacity to show code volatility (B-factor)
        // High B-factor = more opaque (more active)
        return Math.max(0.5, n.opacity);
      })
      .nodeVal((node: any) => (node as CrateNode).val * 5) // Larger nodes for visibility
      .nodeResolution(32) // Higher resolution for smoother spheres
      // Link configuration
      .linkColor((link: any) => {
        // Make links more visible with better colors
        const typeColors: { [key: string]: string } = {
          'Runtime': '#88CCFF',    // Light blue for runtime
          'Dev': '#666666',        // Dark gray for dev
          'Build': '#FFD700',      // Gold for build
        };
        return typeColors[link.type] || '#88CCFF';
      })
      .linkWidth((link: any) => (link.width || 1) * 1.5) // Thicker links
      .linkOpacity(0.4) // More transparent for less clutter
      .linkDirectionalArrowLength(6) // Larger arrows
      .linkDirectionalArrowRelPos(1)
      .linkDirectionalParticles(2) // Add particles for direction
      .linkDirectionalParticleWidth(2)
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

'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { MiyabiGraphData, CrateNode, DAGMode } from '@/types/graph';
import ControlPanel from '@/components/ControlPanel';
import InfoPanel from '@/components/InfoPanel';

// Dynamically import MiyabiViewer to avoid SSR issues with 3d-force-graph
const MiyabiViewer = dynamic(() => import('@/components/MiyabiViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="text-white text-xl">Loading 3D viewer...</div>
    </div>
  ),
});

export default function Home() {
  const [graphData, setGraphData] = useState<MiyabiGraphData | null>(null);
  const [dagMode, setDagMode] = useState<DAGMode>('td');
  const [selectedNode, setSelectedNode] = useState<CrateNode | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load graph data
  useEffect(() => {
    fetch('/api/structure')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load graph data');
        return res.json();
      })
      .then((data: MiyabiGraphData) => {
        setGraphData(data);
        // Initialize with all categories selected
        const categories = new Set(data.nodes.map((n) => n.group));
        setSelectedCategories(categories);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error loading graph:', err);
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    if (!graphData) return [];
    const cats = new Set(graphData.nodes.map((n) => n.group));
    return Array.from(cats).sort();
  }, [graphData]);

  // Filter graph data by selected categories
  const filteredData = useMemo(() => {
    if (!graphData) return null;

    const filteredNodes = graphData.nodes.filter((node) =>
      selectedCategories.has(node.group)
    );
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = graphData.links.filter(
      (link) => nodeIds.has(link.source) && nodeIds.has(link.target)
    );

    return {
      nodes: filteredNodes,
      links: filteredLinks,
    };
  }, [graphData, selectedCategories]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-white text-2xl mb-4">🧬 Loading Miyabi Molecular Structure...</div>
          <div className="text-gray-400">Parsing crate dependencies...</div>
        </div>
      </div>
    );
  }

  if (error || !graphData || !filteredData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">⚠️ Error</div>
          <div className="text-white mb-4">
            {error || 'Failed to load graph data'}
          </div>
          <div className="text-gray-400 text-sm">
            Make sure you have generated structure.json using:
            <pre className="mt-2 bg-gray-800 p-2 rounded">
              miyabi-viz generate --output public/structure.json
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gray-900">
      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <h1 className="text-white text-2xl font-bold text-center">
          🧬 Miyabi Molecular Visualization
        </h1>
        <p className="text-gray-400 text-sm text-center mt-1">
          {filteredData.nodes.length} crates · {filteredData.links.length} dependencies
        </p>
      </div>

      {/* 3D Viewer */}
      <MiyabiViewer
        data={filteredData}
        dagMode={dagMode}
        onNodeClick={setSelectedNode}
      />

      {/* Control Panel */}
      <ControlPanel
        dagMode={dagMode}
        onDagModeChange={setDagMode}
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
      />

      {/* Info Panel */}
      <InfoPanel
        selectedNode={selectedNode}
        onClose={() => setSelectedNode(null)}
      />

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-400 max-w-xs">
        <div className="font-bold text-white mb-2">💡 Controls</div>
        <ul className="space-y-1">
          <li>🖱️ <strong>Left-drag</strong>: Rotate camera</li>
          <li>🖱️ <strong>Right-drag</strong>: Pan camera</li>
          <li>🖱️ <strong>Scroll</strong>: Zoom in/out</li>
          <li>🖱️ <strong>Click node</strong>: View details</li>
        </ul>
      </div>
    </main>
  );
}

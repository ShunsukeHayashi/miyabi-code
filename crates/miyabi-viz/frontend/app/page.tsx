'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { MiyabiGraphData, ModuleGraphData, CrateNode, ModuleNode, DAGMode, ViewLevel } from '@/types/graph';
import ControlPanel, { type HighlightMode } from '@/components/ControlPanel';
import InfoPanel from '@/components/InfoPanel';
import StatsPanel from '@/components/StatsPanel';
import Breadcrumb from '@/components/Breadcrumb';

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
  // View level state
  const [currentLevel, setCurrentLevel] = useState<ViewLevel>('crate');
  const [currentCrateId, setCurrentCrateId] = useState<string | null>(null);

  // Crate level data
  const [graphData, setGraphData] = useState<MiyabiGraphData | null>(null);

  // Module level data
  const [moduleData, setModuleData] = useState<ModuleGraphData | null>(null);

  // Common state
  const [dagMode, setDagMode] = useState<DAGMode>('bu'); // Bottom-up: base layers at bottom
  const [selectedNode, setSelectedNode] = useState<CrateNode | ModuleNode | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [highlightMode, setHighlightMode] = useState<HighlightMode>('none');
  const [searchQuery, setSearchQuery] = useState<string>(''); // Initialize with empty string
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

  // Handle drill-down: Navigate from crate to module level
  const handleDrillDown = async (crateId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/structure/${crateId}/modules`);
      if (!response.ok) {
        throw new Error(`Failed to load module data: ${response.statusText}`);
      }

      const data: ModuleGraphData = await response.json();
      setModuleData(data);
      setCurrentCrateId(crateId);
      setCurrentLevel('module');

      // Initialize categories for modules
      const cats = new Set(data.nodes.map((n) => n.group));
      setSelectedCategories(cats);

      setIsLoading(false);
    } catch (err: any) {
      console.error('Error loading module data:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Handle navigation between levels
  const handleNavigate = (level: ViewLevel) => {
    if (level === 'crate') {
      setCurrentLevel('crate');
      setCurrentCrateId(null);
      setModuleData(null);
      setSelectedNode(null);
      setSearchQuery('');

      // Restore crate categories
      if (graphData) {
        const cats = new Set(graphData.nodes.map((n) => n.group));
        setSelectedCategories(cats);
      }
    }
  };

  // Get unique categories based on current level
  const categories = useMemo(() => {
    if (currentLevel === 'crate') {
      if (!graphData) return [];
      const cats = new Set(graphData.nodes.map((n) => n.group));
      return Array.from(cats).sort();
    } else {
      if (!moduleData) return [];
      const cats = new Set(moduleData.nodes.map((n) => n.group));
      return Array.from(cats).sort();
    }
  }, [graphData, moduleData, currentLevel]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!graphData) return null;

    const totalCrates = graphData.nodes.length;
    const totalDeps = graphData.links.length;

    // Calculate average LOC
    const totalLOC = graphData.nodes.reduce((sum, n) => sum + Math.round(Math.pow(10, n.val) * 100), 0);
    const avgLOC = Math.round(totalLOC / totalCrates);

    // Calculate average coverage
    const avgCoverage = graphData.nodes.reduce((sum, n) => sum + n.opacity, 0) / totalCrates;

    // Count God Crates (LOC > 5000)
    const godCrates = graphData.nodes.filter(n => Math.round(Math.pow(10, n.val) * 100) > 5000).length;

    // Count Unstable Hubs (opacity corresponds to B-factor, assuming high opacity = high B-factor)
    // Actually, in the current implementation, opacity = coverage, not B-factor
    // So we'll use a heuristic: larger nodes with low coverage might be unstable
    const unstableHubs = graphData.nodes.filter(n => n.val > 1.5 && n.opacity < 0.7).length;

    // Count Low Coverage (< 50%)
    const lowCoverage = graphData.nodes.filter(n => n.opacity < 0.5).length;

    return {
      totalCrates,
      totalDeps,
      avgLOC,
      avgCoverage: Math.round(avgCoverage * 100),
      godCrates,
      unstableHubs,
      lowCoverage,
      cyclicDeps: 0, // Would need cycle detection algorithm
    };
  }, [graphData]);

  // Filter graph data by selected categories and search query (level-aware)
  const filteredData = useMemo(() => {
    const sourceData = currentLevel === 'crate' ? graphData : moduleData;
    if (!sourceData) return null;

    let filteredNodes = sourceData.nodes.filter((node: any) =>
      selectedCategories.has(node.group)
    );

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter((node: any) =>
        node.id.toLowerCase().includes(query)
      );
    }

    const nodeIds = new Set(filteredNodes.map((n: any) => n.id));
    const filteredLinks = sourceData.links.filter(
      (link: any) => nodeIds.has(link.source) && nodeIds.has(link.target)
    );

    return {
      nodes: filteredNodes,
      links: filteredLinks,
    };
  }, [graphData, moduleData, currentLevel, selectedCategories, searchQuery]);

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

  // Handle node click with drill-down support
  const handleNodeClick = (node: any) => {
    setSelectedNode(node);

    // If clicking on a crate node in crate view, drill down to module view
    if (currentLevel === 'crate' && node && node.id) {
      handleDrillDown(node.id);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gray-900">
      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <h1 className="text-white text-2xl font-bold text-center">
          {currentLevel === 'crate' ? '🧬 Miyabi Molecular Visualization' : `📦 ${currentCrateId} - Module View`}
        </h1>
        <p className="text-gray-400 text-sm text-center mt-1">
          {currentLevel === 'crate'
            ? `${filteredData.nodes.length} crates · ${filteredData.links.length} dependencies`
            : `${filteredData.nodes.length} modules · ${filteredData.links.length} dependencies`
          }
        </p>
      </div>

      {/* Breadcrumb Navigation */}
      <Breadcrumb
        currentLevel={currentLevel}
        currentCrateId={currentCrateId}
        onNavigate={handleNavigate}
      />

      {/* 3D Viewer */}
      <MiyabiViewer
        data={filteredData}
        dagMode={dagMode}
        onNodeClick={handleNodeClick}
      />

      {/* Control Panel */}
      <ControlPanel
        dagMode={dagMode}
        onDagModeChange={setDagMode}
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        highlightMode={highlightMode}
        onHighlightModeChange={setHighlightMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Info Panel */}
      <InfoPanel
        selectedNode={selectedNode}
        onClose={() => setSelectedNode(null)}
      />

      {/* Stats Panel */}
      <StatsPanel stats={stats} />

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-400 max-w-xs">
        <div className="font-bold text-white mb-2">💡 Controls</div>
        <ul className="space-y-1">
          <li>🖱️ <strong>Left-drag</strong>: Rotate camera</li>
          <li>🖱️ <strong>Right-drag</strong>: Pan camera</li>
          <li>🖱️ <strong>Scroll</strong>: Zoom in/out</li>
          <li>🖱️ <strong>Click crate</strong>: {currentLevel === 'crate' ? 'Drill down to modules' : 'View details'}</li>
          {currentLevel === 'module' && (
            <li>🔙 <strong>Breadcrumb</strong>: Back to crate view</li>
          )}
        </ul>
      </div>
    </main>
  );
}

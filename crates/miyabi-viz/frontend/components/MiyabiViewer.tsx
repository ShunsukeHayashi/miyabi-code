'use client';

import { useEffect, useRef, useState } from 'react';
import ForceGraph3D from '3d-force-graph';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import type { MiyabiGraphData, CrateNode, DAGMode } from '@/types/graph';

interface MiyabiViewerProps {
  data: MiyabiGraphData;
  dagMode?: DAGMode;
  onNodeClick?: (node: CrateNode) => void;
}

export default function MiyabiViewer({ data, dagMode = 'bu', onNodeClick }: MiyabiViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    // Clear any existing graph
    if (graphRef.current) {
      graphRef.current._destructor();
    }

    // Helper function to get category color
    const getCategoryColor = (group: string): string => {
      const colors: { [key: string]: string } = {
        'Core': '#FF6B6B',
        'Agent': '#4ECDC4',
        'Integration': '#45B7D1',
        'Infrastructure': '#96CEB4',
        'Tool': '#FFEAA7',
        'Test': '#DFE6E9',
        'Business': '#A29BFE',
        'Other': '#636E72',
      };
      return colors[group] || '#636E72';
    };

    // Create new graph
    const graph = ForceGraph3D()(containerRef.current)
      .graphData(data)
      .dagMode(dagMode)
      .dagLevelDistance(200) // Increased from 100 to 200 for clearer separation
      .backgroundColor('#0d1117') // Slightly lighter for better contrast
      // Node configuration with custom Three.js objects
      .nodeThreeObject((node: any) => {
        const n = node as CrateNode;
        const group = new THREE.Group();

        // Create sphere for the node - LARGER SIZE
        const nodeSize = n.val * 7; // Increased from 5 to 7 for better visibility
        const geometry = new THREE.SphereGeometry(nodeSize, 32, 32);
        const material = new THREE.MeshLambertMaterial({
          color: getCategoryColor(n.group),
          transparent: true,
          opacity: Math.max(0.6, n.opacity), // Increased minimum opacity
        });
        const sphere = new THREE.Mesh(geometry, material);

        // Add subtle outline for better depth perception
        const outlineGeometry = new THREE.SphereGeometry(nodeSize * 1.05, 32, 32);
        const outlineMaterial = new THREE.MeshBasicMaterial({
          color: '#ffffff',
          transparent: true,
          opacity: 0.2,
          side: THREE.BackSide,
        });
        const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        group.add(outline);
        group.add(sphere);

        // Create text label for crate name - LARGER and more visible
        const nameLabel = new SpriteText(n.id);
        nameLabel.color = '#FFFFFF';
        nameLabel.textHeight = 14; // Increased from 12 to 14
        nameLabel.position.set(0, nodeSize + 22, 0); // Position above sphere
        nameLabel.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        nameLabel.padding = 5;
        nameLabel.borderRadius = 4;
        nameLabel.fontWeight = 'bold';
        group.add(nameLabel);

        // Create category label - with icon
        const categoryLabel = new SpriteText(`[${n.group}]`);
        categoryLabel.color = getCategoryColor(n.group);
        categoryLabel.textHeight = 8; // Increased from 7 to 8
        categoryLabel.position.set(0, nodeSize + 10, 0);
        categoryLabel.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        categoryLabel.padding = 3;
        categoryLabel.fontWeight = 'bold';
        group.add(categoryLabel);

        // Create LOC label
        const loc = Math.round(Math.pow(10, n.val) * 100);
        const locLabel = new SpriteText(`${loc.toLocaleString()} LOC`);
        locLabel.color = '#DDDDDD'; // Even brighter gray
        locLabel.textHeight = 7; // Increased from 6 to 7
        locLabel.position.set(0, -(nodeSize + 12), 0); // Position below sphere
        locLabel.backgroundColor = 'rgba(0, 0, 0, 0.75)';
        locLabel.padding = 3;
        group.add(locLabel);

        return group;
      })
      .nodeLabel((node: any) => {
        const n = node as CrateNode;
        return `
          <div style="background: rgba(0,0,0,0.8); padding: 8px; border-radius: 4px; font-family: monospace;">
            <div style="font-weight: bold; color: ${getCategoryColor(n.group)};">${n.id}</div>
            <div style="color: #888; font-size: 12px; margin-top: 4px;">
              Category: ${n.group}<br/>
              Size: ${Math.round(Math.pow(10, n.val) * 100)} LOC<br/>
              Opacity: ${(n.opacity * 100).toFixed(0)}%
            </div>
          </div>
        `;
      })
      // Link configuration - MORE VISIBLE
      .linkColor((link: any) => {
        // Make links more visible with better colors
        const typeColors: { [key: string]: string } = {
          'Runtime': '#00BFFF',    // Brighter blue for runtime dependencies
          'Dev': '#999999',        // Lighter gray for dev
          'Build': '#FFD700',      // Gold for build
        };
        return typeColors[link.type] || '#00BFFF';
      })
      .linkWidth((link: any) => (link.width || 1) * 2.5) // Much thicker links (1.5 → 2.5)
      .linkOpacity(0.6) // Less transparent (0.4 → 0.6)
      .linkDirectionalArrowLength(10) // Much larger arrows (6 → 10)
      .linkDirectionalArrowRelPos(1)
      .linkDirectionalParticles(4) // More particles for clearer direction (2 → 4)
      .linkDirectionalParticleWidth(3) // Wider particles (2 → 3)
      .linkDirectionalParticleSpeed(0.005) // Slower particles for visibility
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

    // Add enhanced lighting to the scene
    const scene = graph.scene();

    // Stronger ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Increased from 0.6
    scene.add(ambientLight);

    // Main directional light for depth
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Increased from 0.8
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);

    // Secondary directional light from opposite side
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6); // Increased from 0.4
    directionalLight2.position.set(-100, -100, -100);
    scene.add(directionalLight2);

    // Add hemisphere light for better overall visibility
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    scene.add(hemisphereLight);

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

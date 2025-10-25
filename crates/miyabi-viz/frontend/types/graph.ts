// Type definitions for Miyabi graph data

export interface CrateNode {
  id: string;
  val: number;        // Visual size (log scale)
  color: string;      // Hex color based on B-factor
  opacity: number;    // 0.0 to 1.0 based on test coverage
  group: string;      // Category name
}

export interface Dependency {
  source: string;
  target: string;
  type: string;       // "Runtime", "Dev", or "Build"
  color: string;      // Hex color for link
  width: number;      // Line width
}

export interface MiyabiGraphData {
  nodes: CrateNode[];
  links: Dependency[];
}

export type DAGMode = 'td' | 'bu' | 'lr' | 'rl' | 'radialout' | 'radialin' | null;

export type ColorScheme = 'bfactor' | 'category' | 'occupancy';

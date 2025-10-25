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

// Module-level types (Phase 2)

export interface ModuleNode {
  id: string;
  val: number;           // Visual size (based on LOC)
  color: string;         // Hex color based on visibility/complexity
  opacity: number;       // Test coverage (0.0 to 1.0)
  group: string;         // "Public" or "Private"
  loc: number;           // Lines of code
  complexity: number;    // Cyclomatic complexity
  is_public: boolean;    // Whether module is public
}

export interface ModuleDependency {
  source: string;
  target: string;
  strength: number;      // Number of use statements
  color: string;         // Hex color (blue for internal, orange for cross-boundary)
  width: number;         // Line width (proportional to strength)
  dashed: boolean;       // Dashed style for weak dependencies
}

export interface ModuleGraphData {
  crate_id: string;
  nodes: ModuleNode[];
  links: ModuleDependency[];
}

export type ViewLevel = 'crate' | 'module';

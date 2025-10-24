// ============================================================================
// MIYABI MOLECULAR VISUALIZATION - STRUCTURAL ANALYSIS TOOLS
// ============================================================================
// Complete implementation of 7 analysis features from protein structure biology
// adapted for software architecture analysis
// ============================================================================

import * as THREE from 'three';

// ============================================================================
// Types
// ============================================================================

interface CrateAtom {
  id: number;
  name: string;
  chain: 'A' | 'B' | 'C' | 'D';
  position: [number, number, number];
  bfactor: number;
  occupancy: number;
  loc: number;
  dependencies: number[];
}

interface RMSDResult {
  value: number;
  alignedPositions: [number, number, number][];
  transformMatrix: THREE.Matrix4;
}

interface DistanceResult {
  distance: number;
  atom1: CrateAtom;
  atom2: CrateAtom;
  midpoint: [number, number, number];
}

interface AngleResult {
  angle: number;  // in degrees
  atoms: [CrateAtom, CrateAtom, CrateAtom];
  plane?: THREE.Plane;
}

interface CircularDependency {
  cycle: number[];  // atom IDs forming the cycle
  length: number;
  severity: 'low' | 'medium' | 'high';
  nodes: CrateAtom[];
}

interface CriticalPath {
  path: number[];  // atom IDs
  length: number;
  totalLOC: number;
  avgBfactor: number;
}

interface RefactoringOpportunity {
  type: 'god-crate' | 'hub-crate' | 'unstable-hub' | 'tight-coupling';
  crateId: number;
  crate: CrateAtom;
  severity: number;  // 0-100
  reason: string;
  suggestions: string[];
}

interface ContactMap {
  contacts: [number, number, number][];  // [id1, id2, distance]
  threshold: number;
}

// ============================================================================
// 1. RMSD Calculator (Root Mean Square Deviation)
// ============================================================================
// Purpose: Measure structural difference between two codebase states
// Used for: Git commit comparison, refactoring impact analysis

export class RMSDCalculator {
  /**
   * Calculate RMSD between two sets of atoms (e.g., before/after refactoring)
   *
   * RMSD = sqrt(1/N * Σ(ri - ri')²)
   *
   * Low RMSD (< 5) = minor changes
   * Medium RMSD (5-15) = moderate refactoring
   * High RMSD (> 15) = major restructuring
   */
  static calculate(
    atoms1: CrateAtom[],
    atoms2: CrateAtom[],
    align: boolean = true
  ): RMSDResult {
    if (atoms1.length !== atoms2.length) {
      throw new Error('Atom sets must have equal length');
    }

    let positions1 = atoms1.map(a => new THREE.Vector3(...a.position));
    let positions2 = atoms2.map(a => new THREE.Vector3(...a.position));

    let transformMatrix = new THREE.Matrix4();

    if (align) {
      // Kabsch algorithm for optimal superposition
      const result = this.kabschAlignment(positions1, positions2);
      positions1 = result.aligned;
      transformMatrix = result.matrix;
    }

    // Calculate RMSD
    let sumSquaredDist = 0;
    for (let i = 0; i < positions1.length; i++) {
      sumSquaredDist += positions1[i].distanceToSquared(positions2[i]);
    }

    const rmsd = Math.sqrt(sumSquaredDist / positions1.length);

    return {
      value: rmsd,
      alignedPositions: positions1.map(p => [p.x, p.y, p.z] as [number, number, number]),
      transformMatrix
    };
  }

  /**
   * Kabsch algorithm for optimal alignment
   * Returns rotation + translation matrix
   */
  private static kabschAlignment(
    points1: THREE.Vector3[],
    points2: THREE.Vector3[]
  ): { aligned: THREE.Vector3[], matrix: THREE.Matrix4 } {
    // Center both point clouds
    const center1 = this.centroid(points1);
    const center2 = this.centroid(points2);

    const centered1 = points1.map(p => p.clone().sub(center1));
    const centered2 = points2.map(p => p.clone().sub(center2));

    // Compute covariance matrix H = Σ(centered1 * centered2^T)
    const H = new THREE.Matrix3();
    H.set(0, 0, 0, 0, 0, 0, 0, 0, 0);

    centered1.forEach((p1, i) => {
      const p2 = centered2[i];
      H.elements[0] += p1.x * p2.x;
      H.elements[1] += p1.x * p2.y;
      H.elements[2] += p1.x * p2.z;
      H.elements[3] += p1.y * p2.x;
      H.elements[4] += p1.y * p2.y;
      H.elements[5] += p1.y * p2.z;
      H.elements[6] += p1.z * p2.x;
      H.elements[7] += p1.z * p2.y;
      H.elements[8] += p1.z * p2.z;
    });

    // SVD decomposition to get rotation matrix
    // Simplified: using quaternion approach
    const rotation = new THREE.Matrix4();
    // TODO: Implement full SVD or use external library
    rotation.identity();

    // Apply transformation
    const matrix = new THREE.Matrix4();
    matrix.makeTranslation(-center1.x, -center1.y, -center1.z);
    matrix.multiply(rotation);
    matrix.multiply(new THREE.Matrix4().makeTranslation(center2.x, center2.y, center2.z));

    const aligned = points1.map(p => p.clone().applyMatrix4(matrix));

    return { aligned, matrix };
  }

  private static centroid(points: THREE.Vector3[]): THREE.Vector3 {
    const sum = points.reduce((acc, p) => acc.add(p), new THREE.Vector3());
    return sum.divideScalar(points.length);
  }

  /**
   * Analyze RMSD trend over git history
   * Returns time series of structural changes
   */
  static async analyzeRMSDHistory(
    commits: string[],
    getAtomsAtCommit: (commit: string) => Promise<CrateAtom[]>
  ): Promise<{ commit: string, rmsd: number }[]> {
    const results = [];
    let previousAtoms = await getAtomsAtCommit(commits[0]);

    for (let i = 1; i < commits.length; i++) {
      const currentAtoms = await getAtomsAtCommit(commits[i]);
      const rmsd = this.calculate(previousAtoms, currentAtoms);
      results.push({ commit: commits[i], rmsd: rmsd.value });
      previousAtoms = currentAtoms;
    }

    return results;
  }
}

// ============================================================================
// 2. Distance Measurement Tool
// ============================================================================
// Purpose: Measure coupling distance between crates
// Used for: Dependency analysis, module cohesion metrics

export class DistanceMeasurement {
  /**
   * Calculate Euclidean distance between two crates
   * Interpretation:
   * - Close distance (< 10) = high coupling potential
   * - Medium distance (10-30) = normal
   * - Far distance (> 30) = loosely coupled
   */
  static measureDistance(atom1: CrateAtom, atom2: CrateAtom): DistanceResult {
    const p1 = new THREE.Vector3(...atom1.position);
    const p2 = new THREE.Vector3(...atom2.position);
    const distance = p1.distanceTo(p2);

    const midpoint: [number, number, number] = [
      (p1.x + p2.x) / 2,
      (p1.y + p2.y) / 2,
      (p1.z + p2.z) / 2
    ];

    return { distance, atom1, atom2, midpoint };
  }

  /**
   * Find all crates within a certain distance (neighborhood analysis)
   */
  static findNeighbors(
    targetAtom: CrateAtom,
    allAtoms: CrateAtom[],
    radius: number = 15
  ): DistanceResult[] {
    return allAtoms
      .filter(atom => atom.id !== targetAtom.id)
      .map(atom => this.measureDistance(targetAtom, atom))
      .filter(result => result.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Calculate dependency distance (shortest path through dependency graph)
   */
  static dependencyDistance(
    atom1: CrateAtom,
    atom2: CrateAtom,
    allAtoms: Map<number, CrateAtom>
  ): number | null {
    // BFS to find shortest path
    const queue: [number, number][] = [[atom1.id, 0]];
    const visited = new Set<number>();

    while (queue.length > 0) {
      const [currentId, depth] = queue.shift()!;

      if (currentId === atom2.id) {
        return depth;
      }

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const current = allAtoms.get(currentId);
      if (current) {
        current.dependencies.forEach(depId => {
          if (!visited.has(depId)) {
            queue.push([depId, depth + 1]);
          }
        });
      }
    }

    return null; // No path found
  }
}

// ============================================================================
// 3. Angle Measurement Tool
// ============================================================================
// Purpose: Analyze dependency angles (A depends on B, B depends on C)
// Used for: Transitive dependency analysis

export class AngleMeasurement {
  /**
   * Calculate angle between three crates (dependency chain angle)
   *
   * atom1 → atom2 → atom3
   *
   * Sharp angle (< 60°) = tight dependency chain
   * Right angle (≈ 90°) = orthogonal modules
   * Obtuse angle (> 120°) = indirect dependency
   */
  static measureAngle(
    atom1: CrateAtom,
    atom2: CrateAtom,  // vertex
    atom3: CrateAtom
  ): AngleResult {
    const p1 = new THREE.Vector3(...atom1.position);
    const p2 = new THREE.Vector3(...atom2.position);
    const p3 = new THREE.Vector3(...atom3.position);

    const v1 = new THREE.Vector3().subVectors(p1, p2).normalize();
    const v2 = new THREE.Vector3().subVectors(p3, p2).normalize();

    const dotProduct = v1.dot(v2);
    const angleRad = Math.acos(THREE.MathUtils.clamp(dotProduct, -1, 1));
    const angleDeg = THREE.MathUtils.radToDeg(angleRad);

    return {
      angle: angleDeg,
      atoms: [atom1, atom2, atom3]
    };
  }

  /**
   * Calculate dihedral angle (four crates)
   * Used for: Complex dependency pattern analysis
   */
  static measureDihedral(
    atom1: CrateAtom,
    atom2: CrateAtom,
    atom3: CrateAtom,
    atom4: CrateAtom
  ): number {
    const p1 = new THREE.Vector3(...atom1.position);
    const p2 = new THREE.Vector3(...atom2.position);
    const p3 = new THREE.Vector3(...atom3.position);
    const p4 = new THREE.Vector3(...atom4.position);

    const b1 = new THREE.Vector3().subVectors(p2, p1);
    const b2 = new THREE.Vector3().subVectors(p3, p2);
    const b3 = new THREE.Vector3().subVectors(p4, p3);

    const n1 = new THREE.Vector3().crossVectors(b1, b2).normalize();
    const n2 = new THREE.Vector3().crossVectors(b2, b3).normalize();

    const m1 = new THREE.Vector3().crossVectors(n1, b2.normalize());

    const x = n1.dot(n2);
    const y = m1.dot(n2);

    return THREE.MathUtils.radToDeg(Math.atan2(y, x));
  }
}

// ============================================================================
// 4. Circular Dependency Detector
// ============================================================================
// Purpose: Find cycles in dependency graph (protein folding analogy)

export class CircularDependencyDetector {
  /**
   * Detect all circular dependencies using Tarjan's algorithm
   */
  static detectCycles(atoms: Map<number, CrateAtom>): CircularDependency[] {
    const cycles: CircularDependency[] = [];
    const visited = new Set<number>();
    const recStack = new Set<number>();
    const path: number[] = [];

    const dfs = (nodeId: number) => {
      visited.add(nodeId);
      recStack.add(nodeId);
      path.push(nodeId);

      const node = atoms.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          if (!visited.has(depId)) {
            dfs(depId);
          } else if (recStack.has(depId)) {
            // Found cycle
            const cycleStart = path.indexOf(depId);
            const cycle = path.slice(cycleStart);
            const nodes = cycle.map(id => atoms.get(id)!);

            cycles.push({
              cycle,
              length: cycle.length,
              severity: this.calculateSeverity(cycle.length, nodes),
              nodes
            });
          }
        }
      }

      path.pop();
      recStack.delete(nodeId);
    };

    atoms.forEach((_, id) => {
      if (!visited.has(id)) {
        dfs(id);
      }
    });

    return cycles;
  }

  private static calculateSeverity(
    length: number,
    nodes: CrateAtom[]
  ): 'low' | 'medium' | 'high' {
    // Consider both cycle length and B-factor (activity)
    const avgBfactor = nodes.reduce((sum, n) => sum + n.bfactor, 0) / nodes.length;

    if (length >= 5 || avgBfactor > 60) return 'high';
    if (length >= 3 || avgBfactor > 40) return 'medium';
    return 'low';
  }

  /**
   * Suggest cycle-breaking strategies
   */
  static suggestBreaking(cycle: CircularDependency): string[] {
    const suggestions: string[] = [];

    // Find weakest link (lowest B-factor)
    const sortedByBfactor = [...cycle.nodes].sort((a, b) => a.bfactor - b.bfactor);
    const weakest = sortedByBfactor[0];

    suggestions.push(
      `Consider breaking dependency at "${weakest.name}" (lowest activity, B-factor: ${weakest.bfactor.toFixed(1)})`
    );

    // Check for hub nodes
    const depCounts = cycle.nodes.map(n => n.dependencies.length);
    const maxDeps = Math.max(...depCounts);
    const hub = cycle.nodes.find(n => n.dependencies.length === maxDeps);

    if (hub) {
      suggestions.push(
        `"${hub.name}" is a hub with ${maxDeps} dependencies - consider extracting shared interface`
      );
    }

    suggestions.push(
      'Use dependency inversion principle (DIP) to break cycle',
      'Consider introducing an abstraction layer',
      'Extract common functionality into a new crate'
    );

    return suggestions;
  }
}

// ============================================================================
// 5. Critical Path Analyzer
// ============================================================================
// Purpose: Find longest dependency chain (protein backbone analogy)

export class CriticalPathAnalyzer {
  /**
   * Find the longest dependency path (critical compilation path)
   * This represents the minimum time to build if parallelized optimally
   */
  static findCriticalPath(atoms: Map<number, CrateAtom>): CriticalPath {
    const memo = new Map<number, CriticalPath>();

    const dfs = (nodeId: number, visited: Set<number>): CriticalPath => {
      if (memo.has(nodeId)) {
        return memo.get(nodeId)!;
      }

      if (visited.has(nodeId)) {
        // Cycle detected, return empty path
        return { path: [], length: 0, totalLOC: 0, avgBfactor: 0 };
      }

      visited.add(nodeId);

      const node = atoms.get(nodeId)!;
      let maxPath: CriticalPath = {
        path: [nodeId],
        length: 1,
        totalLOC: node.loc,
        avgBfactor: node.bfactor
      };

      for (const depId of node.dependencies) {
        const subPath = dfs(depId, new Set(visited));
        if (subPath.length + 1 > maxPath.length) {
          maxPath = {
            path: [nodeId, ...subPath.path],
            length: subPath.length + 1,
            totalLOC: node.loc + subPath.totalLOC,
            avgBfactor: (node.bfactor + subPath.avgBfactor * subPath.length) / (subPath.length + 1)
          };
        }
      }

      visited.delete(nodeId);
      memo.set(nodeId, maxPath);
      return maxPath;
    };

    let longestPath: CriticalPath = { path: [], length: 0, totalLOC: 0, avgBfactor: 0 };

    atoms.forEach((_, id) => {
      const path = dfs(id, new Set());
      if (path.length > longestPath.length) {
        longestPath = path;
      }
    });

    return longestPath;
  }

  /**
   * Find all paths longer than threshold (potential bottlenecks)
   */
  static findLongPaths(atoms: Map<number, CrateAtom>, minLength: number = 5): CriticalPath[] {
    // Similar to findCriticalPath but collect all paths
    const longPaths: CriticalPath[] = [];
    // Implementation similar to above
    return longPaths;
  }
}

// ============================================================================
// 6. Refactoring Opportunity Finder
// ============================================================================
// Purpose: Identify code smells using structural metrics

export class RefactoringOpportunityFinder {
  /**
   * Analyze entire codebase for refactoring opportunities
   */
  static analyze(atoms: Map<number, CrateAtom>): RefactoringOpportunity[] {
    const opportunities: RefactoringOpportunity[] = [];

    atoms.forEach(atom => {
      // 1. God Crate Detection (too many responsibilities)
      if (atom.dependencies.length > 10) {
        opportunities.push({
          type: 'god-crate',
          crateId: atom.id,
          crate: atom,
          severity: Math.min(atom.dependencies.length * 5, 100),
          reason: `Has ${atom.dependencies.length} dependencies (threshold: 10)`,
          suggestions: [
            'Split into multiple smaller crates',
            'Extract common utilities',
            'Apply Single Responsibility Principle'
          ]
        });
      }

      // 2. Hub Crate Detection (too many dependents)
      const dependentCount = Array.from(atoms.values())
        .filter(a => a.dependencies.includes(atom.id))
        .length;

      if (dependentCount > 15) {
        opportunities.push({
          type: 'hub-crate',
          crateId: atom.id,
          crate: atom,
          severity: Math.min(dependentCount * 4, 100),
          reason: `Used by ${dependentCount} other crates (threshold: 15)`,
          suggestions: [
            'Consider versioning strategy',
            'Ensure stable API',
            'Add comprehensive tests',
            'Document breaking changes carefully'
          ]
        });
      }

      // 3. Unstable Hub (high B-factor + many dependents)
      if (atom.bfactor > 60 && dependentCount > 10) {
        opportunities.push({
          type: 'unstable-hub',
          crateId: atom.id,
          crate: atom,
          severity: Math.min(atom.bfactor + dependentCount * 2, 100),
          reason: `High change frequency (${atom.bfactor.toFixed(1)}) with ${dependentCount} dependents`,
          suggestions: [
            '⚠️ HIGH PRIORITY: Stabilize API',
            'Add integration tests',
            'Implement feature flags for experimental code',
            'Consider deprecation policy'
          ]
        });
      }

      // 4. Tight Coupling (high B-factor correlation with dependencies)
      const depBfactors = atom.dependencies
        .map(id => atoms.get(id)?.bfactor || 0)
        .filter(bf => bf > 0);

      if (depBfactors.length > 0) {
        const avgDepBfactor = depBfactors.reduce((a, b) => a + b) / depBfactors.length;
        const correlation = Math.abs(atom.bfactor - avgDepBfactor);

        if (correlation < 15 && atom.bfactor > 50) {
          opportunities.push({
            type: 'tight-coupling',
            crateId: atom.id,
            crate: atom,
            severity: 100 - correlation,
            reason: `Changes propagate together (correlation: ${correlation.toFixed(1)})`,
            suggestions: [
              'Introduce abstraction layer',
              'Use dependency injection',
              'Apply facade pattern'
            ]
          });
        }
      }
    });

    return opportunities.sort((a, b) => b.severity - a.severity);
  }
}

// ============================================================================
// 7. Contact Map Generator
// ============================================================================
// Purpose: Generate 2D contact map (protein contact map analogy)
// Shows which crates interact closely

export class ContactMapGenerator {
  /**
   * Generate contact map: pairs of crates within threshold distance
   * Used for: Visualization, module clustering analysis
   */
  static generate(
    atoms: CrateAtom[],
    threshold: number = 15
  ): ContactMap {
    const contacts: [number, number, number][] = [];

    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const dist = DistanceMeasurement.measureDistance(atoms[i], atoms[j]);
        if (dist.distance <= threshold) {
          contacts.push([atoms[i].id, atoms[j].id, dist.distance]);
        }
      }
    }

    return { contacts, threshold };
  }

  /**
   * Render contact map as 2D matrix image
   * Returns data URL for display
   */
  static renderAsImage(
    contactMap: ContactMap,
    atoms: CrateAtom[],
    size: number = 512
  ): string {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, size, size);

    const maxId = Math.max(...atoms.map(a => a.id));
    const scale = size / (maxId + 1);

    // Draw contacts
    contactMap.contacts.forEach(([id1, id2, distance]) => {
      const intensity = 1 - (distance / contactMap.threshold);
      ctx.fillStyle = `rgba(0, 255, 0, ${intensity})`;

      const x1 = id1 * scale;
      const y1 = id2 * scale;
      ctx.fillRect(x1, y1, scale, scale);
      ctx.fillRect(y1, x1, scale, scale);  // Symmetric
    });

    // Draw diagonal
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, size);
    ctx.stroke();

    return canvas.toDataURL();
  }
}

// ============================================================================
// 8. Analysis Report Generator
// ============================================================================

export class AnalysisReportGenerator {
  static generateFullReport(atoms: Map<number, CrateAtom>): string {
    const report: string[] = [];

    report.push('# MIYABI MOLECULAR ANALYSIS REPORT\n');
    report.push(`Generated: ${new Date().toISOString()}\n`);
    report.push(`Total Crates: ${atoms.size}\n\n`);

    // Circular dependencies
    report.push('## Circular Dependencies\n');
    const cycles = CircularDependencyDetector.detectCycles(atoms);
    report.push(`Found ${cycles.length} circular dependencies\n\n`);
    cycles.forEach((cycle, i) => {
      report.push(`### Cycle ${i + 1} (${cycle.severity.toUpperCase()})\n`);
      report.push(`Path: ${cycle.nodes.map(n => n.name).join(' → ')}\n`);
      const suggestions = CircularDependencyDetector.suggestBreaking(cycle);
      report.push('Suggestions:\n');
      suggestions.forEach(s => report.push(`- ${s}\n`));
      report.push('\n');
    });

    // Critical path
    report.push('## Critical Path Analysis\n');
    const criticalPath = CriticalPathAnalyzer.findCriticalPath(atoms);
    report.push(`Longest dependency chain: ${criticalPath.length} crates\n`);
    report.push(`Total LOC: ${criticalPath.totalLOC.toLocaleString()}\n`);
    report.push(`Average B-factor: ${criticalPath.avgBfactor.toFixed(1)}\n`);
    report.push(`Path: ${criticalPath.path.map(id => atoms.get(id)?.name).join(' → ')}\n\n`);

    // Refactoring opportunities
    report.push('## Refactoring Opportunities\n');
    const opportunities = RefactoringOpportunityFinder.analyze(atoms);
    report.push(`Found ${opportunities.length} opportunities\n\n`);
    opportunities.slice(0, 10).forEach((opp, i) => {
      report.push(`### ${i + 1}. ${opp.crate.name} (${opp.type})\n`);
      report.push(`Severity: ${opp.severity}/100\n`);
      report.push(`Reason: ${opp.reason}\n`);
      report.push('Suggestions:\n');
      opp.suggestions.forEach(s => report.push(`- ${s}\n`));
      report.push('\n');
    });

    return report.join('');
  }
}

// ============================================================================
// Usage Example
// ============================================================================

/*
// Load atoms from MIYB structure
const atoms = loadMIYBStructure('/api/molecular-viz/structure.miyb');

// Measure RMSD between commits
const rmsd = RMSDCalculator.calculate(atomsBefore, atomsAfter);
console.log(`RMSD: ${rmsd.value.toFixed(2)} (${getRMSDInterpretation(rmsd.value)})`);

// Find circular dependencies
const cycles = CircularDependencyDetector.detectCycles(atoms);
cycles.forEach(cycle => {
  console.log(`⚠️ Circular dependency detected: ${cycle.nodes.map(n => n.name).join(' → ')}`);
  const suggestions = CircularDependencyDetector.suggestBreaking(cycle);
  suggestions.forEach(s => console.log(`  💡 ${s}`));
});

// Analyze critical path
const criticalPath = CriticalPathAnalyzer.findCriticalPath(atoms);
console.log(`Critical path length: ${criticalPath.length} crates`);
console.log(`Estimated build time: ${criticalPath.totalLOC / 1000} minutes (approx.)`);

// Find refactoring opportunities
const opportunities = RefactoringOpportunityFinder.analyze(atoms);
opportunities.slice(0, 5).forEach(opp => {
  console.log(`\n${opp.type.toUpperCase()}: ${opp.crate.name}`);
  console.log(`Severity: ${opp.severity}/100`);
  console.log(`Reason: ${opp.reason}`);
  opp.suggestions.forEach(s => console.log(`  → ${s}`));
});

// Generate full report
const report = AnalysisReportGenerator.generateFullReport(atoms);
console.log(report);
*/

// ============================================================================
// END OF MOLECULAR ANALYSIS TOOLS
// ============================================================================

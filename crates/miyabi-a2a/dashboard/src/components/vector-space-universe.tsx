import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Text, Line } from "@react-three/drei";
import * as THREE from "three";

// Task data type
interface Task {
  id: string;
  title: string;
  status: "pending" | "working" | "reviewing" | "completed" | "failed";
  priority: "P0" | "P1" | "P2" | "P3";
  estimatedMinutes: number;
  description: string;
  module: string; // "miyabi-agents", "miyabi-core", etc.
  layer: "ui" | "logic" | "data" | "infra";
  dependencies: string[]; // 🔗 DAG dependencies - task IDs this task depends on
}

// 3D coordinate type
interface Position3D {
  x: number;
  y: number;
  z: number;
}

// Task vector type
interface TaskVector {
  task: Task;
  position: Position3D;
  embedding: number[]; // Simple vector
  semanticLinks: {
    targetId: string;
    similarity: number;
  }[];
}

// 和色 (Traditional Japanese Colors) - Status colors
const STATUS_COLORS = {
  pending: "#165E83",   // 藍色 (Ai-iro - Indigo)
  working: "#00A381",   // 青緑 (Aoiro - Blue-green)
  reviewing: "#F8B500", // 山吹色 (Yamabuki - Golden yellow)
  completed: "#E6B422", // 金色 (Kin-iro - Gold)
  failed: "#C9171E",    // 紅色 (Beni-iro - Crimson)
};

// Status names in English
const STATUS_NAMES = {
  pending: "Pending",
  working: "Working",
  reviewing: "Reviewing",
  completed: "Completed",
  failed: "Failed",
};

// Priority-based size scale
const PRIORITY_SCALE = {
  P0: 1.5,
  P1: 1.2,
  P2: 1.0,
  P3: 0.8,
};

// Simple vector embedding (TF-IDF style)
function embedTask(task: Task, vocabulary: string[]): number[] {
  const text = `${task.title} ${task.description} ${task.module} ${task.layer}`.toLowerCase();
  const words = text.split(/\s+/);

  const vector = vocabulary.map(word => {
    const count = words.filter(w => w.includes(word)).length;
    return count > 0 ? 1 : 0;
  });

  // Normalization
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return vector.map(v => (magnitude > 0 ? v / magnitude : 0));
}

// Cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return magA > 0 && magB > 0 ? dotProduct / (magA * magB) : 0;
}

// 🧬 DAG-based 3D projection (Protein Ribbon Layout)
// Topological sort + Layer-based positioning
function projectTo3D(tasks: Task[]): TaskVector[] {
  // Extract vocabulary for embedding
  const vocabulary = Array.from(
    new Set(
      tasks.flatMap(t =>
        `${t.title} ${t.description}`.toLowerCase().split(/\s+/)
      )
    )
  ).slice(0, 50);

  const embeddings = tasks.map(t => embedTask(t, vocabulary));

  // 🔗 Build dependency graph
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const inDegree = new Map(tasks.map(t => [t.id, 0]));
  const adjList = new Map<string, string[]>(tasks.map(t => [t.id, []]));

  // Count in-degrees and build adjacency list
  tasks.forEach(task => {
    task.dependencies.forEach(depId => {
      if (taskMap.has(depId)) {
        adjList.get(depId)!.push(task.id);
        inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
      }
    });
  });

  // 🧬 Topological sort (Kahn's algorithm) to determine layer depth
  const layers: string[][] = [];
  const queue: string[] = [];
  const taskDepth = new Map<string, number>();

  // Initialize queue with start nodes (in-degree = 0)
  inDegree.forEach((degree, taskId) => {
    if (degree === 0) {
      queue.push(taskId);
      taskDepth.set(taskId, 0);
    }
  });

  while (queue.length > 0) {
    const currentLayer: string[] = [];
    const layerSize = queue.length;

    for (let i = 0; i < layerSize; i++) {
      const taskId = queue.shift()!;
      currentLayer.push(taskId);

      const neighbors = adjList.get(taskId) || [];
      neighbors.forEach(neighborId => {
        const newDegree = inDegree.get(neighborId)! - 1;
        inDegree.set(neighborId, newDegree);

        if (newDegree === 0) {
          queue.push(neighborId);
          taskDepth.set(neighborId, layers.length + 1);
        }
      });
    }

    layers.push(currentLayer);
  }

  // 🌌 Position tasks in 3D space based on DAG layers (Protein Ribbon Structure)
  const positions: Position3D[] = new Array(tasks.length);
  const maxDepth = layers.length;

  tasks.forEach((task, i) => {
    const depth = taskDepth.get(task.id) || 0;
    const layerTasks = layers[depth] || [];
    const indexInLayer = layerTasks.indexOf(task.id);
    const layerSize = layerTasks.length;

    // Z-axis: Depth (progression toward goal)
    const z = (depth / maxDepth) * 20 - 10; // -10 to 10 range

    // X-axis: Spread within layer (circular arrangement)
    const angle = (indexInLayer / layerSize) * Math.PI * 2;
    const radius = 6 + (layerSize * 0.5); // Dynamic radius based on layer size
    const x = Math.cos(angle) * radius;

    // Y-axis: Layer-based height + slight variation
    const layerY = {
      ui: 5,
      logic: 2,
      data: -2,
      infra: -5,
    }[task.layer];
    const y = layerY + (Math.random() - 0.5) * 2; // ±1 variation

    positions[i] = { x, y, z };
  });

  // 🧬 Calculate dependency links (replaces semantic links)
  return tasks.map((task, i) => {
    const dependencyLinks = task.dependencies
      .map(depId => {
        const depTask = tasks.find(t => t.id === depId);
        return depTask ? {
          targetId: depId,
          similarity: 1.0, // Full dependency strength
        } : null;
      })
      .filter((link): link is { targetId: string; similarity: number } => link !== null);

    return {
      task,
      position: positions[i],
      embedding: embeddings[i],
      semanticLinks: dependencyLinks, // Now represents DAG dependencies
    };
  });
}

// Convert task ID to kanji numbers (Bakemonogatari style)
function toKanjiNumber(id: string): string {
  const num = parseInt(id.replace(/\D/g, '')) || 0;
  const kanjiDigits = ['〇', '壱', '弐', '参', '肆', '伍', '陸', '漆', '捌', '玖'];
  const digits = num.toString().split('');
  return digits.map(d => kanjiDigits[parseInt(d)]).join('');
}

// Star component (Bakemonogatari style - Cut-in aesthetic)
function TaskStar({
  taskVector,
  relevance,
  onSelect
}: {
  taskVector: TaskVector;
  relevance: number;
  onSelect: () => void;
}) {
  const { task, position } = taskVector;

  // Size calculation (extra large)
  const baseSize = Math.log(task.estimatedMinutes + 1) * 0.3 + 1.5; // More than 2x scale
  const size = baseSize * PRIORITY_SCALE[task.priority];

  // Color
  const color = STATUS_COLORS[task.status];

  // Random rotation angle (fixed per task) - Dramatic 3D curvature
  const randomRotation = useMemo(() => [
    (Math.sin(parseInt(task.id.replace(/\D/g, '')) || 0) * 0.5), // 5x more dramatic
    (Math.cos(parseInt(task.id.replace(/\D/g, '')) || 0) * 0.5), // 5x more dramatic
    (Math.sin(parseInt(task.id.replace(/\D/g, '')) || 0) * 0.3) // Z rotation for depth
  ], [task.id]);

  // Kanji number for task ID
  const kanjiId = useMemo(() => toKanjiNumber(task.id), [task.id]);

  // 🌌 意味引力による光の選別（relevance が低い = 暗闇に消える）
  const opacity = relevance < 0.1 ? 0.0 : relevance; // 0.1以下は完全に消える
  const emissiveIntensity = relevance * 2.0; // 関連度に応じて発光

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={randomRotation as [number, number, number]}
      onClick={onSelect} // 🎯 クリックでゴール設定
    >
      {/* 🌠 反射光 - タスクが互いを照らし合う（意味引力の可視化） */}
      <pointLight
        position={[0, 0, 0]}
        color={color}
        intensity={relevance * 5.0} // 関連度に応じた光量
        distance={8}
        decay={2}
      />

      {/* 🎌 タスクIDラベル（シンプル） */}
      <Text
        font="/fonts/NotoSerifJP-Light.otf"
        position={[0, size * 1.5, 0]}
        fontSize={size * 0.5}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        fillOpacity={opacity}
      >
        {task.id.replace('task-', '#')}
      </Text>

      {/* 🎌 中央に大きな球体（タスクの核心・意味の惑星） */}
      <mesh>
        <sphereGeometry args={[size * 0.5, 32, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.08 * opacity} // 関連度に応じて透明化
          wireframe
          emissive={color}
          emissiveIntensity={emissiveIntensity * 0.5}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[size * 0.3, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.03 * opacity} // 関連度に応じて透明化
        />
      </mesh>

    </group>
  );
}

// 🧬 Bacteriorhodopsin-style Workflow Ribbons (DAG Dependency Visualization)
// Multiple workflow paths (α-helices) converging to goal (retinal binding site)
function WorkflowRibbons({
  taskVectors,
  goalTaskId,
  getRelevance
}: {
  taskVectors: TaskVector[];
  goalTaskId: string | null;
  getRelevance: (taskId: string) => number;
}) {
  const ribbons = useMemo(() => {
    const result: JSX.Element[] = [];

    // 🧬 Trace all workflow paths from start nodes to goal
    const startNodes = taskVectors.filter(tv => tv.task.dependencies.length === 0);
    const pathColors = [
      "#8B00FF", // Purple (BR-style)
      "#FF00FF", // Magenta
      "#00D9FF", // Cyan
      "#FFD700", // Gold
      "#00FF7F", // Spring Green
      "#FF1493", // Deep Pink
      "#00CED1", // Dark Turquoise
    ];

    // Build adjacency map for forward traversal
    const adjMap = new Map<string, string[]>();
    taskVectors.forEach(tv => {
      tv.task.dependencies.forEach(depId => {
        if (!adjMap.has(depId)) adjMap.set(depId, []);
        adjMap.get(depId)!.push(tv.task.id);
      });
    });

    // DFS to find all paths
    const allPaths: string[][] = [];
    function findPaths(currentId: string, path: string[], visited: Set<string>) {
      path.push(currentId);
      visited.add(currentId);

      const neighbors = adjMap.get(currentId) || [];
      if (neighbors.length === 0) {
        // Leaf node - save path
        allPaths.push([...path]);
      } else {
        neighbors.forEach(neighborId => {
          if (!visited.has(neighborId)) {
            findPaths(neighborId, path, new Set(visited));
          }
        });
      }

      path.pop();
    }

    startNodes.forEach(startNode => {
      findPaths(startNode.task.id, [], new Set());
    });

    // 🎨 Draw ribbons for each path
    allPaths.forEach((path, pathIndex) => {
      if (path.length < 2) return; // Need at least 2 nodes

      const pathColor = pathColors[pathIndex % pathColors.length];
      const points: [number, number, number][] = [];

      // Collect positions along the path
      path.forEach(taskId => {
        const tv = taskVectors.find(t => t.task.id === taskId);
        if (tv) {
          points.push([tv.position.x, tv.position.y, tv.position.z]);
        }
      });

      // 🌌 Relevance filtering
      const pathRelevance = path
        .map(taskId => getRelevance(taskId))
        .reduce((min, r) => Math.min(min, r), 1.0);

      if (pathRelevance < 0.1) return; // Hide irrelevant paths

      // Draw ribbon (tube-like structure)
      result.push(
        <Line
          key={`path-${pathIndex}`}
          points={points}
          color={pathColor}
          lineWidth={6 * pathRelevance}
          transparent
          opacity={0.7 * pathRelevance}
          dashed={false}
        />
      );

      // Add glow effect
      result.push(
        <Line
          key={`path-glow-${pathIndex}`}
          points={points}
          color={pathColor}
          lineWidth={12 * pathRelevance}
          transparent
          opacity={0.2 * pathRelevance}
          dashed={false}
        />
      );
    });

    return result;
  }, [taskVectors, goalTaskId, getRelevance]);

  return <group>{ribbons}</group>;
}

// 🧬 Individual Dependency Arrows (for fine-grained DAG visualization)
function DependencyArrows({
  taskVectors,
  goalTaskId,
  getRelevance
}: {
  taskVectors: TaskVector[];
  goalTaskId: string | null;
  getRelevance: (taskId: string) => number;
}) {
  const arrows = useMemo(() => {
    const result: JSX.Element[] = [];

    taskVectors.forEach((taskVector) => {
      taskVector.semanticLinks.forEach((link) => {
        const target = taskVectors.find((tv) => tv.task.id === link.targetId);
        if (!target) return;

        // 🌌 Relevance filtering
        const sourceRelevance = getRelevance(taskVector.task.id);
        const targetRelevance = getRelevance(target.task.id);
        const linkRelevance = Math.min(sourceRelevance, targetRelevance);

        if (linkRelevance < 0.1) return; // Hide irrelevant

        // Dependency arrow (from dependency to dependent)
        result.push(
          <Line
            key={`dep-${taskVector.task.id}-${link.targetId}`}
            points={[
              [target.position.x, target.position.y, target.position.z], // Dependency
              [taskVector.position.x, taskVector.position.y, taskVector.position.z], // Dependent
            ]}
            color="#60A5FA"
            lineWidth={3 * linkRelevance}
            transparent
            opacity={0.5 * linkRelevance}
            dashed
            dashScale={2}
            dashSize={0.3}
            gapSize={0.2}
          />
        );
      });
    });

    return result;
  }, [taskVectors, goalTaskId, getRelevance]);

  return <group>{arrows}</group>;
}

// Gravity field particles - Visualize force field around black hole
function GravityFieldParticles({ center, taskVectors }: { center: Position3D; taskVectors: TaskVector[] }) {
  const particleCount = 200;
  const particles = useMemo(() => {
    const result: JSX.Element[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Random direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 3 + Math.random() * 12; // 3-15 range

      // Spherical to Cartesian coordinates
      const x = center.x + radius * Math.sin(phi) * Math.cos(theta);
      const y = center.y + radius * Math.sin(phi) * Math.sin(theta);
      const z = center.z + radius * Math.cos(phi);

      // Color change by gravity (brighter closer to center)
      const distance = Math.sqrt(
        Math.pow(x - center.x, 2) +
        Math.pow(y - center.y, 2) +
        Math.pow(z - center.z, 2)
      );
      const intensity = Math.max(0.2, 1 - distance / 15);
      const color = `rgb(${Math.floor(138 * intensity)}, ${Math.floor(43 * intensity)}, ${Math.floor(226 * intensity)})`;

      result.push(
        <mesh key={`particle-${i}`} position={[x, y, z]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={intensity * 0.8}
          />
        </mesh>
      );
    }

    return result;
  }, [center, taskVectors]);

  return <group>{particles}</group>;
}

// Force vector lines - Visualize gravitational forces between tasks
function ForceVectors({ taskVectors, center }: { taskVectors: TaskVector[]; center: Position3D }) {
  const vectors = useMemo(() => {
    const result: JSX.Element[] = [];

    taskVectors.forEach((tv, index) => {
      // Gravitational vector toward center
      const dx = center.x - tv.position.x;
      const dy = center.y - tv.position.y;
      const dz = center.z - tv.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < 15) { // Within effective range only
        // Length based on force magnitude
        const forceMagnitude = 1 / (distance * distance);
        const vectorLength = Math.min(forceMagnitude * 20, 3);

        const endX = tv.position.x + (dx / distance) * vectorLength;
        const endY = tv.position.y + (dy / distance) * vectorLength;
        const endZ = tv.position.z + (dz / distance) * vectorLength;

        // Color based on force strength
        const opacity = Math.min(forceMagnitude * 2, 0.7);

        result.push(
          <Line
            key={`force-${index}`}
            points={[
              [tv.position.x, tv.position.y, tv.position.z],
              [endX, endY, endZ],
            ]}
            color="#FF00FF"
            lineWidth={2}
            transparent
            opacity={opacity}
          />
        );
      }
    });

    return result;
  }, [taskVectors, center]);

  return <group>{vectors}</group>;
}

// Energy wave rings - Force field radiating from center
function EnergyWaveRings({ center }: { center: Position3D }) {
  const rings = [3, 6, 9, 12, 15];

  return (
    <group position={[center.x, center.y, center.z]}>
      {rings.map((radius, i) => (
        <mesh key={`ring-${i}`} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.02, 16, 100]} />
          <meshBasicMaterial
            color="#8B00FF"
            transparent
            opacity={0.3 - i * 0.05}
            wireframe
          />
        </mesh>
      ))}
    </group>
  );
}

// Goal attractor - Represents project goal (target)
function GoalAttractor({ position }: { position: Position3D }) {
  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Outermost glow */}
      <mesh>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial
          color="#FFD700"
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Middle glow */}
      <mesh>
        <sphereGeometry args={[2.0, 32, 32]} />
        <meshBasicMaterial
          color="#FFA500"
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Core */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={3.0}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Goal label */}
      <Text
        font="/fonts/NotoSerifJP-Light.otf"
        position={[0, 2.5, 0]}
        fontSize={0.8}
        color="#FFD700"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.1}
        outlineColor="#000000"
      >
        GOAL
      </Text>
    </group>
  );
}

// Potential well - Visualize gravitational potential around goal
function PotentialWell({ center }: { center: Position3D }) {
  const gridSize = 20;
  const gridPoints = useMemo(() => {
    const points: JSX.Element[] = [];

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = center.x + (i - gridSize / 2) * 1.5;
        const z = center.z + (j - gridSize / 2) * 1.5;

        // Distance from goal
        const distance = Math.sqrt(
          Math.pow(x - center.x, 2) +
          Math.pow(z - center.z, 2)
        );

        // Potential well depth (lower closer to goal)
        const depth = Math.max(0, 1 / (distance + 1)) * 5;
        const y = center.y - depth;

        points.push(
          <mesh key={`grid-${i}-${j}`} position={[x, y, z]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial
              color="#00FFFF"
              transparent
              opacity={0.3}
            />
          </mesh>
        );
      }
    }

    return points;
  }, [center, gridSize]);

  return <group>{gridPoints}</group>;
}

// Goal force lines - Gravitational vectors from tasks to goal
function GoalForceLines({ taskVectors, goalPosition }: { taskVectors: TaskVector[]; goalPosition: Position3D }) {
  const lines = useMemo(() => {
    const result: JSX.Element[] = [];

    taskVectors.forEach((tv, index) => {
      const dx = goalPosition.x - tv.position.x;
      const dy = goalPosition.y - tv.position.y;
      const dz = goalPosition.z - tv.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Show force lines only for tasks close to goal
      if (distance < 20) {
        const opacity = Math.max(0.1, 1 - distance / 20);

        result.push(
          <Line
            key={`goal-force-${index}`}
            points={[
              [tv.position.x, tv.position.y, tv.position.z],
              [goalPosition.x, goalPosition.y, goalPosition.z],
            ]}
            color="#FFD700"
            lineWidth={1}
            transparent
            opacity={opacity * 0.5}
            dashed
            dashScale={2}
            dashSize={0.5}
            gapSize={0.5}
          />
        );
      }
    });

    return result;
  }, [taskVectors, goalPosition]);

  return <group>{lines}</group>;
}

// 🎌 模擬データ（DAG構造 - タンパク質リボン配列）
// GOAL (task-280) ← task-279, task-277 ← task-276, task-275 ← task-270, task-273
const MOCK_TASKS: Task[] = [
  // 🧬 Path 1: Auth Flow (task-270 → task-271 → task-274 → task-275 → GOAL)
  {
    id: "task-270",
    title: "Auth System",
    status: "completed",
    priority: "P0",
    estimatedMinutes: 30,
    description: "User auth JWT token session management",
    module: "Miyabi Agents",
    layer: "logic",
    dependencies: [], // Start node
  },
  {
    id: "task-271",
    title: "Login Screen",
    status: "completed",
    priority: "P1",
    estimatedMinutes: 15,
    description: "Login UI React component form",
    module: "Miyabi UI",
    layer: "ui",
    dependencies: ["task-270"], // Depends on Auth System
  },
  {
    id: "task-274",
    title: "API Implementation",
    status: "working",
    priority: "P1",
    estimatedMinutes: 40,
    description: "REST API endpoints auth middleware",
    module: "Miyabi Agents",
    layer: "logic",
    dependencies: ["task-271"], // Depends on Login Screen
  },
  {
    id: "task-275",
    title: "Security",
    status: "reviewing",
    priority: "P0",
    estimatedMinutes: 20,
    description: "Security vulnerability auth encryption",
    module: "Miyabi Core",
    layer: "logic",
    dependencies: ["task-274"], // Depends on API Implementation
  },

  // 🧬 Path 2: Data Flow (task-273 → task-277 → GOAL)
  {
    id: "task-273",
    title: "Database Design",
    status: "completed",
    priority: "P0",
    estimatedMinutes: 60,
    description: "Database schema PostgreSQL migration",
    module: "Miyabi Core",
    layer: "data",
    dependencies: [], // Start node
  },
  {
    id: "task-277",
    title: "Prototype",
    status: "working",
    priority: "P1",
    estimatedMinutes: 180,
    description: "MVP dev tech validation user test feedback collection",
    module: "Hayashi Shunsuke",
    layer: "logic",
    dependencies: ["task-273"], // Depends on Database Design
  },

  // 🧬 Path 3: Deployment Flow (task-276 → task-279 → GOAL)
  {
    id: "task-276",
    title: "Idea Generation",
    status: "completed",
    priority: "P0",
    estimatedMinutes: 120,
    description: "New business idea model market research concept design",
    module: "Hayashi Shunsuke",
    layer: "logic",
    dependencies: [], // Start node
  },
  {
    id: "task-279",
    title: "Code Review",
    status: "reviewing",
    priority: "P1",
    estimatedMinutes: 60,
    description: "Quality check refactoring best practices",
    module: "Hayashi Shunsuke",
    layer: "logic",
    dependencies: ["task-276"], // Depends on Idea Generation
  },

  // 🧬 Independent Path (task-272 → task-278 → GOAL)
  {
    id: "task-272",
    title: "Deploy Automation",
    status: "completed",
    priority: "P2",
    estimatedMinutes: 45,
    description: "CI/CD pipeline Docker Kubernetes deploy",
    module: "Miyabi Infra",
    layer: "infra",
    dependencies: [], // Start node
  },
  {
    id: "task-278",
    title: "Documentation",
    status: "working",
    priority: "P2",
    estimatedMinutes: 90,
    description: "Tech blog tutorial README design docs",
    module: "Hayashi Shunsuke",
    layer: "data",
    dependencies: ["task-272"], // Depends on Deploy Automation
  },

  // 🎯 GOAL - All paths converge here
  {
    id: "task-280",
    title: "GOAL",
    status: "pending",
    priority: "P0",
    estimatedMinutes: 0,
    description: "Project completion convergence point",
    module: "Hayashi Shunsuke",
    layer: "logic",
    dependencies: ["task-275", "task-277", "task-279", "task-278"], // Converges from 4 paths
  },
];

// Hayashi Shunsuke Hole (Black Hole) = Goal (target) center
function HayashiBlackHole({ position }: { position: Position3D }) {
  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Goal outermost glow (golden) */}
      <mesh>
        <sphereGeometry args={[3.0, 32, 32]} />
        <meshBasicMaterial
          color="#FFD700"
          transparent
          opacity={0.08}
        />
      </mesh>

      {/* Event Horizon - Outer glowing ring */}
      <mesh>
        <torusGeometry args={[2.0, 0.15, 16, 100]} />
        <meshStandardMaterial
          color="#8B00FF"
          emissive="#8B00FF"
          emissiveIntensity={2.5}
        />
      </mesh>

      {/* Accretion Disk - Middle ring */}
      <mesh rotation={[Math.PI / 6, 0, 0]}>
        <torusGeometry args={[1.6, 0.08, 16, 100]} />
        <meshStandardMaterial
          color="#FF00FF"
          emissive="#FF00FF"
          emissiveIntensity={2.0}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Goal core (golden glowing sphere) */}
      <mesh>
        <sphereGeometry args={[1.0, 32, 32]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={3.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Black hole core - Dark nucleus */}
      <mesh>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#000000"
          emissiveIntensity={0}
        />
      </mesh>

      {/* Inner purple aura */}
      <mesh>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshStandardMaterial
          color="#4B0082"
          emissive="#4B0082"
          emissiveIntensity={1.2}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Shunsuke Potential force field visual representation */}
      <mesh>
        <sphereGeometry args={[2.8, 32, 32]} />
        <meshStandardMaterial
          color="#8B00FF"
          emissive="#8B00FF"
          emissiveIntensity={0.5}
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>

      {/* 🎌 ゴールラベル（統合） */}
      <Text
        font="/fonts/NotoSerifJP-Light.otf"
        position={[0, 3.5, 0]}
        fontSize={1.0}
        color="#FFD700"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.15}
        outlineColor="#000000"
        letterSpacing={0.15}
      >
        目標
      </Text>

      {/* 🎌 副題 */}
      <Text
        font="/fonts/NotoSerifJP-Light.otf"
        position={[0, 2.8, 0]}
        fontSize={0.4}
        color="#FF00FF"
        anchorX="center"
        anchorY="top"
        outlineWidth={0.05}
        outlineColor="#000000"
        letterSpacing={0.12}
      >
        林潜在核心
      </Text>
    </group>
  );
}

// Cluster label component
function ClusterLabels({ taskVectors }: { taskVectors: TaskVector[] }) {
  const clusterCenters = useMemo(() => {
    const clusters = new Map<string, Position3D[]>();

    // Collect task positions for each module
    taskVectors.forEach(tv => {
      if (!clusters.has(tv.task.module)) {
        clusters.set(tv.task.module, []);
      }
      clusters.get(tv.task.module)!.push(tv.position);
    });

    // Calculate center of each cluster
    const centers = new Map<string, Position3D>();
    clusters.forEach((positions, module) => {
      const center = {
        x: positions.reduce((sum, p) => sum + p.x, 0) / positions.length,
        y: positions.reduce((sum, p) => sum + p.y, 0) / positions.length + 1.5, // Positioned slightly above
        z: positions.reduce((sum, p) => sum + p.z, 0) / positions.length,
      };
      centers.set(module, center);
    });

    return centers;
  }, [taskVectors]);

  return (
    <group>
      {Array.from(clusterCenters.entries()).map(([module, center]) => (
        <Text
        font="/fonts/NotoSerifJP-Light.otf"
          key={module}
          position={[center.x, center.y, center.z]}
          fontSize={0.5}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {module}
        </Text>
      ))}
    </group>
  );
}

// 🔗 DAG API Response Types
interface DagNodeAPI {
  id: string;
  label: string;
  status: string;
  agent: string;
  agentType: string;
  // 🧬 Extended fields (Phase 2-3: Full Parameter Mapping)
  priority: string; // "P0" | "P1" | "P2" | "P3"
  estimatedMinutes: number;
  description: string;
  module: string;
  layer: string; // "ui" | "logic" | "data" | "infra"
}

interface DagEdgeAPI {
  from: string;
  to: string;
  type: string;
}

interface DagDataAPI {
  workflowId: string;
  nodes: DagNodeAPI[];
  edges: DagEdgeAPI[];
}

// 🔄 Convert DAG API response to Task array with dependencies
function convertDagToTasks(dagData: DagDataAPI): Task[] {
  // Build dependency map: taskId -> [dependentIds]
  const dependentsMap = new Map<string, string[]>();
  dagData.edges.forEach(edge => {
    if (!dependentsMap.has(edge.from)) {
      dependentsMap.set(edge.from, []);
    }
    dependentsMap.get(edge.from)!.push(edge.to);
  });

  // Convert nodes to tasks
  return dagData.nodes.map((node, index) => {
    // Find dependencies (reverse of dependents - nodes that this node depends on)
    const dependencies = dagData.edges
      .filter(edge => edge.to === node.id)
      .map(edge => edge.from);

    // 🧬 Map status (from API)
    const statusMap: Record<string, Task["status"]> = {
      pending: "pending",
      working: "working",
      reviewing: "reviewing",
      completed: "completed",
      failed: "failed",
    };

    // 🧬 Use values directly from API (already processed by Rust backend)
    return {
      id: node.id,
      title: node.label,
      status: statusMap[node.status] || "pending",
      priority: node.priority as Task["priority"], // P0-P3 from API
      estimatedMinutes: node.estimatedMinutes, // From API
      description: node.description, // From API
      module: node.module, // From API
      layer: node.layer as Task["layer"], // ui/logic/data/infra from API
      dependencies,
    };
  });
}

// Main component
export function VectorSpaceUniverse() {
  // 🎯 ゴール選択状態（意味引力のフォーカス）
  const [goalTaskId, setGoalTaskId] = React.useState<string | null>(null);

  // 🔗 Real DAG data from API
  const [realTasks, setRealTasks] = React.useState<Task[] | null>(null);
  const [isLoadingDag, setIsLoadingDag] = React.useState(true);

  // Fetch real DAG data from API
  React.useEffect(() => {
    const fetchDagData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
        const response = await fetch(`${apiUrl}/api/workflow/dag`);

        if (!response.ok) {
          throw new Error(`Failed to fetch DAG: ${response.statusText}`);
        }

        const dagData: DagDataAPI = await response.json();
        console.log("📥 Fetched DAG data:", dagData);

        // Convert to Task array
        const tasks = convertDagToTasks(dagData);
        console.log("🔄 Converted to tasks:", tasks);

        setRealTasks(tasks);
      } catch (error) {
        console.error("❌ Failed to fetch DAG data, using mock data:", error);
        // Fallback to mock data
        setRealTasks(null);
      } finally {
        setIsLoadingDag(false);
      }
    };

    fetchDagData();
  }, []);

  // Use real tasks if available, otherwise fallback to mock
  const tasksToUse = realTasks !== null && realTasks.length > 0 ? realTasks : MOCK_TASKS;
  const taskVectors = useMemo(() => projectTo3D(tasksToUse), [tasksToUse]);

  // 🎯 GOAL auto-detection (最も多くのタスクに依存されているノード = convergence point)
  const goalTaskIdAuto = useMemo(() => {
    // Count how many tasks depend on each task
    const dependencyCount = new Map<string, number>();

    tasksToUse.forEach(task => {
      task.dependencies.forEach(depId => {
        dependencyCount.set(depId, (dependencyCount.get(depId) || 0) + 1);
      });
    });

    // Find task with zero dependencies (leaf nodes)
    const leafTasks = tasksToUse.filter(t => t.dependencies.length === 0);

    // If there's a single leaf task, it's the GOAL
    if (leafTasks.length === 1) {
      return leafTasks[0].id;
    }

    // Otherwise, find task with most dependents (convergence point)
    let maxCount = 0;
    let goalId = null;

    dependencyCount.forEach((count, taskId) => {
      if (count > maxCount) {
        maxCount = count;
        goalId = taskId;
      }
    });

    // Fallback: last task in list
    return goalId || tasksToUse[tasksToUse.length - 1]?.id || "task-280";
  }, [tasksToUse]);

  // 🎯 GOAL position
  const hayashiBlackHolePosition = useMemo(() => {
    const goalTask = taskVectors.find(tv => tv.task.id === goalTaskIdAuto);
    if (goalTask) {
      return goalTask.position;
    }

    // Fallback: center position (forward in Z)
    return { x: 0, y: 2, z: 10 };
  }, [taskVectors, goalTaskIdAuto]);

  // 🌌 DAGパスベースのゴール関連度計算（依存チェーンに基づく可視性）
  const getRelevanceToGoal = React.useCallback((taskId: string): number => {
    if (!goalTaskId) return 1.0; // ゴール未設定時は全て見える
    if (taskId === goalTaskId) return 1.0; // ゴール自体は最大輝度

    // BFS to check if there's a path from task to goal through dependencies
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: taskId, depth: 0 }];
    visited.add(taskId);

    // Build adjacency map (forward direction: dependency -> dependent)
    const adjMap = new Map<string, string[]>();
    taskVectors.forEach(tv => {
      tv.task.dependencies.forEach(depId => {
        if (!adjMap.has(depId)) adjMap.set(depId, []);
        adjMap.get(depId)!.push(tv.task.id);
      });
    });

    while (queue.length > 0) {
      const { id: currentId, depth } = queue.shift()!;

      // Found path to goal
      if (currentId === goalTaskId) {
        // Relevance decreases with distance (max 5 hops)
        return Math.max(0.3, 1.0 - (depth * 0.15));
      }

      // Explore neighbors (tasks that depend on current task)
      const neighbors = adjMap.get(currentId) || [];
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId) && depth < 10) {
          visited.add(neighborId);
          queue.push({ id: neighborId, depth: depth + 1 });
        }
      });
    }

    // No path found - check reverse direction (goal -> task)
    const reverseVisited = new Set<string>();
    const reverseQueue: Array<{ id: string; depth: number }> = [{ id: goalTaskId, depth: 0 }];
    reverseVisited.add(goalTaskId);

    // Build reverse adjacency map (dependent -> dependency)
    const reverseAdjMap = new Map<string, string[]>();
    taskVectors.forEach(tv => {
      tv.task.dependencies.forEach(depId => {
        if (!reverseAdjMap.has(tv.task.id)) reverseAdjMap.set(tv.task.id, []);
        reverseAdjMap.get(tv.task.id)!.push(depId);
      });
    });

    while (reverseQueue.length > 0) {
      const { id: currentId, depth } = reverseQueue.shift()!;

      if (currentId === taskId) {
        // Found path from goal to task (upstream dependency)
        return Math.max(0.3, 1.0 - (depth * 0.15));
      }

      const neighbors = reverseAdjMap.get(currentId) || [];
      neighbors.forEach(neighborId => {
        if (!reverseVisited.has(neighborId) && depth < 10) {
          reverseVisited.add(neighborId);
          reverseQueue.push({ id: neighborId, depth: depth + 1 });
        }
      });
    }

    // No path in either direction - hide this task
    return 0.0;
  }, [goalTaskId, taskVectors]);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {/* 🎌 和風背景アクセントストライプ（和色グラデーション） */}
      <div className="absolute inset-0 opacity-12">
        <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-[#884898]/30 to-transparent"></div> {/* 紫 */}
        <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-[#165E83]/30 to-transparent"></div> {/* 藍色 */}
        <div className="absolute left-0 top-0 w-1/4 h-full bg-gradient-to-r from-[#C9171E]/20 to-transparent"></div> {/* 紅色 */}
        <div className="absolute right-0 top-0 w-1/4 h-full bg-gradient-to-l from-[#E6B422]/15 to-transparent"></div> {/* 金色 */}
      </div>

      <Canvas camera={{ position: [20, 10, 20], fov: 70 }}>
        {/* Background starfield (reduced for flatter look) */}
        <Stars radius={100} depth={50} count={5000} factor={3} fade speed={0.5} />

        {/* Lights (enhanced for flat aesthetic) */}
        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 10, 10]} intensity={2.5} color="#FFFFFF" />
        <directionalLight position={[-10, -10, -10]} intensity={1.5} color="#8B00FF" />
        <pointLight position={[0, 20, 0]} intensity={2.0} color="#FFFFFF" />
        <pointLight position={[0, -20, 0]} intensity={1.5} color="#8B00FF" />

        {/* Task stars - Using physics simulation positions */}
        {taskVectors.map((taskVector) => (
          <TaskStar
            key={taskVector.task.id}
            taskVector={taskVector}
            relevance={getRelevanceToGoal(taskVector.task.id)}
            onSelect={() => {
              // 🎯 ゴール設定（同じタスククリックでリセット）
              setGoalTaskId(prev => prev === taskVector.task.id ? null : taskVector.task.id);
            }}
          />
        ))}

        {/* Goal (Simple version) */}
        <HayashiBlackHole position={hayashiBlackHolePosition} />

        {/* 🧬 Bacteriorhodopsin-style Workflow Ribbons - Multiple paths converging to goal */}
        <WorkflowRibbons
          taskVectors={taskVectors}
          goalTaskId={goalTaskId}
          getRelevance={getRelevanceToGoal}
        />

        {/* 🔗 Individual Dependency Arrows - Fine-grained DAG */}
        <DependencyArrows
          taskVectors={taskVectors}
          goalTaskId={goalTaskId}
          getRelevance={getRelevanceToGoal}
        />

        {/* Camera controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={50}
        />
      </Canvas>

      {/* 🎯 Goal Selection - Semantic Gravity Focus */}
      <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-lg px-6 py-4 border-t-4 border-[#FFD700] shadow-2xl" style={{ fontFamily: 'serif' }}>
        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-400 tracking-widest mb-1 border-b border-gray-700 pb-1" style={{ fontFamily: 'serif', letterSpacing: '0.2em', fontWeight: 300 }}>
            Semantic Gravity
          </div>

          {/* Data Source Indicator */}
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
            <div className={`w-2 h-2 rounded-full ${realTasks !== null && realTasks.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <div className="text-xs text-gray-400" style={{ fontFamily: 'serif', fontWeight: 300 }}>
              {isLoadingDag ? "Loading..." : realTasks !== null && realTasks.length > 0 ? "Live Data" : "Mock Data"}
            </div>
          </div>

          {goalTaskId ? (
            <>
              <div className="text-sm text-[#FFD700] font-bold tracking-wide" style={{ fontFamily: 'serif', fontWeight: 400 }}>
                🎯 Goal: {goalTaskId.replace('task-', '#')}
              </div>
              <div className="text-xs text-gray-300 leading-relaxed" style={{ fontFamily: 'serif', letterSpacing: '0.05em', fontWeight: 300 }}>
                Related tasks <span className="text-[#FFD700]">glow</span>
                <br />
                Unrelated fade to <span className="text-[#165E83]">darkness</span>
              </div>
              <button
                onClick={() => setGoalTaskId(null)}
                className="mt-2 px-3 py-1 bg-[#C9171E]/20 border border-[#C9171E] text-[#FF6B6B] text-xs hover:bg-[#C9171E]/40 transition-colors"
                style={{ fontFamily: 'serif', letterSpacing: '0.1em' }}
              >
                Clear Goal
              </button>
            </>
          ) : (
            <div className="text-xs text-gray-400 leading-relaxed" style={{ fontFamily: 'serif', letterSpacing: '0.05em', fontWeight: 300 }}>
              Click a task to<br/>
              set <span className="text-[#FFD700]">Goal</span>
            </div>
          )}
        </div>
      </div>

      {/* 🎌 凡例 - 右下（化物語カットイン風） */}
      <div className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-lg px-6 py-4 border-r-4 border-[#165E83] shadow-2xl" style={{ fontFamily: 'serif' }}>
        <div className="flex flex-col gap-3">
          <div className="text-xs text-gray-400 tracking-widest mb-2 border-b border-gray-700 pb-1" style={{ fontFamily: 'serif', letterSpacing: '0.2em', fontWeight: 300 }}>
            状態凡例
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-3 bg-[#165E83]/80 border border-[#165E83]"></div>
            <span className="text-xs text-gray-200 tracking-wide" style={{ fontFamily: 'serif', fontWeight: 300 }}>待機中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-3 bg-[#00A381]/80 border border-[#00A381]"></div>
            <span className="text-xs text-gray-200 tracking-wide" style={{ fontFamily: 'serif', fontWeight: 300 }}>実行中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-3 bg-[#F8B500]/80 border border-[#F8B500]"></div>
            <span className="text-xs text-gray-200 tracking-wide" style={{ fontFamily: 'serif', fontWeight: 300 }}>審査中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-3 bg-[#E6B422]/80 border border-[#E6B422]"></div>
            <span className="text-xs text-gray-200 tracking-wide" style={{ fontFamily: 'serif', fontWeight: 300 }}>完了</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-3 bg-[#C9171E]/80 border border-[#C9171E]"></div>
            <span className="text-xs text-gray-200 tracking-wide" style={{ fontFamily: 'serif', fontWeight: 300 }}>失敗</span>
          </div>
        </div>
      </div>

      {/* 🎌 題名 - 左上（e=mc²風の公式スタイル） */}
      <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-lg px-6 py-4 border border-white/30 shadow-2xl" style={{ fontFamily: 'serif' }}>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold bg-gradient-to-r from-[#165E83] via-[#884898] to-[#C9171E] bg-clip-text text-transparent tracking-wider" style={{ fontFamily: 'serif', letterSpacing: '0.15em', fontWeight: 400 }}>
            🌌 ベクトル空間宇宙
          </h2>
          <div className="text-xs text-gray-400 tracking-widest border-b border-gray-700 pb-1" style={{ fontFamily: 'serif', letterSpacing: '0.2em', fontWeight: 300 }}>
            動画番号：弐漆〇
          </div>

          {/* 公式表記 */}
          <div className="text-sm text-white font-bold" style={{ fontFamily: 'serif', letterSpacing: '0.08em', fontWeight: 400 }}>
            <span className="text-[#FFD700]">V</span>
            <sub className="text-xs text-gray-400">宇宙</sub>
            <span className="mx-2">=</span>
            <span className="text-[#165E83]">Σ</span>
            <span className="text-[#00A381]">T</span>
            <sub className="text-xs text-gray-400">タスク</sub>
            <span className="mx-1">×</span>
            <span className="text-[#884898]">G</span>
            <sub className="text-xs text-gray-400">重力</sub>
          </div>

          <div className="text-xs text-gray-300" style={{ fontFamily: 'serif', letterSpacing: '0.05em', fontWeight: 300 }}>
            '''宇宙空間における<span className="text-[#FFD700]">タスク収束定理</span>'''
          </div>
        </div>
      </div>

      {/* 🎌 数式定義 - 左下（e=mc²風の論理式） */}
      <div className="absolute bottom-4 left-4 bg-black/90 backdrop-blur-lg px-5 py-4 border-l-4 border-[#884898] shadow-2xl" style={{ fontFamily: 'serif' }}>
        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-400 tracking-widest mb-1 border-b border-gray-700 pb-1" style={{ fontFamily: 'serif', letterSpacing: '0.2em', fontWeight: 300 }}>
            定理：林潜在収束
          </div>

          {/* 手順定義 */}
          <div className="text-xs text-white" style={{ fontFamily: 'serif', letterSpacing: '0.08em', fontWeight: 300 }}>
            <span className="text-[#F8B500]">A to Z</span> [<span className="text-[#00A381]">Task</span>]:
          </div>

          {/* シグマ（総和） */}
          <div className="text-sm text-white font-bold" style={{ fontFamily: 'serif', letterSpacing: '0.05em', fontWeight: 400 }}>
            Σ(<span className="text-[#165E83]">待機</span>, <span className="text-[#00A381]">実行</span>, <span className="text-[#F8B500]">審査</span>, <span className="text-[#E6B422]">完了</span>, <span className="text-[#C9171E]">失敗</span>)
          </div>

          {/* 等価関係 */}
          <div className="text-xs text-white flex items-center gap-2" style={{ fontFamily: 'serif', letterSpacing: '0.05em', fontWeight: 300 }}>
            <span>=&lt;&gt;</span>
            <span className="text-[#FFD700]">目標</span>
          </div>

          {/* 論理推論 */}
          <div className="text-xs text-gray-300 leading-relaxed" style={{ fontFamily: 'serif', letterSpacing: '0.05em', fontWeight: 300 }}>
            <div>∵ タスク群が宇宙空間に存在し、</div>
            <div className="ml-3">重力場が作用する</div>
            <div>∴ 全てのタスクは林潜在核心へ</div>
            <div className="ml-3">収束する</div>
          </div>

          {/* QED */}
          <div className="text-xs text-[#FFD700] tracking-widest text-right mt-1" style={{ fontFamily: 'serif', letterSpacing: '0.2em', fontWeight: 400 }}>
            Q.E.D.
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Text, Line } from "@react-three/drei";
import * as THREE from "three";

// タスクデータ型
interface Task {
  id: string;
  title: string;
  status: "pending" | "working" | "reviewing" | "completed" | "failed";
  priority: "P0" | "P1" | "P2" | "P3";
  estimatedMinutes: number;
  description: string;
  module: string; // "miyabi-agents", "miyabi-core", etc.
  layer: "ui" | "logic" | "data" | "infra";
}

// 3D座標型
interface Position3D {
  x: number;
  y: number;
  z: number;
}

// タスクベクトル型
interface TaskVector {
  task: Task;
  position: Position3D;
  embedding: number[]; // 簡易版ベクトル
  semanticLinks: {
    targetId: string;
    similarity: number;
  }[];
}

// ステータス別の色
const STATUS_COLORS = {
  pending: "#60A5FA",   // 青
  working: "#86EFAC",   // 緑
  reviewing: "#FDE047", // 黄
  completed: "#FFFFFF", // 白
  failed: "#FCA5A5",    // 赤
};

// 優先度別のサイズ係数
const PRIORITY_SCALE = {
  P0: 1.5,
  P1: 1.2,
  P2: 1.0,
  P3: 0.8,
};

// 簡易的なベクトル埋め込み（TF-IDF風）
function embedTask(task: Task, vocabulary: string[]): number[] {
  const text = `${task.title} ${task.description} ${task.module} ${task.layer}`.toLowerCase();
  const words = text.split(/\s+/);

  const vector = vocabulary.map(word => {
    const count = words.filter(w => w.includes(word)).length;
    return count > 0 ? 1 : 0;
  });

  // 正規化
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return vector.map(v => (magnitude > 0 ? v / magnitude : 0));
}

// コサイン類似度
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return magA > 0 && magB > 0 ? dotProduct / (magA * magB) : 0;
}

// 3D空間への射影（簡易版 - 力学ベース）
function projectTo3D(tasks: Task[]): TaskVector[] {
  // 語彙抽出
  const vocabulary = Array.from(
    new Set(
      tasks.flatMap(t =>
        `${t.title} ${t.description}`.toLowerCase().split(/\s+/)
      )
    )
  ).slice(0, 50); // 上位50単語

  // ベクトル化
  const embeddings = tasks.map(t => embedTask(t, vocabulary));

  // 初期位置をランダムに配置（カメラビュー内に収める）
  const positions: Position3D[] = tasks.map(() => ({
    x: (Math.random() - 0.5) * 12, // -6〜6の範囲
    y: (Math.random() - 0.5) * 12,
    z: (Math.random() - 0.5) * 12,
  }));

  // 力学ベースレイアウト（簡易版・減衰強化）+ シュンスケポテンシャル
  for (let iteration = 0; iteration < 50; iteration++) {
    tasks.forEach((task, i) => {
      const force = { x: 0, y: 0, z: 0 };

      tasks.forEach((otherTask, j) => {
        if (i === j) return;

        const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
        const targetDistance = (1 - similarity) * 5; // 0-5の距離

        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const dz = positions[j].z - positions[i].z;
        const currentDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (currentDistance === 0) return;

        const diff = targetDistance - currentDistance;
        const strength = diff * 0.005; // より弱い力

        force.x += (dx / currentDistance) * strength;
        force.y += (dy / currentDistance) * strength;
        force.z += (dz / currentDistance) * strength;
      });

      // レイヤーによるY軸制約
      const layerY = {
        ui: 5,
        logic: 2,
        data: -2,
        infra: -5,
      }[task.layer];
      force.y += (layerY - positions[i].y) * 0.05;

      // 位置更新（減衰強化）
      positions[i].x += force.x * 0.3; // 70%減衰
      positions[i].y += force.y * 0.3;
      positions[i].z += force.z * 0.3;
    });
  }

  // シュンスケポテンシャルの力場を適用
  // はやししゅんすけ星団の中心を計算
  const hayashiTasks = tasks
    .map((task, i) => ({ task, position: positions[i], index: i }))
    .filter((item) => item.task.module === "はやししゅんすけ");

  if (hayashiTasks.length > 0) {
    const blackHoleCenter = {
      x: hayashiTasks.reduce((sum, item) => sum + item.position.x, 0) / hayashiTasks.length,
      y: hayashiTasks.reduce((sum, item) => sum + item.position.y, 0) / hayashiTasks.length,
      z: hayashiTasks.reduce((sum, item) => sum + item.position.z, 0) / hayashiTasks.length,
    };

    // すべてのタスクにシュンスケポテンシャルを適用
    positions.forEach((pos, i) => {
      const dx = blackHoleCenter.x - pos.x;
      const dy = blackHoleCenter.y - pos.y;
      const dz = blackHoleCenter.z - pos.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance === 0) return;

      // 力場の強度（距離の2乗に反比例）
      const forceFieldRange = 15; // 力場の有効範囲
      if (distance < forceFieldRange) {
        // はやししゅんすけタスクはより強く引き寄せられる
        const isHayashiTask = tasks[i].module === "はやししゅんすけ";
        const gravitationalStrength = isHayashiTask ? 0.3 : 0.1;
        const forceMagnitude = gravitationalStrength / (distance * distance + 0.1);

        // ブラックホールに向かう力
        pos.x += (dx / distance) * forceMagnitude;
        pos.y += (dy / distance) * forceMagnitude;
        pos.z += (dz / distance) * forceMagnitude;
      }
    });
  }

  // 意味的つながりを計算
  return tasks.map((task, i) => {
    const semanticLinks = tasks
      .map((otherTask, j) => ({
        targetId: otherTask.id,
        similarity: cosineSimilarity(embeddings[i], embeddings[j]),
      }))
      .filter((link) => link.targetId !== task.id && link.similarity > 0.5)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3); // 上位3つ

    return {
      task,
      position: positions[i],
      embedding: embeddings[i],
      semanticLinks,
    };
  });
}

// 星コンポーネント（視認性重視版 - 超強化）
function TaskStar({ taskVector }: { taskVector: TaskVector }) {
  const { task, position } = taskVector;

  // サイズ計算（超大きく）
  const baseSize = Math.log(task.estimatedMinutes + 1) * 0.3 + 1.5; // 2倍以上に拡大
  const size = baseSize * PRIORITY_SCALE[task.priority];

  // 色
  const color = STATUS_COLORS[task.status];

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 外側のグロー */}
      <mesh>
        <sphereGeometry args={[size * 1.5, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* 中間のグロー */}
      <mesh>
        <sphereGeometry args={[size * 1.2, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* メイン星体 */}
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={task.status === "working" ? 3.0 : 2.0}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>

      {/* タスクラベル */}
      <Text
        position={[0, size + 0.8, 0]}
        fontSize={0.4}
        color="#FFFFFF"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {task.title.split(':')[1]?.trim() || task.title}
      </Text>
    </group>
  );
}

// 意味的つながりの線（@react-three/drei Line使用 - 視認性超強化）
function SemanticLinks({ taskVectors }: { taskVectors: TaskVector[] }) {
  const links = useMemo(() => {
    const result: JSX.Element[] = [];

    taskVectors.forEach((taskVector) => {
      taskVector.semanticLinks.forEach((link) => {
        const target = taskVectors.find((tv) => tv.task.id === link.targetId);
        if (!target) return;

        // 類似度によって色と太さを変更（超強化）
        const lineColor = link.similarity > 0.7 ? "#00D9FF" : "#60A5FA";
        const lineWidth = link.similarity > 0.7 ? 4 : 2;
        const opacity = link.similarity > 0.7 ? 0.8 : 0.5;

        // drei Lineコンポーネントを使用（安全）
        result.push(
          <Line
            key={`${taskVector.task.id}-${link.targetId}`}
            points={[
              [taskVector.position.x, taskVector.position.y, taskVector.position.z],
              [target.position.x, target.position.y, target.position.z],
            ]}
            color={lineColor}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
          />
        );
      });
    });

    return result;
  }, [taskVectors]);

  return <group>{links}</group>;
}

// モックデータ
const MOCK_TASKS: Task[] = [
  {
    id: "task-270",
    title: "Issue #270: 認証実装",
    status: "working",
    priority: "P0",
    estimatedMinutes: 30,
    description: "ユーザー認証機能の実装 JWT トークン セッション管理",
    module: "miyabi-agents",
    layer: "logic",
  },
  {
    id: "task-271",
    title: "Issue #271: ログイン画面",
    status: "working",
    priority: "P1",
    estimatedMinutes: 15,
    description: "ログイン画面 UI React コンポーネント フォーム",
    module: "miyabi-ui",
    layer: "ui",
  },
  {
    id: "task-272",
    title: "Issue #272: デプロイ自動化",
    status: "pending",
    priority: "P2",
    estimatedMinutes: 45,
    description: "CI/CD パイプライン Docker Kubernetes デプロイメント",
    module: "miyabi-infra",
    layer: "infra",
  },
  {
    id: "task-273",
    title: "Issue #273: データベース設計",
    status: "completed",
    priority: "P0",
    estimatedMinutes: 60,
    description: "データベース スキーマ設計 PostgreSQL マイグレーション",
    module: "miyabi-core",
    layer: "data",
  },
  {
    id: "task-274",
    title: "Issue #274: API実装",
    status: "working",
    priority: "P1",
    estimatedMinutes: 40,
    description: "REST API エンドポイント実装 認証 ミドルウェア",
    module: "miyabi-agents",
    layer: "logic",
  },
  {
    id: "task-275",
    title: "Issue #275: セキュリティ対策",
    status: "reviewing",
    priority: "P0",
    estimatedMinutes: 20,
    description: "セキュリティ 脆弱性 対策 認証 暗号化",
    module: "miyabi-core",
    layer: "logic",
  },
  // はやししゅんすけ星団のタスク
  {
    id: "task-276",
    title: "Issue #276: アイデア発想",
    status: "working",
    priority: "P0",
    estimatedMinutes: 120,
    description: "新規事業アイデア ビジネスモデル 市場調査 コンセプト設計",
    module: "はやししゅんすけ",
    layer: "logic",
  },
  {
    id: "task-277",
    title: "Issue #277: プロトタイプ開発",
    status: "working",
    priority: "P1",
    estimatedMinutes: 180,
    description: "MVP開発 技術検証 ユーザーテスト フィードバック収集",
    module: "はやししゅんすけ",
    layer: "logic",
  },
  {
    id: "task-278",
    title: "Issue #278: ドキュメント執筆",
    status: "completed",
    priority: "P2",
    estimatedMinutes: 90,
    description: "技術ブログ チュートリアル README 設計書",
    module: "はやししゅんすけ",
    layer: "data",
  },
  {
    id: "task-279",
    title: "Issue #279: コードレビュー",
    status: "reviewing",
    priority: "P1",
    estimatedMinutes: 60,
    description: "品質チェック リファクタリング提案 ベストプラクティス",
    module: "はやししゅんすけ",
    layer: "logic",
  },
];

// ハヤシシュンスケ・ホール（ブラックホール）コンポーネント
function HayashiBlackHole({ position }: { position: Position3D }) {
  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Event Horizon（事象の地平線） - 外側の輝くリング */}
      <mesh>
        <torusGeometry args={[1.5, 0.1, 16, 100]} />
        <meshStandardMaterial
          color="#8B00FF"
          emissive="#8B00FF"
          emissiveIntensity={2.0}
        />
      </mesh>

      {/* Accretion Disk（降着円盤） - 中間のリング */}
      <mesh rotation={[Math.PI / 6, 0, 0]}>
        <torusGeometry args={[1.2, 0.05, 16, 100]} />
        <meshStandardMaterial
          color="#FF00FF"
          emissive="#FF00FF"
          emissiveIntensity={1.5}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* ブラックホール本体 - 真っ黒な球体 */}
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#000000"
          emissiveIntensity={0}
        />
      </mesh>

      {/* 内側の紫のオーラ */}
      <mesh>
        <sphereGeometry args={[1.0, 32, 32]} />
        <meshStandardMaterial
          color="#4B0082"
          emissive="#4B0082"
          emissiveIntensity={0.8}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* シュンスケポテンシャル力場のビジュアル表現 */}
      <mesh>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshStandardMaterial
          color="#8B00FF"
          emissive="#8B00FF"
          emissiveIntensity={0.3}
          transparent
          opacity={0.1}
          wireframe
        />
      </mesh>
    </group>
  );
}

// クラスタラベルコンポーネント
function ClusterLabels({ taskVectors }: { taskVectors: TaskVector[] }) {
  const clusterCenters = useMemo(() => {
    const clusters = new Map<string, Position3D[]>();

    // 各モジュールのタスク位置を収集
    taskVectors.forEach(tv => {
      if (!clusters.has(tv.task.module)) {
        clusters.set(tv.task.module, []);
      }
      clusters.get(tv.task.module)!.push(tv.position);
    });

    // 各クラスタの中心を計算
    const centers = new Map<string, Position3D>();
    clusters.forEach((positions, module) => {
      const center = {
        x: positions.reduce((sum, p) => sum + p.x, 0) / positions.length,
        y: positions.reduce((sum, p) => sum + p.y, 0) / positions.length + 1.5, // 少し上に配置
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

// メインコンポーネント
export function VectorSpaceUniverse() {
  const taskVectors = useMemo(() => projectTo3D(MOCK_TASKS), []);

  // はやししゅんすけ星団の中心を計算
  const hayashiBlackHolePosition = useMemo(() => {
    const hayashiTasks = taskVectors.filter(
      (tv) => tv.task.module === "はやししゅんすけ"
    );

    if (hayashiTasks.length === 0) {
      return { x: 0, y: 0, z: 0 };
    }

    const center = {
      x: hayashiTasks.reduce((sum, tv) => sum + tv.position.x, 0) / hayashiTasks.length,
      y: hayashiTasks.reduce((sum, tv) => sum + tv.position.y, 0) / hayashiTasks.length,
      z: hayashiTasks.reduce((sum, tv) => sum + tv.position.z, 0) / hayashiTasks.length,
    };

    return center;
  }, [taskVectors]);

  return (
    <div className="w-full h-screen bg-gradient-to-b from-black via-purple-900/10 to-black">
      <Canvas camera={{ position: [20, 15, 20], fov: 75 }}>
        {/* 背景の星空 */}
        <Stars radius={100} depth={50} count={8000} factor={5} fade speed={1} />

        {/* ライト（強化版） */}
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={2.0} />
        <pointLight position={[-10, -10, -10]} intensity={1.0} />
        <pointLight position={[0, 20, 0]} intensity={1.5} color="#FFFFFF" />
        <pointLight position={[0, -20, 0]} intensity={1.0} color="#8B00FF" />

        {/* タスクの星 - 物理シミュレーション位置を使用 */}
        {taskVectors.map((taskVector) => (
          <TaskStar key={taskVector.task.id} taskVector={taskVector} />
        ))}

        {/* ハヤシシュンスケ・ホール（ブラックホール） */}
        <HayashiBlackHole position={hayashiBlackHolePosition} />

        {/* クラスタラベル */}
        <ClusterLabels taskVectors={taskVectors} />

        {/* 意味的つながり */}
        <SemanticLinks taskVectors={taskVectors} />

        {/* カメラコントロール */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={50}
        />
      </Canvas>

      {/* UI オーバーレイ */}
      <div className="absolute top-4 left-4 text-white space-y-2 max-w-xs bg-black/50 backdrop-blur-md p-4 rounded-xl border border-white/10 animate-in fade-in duration-700">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          🌌 Vector Space Universe
        </h2>
        <p className="text-sm text-gray-400">
          タスクの意味的類似度に基づく3D配置
        </p>
        <div className="mt-4 space-y-1 text-xs">
          <div><span className="text-blue-400">🔵 青</span>: 未開始</div>
          <div><span className="text-green-400">🟢 緑</span>: 実行中</div>
          <div><span className="text-yellow-400">🟡 黄</span>: レビュー中</div>
          <div><span className="text-white">⚪ 白</span>: 完了</div>
          <div><span className="text-red-400">🔴 赤</span>: 失敗</div>
        </div>
        <div className="mt-4 space-y-1 text-xs border-t border-gray-700 pt-2">
          <div className="font-bold text-purple-400">🌀 ハヤシシュンスケ・ホール</div>
          <div className="text-gray-400">シュンスケポテンシャルの力場が作用</div>
          <div className="text-gray-400">• 有効範囲: 15単位</div>
          <div className="text-gray-400">• 力: 1/r² に比例</div>
        </div>
        <div className="mt-4 space-y-1 text-xs border-t border-purple-900 pt-2">
          <div className="font-bold text-yellow-300">📜 はやししゅんすけの原理</div>
          <div className="text-gray-300 space-y-1">
            <div><span className="text-purple-400">第一原理:</span> 意味的に近いタスクは空間的にも近い</div>
            <div><span className="text-purple-400">第二原理:</span> 同一モジュールのタスクは星団を形成する</div>
            <div><span className="text-purple-400">第三原理:</span> レイヤーによってY軸座標が決定される</div>
            <div><span className="text-purple-400">第四原理:</span> ブラックホールは周囲のタスクを引き寄せる</div>
            <div><span className="text-purple-400">第五原理:</span> 力場の強さは距離の2乗に反比例する</div>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          <p>マウスドラッグ: 回転</p>
          <p>ホイール: ズーム</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Agent TCG Card Component - Trading Card Game Style Agent Visualization
 *
 * Features:
 * - Rarity-based holographic effects (C/UC/R/SR/SSR/UR)
 * - Attribute icons and colors (7 attributes)
 * - Real-time stats visualization
 * - Experience bar with level progression
 * - Skill display
 * - Evolution tracking
 */

import { motion } from 'framer-motion';
import {
  Zap,
  Shield,
  TrendingUp,
  Brain,
  Star,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';

// ===== Types =====

type Rarity = 'C' | 'UC' | 'R' | 'SR' | 'SSR' | 'UR';
type Attribute = 'Light' | 'Dark' | 'Fire' | 'Water' | 'Wind' | 'Earth' | 'Thunder';

interface AgentCardData {
  id: string;
  name_jp: string;
  name_en: string;
  agent_type: string;
  role_jp: string;
  role_en: string;
  rarity: Rarity;
  attribute: Attribute;
  level: number;
  experience: number;
  required_exp: number;
  stats: {
    ATK: number;
    DEF: number;
    SPD: number;
    INT: number;
  };
  achievements: {
    tasks_completed: number;
    success_rate: number;
    consecutive_successes: number;
    max_consecutive_successes: number;
  };
  evolution_stage: number;
  evolution_history: string[];
  skills: Skill[];
  holographic_effect: string;
  description: string;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  effect: {
    type: string;
    value: number;
  };
}

// ===== Rarity Config =====

const RARITY_CONFIG: Record<Rarity, {
  color: string;
  gradient: string;
  border: string;
  stars: number;
  glow: string;
}> = {
  'UR': {
    color: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF4500 100%)',
    border: '3px solid #FFD700',
    stars: 5,
    glow: '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.5)',
  },
  'SSR': {
    color: '#E0E0E0',
    gradient: 'linear-gradient(135deg, #E0E0E0 0%, #C0C0C0 50%, #A8A8A8 100%)',
    border: '3px solid #E0E0E0',
    stars: 4,
    glow: '0 0 25px rgba(224, 224, 224, 0.7), 0 0 50px rgba(224, 224, 224, 0.4)',
  },
  'SR': {
    color: '#4FC3F7',
    gradient: 'linear-gradient(135deg, #4FC3F7 0%, #29B6F6 50%, #03A9F4 100%)',
    border: '2px solid #4FC3F7',
    stars: 3,
    glow: '0 0 20px rgba(79, 195, 247, 0.6), 0 0 40px rgba(79, 195, 247, 0.3)',
  },
  'R': {
    color: '#42A5F5',
    gradient: 'linear-gradient(135deg, #42A5F5 0%, #2196F3 100%)',
    border: '2px solid #42A5F5',
    stars: 2,
    glow: '0 0 15px rgba(66, 165, 245, 0.5)',
  },
  'UC': {
    color: '#90CAF9',
    gradient: 'linear-gradient(135deg, #90CAF9 0%, #64B5F6 100%)',
    border: '1px solid #90CAF9',
    stars: 1,
    glow: '0 0 10px rgba(144, 202, 249, 0.3)',
  },
  'C': {
    color: '#E0E0E0',
    gradient: 'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%)',
    border: '1px solid #BDBDBD',
    stars: 0,
    glow: 'none',
  },
};

// ===== Attribute Config =====

const ATTRIBUTE_CONFIG: Record<Attribute, {
  color: string;
  icon: string;
  emoji: string;
}> = {
  'Light': { color: '#FFD700', icon: '☀️', emoji: '☀️' },
  'Dark': { color: '#8B00FF', icon: '🌙', emoji: '🌙' },
  'Fire': { color: '#FF4500', icon: '🔥', emoji: '🔥' },
  'Water': { color: '#1E90FF', icon: '💧', emoji: '💧' },
  'Wind': { color: '#00CED1', icon: '💨', emoji: '💨' },
  'Earth': { color: '#8B4513', icon: '🌍', emoji: '🌍' },
  'Thunder': { color: '#FFD700', icon: '⚡', emoji: '⚡' },
};

// ===== Component =====

export function AgentCard({ agent, onClick }: { agent: AgentCardData; onClick?: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const rarity = RARITY_CONFIG[agent.rarity];
  const attribute = ATTRIBUTE_CONFIG[agent.attribute];

  return (
    <motion.div
      className="relative cursor-pointer"
      whileHover={{ scale: 1.05, y: -10 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        width: '300px',
        height: '420px',
      }}
    >
      {/* Card Container */}
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden"
        style={{
          background: rarity.gradient,
          border: rarity.border,
          boxShadow: isHovered ? rarity.glow : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Holographic Effect Overlay */}
        {agent.holographic_effect !== 'none' && (
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.8) 50%, transparent 70%)',
              backgroundSize: '200% 200%',
              animation: 'holographic 3s ease infinite',
            }}
          />
        )}

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/40 to-transparent">
          {/* Rarity Stars */}
          <div className="flex gap-1">
            {Array.from({ length: rarity.stars }).map((_, i) => (
              <Star key={i} size={16} fill={rarity.color} color={rarity.color} />
            ))}
          </div>

          {/* Attribute Icon */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-2xl"
            style={{
              backgroundColor: attribute.color + '20',
              border: `2px solid ${attribute.color}`,
            }}
          >
            {attribute.emoji}
          </div>

          {/* Level */}
          <div className="text-white font-bold text-lg px-3 py-1 bg-black/50 rounded-lg">
            Lv.{agent.level}
          </div>
        </div>

        {/* Character Image (Placeholder) */}
        <div className="absolute top-16 left-8 right-8 h-48 bg-gradient-to-br from-white/10 to-white/5 rounded-xl border border-white/20 flex items-center justify-center backdrop-blur-sm">
          <Sparkles size={64} className="text-white/30" />
        </div>

        {/* Name & Role */}
        <div className="absolute top-[280px] left-0 right-0 px-6 text-center">
          <h3 className="text-2xl font-bold text-white drop-shadow-lg mb-1">
            {agent.name_jp}
          </h3>
          <p className="text-sm text-white/80 font-light">
            {agent.name_en}
          </p>
          <p className="text-xs text-white/70 mt-1 bg-black/30 inline-block px-3 py-1 rounded-full">
            {agent.role_jp}
          </p>
        </div>

        {/* Stats Bars */}
        <div className="absolute bottom-[80px] left-6 right-6 space-y-2">
          <StatBar label="ATK" value={agent.stats.ATK} max={1000} color="#FF4444" icon={<Zap size={14} />} />
          <StatBar label="DEF" value={agent.stats.DEF} max={1000} color="#4444FF" icon={<Shield size={14} />} />
          <StatBar label="SPD" value={agent.stats.SPD} max={1000} color="#44FF44" icon={<TrendingUp size={14} />} />
          <StatBar label="INT" value={agent.stats.INT} max={1000} color="#FF44FF" icon={<Brain size={14} />} />
        </div>

        {/* Experience Bar */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="text-xs text-white/80 mb-1 flex justify-between">
            <span>EXP</span>
            <span>{agent.experience.toLocaleString()} / {agent.required_exp.toLocaleString()}</span>
          </div>
          <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
              initial={{ width: 0 }}
              animate={{ width: `${(agent.experience / agent.required_exp) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* CSS Animation for Holographic Effect */}
      <style>{`
        @keyframes holographic {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </motion.div>
  );
}

// ===== Stat Bar Component =====

function StatBar({
  label,
  value,
  max,
  color,
  icon
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-white/80 text-xs font-bold w-8 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
        <motion.div
          className="h-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <div className="text-white text-xs font-bold w-10 text-right">
        {value}
      </div>
    </div>
  );
}

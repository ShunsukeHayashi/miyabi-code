/**
 * Agent Gallery Page - TCG Card Collection View
 *
 * Features:
 * - Grid layout of agent cards
 * - Filter by rarity, attribute, agent type
 * - Search functionality
 * - Sort by level, stats, rarity
 * - Card detail modal
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SortAsc } from 'lucide-react';
import { AgentCard } from '../components/AgentCard';
import agentData from '../../../.claude/agents/AGENT_CARD_DATA.json';
import { useTheme } from '@/contexts/ThemeContext';

type Rarity = 'C' | 'UC' | 'R' | 'SR' | 'SSR' | 'UR';
type Attribute = 'Light' | 'Dark' | 'Fire' | 'Water' | 'Wind' | 'Earth' | 'Thunder';

export default function AgentGalleryPage() {
  const { tokens, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'ALL'>('ALL');
  const [attributeFilter, setAttributeFilter] = useState<Attribute | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'level' | 'atk' | 'rarity'>('level');

  // Combine coding and business agents
  const allAgents = [
    ...(agentData.agents || []),
    ...(agentData.business_agents || []),
  ];

  // Filter agents
  const filteredAgents = allAgents
    .filter((agent) => {
      const matchesSearch =
        agent.name_jp.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.agent_type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRarity = rarityFilter === 'ALL' || agent.rarity === rarityFilter;
      const matchesAttribute = attributeFilter === 'ALL' || agent.attribute === attributeFilter;

      return matchesSearch && matchesRarity && matchesAttribute;
    })
    .sort((a, b) => {
      if (sortBy === 'level') return b.level - a.level;
      if (sortBy === 'atk') return b.stats.ATK - a.stats.ATK;
      if (sortBy === 'rarity') {
        const rarityOrder = { UR: 6, SSR: 5, SR: 4, R: 3, UC: 2, C: 1 };
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      }
      return 0;
    });

  // Stats
  const totalAgents = allAgents.length;
  const avgLevel = Math.round(allAgents.reduce((sum, a) => sum + a.level, 0) / totalAgents);
  const totalTasks = allAgents.reduce((sum, a) => sum + a.achievements.tasks_completed, 0);
  const avgSuccessRate = (
    allAgents.reduce((sum, a) => sum + a.achievements.success_rate, 0) / totalAgents
  ).toFixed(1);

  return (
    <div
      className="min-h-screen p-8 transition-colors duration-200"
      style={{
        background: isDark
          ? tokens.colors.background.gradient
          : tokens.colors.background.primary
      }}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <motion.h1
          className="text-5xl font-bold mb-2"
          style={{ color: tokens.colors.text.primary }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🎴 Agent Gallery
        </motion.h1>
        <p className="text-lg" style={{ color: tokens.colors.text.secondary }}>
          Collect and manage your AI agents - TCG style
        </p>
      </div>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-4 gap-4">
        <StatCard label="Total Agents" value={totalAgents} icon="👥" tokens={tokens} />
        <StatCard label="Average Level" value={`Lv.${avgLevel}`} icon="⭐" tokens={tokens} />
        <StatCard label="Total Tasks" value={totalTasks.toLocaleString()} icon="✅" tokens={tokens} />
        <StatCard label="Success Rate" value={`${avgSuccessRate}%`} icon="🎯" tokens={tokens} />
      </div>

      {/* Filters & Search */}
      <div
        className={`max-w-7xl mx-auto mb-8 ${tokens.effects.blur} rounded-2xl p-6 border`}
        style={{
          backgroundColor: tokens.colors.surface.glass,
          borderColor: tokens.colors.surface.cardBorder
        }}
      >
        <div className="grid grid-cols-4 gap-4">
          {/* Search */}
          <div className="col-span-2 relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: tokens.colors.text.tertiary }}
              size={20}
            />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: tokens.colors.surface.overlay,
                borderColor: tokens.colors.surface.cardBorder,
                color: tokens.colors.text.primary,
                '--tw-ring-color': tokens.colors.accent.primary
              } as React.CSSProperties}
            />
          </div>

          {/* Rarity Filter */}
          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value as Rarity | 'ALL')}
            className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: tokens.colors.surface.overlay,
              borderColor: tokens.colors.surface.cardBorder,
              color: tokens.colors.text.primary,
              '--tw-ring-color': tokens.colors.accent.primary
            } as React.CSSProperties}
          >
            <option value="ALL">All Rarities</option>
            <option value="UR">⭐⭐⭐⭐⭐ UR</option>
            <option value="SSR">⭐⭐⭐⭐ SSR</option>
            <option value="SR">⭐⭐⭐ SR</option>
            <option value="R">⭐⭐ R</option>
            <option value="UC">⭐ UC</option>
            <option value="C">○ C</option>
          </select>

          {/* Attribute Filter */}
          <select
            value={attributeFilter}
            onChange={(e) => setAttributeFilter(e.target.value as Attribute | 'ALL')}
            className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: tokens.colors.surface.overlay,
              borderColor: tokens.colors.surface.cardBorder,
              color: tokens.colors.text.primary,
              '--tw-ring-color': tokens.colors.accent.primary
            } as React.CSSProperties}
          >
            <option value="ALL">All Attributes</option>
            <option value="Light">☀️ Light</option>
            <option value="Dark">🌙 Dark</option>
            <option value="Fire">🔥 Fire</option>
            <option value="Water">💧 Water</option>
            <option value="Wind">💨 Wind</option>
            <option value="Earth">🌍 Earth</option>
            <option value="Thunder">⚡ Thunder</option>
          </select>
        </div>

        {/* Sort */}
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm flex items-center gap-2" style={{ color: tokens.colors.text.secondary }}>
            <SortAsc size={16} />
            Sort by:
          </span>
          <button
            onClick={() => setSortBy('level')}
            className={`px-4 py-2 rounded-lg text-sm ${tokens.effects.transition}`}
            style={sortBy === 'level' ? {
              backgroundColor: tokens.colors.accent.primary,
              color: tokens.colors.text.inverse
            } : {
              backgroundColor: tokens.colors.surface.overlay,
              color: tokens.colors.text.tertiary
            }}
          >
            Level
          </button>
          <button
            onClick={() => setSortBy('atk')}
            className={`px-4 py-2 rounded-lg text-sm ${tokens.effects.transition}`}
            style={sortBy === 'atk' ? {
              backgroundColor: tokens.colors.accent.primary,
              color: tokens.colors.text.inverse
            } : {
              backgroundColor: tokens.colors.surface.overlay,
              color: tokens.colors.text.tertiary
            }}
          >
            Attack Power
          </button>
          <button
            onClick={() => setSortBy('rarity')}
            className={`px-4 py-2 rounded-lg text-sm ${tokens.effects.transition}`}
            style={sortBy === 'rarity' ? {
              backgroundColor: tokens.colors.accent.primary,
              color: tokens.colors.text.inverse
            } : {
              backgroundColor: tokens.colors.surface.overlay,
              color: tokens.colors.text.tertiary
            }}
          >
            Rarity
          </button>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="popLayout">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            layout
          >
            {filteredAgents.map((agent) => (
              <motion.div
                key={agent.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <AgentCard agent={agent} onClick={() => console.log('Card clicked:', agent)} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredAgents.length === 0 && (
          <div className="text-center py-20" style={{ color: tokens.colors.text.tertiary }}>
            <p className="text-2xl mb-2">No agents found</p>
            <p>Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Stat Card Component =====

import type { DesignTokens } from '@/styles/design-tokens';

function StatCard({
  label,
  value,
  icon,
  tokens
}: {
  label: string;
  value: string | number;
  icon: string;
  tokens: DesignTokens;
}) {
  return (
    <motion.div
      className={`${tokens.effects.blur} rounded-xl p-4 border`}
      style={{
        backgroundColor: tokens.colors.surface.glass,
        borderColor: tokens.colors.surface.cardBorder
      }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="flex items-center gap-3">
        <div className="text-4xl">{icon}</div>
        <div>
          <div className="text-sm" style={{ color: tokens.colors.text.secondary }}>{label}</div>
          <div className="text-2xl font-bold" style={{ color: tokens.colors.text.primary }}>{value}</div>
        </div>
      </div>
    </motion.div>
  );
}

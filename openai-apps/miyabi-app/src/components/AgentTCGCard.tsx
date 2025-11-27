import React, { useState } from 'react';
import { Star, Zap, Shield, TrendingUp, Award, Sparkles } from 'lucide-react';

interface AgentCard {
  id: string;
  name_jp: string;
  name_en: string;
  agent_type: string;
  role_jp: string;
  role_en: string;
  rarity: string;
  attribute: string;
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
  };
  evolution_stage: number;
  skills: Array<{
    id: string;
    name: string;
    description: string;
    rarity: string;
  }>;
  holographic_effect: string;
  description: string;
}

interface Props {
  agents: AgentCard[];
}

const rarityColors: Record<string, string> = {
  N: '#808080',
  R: '#4a9eff',
  SR: '#9d4eff',
  SSR: '#ffb800',
  UR: '#ff4444',
};

const attributeColors: Record<string, string> = {
  Fire: '#ff4500',
  Water: '#1e90ff',
  Earth: '#8b4513',
  Wind: '#90ee90',
  Light: '#ffd700',
  Dark: '#483d8b',
  Electric: '#ffff00',
};

const attributeEmoji: Record<string, string> = {
  Fire: '🔥',
  Water: '💧',
  Earth: '🌍',
  Wind: '💨',
  Light: '✨',
  Dark: '🌑',
  Electric: '⚡',
};

export default function AgentTCGCard({ agents }: Props) {
  const [selectedAgent, setSelectedAgent] = useState<AgentCard | null>(null);
  const [flipped, setFlipped] = useState<string | null>(null);

  const handleCardClick = (agent: AgentCard) => {
    setSelectedAgent(agent);
    setFlipped(flipped === agent.id ? null : agent.id);
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderRadius: '20px',
      minHeight: '600px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '42px',
          fontWeight: '900',
          background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 8px 0',
          textShadow: '0 0 30px rgba(255,215,0,0.5)',
          letterSpacing: '2px',
        }}>
          ⭐ MIYABI AGENTS TCG ⭐
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#a0aec0',
          margin: '0',
          fontWeight: '600',
        }}>
          {agents.length}種類のレアカードをコレクション
        </p>
      </div>

      {/* Card Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px',
      }}>
        {agents.map(agent => (
          <TCGCard
            key={agent.id}
            agent={agent}
            flipped={flipped === agent.id}
            onClick={() => handleCardClick(agent)}
          />
        ))}
      </div>

      {/* Selected Card Detail */}
      {selectedAgent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px',
        }}
          onClick={() => setSelectedAgent(null)}
        >
          <div style={{
            background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: `0 20px 60px ${rarityColors[selectedAgent.rarity]}80`,
            border: `3px solid ${rarityColors[selectedAgent.rarity]}`,
          }}
            onClick={(e) => e.stopPropagation()}
          >
            <DetailedCard agent={selectedAgent} />
          </div>
        </div>
      )}
    </div>
  );
}

function TCGCard({ agent, flipped, onClick }: { agent: AgentCard; flipped: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const rarityColor = rarityColors[agent.rarity] || '#808080';
  const attributeColor = attributeColors[agent.attribute] || '#808080';
  const expPercent = (agent.experience / agent.required_exp) * 100;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        aspectRatio: '2.5/3.5',
        background: `linear-gradient(135deg, ${rarityColor}20 0%, ${attributeColor}20 100%)`,
        borderRadius: '16px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered || flipped ? 'scale(1.05) translateY(-8px)' : 'scale(1) translateY(0)',
        boxShadow: flipped
          ? `0 20px 40px ${rarityColor}60, 0 0 40px ${rarityColor}40`
          : hovered
            ? `0 15px 30px rgba(0,0,0,0.4), 0 0 20px ${rarityColor}30`
            : '0 8px 16px rgba(0,0,0,0.3)',
        border: `2px solid ${flipped ? rarityColor : 'rgba(255,255,255,0.1)'}`,
        overflow: 'hidden',
      }}
    >
      {/* Holographic Effect */}
      {(hovered || flipped) && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(45deg, transparent 30%, ${rarityColor}20 50%, transparent 70%)`,
          backgroundSize: '200% 200%',
          animation: 'holographic 3s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Rarity Badge */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        background: rarityColor,
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '900',
        boxShadow: `0 4px 12px ${rarityColor}60`,
        zIndex: 10,
      }}>
        {agent.rarity}
      </div>

      {/* Attribute Badge */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        background: attributeColor,
        color: 'white',
        padding: '6px 10px',
        borderRadius: '50%',
        fontSize: '18px',
        boxShadow: `0 4px 12px ${attributeColor}60`,
        zIndex: 10,
      }}>
        {attributeEmoji[agent.attribute] || '⚫'}
      </div>

      {/* Card Content */}
      <div style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Name */}
        <div style={{ marginTop: '40px', marginBottom: '8px' }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '900',
            color: 'white',
            margin: '0 0 4px 0',
            textShadow: `0 0 10px ${rarityColor}`,
            letterSpacing: '1px',
          }}>
            {agent.name_jp}
          </h3>
          <p style={{
            fontSize: '12px',
            color: '#a0aec0',
            margin: '0',
            fontWeight: '600',
          }}>
            {agent.name_en}
          </p>
        </div>

        {/* Level & Evolution */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: '700',
            color: '#ffd700',
          }}>
            Lv.{agent.level}
          </span>
          <div style={{
            display: 'flex',
            gap: '2px',
          }}>
            {Array.from({ length: agent.evolution_stage }).map((_, i) => (
              <Star key={i} size={12} fill="#ffd700" color="#ffd700" />
            ))}
          </div>
        </div>

        {/* EXP Bar */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          height: '6px',
          marginBottom: '16px',
          overflow: 'hidden',
        }}>
          <div style={{
            background: `linear-gradient(90deg, ${rarityColor}, ${attributeColor})`,
            height: '100%',
            width: `${expPercent}%`,
            transition: 'width 0.3s',
            boxShadow: `0 0 10px ${rarityColor}`,
          }} />
        </div>

        {/* Stats */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '12px',
        }}>
          <StatBox label="ATK" value={agent.stats.ATK} color="#ff4444" />
          <StatBox label="DEF" value={agent.stats.DEF} color="#4444ff" />
          <StatBox label="SPD" value={agent.stats.SPD} color="#44ff44" />
          <StatBox label="INT" value={agent.stats.INT} color="#ffaa44" />
        </div>

        {/* Achievements */}
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          borderRadius: '8px',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          color: '#a0aec0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Award size={14} color="#ffd700" />
            <span>{agent.achievements.tasks_completed}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={14} color="#44ff44" />
            <span>{agent.achievements.success_rate}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={14} color="#ffaa44" />
            <span>{agent.achievements.consecutive_successes}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes holographic {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      borderRadius: '6px',
      padding: '6px',
      border: `1px solid ${color}40`,
    }}>
      <div style={{
        fontSize: '10px',
        color: '#a0aec0',
        marginBottom: '2px',
        fontWeight: '600',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '16px',
        fontWeight: '900',
        color,
        textShadow: `0 0 10px ${color}`,
      }}>
        {value}
      </div>
    </div>
  );
}

function DetailedCard({ agent }: { agent: AgentCard }) {
  const rarityColor = rarityColors[agent.rarity] || '#808080';

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '900',
          color: rarityColor,
          margin: '0 0 8px 0',
          textShadow: `0 0 20px ${rarityColor}`,
        }}>
          {agent.name_jp}
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#a0aec0',
          margin: '0 0 8px 0',
        }}>
          {agent.name_en} • {agent.role_en}
        </p>
        <p style={{
          fontSize: '14px',
          color: '#718096',
          lineHeight: '1.6',
        }}>
          {agent.description}
        </p>
      </div>

      {/* Skills */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: 'white',
          marginBottom: '12px',
        }}>
          <Zap size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          スキル
        </h3>
        {agent.skills.map(skill => (
          <div key={skill.id} style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '8px',
            border: `1px solid ${rarityColors[skill.rarity]}40`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '700',
                color: rarityColors[skill.rarity],
              }}>
                {skill.name}
              </span>
              <span style={{
                fontSize: '10px',
                background: rarityColors[skill.rarity],
                color: 'white',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: '700',
              }}>
                {skill.rarity}
              </span>
            </div>
            <p style={{
              fontSize: '12px',
              color: '#a0aec0',
              margin: '0',
              lineHeight: '1.5',
            }}>
              {skill.description}
            </p>
          </div>
        ))}
      </div>

      {/* Stats Detail */}
      <div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: 'white',
          marginBottom: '12px',
        }}>
          <Shield size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          ステータス
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}>
          <StatDetail label="ATK" value={agent.stats.ATK} color="#ff4444" />
          <StatDetail label="DEF" value={agent.stats.DEF} color="#4444ff" />
          <StatDetail label="SPD" value={agent.stats.SPD} color="#44ff44" />
          <StatDetail label="INT" value={agent.stats.INT} color="#ffaa44" />
        </div>
      </div>
    </div>
  );
}

function StatDetail({ label, value, color }: { label: string; value: number; color: string }) {
  const maxStat = 1000;
  const percent = (value / maxStat) * 100;

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px',
      }}>
        <span style={{
          fontSize: '12px',
          color: '#a0aec0',
          fontWeight: '600',
        }}>
          {label}
        </span>
        <span style={{
          fontSize: '14px',
          fontWeight: '900',
          color,
        }}>
          {value}
        </span>
      </div>
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '4px',
        height: '8px',
        overflow: 'hidden',
      }}>
        <div style={{
          background: color,
          height: '100%',
          width: `${percent}%`,
          transition: 'width 0.3s',
          boxShadow: `0 0 10px ${color}`,
        }} />
      </div>
    </div>
  );
}

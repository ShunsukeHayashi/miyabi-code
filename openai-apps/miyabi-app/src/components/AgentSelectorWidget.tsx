import React, { useState } from 'react';
import { Search, Code, Briefcase, Zap, GitBranch, FileCode, Shield, RotateCw, TrendingUp, Target, Users, Package, Palette, Megaphone, ShoppingCart, UserCircle, PieChart, Youtube } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  category: 'coding' | 'business';
  description: string;
  icon: React.ReactNode;
  color: string;
}

const agents: Agent[] = [
  // Coding Agents
  { id: 'coordinator', name: 'Coordinator', category: 'coding', description: 'Task coordination & parallel execution', icon: <Zap size={24} />, color: '#f59e0b' },
  { id: 'codegen', name: 'CodeGen', category: 'coding', description: 'AI-powered code generation', icon: <Code size={24} />, color: '#3b82f6' },
  { id: 'review', name: 'Review', category: 'coding', description: 'Code quality & security scan', icon: <Shield size={24} />, color: '#10b981' },
  { id: 'issue', name: 'Issue', category: 'coding', description: 'Issue analysis & label management', icon: <FileCode size={24} />, color: '#8b5cf6' },
  { id: 'pr', name: 'Pull Request', category: 'coding', description: 'PR automation & creation', icon: <GitBranch size={24} />, color: '#ec4899' },
  { id: 'deploy', name: 'Deploy', category: 'coding', description: 'CI/CD deployment automation', icon: <RotateCw size={24} />, color: '#06b6d4' },
  { id: 'refresher', name: 'Refresher', category: 'coding', description: 'Issue status monitoring & updates', icon: <RotateCw size={24} />, color: '#14b8a6' },

  // Business Agents
  { id: 'ai_entrepreneur', name: 'AI Entrepreneur', category: 'business', description: 'Comprehensive business planning', icon: <Briefcase size={24} />, color: '#f97316' },
  { id: 'self_analysis', name: 'Self Analysis', category: 'business', description: 'Career & skill analysis', icon: <UserCircle size={24} />, color: '#a855f7' },
  { id: 'market_research', name: 'Market Research', category: 'business', description: 'Market trends & competitor analysis', icon: <TrendingUp size={24} />, color: '#0ea5e9' },
  { id: 'persona', name: 'Persona', category: 'business', description: 'Target customer persona design', icon: <Users size={24} />, color: '#ec4899' },
  { id: 'product_concept', name: 'Product Concept', category: 'business', description: 'USP & business model design', icon: <Package size={24} />, color: '#6366f1' },
  { id: 'product_design', name: 'Product Design', category: 'business', description: 'Service detailed design', icon: <Palette size={24} />, color: '#8b5cf6' },
  { id: 'content_creation', name: 'Content Creation', category: 'business', description: 'Video, article & material production', icon: <FileCode size={24} />, color: '#f59e0b' },
  { id: 'funnel_design', name: 'Funnel Design', category: 'business', description: 'Customer journey optimization', icon: <Target size={24} />, color: '#10b981' },
  { id: 'sns_strategy', name: 'SNS Strategy', category: 'business', description: 'Social media strategy & calendar', icon: <Megaphone size={24} />, color: '#06b6d4' },
  { id: 'marketing', name: 'Marketing', category: 'business', description: 'Ads, SEO & customer acquisition', icon: <Megaphone size={24} />, color: '#f43f5e' },
  { id: 'sales', name: 'Sales', category: 'business', description: 'Sales funnel & conversion optimization', icon: <ShoppingCart size={24} />, color: '#14b8a6' },
  { id: 'crm', name: 'CRM', category: 'business', description: 'Customer management & LTV maximization', icon: <UserCircle size={24} />, color: '#a855f7' },
  { id: 'analytics', name: 'Analytics', category: 'business', description: 'Data analysis & PDCA cycle', icon: <PieChart size={24} />, color: '#3b82f6' },
  { id: 'youtube', name: 'YouTube', category: 'business', description: 'Channel optimization & content strategy', icon: <Youtube size={24} />, color: '#ef4444' },
];

export default function AgentSelectorWidget() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'coding' | 'business'>('all');

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || agent.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const codingAgents = filteredAgents.filter(a => a.category === 'coding');
  const businessAgents = filteredAgents.filter(a => a.category === 'business');

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: '800',
          color: 'white',
          margin: '0 0 8px 0',
          textShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}>
          Miyabi Agent Selector
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'rgba(255,255,255,0.9)',
          margin: '0',
        }}>
          Choose from 21 powerful AI agents for your project
        </p>
      </div>

      {/* Search and Filter */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
          <Search size={20} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
          }} />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              fontSize: '14px',
              border: 'none',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.95)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'coding', 'business'] as const).map(category => (
            <button
              key={category}
              onClick={() => setFilterCategory(category)}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '12px',
                background: filterCategory === category
                  ? 'white'
                  : 'rgba(255,255,255,0.2)',
                color: filterCategory === category
                  ? '#667eea'
                  : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
                boxShadow: filterCategory === category
                  ? '0 4px 12px rgba(0,0,0,0.15)'
                  : 'none',
              }}
            >
              {category} {category !== 'all' && `(${category === 'coding' ? codingAgents.length : businessAgents.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Coding Agents */}
      {(filterCategory === 'all' || filterCategory === 'coding') && codingAgents.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Code size={20} />
            Coding Agents ({codingAgents.length})
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {codingAgents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                selected={selectedAgent?.id === agent.id}
                onClick={() => setSelectedAgent(agent)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Business Agents */}
      {(filterCategory === 'all' || filterCategory === 'business') && businessAgents.length > 0 && (
        <div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Briefcase size={20} />
            Business Agents ({businessAgents.length})
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {businessAgents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                selected={selectedAgent?.id === agent.id}
                onClick={() => setSelectedAgent(agent)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Selected Agent Details */}
      {selectedAgent && (
        <div style={{
          marginTop: '32px',
          padding: '24px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              background: selectedAgent.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}>
              {selectedAgent.icon}
            </div>
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0', color: '#111827' }}>
                {selectedAgent.name}
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                {selectedAgent.category === 'coding' ? 'Coding Agent' : 'Business Agent'}
              </p>
            </div>
          </div>
          <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px 0' }}>
            {selectedAgent.description}
          </p>
          <button style={{
            width: '100%',
            padding: '14px',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '8px',
            background: selectedAgent.color,
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Execute {selectedAgent.name}
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
        }}>
          <p style={{ fontSize: '18px', color: 'white', margin: '0' }}>
            No agents found matching "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}

function AgentCard({ agent, selected, onClick }: { agent: Agent; selected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: selected ? 'white' : 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered || selected ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: selected
          ? `0 12px 24px ${agent.color}40`
          : hovered
            ? '0 8px 16px rgba(0,0,0,0.15)'
            : '0 4px 8px rgba(0,0,0,0.1)',
        border: selected ? `2px solid ${agent.color}` : '2px solid transparent',
      }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '10px',
        background: agent.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        marginBottom: '12px',
        transition: 'transform 0.3s',
        transform: hovered ? 'rotate(5deg)' : 'rotate(0deg)',
      }}>
        {agent.icon}
      </div>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '700',
        color: '#111827',
        margin: '0 0 8px 0',
      }}>
        {agent.name}
      </h3>
      <p style={{
        fontSize: '14px',
        color: '#6b7280',
        margin: '0',
        lineHeight: '1.4',
      }}>
        {agent.description}
      </p>
    </div>
  );
}

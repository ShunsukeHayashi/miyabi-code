/**
 * Divisions Data
 * Issue: #1016 - Pantheon Webapp Divisions Page
 */

import type { Division } from '../types/advisor';

export interface DivisionDetail {
  id: string;
  name: Division;
  nameJa: string;
  icon: string;
  color: string;
  colorHex: string;
  description: string;
  philosophy: string;
  useCases: string[];
  keyStrengths: string[];
  memberCount: number;
}

export const divisions: DivisionDetail[] = [
  {
    id: 'divine-council',
    name: 'Divine Council',
    nameJa: '三神会議',
    icon: '⚡',
    color: 'amber',
    colorHex: '#F59E0B',
    description: 'The supreme advisory trinity providing ultimate strategic guidance through the combined wisdom of history\'s most influential strategists.',
    philosophy: 'Strategic thinking and decisive action form the foundation of all successful endeavors. The greatest victories are won through preparation, cunning, and the mastery of both self and circumstance.',
    useCases: [
      'Critical strategic decisions requiring multi-dimensional analysis',
      'Competitive positioning and market domination strategies',
      'High-stakes negotiations and power dynamics',
      'Crisis management and survival strategies',
    ],
    keyStrengths: [
      'Strategic Planning',
      'Tactical Execution',
      'Power Dynamics',
      'Competitive Analysis',
    ],
    memberCount: 3,
  },
  {
    id: 'strategy-philosophy',
    name: 'Strategy & Philosophy',
    nameJa: '戦略・哲学',
    icon: '🎯',
    color: 'red',
    colorHex: '#EF4444',
    description: 'Masters of warfare, political theory, and philosophical thought who shaped the foundations of strategic thinking.',
    philosophy: 'Deep thinking and principled strategy guide wise decision-making. True wisdom comes from understanding both the eternal laws of nature and the practical realities of human affairs.',
    useCases: [
      'Long-term strategic planning and goal setting',
      'Ethical decision-making frameworks',
      'Organizational culture development',
      'Educational and mentorship programs',
    ],
    keyStrengths: [
      'Logical Analysis',
      'Ethical Frameworks',
      'Long-term Vision',
      'Wisdom Synthesis',
    ],
    memberCount: 4,
  },
  {
    id: 'innovation-technology',
    name: 'Innovation & Technology',
    nameJa: '革新・技術',
    icon: '💡',
    color: 'blue',
    colorHex: '#3B82F6',
    description: 'Pioneers who shaped science, art, and human progress through revolutionary thinking and relentless innovation.',
    philosophy: 'Innovation drives progress, and technology shapes the future. The intersection of creativity and engineering unlocks human potential beyond all previous limits.',
    useCases: [
      'Product development and innovation strategy',
      'Technology roadmap planning',
      'Research and development direction',
      'User experience design',
    ],
    keyStrengths: [
      'Creative Innovation',
      'Technical Excellence',
      'Product Vision',
      'Future Thinking',
    ],
    memberCount: 4,
  },
  {
    id: 'leadership-management',
    name: 'Leadership & Management',
    nameJa: '統率・経営',
    icon: '👑',
    color: 'purple',
    colorHex: '#8B5CF6',
    description: 'Legendary leaders who transformed nations, built empires, and revolutionized industries through exceptional leadership.',
    philosophy: 'Great leaders inspire action and achieve extraordinary results. Leadership is not about power over others, but about empowering others to achieve the impossible.',
    useCases: [
      'Executive leadership development',
      'Organizational transformation',
      'Team building and motivation',
      'Crisis leadership',
    ],
    keyStrengths: [
      'Inspirational Leadership',
      'Crisis Management',
      'Organization Building',
      'People Development',
    ],
    memberCount: 4,
  },
  {
    id: 'art-communication',
    name: 'Art & Communication',
    nameJa: '芸術・伝達',
    icon: '🎨',
    color: 'green',
    colorHex: '#10B981',
    description: 'Masters of expression, persuasion, and creative vision who moved hearts and minds across generations.',
    philosophy: 'Effective communication and artistic expression move hearts and minds. The power to tell stories, create beauty, and connect emotionally is the foundation of all lasting influence.',
    useCases: [
      'Brand storytelling and messaging',
      'Public speaking and presentations',
      'Marketing and advertising strategy',
      'Content creation and creative direction',
    ],
    keyStrengths: [
      'Storytelling',
      'Persuasion',
      'Visual Communication',
      'Emotional Connection',
    ],
    memberCount: 4,
  },
];

export function getDivisionById(id: string): DivisionDetail | undefined {
  return divisions.find((d) => d.id === id);
}

export function getDivisionByName(name: Division): DivisionDetail | undefined {
  return divisions.find((d) => d.name === name);
}

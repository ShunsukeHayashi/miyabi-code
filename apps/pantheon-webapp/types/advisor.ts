/**
 * Advisor Types
 * Issue: #1014 - Pantheon Webapp Advisors Page
 */

export interface Advisor {
  id: string;
  name: string;
  nameJa: string;
  division: Division;
  era: string;
  eraYears: string;
  country: string;
  countryFlag: string;
  portrait?: string;
  specialties: string[];
  principles: string[];
  quote: string;
  description: string;
  influenceScore: number;
}

export type Division =
  | 'Divine Council'
  | 'Strategy & Philosophy'
  | 'Innovation & Technology'
  | 'Leadership & Management'
  | 'Art & Communication';

export interface DivisionInfo {
  name: Division;
  nameJa: string;
  icon: string;
  color: string;
  description: string;
}

export interface AdvisorsPageState {
  viewMode: 'grid' | 'list';
  searchQuery: string;
  selectedDivisions: Division[];
  sortBy: 'name' | 'era' | 'division' | 'influence';
  sortOrder: 'asc' | 'desc';
  comparisonIds: string[];
}

export const DIVISIONS: DivisionInfo[] = [
  {
    name: 'Divine Council',
    nameJa: '三神会議',
    icon: '⚡',
    color: 'amber',
    description: 'The supreme advisory trinity',
  },
  {
    name: 'Strategy & Philosophy',
    nameJa: '戦略・哲学',
    icon: '🎯',
    color: 'red',
    description: 'Masters of warfare and thought',
  },
  {
    name: 'Innovation & Technology',
    nameJa: '革新・技術',
    icon: '💡',
    color: 'blue',
    description: 'Pioneers of progress',
  },
  {
    name: 'Leadership & Management',
    nameJa: '統率・経営',
    icon: '👑',
    color: 'purple',
    description: 'Legendary leaders',
  },
  {
    name: 'Art & Communication',
    nameJa: '芸術・伝達',
    icon: '🎨',
    color: 'green',
    description: 'Masters of expression',
  },
];

/**
 * Agent Definitions Index
 * @module agents
 */

export * from './coding.js';
export * from './business.js';

import { CodingAgents } from './coding.js';
import { BusinessAgents } from './business.js';
import type { AgentDefinition, AgentType } from '../types.js';

/**
 * All available agents
 */
export const AllAgents = {
  ...CodingAgents,
  ...BusinessAgents,
} as const;

/**
 * Get agent definition by type
 */
export function getAgentDefinition(agentType: AgentType): AgentDefinition {
  const agent = AllAgents[agentType];
  if (!agent) {
    throw new Error(`Unknown agent type: ${agentType}`);
  }
  return agent;
}

/**
 * List all available agent types
 */
export function listAgentTypes(): AgentType[] {
  return Object.keys(AllAgents) as AgentType[];
}

/**
 * List agents by category
 */
export function listAgentsByCategory(category: 'coding' | 'business'): AgentType[] {
  return Object.entries(AllAgents)
    .filter(([_, agent]) => agent.category === category)
    .map(([name]) => name as AgentType);
}

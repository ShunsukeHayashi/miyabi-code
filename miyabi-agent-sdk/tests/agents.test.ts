/**
 * Agent Definition Tests
 * @module tests/agents
 */

import { describe, it, expect } from 'vitest';
import {
  AllAgents,
  getAgentDefinition,
  listAgentTypes,
  listAgentsByCategory,
  CodingAgents,
  BusinessAgents,
} from '../src/agents/index.js';

describe('Agent Definitions', () => {
  describe('CodingAgents', () => {
    it('should have 7 coding agents', () => {
      expect(Object.keys(CodingAgents)).toHaveLength(7);
    });

    it('should include all expected coding agents', () => {
      const expectedAgents = [
        'CoordinatorAgent',
        'CodeGenAgent',
        'ReviewAgent',
        'IssueAgent',
        'PRAgent',
        'DeploymentAgent',
        'RefresherAgent',
      ];

      expectedAgents.forEach(agent => {
        expect(CodingAgents).toHaveProperty(agent);
      });
    });

    it('should have correct category for all coding agents', () => {
      Object.values(CodingAgents).forEach(agent => {
        expect(agent.category).toBe('coding');
      });
    });
  });

  describe('BusinessAgents', () => {
    it('should have 18 business agents', () => {
      expect(Object.keys(BusinessAgents)).toHaveLength(18);
    });

    it('should include key business agents', () => {
      const expectedAgents = [
        'AIEntrepreneurAgent',
        'SelfAnalysisAgent',
        'MarketResearchAgent',
        'PersonaAgent',
        'ProductConceptAgent',
        'ProductDesignAgent',
        'ContentCreationAgent',
        'MarketingAgent',
        'SalesAgent',
        'CRMAgent',
        'AnalyticsAgent',
        'YouTubeAgent',
        'ImageGenAgent',
      ];

      expectedAgents.forEach(agent => {
        expect(BusinessAgents).toHaveProperty(agent);
      });
    });

    it('should have correct category for all business agents', () => {
      Object.values(BusinessAgents).forEach(agent => {
        expect(agent.category).toBe('business');
      });
    });
  });

  describe('AllAgents', () => {
    it('should have 25 total agents', () => {
      expect(Object.keys(AllAgents)).toHaveLength(25);
    });

    it('should combine coding and business agents', () => {
      const codingCount = Object.keys(CodingAgents).length;
      const businessCount = Object.keys(BusinessAgents).length;
      const allCount = Object.keys(AllAgents).length;

      expect(allCount).toBe(codingCount + businessCount);
    });
  });
});

describe('getAgentDefinition', () => {
  it('should return agent definition for valid type', () => {
    const agent = getAgentDefinition('CodeGenAgent');

    expect(agent.name).toBe('CodeGenAgent');
    expect(agent.category).toBe('coding');
    expect(agent.capabilities).toBeDefined();
    expect(agent.inputSchema).toBeDefined();
    expect(agent.outputSchema).toBeDefined();
  });

  it('should throw for unknown agent type', () => {
    expect(() => getAgentDefinition('UnknownAgent' as any)).toThrow(
      'Unknown agent type: UnknownAgent'
    );
  });

  it('should return correct schema for each agent', () => {
    const agentTypes = listAgentTypes();

    agentTypes.forEach(type => {
      const agent = getAgentDefinition(type);
      expect(agent.inputSchema).toBeDefined();
      expect(agent.outputSchema).toBeDefined();
    });
  });
});

describe('listAgentTypes', () => {
  it('should return all agent types', () => {
    const types = listAgentTypes();

    expect(types.length).toBe(25);
    expect(types).toContain('CodeGenAgent');
    expect(types).toContain('AIEntrepreneurAgent');
  });
});

describe('listAgentsByCategory', () => {
  it('should return only coding agents', () => {
    const codingAgents = listAgentsByCategory('coding');

    expect(codingAgents).toHaveLength(7);
    codingAgents.forEach(type => {
      const agent = getAgentDefinition(type);
      expect(agent.category).toBe('coding');
    });
  });

  it('should return only business agents', () => {
    const businessAgents = listAgentsByCategory('business');

    expect(businessAgents).toHaveLength(18);
    businessAgents.forEach(type => {
      const agent = getAgentDefinition(type);
      expect(agent.category).toBe('business');
    });
  });
});

describe('Agent Input/Output Schemas', () => {
  it('CodeGenAgent should validate correct input', () => {
    const agent = getAgentDefinition('CodeGenAgent');
    const input = {
      issueNumber: 123,
      language: 'rust',
      description: 'Fix the bug',
    };

    const result = agent.inputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('CodeGenAgent should reject invalid input', () => {
    const agent = getAgentDefinition('CodeGenAgent');
    const input = {
      // Missing required issueNumber
      language: 'rust',
    };

    const result = agent.inputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('ReviewAgent should validate correct input', () => {
    const agent = getAgentDefinition('ReviewAgent');
    const input = {
      files: [
        { path: 'src/main.rs', content: 'fn main() {}' },
      ],
    };

    const result = agent.inputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('IssueAgent should use default values', () => {
    const agent = getAgentDefinition('IssueAgent');
    const input = {};

    const result = agent.inputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action).toBe('analyze');
    }
  });

  it('MarketResearchAgent should validate business input', () => {
    const agent = getAgentDefinition('MarketResearchAgent');
    const input = {
      industry: 'SaaS',
      region: 'Japan',
    };

    const result = agent.inputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

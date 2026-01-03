/**
 * Business Agent Definitions
 * @module agents/business
 */

import { z } from 'zod';
import type { AgentDefinition } from '../types.js';

// ============================================================================
// AIEntrepreneurAgent
// ============================================================================

export const AIEntrepreneurAgent: AgentDefinition = {
  name: 'AIEntrepreneurAgent',
  category: 'business',
  description: 'Comprehensive business planning and startup strategy',
  capabilities: [
    'Business model canvas creation',
    'Market opportunity analysis',
    'Funding strategy development',
    'Growth planning',
  ],
  inputSchema: z.object({
    businessIdea: z.string(),
    targetMarket: z.string().optional(),
    budget: z.number().optional(),
  }),
  outputSchema: z.object({
    businessPlan: z.string(),
    recommendations: z.array(z.string()),
    nextSteps: z.array(z.string()),
  }),
};

// ============================================================================
// SelfAnalysisAgent
// ============================================================================

export const SelfAnalysisAgent: AgentDefinition = {
  name: 'SelfAnalysisAgent',
  category: 'business',
  description: 'Career, skills, and achievements analysis',
  capabilities: [
    'Skills inventory',
    'Career path analysis',
    'Strengths/weaknesses identification',
    'Professional development planning',
  ],
  inputSchema: z.object({
    resume: z.string().optional(),
    skills: z.array(z.string()).optional(),
    goals: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    skillsAnalysis: z.record(z.number()),
    careerRecommendations: z.array(z.string()),
    developmentPlan: z.string(),
  }),
};

// ============================================================================
// MarketResearchAgent
// ============================================================================

export const MarketResearchAgent: AgentDefinition = {
  name: 'MarketResearchAgent',
  category: 'business',
  description: 'Market trends and competitive analysis',
  capabilities: [
    'TAM/SAM/SOM calculation',
    'Competitor analysis (20+ companies)',
    'Market trend identification',
    'SWOT analysis',
  ],
  inputSchema: z.object({
    industry: z.string(),
    region: z.string().optional(),
    competitors: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    marketSize: z.object({
      tam: z.number(),
      sam: z.number(),
      som: z.number(),
    }),
    competitors: z.array(z.object({
      name: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    })),
    trends: z.array(z.string()),
  }),
};

// ============================================================================
// PersonaAgent
// ============================================================================

export const PersonaAgent: AgentDefinition = {
  name: 'PersonaAgent',
  category: 'business',
  description: 'Target customer persona and journey design',
  capabilities: [
    'Create 3-5 detailed personas',
    'Customer journey mapping',
    'Pain point identification',
    'Behavior analysis',
  ],
  inputSchema: z.object({
    product: z.string(),
    targetDemographic: z.string().optional(),
    existingData: z.record(z.unknown()).optional(),
  }),
  outputSchema: z.object({
    personas: z.array(z.object({
      name: z.string(),
      age: z.number(),
      occupation: z.string(),
      goals: z.array(z.string()),
      painPoints: z.array(z.string()),
      behaviors: z.array(z.string()),
    })),
    journeyMap: z.record(z.array(z.string())),
  }),
};

// ============================================================================
// ProductConceptAgent
// ============================================================================

export const ProductConceptAgent: AgentDefinition = {
  name: 'ProductConceptAgent',
  category: 'business',
  description: 'USP, revenue model, and business model canvas',
  capabilities: [
    'Unique selling proposition development',
    'Revenue model design',
    'Business model canvas',
    'Value proposition canvas',
  ],
  inputSchema: z.object({
    productIdea: z.string(),
    targetMarket: z.string(),
    competitors: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    usp: z.string(),
    revenueModel: z.string(),
    businessModelCanvas: z.record(z.array(z.string())),
    valueProposition: z.string(),
  }),
};

// ============================================================================
// ProductDesignAgent
// ============================================================================

export const ProductDesignAgent: AgentDefinition = {
  name: 'ProductDesignAgent',
  category: 'business',
  description: '6-month content planning and MVP definition',
  capabilities: [
    'MVP feature prioritization',
    'Technical stack recommendation',
    'Sprint planning',
    'Content roadmap creation',
  ],
  inputSchema: z.object({
    product: z.string(),
    features: z.array(z.string()),
    timeline: z.number().default(6),
  }),
  outputSchema: z.object({
    mvpFeatures: z.array(z.string()),
    techStack: z.array(z.string()),
    sprints: z.array(z.object({
      number: z.number(),
      goals: z.array(z.string()),
      deliverables: z.array(z.string()),
    })),
  }),
};

// ============================================================================
// Remaining Business Agents (Simplified definitions)
// ============================================================================

export const ContentCreationAgent: AgentDefinition = {
  name: 'ContentCreationAgent',
  category: 'business',
  description: 'Video, article, and educational content creation',
  capabilities: ['Video scripting', 'Article writing', 'Educational content', 'Content repurposing'],
  inputSchema: z.object({ topic: z.string(), format: z.string(), audience: z.string().optional() }),
  outputSchema: z.object({ content: z.string(), metadata: z.record(z.unknown()) }),
};

export const FunnelDesignAgent: AgentDefinition = {
  name: 'FunnelDesignAgent',
  category: 'business',
  description: 'Customer acquisition funnel optimization',
  capabilities: ['Funnel design', 'Conversion optimization', 'A/B test planning', 'Lead nurturing'],
  inputSchema: z.object({ product: z.string(), currentFunnel: z.string().optional() }),
  outputSchema: z.object({ funnel: z.array(z.object({ stage: z.string(), actions: z.array(z.string()) })) }),
};

export const SNSStrategyAgent: AgentDefinition = {
  name: 'SNSStrategyAgent',
  category: 'business',
  description: 'Social media strategy and content calendar',
  capabilities: ['Platform strategy', 'Content calendar', 'Engagement tactics', 'Influencer identification'],
  inputSchema: z.object({ brand: z.string(), platforms: z.array(z.string()) }),
  outputSchema: z.object({ strategy: z.record(z.string()), calendar: z.array(z.record(z.string())) }),
};

export const MarketingAgent: AgentDefinition = {
  name: 'MarketingAgent',
  category: 'business',
  description: 'Advertising, SEO, and marketing campaign execution',
  capabilities: ['Ad campaign design', 'SEO optimization', 'Email marketing', 'Marketing automation'],
  inputSchema: z.object({ campaign: z.string(), budget: z.number().optional(), channels: z.array(z.string()) }),
  outputSchema: z.object({ campaignPlan: z.string(), kpis: z.record(z.number()) }),
};

export const SalesAgent: AgentDefinition = {
  name: 'SalesAgent',
  category: 'business',
  description: 'Lead conversion and sales process optimization',
  capabilities: ['Sales script generation', 'Lead scoring', 'Pipeline management', 'Objection handling'],
  inputSchema: z.object({ product: z.string(), leads: z.array(z.record(z.unknown())).optional() }),
  outputSchema: z.object({ scripts: z.array(z.string()), process: z.string() }),
};

export const CRMAgent: AgentDefinition = {
  name: 'CRMAgent',
  category: 'business',
  description: 'Customer satisfaction and LTV maximization',
  capabilities: ['Customer segmentation', 'Retention strategies', 'NPS improvement', 'Churn prediction'],
  inputSchema: z.object({ customerData: z.array(z.record(z.unknown())).optional() }),
  outputSchema: z.object({ segments: z.array(z.string()), recommendations: z.array(z.string()) }),
};

export const AnalyticsAgent: AgentDefinition = {
  name: 'AnalyticsAgent',
  category: 'business',
  description: 'Data analysis and PDCA cycle execution',
  capabilities: ['KPI dashboard design', 'Cohort analysis', 'A/B test analysis', 'Data visualization'],
  inputSchema: z.object({ data: z.record(z.unknown()), metrics: z.array(z.string()) }),
  outputSchema: z.object({ insights: z.array(z.string()), recommendations: z.array(z.string()) }),
};

export const YouTubeAgent: AgentDefinition = {
  name: 'YouTubeAgent',
  category: 'business',
  description: 'YouTube channel optimization and content strategy',
  capabilities: ['Channel concept', 'Thumbnail optimization', 'SEO for videos', 'Analytics interpretation'],
  inputSchema: z.object({ channelTopic: z.string(), videos: z.array(z.string()).optional() }),
  outputSchema: z.object({ strategy: z.string(), contentCalendar: z.array(z.record(z.string())) }),
};

export const JonathanIveDesignAgent: AgentDefinition = {
  name: 'JonathanIveDesignAgent',
  category: 'business',
  description: 'Minimalist design philosophy and UI/UX excellence',
  capabilities: ['Minimalist design', 'Color palette generation', 'Typography system', 'Design critique'],
  inputSchema: z.object({ designBrief: z.string(), existingDesign: z.string().optional() }),
  outputSchema: z.object({ designSystem: z.record(z.unknown()), recommendations: z.array(z.string()) }),
};

export const NoteAgent: AgentDefinition = {
  name: 'NoteAgent',
  category: 'business',
  description: 'note.com article creation with emotional design',
  capabilities: ['Emotional storytelling', 'Hashtag optimization', 'Engagement maximization', 'Series planning'],
  inputSchema: z.object({ topic: z.string(), emotion: z.string().optional() }),
  outputSchema: z.object({ article: z.string(), hashtags: z.array(z.string()) }),
};

export const ImageGenAgent: AgentDefinition = {
  name: 'ImageGenAgent',
  category: 'business',
  description: 'Text-to-image and image-to-image generation',
  capabilities: ['Prompt engineering', 'Style transfer', 'Image enhancement', 'Brand-consistent imagery'],
  inputSchema: z.object({ prompt: z.string(), style: z.string().optional(), dimensions: z.object({ width: z.number(), height: z.number() }).optional() }),
  outputSchema: z.object({ imageUrl: z.string(), metadata: z.record(z.unknown()) }),
};

export const HonokaAgent: AgentDefinition = {
  name: 'HonokaAgent',
  category: 'business',
  description: 'Online course creation and content sales',
  capabilities: ['Course design', 'Pricing strategy', 'Launch planning', 'Student engagement'],
  inputSchema: z.object({ courseTopic: z.string(), targetAudience: z.string(), modules: z.array(z.string()).optional() }),
  outputSchema: z.object({ courseOutline: z.array(z.object({ module: z.string(), lessons: z.array(z.string()) })), pricing: z.number() }),
};

export const CourseDesignerAgent: AgentDefinition = {
  name: 'CourseDesignerAgent',
  category: 'business',
  description: 'AI-powered comprehensive course content generation using Google Generative AI',
  capabilities: [
    'Intelligent course structure generation',
    'Multi-modal content creation (text, video scripts, exercises)',
    'Assessment and quiz generation',
    'Adaptive content optimization',
    'Learning analytics integration',
    'SCORM compatibility',
    'Multi-language support',
    'Accessibility compliance (WCAG 2.1)',
  ],
  inputSchema: z.object({
    topic: z.string().describe('Main course topic'),
    targetAudience: z.string().describe('Target student demographic and skill level'),
    duration: z.object({
      weeks: z.number().min(1).max(52).default(8),
      hoursPerWeek: z.number().min(1).max(40).default(3),
    }).optional().describe('Course duration and time commitment'),
    learningObjectives: z.array(z.string()).optional().describe('Specific learning goals'),
    prerequisites: z.array(z.string()).optional().describe('Required knowledge or skills'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    format: z.object({
      includeVideos: z.boolean().default(true),
      includeAssessments: z.boolean().default(true),
      includeProjects: z.boolean().default(true),
      includeDiscussions: z.boolean().default(true),
    }).optional().describe('Content formats to include'),
    preferences: z.object({
      language: z.string().default('en'),
      tone: z.enum(['formal', 'casual', 'academic', 'conversational']).default('conversational'),
      interactivity: z.enum(['low', 'medium', 'high']).default('medium'),
    }).optional().describe('Content generation preferences'),
  }),
  outputSchema: z.object({
    courseStructure: z.object({
      title: z.string(),
      description: z.string(),
      duration: z.object({
        weeks: z.number(),
        totalHours: z.number(),
      }),
      modules: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        learningObjectives: z.array(z.string()),
        estimatedHours: z.number(),
        lessons: z.array(z.object({
          id: z.string(),
          title: z.string(),
          type: z.enum(['video', 'text', 'interactive', 'assessment', 'project']),
          content: z.string(),
          duration: z.number(),
          resources: z.array(z.string()).optional(),
        })),
      })),
    }),
    content: z.object({
      videoScripts: z.array(z.object({
        lessonId: z.string(),
        title: z.string(),
        script: z.string(),
        visualCues: z.array(z.string()).optional(),
        duration: z.number(),
      })).optional(),
      textContent: z.array(z.object({
        lessonId: z.string(),
        title: z.string(),
        content: z.string(),
        readingTime: z.number(),
      })).optional(),
      exercises: z.array(z.object({
        lessonId: z.string(),
        type: z.enum(['practice', 'project', 'discussion']),
        title: z.string(),
        instructions: z.string(),
        expectedOutput: z.string(),
        rubric: z.string().optional(),
      })).optional(),
    }),
    assessments: z.array(z.object({
      moduleId: z.string(),
      type: z.enum(['quiz', 'assignment', 'project', 'peer_review']),
      title: z.string(),
      description: z.string(),
      questions: z.array(z.object({
        id: z.string(),
        type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'essay', 'code']),
        question: z.string(),
        options: z.array(z.string()).optional(),
        correctAnswer: z.string(),
        explanation: z.string(),
        difficulty: z.enum(['easy', 'medium', 'hard']),
      })),
      passingScore: z.number().min(0).max(100),
    })).optional(),
    metadata: z.object({
      generationTimestamp: z.string(),
      aiModelUsed: z.string(),
      contentQualityScore: z.number().min(0).max(100),
      estimatedCompletionRate: z.number().min(0).max(100),
      tags: z.array(z.string()),
      scormCompatible: z.boolean(),
      accessibilityCompliant: z.boolean(),
    }),
    recommendations: z.object({
      contentImprovements: z.array(z.string()),
      engagementOptimizations: z.array(z.string()),
      learningPathSuggestions: z.array(z.string()),
      nextSteps: z.array(z.string()),
    }),
  }),
};

// ============================================================================
// ProgressTrackerAgent
// ============================================================================

export const ProgressTrackerAgent: AgentDefinition = {
  name: 'ProgressTrackerAgent',
  category: 'business',
  description: 'AI-powered learning analytics and progress optimization agent',
  capabilities: [
    'Intelligent progress analysis',
    'Advanced learning analytics',
    'Adaptive learning intelligence',
    'Predictive analytics',
  ],
  inputSchema: z.object({
    studentId: z.string().optional(),
    courseId: z.string().optional(),
    timeRange: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
    scope: z.enum(['student', 'course', 'system']).default('system'),
  }),
  outputSchema: z.object({
    insights: z.array(z.object({
      id: z.string(),
      type: z.string(),
      title: z.string(),
      description: z.string(),
      priority: z.string(),
    })),
    metrics: z.record(z.unknown()).optional(),
    recommendations: z.array(z.unknown()).optional(),
  }),
};

// ============================================================================
// Export All Business Agents
// ============================================================================

export const BusinessAgents = {
  AIEntrepreneurAgent,
  SelfAnalysisAgent,
  MarketResearchAgent,
  PersonaAgent,
  ProductConceptAgent,
  ProductDesignAgent,
  ContentCreationAgent,
  FunnelDesignAgent,
  SNSStrategyAgent,
  MarketingAgent,
  SalesAgent,
  CRMAgent,
  AnalyticsAgent,
  YouTubeAgent,
  JonathanIveDesignAgent,
  NoteAgent,
  ImageGenAgent,
  HonokaAgent,
  CourseDesignerAgent,
  ProgressTrackerAgent,
} as const;

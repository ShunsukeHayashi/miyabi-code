/**
 * RequirementsAgent - Comprehensive Requirements Analysis
 *
 * Generates detailed business and technical requirements before implementation:
 * - Business Requirements Document (BRD)
 * - Technical Requirements Document (TRD)
 * - User Personas
 * - Success Metrics & KPIs
 * - Competitive Analysis
 * - Architecture Recommendations
 *
 * Phase A: Requirements & Planning (Framework Section 2.1)
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Main entry point for requirements analysis
 */
export async function analyzeRequirements(userRequest) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 RequirementsAgent - Comprehensive Requirements Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const outputDir = path.join(
    new URL('.', import.meta.url).pathname,
    '../../output/requirements',
    sanitizeFileName(userRequest.slice(0, 30))
  );

  await fs.mkdir(outputDir, { recursive: true });

  console.log('📊 Analyzing requirements...\n');

  // 1. Business Requirements Analysis
  console.log('  1️⃣  Analyzing Business Requirements...');
  const businessReqs = await analyzeBusinessRequirements(userRequest, outputDir);

  // 2. Technical Requirements Analysis
  console.log('  2️⃣  Analyzing Technical Requirements...');
  const technicalReqs = await analyzeTechnicalRequirements(userRequest, outputDir);

  // 3. User Persona Generation
  console.log('  3️⃣  Generating User Personas...');
  const personas = await generateUserPersonas(userRequest, outputDir);

  // 4. Success Metrics Definition
  console.log('  4️⃣  Defining Success Metrics & KPIs...');
  const metrics = await defineSuccessMetrics(userRequest, outputDir);

  // 5. Competitive Analysis
  console.log('  5️⃣  Conducting Competitive Analysis...');
  const competitive = await analyzeCompetition(userRequest, outputDir);

  // 6. Architecture Recommendations
  console.log('  6️⃣  Recommending Architecture Patterns...\n');
  const architecture = await recommendArchitecture(userRequest, businessReqs, technicalReqs, outputDir);

  console.log('✅ Requirements analysis complete!\n');

  return {
    output_directory: outputDir,
    business_requirements: businessReqs,
    technical_requirements: technicalReqs,
    user_personas: personas,
    success_metrics: metrics,
    competitive_analysis: competitive,
    architecture_recommendation: architecture,
    generated_at: new Date().toISOString(),
    documents: await listGeneratedDocs(outputDir)
  };
}

/**
 * 1. Business Requirements Analysis
 */
async function analyzeBusinessRequirements(userRequest, outputDir) {
  const docsDir = path.join(outputDir, 'business');
  await fs.mkdir(docsDir, { recursive: true });

  // Extract business context
  const context = extractBusinessContext(userRequest);

  // Generate BRD
  const brd = generateBRD(context, userRequest);
  await fs.writeFile(path.join(docsDir, 'BRD.md'), brd);

  // Generate Executive Summary
  const execSummary = generateExecutiveSummary(context, userRequest);
  await fs.writeFile(path.join(docsDir, 'EXECUTIVE_SUMMARY.md'), execSummary);

  return {
    pain_points: context.pain_points,
    value_proposition: context.value_proposition,
    business_goals: context.business_goals,
    target_market: context.target_market,
    brd_file: 'BRD.md',
    executive_summary_file: 'EXECUTIVE_SUMMARY.md'
  };
}

/**
 * Extract business context from user request
 */
function extractBusinessContext(userRequest) {
  const requestLower = userRequest.toLowerCase();

  // Pain points inference
  const pain_points = [];
  if (requestLower.includes('task') || requestLower.includes('タスク') || requestLower.includes('todo')) {
    pain_points.push('Manual task tracking is time-consuming and error-prone');
    pain_points.push('Lack of visibility into team member workloads');
    pain_points.push('Missed deadlines due to poor task management');
  }
  if (requestLower.includes('calendar') || requestLower.includes('カレンダー') || requestLower.includes('schedule')) {
    pain_points.push('Scheduling conflicts and double-bookings');
    pain_points.push('Difficulty coordinating across time zones');
    pain_points.push('Manual calendar updates are tedious');
  }
  if (requestLower.includes('approval') || requestLower.includes('承認') || requestLower.includes('workflow')) {
    pain_points.push('Slow approval processes delay projects');
    pain_points.push('Lack of transparency in approval status');
    pain_points.push('Manual routing of approval requests');
  }
  if (requestLower.includes('notification') || requestLower.includes('通知') || requestLower.includes('alert')) {
    pain_points.push('Important updates get lost in chat');
    pain_points.push('No centralized notification system');
    pain_points.push('Users miss critical information');
  }

  // Default pain points
  if (pain_points.length === 0) {
    pain_points.push('Manual processes reduce team productivity');
    pain_points.push('Lack of automation in daily workflows');
    pain_points.push('Information is scattered across multiple tools');
  }

  // Value proposition
  const value_proposition = {
    primary: 'Automate repetitive workflows and centralize team communication',
    secondary: 'Increase productivity by reducing manual coordination overhead',
    differentiators: [
      'Seamless Lark integration - no new tools to learn',
      'Intelligent automation - reduces manual work by 50%+',
      'Real-time updates - everyone stays in sync'
    ]
  };

  // Business goals
  const business_goals = [
    'Improve team productivity by 30%',
    'Reduce time spent on manual coordination by 50%',
    'Increase user satisfaction with internal tools',
    'Enable scalable team collaboration as organization grows'
  ];

  // Target market
  const target_market = {
    primary: 'Teams using Lark for daily communication',
    segments: [
      'Small to medium teams (10-100 members)',
      'Remote-first or distributed teams',
      'Teams requiring workflow automation'
    ],
    industries: [
      'Technology & Software',
      'Professional Services',
      'Startups',
      'Enterprise departments'
    ]
  };

  return {
    pain_points,
    value_proposition,
    business_goals,
    target_market
  };
}

/**
 * Generate Business Requirements Document
 */
function generateBRD(context, userRequest) {
  let brd = '# Business Requirements Document (BRD)\n\n';
  brd += `**Project**: Lark Bot - ${userRequest}\n`;
  brd += `**Date**: ${new Date().toISOString().split('T')[0]}\n`;
  brd += `**Version**: 1.0\n\n`;
  brd += '---\n\n';

  brd += '## 1. Executive Summary\n\n';
  brd += `${context.value_proposition.primary}. ${context.value_proposition.secondary}.\n\n`;

  brd += '## 2. Business Problem\n\n';
  brd += '### Pain Points\n\n';
  context.pain_points.forEach((pain, idx) => {
    brd += `${idx + 1}. ${pain}\n`;
  });
  brd += '\n';

  brd += '## 3. Proposed Solution\n\n';
  brd += `**Solution**: ${userRequest}\n\n`;
  brd += '**Value Proposition**:\n';
  brd += `- **Primary**: ${context.value_proposition.primary}\n`;
  brd += `- **Secondary**: ${context.value_proposition.secondary}\n\n`;
  brd += '**Key Differentiators**:\n';
  context.value_proposition.differentiators.forEach((diff, idx) => {
    brd += `${idx + 1}. ${diff}\n`;
  });
  brd += '\n';

  brd += '## 4. Business Goals\n\n';
  context.business_goals.forEach((goal, idx) => {
    brd += `${idx + 1}. ${goal}\n`;
  });
  brd += '\n';

  brd += '## 5. Target Market\n\n';
  brd += `**Primary Market**: ${context.target_market.primary}\n\n`;
  brd += '**Market Segments**:\n';
  context.target_market.segments.forEach((seg, idx) => {
    brd += `- ${seg}\n`;
  });
  brd += '\n**Target Industries**:\n';
  context.target_market.industries.forEach((ind, idx) => {
    brd += `- ${ind}\n`;
  });
  brd += '\n';

  brd += '## 6. Stakeholders\n\n';
  brd += '| Role | Responsibility | Interest |\n';
  brd += '|------|----------------|----------|\n';
  brd += '| Product Owner | Define requirements and priorities | Deliver value to users |\n';
  brd += '| Development Team | Implement solution | Build quality product |\n';
  brd += '| End Users | Use the bot daily | Improve productivity |\n';
  brd += '| IT/Operations | Deploy and maintain | System reliability |\n\n';

  brd += '## 7. Success Criteria\n\n';
  brd += '- User adoption rate > 70% within first month\n';
  brd += '- User satisfaction score > 4.0/5.0\n';
  brd += '- Response time < 2 seconds for all commands\n';
  brd += '- System uptime > 99.5%\n';
  brd += '- Reduction in manual work time by 50%+\n\n';

  brd += '## 8. Constraints\n\n';
  brd += '- Must integrate with existing Lark platform\n';
  brd += '- Must comply with data privacy regulations\n';
  brd += '- Must be deployable within 2-4 weeks\n';
  brd += '- Budget: Development resources only (no additional licensing)\n\n';

  brd += '## 9. Assumptions\n\n';
  brd += '- Users have access to Lark\n';
  brd += '- Lark API is stable and reliable\n';
  brd += '- Users are familiar with basic bot interactions\n';
  brd += '- Organization supports bot adoption\n\n';

  brd += '## 10. Risks\n\n';
  brd += '| Risk | Impact | Probability | Mitigation |\n';
  brd += '|------|--------|-------------|------------|\n';
  brd += '| Low user adoption | High | Medium | Provide training and documentation |\n';
  brd += '| Lark API changes | Medium | Low | Monitor API updates, version management |\n';
  brd += '| Performance issues | High | Low | Load testing, scalable architecture |\n';
  brd += '| Data security concerns | High | Low | Implement encryption, access controls |\n\n';

  return brd;
}

/**
 * Generate Executive Summary
 */
function generateExecutiveSummary(context, userRequest) {
  let summary = '# Executive Summary\n\n';
  summary += `**Project**: ${userRequest}\n`;
  summary += `**Date**: ${new Date().toISOString().split('T')[0]}\n\n`;
  summary += '---\n\n';

  summary += '## Overview\n\n';
  summary += `${context.value_proposition.primary}. ${context.value_proposition.secondary}.\n\n`;

  summary += '## Business Impact\n\n';
  summary += '### Expected Benefits\n\n';
  summary += '- **Productivity**: 30% improvement in team efficiency\n';
  summary += '- **Time Savings**: 50% reduction in manual coordination\n';
  summary += '- **User Satisfaction**: Higher engagement with internal tools\n';
  summary += '- **Scalability**: Support team growth without proportional overhead\n\n';

  summary += '### Investment Required\n\n';
  summary += '- **Development**: 2-4 weeks\n';
  summary += '- **Resources**: 1-2 developers\n';
  summary += '- **Infrastructure**: Minimal (existing Lark platform)\n\n';

  summary += '### Timeline\n\n';
  summary += '- **Week 1**: Requirements & Design\n';
  summary += '- **Week 2-3**: Development & Testing\n';
  summary += '- **Week 4**: Deployment & Training\n\n';

  summary += '## Recommendation\n\n';
  summary += 'Proceed with development. The solution addresses critical pain points with minimal investment and high potential ROI.\n\n';

  return summary;
}

/**
 * 2. Technical Requirements Analysis
 */
async function analyzeTechnicalRequirements(userRequest, outputDir) {
  const docsDir = path.join(outputDir, 'technical');
  await fs.mkdir(docsDir, { recursive: true });

  // Extract technical context
  const techContext = extractTechnicalContext(userRequest);

  // Generate TRD
  const trd = generateTRD(techContext, userRequest);
  await fs.writeFile(path.join(docsDir, 'TRD.md'), trd);

  // Generate Non-Functional Requirements
  const nfr = generateNFR(techContext);
  await fs.writeFile(path.join(docsDir, 'NFR.md'), nfr);

  return {
    functional_requirements: techContext.functional,
    non_functional_requirements: techContext.non_functional,
    integrations: techContext.integrations,
    data_requirements: techContext.data_requirements,
    trd_file: 'TRD.md',
    nfr_file: 'NFR.md'
  };
}

/**
 * Extract technical context
 */
function extractTechnicalContext(userRequest) {
  const requestLower = userRequest.toLowerCase();

  // Functional requirements
  const functional = [];
  if (requestLower.includes('task') || requestLower.includes('タスク')) {
    functional.push('FR-001: Create new tasks via bot commands');
    functional.push('FR-002: List all tasks for a user');
    functional.push('FR-003: Update task status (pending/in-progress/completed)');
    functional.push('FR-004: Set task priorities and due dates');
    functional.push('FR-005: Send task reminders');
  }
  if (requestLower.includes('calendar') || requestLower.includes('カレンダー')) {
    functional.push('FR-001: Create calendar events');
    functional.push('FR-002: List upcoming events');
    functional.push('FR-003: Send event reminders');
    functional.push('FR-004: Handle event conflicts');
  }
  if (requestLower.includes('approval') || requestLower.includes('承認')) {
    functional.push('FR-001: Submit approval requests');
    functional.push('FR-002: Route requests to approvers');
    functional.push('FR-003: Approve/reject requests');
    functional.push('FR-004: Track approval status');
    functional.push('FR-005: Send approval notifications');
  }

  // Default functional requirements
  if (functional.length === 0) {
    functional.push('FR-001: Respond to user commands');
    functional.push('FR-002: Process and store data');
    functional.push('FR-003: Send notifications');
    functional.push('FR-004: Provide help/documentation');
  }

  // Non-functional requirements
  const non_functional = {
    performance: [
      'Response time < 2 seconds for 95% of requests',
      'Support up to 100 concurrent users',
      'Handle 1000 messages per day'
    ],
    reliability: [
      'System uptime > 99.5%',
      'Automatic error recovery',
      'Data backup every 24 hours'
    ],
    security: [
      'Webhook signature verification',
      'Input validation and sanitization',
      'Encrypted data storage',
      'Access control and authentication'
    ],
    scalability: [
      'Horizontal scaling capability',
      'Database optimization for growth',
      'Efficient resource utilization'
    ],
    usability: [
      'Intuitive command syntax',
      'Helpful error messages',
      'Comprehensive documentation',
      'Interactive card interfaces'
    ]
  };

  // Integrations
  const integrations = [
    {
      system: 'Lark Platform',
      purpose: 'Primary communication interface',
      apis: ['Messaging API', 'Event Subscription', 'Interactive Cards']
    },
    {
      system: 'Database',
      purpose: 'Persistent data storage',
      type: 'SQLite (dev) / PostgreSQL (prod)'
    }
  ];

  // Data requirements
  const data_requirements = {
    user_data: {
      fields: ['user_id', 'open_id', 'name', 'created_at'],
      retention: 'Indefinite (while active)',
      privacy: 'PII - requires encryption'
    },
    operational_data: {
      description: 'Tasks, events, approvals, messages',
      retention: '90 days (configurable)',
      backup: 'Daily'
    },
    logs: {
      types: ['Application logs', 'Error logs', 'Audit logs'],
      retention: '30 days',
      storage: 'Log aggregation service'
    }
  };

  return {
    functional,
    non_functional,
    integrations,
    data_requirements
  };
}

/**
 * Generate Technical Requirements Document
 */
function generateTRD(techContext, userRequest) {
  let trd = '# Technical Requirements Document (TRD)\n\n';
  trd += `**Project**: ${userRequest}\n`;
  trd += `**Date**: ${new Date().toISOString().split('T')[0]}\n`;
  trd += `**Version**: 1.0\n\n`;
  trd += '---\n\n';

  trd += '## 1. Functional Requirements\n\n';
  techContext.functional.forEach(fr => {
    trd += `- ${fr}\n`;
  });
  trd += '\n';

  trd += '## 2. System Architecture\n\n';
  trd += '**Architecture Pattern**: Event-Driven with Layered Services\n\n';
  trd += '```\n';
  trd += 'Lark Platform\n';
  trd += '     ↓ (events)\n';
  trd += 'Webhook Endpoint\n';
  trd += '     ↓\n';
  trd += 'Event Handler\n';
  trd += '     ↓\n';
  trd += 'Business Logic Layer\n';
  trd += '     ↓\n';
  trd += 'Data Access Layer\n';
  trd += '     ↓\n';
  trd += 'Database\n';
  trd += '```\n\n';

  trd += '## 3. Technology Stack\n\n';
  trd += '- **Runtime**: Node.js (v18+)\n';
  trd += '- **Framework**: Express.js\n';
  trd += '- **Database**: SQLite (dev), PostgreSQL (prod)\n';
  trd += '- **API Client**: Axios\n';
  trd += '- **Testing**: Vitest\n';
  trd += '- **Deployment**: Docker + Cloud Platform\n\n';

  trd += '## 4. API Integrations\n\n';
  techContext.integrations.forEach(integration => {
    trd += `### ${integration.system}\n`;
    trd += `**Purpose**: ${integration.purpose}\n`;
    if (integration.apis) {
      trd += `**APIs**: ${integration.apis.join(', ')}\n`;
    }
    if (integration.type) {
      trd += `**Type**: ${integration.type}\n`;
    }
    trd += '\n';
  });

  trd += '## 5. Data Requirements\n\n';
  trd += '### User Data\n';
  trd += `**Fields**: ${techContext.data_requirements.user_data.fields.join(', ')}\n`;
  trd += `**Retention**: ${techContext.data_requirements.user_data.retention}\n`;
  trd += `**Privacy**: ${techContext.data_requirements.user_data.privacy}\n\n`;

  trd += '### Operational Data\n';
  trd += `**Description**: ${techContext.data_requirements.operational_data.description}\n`;
  trd += `**Retention**: ${techContext.data_requirements.operational_data.retention}\n`;
  trd += `**Backup**: ${techContext.data_requirements.operational_data.backup}\n\n`;

  trd += '## 6. Security Requirements\n\n';
  techContext.non_functional.security.forEach((req, idx) => {
    trd += `${idx + 1}. ${req}\n`;
  });
  trd += '\n';

  trd += '## 7. Development & Testing\n\n';
  trd += '- **Code Review**: All code must be reviewed\n';
  trd += '- **Test Coverage**: Minimum 80%\n';
  trd += '- **CI/CD**: Automated testing and deployment\n';
  trd += '- **Documentation**: Code comments and API docs\n\n';

  return trd;
}

/**
 * Generate Non-Functional Requirements
 */
function generateNFR(techContext) {
  let nfr = '# Non-Functional Requirements (NFR)\n\n';
  nfr += `**Date**: ${new Date().toISOString().split('T')[0]}\n\n`;
  nfr += '---\n\n';

  Object.entries(techContext.non_functional).forEach(([category, requirements]) => {
    nfr += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    requirements.forEach((req, idx) => {
      nfr += `${idx + 1}. ${req}\n`;
    });
    nfr += '\n';
  });

  return nfr;
}

/**
 * 3. User Persona Generation
 */
async function generateUserPersonas(userRequest, outputDir) {
  const docsDir = path.join(outputDir, 'personas');
  await fs.mkdir(docsDir, { recursive: true });

  // Generate 3 user personas
  const personas = generatePersonas(userRequest);

  // Write persona documents
  for (const persona of personas) {
    const personaDoc = generatePersonaDocument(persona);
    await fs.writeFile(
      path.join(docsDir, `${sanitizeFileName(persona.name)}.md`),
      personaDoc
    );
  }

  // Generate persona summary
  const summary = generatePersonaSummary(personas);
  await fs.writeFile(path.join(docsDir, 'PERSONAS_SUMMARY.md'), summary);

  return {
    personas: personas,
    persona_count: personas.length,
    summary_file: 'PERSONAS_SUMMARY.md'
  };
}

/**
 * Generate user personas
 */
function generatePersonas(userRequest) {
  const personas = [
    {
      name: 'Team Manager - Sarah Chen',
      role: 'Engineering Manager',
      demographics: {
        age: 35,
        experience: '10+ years in tech',
        team_size: '8-12 engineers'
      },
      goals: [
        'Keep track of team progress',
        'Ensure deadlines are met',
        'Remove blockers quickly',
        'Maintain team morale'
      ],
      pain_points: [
        'Too many status update meetings',
        'Difficulty tracking multiple projects',
        'Information scattered across tools',
        'Hard to identify at-risk tasks'
      ],
      tech_comfort: 'High',
      usage_frequency: 'Daily (5-10 times)',
      key_features: [
        'Quick team status overview',
        'Task assignment and tracking',
        'Automated reminders',
        'Progress reports'
      ]
    },
    {
      name: 'Individual Contributor - Alex Kumar',
      role: 'Software Engineer',
      demographics: {
        age: 28,
        experience: '5 years in development',
        team_size: 'Part of 10-person team'
      },
      goals: [
        'Stay organized with tasks',
        'Know what to work on next',
        'Track personal progress',
        'Communicate status easily'
      ],
      pain_points: [
        'Forget about upcoming deadlines',
        'Switch between multiple tools',
        'Unclear task priorities',
        'Manual status updates are tedious'
      ],
      tech_comfort: 'Very High',
      usage_frequency: 'Daily (3-5 times)',
      key_features: [
        'Personal task list',
        'Deadline reminders',
        'Priority indicators',
        'Quick status updates'
      ]
    },
    {
      name: 'Executive - Michael Zhang',
      role: 'VP of Engineering',
      demographics: {
        age: 42,
        experience: '15+ years in leadership',
        team_size: 'Oversees 50+ people'
      },
      goals: [
        'High-level project visibility',
        'Identify bottlenecks',
        'Resource allocation',
        'Strategic planning'
      ],
      pain_points: [
        'Too much detail in regular tools',
        'Hard to get executive summary',
        'Need quick insights, not raw data',
        'Limited time for deep dives'
      ],
      tech_comfort: 'Medium',
      usage_frequency: 'Weekly (2-3 times)',
      key_features: [
        'Executive dashboards',
        'Summary reports',
        'Key metrics at a glance',
        'Trend analysis'
      ]
    }
  ];

  return personas;
}

/**
 * Generate persona document
 */
function generatePersonaDocument(persona) {
  let doc = `# User Persona: ${persona.name}\n\n`;
  doc += `**Role**: ${persona.role}\n\n`;
  doc += '---\n\n';

  doc += '## Demographics\n\n';
  Object.entries(persona.demographics).forEach(([key, value]) => {
    doc += `- **${key.replace('_', ' ').charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}**: ${value}\n`;
  });
  doc += '\n';

  doc += '## Goals\n\n';
  persona.goals.forEach((goal, idx) => {
    doc += `${idx + 1}. ${goal}\n`;
  });
  doc += '\n';

  doc += '## Pain Points\n\n';
  persona.pain_points.forEach((pain, idx) => {
    doc += `${idx + 1}. ${pain}\n`;
  });
  doc += '\n';

  doc += '## Technical Profile\n\n';
  doc += `- **Tech Comfort**: ${persona.tech_comfort}\n`;
  doc += `- **Usage Frequency**: ${persona.usage_frequency}\n\n`;

  doc += '## Key Features for This Persona\n\n';
  persona.key_features.forEach((feature, idx) => {
    doc += `${idx + 1}. ${feature}\n`;
  });
  doc += '\n';

  return doc;
}

/**
 * Generate persona summary
 */
function generatePersonaSummary(personas) {
  let summary = '# User Personas Summary\n\n';
  summary += `**Total Personas**: ${personas.length}\n\n`;
  summary += '---\n\n';

  personas.forEach((persona, idx) => {
    summary += `## ${idx + 1}. ${persona.name}\n`;
    summary += `**Role**: ${persona.role}\n`;
    summary += `**Usage**: ${persona.usage_frequency}\n`;
    summary += `**Tech Comfort**: ${persona.tech_comfort}\n\n`;
    summary += '**Top Needs**:\n';
    persona.key_features.slice(0, 3).forEach(feature => {
      summary += `- ${feature}\n`;
    });
    summary += '\n';
  });

  return summary;
}

/**
 * 4. Success Metrics Definition
 */
async function defineSuccessMetrics(userRequest, outputDir) {
  const docsDir = path.join(outputDir, 'metrics');
  await fs.mkdir(docsDir, { recursive: true });

  // Define KPIs
  const kpis = defineKPIs(userRequest);

  // Generate metrics document
  const metricsDoc = generateMetricsDocument(kpis);
  await fs.writeFile(path.join(docsDir, 'SUCCESS_METRICS.md'), metricsDoc);

  return {
    kpis: kpis,
    metrics_file: 'SUCCESS_METRICS.md'
  };
}

/**
 * Define KPIs
 */
function defineKPIs(userRequest) {
  return {
    adoption: [
      { metric: 'User Adoption Rate', target: '70%+ within first month', measurement: 'Active users / Total team size' },
      { metric: 'Daily Active Users', target: '50%+ of adopters', measurement: 'Users active in past 24h' },
      { metric: 'Feature Utilization', target: '60%+ use core features', measurement: 'Users using key features / Total users' }
    ],
    engagement: [
      { metric: 'Commands per User', target: '5+ per day', measurement: 'Total commands / Active users' },
      { metric: 'Session Duration', target: '> 2 minutes average', measurement: 'Average time spent interacting' },
      { metric: 'Return Rate', target: '80%+ daily return', measurement: 'Users returning next day / Total users' }
    ],
    satisfaction: [
      { metric: 'User Satisfaction Score', target: '4.0+ / 5.0', measurement: 'Survey responses' },
      { metric: 'Net Promoter Score', target: '40+', measurement: 'NPS survey' },
      { metric: 'Support Tickets', target: '< 5% of users', measurement: 'Tickets / Total users' }
    ],
    performance: [
      { metric: 'Response Time', target: '< 2 seconds (p95)', measurement: 'Time from command to response' },
      { metric: 'System Uptime', target: '99.5%+', measurement: 'Uptime monitoring' },
      { metric: 'Error Rate', target: '< 1%', measurement: 'Failed requests / Total requests' }
    ],
    business_impact: [
      { metric: 'Time Savings', target: '50% reduction', measurement: 'Time spent on manual tasks' },
      { metric: 'Productivity Gain', target: '30% improvement', measurement: 'Tasks completed / Time period' },
      { metric: 'ROI', target: 'Positive within 3 months', measurement: '(Time saved × hourly rate) - Cost' }
    ]
  };
}

/**
 * Generate metrics document
 */
function generateMetricsDocument(kpis) {
  let doc = '# Success Metrics & KPIs\n\n';
  doc += `**Date**: ${new Date().toISOString().split('T')[0]}\n\n`;
  doc += '---\n\n';

  Object.entries(kpis).forEach(([category, metrics]) => {
    doc += `## ${category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}\n\n`;
    doc += '| Metric | Target | Measurement |\n';
    doc += '|--------|--------|-------------|\n';
    metrics.forEach(m => {
      doc += `| ${m.metric} | ${m.target} | ${m.measurement} |\n`;
    });
    doc += '\n';
  });

  doc += '## Measurement Frequency\n\n';
  doc += '- **Daily**: Active users, commands, response time, error rate\n';
  doc += '- **Weekly**: Feature utilization, return rate, support tickets\n';
  doc += '- **Monthly**: User satisfaction, NPS, adoption rate, business impact\n';
  doc += '- **Quarterly**: ROI, productivity gains\n\n';

  doc += '## Reporting\n\n';
  doc += '- **Dashboard**: Real-time metrics dashboard\n';
  doc += '- **Weekly Report**: Summary to stakeholders\n';
  doc += '- **Monthly Review**: Deep dive with team\n';
  doc += '- **Quarterly Business Review**: Executive presentation\n\n';

  return doc;
}

/**
 * 5. Competitive Analysis
 */
async function analyzeCompetition(userRequest, outputDir) {
  const docsDir = path.join(outputDir, 'competitive');
  await fs.mkdir(docsDir, { recursive: true });

  // Analyze competitors
  const analysis = performCompetitiveAnalysis(userRequest);

  // Generate analysis document
  const analysisDoc = generateCompetitiveAnalysisDoc(analysis);
  await fs.writeFile(path.join(docsDir, 'COMPETITIVE_ANALYSIS.md'), analysisDoc);

  return {
    competitors: analysis.competitors,
    competitor_count: analysis.competitors.length,
    analysis_file: 'COMPETITIVE_ANALYSIS.md'
  };
}

/**
 * Perform competitive analysis
 */
function performCompetitiveAnalysis(userRequest) {
  const competitors = [
    {
      name: 'Slack Apps Ecosystem',
      strengths: [
        'Large app marketplace',
        'Mature integration ecosystem',
        'Strong developer community'
      ],
      weaknesses: [
        'Not Lark-specific',
        'May require account switching',
        'External dependencies'
      ],
      features: ['Task management', 'Workflow automation', 'Integrations']
    },
    {
      name: 'Microsoft Teams Bots',
      strengths: [
        'Enterprise features',
        'Office 365 integration',
        'Security and compliance'
      ],
      weaknesses: [
        'Complex setup',
        'Not Lark platform',
        'Licensing costs'
      ],
      features: ['Task tracking', 'Approvals', 'Notifications']
    },
    {
      name: 'Standalone Task Tools',
      strengths: [
        'Feature-rich',
        'Dedicated task management',
        'Advanced analytics'
      ],
      weaknesses: [
        'Separate platform',
        'Context switching required',
        'Additional cost'
      ],
      features: ['Task management', 'Projects', 'Reporting']
    }
  ];

  const our_advantages = [
    'Native Lark integration - no context switching',
    'Seamless user experience within existing workflow',
    'No additional platform or licensing costs',
    'Customizable to team-specific needs',
    'Faster implementation (2-4 weeks vs months)'
  ];

  return {
    competitors,
    our_advantages
  };
}

/**
 * Generate competitive analysis document
 */
function generateCompetitiveAnalysisDoc(analysis) {
  let doc = '# Competitive Analysis\n\n';
  doc += `**Date**: ${new Date().toISOString().split('T')[0]}\n\n`;
  doc += '---\n\n';

  doc += '## Competitors\n\n';
  analysis.competitors.forEach((comp, idx) => {
    doc += `### ${idx + 1}. ${comp.name}\n\n`;
    doc += '**Strengths**:\n';
    comp.strengths.forEach(s => doc += `- ${s}\n`);
    doc += '\n**Weaknesses**:\n';
    comp.weaknesses.forEach(w => doc += `- ${w}\n`);
    doc += '\n**Key Features**:\n';
    comp.features.forEach(f => doc += `- ${f}\n`);
    doc += '\n';
  });

  doc += '## Our Competitive Advantages\n\n';
  analysis.our_advantages.forEach((adv, idx) => {
    doc += `${idx + 1}. ${adv}\n`;
  });
  doc += '\n';

  doc += '## Positioning Strategy\n\n';
  doc += '**Target**: Teams already using Lark who want to enhance productivity without adding new tools\n\n';
  doc += '**Differentiation**: Native Lark integration with zero context switching\n\n';
  doc += '**Value Proposition**: Automated workflows within your existing communication platform\n\n';

  return doc;
}

/**
 * 6. Architecture Recommendations
 */
async function recommendArchitecture(userRequest, businessReqs, technicalReqs, outputDir) {
  const docsDir = path.join(outputDir, 'architecture');
  await fs.mkdir(docsDir, { recursive: true });

  // Analyze and recommend architecture
  const recommendation = selectArchitecturePattern(userRequest, businessReqs, technicalReqs);

  // Generate architecture recommendation document
  const archDoc = generateArchitectureRecommendation(recommendation);
  await fs.writeFile(path.join(docsDir, 'ARCHITECTURE_RECOMMENDATION.md'), archDoc);

  return {
    recommended_pattern: recommendation.pattern,
    rationale: recommendation.rationale,
    trade_offs: recommendation.trade_offs,
    recommendation_file: 'ARCHITECTURE_RECOMMENDATION.md'
  };
}

/**
 * Select architecture pattern
 */
function selectArchitecturePattern(userRequest, businessReqs, technicalReqs) {
  // For Lark bots, event-driven architecture is most appropriate
  const pattern = 'Event-Driven Architecture with Layered Services';

  const rationale = [
    'Lark platform uses event-based webhooks - natural fit',
    'Asynchronous processing allows for scalability',
    'Clear separation of concerns with layered services',
    'Easy to add new event handlers as features grow',
    'Supports both real-time and background processing'
  ];

  const trade_offs = {
    pros: [
      'Highly scalable and responsive',
      'Loose coupling between components',
      'Easy to test and maintain',
      'Aligns with Lark API design',
      'Supports future extensibility'
    ],
    cons: [
      'Slightly more complex than simple request-response',
      'Requires proper error handling for async operations',
      'Event ordering may need consideration',
      'Debugging can be more challenging'
    ],
    mitigation: [
      'Use structured logging for debugging',
      'Implement comprehensive error handling',
      'Add event sequencing where needed',
      'Provide clear documentation'
    ]
  };

  const alternatives = [
    {
      pattern: 'Simple MVC',
      reason_rejected: 'Less scalable, not optimized for webhooks'
    },
    {
      pattern: 'Microservices',
      reason_rejected: 'Overly complex for initial scope, higher operational overhead'
    },
    {
      pattern: 'Serverless',
      reason_rejected: 'Vendor lock-in, cold start issues, more complex local development'
    }
  ];

  return {
    pattern,
    rationale,
    trade_offs,
    alternatives
  };
}

/**
 * Generate architecture recommendation document
 */
function generateArchitectureRecommendation(recommendation) {
  let doc = '# Architecture Recommendation\n\n';
  doc += `**Date**: ${new Date().toISOString().split('T')[0]}\n\n`;
  doc += '---\n\n';

  doc += `## Recommended Pattern: ${recommendation.pattern}\n\n`;

  doc += '### Rationale\n\n';
  recommendation.rationale.forEach((reason, idx) => {
    doc += `${idx + 1}. ${reason}\n`;
  });
  doc += '\n';

  doc += '### Trade-offs Analysis\n\n';
  doc += '**Pros**:\n';
  recommendation.trade_offs.pros.forEach(pro => doc += `- ${pro}\n`);
  doc += '\n**Cons**:\n';
  recommendation.trade_offs.cons.forEach(con => doc += `- ${con}\n`);
  doc += '\n**Mitigation Strategies**:\n';
  recommendation.trade_offs.mitigation.forEach(mit => doc += `- ${mit}\n`);
  doc += '\n';

  doc += '### Alternative Patterns Considered\n\n';
  recommendation.alternatives.forEach((alt, idx) => {
    doc += `${idx + 1}. **${alt.pattern}**\n`;
    doc += `   - Reason rejected: ${alt.reason_rejected}\n`;
  });
  doc += '\n';

  doc += '### Implementation Guidance\n\n';
  doc += '```\n';
  doc += 'Recommended Stack:\n';
  doc += '- Node.js (v18+) - JavaScript runtime\n';
  doc += '- Express.js - Web framework for webhook handling\n';
  doc += '- Event-driven handlers - Process Lark events\n';
  doc += '- Service layer - Business logic\n';
  doc += '- Data access layer - Database operations\n';
  doc += '- SQLite/PostgreSQL - Data persistence\n';
  doc += '```\n\n';

  return doc;
}

/**
 * Utility: List generated documents
 */
async function listGeneratedDocs(dir) {
  const docs = [];

  async function scan(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else {
        docs.push(path.relative(dir, fullPath));
      }
    }
  }

  await scan(dir);
  return docs.sort();
}

/**
 * Utility: Sanitize file name
 */
function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default {
  analyzeRequirements
};

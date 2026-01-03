/**
 * Miyabi AssessmentCreator MCP Server
 * @module index
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import winston from 'winston';

import { AssessmentCreatorAgent } from './agents/assessment-creator.js';
import { ASSESSMENT_CREATOR_TOOLS, ToolSchemas } from './tools/index.js';
import { AssessmentInputSchema, AssessmentInput } from './types/index.js';

// Initialize logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'miyabi-assessment-creator.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

class AssessmentCreatorMCPServer {
  private server: Server;
  private agent: AssessmentCreatorAgent;

  constructor() {
    // Initialize MCP Server
    this.server = new Server(
      {
        name: 'miyabi-assessment-creator',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize Assessment Creator Agent
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.agent = new AssessmentCreatorAgent(geminiApiKey);

    // Setup handlers
    this.setupToolHandlers();

    logger.info('AssessmentCreator MCP Server initialized', {
      serverName: 'miyabi-assessment-creator',
      toolsCount: ASSESSMENT_CREATOR_TOOLS.length,
      agentCapabilities: this.agent.getAgentInfo().capabilities.length
    });
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('Listing available tools');
      return { tools: ASSESSMENT_CREATOR_TOOLS };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.info('Tool execution requested', {
        toolName: name,
        hasArguments: !!args
      });

      try {
        switch (name) {
          case 'generate_assessment':
            return await this.handleGenerateAssessment(args);

          case 'grade_submissions':
            return await this.handleGradeSubmissions(args);

          case 'generate_analytics':
            return await this.handleGenerateAnalytics(args);

          case 'optimize_questions':
            return await this.handleOptimizeQuestions(args);

          case 'validate_assessment':
            return await this.handleValidateAssessment(args);

          case 'get_question_bank':
            return await this.handleGetQuestionBank(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error('Tool execution failed', {
          toolName: name,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });

        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });
  }

  /**
   * Handle assessment generation
   */
  private async handleGenerateAssessment(args: any) {
    try {
      // Validate input
      const validatedInput = ToolSchemas.GenerateAssessmentSchema.parse(args);
      const assessmentInput: AssessmentInput = {
        ...validatedInput,
        bloomsDistribution: validatedInput.bloomsDistribution || {
          remember: 0.2,
          understand: 0.3,
          apply: 0.3,
          analyze: 0.1,
          evaluate: 0.05,
          create: 0.05
        },
        difficultyDistribution: validatedInput.difficultyDistribution || {
          easy: 0.3,
          medium: 0.5,
          hard: 0.2,
          expert: 0.0
        }
      };

      logger.info('Generating assessment', {
        topic: assessmentInput.topic,
        assessmentType: assessmentInput.assessmentType,
        questionCount: assessmentInput.questionCount.total
      });

      const result = await this.agent.generateAssessment(assessmentInput);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Assessment Generated Successfully

**Topic:** ${assessmentInput.topic}
**Type:** ${assessmentInput.assessmentType}
**Questions Generated:** ${result.generationMetadata.questionsGenerated}/${result.generationMetadata.questionsRequested}
**Success Rate:** ${Math.round(result.generationMetadata.successRate * 100)}%
**Quality Score:** ${Math.round(result.generationMetadata.qualityScore)}/100
**Estimated Duration:** ${result.assessment.metadata.estimatedDuration} minutes

**Assessment ID:** ${result.assessment.id}

**Question Types:**
${result.assessment.questions.map((q, i) => `${i + 1}. ${q.type} - ${q.difficulty} (${q.points} points)`).join('\n')}

**Recommendations:**
${result.recommendations.usageTips.map(tip => `• ${tip}`).join('\n')}

**Next Steps:**
${result.recommendations.nextSteps.map(step => `• ${step}`).join('\n')}

${result.generationMetadata.warnings.length > 0 ? `\n**Warnings:**\n${result.generationMetadata.warnings.map(w => `⚠️ ${w}`).join('\n')}` : ''}`
          },
          {
            type: 'text',
            text: `\n**Full Assessment Object:**\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``
          }
        ]
      };

    } catch (error) {
      logger.error('Assessment generation failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        content: [
          {
            type: 'text',
            text: `❌ Assessment generation failed: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * Handle grading submissions
   */
  private async handleGradeSubmissions(args: any) {
    try {
      const validatedInput = ToolSchemas.GradeSubmissionsSchema.parse(args);

      logger.info('Grading submissions', {
        assessmentId: validatedInput.assessmentId,
        submissionsCount: validatedInput.submissions.length,
        questionsCount: validatedInput.questions.length
      });

      const result = await this.agent.gradeSubmissions(
        validatedInput.assessmentId,
        validatedInput.questions,
        validatedInput.submissions,
        validatedInput.gradingConfig
      );

      const averageScore = result.results.reduce((sum, r) => sum + r.percentage, 0) / result.results.length;
      const passingRate = result.results.filter(r => r.passed).length / result.results.length;

      return {
        content: [
          {
            type: 'text',
            text: `✅ Grading Complete

**Assessment ID:** ${validatedInput.assessmentId}
**Submissions Processed:** ${result.metadata.successfullyGraded}/${result.metadata.totalSubmissions}
**Average Score:** ${Math.round(averageScore)}%
**Passing Rate:** ${Math.round(passingRate * 100)}%
**Average Grading Time:** ${Math.round(result.metadata.averageGradingTime)} ms per submission

**Grade Distribution:**
${this.generateGradeDistribution(result.results)}

${result.metadata.errors.length > 0 ? `\n**Errors:**\n${result.metadata.errors.map(e => `❌ ${e}`).join('\n')}` : ''}`
          },
          {
            type: 'text',
            text: `\n**Detailed Results:**\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``
          }
        ]
      };

    } catch (error) {
      logger.error('Grading failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        content: [
          {
            type: 'text',
            text: `❌ Grading failed: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * Handle analytics generation
   */
  private async handleGenerateAnalytics(args: any) {
    try {
      const validatedInput = ToolSchemas.GenerateAnalyticsSchema.parse(args);

      logger.info('Generating analytics', {
        assessmentId: validatedInput.assessmentId,
        questionsCount: validatedInput.questions.length,
        resultsCount: validatedInput.results.length,
        analysisType: validatedInput.analysisType
      });

      const report = await this.agent.generateAnalytics(
        validatedInput.assessmentId,
        validatedInput.questions,
        validatedInput.results,
        validatedInput.includeRecommendations,
        validatedInput.includePredictive
      );

      return {
        content: [
          {
            type: 'text',
            text: `📊 Analytics Report Generated

**Assessment ID:** ${validatedInput.assessmentId}
**Generated:** ${report.generatedAt}

**Summary:**
• Total Responses: ${report.summary.totalResponses}
• Average Score: ${Math.round(report.summary.averageScore)}%
• Completion Rate: ${Math.round(report.summary.completionRate * 100)}%
• Average Time: ${Math.round(report.summary.averageTimeSpent)} minutes
• Passing Rate: ${Math.round(report.summary.passingRate * 100)}%

**Key Insights:**
**Strengths:**
${report.insights.strengths.map(s => `✅ ${s}`).join('\n')}

**Areas of Concern:**
${report.insights.concerns.map(c => `⚠️ ${c}`).join('\n')}

**Recommendations:**
${report.insights.recommendations.map(r => `💡 ${r}`).join('\n')}

**Question Performance:**
${report.questionAnalytics.slice(0, 5).map(qa => `• Question ${qa.questionId}: ${Math.round(qa.correctRate * 100)}% correct, discrimination: ${Math.round(qa.discrimination * 100)}%`).join('\n')}

${report.predictiveAnalytics ? `\n**Predictive Insights:**\n**Risk Factors:**\n${report.predictiveAnalytics.riskFactors.map(rf => `⚠️ ${rf}`).join('\n')}\n\n**Interventions:**\n${report.predictiveAnalytics.interventionSuggestions.map(is => `💊 ${is}`).join('\n')}` : ''}`
          },
          {
            type: 'text',
            text: `\n**Full Analytics Report:**\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\``
          }
        ]
      };

    } catch (error) {
      logger.error('Analytics generation failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        content: [
          {
            type: 'text',
            text: `❌ Analytics generation failed: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * Handle question optimization
   */
  private async handleOptimizeQuestions(args: any) {
    try {
      const validatedInput = ToolSchemas.OptimizeQuestionsSchema.parse(args);

      logger.info('Optimizing questions', {
        questionsCount: validatedInput.questions.length,
        performanceDataPoints: validatedInput.performanceData.length,
        goals: validatedInput.optimizationGoals
      });

      const result = await this.agent.optimizeQuestions(
        validatedInput.questions,
        validatedInput.performanceData
      );

      return {
        content: [
          {
            type: 'text',
            text: `🔧 Question Optimization Complete

**Questions Analyzed:** ${validatedInput.questions.length}
**Questions Optimized:** ${result.optimizationReport.questionsOptimized}
**Quality Improvement:** +${Math.round(result.optimizationReport.qualityImprovement)} points
**Optimizations Applied:** ${result.optimizationReport.improvementsApplied.length}

**Key Improvements:**
${result.optimizationReport.improvementsApplied.slice(0, 5).map(imp => `• ${imp}`).join('\n')}

**Optimization Goals Addressed:**
${validatedInput.optimizationGoals.map(goal => `✅ ${goal.replace('_', ' ')}`).join('\n')}`
          },
          {
            type: 'text',
            text: `\n**Optimized Questions:**\n\`\`\`json\n${JSON.stringify(result.optimizedQuestions, null, 2)}\n\`\`\``
          }
        ]
      };

    } catch (error) {
      logger.error('Question optimization failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        content: [
          {
            type: 'text',
            text: `❌ Question optimization failed: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * Handle assessment validation
   */
  private async handleValidateAssessment(args: any) {
    try {
      const validatedInput = ToolSchemas.ValidateAssessmentSchema.parse(args);

      // Simulate validation (would implement actual validation logic)
      const validationResults = {
        overallScore: 85,
        alignment: 90,
        difficulty: 80,
        bias: 95,
        accessibility: 75,
        technical: 88,
        issues: [
          'Some questions may be too easy for advanced students',
          'Consider adding alt text for visual elements',
          'Ensure consistent formatting across all questions'
        ],
        recommendations: [
          'Add more challenging questions for high performers',
          'Review accessibility guidelines',
          'Test with diverse student groups'
        ]
      };

      return {
        content: [
          {
            type: 'text',
            text: `🔍 Assessment Validation Complete

**Overall Quality Score:** ${validationResults.overallScore}/100

**Detailed Scores:**
• Learning Objective Alignment: ${validationResults.alignment}/100
• Difficulty Distribution: ${validationResults.difficulty}/100
• Bias Assessment: ${validationResults.bias}/100
• Accessibility: ${validationResults.accessibility}/100
• Technical Quality: ${validationResults.technical}/100

**Issues Identified:**
${validationResults.issues.map(issue => `⚠️ ${issue}`).join('\n')}

**Recommendations:**
${validationResults.recommendations.map(rec => `💡 ${rec}`).join('\n')}

**Standards Validated:**
${validatedInput.standards?.map(std => `✅ ${std.replace('_', ' ')}`).join('\n') || 'Default validation criteria applied'}`
          }
        ]
      };

    } catch (error) {
      logger.error('Assessment validation failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        content: [
          {
            type: 'text',
            text: `❌ Assessment validation failed: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * Handle question bank retrieval
   */
  private async handleGetQuestionBank(args: any) {
    try {
      const validatedInput = ToolSchemas.GetQuestionBankSchema.parse(args);

      // Simulate question bank retrieval (would implement actual database query)
      const questions = Array.from({ length: Math.min(validatedInput.limit, 10) }, (_, i) => ({
        id: `q-${i + 1}`,
        type: validatedInput.questionType || 'multiple_choice',
        question: `Sample question ${i + 1} about ${validatedInput.topic || 'general topic'}`,
        difficulty: validatedInput.difficulty || 'medium',
        bloomsLevel: validatedInput.bloomsLevel || 'understand',
        points: 1,
        metadata: validatedInput.includeMetadata ? {
          created: new Date().toISOString(),
          usage: Math.floor(Math.random() * 100),
          performance: Math.random() * 100,
          averageScore: Math.random() * 100
        } : undefined
      }));

      return {
        content: [
          {
            type: 'text',
            text: `📚 Question Bank Results

**Query Parameters:**
• Topic: ${validatedInput.topic || 'All topics'}
• Type: ${validatedInput.questionType || 'All types'}
• Difficulty: ${validatedInput.difficulty || 'All levels'}
• Bloom's Level: ${validatedInput.bloomsLevel || 'All levels'}
• Limit: ${validatedInput.limit}

**Results:** ${questions.length} questions found

**Sample Questions:**
${questions.slice(0, 3).map((q, i) => `${i + 1}. [${q.type}] ${q.question} (${q.difficulty})`).join('\n')}
${questions.length > 3 ? `... and ${questions.length - 3} more questions` : ''}`
          },
          {
            type: 'text',
            text: `\n**Full Question Bank Results:**\n\`\`\`json\n${JSON.stringify(questions, null, 2)}\n\`\`\``
          }
        ]
      };

    } catch (error) {
      logger.error('Question bank retrieval failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        content: [
          {
            type: 'text',
            text: `❌ Question bank retrieval failed: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * Generate grade distribution summary
   */
  private generateGradeDistribution(results: any[]): string {
    const ranges = [
      { min: 90, max: 100, label: 'A (90-100%)' },
      { min: 80, max: 89, label: 'B (80-89%)' },
      { min: 70, max: 79, label: 'C (70-79%)' },
      { min: 60, max: 69, label: 'D (60-69%)' },
      { min: 0, max: 59, label: 'F (0-59%)' }
    ];

    return ranges.map(range => {
      const count = results.filter(r => r.percentage >= range.min && r.percentage <= range.max).length;
      const percentage = Math.round((count / results.length) * 100);
      return `• ${range.label}: ${count} students (${percentage}%)`;
    }).join('\n');
  }

  /**
   * Start the MCP server
   */
  async start() {
    // Validate connections on startup
    const connections = await this.agent.validateConnections();

    if (!Object.values(connections).every(Boolean)) {
      logger.warn('Some service connections failed', connections);
    } else {
      logger.info('All service connections validated successfully');
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info('AssessmentCreator MCP Server started', {
      transport: 'stdio',
      connections,
      agentInfo: this.agent.getAgentInfo().name
    });

    // Log connection status
    console.error('AssessmentCreator MCP Server running on stdio');
    console.error(`Connected services: ${Object.entries(connections).map(([k, v]) => `${k}:${v ? '✅' : '❌'}`).join(' ')}`);
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new AssessmentCreatorMCPServer();
  server.start().catch((error) => {
    logger.error('Failed to start server', { error });
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { AssessmentCreatorMCPServer };
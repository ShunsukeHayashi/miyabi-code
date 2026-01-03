#!/usr/bin/env ts-node

/**
 * CourseDesigner Agent Demo Script
 * Demonstrates the core functionality of the CourseDesigner Agent
 */

import { CourseDesignerAgent } from '../src/agents/course-designer.js';
import { CourseInput } from '../src/types/index.js';

// Mock environment for demo
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'demo-mode';

async function runDemo() {
  console.log('🎓 CourseDesigner Agent Demo');
  console.log('================================\n');

  // Create agent instance
  console.log('📝 Initializing CourseDesigner Agent...');
  const agent = new CourseDesignerAgent(process.env.GEMINI_API_KEY!);

  // Display agent info
  console.log('📊 Agent Information:');
  const agentInfo = agent.getAgentInfo();
  console.log(`   Name: ${agentInfo.name}`);
  console.log(`   Version: ${agentInfo.version}`);
  console.log(`   Description: ${agentInfo.description}`);
  console.log(`   Supported Languages: ${agentInfo.supportedLanguages.join(', ')}`);
  console.log(`   Capabilities: ${agentInfo.capabilities.length} features\n`);

  // Test API connection
  console.log('🔌 Testing API Connection...');
  try {
    const isConnected = await agent.validateConnection();
    console.log(`   Status: ${isConnected ? '✅ Connected' : '❌ Disconnected'}\n`);
  } catch (error) {
    console.log('   Status: ❌ Error (demo mode)\n');
  }

  // Demo course input
  const demoInput: CourseInput = {
    topic: 'Introduction to TypeScript',
    targetAudience: 'JavaScript developers looking to learn TypeScript',
    difficulty: 'intermediate',
    duration: { weeks: 6, hoursPerWeek: 3 },
    learningObjectives: [
      'Understand TypeScript fundamentals and syntax',
      'Convert JavaScript projects to TypeScript',
      'Master advanced TypeScript features like generics',
      'Build type-safe applications with confidence'
    ],
    prerequisites: [
      'JavaScript fundamentals',
      'ES6+ features',
      'Basic understanding of Node.js'
    ],
    format: {
      includeVideos: true,
      includeAssessments: true,
      includeProjects: true,
      includeDiscussions: false
    },
    preferences: {
      language: 'en',
      tone: 'conversational',
      interactivity: 'high'
    }
  };

  console.log('📚 Demo Course Specification:');
  console.log(`   Topic: ${demoInput.topic}`);
  console.log(`   Target Audience: ${demoInput.targetAudience}`);
  console.log(`   Difficulty: ${demoInput.difficulty}`);
  console.log(`   Duration: ${demoInput.duration?.weeks} weeks, ${demoInput.duration?.hoursPerWeek} hours/week`);
  console.log(`   Learning Objectives: ${demoInput.learningObjectives?.length} objectives`);
  console.log(`   Format: Videos=${demoInput.format?.includeVideos}, Assessments=${demoInput.format?.includeAssessments}, Projects=${demoInput.format?.includeProjects}\n`);

  // In a real scenario with API access, you would generate a course here:
  /*
  console.log('🚀 Generating Course...');
  try {
    const course = await agent.generateCourse(demoInput);

    console.log('✅ Course Generation Complete!');
    console.log(`   Title: ${course.courseStructure.title}`);
    console.log(`   Modules: ${course.courseStructure.modules.length}`);
    console.log(`   Total Lessons: ${course.courseStructure.modules.reduce((sum, module) => sum + module.lessons.length, 0)}`);
    console.log(`   Quality Score: ${course.metadata.contentQualityScore}/100`);
    console.log(`   Estimated Completion Rate: ${course.metadata.estimatedCompletionRate}%`);

  } catch (error) {
    console.error('❌ Course generation failed:', error);
  }
  */

  console.log('🎯 Demo Features Showcased:');
  console.log('   ✅ Agent initialization and configuration');
  console.log('   ✅ API connection validation');
  console.log('   ✅ Course input specification and validation');
  console.log('   ✅ Agent capabilities and metadata');
  console.log('   ⏸️  Course generation (requires valid API key)');
  console.log('   ⏸️  Progress monitoring (requires active generation)');
  console.log('   ⏸️  Content quality analysis (requires generated content)\n');

  console.log('💡 Next Steps:');
  console.log('   1. Set GEMINI_API_KEY environment variable');
  console.log('   2. Run: npm run start (to start MCP server)');
  console.log('   3. Use MCP tools: generate_course, get_generation_progress, etc.');
  console.log('   4. Integrate with Miyabi Agent orchestration system');
  console.log('   5. Deploy to production environment\n');

  console.log('📖 Documentation:');
  console.log('   - README.md: Complete usage guide');
  console.log('   - src/types/: TypeScript type definitions');
  console.log('   - tests/: Comprehensive test suite');
  console.log('   - .miyabi/config/course-designer.yml: Configuration options\n');

  console.log('🎉 CourseDesigner Agent Demo Complete!');
}

// Run the demo
if (require.main === module) {
  runDemo().catch(console.error);
}

export { runDemo };
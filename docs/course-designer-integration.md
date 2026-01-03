# CourseDesigner Agent Integration Guide

The CourseDesigner Agent is now fully integrated into the Miyabi Course Platform ecosystem. Here's how to use it in production.

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Set your Google Generative AI API key
export GEMINI_API_KEY="your_api_key_here"

# Navigate to the CourseDesigner MCP server
cd mcp-servers/miyabi-course-designer

# Install dependencies and build
npm install
npm run build
```

### 2. Start the MCP Server

```bash
# Start the CourseDesigner MCP server
npm start
```

The server will start on port 3113 as configured in `.miyabi/config.yml`.

### 3. Use via MCP Tools

```typescript
// Example: Generate a complete course
const courseSpec = {
  topic: "Advanced React Development",
  targetAudience: "Senior frontend developers",
  difficulty: "advanced",
  duration: { weeks: 10, hoursPerWeek: 4 },
  learningObjectives: [
    "Master React performance optimization",
    "Implement advanced patterns (Render Props, Higher-Order Components)",
    "Build scalable React architectures",
    "Deploy React applications to production"
  ],
  format: {
    includeVideos: true,
    includeAssessments: true,
    includeProjects: true,
    includeDiscussions: true
  },
  preferences: {
    language: "en",
    tone: "conversational",
    interactivity: "high"
  }
};

// Call via MCP tool
const course = await mcpClient.callTool("generate_course", courseSpec);
```

## 🏗️ Integration Points

### 1. Miyabi Agent System

The CourseDesigner Agent is registered in the Miyabi agent ecosystem:

**Agent Registry** (`.miyabi/agents.yml`):
```yaml
course_designer:
  name: Course Designer
  japanese_name: 設計くん
  description: AI駆動コース設計・コンテンツ自動生成
  domain: education
  capabilities:
    - intelligent_course_structure_generation
    - multi_modal_content_creation
    - assessment_quiz_generation
```

**MCP Server** (`.miyabi/config.yml`):
```yaml
mcp:
  servers:
    miyabi-course-designer:
      port: 3113
      enabled: true
      priority: 3
```

### 2. UI Integration

The agent appears in the Miyabi desktop application:

**Agent Metadata** (`miyabi-desktop/src/lib/agent-api.ts`):
```typescript
{
  type: "course_designer_agent",
  displayName: "コース設計Agent",
  characterName: "設計くん",
  category: "business-marketing",
  description: "AI駆動型コンテンツ自動生成",
  color: "#f59e0b"
}
```

### 3. Agent SDK Integration

**Type Definitions** (`miyabi-agent-sdk/src/types.ts`):
```typescript
export type BusinessAgentType =
  | 'AIEntrepreneurAgent'
  | 'SelfAnalysisAgent'
  // ... other agents
  | 'CourseDesignerAgent';
```

**Agent Definition** (`miyabi-agent-sdk/src/agents/business.ts`):
```typescript
export const CourseDesignerAgent: AgentDefinition = {
  name: 'CourseDesignerAgent',
  category: 'business',
  description: 'AI-powered comprehensive course content generation',
  capabilities: [
    'Intelligent course structure generation',
    'Multi-modal content creation',
    'Assessment and quiz generation',
    // ... more capabilities
  ],
  inputSchema: CourseInputSchema,
  outputSchema: CourseOutputSchema
};
```

## 📊 Production Usage Examples

### Example 1: Technical Course Generation

```typescript
// Generate a programming course
const technicalCourse = await generateCourse({
  topic: "Rust Programming for Systems Development",
  targetAudience: "C/C++ developers transitioning to Rust",
  difficulty: "intermediate",
  duration: { weeks: 12, hoursPerWeek: 5 },
  learningObjectives: [
    "Understand Rust's ownership system",
    "Build memory-safe systems applications",
    "Work with Rust's ecosystem and tooling"
  ],
  prerequisites: [
    "Systems programming experience",
    "Understanding of memory management",
    "Familiarity with C/C++"
  ],
  format: {
    includeVideos: true,
    includeAssessments: true,
    includeProjects: true,
    includeDiscussions: true
  }
});
```

### Example 2: Business Skills Course

```typescript
// Generate a soft skills course
const businessCourse = await generateCourse({
  topic: "Leadership in Remote Teams",
  targetAudience: "Middle management professionals",
  difficulty: "intermediate",
  duration: { weeks: 8, hoursPerWeek: 2 },
  preferences: {
    tone: "professional",
    language: "en",
    interactivity: "high"
  },
  format: {
    includeVideos: true,
    includeAssessments: true,
    includeProjects: false,
    includeDiscussions: true
  }
});
```

### Example 3: Multi-language Course

```typescript
// Generate a Japanese language course
const japaneseCourse = await generateCourse({
  topic: "機械学習入門",
  targetAudience: "プログラミング経験のあるエンジニア",
  difficulty: "beginner",
  preferences: {
    language: "ja",
    tone: "academic",
    interactivity: "medium"
  },
  learningObjectives: [
    "機械学習の基本概念を理解する",
    "Pythonを使った機械学習の実装ができる",
    "実際のデータを使った分析ができる"
  ]
});
```

## 🔄 Agent Orchestration

### Multi-Agent Workflow

The CourseDesigner Agent can work with other Miyabi agents:

```typescript
// 1. Market Research → Course Topic Identification
const marketResearch = await coordinatorAgent.execute({
  agent: 'MarketResearchAgent',
  input: { industry: 'software development', trends: true }
});

// 2. Course Generation → Content Creation
const course = await coordinatorAgent.execute({
  agent: 'CourseDesignerAgent',
  input: {
    topic: marketResearch.trendingTopics[0],
    targetAudience: marketResearch.targetDemographics.primary
  }
});

// 3. Content Marketing → Course Promotion
const marketing = await coordinatorAgent.execute({
  agent: 'MarketingAgent',
  input: {
    product: course.courseStructure.title,
    audience: course.courseStructure.targetAudience
  }
});
```

### Progress Monitoring

```typescript
// Start course generation
const generationPromise = courseDesigner.generateCourse(courseInput);

// Monitor progress
const progressInterval = setInterval(async () => {
  const progress = await mcpClient.callTool('get_generation_progress');
  console.log(`Generation ${progress.overallProgress}% complete`);

  if (progress.overallProgress >= 100) {
    clearInterval(progressInterval);
  }
}, 5000);

// Wait for completion
const course = await generationPromise;
```

## 📈 Quality Metrics

### Generated Course Quality

```typescript
// Access quality metrics
const metrics = course.metadata;

console.log('Course Quality Metrics:');
console.log(`- Content Quality Score: ${metrics.contentQualityScore}/100`);
console.log(`- Estimated Completion Rate: ${metrics.estimatedCompletionRate}%`);
console.log(`- SCORM Compatible: ${metrics.scormCompatible ? 'Yes' : 'No'}`);
console.log(`- Accessibility Compliant: ${metrics.accessibilityCompliant ? 'Yes' : 'No'}`);

// Access recommendations
console.log('Improvement Recommendations:');
course.recommendations.contentImprovements.forEach(rec => {
  console.log(`- ${rec}`);
});
```

### Performance Monitoring

```typescript
// Monitor agent performance
const agentInfo = await mcpClient.callTool('get_agent_info');
console.log(`Model: ${agentInfo.modelInfo.model}`);
console.log(`Supported Languages: ${agentInfo.supportedLanguages.length}`);
console.log(`Max Course Length: ${agentInfo.maxCourseLength}`);
```

## 🔧 Configuration

### Custom Templates

You can customize the generation templates by editing the prompt templates:

```typescript
// Custom course structure template
const customTemplate = {
  name: 'custom_course_structure',
  template: `Create a course for {{industry}} professionals...`,
  variables: ['industry', 'experience_level', 'goals']
};

// Register custom template
await courseDesigner.registerTemplate(customTemplate);
```

### Model Configuration

Adjust AI model parameters for different use cases:

```typescript
// High creativity for creative courses
courseDesigner.updateConfig({
  temperature: 0.9,
  topP: 0.95
});

// Low creativity for technical courses
courseDesigner.updateConfig({
  temperature: 0.3,
  topP: 0.7
});
```

## 🚨 Error Handling

### Common Error Scenarios

```typescript
try {
  const course = await courseDesigner.generateCourse(input);
} catch (error) {
  if (error.message.includes('API rate limit')) {
    // Wait and retry
    await delay(60000);
    return await courseDesigner.generateCourse(input);
  } else if (error.message.includes('Invalid input')) {
    // Fix input validation
    const validatedInput = validateCourseInput(input);
    return await courseDesigner.generateCourse(validatedInput);
  } else {
    // Log and escalate
    logger.error('Course generation failed:', error);
    throw error;
  }
}
```

## 📚 Best Practices

### 1. Input Optimization

```typescript
// Good: Specific and detailed
const goodInput = {
  topic: "React Server Components for Next.js 14+",
  targetAudience: "React developers with 2+ years experience building production applications",
  difficulty: "advanced"
};

// Bad: Too vague
const badInput = {
  topic: "React",
  targetAudience: "Developers",
  difficulty: "intermediate"
};
```

### 2. Quality Validation

```typescript
// Always validate output quality
const course = await generateCourse(input);

if (course.metadata.contentQualityScore < 80) {
  console.warn('Low quality course generated, consider regenerating');
}

if (course.courseStructure.modules.length < 3) {
  console.warn('Course too short, consider expanding scope');
}
```

### 3. Accessibility Compliance

```typescript
// Ensure accessibility is enabled
const accessibleInput = {
  ...baseInput,
  preferences: {
    tone: 'conversational',
    language: 'en',
    accessibilityFeatures: {
      altText: true,
      captions: true,
      colorContrast: 'high',
      screenReaderOptimized: true
    }
  }
};
```

## 🎯 Future Enhancements

### Roadmap Items

1. **Advanced Analytics**: Student progress tracking and course optimization
2. **Interactive Elements**: Gamification and adaptive learning paths
3. **Video Generation**: AI-generated video content with talking avatars
4. **Multi-modal Output**: Generate slides, worksheets, and interactive demos
5. **Enterprise Features**: Bulk course generation and white-label customization

### Integration Opportunities

- **LMS Integration**: Direct publishing to Moodle, Canvas, Blackboard
- **Video Platforms**: YouTube, Vimeo course publishing
- **E-commerce**: Teachable, Udemy course marketplace integration
- **Analytics Platforms**: Google Analytics, Mixpanel learning analytics

---

The CourseDesigner Agent is now ready for production use in the Miyabi ecosystem. It provides a powerful, AI-driven solution for automated course content generation that scales from individual courses to enterprise-level educational content production.
# Miyabi ProgressTracker Agent

AI-powered learning analytics and progress optimization agent for the Miyabi Course Platform.

## Overview

The ProgressTracker Agent provides comprehensive learning analytics, predictive modeling, and personalized recommendations to optimize student learning outcomes. It integrates with existing CourseDesigner and AssessmentCreator Agents to create a complete educational ecosystem.

## Features

### 📊 Learning Analytics
- Real-time progress tracking
- Engagement score calculation
- Performance analytics with benchmarking
- Learning velocity and knowledge retention metrics

### 🤖 Machine Learning Models
- **Completion Prediction**: Predict course completion likelihood
- **Risk Assessment**: Identify at-risk students early
- **Success Modeling**: Predict overall learning success
- **Time Estimation**: Estimate time-to-completion

### 💡 Personalized Recommendations
- Next lesson suggestions
- Review content identification
- Study schedule optimization
- Course suggestions based on learning patterns

### 📈 Dashboard & Insights
- Real-time dashboard metrics
- Comprehensive student profiles
- Course analytics and performance trends
- Actionable insights and alerts

### 🔌 MCP Integration
Exposes 9 tools via Model Context Protocol:
- `track_progress` - Track student learning progress
- `analyze_performance` - Generate performance analytics
- `generate_recommendations` - Create personalized recommendations
- `predict_outcomes` - Generate ML predictions
- `get_insights` - Extract actionable insights
- `get_dashboard_metrics` - Get overview metrics
- `get_student_profile` - Comprehensive student analysis
- `get_course_analytics` - Detailed course analytics
- `get_status` - Agent health status

## Installation

```bash
cd mcp-servers/miyabi-progress-tracker
npm install
```

## Configuration

Create a `.env` file with optional configurations:

```bash
# Database path (defaults to :memory:)
DATABASE_PATH=./progress_tracker.db

# Analytics update interval in seconds (default: 300)
UPDATE_INTERVAL=300

# Batch processing size (default: 100)
BATCH_SIZE=100

# Data retention period in days (default: 365)
RETENTION_PERIOD=365

# Privacy mode (default: true)
PRIVACY_MODE=true

# Enable predictions (default: true)
ENABLE_PREDICTIONS=true

# Enable recommendations (default: true)
ENABLE_RECOMMENDATIONS=true
```

## Usage

### As MCP Server

Start the MCP server:

```bash
npm start
```

### Programmatic Usage

```typescript
import { ProgressTrackerAgent } from './src/ProgressTrackerAgent.js';

const agent = new ProgressTrackerAgent();
await agent.initialize();

// Track student progress
const progressResult = await agent.trackProgress({
  studentId: 'student-123',
  courseId: 'course-456',
  status: 'in_progress',
  progress: 75,
  timeSpent: 1800,
  engagementData: {
    clickCount: 15,
    timeOnPage: 1200,
  }
});

// Generate recommendations
const recommendations = await agent.generateRecommendations({
  studentId: 'student-123',
  maxRecommendations: 5
});

// Get analytics
const analytics = await agent.analyzePerformance({
  studentIds: ['student-123'],
  includeComparisons: true
});

// Predict outcomes
const predictions = await agent.predictOutcomes({
  studentIds: ['student-123'],
  predictionTypes: ['completion', 'risk']
});

await agent.shutdown();
```

## Architecture

```
ProgressTrackerAgent
├── Analytics Engine      # Core analytics processing
├── Prediction Models     # ML models for predictions
├── Recommendation Engine # Personalization algorithms
├── Database             # SQLite data persistence
└── MCP Server           # Tool exposure interface
```

### Machine Learning Pipeline

1. **Feature Extraction**: Converts raw learning data into ML features
2. **Model Training**: Trains ensemble models on historical data
3. **Prediction Generation**: Makes real-time predictions
4. **Model Evaluation**: Continuous accuracy monitoring

### Analytics Pipeline

1. **Data Ingestion**: Receives progress updates
2. **Real-time Processing**: Updates analytics immediately
3. **Batch Processing**: Periodic comprehensive analysis
4. **Insight Generation**: Creates actionable insights

## Testing

Run the comprehensive test suite:

```bash
npm test
```

Tests cover:
- Progress tracking functionality
- Analytics generation
- ML predictions
- Recommendation algorithms
- Error handling
- Performance optimization

## Performance

- **Real-time Updates**: <100ms for progress tracking
- **Analytics Generation**: <5s for comprehensive analysis
- **Predictions**: <2s for ML model inference
- **Recommendations**: <3s for personalized suggestions

## Privacy & Compliance

- **FERPA Compliant**: Educational privacy protection
- **GDPR Ready**: Data minimization and consent management
- **Anonymization**: Optional student data masking
- **Retention Policies**: Automatic data cleanup

## Integration

Integrates seamlessly with:
- **CourseDesigner Agent**: Optimizes course structure based on analytics
- **AssessmentCreator Agent**: Provides performance insights for assessments
- **Learning Management Systems**: Supports LTI and API integration
- **External Analytics**: Exports data to visualization platforms

## License

MIT License - see LICENSE file for details.

---

🤖 **AI-Powered Learning Analytics** | Part of the Miyabi Course Platform
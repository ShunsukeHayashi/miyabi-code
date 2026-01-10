# 💍 Oura Ring Health Data MCP Server

Advanced health monitoring integration for the Miyabi autonomous development platform.

## 🌟 Overview

The Oura Ring MCP Server provides comprehensive access to biometric and wellness data from Oura Ring Gen 2/3 devices, enabling health-aware development workflows and autonomous agent decision making.

## 📊 Features

### 🔍 **Health Data Access**
- **Sleep Analysis**: Duration, efficiency, phases, heart rate during sleep
- **Daily Readiness**: Recovery scores, contributing factors, HRV analysis
- **Activity Tracking**: Steps, calories, distance, movement patterns
- **Heart Rate Monitoring**: Continuous HR, HRV trends, resting heart rate
- **Workout Detection**: Automatic exercise recognition, intensity analysis
- **Temperature Trends**: Body temperature deviations and patterns

### 🧠 **Intelligence Features**
- **Trend Analysis**: Long-term health pattern recognition
- **Recovery Insights**: Smart recovery recommendations
- **Recent Summaries**: Comprehensive health overview
- **Correlation Analytics**: Multi-metric health relationships

### 🤖 **Developer Wellness Integration**
- Monitor coding session performance vs. sleep quality
- Detect developer fatigue and stress levels
- Optimize work schedules based on readiness scores
- Generate health-informed capacity planning

## 🔧 Installation & Setup

### Prerequisites
```bash
# Required dependencies
npm install @modelcontextprotocol/sdk
```

### Environment Variables
```bash
# Required: Oura API Access Token
export OURA_ACCESS_TOKEN="your_oura_access_token_here"

# Optional: User ID (defaults to current user)
export OURA_USER_ID="user_id"
```

### Getting Your Access Token

#### Method 1: Personal Access Token (Recommended for Development)
1. Visit [Oura Cloud](https://cloud.ouraring.com/personal-access-tokens)
2. Sign in with your Oura account
3. Generate a new Personal Access Token
4. Copy the token to your environment variables

⚠️ **Note**: Personal Access Tokens will be deprecated by end of 2025. Use OAuth2 for production.

#### Method 2: OAuth2 (Production)
1. Create an Oura Developer Account
2. Register your application
3. Implement OAuth2 flow
4. Use the access token from OAuth2 response

### MCP Configuration

Add to `.claude/mcp.json`:
```json
{
  "oura-ring": {
    "command": "node",
    "args": [".claude/mcp-servers/oura-integration/oura-ring.js"],
    "env": {
      "OURA_ACCESS_TOKEN": "${OURA_ACCESS_TOKEN}",
      "OURA_USER_ID": "${OURA_USER_ID}"
    },
    "disabled": false,
    "description": "Oura Ring health data integration"
  }
}
```

## 🛠️ Available Tools

### 1. **Sleep Data Analysis**
```bash
oura_get_sleep_data
```
- **Parameters**: `start_date` (YYYY-MM-DD), `end_date` (optional)
- **Returns**: Sleep duration, efficiency, phases, heart rate, sleep score
- **Example**: Analyze sleep patterns over the past week

### 2. **Readiness Assessment**
```bash
oura_get_readiness_data
```
- **Parameters**: `start_date`, `end_date` (optional)
- **Returns**: Readiness score, contributing factors, recovery metrics
- **Example**: Check recovery status before important meetings

### 3. **Activity Monitoring**
```bash
oura_get_activity_data
```
- **Parameters**: `start_date`, `end_date` (optional)
- **Returns**: Steps, calories, distance, activity score, active time
- **Example**: Track daily movement and energy expenditure

### 4. **Heart Rate Analysis**
```bash
oura_get_heart_rate_data
```
- **Parameters**: `start_datetime` (ISO 8601), `end_datetime` (optional)
- **Returns**: Continuous heart rate data, HRV measurements
- **Example**: Monitor stress response during development sessions

### 5. **Workout Detection**
```bash
oura_get_workout_data
```
- **Parameters**: `start_date`, `end_date` (optional)
- **Returns**: Detected workouts, duration, intensity, calories
- **Example**: Track exercise consistency and recovery impact

### 6. **User Profile**
```bash
oura_get_user_info
```
- **Returns**: User profile information and device preferences
- **Example**: Validate account connection and settings

### 7. **Recent Health Summary**
```bash
oura_get_recent_summary
```
- **Parameters**: `days` (default: 7)
- **Returns**: Comprehensive health overview with scores and insights
- **Example**: Get weekly health dashboard

### 8. **Trend Analysis**
```bash
oura_analyze_trends
```
- **Parameters**: `metric` (sleep_score|readiness_score|activity_score|resting_heart_rate), `start_date`, `end_date`
- **Returns**: Statistical trend analysis with interpretation
- **Example**: Track readiness improvements over training cycles

### 9. **Recovery Insights**
```bash
oura_get_recovery_insights
```
- **Parameters**: `days_to_analyze` (default: 14)
- **Returns**: Recovery status, recommendations, trend analysis
- **Example**: Generate personalized recovery recommendations

## 💡 Usage Examples

### Developer Wellness Monitoring
```javascript
// Check readiness before starting work
const readiness = await oura_get_readiness_data({
  start_date: "2025-12-18"
});

// Analyze sleep impact on coding performance
const sleepTrend = await oura_analyze_trends({
  metric: "sleep_score",
  start_date: "2025-12-01",
  end_date: "2025-12-18"
});
```

### Health-Aware Sprint Planning
```javascript
// Get team health summary for capacity planning
const healthSummary = await oura_get_recent_summary({
  days: 7
});

// Generate recovery insights for workload optimization
const recovery = await oura_get_recovery_insights({
  days_to_analyze: 14
});
```

### Real-time Health Monitoring
```javascript
// Monitor stress levels during deployment
const heartRate = await oura_get_heart_rate_data({
  start_datetime: "2025-12-18T09:00:00Z",
  end_datetime: "2025-12-18T17:00:00Z"
});
```

## 🤖 Agent Integration Examples

### 1. **Workload Balancer Agent**
```javascript
// Adjust task complexity based on readiness
const readiness = await getReadinessScore();
if (readiness < 70) {
  assignLowerIntensityTasks();
} else {
  assignChallengineTasks();
}
```

### 2. **Break Reminder Agent**
```javascript
// Suggest breaks based on heart rate patterns
const hr = await getCurrentHeartRate();
if (hr > restingHR * 1.3) {
  suggestBreak("Elevated stress detected");
}
```

### 3. **Sleep Optimization Agent**
```javascript
// Recommend bedtime based on sleep patterns
const sleepData = await getRecentSleepData();
const optimalBedtime = calculateOptimalBedtime(sleepData);
sendNotification(`Optimal bedtime: ${optimalBedtime}`);
```

## 📈 Health Metrics Explained

### Sleep Score Components
- **Duration**: Time spent asleep
- **Efficiency**: Percentage of time in bed actually sleeping
- **Restfulness**: Amount of tossing and turning
- **REM Sleep**: Cognitive restoration phase
- **Deep Sleep**: Physical restoration phase

### Readiness Score Factors
- **Previous Night**: Sleep quality impact
- **Sleep Balance**: Recent sleep debt/surplus
- **Previous Day Activity**: Recovery vs. activity load
- **Activity Balance**: Long-term activity patterns
- **Body Temperature**: Temperature regulation
- **HRV Balance**: Heart rate variability trends
- **Recovery Index**: Overall recovery status
- **Resting Heart Rate**: Cardiovascular readiness

### Activity Score Elements
- **Stay Active**: Regular movement throughout the day
- **Move Every Hour**: Avoiding prolonged sedentary periods
- **Meet Daily Targets**: Steps, calories, activity goals
- **Activity Balance**: High vs. low activity days

## 🔒 Security & Privacy

### Data Handling
- All data is fetched in real-time from Oura API
- No health data is stored locally or cached
- API calls use secure HTTPS encryption
- Access tokens are managed via environment variables

### Privacy Considerations
- Only aggregated and anonymous insights are shared with agents
- Raw biometric data remains confidential
- User consent required for any data sharing
- Compliance with health data privacy regulations

## 🚨 Rate Limits & Best Practices

### API Limits
- **Personal Access Token**: 5,000 requests/day
- **OAuth2**: Higher limits for production apps
- **Request Frequency**: Max 1 request/second recommended

### Best Practices
- Cache frequent queries (user info, older data)
- Use date ranges efficiently
- Implement exponential backoff for rate limit handling
- Monitor token expiration and refresh proactively

## 🔧 Troubleshooting

### Common Issues

#### Invalid Access Token
```bash
Error: Oura API error: 401 - Unauthorized
```
**Solution**: Verify `OURA_ACCESS_TOKEN` is correctly set

#### Rate Limit Exceeded
```bash
Error: Oura API error: 429 - Too Many Requests
```
**Solution**: Implement request throttling, retry with exponential backoff

#### No Data Available
```bash
No sleep data found for the specified date range
```
**Solution**: Check date format (YYYY-MM-DD), ensure Oura Ring was worn

#### API Endpoint Changes
```bash
Error: Oura API error: 404 - Not Found
```
**Solution**: Update to latest API version, check endpoint URLs

### Debug Mode
Enable verbose logging:
```bash
export DEBUG=oura-mcp-server
node .claude/mcp-servers/oura-integration/oura-ring.js
```

## 🌐 Integration Opportunities

### Business Intelligence
- Correlate team health with productivity metrics
- Identify optimal work schedules per individual
- Predict burnout risk based on recovery trends
- Generate health-informed resource allocation

### Autonomous Agents
- **Scheduler Agent**: Adjust meetings based on energy levels
- **Task Agent**: Assign complexity based on readiness
- **Wellness Agent**: Proactive health recommendations
- **Performance Agent**: Optimize work patterns for health

### Dashboard Widgets
- Real-time readiness indicators
- Sleep quality trends
- Activity goal progress
- Recovery status alerts

## 📚 API Reference

### Oura API v2 Documentation
- [Official Docs](https://cloud.ouraring.com/v2/docs)
- [Developer Portal](https://developer.ouraring.com/docs/api/v2/oura-api-documentation)
- [OAuth2 Guide](https://partnersupport.ouraring.com/hc/en-us/articles/19907726838163)

### Data Models
- Sleep Data: Heart rate intervals, HRV, sleep phases
- Readiness Data: Scores, contributing factors, trends
- Activity Data: Steps, calories, movement patterns
- Heart Rate: Continuous monitoring, variability analysis

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install @modelcontextprotocol/sdk`
3. Set up environment variables
4. Test with sandbox data: `export OURA_USE_SANDBOX=true`

### Adding New Features
- Follow Oura API v2 patterns
- Add comprehensive error handling
- Include analysis and interpretation logic
- Update documentation and examples

### Testing
```bash
# Test MCP server startup
node .claude/mcp-servers/oura-integration/oura-ring.js

# Test specific endpoints (requires valid token)
npm run test
```

---

## 📄 Sources

- [Oura API Documentation (2.0)](https://cloud.ouraring.com/v2/docs)
- [The Oura API – Oura Help](https://support.ouraring.com/hc/en-us/articles/4415266939155-The-Oura-API)
- [Oura API V2 Upgrade Guide – Oura Partners](https://partnersupport.ouraring.com/hc/en-us/articles/19907726838163-Oura-API-V2-Upgrade-Guide)
- [Oura Ring v2 Custom Integration - Home Assistant Community](https://community.home-assistant.io/t/oura-ring-v2-custom-integration-track-your-sleep-readiness-activity-in-home-assistant/944424)

*Part of the Miyabi AntiGravity Edition autonomous development platform*
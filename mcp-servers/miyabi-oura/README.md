# Miyabi Oura MCP Server

A comprehensive Oura Health API MCP server for the Miyabi Multi-Agent System. Provides OAuth authentication, health data retrieval, analysis, and Miyabi-specific health monitoring integrations.

## Features

### OAuth Authentication
- Complete OAuth 2.0 flow implementation
- Secure token storage and management
- Automatic token expiration handling

### Health Data Access
- Sleep data (scores, efficiency, sleep stages)
- Activity data (steps, calories, movement patterns)
- Readiness data (recovery indicators, HRV, RHR)
- Heart rate data (continuous monitoring)
- Session data (workout tracking)

### Miyabi Integration
- Health summary reports with insights
- Automated health recommendations
- Miyabi-formatted health notifications
- Agent-friendly data analysis

### Data Analysis
- Comprehensive health scoring
- Trend analysis and recommendations
- Personalized insights based on Oura metrics

## Installation

1. Navigate to the server directory:
```bash
cd mcp-servers/miyabi-oura
```

2. Install dependencies:
```bash
npm install
```

3. Build the server:
```bash
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file or set the following environment variables:

```bash
# Oura OAuth Configuration (from your Oura API app)
OURA_CLIENT_ID=JQDX6RDL45TI6OIE
OURA_CLIENT_SECRET=UMAJCZ6OUPJJGCPT4FUZNWNWM3J6DKZQ
OURA_REDIRECT_URI=http://localhost:5173/callback

# Token storage location (optional)
OURA_TOKEN_FILE=~/.miyabi/oura_token.json
```

### Oura API Setup

Your Oura API application is already configured with:
- **Client ID**: `JQDX6RDL45TI6OIE`
- **Client Secret**: `UMAJCZ6OUPJJGCPT4FUZNWNWM3J6DKZQ`
- **Redirect URIs**:
  - `https://localhost/callback`
  - `http://localhost:5173/callback`

## Usage

### Starting the Server

```bash
# Production
npm start

# Development
npm run dev
```

### Authentication Flow

1. **Start Authentication**:
```json
{
  "tool": "oura_authenticate"
}
```

2. **Visit the provided OAuth URL** in your browser

3. **Complete authorization** with Oura

4. **Exchange the authorization code**:
```json
{
  "tool": "oura_exchange_token",
  "arguments": {
    "code": "authorization_code_from_callback"
  }
}
```

## Available Tools

### Authentication

#### `oura_authenticate`
Start the OAuth authentication flow.

```json
{
  "tool": "oura_authenticate"
}
```

#### `oura_exchange_token`
Exchange authorization code for access token.

```json
{
  "tool": "oura_exchange_token",
  "arguments": {
    "code": "authorization_code_from_oauth_callback"
  }
}
```

### Personal Information

#### `oura_get_personal_info`
Get user's personal information.

```json
{
  "tool": "oura_get_personal_info"
}
```

### Health Data Retrieval

#### `oura_get_sleep_data`
Get sleep data for a date range.

```json
{
  "tool": "oura_get_sleep_data",
  "arguments": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-07"
  }
}
```

#### `oura_get_activity_data`
Get activity data for a date range.

```json
{
  "tool": "oura_get_activity_data",
  "arguments": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-07"
  }
}
```

#### `oura_get_readiness_data`
Get readiness data for a date range.

```json
{
  "tool": "oura_get_readiness_data",
  "arguments": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-07"
  }
}
```

#### `oura_get_heart_rate_data`
Get heart rate data for a datetime range.

```json
{
  "tool": "oura_get_heart_rate_data",
  "arguments": {
    "start_datetime": "2024-01-01T00:00:00Z",
    "end_datetime": "2024-01-01T23:59:59Z"
  }
}
```

#### `oura_get_session_data`
Get workout session data.

```json
{
  "tool": "oura_get_session_data",
  "arguments": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-07"
  }
}
```

### Analysis and Insights

#### `oura_health_summary`
Get comprehensive health summary with insights.

```json
{
  "tool": "oura_health_summary",
  "arguments": {
    "date": "2024-01-15"
  }
}
```

**Response includes**:
- Sleep, activity, and readiness scores
- Key health metrics
- Overall health score
- Personalized recommendations

#### `oura_miyabi_health_report`
Generate Miyabi-formatted health report.

```json
{
  "tool": "oura_miyabi_health_report",
  "arguments": {
    "date": "2024-01-15",
    "notification_type": "info"
  }
}
```

**Generates**:
- Miyabi-formatted health notification
- Alert level based on health scores
- Detailed recommendations
- Agent-friendly data structure

## Integration with Miyabi

### Daily Health Monitoring

```typescript
// Get daily health summary
const healthSummary = await oura_health_summary({
  date: "2024-01-15"
});

// Generate Miyabi health report
const healthReport = await oura_miyabi_health_report({
  date: "2024-01-15"
});

// Use with Discord MCP for notifications
await discord_miyabi_notification({
  type: healthReport.type,
  title: healthReport.title,
  message: healthReport.message,
  agent: healthReport.agent,
  task: healthReport.task,
  details: healthReport.details
});
```

### Automated Health Alerts

```typescript
// Check today's health metrics
const report = await oura_miyabi_health_report({});

// Send alert if concerning metrics
if (report.type === "error" || report.type === "warning") {
  await discord_miyabi_notification(report);
}
```

### Weekly Health Analysis

```typescript
// Get week of data
const weekData = [];
for (let i = 0; i < 7; i++) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  const dateStr = date.toISOString().split('T')[0];

  const summary = await oura_health_summary({ date: dateStr });
  weekData.push(summary);
}

// Analyze trends and generate insights
```

## Health Metrics and Insights

### Sleep Analysis
- **Sleep Score**: Overall sleep quality (0-100)
- **Efficiency**: Time asleep vs. time in bed
- **Sleep Stages**: Deep sleep, REM sleep percentages
- **Recommendations**: Based on sleep patterns

### Activity Analysis
- **Activity Score**: Daily movement and exercise (0-100)
- **Steps and Calories**: Daily activity metrics
- **Movement Patterns**: Hourly activity tracking
- **Recommendations**: Activity improvement suggestions

### Readiness Analysis
- **Readiness Score**: Recovery and preparation for activity (0-100)
- **Heart Rate Variability**: Autonomic nervous system balance
- **Resting Heart Rate**: Cardiovascular health indicator
- **Body Temperature**: Recovery and illness indicators

### Automated Recommendations

The server provides intelligent recommendations based on:

1. **Sleep Quality**:
   - Bedtime optimization
   - Sleep environment improvements
   - Sleep efficiency enhancement

2. **Activity Levels**:
   - Movement targets
   - Exercise recommendations
   - Recovery suggestions

3. **Recovery Status**:
   - Rest day recommendations
   - Stress management
   - Training intensity adjustments

## Error Handling

### Authentication Issues
- Token expiration handling
- Automatic re-authentication prompts
- Secure token storage

### API Rate Limiting
- Respectful API usage
- Error handling for rate limits
- Retry mechanisms

### Data Validation
- Input parameter validation
- Date range verification
- Error reporting

## Security Considerations

1. **Token Security**: Access tokens are stored securely in `~/.miyabi/oura_token.json`
2. **OAuth Flow**: Complete OAuth 2.0 implementation with state verification
3. **API Limits**: Respects Oura API rate limits and usage guidelines
4. **Data Privacy**: Health data is only accessed when explicitly requested

## Development

### Project Structure
```
miyabi-oura/
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Built JavaScript files
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment variable template
└── README.md             # This documentation
```

### Building and Testing
```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode
npm run dev

# Production start
npm start
```

## API Reference

### Oura API Endpoints Used
- `/v2/usercollection/personal_info` - Personal information
- `/v2/usercollection/daily_sleep` - Daily sleep data
- `/v2/usercollection/daily_activity` - Daily activity data
- `/v2/usercollection/daily_readiness` - Daily readiness data
- `/v2/usercollection/heartrate` - Heart rate data
- `/v2/usercollection/session` - Workout session data

### Authentication
- OAuth 2.0 authorization code flow
- Bearer token authentication
- Automatic token refresh handling

## Troubleshooting

### Common Issues

1. **Authentication failed**
   - Verify client ID and secret are correct
   - Check redirect URI matches Oura app settings
   - Ensure callback URL is accessible

2. **Token expired**
   - Run `oura_authenticate` again
   - Check token file permissions
   - Verify system clock is accurate

3. **API errors**
   - Check Oura service status
   - Verify date formats (YYYY-MM-DD)
   - Ensure user has data for requested dates

### Debug Mode

Enable debug logging:
```bash
DEBUG=oura* npm start
```

## License

MIT License - see the main project license for details.

## Contributing

This is part of the Miyabi Multi-Agent System. Please follow the project's contribution guidelines.
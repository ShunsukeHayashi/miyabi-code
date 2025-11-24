/**
 * MaintenanceAgent - Post-Deployment Operations & Observability
 *
 * Phase E: Maintenance & Observability (Framework Phase 6)
 *
 * Purpose:
 * - Configure performance monitoring
 * - Set up application metrics & dashboards
 * - Configure alerting with runbooks
 * - Provide performance optimization recommendations
 * - Plan for scalability (2x, 5x, 10x growth)
 * - Set up user feedback collection
 *
 * Input: Deployed application info + project spec
 * Output: Comprehensive maintenance & observability configuration
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Main orchestration function for maintenance setup
 */
export async function setupMaintenance(deployedApp, projectSpec) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 MaintenanceAgent - Post-Deployment Operations Setup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const outputDir = path.join(
    new URL('.', import.meta.url).pathname,
    '../../output/maintenance',
    sanitizeFileName(projectSpec.project_name)
  );

  await fs.mkdir(outputDir, { recursive: true });

  console.log('📊 Setting up maintenance operations...\n');

  // 1. Monitoring Setup
  console.log('  1️⃣  Configuring Performance Monitoring...');
  const monitoring = await setupMonitoring(deployedApp, projectSpec, outputDir);

  // 2. Metrics & Analytics
  console.log('  2️⃣  Setting up Application Metrics...');
  const metrics = await setupMetrics(deployedApp, projectSpec, outputDir);

  // 3. Alerting Configuration
  console.log('  3️⃣  Configuring Alerting & Runbooks...');
  const alerting = await setupAlerting(deployedApp, projectSpec, outputDir);

  // 4. Performance Optimization
  console.log('  4️⃣  Generating Performance Optimization Recommendations...');
  const optimization = await generateOptimizationPlan(deployedApp, projectSpec, outputDir);

  // 5. Scalability Planning
  console.log('  5️⃣  Creating Scalability Plan...');
  const scalability = await createScalabilityPlan(deployedApp, projectSpec, outputDir);

  // 6. User Feedback System
  console.log('  6️⃣  Setting up User Feedback Collection...');
  const feedback = await setupFeedbackSystem(deployedApp, projectSpec, outputDir);

  console.log('\n✅ Maintenance configuration complete!\n');

  return {
    output_directory: outputDir,
    monitoring: monitoring,
    metrics: metrics,
    alerting: alerting,
    optimization: optimization,
    scalability: scalability,
    feedback: feedback,
    generated_at: new Date().toISOString(),
    config_files: await listGeneratedFiles(outputDir)
  };
}

/**
 * 1. Performance Monitoring Setup
 */
async function setupMonitoring(deployedApp, projectSpec, outputDir) {
  const monitoringDir = path.join(outputDir, 'monitoring');
  await fs.mkdir(monitoringDir, { recursive: true });

  const monitoringConfig = {
    monitoring_type: 'performance_and_health',
    endpoints: {
      health: `${deployedApp.health_url}`,
      metrics: `${deployedApp.webhook_url}/metrics`,
      status: `${deployedApp.webhook_url}/status`
    },
    checks: [
      {
        name: 'Application Health',
        endpoint: '/health',
        interval_seconds: 60,
        timeout_seconds: 10,
        expected_status: 200,
        alerts_on_failure: true
      },
      {
        name: 'Response Time',
        endpoint: '/metrics',
        interval_seconds: 300,
        threshold_ms: 500,
        alerts_on_threshold: true
      },
      {
        name: 'Error Rate',
        endpoint: '/metrics',
        interval_seconds: 300,
        threshold_percent: 5,
        alerts_on_threshold: true
      },
      {
        name: 'Memory Usage',
        endpoint: '/metrics',
        interval_seconds: 600,
        threshold_percent: 80,
        alerts_on_threshold: true
      },
      {
        name: 'CPU Usage',
        endpoint: '/metrics',
        interval_seconds: 600,
        threshold_percent: 70,
        alerts_on_threshold: true
      }
    ],
    data_retention: {
      metrics_retention_days: 90,
      logs_retention_days: 30,
      traces_retention_days: 7
    },
    recommended_tools: [
      {
        name: 'Prometheus',
        purpose: 'Metrics collection and storage',
        setup_complexity: 'medium',
        cost: 'free (self-hosted)'
      },
      {
        name: 'Grafana',
        purpose: 'Metrics visualization and dashboards',
        setup_complexity: 'low',
        cost: 'free (self-hosted)'
      },
      {
        name: 'Lark Bot Monitoring',
        purpose: 'Custom Lark notifications for alerts',
        setup_complexity: 'low',
        cost: 'free'
      }
    ]
  };

  // Save monitoring config
  await fs.writeFile(
    path.join(monitoringDir, 'monitoring-config.json'),
    JSON.stringify(monitoringConfig, null, 2)
  );

  // Generate monitoring setup guide
  const monitoringGuide = generateMonitoringGuide(monitoringConfig, projectSpec);
  await fs.writeFile(
    path.join(monitoringDir, 'MONITORING_SETUP.md'),
    monitoringGuide
  );

  return {
    config_file: path.join(monitoringDir, 'monitoring-config.json'),
    guide_file: path.join(monitoringDir, 'MONITORING_SETUP.md'),
    health_check_count: monitoringConfig.checks.length,
    recommended_tools: monitoringConfig.recommended_tools.length
  };
}

/**
 * 2. Application Metrics & Dashboards
 */
async function setupMetrics(deployedApp, projectSpec, outputDir) {
  const metricsDir = path.join(outputDir, 'metrics');
  await fs.mkdir(metricsDir, { recursive: true });

  const metricsConfig = {
    application_metrics: [
      {
        name: 'lark_messages_received_total',
        type: 'counter',
        description: 'Total number of Lark messages received',
        labels: ['event_type', 'message_type']
      },
      {
        name: 'lark_messages_processed_total',
        type: 'counter',
        description: 'Total number of messages successfully processed',
        labels: ['intent_type', 'success']
      },
      {
        name: 'lark_api_requests_total',
        type: 'counter',
        description: 'Total number of Lark API requests',
        labels: ['api_endpoint', 'status_code']
      },
      {
        name: 'lark_response_time_seconds',
        type: 'histogram',
        description: 'Response time for message processing',
        buckets: [0.1, 0.5, 1.0, 2.0, 5.0]
      },
      {
        name: 'lark_api_errors_total',
        type: 'counter',
        description: 'Total number of Lark API errors',
        labels: ['error_type', 'api_endpoint']
      },
      {
        name: 'lark_active_users_gauge',
        type: 'gauge',
        description: 'Number of active users in last 24 hours'
      },
      {
        name: 'lark_memory_usage_bytes',
        type: 'gauge',
        description: 'Current memory usage in bytes'
      },
      {
        name: 'lark_cpu_usage_percent',
        type: 'gauge',
        description: 'Current CPU usage percentage'
      }
    ],
    dashboards: [
      {
        name: 'Application Overview',
        panels: [
          'Messages Received (24h)',
          'Messages Processed (24h)',
          'Success Rate (%)',
          'Average Response Time',
          'Error Rate',
          'Active Users'
        ]
      },
      {
        name: 'Performance Metrics',
        panels: [
          'Response Time Percentiles (p50, p95, p99)',
          'API Request Rate',
          'Error Rate by Type',
          'Memory Usage Trend',
          'CPU Usage Trend'
        ]
      },
      {
        name: 'User Engagement',
        panels: [
          'Daily Active Users',
          'Message Volume by Hour',
          'Intent Type Distribution',
          'User Retention (7d, 30d)'
        ]
      }
    ],
    export_format: 'prometheus'
  };

  // Save metrics config
  await fs.writeFile(
    path.join(metricsDir, 'metrics-config.json'),
    JSON.stringify(metricsConfig, null, 2)
  );

  // Generate Grafana dashboard config
  const grafanaConfig = generateGrafanaDashboard(metricsConfig);
  await fs.writeFile(
    path.join(metricsDir, 'grafana-dashboard.json'),
    JSON.stringify(grafanaConfig, null, 2)
  );

  // Generate metrics implementation guide
  const metricsGuide = generateMetricsGuide(metricsConfig, projectSpec);
  await fs.writeFile(
    path.join(metricsDir, 'METRICS_GUIDE.md'),
    metricsGuide
  );

  return {
    config_file: path.join(metricsDir, 'metrics-config.json'),
    dashboard_file: path.join(metricsDir, 'grafana-dashboard.json'),
    guide_file: path.join(metricsDir, 'METRICS_GUIDE.md'),
    metric_count: metricsConfig.application_metrics.length,
    dashboard_count: metricsConfig.dashboards.length
  };
}

/**
 * 3. Alerting Configuration
 */
async function setupAlerting(deployedApp, projectSpec, outputDir) {
  const alertingDir = path.join(outputDir, 'alerting');
  await fs.mkdir(alertingDir, { recursive: true });

  const alertingConfig = {
    alert_rules: [
      {
        name: 'HighErrorRate',
        severity: 'critical',
        condition: 'error_rate > 5% for 5 minutes',
        description: 'Error rate exceeds 5% threshold',
        notification_channels: ['lark', 'email'],
        runbook_url: 'runbooks/high-error-rate.md'
      },
      {
        name: 'SlowResponseTime',
        severity: 'warning',
        condition: 'p95_response_time > 2s for 10 minutes',
        description: 'Response time degradation detected',
        notification_channels: ['lark'],
        runbook_url: 'runbooks/slow-response.md'
      },
      {
        name: 'HighMemoryUsage',
        severity: 'warning',
        condition: 'memory_usage > 80% for 15 minutes',
        description: 'Memory usage approaching limit',
        notification_channels: ['lark', 'email'],
        runbook_url: 'runbooks/high-memory.md'
      },
      {
        name: 'ServiceDown',
        severity: 'critical',
        condition: 'health_check_failed for 3 consecutive attempts',
        description: 'Application health check failing',
        notification_channels: ['lark', 'email', 'sms'],
        runbook_url: 'runbooks/service-down.md'
      },
      {
        name: 'LowUserEngagement',
        severity: 'info',
        condition: 'daily_active_users < 50% of 7d average',
        description: 'User engagement drop detected',
        notification_channels: ['email'],
        runbook_url: 'runbooks/low-engagement.md'
      }
    ],
    notification_config: {
      lark: {
        webhook_url: 'CONFIGURE_LARK_WEBHOOK_URL',
        mention_users: ['@all'],
        message_template: '🚨 Alert: ${alert_name}\n📊 Severity: ${severity}\n📝 ${description}\n🔗 Runbook: ${runbook_url}'
      },
      email: {
        recipients: ['team@example.com'],
        subject_template: '[${severity}] ${alert_name}',
        from: 'alerts@example.com'
      }
    }
  };

  // Save alerting config
  await fs.writeFile(
    path.join(alertingDir, 'alerting-config.json'),
    JSON.stringify(alertingConfig, null, 2)
  );

  // Generate runbooks
  const runbooksDir = path.join(alertingDir, 'runbooks');
  await fs.mkdir(runbooksDir, { recursive: true });

  for (const alert of alertingConfig.alert_rules) {
    const runbook = generateRunbook(alert, projectSpec);
    const runbookFilename = alert.runbook_url.split('/').pop();
    await fs.writeFile(
      path.join(runbooksDir, runbookFilename),
      runbook
    );
  }

  // Generate alerting setup guide
  const alertingGuide = generateAlertingGuide(alertingConfig, projectSpec);
  await fs.writeFile(
    path.join(alertingDir, 'ALERTING_SETUP.md'),
    alertingGuide
  );

  return {
    config_file: path.join(alertingDir, 'alerting-config.json'),
    guide_file: path.join(alertingDir, 'ALERTING_SETUP.md'),
    runbooks_directory: runbooksDir,
    alert_rule_count: alertingConfig.alert_rules.length,
    runbook_count: alertingConfig.alert_rules.length
  };
}

/**
 * 4. Performance Optimization Recommendations
 */
async function generateOptimizationPlan(deployedApp, projectSpec, outputDir) {
  const optimizationDir = path.join(outputDir, 'optimization');
  await fs.mkdir(optimizationDir, { recursive: true });

  const optimizationPlan = {
    recommendations: [
      {
        priority: 'P0',
        category: 'caching',
        title: 'Implement Response Caching',
        description: 'Cache frequently accessed Lark API responses to reduce latency and API call volume',
        implementation: {
          strategy: 'In-memory cache with Redis fallback',
          cache_duration: '5-15 minutes depending on data type',
          invalidation_triggers: ['user update event', 'group update event']
        },
        expected_impact: {
          response_time_improvement: '30-50%',
          api_call_reduction: '60-70%',
          cost_savings: 'Moderate'
        },
        effort: 'Medium (2-3 days)'
      },
      {
        priority: 'P1',
        category: 'database',
        title: 'Optimize Database Queries',
        description: 'Add indexes and optimize slow queries identified in monitoring',
        implementation: {
          actions: [
            'Add composite indexes on frequently queried columns',
            'Use query result caching for static data',
            'Implement connection pooling'
          ]
        },
        expected_impact: {
          query_performance: '40-60% faster',
          database_load: '30% reduction'
        },
        effort: 'Low (1-2 days)'
      },
      {
        priority: 'P1',
        category: 'async_processing',
        title: 'Implement Async Background Jobs',
        description: 'Move non-critical tasks to background job queue',
        implementation: {
          use_case: [
            'Analytics data aggregation',
            'User notification batching',
            'Report generation'
          ],
          suggested_tool: 'Bull queue with Redis'
        },
        expected_impact: {
          response_time: '20-30% faster for API endpoints',
          user_experience: 'Significantly improved'
        },
        effort: 'Medium (3-4 days)'
      },
      {
        priority: 'P2',
        category: 'cdn',
        title: 'Use CDN for Static Assets',
        description: 'Serve static assets through CDN to reduce server load',
        implementation: {
          assets: ['Images', 'Card templates', 'Static files'],
          suggested_cdn: 'Cloudflare or AWS CloudFront'
        },
        expected_impact: {
          load_time: '50-70% faster for static content',
          server_load: '20-30% reduction'
        },
        effort: 'Low (1 day)'
      },
      {
        priority: 'P2',
        category: 'code_optimization',
        title: 'Code-level Performance Improvements',
        description: 'Optimize hot paths and remove performance bottlenecks',
        implementation: {
          focus_areas: [
            'Reduce unnecessary JSON parsing',
            'Optimize loop iterations',
            'Use efficient data structures',
            'Minimize regex usage in hot paths'
          ]
        },
        expected_impact: {
          cpu_usage: '10-20% reduction',
          response_time: '10-15% improvement'
        },
        effort: 'Medium (2-3 days)'
      }
    ]
  };

  // Save optimization plan
  await fs.writeFile(
    path.join(optimizationDir, 'optimization-plan.json'),
    JSON.stringify(optimizationPlan, null, 2)
  );

  // Generate detailed optimization guide
  const optimizationGuide = generateOptimizationGuide(optimizationPlan, projectSpec);
  await fs.writeFile(
    path.join(optimizationDir, 'OPTIMIZATION_GUIDE.md'),
    optimizationGuide
  );

  return {
    plan_file: path.join(optimizationDir, 'optimization-plan.json'),
    guide_file: path.join(optimizationDir, 'OPTIMIZATION_GUIDE.md'),
    recommendation_count: optimizationPlan.recommendations.length,
    priority_breakdown: {
      p0: optimizationPlan.recommendations.filter(r => r.priority === 'P0').length,
      p1: optimizationPlan.recommendations.filter(r => r.priority === 'P1').length,
      p2: optimizationPlan.recommendations.filter(r => r.priority === 'P2').length
    }
  };
}

/**
 * 5. Scalability Planning
 */
async function createScalabilityPlan(deployedApp, projectSpec, outputDir) {
  const scalabilityDir = path.join(outputDir, 'scalability');
  await fs.mkdir(scalabilityDir, { recursive: true });

  const scalabilityPlan = {
    current_capacity: {
      estimated_users: '100-500',
      estimated_messages_per_day: '1,000-5,000',
      infrastructure: 'Single server deployment'
    },
    growth_scenarios: [
      {
        scenario: '2x Growth (Short-term: 3-6 months)',
        target_users: '1,000',
        target_messages_per_day: '10,000',
        infrastructure_changes: [
          'Vertical scaling: Upgrade server resources (2x CPU, 2x RAM)',
          'Add Redis for caching and session management',
          'Implement database read replicas'
        ],
        cost_estimate: '+50% infrastructure cost',
        implementation_complexity: 'Low',
        timeline: '1-2 weeks'
      },
      {
        scenario: '5x Growth (Medium-term: 6-12 months)',
        target_users: '5,000',
        target_messages_per_day: '50,000',
        infrastructure_changes: [
          'Horizontal scaling: Load balancer + 3-5 application servers',
          'Dedicated database server with read replicas',
          'Redis cluster for distributed caching',
          'Message queue for async processing (Bull/RabbitMQ)',
          'CDN for static assets'
        ],
        cost_estimate: '+200-300% infrastructure cost',
        implementation_complexity: 'Medium',
        timeline: '4-6 weeks'
      },
      {
        scenario: '10x Growth (Long-term: 12-24 months)',
        target_users: '10,000+',
        target_messages_per_day: '100,000+',
        infrastructure_changes: [
          'Multi-region deployment for high availability',
          'Auto-scaling groups with 10+ application servers',
          'Database sharding and partitioning',
          'Microservices architecture (separate services for different intents)',
          'Event-driven architecture with Kafka/AWS SQS',
          'API Gateway for rate limiting and routing',
          'Full observability stack (Prometheus, Grafana, ELK)'
        ],
        cost_estimate: '+500-800% infrastructure cost',
        implementation_complexity: 'High',
        timeline: '8-12 weeks'
      }
    ],
    bottleneck_analysis: {
      current_bottlenecks: [
        {
          component: 'Lark API Rate Limits',
          impact: 'High',
          mitigation: 'Implement request queuing and caching'
        },
        {
          component: 'Single Server',
          impact: 'High',
          mitigation: 'Horizontal scaling with load balancer'
        },
        {
          component: 'Database',
          impact: 'Medium',
          mitigation: 'Read replicas and query optimization'
        },
        {
          component: 'Synchronous Processing',
          impact: 'Medium',
          mitigation: 'Async job queue for background tasks'
        }
      ]
    },
    monitoring_for_scale: {
      key_metrics: [
        'Requests per second (RPS)',
        'Database connection pool utilization',
        'Cache hit rate',
        'Queue depth (for async jobs)',
        'Error rate by service component'
      ],
      scaling_triggers: [
        'CPU > 70% for 10 minutes → Auto-scale up',
        'Memory > 80% for 10 minutes → Auto-scale up',
        'Response time p95 > 2s → Investigate/scale',
        'Error rate > 2% → Alert + investigate'
      ]
    }
  };

  // Save scalability plan
  await fs.writeFile(
    path.join(scalabilityDir, 'scalability-plan.json'),
    JSON.stringify(scalabilityPlan, null, 2)
  );

  // Generate scalability guide
  const scalabilityGuide = generateScalabilityGuide(scalabilityPlan, projectSpec);
  await fs.writeFile(
    path.join(scalabilityDir, 'SCALABILITY_GUIDE.md'),
    scalabilityGuide
  );

  return {
    plan_file: path.join(scalabilityDir, 'scalability-plan.json'),
    guide_file: path.join(scalabilityDir, 'SCALABILITY_GUIDE.md'),
    scenario_count: scalabilityPlan.growth_scenarios.length,
    bottleneck_count: scalabilityPlan.bottleneck_analysis.current_bottlenecks.length
  };
}

/**
 * 6. User Feedback Collection System
 */
async function setupFeedbackSystem(deployedApp, projectSpec, outputDir) {
  const feedbackDir = path.join(outputDir, 'feedback');
  await fs.mkdir(feedbackDir, { recursive: true });

  const feedbackConfig = {
    collection_methods: [
      {
        method: 'In-App Feedback Command',
        trigger: 'User sends /feedback command',
        questions: [
          'How satisfied are you with the bot? (1-5 stars)',
          'What feature would you like to see improved?',
          'Any additional comments?'
        ],
        implementation: 'Lark interactive card with form fields'
      },
      {
        method: 'Automatic Satisfaction Survey',
        trigger: 'After every 10 interactions',
        questions: [
          'Was this interaction helpful? (Yes/No)',
          'How would you rate the response quality? (1-5)'
        ],
        implementation: 'Lark card with quick reply buttons'
      },
      {
        method: 'Feature Request Channel',
        trigger: 'Dedicated Lark group for feature requests',
        purpose: 'Collect and prioritize user feature requests',
        implementation: 'Monitor dedicated group, tag feature requests'
      }
    ],
    feedback_analysis: {
      metrics_to_track: [
        'Net Promoter Score (NPS)',
        'Customer Satisfaction Score (CSAT)',
        'Feature request frequency',
        'Bug report frequency',
        'User retention rate'
      ],
      review_frequency: 'Weekly',
      action_thresholds: {
        low_satisfaction: 'CSAT < 3.5 → Immediate investigation',
        high_bug_reports: 'Bugs > 10/week → Sprint focus on stability',
        popular_feature: 'Feature requested > 5 times → Add to backlog'
      }
    },
    survey_schedule: {
      initial_survey: {
        timing: '3 days after first use',
        focus: 'Onboarding experience'
      },
      regular_surveys: {
        frequency: 'Monthly',
        focus: 'Overall satisfaction and feature priorities'
      },
      exit_survey: {
        trigger: 'User inactive for 30 days',
        focus: 'Reasons for churn'
      }
    }
  };

  // Save feedback config
  await fs.writeFile(
    path.join(feedbackDir, 'feedback-config.json'),
    JSON.stringify(feedbackConfig, null, 2)
  );

  // Generate Lark card templates for feedback
  const feedbackCardTemplate = generateFeedbackCardTemplate();
  await fs.writeFile(
    path.join(feedbackDir, 'feedback-card-template.json'),
    JSON.stringify(feedbackCardTemplate, null, 2)
  );

  // Generate feedback system guide
  const feedbackGuide = generateFeedbackGuide(feedbackConfig, projectSpec);
  await fs.writeFile(
    path.join(feedbackDir, 'FEEDBACK_SYSTEM.md'),
    feedbackGuide
  );

  return {
    config_file: path.join(feedbackDir, 'feedback-config.json'),
    card_template_file: path.join(feedbackDir, 'feedback-card-template.json'),
    guide_file: path.join(feedbackDir, 'FEEDBACK_SYSTEM.md'),
    collection_method_count: feedbackConfig.collection_methods.length,
    metric_count: feedbackConfig.feedback_analysis.metrics_to_track.length
  };
}

// ============================================================================
// Helper Functions: Documentation Generation
// ============================================================================

function generateMonitoringGuide(config, projectSpec) {
  return `# Monitoring Setup Guide

## Project: ${projectSpec.project_name}

Generated: ${new Date().toISOString()}

---

## 📊 Overview

This guide provides comprehensive instructions for setting up performance monitoring and health checks for your Lark application.

## 🎯 Monitoring Endpoints

### Health Check
- **URL**: \`${config.endpoints.health}\`
- **Method**: GET
- **Expected Response**: \`{"status": "healthy"}\`
- **Check Interval**: Every 60 seconds

### Metrics Endpoint
- **URL**: \`${config.endpoints.metrics}\`
- **Method**: GET
- **Format**: Prometheus-compatible metrics

### Status Endpoint
- **URL**: \`${config.endpoints.status}\`
- **Method**: GET
- **Purpose**: Detailed application status information

---

## 🔍 Health Checks Configuration

${config.checks.map((check, i) => `
### ${i + 1}. ${check.name}

- **Endpoint**: \`${check.endpoint}\`
- **Interval**: ${check.interval_seconds} seconds
${check.timeout_seconds ? `- **Timeout**: ${check.timeout_seconds} seconds` : ''}
${check.threshold_ms ? `- **Threshold**: ${check.threshold_ms} ms` : ''}
${check.threshold_percent ? `- **Threshold**: ${check.threshold_percent}%` : ''}
- **Alerts**: ${check.alerts_on_failure || check.alerts_on_threshold ? 'Enabled' : 'Disabled'}
`).join('\n')}

---

## 🛠️ Recommended Tools

${config.recommended_tools.map((tool, i) => `
### ${i + 1}. ${tool.name}

- **Purpose**: ${tool.purpose}
- **Setup Complexity**: ${tool.setup_complexity}
- **Cost**: ${tool.cost}
`).join('\n')}

---

## 📦 Quick Start with Prometheus & Grafana

### Step 1: Install Prometheus

\`\`\`bash
# Docker installation
docker run -d \\
  --name prometheus \\
  -p 9090:9090 \\
  -v ./prometheus.yml:/etc/prometheus/prometheus.yml \\
  prom/prometheus
\`\`\`

### Step 2: Configure Prometheus

Create \`prometheus.yml\`:

\`\`\`yaml
global:
  scrape_interval: 60s

scrape_configs:
  - job_name: 'lark-bot'
    static_configs:
      - targets: ['${config.endpoints.metrics.replace('http://', '').replace('https://', '')}']
\`\`\`

### Step 3: Install Grafana

\`\`\`bash
# Docker installation
docker run -d \\
  --name grafana \\
  -p 3000:3000 \\
  grafana/grafana
\`\`\`

### Step 4: Access Grafana

1. Open http://localhost:3000
2. Login with admin/admin
3. Add Prometheus as data source
4. Import dashboard from \`grafana-dashboard.json\`

---

## 🔔 Lark Bot Monitoring (Custom Solution)

For lightweight monitoring without external tools:

### Implementation

\`\`\`javascript
// Send monitoring alerts to Lark group
async function sendMonitoringAlert(alert) {
  await larkClient.sendMessage({
    receive_id: 'MONITORING_GROUP_CHAT_ID',
    msg_type: 'interactive',
    content: {
      type: 'template',
      data: {
        template_id: 'monitoring_alert_template',
        template_variable: {
          alert_name: alert.name,
          severity: alert.severity,
          message: alert.message,
          timestamp: new Date().toISOString()
        }
      }
    }
  });
}
\`\`\`

---

## 📈 Data Retention

- **Metrics**: ${config.data_retention.metrics_retention_days} days
- **Logs**: ${config.data_retention.logs_retention_days} days
- **Traces**: ${config.data_retention.traces_retention_days} days

---

## 🚀 Next Steps

1. ✅ Set up Prometheus for metrics collection
2. ✅ Configure Grafana dashboards
3. ✅ Set up alerting (see \`alerting/ALERTING_SETUP.md\`)
4. ✅ Test all health check endpoints
5. ✅ Configure Lark notifications for critical alerts

---

**Need Help?** Refer to the official documentation:
- Prometheus: https://prometheus.io/docs/
- Grafana: https://grafana.com/docs/
- Lark Bot: https://open.feishu.cn/document/
`;
}

function generateMetricsGuide(config, projectSpec) {
  return `# Application Metrics Guide

## Project: ${projectSpec.project_name}

Generated: ${new Date().toISOString()}

---

## 📊 Metrics Overview

This application exports ${config.application_metrics.length} metrics in ${config.export_format} format.

---

## 📈 Available Metrics

${config.application_metrics.map((metric, i) => `
### ${i + 1}. \`${metric.name}\`

- **Type**: ${metric.type}
- **Description**: ${metric.description}
${metric.labels ? `- **Labels**: ${metric.labels.join(', ')}` : ''}
${metric.buckets ? `- **Buckets**: ${metric.buckets.join(', ')}` : ''}
`).join('\n')}

---

## 📊 Dashboards

${config.dashboards.map((dashboard, i) => `
### ${i + 1}. ${dashboard.name}

**Panels:**
${dashboard.panels.map(panel => `- ${panel}`).join('\n')}
`).join('\n')}

---

## 🔧 Implementation Guide

### Step 1: Add Metrics Library

\`\`\`bash
npm install prom-client
\`\`\`

### Step 2: Initialize Metrics

\`\`\`javascript
const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Create custom metrics
const messagesReceived = new client.Counter({
  name: 'lark_messages_received_total',
  help: 'Total number of Lark messages received',
  labelNames: ['event_type', 'message_type'],
  registers: [register]
});

const responseTime = new client.Histogram({
  name: 'lark_response_time_seconds',
  help: 'Response time for message processing',
  buckets: [0.1, 0.5, 1.0, 2.0, 5.0],
  registers: [register]
});

// ... (create other metrics)
\`\`\`

### Step 3: Instrument Your Code

\`\`\`javascript
// Example: Track message processing
app.post('/webhook', async (req, res) => {
  const end = responseTime.startTimer();

  try {
    messagesReceived.inc({
      event_type: req.body.header.event_type,
      message_type: req.body.event.message.message_type
    });

    await processMessage(req.body);

    res.json({ success: true });
  } catch (error) {
    // Track errors
    apiErrors.inc({
      error_type: error.name,
      api_endpoint: '/webhook'
    });

    res.status(500).json({ error: error.message });
  } finally {
    end();
  }
});
\`\`\`

### Step 4: Expose Metrics Endpoint

\`\`\`javascript
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
\`\`\`

---

## 🎨 Grafana Dashboard

Import the generated \`grafana-dashboard.json\` to visualize these metrics.

**Steps:**
1. Open Grafana
2. Go to Dashboards → Import
3. Upload \`grafana-dashboard.json\`
4. Select Prometheus data source
5. Click Import

---

## 📊 Key Metrics to Monitor

### 1. **Success Rate**
\`\`\`
(lark_messages_processed_total{success="true"} / lark_messages_received_total) * 100
\`\`\`

### 2. **Error Rate**
\`\`\`
(lark_api_errors_total / lark_api_requests_total) * 100
\`\`\`

### 3. **Average Response Time**
\`\`\`
rate(lark_response_time_seconds_sum[5m]) / rate(lark_response_time_seconds_count[5m])
\`\`\`

### 4. **P95 Response Time**
\`\`\`
histogram_quantile(0.95, rate(lark_response_time_seconds_bucket[5m]))
\`\`\`

---

## 🚀 Best Practices

1. **Label Cardinality**: Keep label values bounded to avoid metric explosion
2. **Metric Naming**: Follow Prometheus naming conventions (snake_case, _total suffix for counters)
3. **Histogram Buckets**: Choose buckets based on expected response time distribution
4. **Sampling**: For high-volume metrics, consider sampling to reduce overhead

---

**Need Help?** Refer to:
- Prometheus Best Practices: https://prometheus.io/docs/practices/naming/
- prom-client Documentation: https://github.com/siimon/prom-client
`;
}

function generateGrafanaDashboard(config) {
  return {
    dashboard: {
      title: "Lark Bot Application Metrics",
      tags: ["lark", "bot", "application"],
      timezone: "browser",
      panels: [
        {
          id: 1,
          title: "Messages Received (24h)",
          type: "stat",
          targets: [{
            expr: "increase(lark_messages_received_total[24h])"
          }]
        },
        {
          id: 2,
          title: "Success Rate",
          type: "gauge",
          targets: [{
            expr: "(rate(lark_messages_processed_total{success=\"true\"}[5m]) / rate(lark_messages_received_total[5m])) * 100"
          }]
        },
        {
          id: 3,
          title: "Response Time (p50, p95, p99)",
          type: "graph",
          targets: [
            { expr: "histogram_quantile(0.50, rate(lark_response_time_seconds_bucket[5m]))", legendFormat: "p50" },
            { expr: "histogram_quantile(0.95, rate(lark_response_time_seconds_bucket[5m]))", legendFormat: "p95" },
            { expr: "histogram_quantile(0.99, rate(lark_response_time_seconds_bucket[5m]))", legendFormat: "p99" }
          ]
        },
        {
          id: 4,
          title: "Error Rate",
          type: "graph",
          targets: [{
            expr: "(rate(lark_api_errors_total[5m]) / rate(lark_api_requests_total[5m])) * 100"
          }]
        }
      ]
    }
  };
}

function generateAlertingGuide(config, projectSpec) {
  return `# Alerting Setup Guide

## Project: ${projectSpec.project_name}

Generated: ${new Date().toISOString()}

---

## 🚨 Alert Rules Overview

This application has ${config.alert_rules.length} alert rules configured.

---

## ⚠️ Alert Rules

${config.alert_rules.map((alert, i) => `
### ${i + 1}. ${alert.name}

- **Severity**: ${alert.severity}
- **Condition**: ${alert.condition}
- **Description**: ${alert.description}
- **Notification Channels**: ${alert.notification_channels.join(', ')}
- **Runbook**: \`${alert.runbook_url}\`
`).join('\n')}

---

## 📢 Notification Configuration

### Lark Notifications

\`\`\`json
${JSON.stringify(config.notification_config.lark, null, 2)}
\`\`\`

**Setup Steps:**
1. Create a Lark group for alerts
2. Add the bot to the group
3. Get the group chat_id
4. Update \`webhook_url\` in config

### Email Notifications

\`\`\`json
${JSON.stringify(config.notification_config.email, null, 2)}
\`\`\`

**Setup Steps:**
1. Configure SMTP server
2. Update recipient list
3. Test email delivery

---

## 📚 Runbooks

Each alert has a corresponding runbook in \`runbooks/\` directory:

${config.alert_rules.map(alert => `- [\`${alert.name}\`](${alert.runbook_url})`).join('\n')}

---

## 🔧 Implementation with Prometheus Alertmanager

### Step 1: Install Alertmanager

\`\`\`bash
docker run -d \\
  --name alertmanager \\
  -p 9093:9093 \\
  -v ./alertmanager.yml:/etc/alertmanager/alertmanager.yml \\
  prom/alertmanager
\`\`\`

### Step 2: Configure Alertmanager

Create \`alertmanager.yml\`:

\`\`\`yaml
route:
  receiver: 'lark-webhook'
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h

receivers:
  - name: 'lark-webhook'
    webhook_configs:
      - url: '${config.notification_config.lark.webhook_url}'
        send_resolved: true
\`\`\`

### Step 3: Add Alert Rules to Prometheus

Create \`alert_rules.yml\`:

\`\`\`yaml
groups:
  - name: lark_bot_alerts
    interval: 30s
    rules:
${config.alert_rules.map(alert => `
      - alert: ${alert.name}
        expr: ${alert.condition.split(' for ')[0]}
        for: ${alert.condition.split(' for ')[1] || '5m'}
        labels:
          severity: ${alert.severity}
        annotations:
          summary: "${alert.description}"
          runbook_url: "${alert.runbook_url}"
`).join('')}
\`\`\`

### Step 4: Update Prometheus Config

Add to \`prometheus.yml\`:

\`\`\`yaml
rule_files:
  - 'alert_rules.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']
\`\`\`

---

## 🧪 Testing Alerts

### Test Critical Alert

\`\`\`bash
# Simulate high error rate
for i in {1..100}; do
  curl -X POST ${projectSpec.deployment?.webhook_url || 'http://localhost:3000/webhook'} \\
    -H "Content-Type: application/json" \\
    -d '{"invalid": "data"}'
done
\`\`\`

### Verify Alert in Lark

Check your Lark monitoring group for alert notification.

---

## 🎯 Response Procedures

When you receive an alert:

1. **Acknowledge** the alert
2. **Check** the runbook for that alert
3. **Investigate** using metrics and logs
4. **Fix** the issue
5. **Document** what happened and how it was resolved
6. **Update** runbook if needed

---

## 📊 Alert Dashboard

Monitor all active alerts in Grafana:
- Open Grafana → Alerting → Alert Rules
- View firing alerts and their status

---

**Need Help?** Refer to:
- Prometheus Alerting: https://prometheus.io/docs/alerting/latest/overview/
- Alertmanager: https://prometheus.io/docs/alerting/latest/alertmanager/
`;
}

function generateRunbook(alert, projectSpec) {
  const runbooks = {
    'HighErrorRate': `# Runbook: High Error Rate

## Alert Details

- **Alert Name**: ${alert.name}
- **Severity**: ${alert.severity}
- **Condition**: ${alert.condition}
- **Description**: ${alert.description}

---

## 🔍 Investigation Steps

### 1. Check Recent Error Logs

\`\`\`bash
# View recent errors
tail -n 100 /var/log/lark-bot/error.log | grep ERROR

# Filter by timestamp
journalctl -u lark-bot --since "10 minutes ago" | grep ERROR
\`\`\`

### 2. Identify Error Types

\`\`\`bash
# Count errors by type
grep ERROR error.log | awk '{print $5}' | sort | uniq -c | sort -rn
\`\`\`

### 3. Check Lark API Status

- Visit: https://open.feishu.cn/status
- Check for any ongoing incidents

### 4. Review Metrics

Check Grafana dashboard:
- Error rate by endpoint
- Error distribution by type
- Recent deployments or changes

---

## 🛠️ Common Causes & Fixes

### Cause 1: Lark API Rate Limiting

**Symptoms**: HTTP 429 errors, "rate limit exceeded"

**Fix**:
\`\`\`javascript
// Implement exponential backoff
const retryWithBackoff = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 429 && i < retries - 1) {
        await sleep(Math.pow(2, i) * 1000);
        continue;
      }
      throw error;
    }
  }
};
\`\`\`

### Cause 2: Invalid Access Token

**Symptoms**: HTTP 401/403 errors, "invalid token"

**Fix**:
\`\`\`bash
# Refresh access token
curl -X POST https://open.feishu.cn/open-api/auth/v3/tenant_access_token/internal \\
  -H "Content-Type: application/json" \\
  -d '{"app_id": "YOUR_APP_ID", "app_secret": "YOUR_APP_SECRET"}'
\`\`\`

### Cause 3: Malformed Request Payload

**Symptoms**: HTTP 400 errors, "invalid parameter"

**Fix**:
1. Review recent code changes
2. Check request payload validation
3. Add schema validation before sending requests

---

## ✅ Resolution Checklist

- [ ] Identified root cause
- [ ] Applied fix
- [ ] Verified error rate returned to normal
- [ ] Updated documentation if needed
- [ ] Created ticket if recurring issue

---

## 📊 Success Criteria

Alert can be resolved when:
- Error rate drops below 2% for 10 consecutive minutes
- No new errors of the same type appearing

---

## 📝 Incident Report Template

\`\`\`
Incident: High Error Rate - [Date]
Severity: ${alert.severity}
Duration: [Start Time] - [End Time]
Root Cause: [Description]
Resolution: [Steps Taken]
Prevention: [How to prevent this in future]
\`\`\`
`,

    'SlowResponseTime': `# Runbook: Slow Response Time

## Alert Details

- **Alert Name**: ${alert.name}
- **Severity**: ${alert.severity}
- **Condition**: ${alert.condition}
- **Description**: ${alert.description}

---

## 🔍 Investigation Steps

### 1. Check Current Response Times

\`\`\`bash
# Query Prometheus
curl 'http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,rate(lark_response_time_seconds_bucket[5m]))'
\`\`\`

### 2. Identify Slow Endpoints

Check metrics for each endpoint to identify the bottleneck.

### 3. Review Resource Usage

\`\`\`bash
# CPU usage
top -p $(pgrep -f lark-bot)

# Memory usage
ps aux | grep lark-bot

# Disk I/O
iostat -x 1 10
\`\`\`

---

## 🛠️ Common Causes & Fixes

### Cause 1: Lark API Latency

**Fix**: Implement caching for frequently accessed data

\`\`\`javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 min cache

async function getUserInfo(userId) {
  const cached = cache.get(userId);
  if (cached) return cached;

  const userInfo = await larkClient.getUser(userId);
  cache.set(userId, userInfo);
  return userInfo;
}
\`\`\`

### Cause 2: Database Slow Queries

**Fix**: Add indexes and optimize queries

\`\`\`sql
-- Add index on frequently queried columns
CREATE INDEX idx_user_id ON messages(user_id);
CREATE INDEX idx_created_at ON messages(created_at);
\`\`\`

### Cause 3: High Server Load

**Fix**: Scale horizontally or vertically
- Add more application servers
- Increase server resources (CPU, RAM)

---

## ✅ Resolution Checklist

- [ ] Identified slow endpoint/query
- [ ] Applied optimization
- [ ] Verified p95 response time < 2s
- [ ] Documented changes

---

## 📊 Success Criteria

- P95 response time < 2s for 10 consecutive minutes
`,

    'HighMemoryUsage': `# Runbook: High Memory Usage

## Alert Details

- **Alert Name**: ${alert.name}
- **Severity**: ${alert.severity}
- **Condition**: ${alert.condition}
- **Description**: ${alert.description}

---

## 🔍 Investigation Steps

### 1. Check Current Memory Usage

\`\`\`bash
# Overall memory
free -h

# Process memory
ps aux --sort=-%mem | head -10
\`\`\`

### 2. Check for Memory Leaks

\`\`\`bash
# Monitor memory over time
watch -n 5 'ps aux | grep lark-bot'
\`\`\`

### 3. Generate Heap Dump (Node.js)

\`\`\`bash
# Take heap snapshot
node --inspect index.js
# Then use Chrome DevTools to analyze heap
\`\`\`

---

## 🛠️ Common Causes & Fixes

### Cause 1: Cache Growing Unbounded

**Fix**: Implement cache eviction policy

\`\`\`javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({
  stdTTL: 600,
  checkperiod: 120,
  maxKeys: 1000 // Limit cache size
});
\`\`\`

### Cause 2: Memory Leak in Event Listeners

**Fix**: Remove event listeners when done

\`\`\`javascript
// Bad
app.on('message', handler);

// Good
app.once('message', handler);
// or
app.on('message', handler);
// Later: app.removeListener('message', handler);
\`\`\`

### Cause 3: Large Response Buffers

**Fix**: Stream large responses instead of buffering

---

## ✅ Resolution Checklist

- [ ] Identified memory leak source
- [ ] Applied fix
- [ ] Restarted application
- [ ] Verified memory usage stable
- [ ] Set up monitoring for recurrence

---

## 📊 Success Criteria

- Memory usage drops below 70%
- Memory remains stable over 1 hour
`,

    'ServiceDown': `# Runbook: Service Down

## Alert Details

- **Alert Name**: ${alert.name}
- **Severity**: ${alert.severity}
- **Condition**: ${alert.condition}
- **Description**: ${alert.description}

---

## 🔍 Investigation Steps

### 1. Check Service Status

\`\`\`bash
# Check if process is running
ps aux | grep lark-bot

# Check service status (if using systemd)
systemctl status lark-bot
\`\`\`

### 2. Check Logs

\`\`\`bash
# Recent logs
tail -n 100 /var/log/lark-bot/error.log

# System logs
journalctl -u lark-bot --since "1 hour ago"
\`\`\`

### 3. Test Health Endpoint

\`\`\`bash
curl -v http://localhost:3000/health
\`\`\`

---

## 🛠️ Recovery Steps

### Step 1: Restart Service

\`\`\`bash
# Using systemd
sudo systemctl restart lark-bot

# Using PM2
pm2 restart lark-bot

# Manual
cd /path/to/app && node index.js
\`\`\`

### Step 2: Verify Recovery

\`\`\`bash
# Check health endpoint
curl http://localhost:3000/health

# Check metrics
curl http://localhost:3000/metrics
\`\`\`

### Step 3: Monitor for Stability

Watch logs and metrics for 10 minutes to ensure service is stable.

---

## ✅ Resolution Checklist

- [ ] Service restarted
- [ ] Health check passing
- [ ] Logs show normal operation
- [ ] Root cause identified
- [ ] Incident documented

---

## 📊 Success Criteria

- Health check returns 200 OK
- Service processes messages successfully
- No errors in logs for 10 minutes
`,

    'LowUserEngagement': `# Runbook: Low User Engagement

## Alert Details

- **Alert Name**: ${alert.name}
- **Severity**: ${alert.severity}
- **Condition**: ${alert.condition}
- **Description**: ${alert.description}

---

## 🔍 Investigation Steps

### 1. Check User Activity Metrics

\`\`\`bash
# Query daily active users
curl 'http://localhost:9090/api/v1/query?query=lark_active_users_gauge'
\`\`\`

### 2. Compare with Historical Data

Review user engagement trends in Grafana dashboard.

### 3. Identify Potential Causes

- Recent feature changes?
- Service outages?
- User feedback/complaints?
- Seasonal patterns?

---

## 🛠️ Action Items

### Short-term Actions

1. **Send Re-engagement Message** to inactive users
2. **Check for bugs** in recent releases
3. **Review user feedback** for insights

### Medium-term Actions

1. **Conduct user survey** to understand needs
2. **Analyze feature usage** to identify popular/unpopular features
3. **Plan feature improvements** based on feedback

---

## ✅ Follow-up Checklist

- [ ] Investigated root cause
- [ ] Sent re-engagement communication
- [ ] Scheduled user feedback session
- [ ] Created improvement tasks
- [ ] Monitoring engagement recovery

---

## 📊 Success Criteria

- Daily active users return to >50% of 7-day average
- User retention rate improves
`
  };

  return runbooks[alert.name] || `# Runbook: ${alert.name}\n\n[To be documented]`;
}

function generateOptimizationGuide(plan, projectSpec) {
  return `# Performance Optimization Guide

## Project: ${projectSpec.project_name}

Generated: ${new Date().toISOString()}

---

## 📊 Overview

This guide provides ${plan.recommendations.length} performance optimization recommendations prioritized by impact and effort.

---

## 🎯 Optimization Recommendations

${plan.recommendations.map((rec, i) => `
### ${i + 1}. ${rec.title} [${rec.priority}]

**Category**: ${rec.category}
**Effort**: ${rec.effort}

${rec.description}

#### Implementation

${typeof rec.implementation === 'object' && !Array.isArray(rec.implementation)
  ? Object.entries(rec.implementation).map(([key, value]) =>
      `**${key}**: ${Array.isArray(value) ? value.join(', ') : value}`
    ).join('\n')
  : rec.implementation}

#### Expected Impact

${Object.entries(rec.expected_impact).map(([key, value]) => `- **${key}**: ${value}`).join('\n')}

---
`).join('\n')}

## 📈 Implementation Roadmap

### Phase 1: Quick Wins (Week 1)
${plan.recommendations.filter(r => r.priority === 'P0' || r.effort.includes('Low')).map(r => `- ${r.title}`).join('\n')}

### Phase 2: High-Impact (Week 2-3)
${plan.recommendations.filter(r => r.priority === 'P1').map(r => `- ${r.title}`).join('\n')}

### Phase 3: Strategic Improvements (Week 4+)
${plan.recommendations.filter(r => r.priority === 'P2').map(r => `- ${r.title}`).join('\n')}

---

## 🧪 Performance Testing

Before and after each optimization:

1. **Measure Baseline**
   \`\`\`bash
   # Run load test
   artillery run load-test.yml
   \`\`\`

2. **Apply Optimization**

3. **Measure Impact**
   \`\`\`bash
   # Run same load test
   artillery run load-test.yml
   \`\`\`

4. **Compare Results**
   - Response time (p50, p95, p99)
   - Throughput (requests/second)
   - Error rate
   - Resource usage (CPU, memory)

---

## 📊 Success Metrics

Track these KPIs to measure optimization success:

- **Response Time**: Target p95 < 500ms
- **Throughput**: Target 100+ req/s
- **Error Rate**: Target < 0.1%
- **Resource Usage**: Target CPU < 50%, Memory < 70%

---

## 🔗 Additional Resources

- Node.js Performance Best Practices: https://nodejs.org/en/docs/guides/simple-profiling/
- Redis Caching Guide: https://redis.io/docs/manual/client-side-caching/
- Database Optimization: https://use-the-index-luke.com/
`;
}

function generateScalabilityGuide(plan, projectSpec) {
  return `# Scalability Planning Guide

## Project: ${projectSpec.project_name}

Generated: ${new Date().toISOString()}

---

## 📊 Current Capacity

- **Users**: ${plan.current_capacity.estimated_users}
- **Messages/Day**: ${plan.current_capacity.estimated_messages_per_day}
- **Infrastructure**: ${plan.current_capacity.infrastructure}

---

## 🚀 Growth Scenarios

${plan.growth_scenarios.map((scenario, i) => `
### Scenario ${i + 1}: ${scenario.scenario}

**Target Scale:**
- Users: ${scenario.target_users}
- Messages/Day: ${scenario.target_messages_per_day}

**Infrastructure Changes:**
${scenario.infrastructure_changes.map(change => `- ${change}`).join('\n')}

**Cost Impact:** ${scenario.cost_estimate}
**Complexity:** ${scenario.implementation_complexity}
**Timeline:** ${scenario.timeline}

---
`).join('\n')}

## ⚠️ Current Bottlenecks

${plan.bottleneck_analysis.current_bottlenecks.map((bottleneck, i) => `
### ${i + 1}. ${bottleneck.component}

- **Impact**: ${bottleneck.impact}
- **Mitigation**: ${bottleneck.mitigation}
`).join('\n')}

---

## 📈 Monitoring for Scale

### Key Metrics

${plan.monitoring_for_scale.key_metrics.map(metric => `- ${metric}`).join('\n')}

### Auto-Scaling Triggers

${plan.monitoring_for_scale.scaling_triggers.map(trigger => `- ${trigger}`).join('\n')}

---

## 🛠️ Implementation Checklist

### For 2x Growth
- [ ] Vertical scaling: Upgrade server resources
- [ ] Add Redis for caching
- [ ] Implement database read replicas
- [ ] Set up monitoring for new capacity

### For 5x Growth
- [ ] Set up load balancer
- [ ] Deploy multiple application servers
- [ ] Implement message queue
- [ ] Set up CDN for static assets
- [ ] Database clustering

### For 10x Growth
- [ ] Multi-region deployment
- [ ] Auto-scaling groups
- [ ] Microservices architecture
- [ ] Event-driven architecture
- [ ] Full observability stack

---

## 💡 Best Practices

1. **Plan ahead**: Start preparing for next growth tier when at 70% of current capacity
2. **Test at scale**: Use load testing to validate scalability before hitting limits
3. **Monitor continuously**: Track all key metrics and set up alerts
4. **Iterate**: Continuously optimize and improve architecture

---

## 🔗 Additional Resources

- AWS Auto Scaling: https://aws.amazon.com/autoscaling/
- Load Balancing Strategies: https://www.nginx.com/blog/choosing-nginx-plus-load-balancing-techniques/
- Microservices Architecture: https://microservices.io/
`;
}

function generateFeedbackGuide(config, projectSpec) {
  return `# User Feedback System Guide

## Project: ${projectSpec.project_name}

Generated: ${new Date().toISOString()}

---

## 📊 Overview

This application uses ${config.collection_methods.length} methods to collect user feedback systematically.

---

## 📝 Feedback Collection Methods

${config.collection_methods.map((method, i) => `
### ${i + 1}. ${method.method}

- **Trigger**: ${method.trigger}
${method.questions ? `- **Questions**:\n${method.questions.map(q => `  - ${q}`).join('\n')}` : ''}
${method.purpose ? `- **Purpose**: ${method.purpose}` : ''}
- **Implementation**: ${method.implementation}
`).join('\n')}

---

## 📈 Metrics to Track

${config.feedback_analysis.metrics_to_track.map(metric => `- ${metric}`).join('\n')}

**Review Frequency**: ${config.feedback_analysis.review_frequency}

---

## ⚙️ Action Thresholds

${Object.entries(config.feedback_analysis.action_thresholds).map(([key, value]) => `
### ${key.replace(/_/g, ' ')}
${value}
`).join('\n')}

---

## 📅 Survey Schedule

### Initial Survey
- **Timing**: ${config.survey_schedule.initial_survey.timing}
- **Focus**: ${config.survey_schedule.initial_survey.focus}

### Regular Surveys
- **Frequency**: ${config.survey_schedule.regular_surveys.frequency}
- **Focus**: ${config.survey_schedule.regular_surveys.focus}

### Exit Survey
- **Trigger**: ${config.survey_schedule.exit_survey.trigger}
- **Focus**: ${config.survey_schedule.exit_survey.focus}

---

## 🔧 Implementation

### In-App Feedback Command

\`\`\`javascript
// Handle /feedback command
async function handleFeedbackCommand(userId, chatId) {
  await larkClient.sendMessage({
    receive_id: chatId,
    msg_type: 'interactive',
    content: JSON.stringify({
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'plain_text',
            content: 'Please share your feedback:'
          }
        },
        {
          tag: 'input',
          name: 'satisfaction',
          placeholder: {
            tag: 'plain_text',
            content: 'Rate 1-5 stars'
          }
        },
        {
          tag: 'input',
          name: 'improvement',
          placeholder: {
            tag: 'plain_text',
            content: 'What would you like to see improved?'
          },
          is_required: false
        },
        {
          tag: 'button',
          text: {
            tag: 'plain_text',
            content: 'Submit Feedback'
          },
          type: 'primary',
          value: {
            key: 'submit_feedback'
          }
        }
      ]
    })
  });
}
\`\`\`

### Automatic Survey Trigger

\`\`\`javascript
// Track interaction count
let userInteractions = {};

async function trackInteraction(userId) {
  userInteractions[userId] = (userInteractions[userId] || 0) + 1;

  // After every 10 interactions, send satisfaction survey
  if (userInteractions[userId] % 10 === 0) {
    await sendSatisfactionSurvey(userId);
  }
}
\`\`\`

---

## 📊 Analyzing Feedback

### Calculate NPS

\`\`\`javascript
function calculateNPS(responses) {
  const promoters = responses.filter(r => r >= 9).length;
  const detractors = responses.filter(r => r <= 6).length;
  const total = responses.length;

  return ((promoters - detractors) / total) * 100;
}
\`\`\`

### Track Feature Requests

\`\`\`javascript
// Store and prioritize feature requests
const featureRequests = {};

function recordFeatureRequest(feature, userId) {
  if (!featureRequests[feature]) {
    featureRequests[feature] = {
      count: 0,
      users: []
    };
  }

  featureRequests[feature].count++;
  featureRequests[feature].users.push(userId);

  // Alert if feature requested > 5 times
  if (featureRequests[feature].count >= 5) {
    notifyProductTeam(feature, featureRequests[feature]);
  }
}
\`\`\`

---

## 🎯 Best Practices

1. **Keep surveys short**: Max 3-5 questions
2. **Time surveys appropriately**: Don't interrupt critical user flows
3. **Close the loop**: Respond to feedback and communicate changes
4. **Act on insights**: Translate feedback into actionable improvements
5. **Track trends**: Monitor feedback over time, not just individual responses

---

## 📈 Success Metrics

- **Response Rate**: Target > 20%
- **NPS Score**: Target > 30
- **CSAT Score**: Target > 4.0/5
- **Feature Request Implementation**: Implement top 3 requests quarterly

---

## 🔗 Additional Resources

- NPS Calculation Guide: https://www.netpromoter.com/know/
- CSAT Best Practices: https://www.qualtrics.com/experience-management/customer/csat/
`;
}

function generateFeedbackCardTemplate() {
  return {
    config: {
      wide_screen_mode: true
    },
    header: {
      title: {
        tag: "plain_text",
        content: "📝 Share Your Feedback"
      },
      template: "blue"
    },
    elements: [
      {
        tag: "div",
        text: {
          tag: "plain_text",
          content: "We'd love to hear your thoughts! Your feedback helps us improve."
        }
      },
      {
        tag: "div",
        text: {
          tag: "lark_md",
          content: "**How satisfied are you with this bot?**"
        }
      },
      {
        tag: "action",
        actions: [
          {
            tag: "button",
            text: { tag: "plain_text", content: "⭐" },
            value: { rating: 1 }
          },
          {
            tag: "button",
            text: { tag: "plain_text", content: "⭐⭐" },
            value: { rating: 2 }
          },
          {
            tag: "button",
            text: { tag: "plain_text", content: "⭐⭐⭐" },
            value: { rating: 3 }
          },
          {
            tag: "button",
            text: { tag: "plain_text", content: "⭐⭐⭐⭐" },
            value: { rating: 4 }
          },
          {
            tag: "button",
            text: { tag: "plain_text", content: "⭐⭐⭐⭐⭐" },
            value: { rating: 5 },
            type: "primary"
          }
        ]
      },
      {
        tag: "input",
        name: "improvement_suggestion",
        placeholder: {
          tag: "plain_text",
          content: "What feature would you like to see improved?"
        },
        is_required: false
      },
      {
        tag: "action",
        actions: [
          {
            tag: "button",
            text: {
              tag: "plain_text",
              content: "Submit Feedback"
            },
            type: "primary",
            value: { action: "submit_feedback" }
          }
        ]
      }
    ]
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
}

async function listGeneratedFiles(directory) {
  const files = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  await walk(directory);
  return files;
}

export { setupMaintenance };

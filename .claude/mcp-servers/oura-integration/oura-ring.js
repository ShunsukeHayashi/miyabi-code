#!/usr/bin/env node

/**
 * Oura Ring Health Data MCP Server for Miyabi
 *
 * Integrates with Oura API v2 to provide comprehensive health data access:
 * - Sleep analysis and patterns
 * - Daily readiness scores
 * - Activity tracking and metrics
 * - Heart rate variability (HRV) data
 * - Workout detection and analysis
 * - Temperature trends
 * - Recovery insights
 *
 * Required Environment Variables:
 * - OURA_ACCESS_TOKEN: Personal Access Token or OAuth2 token
 * - OURA_USER_ID: User ID (optional, defaults to current user)
 *
 * Supported Data Types:
 * - Sleep: duration, efficiency, phases, heart rate during sleep
 * - Readiness: overall score, contributing factors, recovery metrics
 * - Activity: steps, calories, activity periods, movement
 * - Heart Rate: continuous monitoring, HRV analysis
 * - Workouts: detected activities, intensity, duration
 * - Tags: custom events and annotations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const OURA_API_BASE = 'https://api.ouraring.com/v2';

class OuraRingMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'oura-ring',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.accessToken = process.env.OURA_ACCESS_TOKEN;
    this.userId = process.env.OURA_USER_ID || 'current';

    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'oura_get_sleep_data',
          description: 'Retrieve sleep data for specified date range',
          inputSchema: {
            type: 'object',
            properties: {
              start_date: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format',
              },
              end_date: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format (optional, defaults to start_date)',
              },
            },
            required: ['start_date'],
          },
        },
        {
          name: 'oura_get_readiness_data',
          description: 'Retrieve daily readiness scores and contributing factors',
          inputSchema: {
            type: 'object',
            properties: {
              start_date: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format',
              },
              end_date: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format (optional)',
              },
            },
            required: ['start_date'],
          },
        },
        {
          name: 'oura_get_activity_data',
          description: 'Retrieve daily activity metrics including steps and calories',
          inputSchema: {
            type: 'object',
            properties: {
              start_date: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format',
              },
              end_date: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format (optional)',
              },
            },
            required: ['start_date'],
          },
        },
        {
          name: 'oura_get_heart_rate_data',
          description: 'Retrieve heart rate and HRV data for date range',
          inputSchema: {
            type: 'object',
            properties: {
              start_datetime: {
                type: 'string',
                description: 'Start datetime in ISO 8601 format',
              },
              end_datetime: {
                type: 'string',
                description: 'End datetime in ISO 8601 format (optional)',
              },
            },
            required: ['start_datetime'],
          },
        },
        {
          name: 'oura_get_workout_data',
          description: 'Retrieve workout and exercise session data',
          inputSchema: {
            type: 'object',
            properties: {
              start_date: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format',
              },
              end_date: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format (optional)',
              },
            },
            required: ['start_date'],
          },
        },
        {
          name: 'oura_get_user_info',
          description: 'Retrieve user profile information and preferences',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'oura_get_recent_summary',
          description: 'Get a comprehensive summary of recent health metrics',
          inputSchema: {
            type: 'object',
            properties: {
              days: {
                type: 'number',
                description: 'Number of recent days to include (default: 7)',
                default: 7,
              },
            },
          },
        },
        {
          name: 'oura_analyze_trends',
          description: 'Analyze health trends over specified time period',
          inputSchema: {
            type: 'object',
            properties: {
              metric: {
                type: 'string',
                enum: ['sleep_score', 'readiness_score', 'activity_score', 'resting_heart_rate'],
                description: 'Health metric to analyze',
              },
              start_date: {
                type: 'string',
                description: 'Start date for trend analysis (YYYY-MM-DD)',
              },
              end_date: {
                type: 'string',
                description: 'End date for trend analysis (YYYY-MM-DD)',
              },
            },
            required: ['metric', 'start_date', 'end_date'],
          },
        },
        {
          name: 'oura_get_recovery_insights',
          description: 'Generate recovery insights based on recent data',
          inputSchema: {
            type: 'object',
            properties: {
              days_to_analyze: {
                type: 'number',
                description: 'Number of recent days to analyze (default: 14)',
                default: 14,
              },
            },
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'oura_get_sleep_data':
            return await this.getSleepData(args);

          case 'oura_get_readiness_data':
            return await this.getReadinessData(args);

          case 'oura_get_activity_data':
            return await this.getActivityData(args);

          case 'oura_get_heart_rate_data':
            return await this.getHeartRateData(args);

          case 'oura_get_workout_data':
            return await this.getWorkoutData(args);

          case 'oura_get_user_info':
            return await this.getUserInfo(args);

          case 'oura_get_recent_summary':
            return await this.getRecentSummary(args);

          case 'oura_analyze_trends':
            return await this.analyzeTrends(args);

          case 'oura_get_recovery_insights':
            return await this.getRecoveryInsights(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async ouraFetch(endpoint, params = {}) {
    if (!this.accessToken) {
      throw new Error('OURA_ACCESS_TOKEN not set');
    }

    const url = new URL(`${OURA_API_BASE}${endpoint}`);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Oura API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getSleepData(args) {
    const params = {
      start_date: args.start_date,
      end_date: args.end_date || args.start_date,
    };

    const data = await this.ouraFetch('/usercollection/sleep', params);

    if (!data.data || data.data.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No sleep data found for the specified date range.`,
          },
        ],
      };
    }

    // Analyze sleep data
    const sleepSummary = this.analyzeSleepData(data.data);

    return {
      content: [
        {
          type: 'text',
          text: `Sleep Data Analysis (${args.start_date} to ${params.end_date}):\n\n${sleepSummary}`,
        },
      ],
    };
  }

  async getReadinessData(args) {
    const params = {
      start_date: args.start_date,
      end_date: args.end_date || args.start_date,
    };

    const data = await this.ouraFetch('/usercollection/daily_readiness', params);

    if (!data.data || data.data.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No readiness data found for the specified date range.`,
          },
        ],
      };
    }

    const readinessSummary = this.analyzeReadinessData(data.data);

    return {
      content: [
        {
          type: 'text',
          text: `Readiness Analysis (${args.start_date} to ${params.end_date}):\n\n${readinessSummary}`,
        },
      ],
    };
  }

  async getActivityData(args) {
    const params = {
      start_date: args.start_date,
      end_date: args.end_date || args.start_date,
    };

    const data = await this.ouraFetch('/usercollection/daily_activity', params);

    if (!data.data || data.data.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No activity data found for the specified date range.`,
          },
        ],
      };
    }

    const activitySummary = this.analyzeActivityData(data.data);

    return {
      content: [
        {
          type: 'text',
          text: `Activity Analysis (${args.start_date} to ${params.end_date}):\n\n${activitySummary}`,
        },
      ],
    };
  }

  async getHeartRateData(args) {
    const params = {
      start_datetime: args.start_datetime,
      end_datetime: args.end_datetime || args.start_datetime,
    };

    const data = await this.ouraFetch('/usercollection/heartrate', params);

    if (!data.data || data.data.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No heart rate data found for the specified datetime range.`,
          },
        ],
      };
    }

    const hrSummary = this.analyzeHeartRateData(data.data);

    return {
      content: [
        {
          type: 'text',
          text: `Heart Rate Analysis:\n\n${hrSummary}`,
        },
      ],
    };
  }

  async getWorkoutData(args) {
    const params = {
      start_date: args.start_date,
      end_date: args.end_date || args.start_date,
    };

    const data = await this.ouraFetch('/usercollection/workout', params);

    if (!data.data || data.data.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No workout data found for the specified date range.`,
          },
        ],
      };
    }

    const workoutSummary = this.analyzeWorkoutData(data.data);

    return {
      content: [
        {
          type: 'text',
          text: `Workout Analysis (${args.start_date} to ${params.end_date}):\n\n${workoutSummary}`,
        },
      ],
    };
  }

  async getUserInfo() {
    const data = await this.ouraFetch('/usercollection/personal_info');

    return {
      content: [
        {
          type: 'text',
          text: `Oura User Information:\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }

  async getRecentSummary(args) {
    const days = args.days || 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const formatDate = (date) => date.toISOString().split('T')[0];
    const params = {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    };

    try {
      // Fetch multiple data types
      const [sleepData, readinessData, activityData] = await Promise.all([
        this.ouraFetch('/usercollection/sleep', params),
        this.ouraFetch('/usercollection/daily_readiness', params),
        this.ouraFetch('/usercollection/daily_activity', params),
      ]);

      const summary = this.generateRecentSummary({
        sleep: sleepData.data || [],
        readiness: readinessData.data || [],
        activity: activityData.data || [],
        days,
      });

      return {
        content: [
          {
            type: 'text',
            text: `📊 Recent Health Summary (Last ${days} days):\n\n${summary}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to fetch recent summary: ${error.message}`);
    }
  }

  async analyzeTrends(args) {
    const { metric, start_date, end_date } = args;

    let endpoint;
    let dataField;

    switch (metric) {
      case 'sleep_score':
        endpoint = '/usercollection/sleep';
        dataField = 'score';
        break;
      case 'readiness_score':
        endpoint = '/usercollection/daily_readiness';
        dataField = 'score';
        break;
      case 'activity_score':
        endpoint = '/usercollection/daily_activity';
        dataField = 'score';
        break;
      case 'resting_heart_rate':
        endpoint = '/usercollection/daily_readiness';
        dataField = 'contributors.resting_heart_rate';
        break;
    }

    const data = await this.ouraFetch(endpoint, { start_date, end_date });

    if (!data.data || data.data.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No data found for ${metric} in the specified date range.`,
          },
        ],
      };
    }

    const trendAnalysis = this.analyzeTrendData(data.data, dataField, metric);

    return {
      content: [
        {
          type: 'text',
          text: `📈 Trend Analysis for ${metric} (${start_date} to ${end_date}):\n\n${trendAnalysis}`,
        },
      ],
    };
  }

  async getRecoveryInsights(args) {
    const days = args.days_to_analyze || 14;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const formatDate = (date) => date.toISOString().split('T')[0];
    const params = {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    };

    try {
      // Fetch comprehensive data for recovery analysis
      const [sleepData, readinessData, activityData] = await Promise.all([
        this.ouraFetch('/usercollection/sleep', params),
        this.ouraFetch('/usercollection/daily_readiness', params),
        this.ouraFetch('/usercollection/daily_activity', params),
      ]);

      const insights = this.generateRecoveryInsights({
        sleep: sleepData.data || [],
        readiness: readinessData.data || [],
        activity: activityData.data || [],
        days,
      });

      return {
        content: [
          {
            type: 'text',
            text: `🔍 Recovery Insights (Last ${days} days):\n\n${insights}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to generate recovery insights: ${error.message}`);
    }
  }

  // Analysis helper methods

  analyzeSleepData(sleepData) {
    const summary = sleepData.map(sleep => {
      const efficiency = sleep.efficiency || 0;
      const totalSleep = (sleep.total_sleep_duration || 0) / 3600; // Convert to hours
      const deepSleep = (sleep.deep_sleep_duration || 0) / 3600;
      const remSleep = (sleep.rem_sleep_duration || 0) / 3600;

      return `📅 ${sleep.day}:
  💤 Total Sleep: ${totalSleep.toFixed(1)}h
  📊 Efficiency: ${efficiency}%
  🌊 Deep Sleep: ${deepSleep.toFixed(1)}h
  🧠 REM Sleep: ${remSleep.toFixed(1)}h
  ❤️ Avg HR: ${sleep.average_heart_rate || 'N/A'} bpm
  📈 Sleep Score: ${sleep.score || 'N/A'}/100`;
    }).join('\n\n');

    // Calculate averages
    const avgEfficiency = sleepData.reduce((sum, s) => sum + (s.efficiency || 0), 0) / sleepData.length;
    const avgSleepHours = sleepData.reduce((sum, s) => sum + ((s.total_sleep_duration || 0) / 3600), 0) / sleepData.length;

    return `${summary}\n\n📊 Summary:\n  • Average Sleep: ${avgSleepHours.toFixed(1)}h\n  • Average Efficiency: ${avgEfficiency.toFixed(1)}%`;
  }

  analyzeReadinessData(readinessData) {
    const summary = readinessData.map(readiness => {
      const contributors = readiness.contributors || {};

      return `📅 ${readiness.day}:
  🎯 Readiness Score: ${readiness.score || 'N/A'}/100
  💤 Previous Night: ${contributors.previous_night || 'N/A'}
  ❤️ RHR Balance: ${contributors.resting_heart_rate || 'N/A'}
  📊 HRV Balance: ${contributors.hrv_balance || 'N/A'}
  🌡️ Body Temp: ${contributors.body_temperature || 'N/A'}
  ⚖️ Recovery Index: ${contributors.recovery_index || 'N/A'}`;
    }).join('\n\n');

    const avgScore = readinessData.reduce((sum, r) => sum + (r.score || 0), 0) / readinessData.length;

    return `${summary}\n\n📊 Average Readiness Score: ${avgScore.toFixed(1)}/100`;
  }

  analyzeActivityData(activityData) {
    const summary = activityData.map(activity => {
      const steps = activity.steps || 0;
      const calories = activity.active_calories || 0;
      const distance = (activity.distance || 0) / 1000; // Convert to km

      return `📅 ${activity.day}:
  👟 Steps: ${steps.toLocaleString()}
  🔥 Active Calories: ${calories}
  📏 Distance: ${distance.toFixed(2)} km
  📊 Activity Score: ${activity.score || 'N/A'}/100
  ⏱️ Active Time: ${Math.round((activity.active_time || 0) / 60)} minutes`;
    }).join('\n\n');

    const avgSteps = activityData.reduce((sum, a) => sum + (a.steps || 0), 0) / activityData.length;
    const totalSteps = activityData.reduce((sum, a) => sum + (a.steps || 0), 0);

    return `${summary}\n\n📊 Summary:\n  • Average Steps: ${Math.round(avgSteps).toLocaleString()}/day\n  • Total Steps: ${totalSteps.toLocaleString()}`;
  }

  analyzeHeartRateData(hrData) {
    // Basic heart rate analysis
    const analysis = hrData.map(hr => {
      return `⏰ ${hr.timestamp}: ${hr.bpm || 'N/A'} bpm`;
    }).slice(0, 10).join('\n'); // Show first 10 readings

    return `Recent Heart Rate Readings:\n${analysis}\n\n💡 Total readings: ${hrData.length}`;
  }

  analyzeWorkoutData(workoutData) {
    if (workoutData.length === 0) {
      return 'No workouts detected in this period.';
    }

    const summary = workoutData.map(workout => {
      const duration = Math.round((workout.duration || 0) / 60); // Convert to minutes

      return `🏃 ${workout.day}:
  📝 Activity: ${workout.activity || 'Unknown'}
  ⏱️ Duration: ${duration} minutes
  🔥 Calories: ${workout.calories || 'N/A'}
  ❤️ Avg HR: ${workout.average_heart_rate || 'N/A'} bpm
  ⚡ Max HR: ${workout.max_heart_rate || 'N/A'} bpm`;
    }).join('\n\n');

    const totalDuration = workoutData.reduce((sum, w) => sum + (w.duration || 0), 0) / 60;
    const totalCalories = workoutData.reduce((sum, w) => sum + (w.calories || 0), 0);

    return `${summary}\n\n📊 Summary:\n  • Total Workouts: ${workoutData.length}\n  • Total Duration: ${Math.round(totalDuration)} minutes\n  • Total Calories: ${totalCalories}`;
  }

  generateRecentSummary(data) {
    const { sleep, readiness, activity, days } = data;

    // Calculate recent averages
    const avgSleepScore = sleep.length > 0 ? sleep.reduce((sum, s) => sum + (s.score || 0), 0) / sleep.length : 0;
    const avgReadinessScore = readiness.length > 0 ? readiness.reduce((sum, r) => sum + (r.score || 0), 0) / readiness.length : 0;
    const avgActivityScore = activity.length > 0 ? activity.reduce((sum, a) => sum + (a.score || 0), 0) / activity.length : 0;
    const avgSteps = activity.length > 0 ? activity.reduce((sum, a) => sum + (a.steps || 0), 0) / activity.length : 0;

    return `🌟 Overall Health Score: ${((avgSleepScore + avgReadinessScore + avgActivityScore) / 3).toFixed(1)}/100

💤 Sleep Performance:
  • Average Score: ${avgSleepScore.toFixed(1)}/100
  • Sleep Quality: ${this.getScoreRating(avgSleepScore)}

⚡ Readiness Level:
  • Average Score: ${avgReadinessScore.toFixed(1)}/100
  • Recovery Status: ${this.getScoreRating(avgReadinessScore)}

🏃 Activity Level:
  • Average Score: ${avgActivityScore.toFixed(1)}/100
  • Daily Steps: ${Math.round(avgSteps).toLocaleString()}
  • Activity Status: ${this.getScoreRating(avgActivityScore)}

💡 Quick Insights:
${this.generateQuickInsights({ avgSleepScore, avgReadinessScore, avgActivityScore, avgSteps })}`;
  }

  generateRecoveryInsights(data) {
    const { sleep, readiness, activity } = data;

    // Recovery trend analysis
    const recentReadiness = readiness.slice(-3).map(r => r.score || 0);
    const earlierReadiness = readiness.slice(0, 3).map(r => r.score || 0);

    const recentAvg = recentReadiness.reduce((sum, s) => sum + s, 0) / recentReadiness.length;
    const earlierAvg = earlierReadiness.reduce((sum, s) => sum + s, 0) / earlierReadiness.length;

    const trend = recentAvg - earlierAvg;
    const trendDirection = trend > 5 ? '📈 Improving' : trend < -5 ? '📉 Declining' : '➡️ Stable';

    // Sleep debt analysis
    const avgSleepHours = sleep.reduce((sum, s) => sum + ((s.total_sleep_duration || 0) / 3600), 0) / sleep.length;
    const sleepDebt = Math.max(0, (8 - avgSleepHours) * sleep.length);

    // HRV trends from readiness data
    const hrvScores = readiness.map(r => r.contributors?.hrv_balance || 0).filter(h => h > 0);
    const avgHrv = hrvScores.reduce((sum, h) => sum + h, 0) / hrvScores.length;

    return `🔄 Recovery Trend: ${trendDirection} (${trend > 0 ? '+' : ''}${trend.toFixed(1)} points)

💤 Sleep Analysis:
  • Average Sleep: ${avgSleepHours.toFixed(1)} hours/night
  • Sleep Debt: ${sleepDebt.toFixed(1)} hours
  • Recommendation: ${avgSleepHours < 7 ? '🚨 Prioritize more sleep' : '✅ Sleep duration looks good'}

📊 Recovery Metrics:
  • HRV Balance: ${avgHrv.toFixed(1)}/100
  • Current Readiness: ${recentAvg.toFixed(1)}/100
  • Recovery Status: ${this.getRecoveryStatus(recentAvg)}

🎯 Recovery Recommendations:
${this.generateRecoveryRecommendations({ trend, avgSleepHours, recentAvg, avgHrv })}`;
  }

  analyzeTrendData(data, field, metric) {
    const values = data.map(item => {
      // Handle nested fields like 'contributors.resting_heart_rate'
      if (field.includes('.')) {
        const keys = field.split('.');
        let value = item;
        for (const key of keys) {
          value = value?.[key];
        }
        return value || 0;
      }
      return item[field] || 0;
    }).filter(v => v > 0);

    if (values.length < 2) {
      return `Insufficient data for trend analysis of ${metric}.`;
    }

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    const change = secondAvg - firstAvg;
    const changePercent = (change / firstAvg) * 100;

    const direction = change > 0 ? '📈 Increasing' : change < 0 ? '📉 Decreasing' : '➡️ Stable';

    return `${direction}
  • First Half Average: ${firstAvg.toFixed(1)}
  • Second Half Average: ${secondAvg.toFixed(1)}
  • Change: ${change > 0 ? '+' : ''}${change.toFixed(1)} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%)
  • Data Points: ${values.length}

📊 Interpretation: ${this.interpretTrend(metric, change, changePercent)}`;
  }

  // Helper methods for scoring and recommendations

  getScoreRating(score) {
    if (score >= 85) return '🟢 Excellent';
    if (score >= 70) return '🟡 Good';
    if (score >= 55) return '🟠 Fair';
    return '🔴 Poor';
  }

  getRecoveryStatus(score) {
    if (score >= 85) return '🟢 Fully Recovered';
    if (score >= 70) return '🟡 Well Recovered';
    if (score >= 55) return '🟠 Adequate';
    return '🔴 Not Recovered';
  }

  generateQuickInsights({ avgSleepScore, avgReadinessScore, avgActivityScore, avgSteps }) {
    const insights = [];

    if (avgSleepScore < 70) {
      insights.push('💤 Consider optimizing sleep schedule');
    }
    if (avgReadinessScore < 70) {
      insights.push('⚡ Focus on recovery activities');
    }
    if (avgSteps < 8000) {
      insights.push('👟 Increase daily movement');
    }
    if (avgActivityScore > 85) {
      insights.push('🏆 Great activity consistency!');
    }

    return insights.length > 0 ? insights.join('\n') : '✅ All metrics look balanced';
  }

  generateRecoveryRecommendations({ trend, avgSleepHours, recentAvg, avgHrv }) {
    const recommendations = [];

    if (trend < -5) {
      recommendations.push('🚨 Recovery declining - consider reducing training intensity');
    }
    if (avgSleepHours < 7) {
      recommendations.push('💤 Prioritize 7-9 hours of sleep nightly');
    }
    if (recentAvg < 70) {
      recommendations.push('🧘 Add stress management practices (meditation, breathing)');
    }
    if (avgHrv < 50) {
      recommendations.push('❤️ Focus on HRV-improving activities (gentle yoga, nature walks)');
    }

    return recommendations.length > 0 ? recommendations.join('\n') : '✅ Recovery on track - maintain current habits';
  }

  interpretTrend(metric, change, changePercent) {
    switch (metric) {
      case 'sleep_score':
        if (change > 5) return 'Sleep quality improving - great progress!';
        if (change < -5) return 'Sleep declining - review sleep hygiene';
        return 'Sleep stable - maintain current habits';

      case 'readiness_score':
        if (change > 5) return 'Recovery improving - training adaptations positive';
        if (change < -5) return 'Recovery declining - consider reducing training load';
        return 'Recovery stable - balanced training/recovery';

      case 'resting_heart_rate':
        if (change < -2) return 'RHR decreasing - excellent cardiovascular adaptation';
        if (change > 2) return 'RHR increasing - may indicate stress or overtraining';
        return 'RHR stable - good cardiovascular health';

      default:
        return `${changePercent > 0 ? 'Increasing' : 'Decreasing'} trend observed`;
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Oura Ring MCP Server running on stdio');
  }
}

const server = new OuraRingMCPServer();
server.run().catch(console.error);
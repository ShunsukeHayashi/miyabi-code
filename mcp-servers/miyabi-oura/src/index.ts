#!/usr/bin/env node

/**
 * Miyabi Oura MCP Server
 *
 * Oura Health API integration for Miyabi Multi-Agent System
 * Provides OAuth authentication, health data retrieval, and insights
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosResponse } from "axios";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import { randomBytes } from "crypto";
import express from "express";

// Environment configuration
const OURA_CLIENT_ID = process.env.OURA_CLIENT_ID || "JQDX6RDL45TI6OIE";
const OURA_CLIENT_SECRET = process.env.OURA_CLIENT_SECRET || "UMAJCZ6OUPJJGCPT4FUZNWNWM3J6DKZQ";
const REDIRECT_URI = process.env.OURA_REDIRECT_URI || "http://localhost:5173/callback";
const TOKEN_FILE = path.join(os.homedir(), ".miyabi", "oura_token.json");

// Oura API endpoints
const OURA_API_BASE = "https://api.ouraring.com/v2/usercollection";
const OURA_AUTH_BASE = "https://cloud.ouraring.com/oauth";

// Token storage interface
interface OuraTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  token_type: string;
}

// Health data interfaces
interface SleepData {
  id: string;
  day: string;
  score: number;
  contributors: {
    deep_sleep: number;
    efficiency: number;
    latency: number;
    rem_sleep: number;
    restfulness: number;
    timing: number;
    total_sleep: number;
  };
  timestamp: string;
}

interface ActivityData {
  id: string;
  day: string;
  score: number;
  contributors: {
    meet_daily_targets: number;
    move_every_hour: number;
    recovery_time: number;
    stay_active: number;
    training_frequency: number;
    training_volume: number;
  };
  timestamp: string;
}

interface ReadinessData {
  id: string;
  day: string;
  score: number;
  contributors: {
    activity_balance: number;
    body_temperature: number;
    hrv_balance: number;
    previous_day_activity: number;
    previous_night: number;
    recovery_index: number;
    resting_heart_rate: number;
    sleep_balance: number;
  };
  timestamp: string;
}

// Ensure token directory exists
async function ensureTokenDir() {
  try {
    await fs.mkdir(path.dirname(TOKEN_FILE), { recursive: true });
  } catch (error) {
    // Directory already exists or other error
  }
}

// Load stored tokens
async function loadTokens(): Promise<OuraTokens | null> {
  try {
    const tokenData = await fs.readFile(TOKEN_FILE, "utf-8");
    const tokens: OuraTokens = JSON.parse(tokenData);

    // Check if token is expired (with 5 minute buffer)
    if (Date.now() >= tokens.expires_at - 300000) {
      console.error("Oura access token is expired");
      return null;
    }

    return tokens;
  } catch (error) {
    return null;
  }
}

// Save tokens
async function saveTokens(tokens: OuraTokens): Promise<void> {
  await ensureTokenDir();
  await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), "utf-8");
}

// Generate OAuth authorization URL
function generateAuthUrl(): string {
  const state = randomBytes(32).toString("hex");
  const params = new URLSearchParams({
    client_id: OURA_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    state: state,
  });

  return `${OURA_AUTH_BASE}/authorize?${params.toString()}`;
}

// Exchange authorization code for tokens
async function exchangeCodeForTokens(code: string): Promise<OuraTokens> {
  const response = await axios.post(`${OURA_AUTH_BASE}/token`, {
    grant_type: "authorization_code",
    client_id: OURA_CLIENT_ID,
    client_secret: OURA_CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    code: code,
  }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const tokens: OuraTokens = {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
    expires_at: Date.now() + (response.data.expires_in * 1000),
    token_type: response.data.token_type || "Bearer",
  };

  await saveTokens(tokens);
  return tokens;
}

// Make authenticated API request
async function makeOuraRequest(endpoint: string, params?: Record<string, string>): Promise<AxiosResponse> {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error("No valid Oura access token. Please run oura_authenticate first.");
  }

  const url = `${OURA_API_BASE}${endpoint}`;
  const queryParams = new URLSearchParams(params);

  return await axios.get(`${url}?${queryParams.toString()}`, {
    headers: {
      Authorization: `${tokens.token_type} ${tokens.access_token}`,
    },
  });
}

// Create MCP server
const server = new Server(
  {
    name: "miyabi-oura-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool: oura_authenticate
 * Start OAuth authentication flow for Oura API
 */
async function ouraAuthenticate(args: any) {
  const authUrl = generateAuthUrl();

  return {
    content: [
      {
        type: "text",
        text: `Please visit the following URL to authorize Oura access:\n\n${authUrl}\n\nAfter authorization, you'll be redirected to your callback URL with a 'code' parameter. Use the 'oura_exchange_token' tool with that code to complete authentication.`,
      },
    ],
  };
}

/**
 * Tool: oura_exchange_token
 * Exchange authorization code for access token
 */
async function ouraExchangeToken(args: any) {
  const code = args.code;

  if (!code) {
    throw new Error("Authorization code is required");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    return {
      content: [
        {
          type: "text",
          text: `Successfully authenticated with Oura! Access token saved and expires at: ${new Date(tokens.expires_at).toISOString()}`,
        },
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to exchange authorization code: ${error.message}`);
  }
}

/**
 * Tool: oura_get_personal_info
 * Get personal information from Oura API
 */
async function ouraGetPersonalInfo(args: any) {
  try {
    const response = await makeOuraRequest("/personal_info");

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch personal info: ${error.message}`);
  }
}

/**
 * Tool: oura_get_sleep_data
 * Get sleep data from Oura API
 */
async function ouraGetSleepData(args: any) {
  const startDate = args.start_date;
  const endDate = args.end_date;

  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  try {
    const response = await makeOuraRequest("/daily_sleep", params);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch sleep data: ${error.message}`);
  }
}

/**
 * Tool: oura_get_activity_data
 * Get activity data from Oura API
 */
async function ouraGetActivityData(args: any) {
  const startDate = args.start_date;
  const endDate = args.end_date;

  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  try {
    const response = await makeOuraRequest("/daily_activity", params);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch activity data: ${error.message}`);
  }
}

/**
 * Tool: oura_get_readiness_data
 * Get readiness data from Oura API
 */
async function ouraGetReadinessData(args: any) {
  const startDate = args.start_date;
  const endDate = args.end_date;

  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  try {
    const response = await makeOuraRequest("/daily_readiness", params);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch readiness data: ${error.message}`);
  }
}

/**
 * Tool: oura_get_heart_rate_data
 * Get heart rate data from Oura API
 */
async function ouraGetHeartRateData(args: any) {
  const startDatetime = args.start_datetime;
  const endDatetime = args.end_datetime;

  const params: Record<string, string> = {};
  if (startDatetime) params.start_datetime = startDatetime;
  if (endDatetime) params.end_datetime = endDatetime;

  try {
    const response = await makeOuraRequest("/heartrate", params);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch heart rate data: ${error.message}`);
  }
}

/**
 * Tool: oura_get_session_data
 * Get session data (workouts) from Oura API
 */
async function ouraGetSessionData(args: any) {
  const startDate = args.start_date;
  const endDate = args.end_date;

  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  try {
    const response = await makeOuraRequest("/session", params);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch session data: ${error.message}`);
  }
}

/**
 * Tool: oura_health_summary
 * Get comprehensive health summary with insights
 */
async function ouraHealthSummary(args: any) {
  const date = args.date || new Date().toISOString().split('T')[0];

  try {
    // Fetch all data for the specified date
    const [sleepResponse, activityResponse, readinessResponse] = await Promise.all([
      makeOuraRequest("/daily_sleep", { start_date: date, end_date: date }),
      makeOuraRequest("/daily_activity", { start_date: date, end_date: date }),
      makeOuraRequest("/daily_readiness", { start_date: date, end_date: date }),
    ]);

    const sleepData = sleepResponse.data.data[0];
    const activityData = activityResponse.data.data[0];
    const readinessData = readinessResponse.data.data[0];

    const summary = {
      date: date,
      sleep: sleepData ? {
        score: sleepData.score,
        efficiency: sleepData.contributors?.efficiency,
        total_sleep: sleepData.contributors?.total_sleep,
        deep_sleep: sleepData.contributors?.deep_sleep,
        rem_sleep: sleepData.contributors?.rem_sleep,
      } : null,
      activity: activityData ? {
        score: activityData.score,
        steps: activityData.equivalent_walking_distance,
        calories: activityData.total_calories,
        active_calories: activityData.active_calories,
        move_every_hour: activityData.contributors?.move_every_hour,
      } : null,
      readiness: readinessData ? {
        score: readinessData.score,
        resting_heart_rate: readinessData.contributors?.resting_heart_rate,
        hrv_balance: readinessData.contributors?.hrv_balance,
        body_temperature: readinessData.contributors?.body_temperature,
        recovery_index: readinessData.contributors?.recovery_index,
      } : null,
      insights: {
        overall_score: Math.round(((sleepData?.score || 0) + (activityData?.score || 0) + (readinessData?.score || 0)) / 3),
        recommendations: generateHealthRecommendations(sleepData, activityData, readinessData),
      }
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to generate health summary: ${error.message}`);
  }
}

/**
 * Tool: oura_miyabi_health_report
 * Generate Miyabi-formatted health report
 */
async function ouraMiyabiHealthReport(args: any) {
  const date = args.date || new Date().toISOString().split('T')[0];
  const notificationType = args.notification_type || "info"; // info, good, warning, concern

  try {
    // Get health summary
    const summaryResponse = await ouraHealthSummary({ date });
    const summary = JSON.parse(summaryResponse.content[0].text);

    // Determine notification level based on scores
    let alertLevel = "info";
    let alertMessage = "";
    const overallScore = summary.insights.overall_score;

    if (overallScore >= 85) {
      alertLevel = "success";
      alertMessage = "Excellent health metrics today! 🌟";
    } else if (overallScore >= 70) {
      alertLevel = "info";
      alertMessage = "Good overall health scores 👍";
    } else if (overallScore >= 50) {
      alertLevel = "warning";
      alertMessage = "Below average health metrics today ⚠️";
    } else {
      alertLevel = "error";
      alertMessage = "Concerning health metrics - consider rest 🔴";
    }

    const report = {
      type: notificationType || alertLevel,
      title: `Daily Health Report - ${date}`,
      message: alertMessage,
      agent: "Oura Health Monitor",
      task: "daily-health-analysis",
      details: `Overall Score: ${overallScore}/100\n` +
               `Sleep: ${summary.sleep?.score || 'N/A'}/100\n` +
               `Activity: ${summary.activity?.score || 'N/A'}/100\n` +
               `Readiness: ${summary.readiness?.score || 'N/A'}/100\n\n` +
               `Recommendations:\n${summary.insights.recommendations.join('\n')}`,
      health_data: summary,
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(report, null, 2),
        },
      ],
    };
  } catch (error: any) {
    throw new Error(`Failed to generate Miyabi health report: ${error.message}`);
  }
}

// Generate health recommendations based on data
function generateHealthRecommendations(sleepData: any, activityData: any, readinessData: any): string[] {
  const recommendations: string[] = [];

  // Sleep recommendations
  if (sleepData) {
    if (sleepData.score < 70) {
      recommendations.push("🛏️ Focus on improving sleep quality - consider earlier bedtime");
    }
    if (sleepData.contributors?.efficiency < 85) {
      recommendations.push("😴 Work on sleep efficiency - reduce time awake in bed");
    }
    if (sleepData.contributors?.deep_sleep < 50) {
      recommendations.push("🌙 Increase deep sleep - avoid screens before bed, cool room");
    }
  }

  // Activity recommendations
  if (activityData) {
    if (activityData.score < 70) {
      recommendations.push("🏃‍♂️ Increase daily activity level");
    }
    if (activityData.contributors?.move_every_hour < 75) {
      recommendations.push("⏰ Take more hourly movement breaks");
    }
  }

  // Readiness recommendations
  if (readinessData) {
    if (readinessData.score < 70) {
      recommendations.push("🔋 Consider taking a rest day or light activity");
    }
    if (readinessData.contributors?.resting_heart_rate > 90) {
      recommendations.push("❤️ Monitor stress levels - elevated resting heart rate");
    }
    if (readinessData.contributors?.hrv_balance < 50) {
      recommendations.push("🧘‍♀️ Practice stress reduction - low HRV detected");
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ Great job! All metrics look good - keep up the healthy habits");
  }

  return recommendations;
}

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "oura_authenticate",
        description: "Start OAuth authentication flow for Oura API",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "oura_exchange_token",
        description: "Exchange authorization code for access token",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "Authorization code from OAuth callback" },
          },
          required: ["code"],
        },
      },
      {
        name: "oura_get_personal_info",
        description: "Get personal information from Oura API",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "oura_get_sleep_data",
        description: "Get sleep data from Oura API",
        inputSchema: {
          type: "object",
          properties: {
            start_date: { type: "string", description: "Start date (YYYY-MM-DD) - optional" },
            end_date: { type: "string", description: "End date (YYYY-MM-DD) - optional" },
          },
        },
      },
      {
        name: "oura_get_activity_data",
        description: "Get activity data from Oura API",
        inputSchema: {
          type: "object",
          properties: {
            start_date: { type: "string", description: "Start date (YYYY-MM-DD) - optional" },
            end_date: { type: "string", description: "End date (YYYY-MM-DD) - optional" },
          },
        },
      },
      {
        name: "oura_get_readiness_data",
        description: "Get readiness data from Oura API",
        inputSchema: {
          type: "object",
          properties: {
            start_date: { type: "string", description: "Start date (YYYY-MM-DD) - optional" },
            end_date: { type: "string", description: "End date (YYYY-MM-DD) - optional" },
          },
        },
      },
      {
        name: "oura_get_heart_rate_data",
        description: "Get heart rate data from Oura API",
        inputSchema: {
          type: "object",
          properties: {
            start_datetime: { type: "string", description: "Start datetime (ISO 8601) - optional" },
            end_datetime: { type: "string", description: "End datetime (ISO 8601) - optional" },
          },
        },
      },
      {
        name: "oura_get_session_data",
        description: "Get session (workout) data from Oura API",
        inputSchema: {
          type: "object",
          properties: {
            start_date: { type: "string", description: "Start date (YYYY-MM-DD) - optional" },
            end_date: { type: "string", description: "End date (YYYY-MM-DD) - optional" },
          },
        },
      },
      {
        name: "oura_health_summary",
        description: "Get comprehensive health summary with insights for a specific date",
        inputSchema: {
          type: "object",
          properties: {
            date: { type: "string", description: "Date (YYYY-MM-DD) - defaults to today" },
          },
        },
      },
      {
        name: "oura_miyabi_health_report",
        description: "Generate Miyabi-formatted health report with recommendations",
        inputSchema: {
          type: "object",
          properties: {
            date: { type: "string", description: "Date (YYYY-MM-DD) - defaults to today" },
            notification_type: {
              type: "string",
              enum: ["info", "success", "warning", "error"],
              description: "Override notification type (optional)"
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "oura_authenticate":
        return await ouraAuthenticate(args);
      case "oura_exchange_token":
        return await ouraExchangeToken(args);
      case "oura_get_personal_info":
        return await ouraGetPersonalInfo(args);
      case "oura_get_sleep_data":
        return await ouraGetSleepData(args);
      case "oura_get_activity_data":
        return await ouraGetActivityData(args);
      case "oura_get_readiness_data":
        return await ouraGetReadinessData(args);
      case "oura_get_heart_rate_data":
        return await ouraGetHeartRateData(args);
      case "oura_get_session_data":
        return await ouraGetSessionData(args);
      case "oura_health_summary":
        return await ouraHealthSummary(args);
      case "oura_miyabi_health_report":
        return await ouraMiyabiHealthReport(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Miyabi Oura MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
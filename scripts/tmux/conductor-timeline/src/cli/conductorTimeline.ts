#!/usr/bin/env node
/**
 * Conductor Timeline CLI
 *
 * Monitor tmux sessions, aggregate agent states, and generate timeline reports.
 *
 * Usage:
 *   conductor-timeline --session <name> [options]
 *   conductor-timeline --session miyabi-refactor --window 60 --output-pane %10 --jsonl .ai/logs/conductor_timeline.jsonl
 */

import { TimelineAggregator } from '../aggregators/TimelineAggregator.js';
import { ReportWriter } from '../formatters/ReportWriter.js';
import { MissionControlClient } from '../clients/MissionControlClient.js';

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CLIArgs {
  sessionName: string;
  windowMinutes: number;
  outputPane?: string;
  jsonlPath?: string;
  watch?: boolean;
  watchInterval?: number;
  consoleOnly?: boolean;
  help?: boolean;
  missionControl: MissionControlOptions;
}

interface MissionControlOptions {
  enabled: boolean;
  url?: string;
  token?: string;
  retries: number;
  timeoutMs: number;
  backoffMs: number;
}

function parseArgs(): CLIArgs {
  const envUrl = process.env.MISSION_CONTROL_API_URL;
  const envToken = process.env.MISSION_CONTROL_API_TOKEN;
  const envRetries = process.env.MISSION_CONTROL_API_RETRIES
    ? parseInt(process.env.MISSION_CONTROL_API_RETRIES, 10)
    : undefined;
  const envTimeout = process.env.MISSION_CONTROL_API_TIMEOUT_MS
    ? parseInt(process.env.MISSION_CONTROL_API_TIMEOUT_MS, 10)
    : undefined;
  const envBackoff = process.env.MISSION_CONTROL_API_BACKOFF_MS
    ? parseInt(process.env.MISSION_CONTROL_API_BACKOFF_MS, 10)
    : undefined;

  const args: CLIArgs = {
    sessionName: 'miyabi-refactor',
    windowMinutes: 60,
    watch: false,
    watchInterval: 10,
    consoleOnly: false,
    help: false,
    missionControl: {
      enabled: Boolean(envUrl),
      url: envUrl,
      token: envToken,
      retries: envRetries ?? 3,
      timeoutMs: envTimeout ?? 10_000,
      backoffMs: envBackoff ?? 2_000,
    },
  };

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    switch (arg) {
      case '--session':
      case '-s':
        args.sessionName = process.argv[++i];
        break;

      case '--window':
      case '-w':
        args.windowMinutes = parseInt(process.argv[++i], 10);
        break;

      case '--output-pane':
      case '-o':
        args.outputPane = process.argv[++i];
        break;

      case '--jsonl':
      case '-j':
        args.jsonlPath = process.argv[++i];
        break;

      case '--watch':
        args.watch = true;
        break;

      case '--watch-interval':
        args.watchInterval = parseInt(process.argv[++i], 10);
        break;

      case '--console-only':
      case '-c':
        args.consoleOnly = true;
        break;

      case '--api-url':
        args.missionControl.url = process.argv[++i];
        args.missionControl.enabled = true;
        break;

      case '--api-token':
        args.missionControl.token = process.argv[++i];
        break;

      case '--api-retries':
        args.missionControl.retries = parseInt(process.argv[++i], 10);
        break;

      case '--api-timeout':
        args.missionControl.timeoutMs = parseInt(process.argv[++i], 10);
        break;

      case '--api-backoff':
        args.missionControl.backoffMs = parseInt(process.argv[++i], 10);
        break;

      case '--no-api':
        args.missionControl.enabled = false;
        break;

      case '--help':
      case '-h':
        args.help = true;
        break;

      default:
        console.error(`Unknown argument: ${arg}`);
        process.exit(1);
    }
  }

  if (!Number.isFinite(args.missionControl.retries) || args.missionControl.retries < 0) {
    args.missionControl.retries = 3;
  }

  if (!Number.isFinite(args.missionControl.timeoutMs) || args.missionControl.timeoutMs <= 0) {
    args.missionControl.timeoutMs = 10_000;
  }

  if (!Number.isFinite(args.missionControl.backoffMs) || args.missionControl.backoffMs <= 0) {
    args.missionControl.backoffMs = 2_000;
  }

  return args;
}

// ============================================================================
// Help Text
// ============================================================================

function showHelp(): void {
  console.log(`
Conductor Timeline CLI
═══════════════════════════════════════════════════════════════════

Monitor tmux sessions, aggregate agent states, and generate timeline reports.

USAGE:
  conductor-timeline --session <name> [options]

OPTIONS:
  -s, --session <name>          Tmux session name (default: miyabi-refactor)
  -w, --window <minutes>        Time window for events in minutes (default: 60)
  -o, --output-pane <pane-id>   Tmux pane ID to send output (e.g., %10)
  -j, --jsonl <path>            Path to JSONL output file (e.g., .ai/logs/conductor_timeline.jsonl)
  --watch                       Continuous monitoring mode
  --watch-interval <seconds>    Watch mode interval in seconds (default: 10)
  -c, --console-only            Output to console only (no tmux pane or file)
  --api-url <url>               Mission Control API base URL (env: MISSION_CONTROL_API_URL)
  --api-token <token>           Mission Control API token (env: MISSION_CONTROL_API_TOKEN)
  --api-retries <n>             Number of retry attempts (default: 3)
  --api-timeout <ms>            Request timeout in milliseconds (default: 10000)
  --api-backoff <ms>            Initial backoff delay in milliseconds (default: 2000)
  --no-api                      Disable Mission Control API delivery
  -h, --help                    Show this help message

ENVIRONMENT:
  MISSION_CONTROL_API_URL       Base URL for Mission Control web API
  MISSION_CONTROL_API_TOKEN     Bearer token for authentication (optional)
  MISSION_CONTROL_API_RETRIES   Override retry attempts
  MISSION_CONTROL_API_TIMEOUT_MS  Override request timeout (milliseconds)
  MISSION_CONTROL_API_BACKOFF_MS  Override initial backoff delay (milliseconds)

EXAMPLES:
  # Generate report once and display in console
  conductor-timeline --session miyabi-refactor

  # Send report to tmux pane and JSONL file
  conductor-timeline --session miyabi-refactor --output-pane %10 --jsonl .ai/logs/conductor_timeline.jsonl

  # Continuous monitoring with 10-second interval
  conductor-timeline --session miyabi-refactor --watch --watch-interval 10

  # 30-minute window with console-only output
  conductor-timeline --session miyabi-refactor --window 30 --console-only

INTEGRATION:
  # In tmux session, create a dedicated timeline pane:
  tmux split-window -h -l 40
  tmux send-keys "conductor-timeline --session miyabi-refactor --output-pane %10 --watch" Enter

  # Or run from cron for periodic JSONL logging:
  */5 * * * * cd /path/to/miyabi && conductor-timeline --session miyabi-refactor --jsonl .ai/logs/conductor_timeline.jsonl
  `);
}

// ============================================================================
// Main Execution
// ============================================================================

async function generateAndWriteReport(args: CLIArgs): Promise<void> {
  const aggregator = new TimelineAggregator();
  const writer = new ReportWriter();

  // Generate report
  const report = aggregator.generateReport(args.sessionName, args.windowMinutes);

  let persistedLocally = false;

  // Write outputs
  if (args.consoleOnly) {
    writer.writeFullToConsole(report);
  } else {
    // Write to console (summary)
    writer.writeToConsole(report);

    // Write to tmux pane if specified
    if (args.outputPane) {
      writer.writeToTmuxPane(report, args.outputPane);
    }

    // Write to JSONL if specified
    if (args.jsonlPath) {
      persistedLocally = writer.appendToJSONL(report, args.jsonlPath);
    }
  }

  if (args.missionControl.enabled && args.missionControl.url) {
    try {
      const client = new MissionControlClient({
        baseUrl: args.missionControl.url,
        token: args.missionControl.token,
        retries: args.missionControl.retries,
        timeoutMs: args.missionControl.timeoutMs,
        backoffMs: args.missionControl.backoffMs,
      });

      const response = await client.sendTimeline(report, persistedLocally);
      const pathInfo = response.path ? ` → ${response.path}` : '';
      console.log(`🌐 Mission Control API: ${response.status} (stored=${response.stored})${pathInfo}`);
    } catch (error) {
      console.warn('⚠️  Mission Control API delivery failed:', error);
    }
  }
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  console.log('🎯 Conductor Timeline CLI');
  console.log(`📺 Session: ${args.sessionName}`);
  console.log(`⏱️  Window: ${args.windowMinutes} minutes`);

  if (args.watch) {
    console.log(`🔄 Watch mode enabled (interval: ${args.watchInterval}s)`);
    console.log('Press Ctrl+C to stop\n');

    // Initial report
    await generateAndWriteReport(args);

    // Set up interval
    const intervalMs = (args.watchInterval ?? 10) * 1000;
    setInterval(async () => {
      try {
        await generateAndWriteReport(args);
      } catch (error) {
        console.error('❌ Watch mode error:', error);
      }
    }, intervalMs);
  } else {
    // One-time report
    await generateAndWriteReport(args);
    console.log('✅ Report generated');
  }
}

// Run CLI
main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

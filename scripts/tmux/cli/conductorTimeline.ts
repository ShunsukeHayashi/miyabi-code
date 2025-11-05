#!/usr/bin/env tsx

/**
 * Conductor Timeline CLI
 *
 * Mission Control conductor timeline reporter for monitoring Agent states
 * and aggregating recent events.
 *
 * Usage:
 *   tsx cli/conductorTimeline.ts --window Miyabi --output-pane %3
 *   tsx cli/conductorTimeline.ts --window 10 --log-file .ai/logs/conductor_timeline.jsonl
 *   tsx cli/conductorTimeline.ts --help
 */

import { TmuxAdapter } from '../conductor-timeline/adapters/tmux-adapter';
import { EventLoader, createDefaultConfig } from '../conductor-timeline/events/event-loader';
import { TimelineAggregator } from '../conductor-timeline/timeline/aggregator';
import { TimelineFormatter } from '../conductor-timeline/outputs/formatter';
import {
  TimelineWriter,
  createTmuxWriterConfig,
  createJSONWriterConfig,
  createDualWriterConfig,
} from '../conductor-timeline/outputs/writer';
import type { ConductorTimelineOptions } from '../conductor-timeline/types';

// ============================================================================
// CLI Argument Parser
// ============================================================================

function parseArgs(): ConductorTimelineOptions | null {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return null;
  }

  const options: ConductorTimelineOptions = {
    window: 'Miyabi',
    eventLookback: 60, // 60 minutes
    refreshInterval: 0, // No auto-refresh by default
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--window':
      case '-w':
        options.window = args[++i];
        break;
      case '--output-pane':
      case '-p':
        options.outputPane = args[++i];
        break;
      case '--log-file':
      case '-l':
        options.logFile = args[++i];
        break;
      case '--lookback':
        options.eventLookback = parseInt(args[++i], 10);
        break;
      case '--refresh':
      case '-r':
        options.refreshInterval = parseInt(args[++i], 10);
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        printHelp();
        return null;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Conductor Timeline CLI - Mission Control monitoring tool

Usage:
  tsx cli/conductorTimeline.ts [options]

Options:
  --window, -w <name>       Window name to monitor (default: "Miyabi")
  --output-pane, -p <id>    Tmux pane ID for output (e.g., "%3")
  --log-file, -l <path>     JSON log file path (default: none)
  --lookback <minutes>      Event lookback time in minutes (default: 60)
  --refresh, -r <seconds>   Auto-refresh interval in seconds (default: 0 - no refresh)
  --help, -h                Show this help message

Examples:
  # Write to tmux pane
  tsx cli/conductorTimeline.ts --window Miyabi --output-pane %3

  # Write to JSON log file
  tsx cli/conductorTimeline.ts --window 10 --log-file .ai/logs/conductor_timeline.jsonl

  # Both tmux pane and JSON log
  tsx cli/conductorTimeline.ts -w Miyabi -p %3 -l .ai/logs/conductor_timeline.jsonl

  # Auto-refresh every 30 seconds
  tsx cli/conductorTimeline.ts -w Miyabi -p %3 -r 30

  # Custom lookback window (last 2 hours)
  tsx cli/conductorTimeline.ts -w Miyabi --lookback 120

Exit Codes:
  0: Success
  1: Error or invalid arguments
`);
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const options = parseArgs();
  if (!options) {
    process.exit(1);
  }

  console.log('🎯 Conductor Timeline Reporter Starting...');
  console.log(`   Window: ${options.window}`);
  console.log(`   Event Lookback: ${options.eventLookback} minutes`);
  if (options.outputPane) {
    console.log(`   Output Pane: ${options.outputPane}`);
  }
  if (options.logFile) {
    console.log(`   Log File: ${options.logFile}`);
  }
  console.log('');

  try {
    await runTimeline(options);

    // If refresh interval is set, run periodically
    if (options.refreshInterval && options.refreshInterval > 0) {
      console.log(`⏰ Auto-refresh enabled (every ${options.refreshInterval} seconds)`);
      console.log('   Press Ctrl+C to stop');
      setInterval(() => {
        runTimeline(options).catch((error) => {
          console.error('Error during auto-refresh:', error);
        });
      }, options.refreshInterval * 1000);

      // Keep the process running
      process.stdin.resume();
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

async function runTimeline(options: ConductorTimelineOptions): Promise<void> {
  // Initialize components
  const tmuxAdapter = new TmuxAdapter();
  const eventLoaderConfig = createDefaultConfig(process.cwd(), options.eventLookback);
  const eventLoader = new EventLoader(eventLoaderConfig);
  const aggregator = new TimelineAggregator();
  const formatter = new TimelineFormatter();

  // Get agent panes
  const agentPanes = await tmuxAdapter.getAgentPanes(options.window);
  console.log(`📊 Found ${agentPanes.length} agent panes`);

  // Load recent events
  const recentEvents = eventLoader.loadRecentEvents();
  console.log(`📜 Loaded ${recentEvents.length} recent events`);

  // Aggregate timeline
  const aggregation = aggregator.aggregate(options.window, agentPanes, recentEvents);

  // Format report
  const report = formatter.format(aggregation);

  // Determine writer config
  let writerConfig;
  if (options.outputPane && options.logFile) {
    writerConfig = createDualWriterConfig(options.outputPane, options.logFile);
  } else if (options.outputPane) {
    writerConfig = createTmuxWriterConfig(options.outputPane);
  } else if (options.logFile) {
    writerConfig = createJSONWriterConfig(options.logFile);
  } else {
    // Default: output to stdout
    console.log('');
    console.log(report.humanReadable);
    console.log('');
    console.log('JSON Output:');
    console.log(report.jsonLog);
    return;
  }

  // Write report
  const writer = new TimelineWriter(writerConfig);
  writer.write(report);

  console.log('✅ Timeline report generated successfully');
}

// ============================================================================
// Entry Point
// ============================================================================

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

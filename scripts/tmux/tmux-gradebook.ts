#!/usr/bin/env tsx

/**
 * Miyabi tmux Gradebook - CLI Entry Point
 *
 * Evaluates tmux session and agent performance, generates gradebook reports.
 *
 * Usage:
 *   tsx scripts/tmux/tmux-gradebook.ts [session-name] [options]
 *
 * Options:
 *   --json           Output JSON instead of Markdown
 *   --output <file>  Save to file instead of stdout
 *   --config <file>  Load configuration from file
 *   --summary        Show compact summary only
 *   --help           Show this help message
 *
 * Examples:
 *   tsx scripts/tmux/tmux-gradebook.ts Miyabi
 *   tsx scripts/tmux/tmux-gradebook.ts Miyabi --json --output .ai/gradebook/latest.json
 *   tsx scripts/tmux/tmux-gradebook.ts Miyabi --summary
 */

import * as path from 'path';
import * as fs from 'fs';
import { DEFAULT_CONFIG, type GradebookConfig } from './types/gradebook';
import { DataCollector } from './gradebook/collector';
import { GradebookCalculator } from './gradebook/calculator';
import { GradebookReporter, saveReport, generateTimestampedFilename } from './gradebook/reporter';

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CLIOptions {
  sessionName: string;
  json: boolean;
  output?: string;
  config?: string;
  summary: boolean;
  help: boolean;
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    sessionName: 'Miyabi',
    json: false,
    summary: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--summary' || arg === '-s') {
      options.summary = true;
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--config' || arg === '-c') {
      options.config = args[++i];
    } else if (!arg.startsWith('-')) {
      options.sessionName = arg;
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
🎓 Miyabi tmux Gradebook - Evaluate tmux session and agent performance

Usage:
  tsx scripts/tmux/tmux-gradebook.ts [session-name] [options]

Arguments:
  session-name         Name of tmux session (default: "Miyabi")

Options:
  --json               Output JSON instead of Markdown
  --output <file>      Save to file instead of stdout
  --config <file>      Load configuration from file
  --summary, -s        Show compact summary only
  --help, -h           Show this help message

Examples:
  # Generate Markdown report for "Miyabi" session
  tsx scripts/tmux/tmux-gradebook.ts Miyabi

  # Generate JSON report and save to file
  tsx scripts/tmux/tmux-gradebook.ts Miyabi --json --output .ai/gradebook/latest.json

  # Show compact summary
  tsx scripts/tmux/tmux-gradebook.ts Miyabi --summary

  # Use custom config file
  tsx scripts/tmux/tmux-gradebook.ts Miyabi --config config/gradebook.json

  # Auto-save with timestamp
  tsx scripts/tmux/tmux-gradebook.ts Miyabi --output .ai/gradebook/

Environment Variables:
  MIYABI_BASE_DIR      Base directory for Miyabi project (default: current directory)

Documentation:
  See docs/tmux/TMUX_GRADEBOOK.md for detailed usage and configuration.
`);
}

// ============================================================================
// Configuration Loading
// ============================================================================

function loadConfig(configPath?: string): GradebookConfig {
  if (!configPath) {
    return DEFAULT_CONFIG;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(content);
    return { ...DEFAULT_CONFIG, ...userConfig };
  } catch (error: any) {
    console.error(`❌ Failed to load config file: ${error.message}`);
    console.error(`   Using default configuration.`);
    return DEFAULT_CONFIG;
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  // Parse CLI arguments
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  // Show help if requested
  if (options.help) {
    showHelp();
    process.exit(0);
  }

  // Load configuration
  const config = loadConfig(options.config);
  config.session_name = options.sessionName;

  // Display startup banner
  if (!options.summary) {
    console.log('🎓 Miyabi tmux Gradebook');
    console.log('━'.repeat(50));
    console.log(`📊 Session: ${config.session_name}`);
    console.log('━'.repeat(50));
    console.log();
  }

  try {
    // Phase 1: Data Collection
    if (!options.summary) console.log('📊 Phase 1: Collecting data...');
    const collector = new DataCollector(config);
    const collectedData = await collector.collect();
    if (!options.summary) console.log('   ✅ Data collection complete\n');

    // Phase 2: Score Calculation
    if (!options.summary) console.log('🔢 Phase 2: Calculating scores...');
    const calculator = new GradebookCalculator(config);
    const gradebook = calculator.calculateGradebook(collectedData);
    if (!options.summary) console.log('   ✅ Score calculation complete\n');

    // Phase 3: Report Generation
    if (!options.summary) console.log('📝 Phase 3: Generating report...');
    const reporter = new GradebookReporter();

    let report: string;
    let extension: string;

    if (options.summary) {
      // Compact summary
      report = reporter.generateSummary(gradebook);
      extension = 'txt';
    } else if (options.json) {
      // JSON export
      report = reporter.generateJSONExport(gradebook);
      extension = 'json';
    } else {
      // Markdown report
      report = reporter.generateMarkdownReport(gradebook);
      extension = 'md';
    }

    if (!options.summary) console.log('   ✅ Report generation complete\n');

    // Phase 4: Output
    if (options.output) {
      let outputPath = options.output;

      // If output is a directory, generate timestamped filename
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).isDirectory()) {
        const filename = generateTimestampedFilename('gradebook', extension);
        outputPath = path.join(outputPath, filename);
      }

      await saveReport(report, outputPath);
      console.log(`✅ Report saved to: ${outputPath}`);

      // Also display summary if not already shown
      if (!options.summary && !options.json) {
        console.log();
        console.log(reporter.generateSummary(gradebook));
      }
    } else {
      // Output to stdout
      console.log(report);
    }

    // Exit with appropriate code
    const exitCode = gradebook.overall_score >= 75 ? 0 : 1;
    process.exit(exitCode);
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.stack && process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// ============================================================================
// Execute
// ============================================================================

main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

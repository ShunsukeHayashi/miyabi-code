/**
 * Conductor Timeline - Main Entry Point
 *
 * Exports public API for programmatic usage.
 */

// Types
export type * from './types/index.js';

// Adapters
export { TmuxAdapter, RealShellExecutor, MockShellExecutor } from './adapters/TmuxAdapter.js';

// Loaders
export { EventLoader } from './loaders/EventLoader.js';

// Aggregators
export { TimelineAggregator } from './aggregators/TimelineAggregator.js';

// Formatters
export { ReportFormatter } from './formatters/ReportFormatter.js';
export { ReportWriter } from './formatters/ReportWriter.js';

// API client
export { MissionControlClient, toMissionControlPayload } from './clients/MissionControlClient.js';

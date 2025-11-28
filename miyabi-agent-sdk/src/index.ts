/**
 * Miyabi Agent SDK
 *
 * Build and orchestrate AI agents for development and business automation.
 *
 * @packageDocumentation
 * @module @miyabi/agent-sdk
 *
 * @example
 * ```typescript
 * import { runMiyabiAgent, orchestrate, buildDAG } from '@miyabi/agent-sdk';
 *
 * // Single agent execution
 * const result = await runMiyabiAgent({
 *   agentType: 'CodeGenAgent',
 *   input: {
 *     issueNumber: 123,
 *     language: 'rust',
 *     description: 'Implement feature X',
 *   },
 * });
 *
 * // DAG-based orchestration
 * const dag = buildDAG([
 *   { id: 'analyze', agentType: 'IssueAgent', input: { issueNumber: 123 }, dependencies: [] },
 *   { id: 'generate', agentType: 'CodeGenAgent', input: { issueNumber: 123 }, dependencies: ['analyze'] },
 *   { id: 'review', agentType: 'ReviewAgent', input: { files: [] }, dependencies: ['generate'] },
 * ]);
 *
 * const orchestrationResult = await orchestrate(dag);
 * ```
 */

// Types
export * from './types.js';

// Agents
export * from './agents/index.js';

// Execution
export {
  runMiyabiAgent,
  runAgentsParallel,
  runAgentsSequential,
  buildDAG,
  hasCycles,
  criticalPath,
  orchestrate,
} from './execution.js';

// Version
export const VERSION = '0.1.0';

// Default export for convenience
export { runMiyabiAgent as default } from './execution.js';

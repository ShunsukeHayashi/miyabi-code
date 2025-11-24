#!/usr/bin/env node
/**
 * CoordinatorAgent - Main Orchestrator
 *
 * User Request → Task Graph → Code Generation → Deployment
 */

import { analyzeIntent } from './intent-analyzer.js';
import { selectAPIs } from './api-selector.js';
import { generateTaskGraph } from './task-generator.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CoordinatorAgentメインエントリポイント
 * @param {string} userRequest - User request in natural language
 * @returns {Promise<Object>} Complete project specification
 */
export async function coordinateProject(userRequest) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 CoordinatorAgent - Lark Dev App Automation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`📝 User Request: "${userRequest}"\n`);

  // Step 1: Intent Analysis
  console.log('═══ Step 1/3: Intent Analysis ═══');
  const intentAnalysis = await analyzeIntent(userRequest);

  // Step 2: API Selection
  console.log('\n═══ Step 2/3: API Selection ═══');
  const apiSelection = await selectAPIs(intentAnalysis);

  // Step 3: Task Graph Generation
  console.log('\n═══ Step 3/3: Task Graph Generation ═══');
  const taskGraph = await generateTaskGraph(intentAnalysis, apiSelection);

  // 統合結果
  const projectSpec = {
    user_request: userRequest,
    intent_analysis: intentAnalysis,
    api_selection: apiSelection,
    task_graph: taskGraph,
    coordinated_at: new Date().toISOString(),
    ready_for_code_gen: true,
  };

  // 結果を保存
  await saveProjectSpec(projectSpec);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Coordination Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  printSummary(projectSpec);

  return projectSpec;
}

/**
 * プロジェクト仕様を保存
 */
async function saveProjectSpec(projectSpec) {
  const outputDir = path.join(__dirname, '../../output/project-specs');
  await fs.mkdir(outputDir, { recursive: true });

  const projectName = projectSpec.task_graph.project_name;
  const outputFile = path.join(outputDir, `${projectName}-spec.json`);

  await fs.writeFile(outputFile, JSON.stringify(projectSpec, null, 2));

  console.log(`\n💾 Project spec saved: ${outputFile}`);
}

/**
 * サマリー表示
 */
function printSummary(projectSpec) {
  const { intent_analysis, api_selection, task_graph } = projectSpec;

  console.log('📊 Project Summary:\n');
  console.log(`  Project Name:     ${task_graph.project_name}`);
  console.log(`  Intent Type:      ${intent_analysis.intent_type}`);
  console.log(`  Total APIs:       ${api_selection.total_apis_selected}`);
  console.log(`  Total Tasks:      ${task_graph.total_tasks}`);
  console.log(`  Total Phases:     ${task_graph.total_phases}`);
  console.log(`  Est. Duration:    ${task_graph.estimated_duration} hours`);
  console.log(`  Critical Path:    ${task_graph.critical_path.duration} hours\n`);

  console.log('🎯 Selected APIs:');
  for (const api of api_selection.selected_apis.slice(0, 5)) {
    console.log(`  • ${api}`);
  }
  if (api_selection.selected_apis.length > 5) {
    console.log(`  ... and ${api_selection.selected_apis.length - 5} more\n`);
  } else {
    console.log('');
  }

  console.log('📋 Task Phases:');
  for (const phase of task_graph.phases) {
    const phaseTasks = task_graph.tasks.filter(t => t.phase === phase.id);
    console.log(`  ${phase.id}. ${phase.name} (${phaseTasks.length} tasks)`);
  }

  console.log('\n💡 Next Steps:');
  console.log('  1. Review project specification');
  console.log('  2. Pass to CodeGenAgent for implementation');
  console.log('  3. TestingAgent validates generated code');
  console.log('  4. DeploymentAgent deploys to Lark\n');
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const userRequest =
    process.argv[2] ||
    'カレンダーの予定を管理できるBotを作って。今日の予定一覧表示、新しい予定追加、予定のリマインダー通知の機能が欲しい';

  coordinateProject(userRequest).then(() => {
    console.log('✅ Coordination complete!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Coordination failed:', error);
    process.exit(1);
  });
}

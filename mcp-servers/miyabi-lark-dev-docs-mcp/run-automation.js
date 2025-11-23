#!/usr/bin/env node
/**
 * Lark Dev App Full Automation - End-to-End Runner
 *
 * Usage: node run-automation.js "<your request>"
 * Example: node run-automation.js "カレンダー管理Botを作って"
 */

import { analyzeRequirements } from './sub-agents/requirements/index.js';
import { coordinateProject } from './sub-agents/coordinator/index.js';
import { generateDesignSpecs } from './sub-agents/design/index.js';
import { generateLarkApp } from './sub-agents/code-gen/index.js';
import { deployLarkApp } from './sub-agents/deployment/index.js';
import { generateTestSuite } from './sub-agents/testing/index.js';
import { setupMaintenance } from './sub-agents/maintenance/index.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * End-to-End自動化実行
 */
async function runFullAutomation(userRequest, options = {}) {
  // Input validation
  if (!userRequest || typeof userRequest !== 'string' || userRequest.trim() === '') {
    throw new Error('Invalid input: User request must be a non-empty string');
  }

  // Sanitize input to prevent XSS/injection
  const sanitized = userRequest
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();

  if (sanitized.length === 0) {
    throw new Error('Invalid input: Request contains only dangerous content');
  }

  // Extract options
  const {
    analyzeRequirements: doAnalyzeReqs = false,
    generateDesign = false,
    generateTests = false,
    setupMaintenance: doSetupMaintenance = false,
    deploymentConfig = {}
  } = options;

  // Calculate total phases: base 3 + requirements (opt) + design (opt) + testing (opt) + maintenance (opt)
  const totalPhases = 3 + (doAnalyzeReqs ? 1 : 0) + (generateDesign ? 1 : 0) + (generateTests ? 1 : 0) + (doSetupMaintenance ? 1 : 0);

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  🤖 Miyabi Lark Dev App Full Automation System v2.0          ║');

  // Build pipeline display
  let pipeline = '║  User Request';
  if (doAnalyzeReqs) pipeline += ' → Requirements';
  pipeline += ' → Coordinate';
  if (generateDesign) pipeline += ' → Design';
  pipeline += ' → Code Gen';
  if (generateTests) pipeline += ' → Testing';
  pipeline += ' → Deploy';
  if (doSetupMaintenance) pipeline += ' → Maintenance';

  // Pad to fit in box (need to handle long pipelines)
  if (pipeline.length > 67) {
    // Split into two lines if too long
    console.log(pipeline.slice(0, 67) + '║');
    console.log('║  ' + pipeline.slice(67).padEnd(63) + '║');
  } else {
    console.log(pipeline.padEnd(67) + '║');
  }

  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const startTime = Date.now();

  try {
    let currentPhase = 1;

    // Phase 0 (Optional): Requirements Analysis
    let requirements = null;
    if (doAnalyzeReqs) {
      console.log(`━━━ Phase ${currentPhase}/${totalPhases}: RequirementsAgent ━━━\n`);
      requirements = await analyzeRequirements(userRequest);
      currentPhase++;
    }

    // Phase 1 or 2: Coordination
    console.log(`━━━ Phase ${currentPhase}/${totalPhases}: CoordinatorAgent ━━━\n`);
    const projectSpec = await coordinateProject(userRequest);
    currentPhase++;

    // Phase 2 (Optional): Design Specifications
    let designSpecs = null;
    if (generateDesign) {
      console.log(`\n━━━ Phase ${currentPhase}/${totalPhases}: DesignAgent ━━━\n`);
      designSpecs = await generateDesignSpecs(projectSpec);
      currentPhase++;
    }

    // Phase 3 or 2: Code Generation
    console.log(`\n━━━ Phase ${currentPhase}/${totalPhases}: CodeGenAgent ━━━\n`);
    const generatedApp = await generateLarkApp(projectSpec);
    currentPhase++;

    // Phase 4/3 (Optional): Test Suite Generation
    let testSuite = null;
    if (generateTests) {
      console.log(`\n━━━ Phase ${currentPhase}/${totalPhases}: TestingAgent ━━━\n`);
      testSuite = await generateTestSuite(generatedApp, projectSpec);
      currentPhase++;
    }

    // Deployment Phase
    console.log(`\n━━━ Phase ${currentPhase}/${totalPhases}: DeploymentAgent ━━━\n`);
    const deployment = await deployLarkApp(generatedApp.output_directory, deploymentConfig);
    currentPhase++;

    // Final Phase (Optional): Maintenance Setup
    let maintenance = null;
    if (doSetupMaintenance) {
      console.log(`\n━━━ Phase ${currentPhase}/${totalPhases}: MaintenanceAgent ━━━\n`);
      maintenance = await setupMaintenance({ ...deployment, ...generatedApp }, projectSpec);
    }

    // Final Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  🎉 Full Automation Complete!                                ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('\n');

    printFinalSummary({
      user_request: userRequest,
      requirements: requirements,
      project_spec: projectSpec,
      design_specs: designSpecs,
      generated_app: generatedApp,
      test_suite: testSuite,
      deployment: deployment,
      maintenance: maintenance,
      duration_seconds: duration,
    });

    // Save complete result
    await saveAutomationResult({
      user_request: userRequest,
      requirements: requirements,
      project_spec: projectSpec,
      design_specs: designSpecs,
      generated_app: generatedApp,
      test_suite: testSuite,
      deployment: deployment,
      maintenance: maintenance,
      duration_seconds: duration,
      completed_at: new Date().toISOString(),
    });

    return {
      status: 'success',
      project_name: generatedApp.project_name,
      app_directory: generatedApp.output_directory,
      webhook_url: deployment.webhook_url,
      health_url: deployment.health_url,
    };
  } catch (error) {
    console.error('\n❌ Automation Failed:', error.message);
    console.error(error.stack);

    return {
      status: 'failed',
      error: error.message,
    };
  }
}

/**
 * 最終サマリー表示
 */
function printFinalSummary(result) {
  console.log('📊 Complete Automation Summary:\n');
  console.log('  ┌─────────────────────────────────────────────────────────┐');
  console.log(`  │ User Request:    ${result.user_request.slice(0, 38).padEnd(38)} │`);
  console.log(`  │ Project Name:    ${result.generated_app.project_name.padEnd(38)} │`);
  console.log(`  │ Intent Type:     ${result.project_spec.intent_analysis.intent_type.padEnd(38)} │`);
  console.log(`  │ APIs Used:       ${String(result.generated_app.api_count).padEnd(38)} │`);
  console.log(`  │ Tasks Generated: ${String(result.generated_app.task_count).padEnd(38)} │`);
  console.log(`  │ Duration:        ${result.duration_seconds}s${(' '.repeat(35 - result.duration_seconds.length))} │`);
  console.log('  └─────────────────────────────────────────────────────────┘\n');

  console.log('🔗 Deployment URLs:\n');
  console.log(`  Webhook:   ${result.deployment.webhook_url || 'N/A'}`);
  console.log(`  Health:    ${result.deployment.health_url || 'N/A'}\n`);

  console.log('📁 Generated Files:\n');
  console.log(`  Location:  ${result.generated_app.output_directory}`);
  console.log(`  Files:     ${result.generated_app.generated_files.join(', ')}\n`);

  // Display requirements analysis if generated
  if (result.requirements) {
    console.log('📋 Generated Requirements Documentation:\n');
    console.log(`  Requirements Dir: ${result.requirements.output_directory}`);
    console.log(`  BRD/TRD:          Business & Technical Requirements`);
    console.log(`  User Personas:    ${result.requirements.user_personas.persona_count} personas`);
    console.log(`  Success Metrics:  Comprehensive KPI definitions`);
    console.log(`  Architecture:     ${result.requirements.architecture_recommendation.recommended_pattern}`);
    console.log(`  Total Documents:  ${result.requirements.documents.length} files\n`);
  }

  // Display design specs information if generated
  if (result.design_specs) {
    console.log('🎨 Generated Design Specifications:\n');
    console.log(`  Design Directory: ${result.design_specs.output_directory}`);
    console.log(`  ER Diagrams:      ${result.design_specs.data_model.entity_count} entities`);
    console.log(`  UI Cards:         ${result.design_specs.ui_design.card_count} templates`);
    console.log(`  User Journeys:    ${result.design_specs.user_flows.journey_count} flows`);
    console.log(`  Design Files:     ${result.design_specs.design_files.length} files\n`);
  }

  // Display test suite information if generated
  if (result.test_suite) {
    console.log('🧪 Generated Test Suite:\n');
    console.log(`  Test Directory:  ${result.test_suite.test_directory}`);
    console.log(`  Total Tests:     ${result.test_suite.total_tests}`);
    console.log(`  Coverage Target: ${result.test_suite.coverage_target}`);
    console.log('  Test Types:      Unit, Integration, E2E, Security');
    console.log('  Run Tests:       npm test\n');
  }

  // Display maintenance configuration if generated
  if (result.maintenance) {
    console.log('🔧 Maintenance & Observability Setup:\n');
    console.log(`  Config Directory: ${result.maintenance.output_directory}`);
    console.log(`  Monitoring:       ${result.maintenance.monitoring.health_check_count} health checks`);
    console.log(`  Metrics:          ${result.maintenance.metrics.metric_count} application metrics`);
    console.log(`  Alerting:         ${result.maintenance.alerting.alert_rule_count} alert rules + runbooks`);
    console.log(`  Optimization:     ${result.maintenance.optimization.recommendation_count} performance recommendations`);
    console.log(`  Scalability:      ${result.maintenance.scalability.scenario_count} growth scenarios`);
    console.log(`  Feedback:         ${result.maintenance.feedback.collection_method_count} collection methods`);
    console.log(`  Config Files:     ${result.maintenance.config_files.length} files\n`);
  }

  console.log('💡 Next Steps:\n');

  let step = 1;

  if (result.requirements) {
    console.log(`  ${step++}. Review requirements documentation (BRD, TRD, personas)`);
  }

  if (result.design_specs) {
    console.log(`  ${step++}. Review design specifications (ER diagrams, API specs)`);
  }

  if (result.test_suite) {
    console.log(`  ${step++}. Run the generated test suite: npm test`);
  }

  if (result.maintenance) {
    console.log(`  ${step++}. Set up monitoring & alerting (see maintenance/MONITORING_SETUP.md)`);
    console.log(`  ${step++}. Review performance optimization recommendations`);
    console.log(`  ${step++}. Configure user feedback collection`);
  }

  console.log(`  ${step++}. Configure Lark Event Subscription (see instructions above)`);
  console.log(`  ${step++}. Add bot to a Lark group`);
  console.log(`  ${step++}. Test with @mention commands`);
  console.log(`  ${step++}. Monitor logs and health endpoint\n`);
}

/**
 * 自動化結果を保存
 */
async function saveAutomationResult(result) {
  const outputDir = path.join(
    new URL('.', import.meta.url).pathname,
    'output/automation-results'
  );
  await fs.mkdir(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(
    outputDir,
    `automation-result-${timestamp}.json`
  );

  await fs.writeFile(outputFile, JSON.stringify(result, null, 2));

  console.log(`💾 Complete result saved: ${outputFile}\n`);
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const userRequest = process.argv[2];
  const appId = process.argv[3];
  const appSecret = process.argv[4];

  if (!userRequest) {
    console.error('\n❌ Usage: node run-automation.js "<user request>" [app_id] [app_secret]\n');
    console.error('Example:');
    console.error('  node run-automation.js "カレンダー管理Botを作って"\n');
    process.exit(1);
  }

  const deploymentConfig = {
    app_id: appId || 'cli_a994d7e3b8789e1a',
    app_secret: appSecret || 'rNrwfiZCD9aRCCrQY5E1OeifhDg2kZJL',
    port: 3000,
  };

  runFullAutomation(userRequest, deploymentConfig).then(result => {
    if (result.status === 'success') {
      console.log('✅ Automation completed successfully!');
      console.log(`\n🚀 Your Lark Bot is ready: ${result.webhook_url}\n`);
      process.exit(0);
    } else {
      console.log('\n❌ Automation failed. Check logs above for details.\n');
      process.exit(1);
    }
  });
}
export { runFullAutomation };

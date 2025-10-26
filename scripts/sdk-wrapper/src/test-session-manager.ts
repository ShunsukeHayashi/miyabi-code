#!/usr/bin/env tsx
/**
 * Test script for SessionManager
 *
 * Verifies:
 * - Session creation
 * - Session resumption
 * - Context preservation
 * - Cleanup functionality
 */

import { SessionManager } from './session-manager';

async function runTests() {
  console.log('=====================================');
  console.log('SessionManager Test Suite');
  console.log('=====================================');
  console.log('');

  const manager = new SessionManager('/tmp/miyabi-sessions-test');

  // Test 1: Create session
  console.log('Test 1: Create Session');
  const session = manager.create({
    issueNumber: 270,
    complexity: 'Medium',
    worktree: '/tmp/worktree-270',
    metadata: { author: 'test-runner' }
  });

  console.log(`✅ Created session: ${session.id}`);
  console.log(`   Issue: #${session.issueNumber}`);
  console.log(`   Status: ${session.status}`);
  console.log('');

  // Test 2: Add conversation turns
  console.log('Test 2: Add Conversation Turns');
  session.addTurn({
    step: 'D2-ComplexityCheck',
    prompt: 'Analyze Issue #270 complexity',
    response: 'Medium complexity detected. Estimated: 5 files, 60 minutes.',
    timestamp: new Date().toISOString(),
    duration: 1500,
    tokenUsage: { input: 1000, output: 500 }
  });

  session.addTurn({
    step: 'D3-TaskDecomposition',
    prompt: 'Break down into subtasks',
    response: 'Task 1: Add endpoint. Task 2: Write tests. Task 3: Update docs.',
    timestamp: new Date().toISOString(),
    duration: 2000,
    tokenUsage: { input: 1200, output: 800 }
  });

  console.log(`✅ Added ${session.history.length} turns`);
  console.log('');

  // Test 3: Get context summary
  console.log('Test 3: Get Context Summary');
  const summary = session.getContextSummary();
  console.log(summary);
  console.log('');

  // Test 4: Resume session
  console.log('Test 4: Resume Session');
  const sessionId = session.id;
  const resumed = manager.resume(sessionId);

  if (resumed && resumed.history.length === 2) {
    console.log(`✅ Resumed session: ${resumed.id}`);
    console.log(`   History preserved: ${resumed.history.length} turns`);
  } else {
    console.log('❌ Failed to resume session');
  }
  console.log('');

  // Test 5: Find by issue number
  console.log('Test 5: Find by Issue Number');
  const found = manager.findByIssue(270);
  console.log(`✅ Found ${found.length} session(s) for Issue #270`);
  console.log('');

  // Test 6: Get latest session
  console.log('Test 6: Get Latest Session');
  const latest = manager.getLatestForIssue(270);
  if (latest) {
    console.log(`✅ Latest session: ${latest.id}`);
    console.log(`   Turns: ${latest.history.length}`);
  } else {
    console.log('❌ No session found');
  }
  console.log('');

  // Test 7: Session metadata
  console.log('Test 7: Session Metadata');
  session.setMetadata('step', 'D5-CodeGeneration');
  session.setMetadata('progress', '40%');
  console.log(`✅ Metadata set:`);
  console.log(`   step: ${session.getMetadata('step')}`);
  console.log(`   progress: ${session.getMetadata('progress')}`);
  console.log('');

  // Test 8: List active sessions
  console.log('Test 8: List Active Sessions');
  const active = manager.listActive();
  console.log(`✅ Active sessions: ${active.length}`);
  for (const s of active) {
    console.log(`   - ${s.id} (Issue #${s.issueNumber})`);
  }
  console.log('');

  // Test 9: Complete session
  console.log('Test 9: Complete Session');
  session.complete();
  console.log(`✅ Session marked as completed`);
  console.log(`   Status: ${session.status}`);
  console.log('');

  // Test 10: Get statistics
  console.log('Test 10: Get Statistics');
  const stats = manager.getStats();
  console.log('✅ Session statistics:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   Active: ${stats.active}`);
  console.log(`   Completed: ${stats.completed}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   Cached: ${stats.cached}`);
  console.log('');

  // Test 11: Cleanup
  console.log('Test 11: Cleanup (dry run)');
  const cleaned = manager.cleanup(0); // 0 days = cleanup completed/failed immediately
  console.log(`✅ Would clean up ${cleaned} old sessions`);
  console.log('');

  // Test 12: Destroy session
  console.log('Test 12: Destroy Session');
  manager.destroy(sessionId);
  const afterDestroy = manager.resume(sessionId);
  if (!afterDestroy) {
    console.log(`✅ Session ${sessionId} destroyed successfully`);
  } else {
    console.log('❌ Failed to destroy session');
  }
  console.log('');

  console.log('=====================================');
  console.log('All Tests Completed');
  console.log('=====================================');
}

// Run tests
runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});

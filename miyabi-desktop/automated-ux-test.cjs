/**
 * Automated UX Test for Miyabi Desktop
 * Tests real-time log streaming functionality
 *
 * Run with: node automated-ux-test.js
 */

const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRealTimeLogStreaming() {
  console.log('🚀 Starting Miyabi Desktop UX Test...\n');

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--window-size=1920,1080']
  });

  const page = await browser.newPage();

  // Set up console listener
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('[DEBUG]')) {
      console.log(`   📝 Console: ${text}`);
    }
  });

  try {
    console.log('📍 Step 1: Navigate to Miyabi Desktop');
    await page.goto('http://localhost:1420', { waitUntil: 'networkidle2' });
    console.log('   ✅ Page loaded\n');

    await sleep(2000);

    console.log('📍 Step 2: Verify Agent Execution Panel is visible');
    const agentPanel = await page.$('[data-testid="agent-execution-panel"]')
      || await page.$('.agent-execution-panel')
      || await page.evaluate(() => {
        const headers = Array.from(document.querySelectorAll('h2'));
        return headers.some(h => h.textContent.includes('Agent Execution'));
      });

    if (agentPanel) {
      console.log('   ✅ Agent Execution Panel found\n');
    } else {
      console.log('   ⚠️  Agent Execution Panel not found, checking page structure...');
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('   Page content:', bodyText.substring(0, 200));
    }

    await sleep(1000);

    console.log('📍 Step 3: Wait for Issue dropdown to load');
    await page.waitForSelector('select', { timeout: 5000 });
    console.log('   ✅ Issue dropdown loaded\n');

    await sleep(1000);

    console.log('📍 Step 4: Select CoordinatorAgent');
    // Look for the agent card with "しきるん" or "CoordinatorAgent"
    const agentCard = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('button, div[role="button"]'));
      const coordinatorCard = cards.find(card =>
        card.textContent.includes('しきるん') ||
        card.textContent.includes('CoordinatorAgent')
      );
      if (coordinatorCard) {
        coordinatorCard.click();
        return true;
      }
      return false;
    });

    if (agentCard) {
      console.log('   ✅ CoordinatorAgent selected\n');
    } else {
      console.log('   ⚠️  CoordinatorAgent not found, listing available agents...');
      const agents = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('button, div'));
        return cards
          .filter(c => c.textContent.includes('Agent'))
          .map(c => c.textContent.substring(0, 50));
      });
      console.log('   Available:', agents.slice(0, 5));
    }

    await sleep(1000);

    console.log('📍 Step 5: Click Execute Agent button');
    const executeButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const execButton = buttons.find(btn =>
        btn.textContent.includes('Execute Agent') ||
        btn.textContent.includes('実行')
      );
      if (execButton) {
        execButton.click();
        return true;
      }
      return false;
    });

    if (executeButton) {
      console.log('   ✅ Execute Agent button clicked\n');
    } else {
      console.log('   ❌ Execute Agent button not found\n');
      throw new Error('Cannot proceed without Execute button');
    }

    console.log('📍 Step 6: Monitor real-time log output');
    console.log('   Waiting for logs to appear...\n');

    // Monitor for 60 seconds or until completion
    const startTime = Date.now();
    let lastLogCount = 0;
    let executionComplete = false;

    while (Date.now() - startTime < 60000 && !executionComplete) {
      await sleep(1000);

      // Check console logs
      const debugLogs = consoleLogs.filter(log => log.includes('[DEBUG]'));
      if (debugLogs.length > lastLogCount) {
        console.log(`   📊 Total debug logs: ${debugLogs.length}`);
        lastLogCount = debugLogs.length;
      }

      // Check if execution is complete
      const status = await page.evaluate(() => {
        const statusElements = Array.from(document.querySelectorAll('p, div, span'));
        const successElem = statusElements.find(el =>
          el.textContent.includes('実行完了') ||
          el.textContent.includes('Success')
        );
        const failedElem = statusElements.find(el =>
          el.textContent.includes('Failed')
        );

        if (successElem) return 'success';
        if (failedElem) return 'failed';
        return 'running';
      });

      if (status === 'success') {
        console.log('   ✅ Execution completed successfully!\n');
        executionComplete = true;
      } else if (status === 'failed') {
        console.log('   ❌ Execution failed\n');
        executionComplete = true;
      }
    }

    if (!executionComplete) {
      console.log('   ⚠️  Execution timed out after 60 seconds\n');
    }

    console.log('📍 Step 7: Analyze results');

    // Count different types of debug logs
    const setupLogs = consoleLogs.filter(log => log.includes('Setting up output listener'));
    const receivedLogs = consoleLogs.filter(log => log.includes('Received agent output'));
    const completeLogs = consoleLogs.filter(log => log.includes('listener setup complete'));

    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Total console logs: ${consoleLogs.length}`);
    console.log(`Output listener setup: ${setupLogs.length}`);
    console.log(`Listener setup complete: ${completeLogs.length}`);
    console.log(`Agent output received: ${receivedLogs.length}`);
    console.log('');

    // Evaluate success
    const success =
      setupLogs.length > 0 &&
      completeLogs.length > 0 &&
      receivedLogs.length > 0;

    if (success) {
      console.log('✅ TEST PASSED: Real-time log streaming is working!');
      console.log('   - Output listener was set up correctly');
      console.log('   - Logs were received in real-time');
    } else {
      console.log('❌ TEST FAILED: Issues detected');
      if (setupLogs.length === 0) {
        console.log('   - Output listener setup not detected');
      }
      if (receivedLogs.length === 0) {
        console.log('   - No agent output received');
      }
    }

    console.log('\n💡 Tip: Check Terminal for backend [DEBUG] logs');
    console.log('   Should see: "[DEBUG] Emitting stdout: ..."');
    console.log('   And: "[DEBUG] stdout handler completed"');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
  } finally {
    console.log('\n🔍 Press Enter to close browser and exit...');
    process.stdin.once('data', async () => {
      await browser.close();
      process.exit(0);
    });
  }
}

// Run test
testRealTimeLogStreaming().catch(console.error);

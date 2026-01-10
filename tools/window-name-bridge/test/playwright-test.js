/**
 * WindowName Bridge - Playwright Test Script
 *
 * This script demonstrates how to use the WindowName Bridge
 * with Playwright for automated file uploads.
 *
 * Usage:
 *   node playwright-test.js [image_path] [target_url]
 *
 * Example:
 *   node playwright-test.js ./test-image.png https://note.com/edit
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const LOADER_URL = 'http://localhost:8085/loader.html';
const INJECT_SCRIPT = path.join(__dirname, '../server/inject.js');

async function testWindowNameBridge(imagePath, targetUrl) {
    console.log('='.repeat(60));
    console.log('WindowName Bridge - Playwright Test');
    console.log('='.repeat(60));

    // Validate inputs
    if (!fs.existsSync(imagePath)) {
        console.error(`Error: Image file not found: ${imagePath}`);
        process.exit(1);
    }

    console.log(`Image: ${imagePath}`);
    console.log(`Target: ${targetUrl}`);
    console.log('');

    const browser = await chromium.launch({
        headless: false,  // Set to true for headless mode
        slowMo: 100       // Slow down for debugging
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Step 1: Navigate to loader.html
        console.log('[Step 1] Opening loader.html...');
        await page.goto(LOADER_URL);
        await page.waitForSelector('#fileInput');
        console.log('         ✓ Loader page ready');

        // Step 2: Select file
        console.log('[Step 2] Selecting file...');
        await page.setInputFiles('#fileInput', imagePath);
        await page.waitForSelector('#bridgeBtn:not([disabled])');
        console.log('         ✓ File loaded and encoded');

        // Step 3: Set target URL
        console.log('[Step 3] Setting target URL...');
        await page.fill('#targetUrl', targetUrl);
        console.log(`         ✓ Target URL set: ${targetUrl}`);

        // Step 4: Click bridge button
        console.log('[Step 4] Executing bridge...');
        await page.click('#bridgeBtn');
        console.log('         ✓ Bridge initiated');

        // Step 5: Wait for navigation to target
        console.log('[Step 5] Waiting for target page...');
        await page.waitForURL(`**${new URL(targetUrl).hostname}**`, { timeout: 30000 });
        console.log('         ✓ Navigated to target');

        // Step 6: Inject script
        console.log('[Step 6] Injecting bridge script...');
        await page.addScriptTag({ path: INJECT_SCRIPT });
        console.log('         ✓ Script injected');

        // Step 7: Execute injection
        console.log('[Step 7] Executing file injection...');
        const result = await page.evaluate(() => {
            if (typeof WindowNameBridge === 'undefined') {
                return { success: false, error: 'WindowNameBridge not loaded' };
            }

            if (!WindowNameBridge.hasBridgeData()) {
                return { success: false, error: 'No bridge data found' };
            }

            try {
                const success = WindowNameBridge.inject({
                    clearAfterInject: true
                });
                return { success, error: null };
            } catch (e) {
                return { success: false, error: e.message };
            }
        });

        if (result.success) {
            console.log('         ✓ File injected successfully!');
            console.log('');
            console.log('='.repeat(60));
            console.log('TEST PASSED');
            console.log('='.repeat(60));
        } else {
            console.error(`         ✗ Injection failed: ${result.error}`);
            console.log('');
            console.log('='.repeat(60));
            console.log('TEST FAILED');
            console.log('='.repeat(60));
        }

        // Keep browser open for inspection
        console.log('');
        console.log('Browser will stay open for 30 seconds for inspection...');
        await page.waitForTimeout(30000);

    } catch (error) {
        console.error('');
        console.error('='.repeat(60));
        console.error('TEST ERROR');
        console.error('='.repeat(60));
        console.error(error.message);
    } finally {
        await browser.close();
    }
}

// Main
const args = process.argv.slice(2);
const imagePath = args[0] || './test-image.png';
const targetUrl = args[1] || 'https://example.com';

testWindowNameBridge(imagePath, targetUrl);

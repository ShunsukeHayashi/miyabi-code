import { startDeviceFlow, pollDeviceFlow, checkAuthStatus } from './dist/github-auth.js';

console.log("🔐 Testing GitHub Device Flow...\n");

try {
  const result = await startDeviceFlow();
  console.log("✅ Device Flow Started!");
  console.log(`\n📱 Open: ${result.verificationUri}`);
  console.log(`🔑 Enter code: ${result.userCode}`);
  console.log(`⏱️  Expires in: ${Math.floor(result.expiresIn / 60)} minutes\n`);
  
  console.log("Waiting 10 seconds then polling...");
  await new Promise(r => setTimeout(r, 10000));
  
  const poll = await pollDeviceFlow();
  console.log("Poll result:", poll);
} catch (e) {
  console.error("Error:", e.message);
}

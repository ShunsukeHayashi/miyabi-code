// Quick test for GitHub Device Flow
const GITHUB_CLIENT_ID = "Ov23libBz1xgaQYWEPBh";

async function testDeviceFlow() {
  console.log("🔐 Starting GitHub Device Flow Test...\n");
  
  try {
    const response = await fetch("https://github.com/login/device/code", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        scope: "repo user read:org"
      })
    });

    const data = await response.json();
    
    console.log("✅ Device Flow Started!");
    console.log("=".repeat(50));
    console.log(`🔗 Open: ${data.verification_uri}`);
    console.log(`📝 Code: ${data.user_code}`);
    console.log(`⏱️  Expires in: ${Math.floor(data.expires_in / 60)} minutes`);
    console.log("=".repeat(50));
    console.log("\n1. Open the URL above in your browser");
    console.log("2. Enter the code shown");
    console.log("3. Click 'Authorize'");
    console.log("\nDevice Code:", data.device_code);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testDeviceFlow();

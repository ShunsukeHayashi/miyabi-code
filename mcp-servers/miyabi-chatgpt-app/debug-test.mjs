const GITHUB_CLIENT_ID = "Ov23libBz1xgaQYWEPBh";

async function debug() {
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

  console.log("Status:", response.status);
  const text = await response.text();
  console.log("Response:", text);
  
  try {
    const json = JSON.parse(text);
    console.log("Parsed:", JSON.stringify(json, null, 2));
  } catch (e) {
    console.log("Not JSON");
  }
}

debug();

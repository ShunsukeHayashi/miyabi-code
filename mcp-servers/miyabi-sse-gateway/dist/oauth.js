import crypto from 'crypto';
// Store authorization codes temporarily (in production, use Redis)
const authCodes = new Map();
// OAuth configuration
const OAUTH_CONFIG = {
    clientId: 'miyabi-chatgpt',
    clientSecret: process.env.MIYABI_OAUTH_SECRET || crypto.randomBytes(32).toString('hex'),
    accessToken: process.env.MIYABI_BEARER_TOKEN || '',
    authorizationCodeExpiry: 10 * 60 * 1000, // 10 minutes
};
// Generate authorization code
function generateAuthCode() {
    return crypto.randomBytes(32).toString('hex');
}
// OAuth Authorization Endpoint (Step 1: Show authorization page)
export const oauthAuthorize = (req, res) => {
    const { client_id, redirect_uri, state, response_type } = req.query;
    // Validate required parameters
    if (!client_id || !redirect_uri || !state) {
        return res.status(400).json({
            error: 'invalid_request',
            error_description: 'Missing required parameters: client_id, redirect_uri, or state'
        });
    }
    if (response_type !== 'code') {
        return res.status(400).json({
            error: 'unsupported_response_type',
            error_description: 'Only response_type=code is supported'
        });
    }
    // Show authorization page
    res.send(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Miyabi Society - 認証</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 20px;
    }
    h1 {
      color: #1a1a1a;
      font-size: 28px;
      margin-bottom: 12px;
    }
    .subtitle {
      color: #666;
      font-size: 16px;
      margin-bottom: 30px;
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 24px 0;
      text-align: left;
      border-radius: 8px;
    }
    .info-box h2 {
      color: #333;
      font-size: 18px;
      margin-bottom: 12px;
    }
    .info-box ul {
      list-style: none;
      color: #555;
      line-height: 1.8;
    }
    .info-box li:before {
      content: "✓ ";
      color: #667eea;
      font-weight: bold;
      margin-right: 8px;
    }
    .warning {
      background: #fff3cd;
      border-left-color: #ffc107;
      color: #856404;
    }
    .authorize-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 16px 48px;
      font-size: 18px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      width: 100%;
      margin-top: 24px;
    }
    .authorize-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    .authorize-btn:active {
      transform: translateY(0);
    }
    .footer {
      margin-top: 24px;
      color: #999;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🏯</div>
    <h1>Miyabi Society</h1>
    <p class="subtitle">ChatGPTからのアクセスを許可しますか？</p>

    <div class="info-box">
      <h2>📋 アクセス権限</h2>
      <ul>
        <li>14個のMiyabiエージェント管理</li>
        <li>tmuxセッション制御</li>
        <li>システムステータス確認</li>
        <li>デイリーレポート生成</li>
      </ul>
    </div>

    <div class="info-box warning">
      <h2>⚠️ 重要な注意事項</h2>
      <ul>
        <li>破壊的操作には確認が必要です</li>
        <li>全てのアクションは監査ログに記録されます</li>
        <li>Rate Limit: 30リクエスト/分</li>
      </ul>
    </div>

    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="${client_id}">
      <input type="hidden" name="redirect_uri" value="${redirect_uri}">
      <input type="hidden" name="state" value="${state}">
      <button type="submit" class="authorize-btn">
        ✅ 許可する
      </button>
    </form>

    <div class="footer">
      Powered by Miyabi Society MCP Server v1.0.0
    </div>
  </div>
</body>
</html>
  `);
};
// OAuth Authorization POST (Step 2: User approves, generate code)
export const oauthAuthorizePost = (req, res) => {
    const { client_id, redirect_uri, state } = req.body;
    if (!client_id || !redirect_uri || !state) {
        return res.status(400).json({
            error: 'invalid_request',
            error_description: 'Missing required parameters'
        });
    }
    // Generate authorization code
    const code = generateAuthCode();
    const expiresAt = Date.now() + OAUTH_CONFIG.authorizationCodeExpiry;
    // Store the code
    authCodes.set(code, {
        clientId: client_id,
        redirectUri: redirect_uri,
        expiresAt
    });
    // Clean up expired codes
    for (const [key, value] of authCodes.entries()) {
        if (value.expiresAt < Date.now()) {
            authCodes.delete(key);
        }
    }
    // Redirect back to ChatGPT with authorization code
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', code);
    redirectUrl.searchParams.set('state', state);
    res.redirect(redirectUrl.toString());
};
// OAuth Token Endpoint (Step 3: Exchange code for access token)
export const oauthToken = (req, res) => {
    const { grant_type, code, redirect_uri, client_id, client_secret } = req.body;
    // Validate grant_type
    if (grant_type !== 'authorization_code') {
        return res.status(400).json({
            error: 'unsupported_grant_type',
            error_description: 'Only grant_type=authorization_code is supported'
        });
    }
    // Validate client credentials
    if (client_id !== OAUTH_CONFIG.clientId || client_secret !== OAUTH_CONFIG.clientSecret) {
        return res.status(401).json({
            error: 'invalid_client',
            error_description: 'Invalid client_id or client_secret'
        });
    }
    // Validate authorization code
    const authCode = authCodes.get(code);
    if (!authCode) {
        return res.status(400).json({
            error: 'invalid_grant',
            error_description: 'Invalid or expired authorization code'
        });
    }
    // Check if code is expired
    if (authCode.expiresAt < Date.now()) {
        authCodes.delete(code);
        return res.status(400).json({
            error: 'invalid_grant',
            error_description: 'Authorization code has expired'
        });
    }
    // Validate redirect_uri matches
    if (authCode.redirectUri !== redirect_uri) {
        return res.status(400).json({
            error: 'invalid_grant',
            error_description: 'redirect_uri does not match'
        });
    }
    // Delete used code (one-time use)
    authCodes.delete(code);
    // Return access token
    res.json({
        access_token: OAUTH_CONFIG.accessToken,
        token_type: 'Bearer',
        expires_in: 31536000, // 1 year
        scope: 'miyabi:read miyabi:write miyabi:execute'
    });
};
// Export configuration for setup display
export const getOAuthConfig = () => ({
    clientId: OAUTH_CONFIG.clientId,
    clientSecret: OAUTH_CONFIG.clientSecret,
    authorizationUrl: '/oauth/authorize',
    tokenUrl: '/oauth/token',
    scopes: ['miyabi:read', 'miyabi:write', 'miyabi:execute']
});

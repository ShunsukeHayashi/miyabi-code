/**
 * API Wrapper: {{API_NAME}}
 * Description: {{API_DESCRIPTION}}
 * Permission: {{REQUIRED_PERMISSION}}
 */
async function {{FUNCTION_NAME}}({{PARAMETERS}}) {
  try {
    const token = await getTenantAccessToken();

    const response = await axios({
      method: '{{HTTP_METHOD}}',
      url: `${LARK_DOMAIN}/open-apis/{{API_PATH}}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      {{REQUEST_BODY}}
    });

    if (response.data.code === 0) {
      console.log(`✅ {{API_NAME}} success`);
      return response.data.data;
    } else {
      throw new Error(`{{API_NAME}} failed: ${response.data.msg}`);
    }
  } catch (error) {
    console.error(`❌ {{API_NAME}} error:`, error.message);
    throw error;
  }
}

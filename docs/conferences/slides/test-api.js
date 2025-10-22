/**
 * BytePlus ARK API Connection Test
 * Quick test to verify API key and connectivity before generating all images
 */

const https = require('https');

const API_ENDPOINT = 'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations';
const API_KEY = process.env.BYTEPLUS_API_KEY || 'YOUR_API_KEY_HERE';
const MODEL = 'seedream-4-0-250828';

/**
 * Test API connection with a simple request
 */
async function testAPIConnection() {
    console.log('🧪 Testing BytePlus ARK API Connection...\n');

    if (API_KEY === 'YOUR_API_KEY_HERE') {
        console.error('❌ Error: BYTEPLUS_API_KEY environment variable not set');
        console.error('💡 Set it using: export BYTEPLUS_API_KEY=your_api_key');
        process.exit(1);
    }

    console.log('📋 Configuration:');
    console.log(`   API Endpoint: ${API_ENDPOINT}`);
    console.log(`   Model: ${MODEL}`);
    console.log(`   API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);
    console.log('');

    const testPrompt = 'A simple blue circle on white background, minimalist style';
    console.log(`🎨 Test Prompt: "${testPrompt}"`);
    console.log('⏳ Sending request...\n');

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: MODEL,
            prompt: testPrompt,
            n: 1,
            size: '256x256', // Small size for quick test
            response_format: 'b64_json'
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Authorization': `Bearer ${API_KEY}`
            }
        };

        const startTime = Date.now();

        const req = https.request(API_ENDPOINT, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const duration = Date.now() - startTime;

                try {
                    const response = JSON.parse(data);

                    if (response.error) {
                        console.error('❌ API Error:', response.error.message);
                        console.error('\n🔍 Details:');
                        console.error(JSON.stringify(response.error, null, 2));
                        reject(new Error(response.error.message));
                        return;
                    }

                    // Success
                    console.log('✅ API Connection Successful!\n');
                    console.log('📊 Response Details:');
                    console.log(`   Status Code: ${res.statusCode}`);
                    console.log(`   Response Time: ${duration}ms`);
                    console.log(`   Model Used: ${response.model || MODEL}`);
                    console.log(`   Images Generated: ${response.data ? response.data.length : 0}`);

                    if (response.data && response.data[0]) {
                        const imageSize = Buffer.from(response.data[0].b64_json, 'base64').length;
                        console.log(`   Image Size: ${(imageSize / 1024).toFixed(2)} KB`);
                    }

                    console.log('\n' + '='.repeat(50));
                    console.log('🎉 Test Passed!');
                    console.log('='.repeat(50));
                    console.log('\n💡 You can now run: node generate-images.js');

                    resolve(true);
                } catch (error) {
                    console.error('❌ Failed to parse response:', error.message);
                    console.error('\n📄 Raw Response:');
                    console.error(data.substring(0, 500));
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request Failed:', error.message);
            console.error('\n🔍 Possible causes:');
            console.error('   - Network connectivity issue');
            console.error('   - Firewall blocking HTTPS requests');
            console.error('   - DNS resolution failure');
            console.error('   - API endpoint unavailable');
            reject(error);
        });

        req.setTimeout(30000, () => {
            console.error('❌ Request Timeout (30s)');
            console.error('\n🔍 Possible causes:');
            console.error('   - Slow network connection');
            console.error('   - API server overloaded');
            console.error('   - Request blocked by firewall');
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(postData);
        req.end();
    });
}

// Run the test
if (require.main === module) {
    testAPIConnection().catch(error => {
        console.error('\n' + '='.repeat(50));
        console.error('❌ Test Failed');
        console.error('='.repeat(50));
        process.exit(1);
    });
}

module.exports = { testAPIConnection };

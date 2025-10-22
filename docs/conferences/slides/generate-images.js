/**
 * T2I Image Generation Script for Miyabi Presentation
 * Uses BytePlus ARK API with seedream-4-0-250828 model
 */

// Load .env configuration
const { loadEnv } = require('./load-env');
loadEnv();

const https = require('https');
const fs = require('fs');
const path = require('path');

// API Configuration
const API_ENDPOINT = process.env.API_ENDPOINT || 'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations';
const API_KEY = process.env.BYTEPLUS_API_KEY || 'YOUR_API_KEY_HERE';
const MODEL = process.env.T2I_MODEL || 'seedream-4-0-250828';

// Output directory for generated images
const OUTPUT_DIR = path.join(__dirname, 'images');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * T2I Prompts for each placeholder
 * Each prompt is optimized for professional presentation slides
 */
const IMAGE_PROMPTS = [
    {
        id: 'agent-icons-bg',
        filename: 'agent-icons-background.png',
        prompt: 'Abstract background with 21 minimalist AI robot icons arranged in a grid pattern, holographic style, blue and purple gradient colors, modern tech aesthetic, transparent background, flat design, clean and professional',
        width: 1920,
        height: 1080
    },
    {
        id: 'profile-photo',
        filename: 'profile-professional.png',
        prompt: 'Professional portrait of Hayashi Shunsuke, Japanese software engineer in his 30s, wearing smart casual business attire, friendly smile, modern office background, studio lighting, high quality, photorealistic',
        width: 400,
        height: 400
    },
    {
        id: 'github-contributions',
        filename: 'github-contributions.png',
        prompt: 'GitHub contributions graph showing active development activity, green squares indicating commits, calendar heatmap style, dark theme with green accents, clean data visualization, modern UI design',
        width: 600,
        height: 200
    },
    {
        id: 'tool-comparison',
        filename: 'tool-comparison-arrow.png',
        prompt: 'Side by side comparison of GitHub Copilot and Cursor logos with a large red arrow pointing downward labeled "ここまで" (here), minimalist design, white background, professional presentation style',
        width: 800,
        height: 300
    },
    {
        id: 'pyramid-diagram',
        filename: 'ai-levels-pyramid.png',
        prompt: '3-level pyramid diagram showing AI-driven development levels, Level 1 at bottom (Copilot/Cursor), Level 2 in middle (partial automation), Level 3 at top (Miyabi - full autonomy), blue and purple gradient colors, modern infographic style, clean labels',
        width: 1200,
        height: 800
    },
    {
        id: 'github-os-architecture',
        filename: 'github-os-architecture.png',
        prompt: 'Technical architecture diagram showing GitHub as an operating system, components include Issues (database icon), Projects V2 (state management), Webhooks (event bus), Actions (execution engine), Labels (state management), connected with arrows, modern tech illustration, blue and white color scheme',
        width: 1400,
        height: 800
    },
    {
        id: 'coding-agents-flow',
        filename: 'coding-agents-flowchart.png',
        prompt: 'Horizontal flowchart showing 5 connected stages: Coordinator Agent (clipboard icon), CodeGen Agent (code icon), Review Agent (check icon), PR Agent (branch icon), Deployment Agent (rocket icon), with arrows between each stage, modern flat design, blue gradient colors, professional presentation style',
        width: 1600,
        height: 400
    },
    {
        id: 'rust-benefits-chart',
        filename: 'rust-performance-comparison.png',
        prompt: 'Before and after performance comparison bar charts showing Rust improvements: 50% faster execution time, 30% less memory usage, side by side bars in red (before) and green (after), clean data visualization, modern infographic style, white background',
        width: 1200,
        height: 600
    },
    {
        id: 'github-qr-code',
        filename: 'github-qr-code.png',
        prompt: 'QR code for GitHub repository URL github.com/ShunsukeHayashi/Miyabi, high contrast black and white, clean scannable design, centered on white background, professional quality',
        width: 400,
        height: 400
    }
];

/**
 * Generate image using BytePlus ARK API
 * @param {Object} imageConfig - Image configuration object
 * @returns {Promise<Buffer>} - Generated image buffer
 */
async function generateImage(imageConfig) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: MODEL,
            prompt: imageConfig.prompt,
            n: 1,
            size: `${imageConfig.width}x${imageConfig.height}`,
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

        const req = https.request(API_ENDPOINT, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);

                    if (response.error) {
                        reject(new Error(`API Error: ${response.error.message}`));
                        return;
                    }

                    // Extract base64 image data
                    const imageData = response.data[0].b64_json;
                    const imageBuffer = Buffer.from(imageData, 'base64');

                    resolve(imageBuffer);
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Request failed: ${error.message}`));
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Save image buffer to file
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} filename - Output filename
 */
function saveImage(imageBuffer, filename) {
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, imageBuffer);
    console.log(`✅ Saved: ${filename}`);
}

/**
 * Generate all images sequentially
 */
async function generateAllImages() {
    console.log('🎨 Starting T2I Image Generation for Miyabi Presentation');
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
    console.log(`🤖 Model: ${MODEL}`);
    console.log(`📊 Total images to generate: ${IMAGE_PROMPTS.length}\n`);

    if (API_KEY === 'YOUR_API_KEY_HERE') {
        console.error('❌ Error: BYTEPLUS_API_KEY environment variable not set');
        console.error('💡 Set it using: export BYTEPLUS_API_KEY=your_api_key');
        process.exit(1);
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < IMAGE_PROMPTS.length; i++) {
        const imageConfig = IMAGE_PROMPTS[i];
        console.log(`[${i + 1}/${IMAGE_PROMPTS.length}] Generating: ${imageConfig.filename}`);
        console.log(`   Prompt: ${imageConfig.prompt.substring(0, 80)}...`);

        try {
            const imageBuffer = await generateImage(imageConfig);
            saveImage(imageBuffer, imageConfig.filename);
            successCount++;

            // Rate limiting: wait 2 seconds between requests
            if (i < IMAGE_PROMPTS.length - 1) {
                console.log('   ⏳ Waiting 2 seconds...\n');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error(`   ❌ Failed: ${error.message}\n`);
            failCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Generation Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📁 Output: ${OUTPUT_DIR}`);
    console.log('='.repeat(50));

    if (successCount > 0) {
        console.log('\n🎉 Next steps:');
        console.log('   1. Review generated images in: ' + OUTPUT_DIR);
        console.log('   2. Run: node update-html.js (to update HTML with image references)');
        console.log('   3. Open index.html in browser to preview');
    }
}

// Run the script
if (require.main === module) {
    generateAllImages().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { generateImage, IMAGE_PROMPTS, OUTPUT_DIR };

/**
 * BytePlus ARK API - Image-to-Image Editor
 * Edit uploaded profile photo for presentation
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// API Configuration
const API_ENDPOINT = 'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations';
const API_KEY = process.env.BYTEPLUS_API_KEY || 'YOUR_API_KEY_HERE';
const MODEL = 'seedream-4-0-250828';

// Paths
const INPUT_IMAGE = path.join(__dirname, 'source-profile.jpg');
const OUTPUT_IMAGE = path.join(__dirname, 'images', 'profile-professional.png');
const OUTPUT_DIR = path.join(__dirname, 'images');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Convert image file to base64
 * @param {string} filepath - Path to image file
 * @returns {string} - Base64 encoded image
 */
function imageToBase64(filepath) {
    const imageBuffer = fs.readFileSync(filepath);
    return imageBuffer.toString('base64');
}

/**
 * Edit profile image using BytePlus ARK API
 * @param {string} imagePath - Path to source image
 * @param {string} prompt - Editing prompt
 * @returns {Promise<Buffer>} - Edited image buffer
 */
async function editProfileImage(imagePath, prompt) {
    return new Promise((resolve, reject) => {
        // Read and encode source image
        const imageBase64 = imageToBase64(imagePath);
        const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;

        const postData = JSON.stringify({
            model: MODEL,
            prompt: prompt,
            image: imageDataUrl,
            sequential_image_generation: 'disabled',
            response_format: 'b64_json',
            size: '1024x1024', // Square format for profile photo
            stream: false,
            watermark: false
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Authorization': `Bearer ${API_KEY}`
            }
        };

        console.log('🎨 Editing profile image...');
        console.log(`📄 Source: ${imagePath}`);
        console.log(`✍️  Prompt: ${prompt.substring(0, 80)}...`);
        console.log('⏳ Processing...\n');

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

        req.setTimeout(60000, () => {
            req.destroy();
            reject(new Error('Request timeout (60s)'));
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Main execution
 */
async function main() {
    console.log('========================================');
    console.log('  Profile Image Editor for Miyabi      ');
    console.log('========================================\n');

    // Check API key
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        console.error('❌ Error: BYTEPLUS_API_KEY environment variable not set');
        console.error('💡 Set it using: export BYTEPLUS_API_KEY=your_api_key');
        process.exit(1);
    }

    // Check if source image exists
    if (!fs.existsSync(INPUT_IMAGE)) {
        console.error(`❌ Error: Source image not found: ${INPUT_IMAGE}`);
        console.error('💡 Please save the uploaded image as: source-profile.jpg');
        process.exit(1);
    }

    // Image editing prompt optimized for presentation
    const prompt = `Professional portrait photo of Hayashi Shunsuke for business presentation slide,
    enhance lighting and contrast, clean professional background with gradient (purple to pink),
    studio quality, sharp focus on face, business casual attire, friendly approachable expression,
    high resolution, professional photography style, suitable for conference presentation slide`;

    try {
        // Edit the image
        const editedImageBuffer = await editProfileImage(INPUT_IMAGE, prompt);

        // Save edited image
        fs.writeFileSync(OUTPUT_IMAGE, editedImageBuffer);

        console.log('✅ Profile image edited successfully!');
        console.log(`📁 Saved to: ${OUTPUT_IMAGE}`);
        console.log(`📊 File size: ${(editedImageBuffer.length / 1024).toFixed(2)} KB`);
        console.log('\n========================================');
        console.log('🎉 Image ready for presentation!');
        console.log('========================================\n');
        console.log('Next steps:');
        console.log('  1. Review the edited image');
        console.log('  2. Run: node update-html.js');
        console.log('  3. Open index.html to see updated presentation');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { editProfileImage, imageToBase64 };

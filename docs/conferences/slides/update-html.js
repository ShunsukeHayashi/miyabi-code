/**
 * Update HTML with Generated T2I Images
 * Replaces placeholder divs with actual <img> tags
 */

const fs = require('fs');
const path = require('path');

// Paths
const HTML_FILE = path.join(__dirname, 'index.html');
const HTML_BACKUP = path.join(__dirname, 'index.html.backup');
const IMAGES_DIR = path.join(__dirname, 'images');

/**
 * Image replacements configuration
 * Maps placeholder class/id to image filename
 */
const IMAGE_REPLACEMENTS = [
    {
        // Slide 1: Agent icons background
        searchPattern: /<!-- T2I Placeholder: 21 agent icons in background -->[\s\S]*?<div class="agent-icons-bg">[\s\S]*?<\/div>[\s\S]*?<\/div>/,
        replacement: `<!-- T2I Placeholder: 21 agent icons in background -->
                    <div class="agent-icons-bg">
                        <img src="images/agent-icons-background.png" alt="21 AI Agent Icons" class="background-image" />
                    </div>`
    },
    {
        // Slide 2: Profile photo
        searchPattern: /<!-- T2I Placeholder: Professional photo -->[\s\S]*?<div class="profile-photo">[\s\S]*?<\/div>/,
        replacement: `<!-- T2I Placeholder: Professional photo -->
                        <div class="profile-photo">
                            <img src="images/profile-professional.png" alt="ハヤシ シュンスケ - Profile Photo" />
                        </div>`
    },
    {
        // Slide 2: GitHub contributions
        searchPattern: /<!-- T2I Placeholder: GitHub contributions -->[\s\S]*?<div class="github-contributions">[\s\S]*?<\/div>/,
        replacement: `<!-- T2I Placeholder: GitHub contributions -->
                        <div class="github-contributions">
                            <img src="images/github-contributions.png" alt="GitHub Contributions Graph" />
                        </div>`
    },
    {
        // Slide 4: Tool comparison
        searchPattern: /<!-- T2I Placeholder: Copilot\/Cursor logos with "ここまで" arrow -->[\s\S]*?<div class="tool-comparison">[\s\S]*?<\/div>/,
        replacement: `<!-- T2I Placeholder: Copilot/Cursor logos with "ここまで" arrow -->
                <div class="tool-comparison">
                    <img src="images/tool-comparison-arrow.png" alt="Existing Tools Limit" />
                    <p class="comparison-text">既存ツールはここまで ↓</p>
                </div>`
    },
    {
        // Slide 6: Pyramid diagram
        searchPattern: /<!-- T2I Placeholder: 3-level pyramid diagram -->[\s\S]*?<div class="pyramid">[\s\S]*?<\/div>[\s\S]*?<\/div>/,
        replacement: `<!-- T2I Placeholder: 3-level pyramid diagram -->
                    <div class="pyramid">
                        <img src="images/ai-levels-pyramid.png" alt="AI-Driven Development 3 Levels Pyramid" class="pyramid-image" />
                        <div class="pyramid-overlay">
                            <div class="pyramid-level level-3" data-aos="fade-up" data-aos-delay="0">
                                <div class="level-content">
                                    <h3>Level 3</h3>
                                    <p>プロセス完全自律化</p>
                                    <span class="level-badge miyabi">Miyabi</span>
                                </div>
                            </div>
                            <div class="pyramid-level level-2" data-aos="fade-up" data-aos-delay="300">
                                <div class="level-content">
                                    <h3>Level 2</h3>
                                    <p>タスク自動実行</p>
                                    <span class="level-badge">一部自動化ツール</span>
                                </div>
                            </div>
                            <div class="pyramid-level level-1" data-aos="fade-up" data-aos-delay="600">
                                <div class="level-content">
                                    <h3>Level 1</h3>
                                    <p>コーディングアシスト</p>
                                    <span class="level-badge">Copilot, Cursor</span>
                                </div>
                            </div>
                        </div>
                    </div>`
    },
    {
        // Slide 10: GitHub OS architecture
        searchPattern: /<!-- T2I Placeholder: GitHub OS architecture diagram -->[\s\S]*?<div class="architecture-diagram">[\s\S]*?<\/div>/,
        replacement: `<!-- T2I Placeholder: GitHub OS architecture diagram -->
                    <div class="architecture-diagram">
                        <img src="images/github-os-architecture.png" alt="GitHub as OS Architecture" class="architecture-image" />
                        <div class="architecture-overlay">
                            <div class="os-component" data-aos="fade-in" data-aos-delay="0">
                                <i class="fas fa-database"></i>
                                <h4>Issues</h4>
                                <p>データ永続化層</p>
                            </div>
                            <div class="os-component" data-aos="fade-in" data-aos-delay="200">
                                <i class="fas fa-project-diagram"></i>
                                <h4>Projects V2</h4>
                                <p>ステートマネジメント</p>
                            </div>
                            <div class="os-component" data-aos="fade-in" data-aos-delay="400">
                                <i class="fas fa-broadcast-tower"></i>
                                <h4>Webhooks</h4>
                                <p>イベントバス</p>
                            </div>
                            <div class="os-component" data-aos="fade-in" data-aos-delay="600">
                                <i class="fas fa-play"></i>
                                <h4>Actions</h4>
                                <p>実行エンジン</p>
                            </div>
                            <div class="os-component" data-aos="fade-in" data-aos-delay="800">
                                <i class="fas fa-tags"></i>
                                <h4>Labels</h4>
                                <p>状態管理(57ラベル)</p>
                            </div>
                        </div>
                    </div>`
    },
    {
        // Slide 12: Coding agents flow
        searchPattern: /<!-- T2I Placeholder: Flowchart of coding agents -->[\s\S]*?<div class="flow-diagram">[\s\S]*?<\/div>/,
        replacement: `<!-- T2I Placeholder: Flowchart of coding agents -->
                <div class="flow-diagram">
                    <img src="images/coding-agents-flowchart.png" alt="Coding Agents Flow" class="flow-image" />
                    <div class="flow-overlay">
                        <div class="flow-step" data-aos="fade-right" data-aos-delay="0">
                            <i class="fas fa-clipboard-list"></i>
                            <h4>CoordinatorAgent</h4>
                            <p>タスク統括・DAG分解</p>
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-step" data-aos="fade-right" data-aos-delay="200">
                            <i class="fas fa-code"></i>
                            <h4>CodeGenAgent</h4>
                            <p>AI駆動コード生成<br>(Claude Sonnet 4)</p>
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-step" data-aos="fade-right" data-aos-delay="400">
                            <i class="fas fa-check-circle"></i>
                            <h4>ReviewAgent</h4>
                            <p>品質レビュー<br>(100点満点)</p>
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-step" data-aos="fade-right" data-aos-delay="600">
                            <i class="fas fa-code-branch"></i>
                            <h4>PRAgent</h4>
                            <p>Pull Request自動作成<br>(Conventional Commits)</p>
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-step" data-aos="fade-right" data-aos-delay="800">
                            <i class="fas fa-rocket"></i>
                            <h4>DeploymentAgent</h4>
                            <p>CI/CDデプロイ自動化<br>(Firebase/Vercel/AWS)</p>
                        </div>
                    </div>
                </div>`
    },
    {
        // Slide 17: Rust benefits charts
        searchPattern: /<!-- T2I Placeholder: Before\/After comparison charts -->/,
        replacement: `<!-- T2I Placeholder: Before/After comparison charts -->
                    <div class="rust-comparison-chart">
                        <img src="images/rust-performance-comparison.png" alt="Rust Performance Comparison" />
                    </div>`
    },
    {
        // Slide 40: QR code
        searchPattern: /<!-- T2I Placeholder: QR code for GitHub repo -->[\s\S]*?<div class="qr-code">[\s\S]*?<\/div>/,
        replacement: `<!-- T2I Placeholder: QR code for GitHub repo -->
                <div class="qr-code">
                    <img src="images/github-qr-code.png" alt="GitHub Repository QR Code" />
                    <p>GitHub リポジトリ</p>
                </div>`
    }
];

/**
 * Check if all required images exist
 */
function checkImagesExist() {
    const missingImages = [];

    const requiredImages = [
        'agent-icons-background.png',
        'profile-professional.png',
        'github-contributions.png',
        'tool-comparison-arrow.png',
        'ai-levels-pyramid.png',
        'github-os-architecture.png',
        'coding-agents-flowchart.png',
        'rust-performance-comparison.png',
        'github-qr-code.png'
    ];

    for (const image of requiredImages) {
        const imagePath = path.join(IMAGES_DIR, image);
        if (!fs.existsSync(imagePath)) {
            missingImages.push(image);
        }
    }

    return missingImages;
}

/**
 * Create backup of original HTML
 */
function createBackup() {
    if (!fs.existsSync(HTML_BACKUP)) {
        fs.copyFileSync(HTML_FILE, HTML_BACKUP);
        console.log('✅ Created backup: index.html.backup');
    } else {
        console.log('ℹ️  Backup already exists: index.html.backup');
    }
}

/**
 * Update HTML with image replacements
 */
function updateHTML() {
    console.log('🔄 Updating HTML with generated images...\n');

    // Check if images exist
    const missingImages = checkImagesExist();
    if (missingImages.length > 0) {
        console.error('❌ Error: Missing generated images:');
        missingImages.forEach(img => console.error(`   - ${img}`));
        console.error('\n💡 Run: node generate-images.js first');
        process.exit(1);
    }

    // Create backup
    createBackup();

    // Read HTML file
    let html = fs.readFileSync(HTML_FILE, 'utf8');
    let replacementCount = 0;

    // Apply replacements
    for (const replacement of IMAGE_REPLACEMENTS) {
        if (html.match(replacement.searchPattern)) {
            html = html.replace(replacement.searchPattern, replacement.replacement);
            replacementCount++;
            console.log(`✅ Replaced placeholder ${replacementCount}/${IMAGE_REPLACEMENTS.length}`);
        } else {
            console.warn(`⚠️  Warning: Pattern not found for replacement ${replacementCount + 1}`);
        }
    }

    // Write updated HTML
    fs.writeFileSync(HTML_FILE, html);

    console.log('\n' + '='.repeat(50));
    console.log('📊 Update Summary:');
    console.log(`   ✅ Replacements applied: ${replacementCount}/${IMAGE_REPLACEMENTS.length}`);
    console.log(`   📄 Updated file: ${HTML_FILE}`);
    console.log(`   💾 Backup saved: ${HTML_BACKUP}`);
    console.log('='.repeat(50));

    console.log('\n🎉 Next steps:');
    console.log('   1. Open index.html in your browser');
    console.log('   2. Review the presentation with generated images');
    console.log('   3. If needed, regenerate specific images by editing generate-images.js');
    console.log('\n💡 To restore original HTML: mv index.html.backup index.html');
}

// Run the script
if (require.main === module) {
    updateHTML();
}

module.exports = { updateHTML, checkImagesExist };

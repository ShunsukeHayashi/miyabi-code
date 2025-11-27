import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Character definitions with TCG stats and abilities
const characters = [
  {
    id: 'shikiroon',
    name_ja: 'しきるん',
    name_en: 'Shikiroon',
    role: 'Orchestrator',
    type: 'Master Agent',
    cost: 8,
    atk: 3000,
    def: 3500,
    hp: 4000,
    rarity: 'SSR',
    element: 'Light',
    ability: 'Orchestra Command: When played, activate up to 3 other Agent cards',
    cardNumber: 'MI-001',
    color: '#FFD700'
  },
  {
    id: 'tsukuroon',
    name_ja: 'つくるん',
    name_en: 'Tsukuroon',
    role: 'CodeGen Agent',
    type: 'Creator Agent',
    cost: 5,
    atk: 2500,
    def: 2000,
    hp: 3000,
    rarity: 'SR',
    element: 'Tech',
    ability: 'Code Generation: Create a Support card token each turn',
    cardNumber: 'MI-002',
    color: '#4169E1'
  },
  {
    id: 'medaman',
    name_ja: 'めだまん',
    name_en: 'Medaman',
    role: 'Review Agent',
    type: 'Guardian Agent',
    cost: 4,
    atk: 1800,
    def: 3000,
    hp: 3200,
    rarity: 'SR',
    element: 'Mind',
    ability: 'All-Seeing Eye: Reveal opponent\'s hand when deployed',
    cardNumber: 'MI-003',
    color: '#9370DB'
  },
  {
    id: 'mitsukeroon',
    name_ja: 'みつけるん',
    name_en: 'Mitsukeroon',
    role: 'Issue Agent',
    type: 'Scout Agent',
    cost: 3,
    atk: 2200,
    def: 1500,
    hp: 2500,
    rarity: 'R',
    element: 'Wind',
    ability: 'Issue Hunter: Draw 2 cards when finding a bug token',
    cardNumber: 'MI-004',
    color: '#32CD32'
  },
  {
    id: 'matomeroon',
    name_ja: 'まとめるん',
    name_en: 'Matomeroon',
    role: 'PR Agent',
    type: 'Support Agent',
    cost: 4,
    atk: 2000,
    def: 2500,
    hp: 2800,
    rarity: 'R',
    element: 'Order',
    ability: 'PR Master: Merge 2 Code tokens into a Release token',
    cardNumber: 'MI-005',
    color: '#FF8C00'
  },
  {
    id: 'hakoboon',
    name_ja: 'はこぶん',
    name_en: 'Hakoboon',
    role: 'Deployment Agent',
    type: 'Transport Agent',
    cost: 6,
    atk: 2800,
    def: 2200,
    hp: 3500,
    rarity: 'SR',
    element: 'Speed',
    ability: 'Swift Deploy: Deploy cards directly to production zone',
    cardNumber: 'MI-006',
    color: '#DC143C'
  },
  {
    id: 'tsunagun',
    name_ja: 'つなぐん',
    name_en: 'Tsunagun',
    role: 'Refresher Agent',
    type: 'Link Agent',
    cost: 3,
    atk: 1500,
    def: 2000,
    hp: 2500,
    rarity: 'R',
    element: 'Flow',
    ability: 'Refresh Link: Restore 1000 HP to all friendly Agents',
    cardNumber: 'MI-007',
    color: '#00CED1'
  },
  {
    id: 'kikakuron',
    name_ja: 'きかくろん',
    name_en: 'Kikakuron',
    role: 'AI Entrepreneur',
    type: 'Business Agent',
    cost: 7,
    atk: 3200,
    def: 2800,
    hp: 4000,
    rarity: 'SSR',
    element: 'Innovation',
    ability: 'Business Vision: Generate 2 revenue tokens per turn',
    cardNumber: 'MI-008',
    color: '#FF1493'
  },
  {
    id: 'jibunkun',
    name_ja: 'じぶんくん',
    name_en: 'Jibunkun',
    role: 'Self Analysis',
    type: 'Insight Agent',
    cost: 2,
    atk: 1200,
    def: 1800,
    hp: 2000,
    rarity: 'R',
    element: 'Mind',
    ability: 'Self Reflection: Copy target Agent\'s ability',
    cardNumber: 'MI-009',
    color: '#9932CC'
  },
  {
    id: 'shiraberu',
    name_ja: 'しらべる',
    name_en: 'Shiraberu',
    role: 'Market Research',
    type: 'Research Agent',
    cost: 3,
    atk: 1600,
    def: 2200,
    hp: 2500,
    rarity: 'R',
    element: 'Data',
    ability: 'Market Scan: Look at top 5 cards of deck',
    cardNumber: 'MI-010',
    color: '#4682B4'
  },
  {
    id: 'perusona',
    name_ja: 'ぺるそな',
    name_en: 'Perusona',
    role: 'Persona Designer',
    type: 'Creator Agent',
    cost: 4,
    atk: 2000,
    def: 2000,
    hp: 2800,
    rarity: 'R',
    element: 'Identity',
    ability: 'Persona Craft: Transform Agent into any type',
    cardNumber: 'MI-011',
    color: '#FF69B4'
  },
  {
    id: 'konseputan',
    name_ja: 'こんせぷたん',
    name_en: 'Konseputan',
    role: 'Product Concept',
    type: 'Design Agent',
    cost: 3,
    atk: 1800,
    def: 1600,
    hp: 2400,
    rarity: 'R',
    element: 'Idea',
    ability: 'Concept Birth: Create a Product token',
    cardNumber: 'MI-012',
    color: '#DA70D6'
  },
  {
    id: 'dezainyan',
    name_ja: 'でざいにゃん',
    name_en: 'Dezainyan',
    role: 'Product Designer',
    type: 'Art Agent',
    cost: 5,
    atk: 2400,
    def: 2600,
    hp: 3200,
    rarity: 'SR',
    element: 'Beauty',
    ability: 'Design Magic: Double ATK of Product tokens',
    cardNumber: 'MI-013',
    color: '#FF1493'
  },
  {
    id: 'kakuchan',
    name_ja: 'かくちゃん',
    name_en: 'Kakuchan',
    role: 'Content Creator',
    type: 'Media Agent',
    cost: 4,
    atk: 2200,
    def: 1800,
    hp: 2600,
    rarity: 'R',
    element: 'Story',
    ability: 'Content Stream: Draw a card for each Content token',
    cardNumber: 'MI-014',
    color: '#FFB6C1'
  },
  {
    id: 'notesan',
    name_ja: 'のーとさん',
    name_en: 'Notesan',
    role: 'Note Blogger',
    type: 'Writer Agent',
    cost: 3,
    atk: 1600,
    def: 2000,
    hp: 2400,
    rarity: 'R',
    element: 'Words',
    ability: 'Blog Power: Create Article token each turn',
    cardNumber: 'MI-015',
    color: '#20B2AA'
  },
  {
    id: 'janelkun',
    name_ja: 'じゃねるくん',
    name_en: 'Janelkun',
    role: 'Funnel Designer',
    type: 'Flow Agent',
    cost: 5,
    atk: 2300,
    def: 2100,
    hp: 3000,
    rarity: 'SR',
    element: 'Conversion',
    ability: 'Funnel Master: Convert 3 tokens into Victory points',
    cardNumber: 'MI-016',
    color: '#FF8C00'
  },
  {
    id: 'snssun',
    name_ja: 'すんすさん',
    name_en: 'SNSsun',
    role: 'SNS Strategist',
    type: 'Social Agent',
    cost: 4,
    atk: 2000,
    def: 2200,
    hp: 2800,
    rarity: 'R',
    element: 'Network',
    ability: 'Viral Spread: Copy ability to all friendly Agents',
    cardNumber: 'MI-017',
    color: '#1DA1F2'
  },
  {
    id: 'makettosama',
    name_ja: 'まけっとさま',
    name_en: 'Makettosama',
    role: 'Marketing Master',
    type: 'Master Agent',
    cost: 7,
    atk: 3500,
    def: 2500,
    hp: 4000,
    rarity: 'SSR',
    element: 'Strategy',
    ability: 'Market Domination: All Business Agents gain +1000 ATK',
    cardNumber: 'MI-018',
    color: '#FFD700'
  },
  {
    id: 'saerusu',
    name_ja: 'せーるすせんせい',
    name_en: 'Saerusu Sensei',
    role: 'Sales Teacher',
    type: 'Mentor Agent',
    cost: 6,
    atk: 2800,
    def: 2400,
    hp: 3500,
    rarity: 'SR',
    element: 'Persuasion',
    ability: 'Sales Lesson: Convert opponent\'s token to your side',
    cardNumber: 'MI-019',
    color: '#228B22'
  },
  {
    id: 'cusrelo',
    name_ja: 'かすれろちゃん',
    name_en: 'Cusrelo-chan',
    role: 'CRM Manager',
    type: 'Support Agent',
    cost: 4,
    atk: 1800,
    def: 2600,
    hp: 3000,
    rarity: 'R',
    element: 'Relations',
    ability: 'Customer Care: Heal 500 HP per Customer token',
    cardNumber: 'MI-020',
    color: '#FFA07A'
  },
  {
    id: 'bunsekyking',
    name_ja: 'ぶんせききんぐ',
    name_en: 'Bunseki King',
    role: 'Analysis King',
    type: 'Royal Agent',
    cost: 6,
    atk: 2600,
    def: 3000,
    hp: 3800,
    rarity: 'SR',
    element: 'Logic',
    ability: 'Royal Analysis: Reveal all hidden information',
    cardNumber: 'MI-021',
    color: '#4169E1'
  },
  {
    id: 'yuchubeler',
    name_ja: 'ゆーちゅーべらー',
    name_en: 'Yuchubeler',
    role: 'YouTuber',
    type: 'Star Agent',
    cost: 5,
    atk: 2500,
    def: 2000,
    hp: 3000,
    rarity: 'SR',
    element: 'Fame',
    ability: 'Channel Power: Gain +500 ATK per View token',
    cardNumber: 'MI-022',
    color: '#FF0000'
  },
  {
    id: 'imargesan',
    name_ja: 'いまーじゅさん',
    name_en: 'Imargesan',
    role: 'Image Creator',
    type: 'Visual Agent',
    cost: 4,
    atk: 2200,
    def: 2000,
    hp: 2800,
    rarity: 'R',
    element: 'Art',
    ability: 'Image Magic: Create illusion copy of any Agent',
    cardNumber: 'MI-023',
    color: '#FF69B4'
  },
  {
    id: 'gasladen',
    name_ja: 'すらいどん',
    name_en: 'Gasladen',
    role: 'Slide Presenter',
    type: 'Presenter Agent',
    cost: 5,
    atk: 2400,
    def: 2200,
    hp: 3200,
    rarity: 'SR',
    element: 'Presentation',
    ability: 'Perfect Pitch: Skip opponent\'s next turn',
    cardNumber: 'MI-024',
    color: '#FF4500'
  }
];

// Function to generate prompt for each character
function generatePrompt(character: any): string {
  return `Create a premium holographic TCG trading card featuring:

Character: ${character.name_en} (${character.name_ja})
Role: ${character.role}

Card Design Requirements:
- Art Style: Cute anime/chibi character in dynamic pose
- Card Frame: Premium holographic foil effect with ${character.element} theme
- Background: Sparkly, iridescent background with geometric patterns
- Border: Metallic ${character.color} border with prismatic shine

Character Design:
- Make the character extremely cute and appealing
- Large expressive eyes in anime style
- Dynamic action pose related to their role
- Colorful outfit matching their personality
- Add small details that hint at their abilities

Card Layout (from top to bottom):
- Top: Card name "${character.name_en}" in bold letters with holographic effect
- Japanese name "${character.name_ja}" below in stylish font
- Energy cost symbols (${character.cost}) in top right corner
- Main art area: Character illustration (70% of card space)
- Card type banner: "${character.type}" with ${character.rarity} rarity symbol
- Stats box: ATK ${character.atk} / DEF ${character.def} / HP ${character.hp}
- Ability box: "${character.ability}"
- Bottom: Card number ${character.cardNumber} and element icon (${character.element})

Visual Effects:
- Rainbow holographic foil pattern overlay
- Sparkles and light rays emanating from character
- Prismatic borders that shift colors
- Glowing energy aura around character
- Premium card texture with depth

Style: High-quality TCG card like Pokemon, Magic the Gathering, or Yu-Gi-Oh
Resolution: High resolution suitable for printing
Aspect ratio: Standard TCG card (2.5:3.5)`;
}

// Function to call MCP tool for image generation
async function generateImage(character: any): Promise<string> {
  const prompt = generatePrompt(character);
  
  console.log(`Generating TCG card for ${character.name_en}...`);
  
  const command = `python3 ~/mcp-call.py gemini3-general tools/call '{"name": "generate_image", "arguments": {"prompt": ${JSON.stringify(prompt)}, "width": 744, "height": 1039, "style": "anime"}}'`;
  
  try {
    const result = execSync(command, { encoding: 'utf-8' });
    const response = JSON.parse(result);
    
    // Extract image path from response
    if (response.content && response.content[0] && response.content[0].text) {
      const match = response.content[0].text.match(/Image saved to: (.+)/);
      if (match) {
        return match[1];
      }
    }
    
    throw new Error('Failed to extract image path from response');
  } catch (error) {
    console.error(`Error generating image for ${character.name_en}:`, error);
    throw error;
  }
}

// Main function to generate all cards
async function generateAllCards() {
  const outputDir = '/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/miyabi-console/public/images/miyabi-tcg';
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('Starting TCG card generation for all 24 characters...\n');
  
  const results = [];
  
  for (const character of characters) {
    try {
      console.log(`\n[${characters.indexOf(character) + 1}/24] Processing ${character.name_en}...`);
      
      // Generate the image
      const imagePath = await generateImage(character);
      
      // Copy to our output directory
      const outputPath = path.join(outputDir, `${character.id}-tcg.png`);
      fs.copyFileSync(imagePath, outputPath);
      
      results.push({
        character: character.name_en,
        status: 'success',
        path: outputPath
      });
      
      console.log(`✅ Successfully generated TCG card for ${character.name_en}`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      results.push({
        character: character.name_en,
        status: 'failed',
        error: error.message
      });
      console.error(`❌ Failed to generate card for ${character.name_en}`);
    }
  }
  
  // Save results summary
  const summaryPath = path.join(outputDir, 'generation-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('\n=== Generation Summary ===');
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  console.log(`Total: ${characters.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed characters:');
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`- ${r.character}: ${r.error}`);
    });
  }
  
  console.log(`\nResults saved to: ${summaryPath}`);
}

// Run the generation
generateAllCards().catch(console.error);
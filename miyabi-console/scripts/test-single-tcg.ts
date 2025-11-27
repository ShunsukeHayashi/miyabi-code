import { execSync } from 'child_process';
import * as fs from 'fs';

// Test with Shikiroon first
const testCharacter = {
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
};

const prompt = `Create a premium holographic TCG trading card featuring:

Character: ${testCharacter.name_en} (${testCharacter.name_ja})
Role: ${testCharacter.role}

Card Design Requirements:
- Art Style: Cute anime/chibi character in dynamic pose
- Card Frame: Premium holographic foil effect with ${testCharacter.element} theme
- Background: Sparkly, iridescent background with geometric patterns
- Border: Metallic gold border with prismatic shine

Character Design:
- Make the character extremely cute and appealing
- Large expressive eyes in anime style
- Character holding a conductor's baton, orchestrating magical energy
- Elegant outfit with gold accents
- Floating musical notes around the character

Card Layout (from top to bottom):
- Top: Card name "${testCharacter.name_en}" in bold letters with holographic effect
- Japanese name "${testCharacter.name_ja}" below in stylish font
- Energy cost symbols (${testCharacter.cost}) in top right corner
- Main art area: Character illustration (70% of card space)
- Card type banner: "${testCharacter.type}" with ${testCharacter.rarity} rarity symbol
- Stats box: ATK ${testCharacter.atk} / DEF ${testCharacter.def} / HP ${testCharacter.hp}
- Ability box: "${testCharacter.ability}"
- Bottom: Card number ${testCharacter.cardNumber} and element icon (${testCharacter.element})

Visual Effects:
- Rainbow holographic foil pattern overlay
- Sparkles and light rays emanating from character
- Prismatic borders that shift colors
- Glowing energy aura around character
- Premium card texture with depth

Style: High-quality TCG card like Pokemon, Magic the Gathering, or Yu-Gi-Oh
Resolution: High resolution suitable for printing
Aspect ratio: Standard TCG card (2.5:3.5)`;

console.log('Testing TCG card generation with Shikiroon...\n');
console.log('Prompt:', prompt);

// Test using MCP
const command = `python3 ~/mcp-call.py gemini3-general tools/call '{"name": "generate_image", "arguments": {"prompt": ${JSON.stringify(prompt)}, "width": 744, "height": 1039, "style": "anime"}}'`;

try {
  console.log('\nExecuting MCP command...');
  const result = execSync(command, { encoding: 'utf-8' });
  console.log('\nRaw result:', result);
  
  const response = JSON.parse(result);
  console.log('\nParsed response:', JSON.stringify(response, null, 2));
  
} catch (error) {
  console.error('Error:', error);
}
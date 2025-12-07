import { GoogleGenAI } from "@google/genai";
import { Deck, ThemeType, SocietyDomain } from "../types";

// ==============================================================================
// Miyabi Society Slide Generator - Gemini Service
// ==============================================================================
// This service integrates with Google Gemini API to generate:
// 1. AI Agent thought processes
// 2. Hand-drawn infographic images
// 3. Structured slide decks for Society presentations
// ==============================================================================

// Helper to get AI instance safely with the latest API key
const getAIClient = () => {
  const apiKey = process.env.API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new Error("API Key not found. Please ensure GOOGLE_AI_API_KEY is set.");
  }
  return new GoogleGenAI({ apiKey });
};

// ==============================================================================
// Society Domain Configuration
// ==============================================================================
const SOCIETY_DOMAINS: Record<SocietyDomain, { color: string; icon: string; agents: number; fteReplaced: string }> = {
  finance: { color: "#3B82F6", icon: "Landmark", agents: 9, fteReplaced: "21-32" },
  hr: { color: "#EC4899", icon: "Users", agents: 9, fteReplaced: "17-28" },
  legal: { color: "#6B7280", icon: "Scale", agents: 8, fteReplaced: "14-22" },
  sales: { color: "#F97316", icon: "TrendingUp", agents: 9, fteReplaced: "22-36" },
  operations: { color: "#14B8A6", icon: "Settings", agents: 8, fteReplaced: "16-27" },
  customerSuccess: { color: "#8B5CF6", icon: "Heart", agents: 8, fteReplaced: "17-31" },
  rnd: { color: "#06B6D4", icon: "Lightbulb", agents: 12, fteReplaced: "33-54" },
  marketing: { color: "#F43F5E", icon: "Megaphone", agents: 10, fteReplaced: "18-31" },
  admin: { color: "#9CA3AF", icon: "Building", agents: 7, fteReplaced: "12-20" },
};

// ==============================================================================
// Hand-Drawn Infographic Style Definition (YAML-based)
// ==============================================================================
const INFOGRAPHIC_STYLE_PROMPT = `
# GLOBAL STYLE DEFINITION - Hand-Drawn Infographic Format
art_style:
  primary_aesthetic: "Graphic Recording / Hand-drawn Sketch / Whiteboard Art"
  texture_reference: "Marker pens, crayons, and colored pencils on paper texture"
  overall_vibe: "Friendly, soft, approachable, 'Junior High School Student's Notebook' feel"
  imperfection_level: "High - embrace rough lines, slight smudges, and human touch. NOT polished digital art."

color_palette:
  background: "Clean white or off-white paper texture"
  primary_colors:
    text_and_outlines: "Black or dark charcoal marker"
    emphasis_attention: "Yellow / Orange (marker/crayon texture)"
    structure_safety: "Blue / Green (marker/crayon texture)"
    critical_warning: "Red (marker/crayon texture)"
  color_usage_rule: "Use colors sparingly for accents and meaning, keeping the base simple."

basic_visual_elements:
  characters: "Simple stick figures with expressive faces, cute robots for AI agents"
  connectors: "Hand-drawn arrows with varied thickness and texture indicating flow or relationship"
  containers: "Hand-drawn boxes, circles, clouds, or speech bubbles for grouping information"
  typography: "Handwritten, slightly messy Japanese script, easy to read but authentic to the style"
`;

// ==============================================================================
// Generate Agent Thought Process
// ==============================================================================
export const generateAgentThought = async (prompt: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are an advanced AI agent in the Miyabi Society system.
When asked a question, output your 'internal monologue' or 'thought process' first,
explaining how you plan to solve the problem using your specialized tools and
collaboration with other Society agents. Keep thoughts concise but show the
multi-agent coordination pattern.`,
      }
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating thought process. Please ensure your API Key is valid.";
  }
};

// ==============================================================================
// Generate Society Slide Image (Hand-Drawn Infographic Style)
// ==============================================================================
export const generateSlideImage = async (
  title: string,
  narrative: string,
  annotation: string,
  domain?: SocietyDomain
): Promise<string | null> => {
  try {
    const ai = getAIClient();

    const domainConfig = domain ? SOCIETY_DOMAINS[domain] : null;
    const domainContext = domainConfig
      ? `Domain: ${domain.toUpperCase()} Society (${domainConfig.agents} AI Agents replacing ${domainConfig.fteReplaced} FTE)`
      : "";

    const prompt = `
${INFOGRAPHIC_STYLE_PROMPT}

# IMAGE CONTENT SPECIFICATION
concept_title: "${title}"
narrative: "${narrative}"
context_note: "${annotation}"
${domainContext}

# VISUAL REQUIREMENTS
1. Draw a Visual Metaphor representing the concept using:
   - Cute robot characters representing AI agents
   - Building/city elements for Society domains
   - Data flow lines connecting elements
   - Speech bubbles showing agent communication

2. Include Japanese text labels (handwritten style):
   - Title at top: "${title}"
   - Key metrics and numbers highlighted with yellow marker
   - Domain names in their signature colors

3. Composition:
   - Clear focal point with emphasis colors (yellow/orange highlight)
   - Radial or flow-based layout showing connections
   - Clean white paper background with subtle texture

4. Ensure the output looks like a photograph of a hand-drawn illustration on paper.

Generate the image now.
    `;

    // Gemini Image Generation - Latest API (2025)
    // Model: models/gemini-3-pro-preview
    // MUST include responseModalities: ["TEXT", "IMAGE"] for image generation
    const response = await ai.models.generateContent({
      model: 'models/gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"], // Required for image generation
        imageConfig: {
          aspectRatio: "16:9", // Options: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
          // imageSize: "2K", // Only for gemini-3-pro-preview: 1K, 2K, 4K
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
};

// ==============================================================================
// Generate Miyabi Society Deck Structure
// ==============================================================================
export const generateDeckStructure = async (userInput: string): Promise<Deck | null> => {
  try {
    const ai = getAIClient();

    const prompt = `
You are a "Miyabi Society Context Engineering Agent" designed to create visual slide decks
explaining AI agent systems that replace human workers.

User Input: "${userInput}"

# MIYABI SOCIETY CONTEXT
- 80 AI Agents organized into 9 Domain Societies
- Replaces 170-281 human FTE workers
- 70-85% cost savings ($12.5-21.4M annually)
- 24/7 autonomous operation

# DOMAIN SOCIETIES
1. Finance (9 agents) - Blue #3B82F6 - CFO-Agent, AccountingBot, TaxAnalyzer...
2. HR (9 agents) - Pink #EC4899 - CHRO-Agent, RecruiterBot, PayrollBot...
3. Legal (8 agents) - Gray #6B7280 - CLO-Agent, ContractReviewer, IPManager...
4. Sales (9 agents) - Orange #F97316 - CRO-Agent, LeadGenerator, DealCloser...
5. Operations (8 agents) - Teal #14B8A6 - COO-Agent, SupplyChainBot, QualityBot...
6. Customer Success (8 agents) - Purple #8B5CF6 - CCO-Agent, SupportBot, ChurnPredictor...
7. R&D (12 agents) - Cyan #06B6D4 - CTO-Agent, CodeGenAgent, ReviewAgent...
8. Marketing (10 agents) - Red #F43F5E - CMO-Agent, ContentCreator, SEOBot...
9. Admin (7 agents) - Gray #9CA3AF - CAO-Agent, SchedulerBot, ITHelpdesk...

# YOUR TASK
1. Analyze the input to understand the presentation goal
2. Determine the best Visual Theme:
   - 'BLUEPRINT': Technical, architectural, strict structure (for technical audience)
   - 'SKETCH': Creative, conceptual, storytelling (for business audience)
3. Create 4-8 slides with Society-focused visuals
4. Each slide should highlight relevant AI agents and their human replacement metrics

Output strictly in this JSON format (no markdown):
{
  "id": "unique-id",
  "title": "Deck Title",
  "description": "Short description",
  "theme": "BLUEPRINT" | "SKETCH",
  "slides": [
    {
      "id": "slide-1",
      "title": "Slide Title",
      "type": "guidance" | "content",
      "narrative": "English narrative for the slide.",
      "annotation": "Japanese summary/context note (MAX 2 sentences).",
      "domain": "finance" | "hr" | "legal" | "sales" | "operations" | "customerSuccess" | "rnd" | "marketing" | "admin" | null,
      "metrics": {
        "agentCount": 9,
        "fteReplaced": "21-32",
        "costSavings": "$1.4-2.3M"
      },
      "visuals": [
        { "id": "v1", "type": "icon", "iconName": "Bot", "label": "AI Agent", "x": 50, "y": 50, "color": "text-blue-500" },
        { "id": "v2", "type": "icon", "iconName": "Users", "label": "Human Team", "x": 20, "y": 50, "connectedTo": ["v1"], "animation": "flow" }
      ]
    }
  ]
}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const deckData = JSON.parse(text) as Deck;
    return deckData;
  } catch (error) {
    console.error("Deck Generation Error:", error);
    return null;
  }
};

// ==============================================================================
// Generate Society Overview Infographic
// ==============================================================================
export const generateSocietyOverview = async (): Promise<string | null> => {
  const title = "MIYABI SOCIETY - AIエージェントが働く未来の会社";
  const narrative = `
    80 AI Agents organized into 9 Domain Societies:
    - Finance, HR, Legal, Sales, Operations
    - Customer Success, R&D, Marketing, Admin
    Central Pantheon Council provides strategic governance.
    Replaces 170-281 human workers with 70-85% cost savings.
  `;
  const annotation = "AIエージェントが協力して会社を運営する未来のカタチ。24時間365日稼働、エラー率90%削減。";

  return generateSlideImage(title, narrative, annotation);
};

// ==============================================================================
// Generate Domain-Specific Infographic
// ==============================================================================
export const generateDomainInfographic = async (domain: SocietyDomain): Promise<string | null> => {
  const config = SOCIETY_DOMAINS[domain];
  const domainNames: Record<SocietyDomain, string> = {
    finance: "Finance Society - 財務・会計自動化",
    hr: "HR Society - 採用・人事管理",
    legal: "Legal Society - 法務・コンプライアンス",
    sales: "Sales Society - 営業・リード管理",
    operations: "Operations Society - サプライチェーン",
    customerSuccess: "Customer Success Society - 顧客満足度",
    rnd: "R&D Society - 研究開発・エンジニアリング",
    marketing: "Marketing Society - マーケティング・ブランド",
    admin: "Admin Society - 管理・バックオフィス",
  };

  const title = domainNames[domain];
  const narrative = `${config.agents} AI Agents replacing ${config.fteReplaced} human FTE workers in this domain.`;
  const annotation = `${config.agents}体のAIエージェントが${config.fteReplaced}人分の仕事を自動化`;

  return generateSlideImage(title, narrative, annotation, domain);
};

// ==============================================================================
// Generate High-Quality Image with Imagen 3 (Latest 2025)
// ==============================================================================
export const generateImageWithImagen3 = async (
  prompt: string,
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" = "16:9",
  numberOfImages: number = 1
): Promise<string[] | null> => {
  try {
    const ai = getAIClient();

    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: numberOfImages,
        aspectRatio: aspectRatio,
        // safetyFilterLevel: "BLOCK_MEDIUM_AND_ABOVE", // Optional
        // personGeneration: "DONT_ALLOW", // Optional
      }
    });

    const images: string[] = [];
    for (const image of response.generatedImages || []) {
      if (image.image?.imageBytes) {
        images.push(`data:image/png;base64,${image.image.imageBytes}`);
      }
    }
    return images.length > 0 ? images : null;
  } catch (error) {
    console.error("Imagen 3 Error:", error);
    return null;
  }
};

// ==============================================================================
// Generate Society TCG Card (Optimized for Latest API)
// ==============================================================================
export const generateSocietyTCGCard = async (
  domain: SocietyDomain,
  useImagen: boolean = true
): Promise<string | null> => {
  const config = SOCIETY_DOMAINS[domain];
  const domainNames: Record<SocietyDomain, { en: string; ja: string }> = {
    finance: { en: "Finance Society", ja: "財務・会計自動化" },
    hr: { en: "HR Society", ja: "採用・人事管理" },
    legal: { en: "Legal Society", ja: "法務・コンプライアンス" },
    sales: { en: "Sales Society", ja: "営業・リード管理" },
    operations: { en: "Operations Society", ja: "サプライチェーン" },
    customerSuccess: { en: "Customer Success Society", ja: "顧客満足度" },
    rnd: { en: "R&D Society", ja: "研究開発" },
    marketing: { en: "Marketing Society", ja: "マーケティング" },
    admin: { en: "Admin Society", ja: "管理・バックオフィス" },
  };

  const { en, ja } = domainNames[domain];

  const prompt = `
Hand-drawn graphic recording style infographic on white paper texture.
Title: "${en} - ${ja}"
${config.agents} cute robot characters in ${config.color} color theme.
Central coordinator robot surrounded by specialist robots.
Yellow marker highlights showing: "${config.fteReplaced} FTE replaced"
Style: marker pens, crayons, speech bubbles, hand-drawn arrows.
Japanese handwritten text labels. Friendly, approachable aesthetic.
  `.trim();

  if (useImagen) {
    const images = await generateImageWithImagen3(prompt, "16:9", 1);
    return images?.[0] || null;
  } else {
    return generateSlideImage(en, `${config.agents} AI Agents`, ja, domain);
  }
};

// ==============================================================================
// Export Types
// ==============================================================================
export type { Deck, ThemeType, SocietyDomain };

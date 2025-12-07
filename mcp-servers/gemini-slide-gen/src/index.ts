#!/usr/bin/env node
/**
 * Gemini Slide Generation MCP Server
 *
 * Generate hand-drawn infographic slides using Gemini 2.5 Flash Image (Nano Banana)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

// Configuration - Use the working model name
const MODEL = "gemini-2.5-flash-image";

// Style prefix for all slides
const STYLE_PREFIX = `Create a hand-drawn whiteboard-style technical infographic illustration.

STYLE REQUIREMENTS:
- Hand-drawn sketch aesthetic with marker pen and crayon textures
- Black marker outlines with yellow, orange, blue, green, purple color accents
- Technical diagram style but friendly and approachable
- Simple stick figure characters for people
- White paper texture background
- Hand-drawn arrows showing flow and connections
- ALL visible text labels MUST be in JAPANESE
- High resolution, detailed illustration

`;

// Slide type templates
const SLIDE_TEMPLATES: Record<string, string> = {
  title: `Title slide with:
- Large product/company name at center
- Tagline below the name
- Simple mascot or logo icon
- Decorative elements (stars, sparkles)
- Clean, memorable first impression`,

  problem: `Problem visualization slide with:
- Frustrated stick figure character
- Heavy rock or burden representing the problem
- Red X marks or warning signs
- Downward arrows or declining graph
- Dark cloud over the character`,

  solution: `Solution slide with:
- AI/Robot hero character lifting the burden
- Light bulb moment visualization
- Green checkmarks
- Upward arrows showing improvement
- Happy stick figure being helped`,

  market: `Market opportunity slide with:
- Large blue ocean with treasure island
- TAM/SAM/SOM circles
- Growth arrows
- Money/treasure icons
- Opportunity markers`,

  business_model: `Business model slide with:
- Revenue streams as flowing rivers
- Pricing tiers as stacked boxes
- Value exchange arrows
- Customer segments
- Money flow visualization`,

  roadmap: `Roadmap slide with:
- Winding road from bottom-left to top-right
- Milestone flags at key points
- Phase labels (Phase 1, 2, 3)
- Progress indicators
- Future vision at the end`,

  competitive: `Competitive advantage slide with:
- Castle with moat (competitive moat)
- Shield icons for defenses
- Unique differentiators highlighted
- Competitors shown smaller/outside moat`,

  cta: `Call-to-action slide with:
- Large megaphone icon
- Bold action phrase
- QR code placeholder
- Contact information area
- Excited stick figures`,

  architecture: `System architecture slide with:
- Server/cloud icons
- Database cylinders
- API connection arrows
- User device icons
- Data flow visualization`,

  process: `Process flow slide with:
- Numbered steps in sequence
- Connecting arrows between steps
- Icons for each step
- Start and end markers
- Timeline indication`,
};

// Initialize Gemini client
function getClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Set GOOGLE_API_KEY or GEMINI_API_KEY environment variable");
  }
  return new GoogleGenAI({ apiKey });
}

// Generate a single slide
async function generateSlide(
  prompt: string,
  outputPath: string,
  slideType?: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const client = getClient();

    // Build full prompt
    let fullPrompt = STYLE_PREFIX;
    if (slideType && SLIDE_TEMPLATES[slideType]) {
      fullPrompt += SLIDE_TEMPLATES[slideType] + "\n\n";
    }
    fullPrompt += prompt;

    const response = await client.models.generateContent({
      model: MODEL,
      contents: fullPrompt,
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    // Extract image from response
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          // Ensure output directory exists
          const dir = path.dirname(outputPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          // Save image
          const imageData = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(outputPath, imageData);

          return {
            success: true,
            path: outputPath,
          };
        }
      }
    }

    return { success: false, error: "No image in response" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Define tools
const tools: Tool[] = [
  {
    name: "generate_slide",
    description: `Generate a single hand-drawn infographic slide using Gemini 2.5 Flash Image (Nano Banana).

Supported slide types: ${Object.keys(SLIDE_TEMPLATES).join(", ")}

Style: Hand-drawn whiteboard aesthetic with marker pen textures, Japanese labels.`,
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Detailed description of the slide content. Include visual elements, text labels, and mood.",
        },
        output_path: {
          type: "string",
          description: "Full path where the PNG image will be saved.",
        },
        slide_type: {
          type: "string",
          enum: Object.keys(SLIDE_TEMPLATES),
          description: "Optional slide type template to apply.",
        },
        title: {
          type: "string",
          description: "Title of the slide (for logging/reference).",
        },
      },
      required: ["prompt", "output_path"],
    },
  },
  {
    name: "generate_slide_sequence",
    description: `Generate multiple slides in sequence from a YAML-like configuration.

Each slide should have: id, title, and prompt.
Slides are generated sequentially and saved to the output directory.`,
    inputSchema: {
      type: "object",
      properties: {
        slides: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique slide identifier (used in filename)" },
              title: { type: "string", description: "Slide title" },
              prompt: { type: "string", description: "Detailed slide description" },
              slide_type: { type: "string", description: "Optional slide type template" },
            },
            required: ["id", "title", "prompt"],
          },
          description: "Array of slide configurations",
        },
        output_dir: {
          type: "string",
          description: "Directory where slides will be saved",
        },
        prefix: {
          type: "string",
          description: "Filename prefix for all slides (default: 'slide')",
        },
      },
      required: ["slides", "output_dir"],
    },
  },
  {
    name: "list_slide_types",
    description: "List all available slide type templates with descriptions.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// Create server
const server = new Server(
  {
    name: "gemini-slide-gen",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "generate_slide": {
      const { prompt, output_path, slide_type, title } = args as {
        prompt: string;
        output_path: string;
        slide_type?: string;
        title?: string;
      };

      const result = await generateSlide(prompt, output_path, slide_type);

      if (result.success) {
        return {
          content: [
            {
              type: "text",
              text: `✅ Slide generated successfully${title ? `: ${title}` : ""}\nPath: ${result.path}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to generate slide: ${result.error}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "generate_slide_sequence": {
      const { slides, output_dir, prefix = "slide" } = args as {
        slides: Array<{
          id: string;
          title: string;
          prompt: string;
          slide_type?: string;
        }>;
        output_dir: string;
        prefix?: string;
      };

      // Ensure output directory exists
      if (!fs.existsSync(output_dir)) {
        fs.mkdirSync(output_dir, { recursive: true });
      }

      const results: string[] = [];
      let successCount = 0;

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const outputPath = path.join(output_dir, `${prefix}_${slide.id}.png`);

        results.push(`\n[${i + 1}/${slides.length}] ${slide.title}`);

        const result = await generateSlide(slide.prompt, outputPath, slide.slide_type);

        if (result.success) {
          results.push(`  ✅ Saved: ${path.basename(outputPath)}`);
          successCount++;
        } else {
          results.push(`  ❌ Error: ${result.error}`);
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `Slide Generation Complete\n${"=".repeat(40)}${results.join("\n")}\n\nResults: ${successCount}/${slides.length} slides generated\nOutput: ${output_dir}`,
          },
        ],
      };
    }

    case "list_slide_types": {
      const typeList = Object.entries(SLIDE_TEMPLATES)
        .map(([type, desc]) => `• ${type}: ${desc.split("\n")[0]}`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Available Slide Types:\n${typeList}`,
          },
        ],
      };
    }

    default:
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gemini Slide Gen MCP Server running on stdio");
}

main().catch(console.error);

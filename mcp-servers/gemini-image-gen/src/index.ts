#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Gemini Image Generation MCP Server
 *
 * Provides image generation capabilities using:
 * - Gemini 2.5 Flash Image (Nano Banana) - Fast image generation
 * - Gemini 3 Pro Preview (Nano Banana Pro) - High-quality image generation
 * - Imagen 3 - Highest quality photorealistic images
 */
class GeminiImageGenServer {
  private server: Server;
  private ai: GoogleGenAI;
  private outputDir: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.ai = new GoogleGenAI({ apiKey });
    this.outputDir = process.env.IMAGE_OUTPUT_DIR || '/tmp/gemini-images';

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    this.server = new Server(
      {
        name: 'gemini-image-gen',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_image':
            return await this.handleGenerateImage(args);

          case 'generate_image_with_imagen':
            return await this.handleGenerateImageImagen(args);

          case 'edit_image':
            return await this.handleEditImage(args);

          case 'generate_infographic':
            return await this.handleGenerateInfographic(args);

          case 'list_generated_images':
            return await this.handleListImages();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${error}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'generate_image',
        description:
          'Generate an image using Gemini 2.5 Flash Image (Nano Banana) or Gemini 3 Pro Preview. Fast, supports text rendering and iterative refinement.',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Detailed description of the image to generate',
            },
            model: {
              type: 'string',
              enum: ['gemini-2.5-flash-image', 'gemini-3-pro-preview'],
              description: 'Model to use (default: gemini-2.5-flash-image)',
            },
            outputFormat: {
              type: 'string',
              enum: ['png', 'jpeg'],
              description: 'Output image format (default: png)',
            },
            filename: {
              type: 'string',
              description: 'Custom filename for the generated image',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'generate_image_with_imagen',
        description:
          'Generate a high-quality photorealistic image using Imagen 3. Best for photorealistic images, portraits, and detailed art.',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Detailed description of the image to generate',
            },
            numberOfImages: {
              type: 'number',
              description: 'Number of images to generate (1-4, default: 1)',
            },
            aspectRatio: {
              type: 'string',
              enum: ['1:1', '16:9', '9:16', '4:3', '3:4'],
              description: 'Aspect ratio of the image (default: 1:1)',
            },
            negativePrompt: {
              type: 'string',
              description: 'What to avoid in the image',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'edit_image',
        description:
          'Edit an existing image using text prompts. Add, remove, or modify elements.',
        inputSchema: {
          type: 'object',
          properties: {
            imagePath: {
              type: 'string',
              description: 'Path to the source image',
            },
            imageBase64: {
              type: 'string',
              description: 'Base64-encoded image data (alternative to imagePath)',
            },
            prompt: {
              type: 'string',
              description: 'Edit instructions (e.g., "Change the background to sunset")',
            },
            model: {
              type: 'string',
              enum: ['gemini-2.5-flash-image', 'gemini-3-pro-preview'],
              description: 'Model to use (default: gemini-2.5-flash-image)',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'generate_infographic',
        description:
          'Generate a hand-drawn style infographic for educational or explainer content. Optimized prompts for graphic recording style.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the infographic',
            },
            content: {
              type: 'string',
              description: 'Main content or story to visualize',
            },
            style: {
              type: 'string',
              enum: ['graphic-recording', 'sketch', 'whiteboard', 'pastel'],
              description: 'Visual style (default: graphic-recording)',
            },
            language: {
              type: 'string',
              enum: ['ja', 'en'],
              description: 'Text language in the image (default: ja)',
            },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'list_generated_images',
        description: 'List all generated images in the output directory',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  /**
   * Generate image using Gemini 2.5 Flash Image or Gemini 3 Pro
   */
  private async handleGenerateImage(args: Record<string, unknown>) {
    const prompt = args.prompt as string;
    const model = (args.model as string) || 'gemini-2.5-flash-image';
    const outputFormat = (args.outputFormat as string) || 'png';
    const filename =
      (args.filename as string) || `img_${Date.now()}.${outputFormat}`;

    const response = await this.ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    // Extract image from response
    let savedPath = '';
    let textResponse = '';

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.text) {
        textResponse = part.text;
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        const buffer = Buffer.from(imageData, 'base64');

        // Determine extension from mime type
        const ext = mimeType?.includes('png') ? 'png' : 'jpeg';
        const finalFilename = filename.includes('.')
          ? filename
          : `${filename}.${ext}`;
        savedPath = path.join(this.outputDir, finalFilename);

        fs.writeFileSync(savedPath, buffer);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              model,
              prompt,
              imagePath: savedPath,
              textResponse,
              message: savedPath
                ? `Image generated and saved to: ${savedPath}`
                : 'No image was generated',
            },
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * Generate image using Imagen 3
   */
  private async handleGenerateImageImagen(args: Record<string, unknown>) {
    const prompt = args.prompt as string;
    const numberOfImages = Math.min(4, Math.max(1, (args.numberOfImages as number) || 1));
    const aspectRatio = (args.aspectRatio as string) || '1:1';
    const negativePrompt = args.negativePrompt as string | undefined;

    const response = await this.ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt,
      config: {
        numberOfImages,
        aspectRatio,
        negativePrompt,
      },
    });

    const savedPaths: string[] = [];

    for (let i = 0; i < (response.generatedImages?.length || 0); i++) {
      const generatedImage = response.generatedImages?.[i];
      if (generatedImage?.image?.imageBytes) {
        const filename = `imagen_${Date.now()}_${i}.png`;
        const savedPath = path.join(this.outputDir, filename);
        const buffer = Buffer.from(generatedImage.image.imageBytes);
        fs.writeFileSync(savedPath, buffer);
        savedPaths.push(savedPath);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              model: 'imagen-3.0-generate-002',
              prompt,
              numberOfImages: savedPaths.length,
              aspectRatio,
              imagePaths: savedPaths,
              message: `Generated ${savedPaths.length} image(s) using Imagen 3`,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * Edit an existing image
   */
  private async handleEditImage(args: Record<string, unknown>) {
    const prompt = args.prompt as string;
    const model = (args.model as string) || 'gemini-2.5-flash-image';
    const imagePath = args.imagePath as string | undefined;
    const imageBase64 = args.imageBase64 as string | undefined;

    // Load image data
    let imageData: string;
    let mimeType = 'image/png';

    if (imageBase64) {
      imageData = imageBase64;
    } else if (imagePath) {
      const buffer = fs.readFileSync(imagePath);
      imageData = buffer.toString('base64');
      if (imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg')) {
        mimeType = 'image/jpeg';
      }
    } else {
      throw new Error('Either imagePath or imageBase64 must be provided');
    }

    const response = await this.ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: imageData,
                mimeType,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    // Extract edited image from response
    let savedPath = '';
    let textResponse = '';

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.text) {
        textResponse = part.text;
      } else if (part.inlineData) {
        const data = part.inlineData.data;
        const buffer = Buffer.from(data, 'base64');
        const filename = `edited_${Date.now()}.png`;
        savedPath = path.join(this.outputDir, filename);
        fs.writeFileSync(savedPath, buffer);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              model,
              prompt,
              originalImage: imagePath || 'base64 input',
              editedImagePath: savedPath,
              textResponse,
              message: savedPath
                ? `Image edited and saved to: ${savedPath}`
                : 'No edited image was generated',
            },
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * Generate hand-drawn style infographic
   */
  private async handleGenerateInfographic(args: Record<string, unknown>) {
    const title = args.title as string;
    const content = args.content as string;
    const style = (args.style as string) || 'graphic-recording';
    const language = (args.language as string) || 'ja';

    // Build optimized prompt for infographic generation
    const styleDescriptions: Record<string, string> = {
      'graphic-recording':
        'hand-drawn graphic recording style, colorful marker illustrations with thick lines, sticky notes, speech bubbles, simple icons',
      sketch:
        'pencil sketch style, black and white with occasional color highlights, loose artistic lines',
      whiteboard:
        'clean whiteboard illustration style, simple diagrams, flowcharts, and icons with marker pen aesthetic',
      pastel:
        'soft pastel illustration style, warm colors, gentle gradients, friendly and approachable aesthetic',
    };

    const languageNote =
      language === 'ja'
        ? 'All text labels and annotations should be in Japanese (日本語).'
        : 'All text labels and annotations should be in English.';

    const infographicPrompt = `Create a ${styleDescriptions[style]} infographic.

Title: "${title}"
Content: ${content}

Requirements:
- ${languageNote}
- Use visual metaphors and simple icons to explain concepts
- Include speech bubbles, arrows, and connectors to show relationships
- Add small annotations and labels for key points
- Maintain a friendly, educational tone
- Use a clean composition with good visual hierarchy
- Include decorative elements like stars, underlines, or emphasis markers
- Style should feel like a talented student's illustrated notes`;

    // Use Gemini 2.5 Flash Image for infographics
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: infographicPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    let savedPath = '';
    let textResponse = '';

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.text) {
        textResponse = part.text;
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, 'base64');
        const filename = `infographic_${Date.now()}.png`;
        savedPath = path.join(this.outputDir, filename);
        fs.writeFileSync(savedPath, buffer);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              title,
              style,
              language,
              imagePath: savedPath,
              textResponse,
              promptUsed: infographicPrompt,
              message: savedPath
                ? `Infographic generated and saved to: ${savedPath}`
                : 'No infographic was generated',
            },
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * List all generated images
   */
  private async handleListImages() {
    const files = fs.readdirSync(this.outputDir);
    const images = files.filter((f) =>
      ['.png', '.jpg', '.jpeg', '.webp'].some((ext) => f.endsWith(ext))
    );

    const imageInfos = images.map((file) => {
      const filePath = path.join(this.outputDir, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              outputDirectory: this.outputDir,
              totalImages: images.length,
              images: imageInfos,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Gemini Image Generation MCP Server running on stdio');
  }
}

// Start server
const server = new GeminiImageGenServer();
server.run().catch(console.error);

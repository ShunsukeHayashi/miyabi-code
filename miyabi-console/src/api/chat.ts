/**
 * AI Chat API Route - Vercel AI SDK with Google Gemini
 *
 * This endpoint handles streaming chat responses using Google's Gemini model.
 */

import { google } from '@ai-sdk/google';
import { StreamingTextResponse, streamText } from 'ai';

// System prompt for Miyabi AI Assistant
const SYSTEM_PROMPT = `You are Miyabi AI Assistant, an expert in:
- UI/UX design following Jonathan Ive's minimalist philosophy
- Full-stack development (React, TypeScript, Rust, Next.js)
- Agent orchestration and autonomous systems
- Software architecture and system design
- Code review and optimization

Your responses should be:
- Clear and concise
- Technically accurate
- Visually appealing (use markdown formatting)
- Include code examples when relevant
- Suggest best practices

When generating code:
- Use TypeScript for frontend
- Use Rust for backend/systems
- Follow modern best practices
- Include comments for clarity
- Provide complete, runnable examples`;

export async function chatAPI(request: Request): Promise<Response> {
  try {
    const { messages } = await request.json();

    // Get API key from environment
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return new Response('GEMINI_API_KEY not configured', { status: 500 });
    }

    // Stream the response using Gemini 3 Pro Preview
    const result = await streamText({
      model: google('gemini-3.0-pro-preview', {
        apiKey,
      }),
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
      maxTokens: 2048,
    });

    // Return streaming response
    return new StreamingTextResponse(result.toDataStream());
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

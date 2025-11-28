/**
 * AI Chat API Route - Placeholder
 *
 * This endpoint will handle streaming chat responses.
 * Actual AI SDK integration will be added when dependencies are properly configured.
 */

export async function chatAPI(_request: Request): Promise<Response> {
  // Placeholder implementation
  return new Response(
    JSON.stringify({
      message: 'AI Chat API is not yet configured. Please set up VITE_GEMINI_API_KEY.',
    }),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

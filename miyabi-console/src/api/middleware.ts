/**
 * Vite API Middleware - Placeholder
 *
 * This middleware handles /api/* routes in dev mode.
 * In production, API routes are handled by the backend server.
 */

import type { Connect } from 'vite';

export function apiMiddleware(): Connect.NextHandleFunction {
  // Type assertion to handle the req/res types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: any, res: any, next: Connect.NextFunction) => {
    const url = req.url as string | undefined;

    if (url?.startsWith('/api/chat')) {
      // Return placeholder response for chat API
      res.statusCode = 501;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        message: 'AI Chat API is not yet configured. Please set up VITE_GEMINI_API_KEY.',
      }));
      return;
    }

    next();
  };
}

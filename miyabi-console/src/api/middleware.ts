/**
 * Vite API Middleware - Handles /api/* routes
 */

import type { Connect } from 'vite';
import { chatAPI } from './chat';

export function apiMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    if (req.url?.startsWith('/api/chat')) {
      try {
        // Convert Node request to Web Request
        const body = await new Promise<string>((resolve) => {
          let data = '';
          req.on('data', (chunk) => {
            data += chunk;
          });
          req.on('end', () => {
            resolve(data);
          });
        });

        const request = new Request(`http://localhost${req.url}`, {
          method: req.method || 'POST',
          headers: Object.entries(req.headers).reduce((acc, [key, value]) => {
            if (value) {
              acc[key] = Array.isArray(value) ? value[0] : value;
            }
            return acc;
          }, {} as Record<string, string>),
          body: body || undefined,
        });

        const response = await chatAPI(request);

        // Set response headers
        response.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });

        // Stream the response
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              res.write(chunk);
            }
          } finally {
            reader.releaseLock();
          }
        }

        res.end();
      } catch (error) {
        console.error('API middleware error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
      return;
    }

    next();
  };
}

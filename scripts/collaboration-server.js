/**
 * Y.js Collaboration WebSocket Server
 * Provides real-time document synchronization for collaborative editing
 */

const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');

const PORT = process.env.YJS_PORT || 1234;
const HOST = process.env.YJS_HOST || 'localhost';

// Create HTTP server
const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Y.js Collaboration Server is running');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

console.log(`🚀 Y.js Collaboration Server starting...`);

wss.on('connection', (ws, request) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const roomName = url.pathname.slice(1); // Remove leading slash

  console.log(`📡 New connection to room: ${roomName || 'default'}`);

  setupWSConnection(ws, request, {
    // Optional: Add authentication logic here
    // authenticate: (auth) => {
    //   return validateAuthToken(auth);
    // },

    // Optional: Add room access control
    // authorize: (roomName, auth) => {
    //   return checkRoomAccess(roomName, auth);
    // }
  });

  ws.on('close', () => {
    console.log(`🔌 Connection closed for room: ${roomName || 'default'}`);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Y.js Collaboration Server...');

  wss.clients.forEach((ws) => {
    ws.terminate();
  });

  wss.close(() => {
    server.close(() => {
      console.log('✅ Y.js Collaboration Server stopped gracefully');
      process.exit(0);
    });
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');

  wss.clients.forEach((ws) => {
    ws.terminate();
  });

  wss.close(() => {
    server.close(() => {
      console.log('✅ Y.js Collaboration Server stopped gracefully');
      process.exit(0);
    });
  });
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`✅ Y.js Collaboration Server running on ws://${HOST}:${PORT}`);
  console.log(`📊 Health check available at http://${HOST}:${PORT}`);
  console.log(`🔗 Clients can connect to: ws://${HOST}:${PORT}/[room-name]`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
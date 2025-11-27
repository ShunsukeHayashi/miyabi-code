import React from 'react';
import { createRoot } from 'react-dom/client';

// This is a placeholder for development
// In production, widgets are loaded individually by the MCP server

const App = () => (
  <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
    <h1>Miyabi OpenAI App - Widget Development</h1>
    <p>Widgets are built and served separately. Run:</p>
    <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
      npm run build    # Build widgets
      npm run serve    # Serve widgets at localhost:4444
    </pre>
  </div>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

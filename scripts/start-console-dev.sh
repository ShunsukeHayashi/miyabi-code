#!/bin/bash
# Start Miyabi Console in development mode

cd /home/ubuntu/miyabi-private/crates/miyabi-console

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start dev server
echo "🚀 Starting Miyabi Console dev server..."
npm run dev

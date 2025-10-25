import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Try to read from public directory first
    const publicPath = path.join(process.cwd(), 'public', 'structure.json');

    if (fs.existsSync(publicPath)) {
      const data = fs.readFileSync(publicPath, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    }

    // Fallback: try to read from /tmp (where CLI generates by default)
    const tmpPath = '/tmp/miyabi-structure.json';
    if (fs.existsSync(tmpPath)) {
      const data = fs.readFileSync(tmpPath, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    }

    return NextResponse.json(
      { error: 'structure.json not found. Please run: miyabi-viz generate --output public/structure.json' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error reading structure.json:', error);
    return NextResponse.json(
      { error: 'Failed to read structure.json' },
      { status: 500 }
    );
  }
}

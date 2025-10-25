import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Cache module data for 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: { crate_id: string } }
) {
  try {
    const { crate_id } = params;

    // Validate crate_id
    if (!crate_id || !/^[a-zA-Z0-9_-]+$/.test(crate_id)) {
      return NextResponse.json(
        { error: 'Invalid crate_id. Must contain only alphanumeric characters, underscores, and hyphens.' },
        { status: 400 }
      );
    }

    // Check cache
    const cached = cache.get(crate_id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Try to read from public directory first
    const publicPath = path.join(process.cwd(), 'public', 'modules', `${crate_id}.json`);

    if (fs.existsSync(publicPath)) {
      const data = JSON.parse(fs.readFileSync(publicPath, 'utf-8'));

      // Update cache
      cache.set(crate_id, { data, timestamp: Date.now() });

      return NextResponse.json(data);
    }

    // Try to read from /tmp
    const tmpPath = `/tmp/miyabi-modules-${crate_id}.json`;
    if (fs.existsSync(tmpPath)) {
      const data = JSON.parse(fs.readFileSync(tmpPath, 'utf-8'));

      // Update cache
      cache.set(crate_id, { data, timestamp: Date.now() });

      return NextResponse.json(data);
    }

    // If not found, try to generate on-demand (if CLI is available)
    try {
      const workspaceRoot = path.resolve(process.cwd(), '../../..');
      const cratePath = path.join(workspaceRoot, 'crates', crate_id);

      // Check if crate directory exists
      if (!fs.existsSync(cratePath)) {
        return NextResponse.json(
          { error: `Crate '${crate_id}' not found in workspace` },
          { status: 404 }
        );
      }

      // Try to generate module data using CLI
      // Note: This requires the miyabi-viz CLI to be built
      const cliPath = path.join(workspaceRoot, 'target', 'release', 'miyabi-viz');

      if (fs.existsSync(cliPath)) {
        // Generate module data
        const outputPath = `/tmp/miyabi-modules-${crate_id}.json`;
        const { stdout, stderr } = await execAsync(
          `${cliPath} analyze-modules --crate ${crate_id} --output ${outputPath}`,
          { cwd: workspaceRoot }
        );

        if (fs.existsSync(outputPath)) {
          const data = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

          // Update cache
          cache.set(crate_id, { data, timestamp: Date.now() });

          return NextResponse.json(data);
        }
      }
    } catch (error) {
      console.error(`Failed to generate module data for ${crate_id}:`, error);
      // Fall through to error response
    }

    return NextResponse.json(
      {
        error: `Module data for '${crate_id}' not found.`,
        hint: 'Run: miyabi-viz analyze-modules --crate ' + crate_id + ' --output public/modules/' + crate_id + '.json'
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error in module API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

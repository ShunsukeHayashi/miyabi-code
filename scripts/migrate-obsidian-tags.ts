#!/usr/bin/env npx ts-node
/**
 * Obsidian Tag Migration Script
 * Migrates existing tags to hierarchical format matching Miyabi's 57-label system
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VAULT_PATH = path.join(__dirname, '../docs/obsidian-vault');

// Tag mapping: old tag -> new hierarchical tag
const TAG_MAP: Record<string, string> = {
  // Priority
  'P0': 'priority/P0',
  'P1': 'priority/P1',
  'P2': 'priority/P2',
  'P3': 'priority/P3',
  'P4': 'priority/P4',

  // Type
  'feature': 'type/feature',
  'bug': 'type/bug',
  'refactor': 'type/refactor',
  'docs': 'type/docs',
  'test': 'type/test',
  'chore': 'type/chore',
  'security': 'type/security',
  'performance': 'type/performance',

  // Status
  'backlog': 'status/backlog',
  'ready': 'status/ready',
  'in-progress': 'status/in-progress',
  'review': 'status/review',
  'blocked': 'status/blocked',
  'done': 'status/done',

  // Phase
  'analysis': 'phase/analysis',
  'design': 'phase/design',
  'implementation': 'phase/implementation',
  'testing': 'phase/testing',
  'deployment': 'phase/deployment',

  // Size
  'XS': 'size/XS',
  'S': 'size/S',
  'M': 'size/M',
  'L': 'size/L',
  'XL': 'size/XL',

  // Agent types (keep existing agent tags, add hierarchy)
  'agent-coding': 'agent/coding',
  'agent-business': 'agent/business',

  // Component
  'core': 'component/core',
  'cli': 'component/cli',
  'web-api': 'component/web-api',
  'agents': 'component/agents',

  // Area
  'frontend': 'area/frontend',
  'backend': 'area/backend',
  'infrastructure': 'area/infrastructure',

  // Integration
  'github': 'integration/github',
  'discord': 'integration/discord',
  'lark': 'integration/lark',
};

interface FrontMatter {
  tags?: string[];
  [key: string]: any;
}

function parseFrontMatter(content: string): { frontMatter: FrontMatter | null; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontMatter: null, body: content };
  }

  try {
    // Simple YAML parsing for tags
    const yamlContent = match[1];
    const body = match[2];

    const frontMatter: FrontMatter = {};

    // Parse tags
    const tagsMatch = yamlContent.match(/tags:\s*\n((?:\s*-\s*.*\n)*)/);
    if (tagsMatch) {
      frontMatter.tags = tagsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^\s*-\s*["']?/, '').replace(/["']?\s*$/, '').trim())
        .filter(tag => tag);
    }

    return { frontMatter, body };
  } catch (error) {
    console.error('Error parsing front matter:', error);
    return { frontMatter: null, body: content };
  }
}

function migrateTag(tag: string): string {
  // Remove leading # if present
  const cleanTag = tag.replace(/^#/, '');

  // Check if already migrated (contains /)
  if (cleanTag.includes('/')) {
    return cleanTag;
  }

  // Look up in mapping
  return TAG_MAP[cleanTag] || cleanTag;
}

function migrateTags(tags: string[]): string[] {
  return tags.map(migrateTag);
}

function updateFileContent(content: string, oldTags: string[], newTags: string[]): string {
  // Simple replacement in the tags section
  let updatedContent = content;

  oldTags.forEach((oldTag, index) => {
    const newTag = newTags[index];
    if (oldTag !== newTag) {
      // Replace in YAML format
      const oldPattern = new RegExp(`(\\s*-\\s*["']?)${oldTag}(["']?\\s*)`, 'g');
      updatedContent = updatedContent.replace(oldPattern, `$1${newTag}$2`);
    }
  });

  return updatedContent;
}

async function migrateFile(filePath: string, dryRun: boolean = false): Promise<boolean> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { frontMatter, body } = parseFrontMatter(content);

  if (!frontMatter || !frontMatter.tags || frontMatter.tags.length === 0) {
    return false;
  }

  const oldTags = frontMatter.tags;
  const newTags = migrateTags(oldTags);

  // Check if any tags changed
  const hasChanges = oldTags.some((tag, i) => tag !== newTags[i]);
  if (!hasChanges) {
    return false;
  }

  const updatedContent = updateFileContent(content, oldTags, newTags);

  if (dryRun) {
    console.log(`[DRY RUN] Would update: ${path.basename(filePath)}`);
    console.log(`  Old: ${oldTags.join(', ')}`);
    console.log(`  New: ${newTags.join(', ')}`);
  } else {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`✓ Updated: ${path.basename(filePath)}`);
  }

  return true;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('=================================');
  console.log('Obsidian Tag Migration Script');
  console.log('=================================');
  console.log(`Vault: ${VAULT_PATH}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  // Find all markdown files
  const files = await glob('**/*.md', {
    cwd: VAULT_PATH,
    ignore: ['**/node_modules/**', '**/.obsidian/**']
  });

  console.log(`Found ${files.length} markdown files`);
  console.log('');

  let updatedCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(VAULT_PATH, file);
    try {
      const updated = await migrateFile(filePath, dryRun);
      if (updated) {
        updatedCount++;
      }
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error);
      errorCount++;
    }
  }

  console.log('');
  console.log('=================================');
  console.log('Migration Complete');
  console.log('=================================');
  console.log(`Total files: ${files.length}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);

  if (dryRun) {
    console.log('');
    console.log('This was a dry run. Run without --dry-run to apply changes.');
  }
}

main().catch(console.error);

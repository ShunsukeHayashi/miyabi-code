#!/usr/bin/env ts-node

/**
 * Daily Report to Miyabi Portal Uploader
 *
 * Usage:
 *   ts-node scripts/upload-to-portal.ts docs/daily-updates/2025-10-22.md
 *   ts-node scripts/upload-to-portal.ts --date 2025-10-22
 */

import * as fs from 'fs';
import * as path from 'path';

interface UploadConfig {
  sourceFile: string;
  portalBasePath: string;
  date: string;
}

/**
 * Parse command-line arguments
 */
function parseArgs(): UploadConfig {
  const args = process.argv.slice(2);

  let sourceFile = '';
  let date = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--date' && i + 1 < args.length) {
      date = args[i + 1];
      i++;
    } else if (!sourceFile && args[i].endsWith('.md')) {
      sourceFile = args[i];
    }
  }

  // If date is provided, construct source file path
  if (date && !sourceFile) {
    sourceFile = `docs/daily-updates/${date}.md`;
  }

  // If source file is provided without date, extract date from filename
  if (sourceFile && !date) {
    const match = sourceFile.match(/(\d{4}-\d{2}-\d{2})/);
    if (match) {
      date = match[1];
    }
  }

  if (!sourceFile || !date) {
    console.error('❌ Error: Please provide either --date or a markdown file path');
    console.error('Usage: ts-node scripts/upload-to-portal.ts --date 2025-10-22');
    console.error('   or: ts-node scripts/upload-to-portal.ts docs/daily-updates/2025-10-22.md');
    process.exit(1);
  }

  const portalBasePath = '/Users/a003/dev/miyabi-portal';

  return {
    sourceFile,
    portalBasePath,
    date,
  };
}

/**
 * Read and parse the markdown file
 */
function readMarkdownFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found: ${filePath}`);
    process.exit(1);
  }

  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Add frontmatter to markdown content
 */
function addFrontmatter(content: string, date: string): string {
  // Extract title from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : `Miyabi開発進捗レポート ${date}`;

  // Calculate reading time (approx. 400 chars per minute for Japanese)
  const charCount = content.length;
  const readingTime = Math.ceil(charCount / 400);

  const frontmatter = `---
title: "${title}"
description: "Miyabi開発の日次進捗レポート - ${date}"
date: "${date}"
author: "Claude Code + かきこちゃん (NoteAgent)"
tags: ["開発日誌", "Miyabi", "AI", "Rust", "自動化"]
category: "daily-reports"
readingTime: ${readingTime}
published: true
order: ${date.replace(/-/g, '')}
---

`;

  return frontmatter + content;
}

/**
 * Convert image paths to Portal public directory format
 */
function convertImagePaths(content: string, date: string): string {
  // Convert: images/2025-10-22/xxx.png → /images/daily-reports/2025-10-22/xxx.png
  const converted = content.replace(
    /!\[([^\]]*)\]\(images\/(\d{4}-\d{2}-\d{2})\/([^)]+)\)/g,
    '![$1](/images/daily-reports/$2/$3)'
  );

  return converted;
}

/**
 * Copy images to Portal public directory
 */
function copyImages(config: UploadConfig): void {
  const sourceImagesDir = path.join(
    path.dirname(config.sourceFile),
    'images',
    config.date
  );

  const targetImagesDir = path.join(
    config.portalBasePath,
    'public',
    'images',
    'daily-reports',
    config.date
  );

  if (!fs.existsSync(sourceImagesDir)) {
    console.warn(`⚠️  Warning: Source images directory not found: ${sourceImagesDir}`);
    return;
  }

  // Create target directory
  fs.mkdirSync(targetImagesDir, { recursive: true });

  // Copy all images
  const images = fs.readdirSync(sourceImagesDir);
  let copiedCount = 0;

  images.forEach((image) => {
    const sourcePath = path.join(sourceImagesDir, image);
    const targetPath = path.join(targetImagesDir, image);

    fs.copyFileSync(sourcePath, targetPath);
    copiedCount++;
  });

  console.log(`✅ Copied ${copiedCount} images to Portal`);
}

/**
 * Write the converted markdown to Portal docs directory
 */
function writeToPortal(config: UploadConfig, convertedContent: string): void {
  const slug = config.date;
  const targetFile = path.join(
    config.portalBasePath,
    'docs',
    '08-daily-reports',
    `${slug}.md`
  );

  fs.writeFileSync(targetFile, convertedContent, 'utf-8');

  console.log(`✅ Article uploaded: ${targetFile}`);
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Uploading Daily Report to Miyabi Portal...\n');

  const config = parseArgs();

  console.log(`📄 Source: ${config.sourceFile}`);
  console.log(`📅 Date: ${config.date}`);
  console.log(`🏠 Portal: ${config.portalBasePath}\n`);

  // Read source markdown
  let content = readMarkdownFile(config.sourceFile);

  // Add frontmatter
  content = addFrontmatter(content, config.date);

  // Convert image paths
  content = convertImagePaths(content, config.date);

  // Copy images
  copyImages(config);

  // Write to Portal
  writeToPortal(config, content);

  console.log('\n✅ Upload complete!');
  console.log(`\n📝 Next steps:`);
  console.log(`   1. cd ${config.portalBasePath}`);
  console.log(`   2. npm run dev`);
  console.log(`   3. Open http://localhost:3000/docs/08-daily-reports/${config.date}`);
}

main();

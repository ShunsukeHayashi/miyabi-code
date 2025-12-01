#!/usr/bin/env tsx
/**
 * Build Tool Catalog Script
 *
 * Collects tool definitions from all MCP servers, Rust crates, and subagents,
 * then generates the tool catalog for the search engine.
 *
 * Usage:
 *   npx tsx scripts/build-catalog.ts
 *   npm run build-catalog
 */

import * as path from "path";
import { fileURLToPath } from "url";
import { buildAndSaveCatalog } from "../src/catalog/builder.js";
import { writeAllConfigs } from "../src/exporters/claude-code.js";
import { calculateTokenSavings } from "../src/exporters/anthropic.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Miyabi Tool Catalog Builder");
  console.log("=".repeat(60));
  console.log();

  const catalogPath = path.join(__dirname, "../data/tool-catalog.json");
  const configOutputDir = path.join(__dirname, "../data/configs");

  try {
    // Build catalog
    console.log("Building tool catalog...");
    console.log();

    const catalog = await buildAndSaveCatalog(catalogPath);

    // Print statistics
    console.log();
    console.log("=".repeat(60));
    console.log("Catalog Statistics");
    console.log("=".repeat(60));
    console.log();

    console.log(`Total Tools: ${catalog.tools.length}`);
    console.log();

    console.log("By Source:");
    for (const [source, ids] of Object.entries(catalog.bySource)) {
      console.log(`  ${source}: ${ids.length}`);
    }
    console.log();

    console.log("By Priority:");
    for (const [priority, ids] of Object.entries(catalog.byPriority)) {
      console.log(`  ${priority}: ${ids.length}`);
    }
    console.log();

    console.log("By Category:");
    for (const [category, ids] of Object.entries(catalog.byCategory)) {
      console.log(`  ${category}: ${ids.length}`);
    }
    console.log();

    // Calculate token savings
    const savings = calculateTokenSavings(catalog);
    console.log("=".repeat(60));
    console.log("Token Savings Analysis");
    console.log("=".repeat(60));
    console.log();
    console.log(`Without defer_loading: ${savings.withoutDeferLoading.toLocaleString()} tokens`);
    console.log(`With defer_loading: ${savings.withDeferLoading.toLocaleString()} tokens`);
    console.log(`Savings: ${savings.savings.toLocaleString()} tokens (${savings.savingsPercent}%)`);
    console.log();

    // Write configuration files
    console.log("=".repeat(60));
    console.log("Generating Configuration Files");
    console.log("=".repeat(60));
    console.log();

    await writeAllConfigs(catalog, configOutputDir);

    console.log();
    console.log("=".repeat(60));
    console.log("Build Complete!");
    console.log("=".repeat(60));
    console.log();
    console.log("Generated files:");
    console.log(`  - ${catalogPath}`);
    console.log(`  - ${configOutputDir}/tool-search-settings.json`);
    console.log(`  - ${configOutputDir}/tool-search-mcp.json`);
    console.log(`  - ${configOutputDir}/TOOL_SEARCH.md`);
    console.log();

  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

main();

#!/usr/bin/env ts-node
/**
 * BDR Hunter - Complete Workflow Executor
 * 
 * Usage:
 *   npx ts-node .miyabi/scripts/bdr-hunter.ts "マネーフォワード" --product "開発生産性ツール"
 */

import Anthropic from '@anthropic-ai/sdk';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

import { 
  BDRTools,
  SearchResult,
  IRDocument,
  LinkedInProfile,
  NewsArticle,
  JobDescription,
  EventAppearance,
  CaseStudy
} from '../tools/bdr-tools';

import type { 
  AccountPlan, 
  Company,
  Department,
  Keyperson,
  PainPoint,
  TriggerEvent,
  BDRContext
} from '../types/account-plan.types';

import { generateMermaidPreviewHTML, exportToMermaid } from '../utils/mermaid-exporter';

// ==========================================
// Configuration
// ==========================================

const PROMPTS_PATH = path.join(__dirname, '../prompts/bdr-prompts.yml');
const OUTPUT_DIR = path.join(__dirname, '../outputs');

interface Prompts {
  corporate_profiler: { system_prompt: string; user_prompt_template: string };
  talent_scout: { system_prompt: string; user_prompt_template: string };
  bdr_strategist: { system_prompt: string; user_prompt_template: string };
  coordinator: { system_prompt: string };
}

// ==========================================
// LLM Client
// ==========================================

const anthropic = new Anthropic();

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  options: { json?: boolean; maxTokens?: number } = {}
): Promise<string> {
  const { json = true, maxTokens = 4096 } = options;
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });
  
  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }
  throw new Error('Unexpected response type');
}

// ==========================================
// Step 1: Input Analysis (Coordinator)
// ==========================================

interface WorkflowInput {
  company_name: string;
  industry?: string;
  product_name: string;
  value_proposition?: string;
  focus_areas?: string[];
}

async function analyzeInput(input: WorkflowInput): Promise<{
  normalized_company: string;
  company_domain: string;
  industry: string;
  focus_areas: string[];
}> {
  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│  📋 Step 1: Input Analysis                                  │');
  console.log('└────────────────────────────────────────────────────────────┘');
  
  // Normalize company name
  let normalized = input.company_name
    .replace(/株式会社/g, '')
    .replace(/（株）/g, '')
    .trim();
  
  // Infer domain
  const domainMap: Record<string, string> = {
    'マネーフォワード': 'moneyforward.com',
    'MoneyForward': 'moneyforward.com',
    'NEC': 'nec.com',
    'freee': 'freee.co.jp',
    'ラクスル': 'raksul.com'
  };
  
  const domain = domainMap[normalized] || `${normalized.toLowerCase().replace(/\s+/g, '')}.co.jp`;
  
  // Infer industry if not provided
  const industryMap: Record<string, string> = {
    'マネーフォワード': 'SaaS / FinTech',
    'MoneyForward': 'SaaS / FinTech',
    'NEC': 'IT / 電機',
    'freee': 'SaaS / FinTech',
    'ラクスル': 'SaaS / Printing'
  };
  
  const industry = input.industry || industryMap[normalized] || 'Unknown';
  
  console.log(`  ✅ Company: ${input.company_name} → ${normalized}`);
  console.log(`  ✅ Domain: ${domain}`);
  console.log(`  ✅ Industry: ${industry}`);
  
  return {
    normalized_company: normalized,
    company_domain: domain,
    industry,
    focus_areas: input.focus_areas || ['技術本部', 'DX推進', '情報システム']
  };
}

// ==========================================
// Step 2: Corporate Profiling
// ==========================================

interface CorporateProfile {
  company_strategy: string;
  investment_areas: string[];
  trigger_events: TriggerEvent[];
  pain_points: PainPoint[];
  raw_data: {
    search_results: SearchResult[];
    ir_document?: IRDocument;
    news_articles: NewsArticle[];
  };
}

async function runCorporateProfiler(
  companyName: string,
  industry: string,
  prompts: Prompts
): Promise<CorporateProfile> {
  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│  🏢 Step 2: Corporate Profiling                             │');
  console.log('└────────────────────────────────────────────────────────────┘');
  
  // Collect data using tools
  console.log('\n  📡 Collecting data...');
  
  const searchResults = await BDRTools.webSearch(`${companyName} IR 中期経営計画`, { maxResults: 5 });
  const newsResults = await BDRTools.webSearch(`${companyName} ニュース DX AI`, { maxResults: 5 });
  const irDocument = await BDRTools.parseIRDocument(`https://corp.${companyName.toLowerCase()}.com/ir/`);
  const newsArticles = await BDRTools.scrapeNews(companyName);
  
  console.log(`  ✅ Search results: ${searchResults.length}`);
  console.log(`  ✅ News articles: ${newsArticles.length}`);
  console.log(`  ✅ IR document parsed`);
  
  // Build user prompt with collected data
  const collectedData = `
### Web検索結果
${searchResults.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}

### IR資料の内容
${irDocument.sections.map(s => `#### ${s.name}\n${s.text}`).join('\n\n')}

### ニュース記事
${newsArticles.map(n => `- [${n.date}] ${n.title}: ${n.summary}`).join('\n')}
`;
  
  const userPrompt = prompts.corporate_profiler.user_prompt_template
    .replace('{{company_name}}', companyName)
    .replace('{{industry}}', industry)
    .replace('{{focus_areas}}', '経営戦略、投資領域、トリガーイベント、課題')
    .replace('{{collected_data}}', collectedData);
  
  console.log('\n  🤖 Analyzing with LLM...');
  
  const response = await callLLM(
    prompts.corporate_profiler.system_prompt,
    userPrompt,
    { json: true, maxTokens: 2048 }
  );
  
  // Parse response
  let parsed;
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || [null, response];
    parsed = JSON.parse(jsonMatch[1] || response);
  } catch {
    console.log('  ⚠️ JSON parse failed, using mock data');
    parsed = {
      company_strategy: `${companyName}は${industry}業界でデジタル化を推進中`,
      investment_areas: ['DX', 'AI', 'クラウド'],
      trigger_events: [],
      pain_points: []
    };
  }
  
  console.log(`  ✅ Strategy extracted: ${parsed.company_strategy.substring(0, 50)}...`);
  console.log(`  ✅ Investment areas: ${parsed.investment_areas.join(', ')}`);
  console.log(`  ✅ Trigger events: ${parsed.trigger_events?.length || 0}`);
  console.log(`  ✅ Pain points: ${parsed.pain_points?.length || 0}`);
  
  return {
    ...parsed,
    raw_data: {
      search_results: searchResults,
      ir_document: irDocument,
      news_articles: newsArticles
    }
  };
}

// ==========================================
// Step 3: Talent Scouting
// ==========================================

interface TalentProfile {
  org_structure: Department[];
  keyman_profiles: Keyperson[];
  raw_data: {
    linkedin_profiles: LinkedInProfile[];
    job_descriptions: JobDescription[];
    event_appearances: EventAppearance[];
  };
}

async function runTalentScout(
  companyName: string,
  companyDomain: string,
  focusAreas: string[],
  prompts: Prompts
): Promise<TalentProfile> {
  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│  👥 Step 3: Talent Scouting                                 │');
  console.log('└────────────────────────────────────────────────────────────┘');
  
  // Collect data using tools
  console.log('\n  📡 Collecting data...');
  
  const linkedinProfiles = await BDRTools.searchLinkedIn(companyName, {
    targetDepartments: focusAreas
  });
  const jobDescriptions = await BDRTools.parseRecruitSite(companyDomain);
  const eventAppearances = await BDRTools.searchEventSpeakers(companyName);
  
  console.log(`  ✅ LinkedIn profiles: ${linkedinProfiles.length}`);
  console.log(`  ✅ Job descriptions: ${jobDescriptions.length}`);
  console.log(`  ✅ Event appearances: ${eventAppearances.length}`);
  
  // Build user prompt
  const linkedinData = linkedinProfiles.map(p => 
    `### ${p.name} - ${p.title}\n${p.summary || ''}\n経歴: ${p.experience.map(e => `${e.title}@${e.company}`).join(' → ')}`
  ).join('\n\n');
  
  const recruitData = jobDescriptions.map(j =>
    `### ${j.title} (${j.department})\nミッション: ${j.mission}\n求めるスキル: ${j.requirements.join(', ')}`
  ).join('\n\n');
  
  const eventData = eventAppearances.map(e =>
    `- ${e.person_name}: ${e.event_name} (${e.date}) - "${e.topic}"`
  ).join('\n');
  
  const userPrompt = prompts.talent_scout.user_prompt_template
    .replace('{{company_name}}', companyName)
    .replace('{{company_domain}}', companyDomain)
    .replace('{{target_departments}}', focusAreas.join(', '))
    .replace('{{linkedin_data}}', linkedinData)
    .replace('{{recruit_data}}', recruitData)
    .replace('{{event_data}}', eventData);
  
  console.log('\n  🤖 Analyzing with LLM...');
  
  const response = await callLLM(
    prompts.talent_scout.system_prompt,
    userPrompt,
    { json: true, maxTokens: 3072 }
  );
  
  // Parse response
  let parsed;
  try {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || [null, response];
    parsed = JSON.parse(jsonMatch[1] || response);
  } catch {
    console.log('  ⚠️ JSON parse failed, using collected data directly');
    parsed = {
      org_structure: jobDescriptions.map(j => ({
        name: j.department,
        mission: j.mission,
        maturity_level: 'mid' as const,
        hiring_signals: [{ position: j.title, skills_required: j.requirements, implication: j.implications[0] || '' }]
      })),
      keyman_profiles: linkedinProfiles.map(p => ({
        name: p.name,
        title: p.title,
        department: p.company,
        role_type: p.title.includes('CTO') || p.title.includes('VP') ? 'decision_maker' as const : 'influencer' as const,
        career_summary: p.summary || '',
        expert_areas: p.skills.slice(0, 5),
        sns_links: { linkedin: p.profile_url }
      }))
    };
  }
  
  console.log(`  ✅ Org structure: ${parsed.org_structure?.length || 0} departments`);
  console.log(`  ✅ Keypersons identified: ${parsed.keyman_profiles?.length || 0}`);
  
  return {
    ...parsed,
    raw_data: {
      linkedin_profiles: linkedinProfiles,
      job_descriptions: jobDescriptions,
      event_appearances: eventAppearances
    }
  };
}

// ==========================================
// Step 4: BDR Strategy Synthesis
// ==========================================

interface BDRStrategy {
  approach_strategies: Array<{
    target_person: { name: string; title: string };
    priority: 1 | 2 | 3 | 4 | 5;
    reasoning: {
      fact_a: string;
      fact_b: string;
      fact_c: string;
      insight: string;
    };
    why_you: string;
    why_now: string;
    ice_breaker: string;
    pain_to_solution: string;
    recommended_channel: string;
    sample_message: string;
  }>;
}

async function runBDRStrategist(
  productName: string,
  valueProposition: string,
  corporateProfile: CorporateProfile,
  talentProfile: TalentProfile,
  prompts: Prompts
): Promise<BDRStrategy> {
  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│  🎯 Step 4: BDR Strategy Synthesis                          │');
  console.log('└────────────────────────────────────────────────────────────┘');
  
  // Get case studies
  console.log('\n  📚 Matching case studies...');
  const caseStudies = await BDRTools.matchCaseStudies({
    industry: 'SaaS',
    scale: 'mid_market',
    pain_points: corporateProfile.pain_points.map(p => p.description)
  });
  
  console.log(`  ✅ Matched ${caseStudies.length} case studies`);
  
  // Build user prompt
  const userPrompt = prompts.bdr_strategist.user_prompt_template
    .replace('{{product_name}}', productName)
    .replace('{{value_proposition}}', valueProposition || '開発生産性の向上と可視化')
    .replace('{{corporate_profile}}', JSON.stringify(corporateProfile, null, 2))
    .replace('{{talent_data}}', JSON.stringify(talentProfile, null, 2))
    .replace('{{case_studies}}', JSON.stringify(caseStudies, null, 2));
  
  console.log('\n  🤖 Synthesizing strategy with LLM...');
  console.log('  🧠 Applying reasoning framework: Fact A + B + C → Insight');
  
  const response = await callLLM(
    prompts.bdr_strategist.system_prompt,
    userPrompt,
    { json: true, maxTokens: 4096 }
  );
  
  // Parse response
  let parsed: BDRStrategy;
  try {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || [null, response];
    parsed = JSON.parse(jsonMatch[1] || response);
  } catch {
    console.log('  ⚠️ JSON parse failed, generating default strategies');
    parsed = {
      approach_strategies: talentProfile.keyman_profiles.slice(0, 3).map((kp, idx) => ({
        target_person: { name: kp.name, title: kp.title },
        priority: (idx + 1) as 1 | 2 | 3,
        reasoning: {
          fact_a: corporateProfile.company_strategy,
          fact_b: `${kp.department}の責任者`,
          fact_c: kp.career_summary || '',
          insight: '経営課題と直接関連する立場'
        },
        why_you: `${kp.title}として${kp.department}の戦略決定に影響力を持つ`,
        why_now: corporateProfile.trigger_events[0]?.relevance || 'タイミングを見計らう必要あり',
        ice_breaker: kp.expert_areas?.[0] ? `${kp.expert_areas[0]}についての取り組みを拝見しました` : '御社のサービスについて',
        pain_to_solution: `${corporateProfile.pain_points[0]?.description || '業務効率化'} → ${productName}による解決`,
        recommended_channel: 'linkedin',
        sample_message: `${kp.name}様\n\n突然のご連絡失礼いたします。\n${productName}を提供しております。\n\n15分ほど情報交換の機会をいただけませんでしょうか。`
      }))
    };
  }
  
  console.log(`\n  ✅ Generated ${parsed.approach_strategies.length} approach strategies`);
  parsed.approach_strategies.forEach((s, i) => {
    console.log(`     ${i + 1}. ${s.target_person.name} (${s.target_person.title}) - Priority ${s.priority}`);
    console.log(`        Channel: ${s.recommended_channel}`);
  });
  
  return parsed;
}

// ==========================================
// Step 5: Output Generation
// ==========================================

async function generateOutput(
  input: WorkflowInput,
  analysisResult: Awaited<ReturnType<typeof analyzeInput>>,
  corporateProfile: CorporateProfile,
  talentProfile: TalentProfile,
  bdrStrategy: BDRStrategy
): Promise<AccountPlan> {
  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│  📄 Step 5: Output Generation                               │');
  console.log('└────────────────────────────────────────────────────────────┘');
  
  // Build AccountPlan
  const accountPlan: AccountPlan = {
    company: {
      name: input.company_name,
      industry: analysisResult.industry,
      scale: 'mid_market',
      website: `https://${analysisResult.company_domain}`,
      strategic_focus: corporateProfile.investment_areas,
      pain_points: corporateProfile.pain_points,
      trigger_events: corporateProfile.trigger_events
    },
    departments: talentProfile.org_structure,
    keypersons: talentProfile.keyman_profiles.map(kp => {
      const strategy = bdrStrategy.approach_strategies.find(
        s => s.target_person.name === kp.name
      );
      
      return {
        ...kp,
        bdr_context: strategy ? {
          priority: strategy.priority,
          why_you: strategy.why_you,
          why_now: strategy.why_now,
          ice_breaker: strategy.ice_breaker,
          pain_to_solution: strategy.pain_to_solution,
          recommended_channel: strategy.recommended_channel as any,
          sample_message: strategy.sample_message
        } : undefined
      };
    }),
    recommended_approach: {
      entry_point: bdrStrategy.approach_strategies[0]?.target_person.name 
        ? `${bdrStrategy.approach_strategies[0].target_person.name}への${bdrStrategy.approach_strategies[0].recommended_channel}アプローチ`
        : undefined,
      sequence: bdrStrategy.approach_strategies.map((s, i) => ({
        step: i + 1,
        action: s.ice_breaker,
        target: s.target_person.name,
        channel: s.recommended_channel,
        timing: i === 0 ? '即時' : `Step${i}完了後`
      })),
      key_messages: [
        ...new Set(bdrStrategy.approach_strategies.map(s => s.pain_to_solution))
      ].slice(0, 3)
    },
    metadata: {
      generated_at: new Date().toISOString(),
      workflow_version: '2.0',
      data_freshness: {
        corporate_data: new Date().toISOString().split('T')[0],
        keyman_data: new Date().toISOString().split('T')[0]
      },
      confidence_score: 0.85
    }
  };
  
  // Save outputs
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const timestamp = Date.now();
  const baseName = input.company_name.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, '-').toLowerCase();
  
  // Save JSON
  const jsonPath = path.join(OUTPUT_DIR, `${baseName}-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(accountPlan, null, 2));
  console.log(`  ✅ JSON saved: ${jsonPath}`);
  
  // Save Mermaid diagrams
  const mermaidExport = exportToMermaid(accountPlan);
  const mermaidPath = path.join(OUTPUT_DIR, `${baseName}-${timestamp}-diagrams.md`);
  fs.writeFileSync(mermaidPath, `# ${input.company_name} - Account Plan Diagrams

## Organization Tree
\`\`\`mermaid
${mermaidExport.org_tree}
\`\`\`

## Approach Sequence
\`\`\`mermaid
${mermaidExport.approach_sequence}
\`\`\`

## Relationship Map
\`\`\`mermaid
${mermaidExport.relationship_map}
\`\`\``);
  console.log(`  ✅ Mermaid saved: ${mermaidPath}`);
  
  // Save HTML preview
  const htmlPath = path.join(OUTPUT_DIR, `${baseName}-${timestamp}.html`);
  fs.writeFileSync(htmlPath, generateMermaidPreviewHTML(accountPlan));
  console.log(`  ✅ HTML preview saved: ${htmlPath}`);
  
  return accountPlan;
}

// ==========================================
// Main Workflow
// ==========================================

async function runBDRHunter(input: WorkflowInput): Promise<AccountPlan> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       🎯 Enterprise BDR Hunter - Full Workflow              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n  Target: ${input.company_name}`);
  console.log(`  Product: ${input.product_name}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  
  // Load prompts
  const prompts = yaml.load(fs.readFileSync(PROMPTS_PATH, 'utf8')) as Prompts;
  
  const startTime = Date.now();
  
  // Step 1: Input Analysis
  const analysisResult = await analyzeInput(input);
  
  // Step 2: Corporate Profiling
  const corporateProfile = await runCorporateProfiler(
    analysisResult.normalized_company,
    analysisResult.industry,
    prompts
  );
  
  // Step 3: Talent Scouting
  const talentProfile = await runTalentScout(
    analysisResult.normalized_company,
    analysisResult.company_domain,
    analysisResult.focus_areas,
    prompts
  );
  
  // Step 4: BDR Strategy
  const bdrStrategy = await runBDRStrategist(
    input.product_name,
    input.value_proposition || '',
    corporateProfile,
    talentProfile,
    prompts
  );
  
  // Step 5: Output Generation
  const accountPlan = await generateOutput(
    input,
    analysisResult,
    corporateProfile,
    talentProfile,
    bdrStrategy
  );
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       ✅ Workflow Complete                                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n  Duration: ${duration}s`);
  console.log(`  Keypersons: ${accountPlan.keypersons?.length || 0}`);
  console.log(`  Strategies: ${bdrStrategy.approach_strategies.length}`);
  console.log(`\n  📁 Outputs saved to: ${OUTPUT_DIR}`);
  
  return accountPlan;
}

// ==========================================
// CLI
// ==========================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Usage: npx ts-node bdr-hunter.ts <company_name> [options]

Options:
  --product <name>     Product name to sell
  --industry <type>    Industry vertical
  --help               Show this help

Examples:
  npx ts-node bdr-hunter.ts "マネーフォワード" --product "開発生産性ツール"
  npx ts-node bdr-hunter.ts "NEC" --product "SaaS" --industry "IT"
`);
    process.exit(0);
  }
  
  const companyName = args.find(a => !a.startsWith('--')) || args[0];
  const productIdx = args.findIndex(a => a === '--product');
  const industryIdx = args.findIndex(a => a === '--industry');
  
  const input: WorkflowInput = {
    company_name: companyName,
    product_name: productIdx >= 0 ? args[productIdx + 1] : 'SaaS製品',
    industry: industryIdx >= 0 ? args[industryIdx + 1] : undefined
  };
  
  try {
    await runBDRHunter(input);
  } catch (error) {
    console.error('\n❌ Workflow failed:', error);
    process.exit(1);
  }
}

main();

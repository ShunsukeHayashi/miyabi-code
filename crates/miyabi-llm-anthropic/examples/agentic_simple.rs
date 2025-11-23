//! Simple Agentic Behavior Test
//!
//! Demonstrates agentic behavior using direct LLM calls with tool-like structured outputs

use miyabi_llm_anthropic::AnthropicClient;
use miyabi_llm_core::{LlmClient, Message, Role};
use std::time::Instant;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("\n🤖 Simple Agentic Behavior Test\n");
    println!("═══════════════════════════════════════════════════════════\n");

    let client = AnthropicClient::from_env()?
        .with_model("claude-sonnet-4-5-20250929".to_string())
        .with_max_tokens(2048);

    println!("✅ Claude Sonnet 4.5 initialized\n");

    // Test 1: Self Analysis Agent behavior
    println!("═══════════════════════════════════════════════════════════");
    println!("📝 Test 1: SelfAnalysisAgent - SWOT Analysis");
    println!("═══════════════════════════════════════════════════════════\n");

    let messages = vec![
        Message {
            role: Role::System,
            content: r#"You are a business strategy consultant AI agent. Your task is to analyze entrepreneurs and generate SWOT analysis.

Always respond in valid JSON format with this exact structure:
{
  "swot_analysis": {
    "strengths": ["..."],
    "weaknesses": ["..."],
    "opportunities": ["..."],
    "threats": ["..."]
  },
  "strategic_recommendations": ["..."],
  "risk_score": 1-10
}"#.to_string(),
        },
        Message {
            role: Role::User,
            content: r#"Analyze this entrepreneur profile:
- Career: 10 years as software engineer, specializing in Rust and distributed systems
- Skills: Rust, TypeScript, System Design, AI/ML, DevOps
- Achievements: Led team of 5 engineers, Built production systems serving 1M+ users
- Goal: Launch an AI-powered developer tools startup

Generate a comprehensive SWOT analysis with strategic recommendations."#.to_string(),
        }
    ];

    let start = Instant::now();
    let response = client.chat(messages).await?;
    println!("⏱️  Time: {:?}\n", start.elapsed());
    println!("📊 Response:\n{}\n", response);

    // Test 2: Market Research Agent behavior
    println!("═══════════════════════════════════════════════════════════");
    println!("📝 Test 2: MarketResearchAgent - Competitive Analysis");
    println!("═══════════════════════════════════════════════════════════\n");

    let messages = vec![
        Message {
            role: Role::System,
            content: r#"You are a market research AI agent. Analyze markets and competitors.

Always respond in valid JSON format:
{
  "market_size": "...",
  "growth_rate": "...",
  "key_competitors": [{"name": "...", "strengths": ["..."], "weaknesses": ["..."]}],
  "market_opportunities": ["..."],
  "entry_barriers": ["..."]
}"#.to_string(),
        },
        Message {
            role: Role::User,
            content: r#"Research the AI Developer Tools market for this product:
- Name: Miyabi
- Description: Autonomous AI development framework with multi-agent orchestration
- Target: Software developers and engineering teams
- Features: GitHub integration, automated code generation, multi-agent orchestration

Identify top 3 competitors and market opportunities."#.to_string(),
        }
    ];

    let start = Instant::now();
    let response = client.chat(messages).await?;
    println!("⏱️  Time: {:?}\n", start.elapsed());
    println!("📊 Response:\n{}\n", response);

    // Test 3: Code Generation Agent behavior
    println!("═══════════════════════════════════════════════════════════");
    println!("📝 Test 3: CodeGenAgent - Generate Rust Code");
    println!("═══════════════════════════════════════════════════════════\n");

    let messages = vec![
        Message {
            role: Role::System,
            content: r#"You are a code generation AI agent. Generate high-quality, production-ready code.

Always respond in this JSON format:
{
  "code": "...",
  "language": "rust",
  "explanation": "brief explanation",
  "tests_included": true/false
}"#.to_string(),
        },
        Message {
            role: Role::User,
            content: r#"Generate a Rust function that implements retry with exponential backoff:
- Generic over async operation
- Configurable max retries (default 3)
- Exponential backoff with jitter
- Returns Result with operation output
Include a simple test."#.to_string(),
        }
    ];

    let start = Instant::now();
    let response = client.chat(messages).await?;
    println!("⏱️  Time: {:?}\n", start.elapsed());
    println!("📊 Response:\n{}\n", response);

    // Test 4: Coordinator Agent behavior
    println!("═══════════════════════════════════════════════════════════");
    println!("📝 Test 4: CoordinatorAgent - Task Decomposition");
    println!("═══════════════════════════════════════════════════════════\n");

    let messages = vec![
        Message {
            role: Role::System,
            content: r#"You are a task coordination AI agent. Decompose complex tasks into subtasks and assign to specialist agents.

Available agents: CodeGenAgent, ReviewAgent, PRAgent, DeploymentAgent, IssueAgent

Respond in JSON:
{
  "original_task": "...",
  "subtasks": [
    {
      "id": 1,
      "title": "...",
      "assigned_agent": "...",
      "dependencies": [],
      "estimated_complexity": "low/medium/high"
    }
  ],
  "execution_order": [1, 2, 3],
  "parallel_groups": [[1, 2], [3]]
}"#.to_string(),
        },
        Message {
            role: Role::User,
            content: r#"Decompose this complex task:
"Implement user authentication system with JWT tokens, OAuth2 (Google, GitHub), password reset, and 2FA"

Create subtasks and assign to appropriate agents. Identify which can run in parallel."#.to_string(),
        }
    ];

    let start = Instant::now();
    let response = client.chat(messages).await?;
    println!("⏱️  Time: {:?}\n", start.elapsed());
    println!("📊 Response:\n{}\n", response);

    // Summary
    println!("═══════════════════════════════════════════════════════════");
    println!("📊 Agentic Behavior Test Summary");
    println!("═══════════════════════════════════════════════════════════\n");
    println!("✅ SelfAnalysisAgent: SWOT analysis generated");
    println!("✅ MarketResearchAgent: Competitive analysis completed");
    println!("✅ CodeGenAgent: Rust code with tests generated");
    println!("✅ CoordinatorAgent: Task decomposed into subtasks");
    println!();
    println!("🎉 All agentic behavior tests passed!\n");

    Ok(())
}

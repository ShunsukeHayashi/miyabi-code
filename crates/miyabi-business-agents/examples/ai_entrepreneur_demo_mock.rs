//! AIEntrepreneurAgent Mock Demo - No API Key Required
//!
//! This example demonstrates AIEntrepreneurAgent using mock data.
//! No ANTHROPIC_API_KEY required - runs offline with sample business plan.
//!
//! # Run Example
//!
//! ```bash
//! cargo run --example ai_entrepreneur_demo_mock
//! ```

use miyabi_business_agents::types::*;
use chrono::Utc;

fn main() -> anyhow::Result<()> {
    println!("🌸 Miyabi AIEntrepreneurAgent Mock Demo (No API Key Required)\n");
    println!("{}", "=".repeat(60));

    // Prepare business input (same as real demo)
    println!("\n📋 Business Input:");
    let input = BusinessInput {
        industry: "SaaS".to_string(),
        target_market: "AI開発者向け自動化ツール".to_string(),
        budget: 100_000, // $100,000
        geography: Some("日本・北米".to_string()),
        timeframe_months: Some(12),
        context: Some(
            "GitHub統合型の完全自律開発プラットフォーム。\
             Issue作成からPR作成、デプロイまでを自動化。\
             競合: GitHub Copilot, Cursor, Replit".to_string()
        ),
    };

    println!("   Industry: {}", input.industry);
    println!("   Target Market: {}", input.target_market);
    println!("   Budget: ${}", input.budget);
    println!("   Geography: {}", input.geography.as_deref().unwrap_or("Global"));
    println!("   Timeframe: {} months", input.timeframe_months.unwrap_or(12));

    // Generate mock business plan
    println!("\n🚀 Generating Mock 8-Phase Business Plan...");
    println!("   (Using sample data - no API call)");

    let plan = create_mock_business_plan();

    println!("\n✅ Mock Business Plan Generated!\n");
    println!("{}", "=".repeat(60));

    // Display results
    println!("\n📊 **{}**", plan.title);
    println!("\n{}", "=".repeat(60));

    println!("\n## Executive Summary\n");
    println!("{}", plan.summary);

    println!("\n{}", "=".repeat(60));
    println!("\n## Recommendations ({})\n", plan.recommendations.len());
    for (i, rec) in plan.recommendations.iter().enumerate() {
        println!("{}. **{}** (Priority: {})", i + 1, rec.title, rec.priority);
        println!("   Description: {}", rec.description);
        if let Some(cost) = rec.estimated_cost {
            println!("   Estimated Cost: ${}", cost);
        }
        if let Some(roi) = rec.expected_roi {
            println!("   Expected ROI: {}x", roi);
        }
        if !rec.dependencies.is_empty() {
            println!("   Dependencies: {:?}", rec.dependencies);
        }
        println!();
    }

    println!("{}", "=".repeat(60));
    println!("\n## Key Performance Indicators ({})\n", plan.kpis.len());
    for (i, kpi) in plan.kpis.iter().enumerate() {
        println!("{}. **{}**", i + 1, kpi.name);
        println!("   Baseline: {} {}", kpi.baseline, kpi.unit);
        println!("   Target: {} {}", kpi.target, kpi.unit);
        println!("   Frequency: {}", kpi.frequency);
        println!();
    }

    println!("{}", "=".repeat(60));
    println!("\n## Timeline Milestones ({})\n", plan.timeline.milestones.len());
    for (i, milestone) in plan.timeline.milestones.iter().enumerate() {
        println!("{}. **{}**", i + 1, milestone.name);
        println!("   Target Date: {}", milestone.target_date.format("%Y-%m-%d"));
        println!("   Deliverables:");
        for deliverable in &milestone.deliverables {
            println!("     - {}", deliverable);
        }
        println!("   Success Criteria:");
        for criteria in &milestone.success_criteria {
            println!("     - {}", criteria);
        }
        println!();
    }

    println!("{}", "=".repeat(60));
    println!("\n## Risk Assessment ({})\n", plan.risks.len());
    for (i, risk) in plan.risks.iter().enumerate() {
        println!("{}. **{}**", i + 1, risk.description);
        println!("   Severity: {}/5", risk.severity);
        println!("   Probability: {:.0}%", risk.probability * 100.0);
        println!("   Mitigation:");
        for mitigation in &risk.mitigation {
            println!("     - {}", mitigation);
        }
        println!();
    }

    println!("{}", "=".repeat(60));
    println!("\n## Next Steps ({})\n", plan.next_steps.len());
    for (i, step) in plan.next_steps.iter().enumerate() {
        println!("{}. {}", i + 1, step);
    }

    // Mock validation
    println!("\n{}", "=".repeat(60));
    println!("\n🔍 Mock Validation Results:\n");
    println!("Quality Score: 95/100");
    println!("Valid: ✅ Yes");
    println!("\n💡 Suggestions:");
    println!("   - Consider expanding international markets beyond Japan/North America");
    println!("   - Add more detailed financial projections for Year 2-3");

    println!("\n{}", "=".repeat(60));
    println!("\n🎉 Mock Demo Complete!");
    println!("\nGenerated at: {}", plan.generated_at.format("%Y-%m-%d %H:%M:%S UTC"));
    println!("\n💡 To run with real Claude API, use: cargo run --example ai_entrepreneur_demo");
    println!("   (Requires: export ANTHROPIC_API_KEY=sk-ant-xxxxx)");

    Ok(())
}

/// Create a mock business plan with sample data
fn create_mock_business_plan() -> BusinessPlan {
    let now = Utc::now();

    BusinessPlan {
        title: "Miyabi AI-Powered DevOps Automation Platform - 8-Phase Business Plan".to_string(),

        summary: "Miyabiは、GitHub統合型の完全自律開発プラットフォームとして、\
                  年率20-25%成長する$50B+のDevOps市場に参入します。\
                  独自の53ラベル体系とDAG-based Task分解により、\
                  Issue作成からPR作成、デプロイまでを72%の時間削減で実現。\
                  \n\n\
                  Year 1目標: $593K ARR (Free: 10K users, Pro: 500 users, Enterprise: 3社)。\
                  競合はGitHub Copilot ($500M ARR), Cursor ($9.9B valuation)ですが、\
                  Miyabiは15コンポーネントのGitHub統合と組織設計原則により差別化。\
                  \n\n\
                  初期予算$100Kで、Product Hunt launch → GitHub Marketplace → \
                  Enterprise salesの3段階GTM戦略を実行します。".to_string(),

        recommendations: vec![
            Recommendation {
                title: "Phase 1: Market Entry - GitHub Marketplace Launch".to_string(),
                description: "GitHub Marketplace Featured listingを獲得し、100M+開発者にリーチ。\
                              Product Hunt Top 5 launch、Hacker News Show HN投稿でバイラル成長を狙う。\
                              初月目標: 10K Free users獲得。".to_string(),
                priority: 1,
                estimated_cost: Some(25_000),
                expected_roi: Some(4.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Phase 2: Product Differentiation - 53 Label System特許出願".to_string(),
                description: "組織設計原則に基づく53ラベル体系を特許出願（US/JP/EU）。\
                              競合模倣を防ぎ、ブランドロイヤルティを確立。\
                              予算: $50K（特許弁護士費用）。".to_string(),
                priority: 1,
                estimated_cost: Some(50_000),
                expected_roi: Some(10.0),
                dependencies: vec!["Phase 1".to_string()],
            },
            Recommendation {
                title: "Phase 3: Revenue Model - Hybrid Pricing (Subscription + Usage)".to_string(),
                description: "Pro: $29/月、Team: $99/月、Enterprise: $5K+/月。\
                              Usage add-ons: Claude API tokens ($10/50K tokens)、並列Agent ($5/並列)。\
                              Year 1 MRR目標: $49K → ARR $593K。".to_string(),
                priority: 1,
                estimated_cost: Some(10_000),
                expected_roi: Some(6.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Phase 4: Partnership - GitHub & Anthropic Co-marketing".to_string(),
                description: "GitHub Partnership経由で5x user acquisition、\
                              Anthropic Claude Partner Programで30% API cost削減。\
                              GitHub Universe sponsorship ($50K)、Joint case studies作成。".to_string(),
                priority: 2,
                estimated_cost: Some(75_000),
                expected_roi: Some(5.0),
                dependencies: vec!["Phase 1".to_string()],
            },
            Recommendation {
                title: "Phase 5: Team Building - 5名チーム構築".to_string(),
                description: "Backend Engineer (Rust) x1、Frontend Engineer (React) x1、\
                              DevOps Engineer x0.5、Sales/Marketing x1、PM x1。\
                              年間人件費: $600K。リモート優先、日本・北米混成チーム。".to_string(),
                priority: 1,
                estimated_cost: Some(600_000),
                expected_roi: Some(1.5),
                dependencies: vec![],
            },
            Recommendation {
                title: "Phase 6: Go-to-Market - 3段階セグメント攻略".to_string(),
                description: "Year 1: Individual developers (Product Hunt, GitHub Marketplace)、\
                              Year 2: Startups (YC/Techstars, LinkedIn outbound)、\
                              Year 3: Enterprise (PoC programs, AWS/GCP Marketplace)。\
                              CAC目標: $5 → $200 → $50K。".to_string(),
                priority: 1,
                estimated_cost: Some(120_000),
                expected_roi: Some(3.0),
                dependencies: vec!["Phase 3".to_string()],
            },
            Recommendation {
                title: "Phase 7: Risk Mitigation - Multi-Model AI Strategy".to_string(),
                description: "Claude API依存リスクを緩和。OpenAI、Gemini、Llama 3にも対応。\
                              Caching最適化で30%コスト削減。\
                              Enterprise向けSelf-hosted option（顧客自身のAPIキー使用）。".to_string(),
                priority: 2,
                estimated_cost: Some(30_000),
                expected_roi: Some(4.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Phase 8: Scaling - Series A調達 ($10M)".to_string(),
                description: "Year 2でPMF証明後、Series A $10M調達（post-money $50M valuation）。\
                              用途: Engineering 10→30名 ($4M)、Sales/Marketing ($4M)、Operations ($2M)。\
                              Year 3目標: $10M ARR達成、SOC 2認証取得。".to_string(),
                priority: 3,
                estimated_cost: Some(10_000_000),
                expected_roi: Some(5.0),
                dependencies: vec!["Phase 6".to_string()],
            },
        ],

        kpis: vec![
            KPI {
                name: "Monthly Recurring Revenue (MRR)".to_string(),
                baseline: 0.0,
                target: 49_450.0,
                unit: "USD".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
            KPI {
                name: "Annual Recurring Revenue (ARR)".to_string(),
                baseline: 0.0,
                target: 593_400.0,
                unit: "USD".to_string(),
                frequency: MeasurementFrequency::Yearly,
            },
            KPI {
                name: "Free Users".to_string(),
                baseline: 0.0,
                target: 10_000.0,
                unit: "users".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
            KPI {
                name: "Paid Conversion Rate".to_string(),
                baseline: 0.0,
                target: 10.0,
                unit: "percent".to_string(),
                frequency: MeasurementFrequency::Weekly,
            },
            KPI {
                name: "Customer Acquisition Cost (CAC)".to_string(),
                baseline: 0.0,
                target: 50.0,
                unit: "USD".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
            KPI {
                name: "Lifetime Value (LTV)".to_string(),
                baseline: 0.0,
                target: 600.0,
                unit: "USD".to_string(),
                frequency: MeasurementFrequency::Quarterly,
            },
            KPI {
                name: "LTV/CAC Ratio".to_string(),
                baseline: 0.0,
                target: 12.0,
                unit: "ratio".to_string(),
                frequency: MeasurementFrequency::Quarterly,
            },
        ],

        timeline: Timeline {
            start_date: now,
            end_date: now + chrono::Duration::days(365),
            milestones: vec![
                Milestone {
                    name: "Month 1-3: MVP Development & Beta Launch".to_string(),
                    target_date: now + chrono::Duration::days(90),
                    deliverables: vec![
                        "Multi-tenant database implementation".to_string(),
                        "GitHub App integration".to_string(),
                        "7 Coding Agents implementation".to_string(),
                        "Beta program with 100 users".to_string(),
                    ],
                    success_criteria: vec![
                        "80%+ issue automation rate".to_string(),
                        "NPS score >40".to_string(),
                        "Weekly retention >50%".to_string(),
                    ],
                },
                Milestone {
                    name: "Month 4: Product Hunt Launch".to_string(),
                    target_date: now + chrono::Duration::days(120),
                    deliverables: vec![
                        "Product Hunt Top 5 of the day".to_string(),
                        "Hacker News Show HN (Top 10)".to_string(),
                        "GitHub Marketplace listing".to_string(),
                    ],
                    success_criteria: vec![
                        "10K Free users acquired".to_string(),
                        "200 Pro users (2% conversion)".to_string(),
                        "$5,800 MRR".to_string(),
                    ],
                },
                Milestone {
                    name: "Month 6: GitHub Partnership締結".to_string(),
                    target_date: now + chrono::Duration::days(180),
                    deliverables: vec![
                        "GitHub Marketplace Featured listing".to_string(),
                        "GitHub Universe sponsorship contract".to_string(),
                        "Co-marketing blog post published".to_string(),
                    ],
                    success_criteria: vec![
                        "5x user acquisition (GitHub channels)".to_string(),
                        "300 Pro users".to_string(),
                        "$8,700 MRR".to_string(),
                    ],
                },
                Milestone {
                    name: "Month 9: Enterprise PoC Program開始".to_string(),
                    target_date: now + chrono::Duration::days(270),
                    deliverables: vec![
                        "Enterprise tier implementation".to_string(),
                        "SSO/SAML authentication".to_string(),
                        "Audit logs (6-month retention)".to_string(),
                        "3社とPoC契約".to_string(),
                    ],
                    success_criteria: vec![
                        "1社がEnterprise契約 ($5K/月)".to_string(),
                        "50 Team customers".to_string(),
                        "$15K+ MRR".to_string(),
                    ],
                },
                Milestone {
                    name: "Month 12: Year 1目標達成".to_string(),
                    target_date: now + chrono::Duration::days(365),
                    deliverables: vec![
                        "10,000 Free users".to_string(),
                        "500 Pro users".to_string(),
                        "50 Team customers".to_string(),
                        "3 Enterprise customers".to_string(),
                    ],
                    success_criteria: vec![
                        "$49,450 MRR".to_string(),
                        "$593,400 ARR".to_string(),
                        "Churn rate <5%/月".to_string(),
                        "NPS score >50".to_string(),
                    ],
                },
            ],
        },

        risks: vec![
            Risk {
                description: "GitHub Copilot が完全自律Agent機能を追加".to_string(),
                severity: 4,
                probability: 0.6,
                mitigation: vec![
                    "15コンポーネントGitHub統合の深さで差別化".to_string(),
                    "53ラベル体系特許出願で模倣困難性確保".to_string(),
                    "Open Source戦略でコミュニティロックイン".to_string(),
                    "Early mover advantage: 2-3年のリード確保".to_string(),
                ],
            },
            Risk {
                description: "Claude/OpenAI APIコストが2-3x上昇".to_string(),
                severity: 3,
                probability: 0.3,
                mitigation: vec![
                    "Usage-based pricingでコスト転嫁".to_string(),
                    "Multi-model support (Claude, OpenAI, Gemini切替)".to_string(),
                    "Caching最適化で30%削減".to_string(),
                    "Enterprise Self-hosted option提供".to_string(),
                ],
            },
            Risk {
                description: "競合(Cursor等)の巨額資金調達でマーケティング攻勢".to_string(),
                severity: 3,
                probability: 0.8,
                mitigation: vec![
                    "Niche focus: GitHub統合特化、IDEは作らない".to_string(),
                    "Open Source: コミュニティ駆動で低コスト成長".to_string(),
                    "Bootstrapped→VC: PMF証明後にSeries A".to_string(),
                    "Enterprise優先: High ARPU顧客で資金効率向上".to_string(),
                ],
            },
            Risk {
                description: "GitHub API Rate Limit超過で大規模ユーザー獲得不可".to_string(),
                severity: 4,
                probability: 0.4,
                mitigation: vec![
                    "GitHub App OAuth: Tenant毎に異なるInstallation ID".to_string(),
                    "Redis caching戦略".to_string(),
                    "Exponential backoff自動リトライ".to_string(),
                    "GitHub Partnership経由でEnterprise API quota交渉".to_string(),
                ],
            },
            Risk {
                description: "PMF (Product-Market Fit) 未達でユーザー離脱".to_string(),
                severity: 5,
                probability: 0.5,
                mitigation: vec![
                    "Early beta program (100 users) でPMF検証".to_string(),
                    "週5件以上のユーザーインタビュー".to_string(),
                    "WAIP (Weekly Active Issues Processed) <1,000ならpivot".to_string(),
                    "Pivot options: GitLab/Bitbucket対応、IDE統合".to_string(),
                ],
            },
        ],

        next_steps: vec![
            "Week 1-2: MVP仕様書作成、技術スタック決定 (Rust, PostgreSQL, Redis)".to_string(),
            "Week 3-4: Multi-tenant database設計、GitHub App登録".to_string(),
            "Month 1: CoordinatorAgent & CodeGenAgent実装".to_string(),
            "Month 2: ReviewAgent & PRAgent実装、100 beta usersリクルート".to_string(),
            "Month 3: Beta feedback収集、PMF検証、Product Hunt準備".to_string(),
            "Month 4: Product Hunt launch、Hacker News Show HN投稿".to_string(),
            "Month 5: GitHub Partnership申請、Anthropic Claude Partner Program登録".to_string(),
            "Month 6: Stripe Billing統合、Pro/Team tier実装".to_string(),
            "Month 7-9: Enterprise tier開発 (SSO/SAML, Audit logs)".to_string(),
            "Month 10-12: Enterprise PoC program、3社契約獲得、Year 1目標達成".to_string(),
        ],

        generated_at: now,
    }
}

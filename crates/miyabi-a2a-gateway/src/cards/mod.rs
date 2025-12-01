//! Agent Card definitions for all 21 Miyabi agents

use crate::types::{AgentCapabilities, AgentCard, Skill};

/// Get all agent cards for Miyabi agents
pub fn get_all_agent_cards() -> Vec<AgentCard> {
    vec![
        // Coding Agents (7)
        coordinator_agent_card(),
        codegen_agent_card(),
        review_agent_card(),
        pr_agent_card(),
        issue_agent_card(),
        deployment_agent_card(),
        batch_issue_agent_card(),
        // Business Agents (14)
        self_analysis_agent_card(),
        market_research_agent_card(),
        persona_agent_card(),
        product_concept_agent_card(),
        product_design_agent_card(),
        content_creation_agent_card(),
        funnel_design_agent_card(),
        sns_strategy_agent_card(),
        marketing_agent_card(),
        sales_agent_card(),
        crm_agent_card(),
        analytics_agent_card(),
        ai_entrepreneur_agent_card(),
        youtube_agent_card(),
    ]
}

// =============================================================================
// Coding Agents (7)
// =============================================================================

pub fn coordinator_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-coordinator".to_string(),
        description: "Task coordination and DAG-based orchestration".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities { streaming: true, push_notifications: true, state_transition_history: true },
        skills: vec![
            Skill {
                id: "task_coordination".to_string(),
                name: "Task Coordination".to_string(),
                description: "Coordinate and distribute tasks across multiple agents".to_string(),
                input_modes: vec!["text/plain".to_string(), "application/json".to_string()],
                output_modes: vec!["application/json".to_string()],
            },
            Skill {
                id: "dag_orchestration".to_string(),
                name: "DAG Orchestration".to_string(),
                description: "Execute tasks based on dependency graph".to_string(),
                input_modes: vec!["application/json".to_string()],
                output_modes: vec!["application/json".to_string()],
            },
        ],
        default_input_modes: vec!["text/plain".to_string()],
        default_output_modes: vec!["application/json".to_string()],
        authentication: None,
    }
}

pub fn codegen_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-codegen".to_string(),
        description: "AI-driven code generation with Claude Sonnet 4".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![
            Skill {
                id: "code_generation".to_string(),
                name: "Code Generation".to_string(),
                description: "Generate code from specifications".to_string(),
                input_modes: vec!["text/plain".to_string()],
                output_modes: vec!["text/plain".to_string()],
            },
            Skill {
                id: "code_refactoring".to_string(),
                name: "Code Refactoring".to_string(),
                description: "Refactor and improve existing code".to_string(),
                input_modes: vec!["text/plain".to_string()],
                output_modes: vec!["text/plain".to_string()],
            },
        ],
        default_input_modes: vec!["text/plain".to_string()],
        default_output_modes: vec!["text/plain".to_string()],
        authentication: None,
    }
}

pub fn review_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-review".to_string(),
        description: "Code quality, security scanning, and quality scoring".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![
            Skill {
                id: "code_review".to_string(),
                name: "Code Review".to_string(),
                description: "Review code for quality and best practices".to_string(),
                input_modes: vec!["text/plain".to_string()],
                output_modes: vec!["application/json".to_string()],
            },
            Skill {
                id: "security_scan".to_string(),
                name: "Security Scan".to_string(),
                description: "Scan code for security vulnerabilities".to_string(),
                input_modes: vec!["text/plain".to_string()],
                output_modes: vec!["application/json".to_string()],
            },
        ],
        default_input_modes: vec!["text/plain".to_string()],
        default_output_modes: vec!["application/json".to_string()],
        authentication: None,
    }
}

pub fn pr_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-pr".to_string(),
        description: "Pull Request creation with Conventional Commits".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "pr_creation".to_string(),
            name: "PR Creation".to_string(),
            description: "Create pull requests with proper formatting".to_string(),
            input_modes: vec!["application/json".to_string()],
            output_modes: vec!["application/json".to_string()],
        }],
        default_input_modes: vec!["application/json".to_string()],
        default_output_modes: vec!["application/json".to_string()],
        authentication: None,
    }
}

pub fn issue_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-issue".to_string(),
        description: "Issue analysis and 57-label system classification".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![
            Skill {
                id: "issue_analysis".to_string(),
                name: "Issue Analysis".to_string(),
                description: "Analyze and classify GitHub issues".to_string(),
                input_modes: vec!["application/json".to_string()],
                output_modes: vec!["application/json".to_string()],
            },
            Skill {
                id: "label_assignment".to_string(),
                name: "Label Assignment".to_string(),
                description: "Assign appropriate labels from 57-label system".to_string(),
                input_modes: vec!["application/json".to_string()],
                output_modes: vec!["application/json".to_string()],
            },
        ],
        default_input_modes: vec!["application/json".to_string()],
        default_output_modes: vec!["application/json".to_string()],
        authentication: None,
    }
}

pub fn deployment_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-deployment".to_string(),
        description: "CI/CD deployment automation with Firebase/AWS".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "deployment".to_string(),
            name: "Deployment".to_string(),
            description: "Deploy applications to cloud platforms".to_string(),
            input_modes: vec!["application/json".to_string()],
            output_modes: vec!["application/json".to_string()],
        }],
        default_input_modes: vec!["application/json".to_string()],
        default_output_modes: vec!["application/json".to_string()],
        authentication: None,
    }
}

pub fn batch_issue_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-batch-issue".to_string(),
        description: "Batch GitHub Issue creation from templates".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "batch_issue_creation".to_string(),
            name: "Batch Issue Creation".to_string(),
            description: "Create multiple issues from templates".to_string(),
            input_modes: vec!["application/json".to_string()],
            output_modes: vec!["application/json".to_string()],
        }],
        default_input_modes: vec!["application/json".to_string()],
        default_output_modes: vec!["application/json".to_string()],
        authentication: None,
    }
}

// =============================================================================
// Business Agents (14)
// =============================================================================

pub fn self_analysis_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-self-analysis".to_string(),
        description: "Career, skills, and achievement analysis".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "self_analysis".to_string(),
            name: "Self Analysis".to_string(),
            description: "Analyze personal strengths and career path".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    }
}

pub fn market_research_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-market-research".to_string(),
        description: "Market trends and competitor analysis (20+ companies)".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "market_research".to_string(),
            name: "Market Research".to_string(),
            description: "Research market trends and competitors".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    }
}

pub fn persona_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-persona".to_string(),
        description: "Target customer persona (3-5) and customer journey design".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "persona_design".to_string(),
            name: "Persona Design".to_string(),
            description: "Design customer personas and journeys".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    }
}

pub fn product_concept_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-product-concept".to_string(),
        description: "USP, revenue model, and business model canvas".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "product_concept".to_string(),
            name: "Product Concept".to_string(),
            description: "Design product concepts and business models".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    }
}

pub fn product_design_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-product-design".to_string(),
        description: "6-month content, tech stack, and MVP definition".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "product_design".to_string(),
            name: "Product Design".to_string(),
            description: "Design product roadmap and specifications".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    }
}

pub fn content_creation_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-content-creation".to_string(),
        description: "Video, article, and educational content creation".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "content_creation".to_string(),
            name: "Content Creation".to_string(),
            description: "Create marketing and educational content".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    }
}

pub fn funnel_design_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-funnel-design".to_string(),
        description: "Awareness to LTV customer funnel optimization".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "funnel_design".to_string(),
            name: "Funnel Design".to_string(),
            description: "Design and optimize conversion funnels".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    }
}

pub fn sns_strategy_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-sns-strategy".to_string(),
        description: "Twitter/Instagram/YouTube strategy and calendar".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "sns_strategy".to_string(),
            name: "SNS Strategy".to_string(),
            description: "Plan social media strategy and content calendar".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    }
}

pub fn marketing_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-marketing".to_string(),
        description: "Advertising, SEO, and SNS marketing execution".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "marketing".to_string(),
            name: "Marketing".to_string(),
            description: "Execute marketing campaigns".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    }
}

pub fn sales_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-sales".to_string(),
        description: "Lead to customer conversion optimization".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "sales".to_string(),
            name: "Sales".to_string(),
            description: "Optimize sales process and conversions".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    }
}

pub fn crm_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-crm".to_string(),
        description: "Customer satisfaction and LTV maximization".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "crm".to_string(),
            name: "CRM".to_string(),
            description: "Manage customer relationships and retention".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    }
}

pub fn analytics_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-analytics".to_string(),
        description: "Data analysis, PDCA cycle, and continuous improvement".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "analytics".to_string(),
            name: "Analytics".to_string(),
            description: "Analyze data and drive improvements".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    }
}

pub fn ai_entrepreneur_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-ai-entrepreneur".to_string(),
        description: "Comprehensive business plan and startup strategy".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "ai_entrepreneur".to_string(),
            name: "AI Entrepreneur".to_string(),
            description: "Create business plans and strategies".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    }
}

pub fn youtube_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-youtube".to_string(),
        description: "Channel concept to posting plan (13 workflows)".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        url: String::new(),
        capabilities: AgentCapabilities::default(),
        skills: vec![Skill {
            id: "youtube".to_string(),
            name: "YouTube".to_string(),
            description: "Plan and optimize YouTube content".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_all_agent_cards() {
        let cards = get_all_agent_cards();
        assert_eq!(cards.len(), 21);

        // Verify all cards have names
        for card in &cards {
            assert!(!card.name.is_empty());
            assert!(!card.skills.is_empty());
        }
    }
}

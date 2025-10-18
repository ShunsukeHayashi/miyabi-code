use clap::{Args, Parser, Subcommand};
use miyabi_integration::{AgentKind, Config, MiyabiClient};
use serde::Serialize;

#[derive(Parser, Debug)]
#[command(name = "codex-miyabi", version, about = "Codex × Miyabi integration CLI (Phase 1)")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Show integration status as JSON
    Status(CommonOpts),
    /// Agent-related commands
    Agent(AgentCommand),
    /// Worktree commands (mock)
    Worktree(WorktreeCommand),
}

#[derive(Args, Debug)]
struct CommonOpts {
    /// Output JSON
    #[arg(long, default_value_t = true)]
    json: bool,
}

#[derive(Args, Debug)]
struct AgentCommand {
    #[command(subcommand)]
    cmd: AgentSub,
}

#[derive(Subcommand, Debug)]
enum AgentSub {
    /// Run an agent (skeleton)
    Run(AgentRunArgs),
}

#[derive(Args, Debug)]
struct AgentRunArgs {
    /// Agent type (e.g., coordinator, codegen, review)
    #[arg(long, value_name = "NAME")]
    r#type: String,
    /// Optional issue number
    #[arg(long)]
    issue: Option<u64>,
    /// Output JSON
    #[arg(long, default_value_t = true)]
    json: bool,
}

#[derive(Args, Debug)]
struct WorktreeCommand {
    #[command(subcommand)]
    cmd: WorktreeSub,
}

#[derive(Subcommand, Debug)]
enum WorktreeSub {
    /// List worktrees (mock)
    List(CommonOpts),
    /// Create a worktree (mock)
    Create(WorktreeCreateArgs),
    /// Cleanup a worktree (mock)
    Cleanup(WorktreeCleanupArgs),
}

#[derive(Args, Debug)]
struct WorktreeCreateArgs {
    #[arg(long)]
    issue: u64,
    #[arg(long, default_value_t = true)]
    json: bool,
}

#[derive(Args, Debug)]
struct WorktreeCleanupArgs {
    #[arg(long)]
    issue: u64,
    #[arg(long, default_value_t = true)]
    json: bool,
}

#[derive(Serialize)]
struct ErrorOut<'a> {
    ok: bool,
    error: &'a str,
}

fn parse_agent_kind(name: &str) -> AgentKind {
    match name.to_ascii_lowercase().as_str() {
        "coordinator" => AgentKind::Coordinator,
        "codegen" => AgentKind::CodeGen,
        "review" => AgentKind::Review,
        "issue" => AgentKind::Issue,
        "pr" | "pra" | "pragent" => AgentKind::PR,
        "deploy" | "deployment" => AgentKind::Deployment,
        "test" => AgentKind::Test,
        other => AgentKind::Custom(other.to_string()),
    }
}

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    let cfg = Config {
        workdir: std::env::current_dir().ok().map(|p| p.display().to_string()),
        github_token: std::env::var("GITHUB_TOKEN").ok(),
        repo_owner: None,
        repo_name: None,
    };
    let client = MiyabiClient::new(cfg);

    match cli.command {
        Commands::Status(opts) => match client.status().await {
            Ok(status) => {
                if opts.json {
                    println!("{}", serde_json::to_string_pretty(&status).unwrap());
                } else {
                    println!("ok={} version={}", status.ok, status.version);
                }
            }
            Err(e) => {
                let out = ErrorOut { ok: false, error: &format!("{}", e) };
                println!("{}", serde_json::to_string_pretty(&out).unwrap());
                std::process::exit(1);
            }
        },
        Commands::Agent(agent_cmd) => match agent_cmd.cmd {
            AgentSub::Run(args) => {
                let kind = parse_agent_kind(&args.r#type);
                match client.execute_agent(kind, args.issue).await {
                    Ok(rep) => {
                        if args.json {
                            println!("{}", serde_json::to_string_pretty(&rep).unwrap());
                        } else {
                            println!("agent run ok: type={:?} issue={:?}", rep.agent, rep.issue);
                        }
                    }
                    Err(e) => {
                        let out = ErrorOut { ok: false, error: &format!("{}", e) };
                        println!("{}", serde_json::to_string_pretty(&out).unwrap());
                        std::process::exit(2);
                    }
                }
            }
        },
        Commands::Worktree(wt) => match wt.cmd {
            WorktreeSub::List(opts) => match client.worktree_list().await {
                Ok(list) => {
                    if opts.json {
                        println!("{}", serde_json::to_string_pretty(&list).unwrap());
                    } else {
                        println!("{} items", list.len());
                    }
                }
                Err(e) => {
                    let out = ErrorOut { ok: false, error: &format!("{}", e) };
                    println!("{}", serde_json::to_string_pretty(&out).unwrap());
                    std::process::exit(3);
                }
            },
            WorktreeSub::Create(args) => match client.worktree_create(args.issue).await {
                Ok(rep) => {
                    if args.json {
                        println!("{}", serde_json::to_string_pretty(&rep).unwrap());
                    } else {
                        println!("created issue {}", rep.issue.unwrap_or_default());
                    }
                }
                Err(e) => {
                    let out = ErrorOut { ok: false, error: &format!("{}", e) };
                    println!("{}", serde_json::to_string_pretty(&out).unwrap());
                    std::process::exit(4);
                }
            },
            WorktreeSub::Cleanup(args) => match client.worktree_cleanup(args.issue).await {
                Ok(rep) => {
                    if args.json {
                        println!("{}", serde_json::to_string_pretty(&rep).unwrap());
                    } else {
                        println!("cleanup issue {}", rep.issue.unwrap_or_default());
                    }
                }
                Err(e) => {
                    let out = ErrorOut { ok: false, error: &format!("{}", e) };
                    println!("{}", serde_json::to_string_pretty(&out).unwrap());
                    std::process::exit(5);
                }
            },
        },
    }
}

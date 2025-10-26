#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter("miyabi_tui=debug")
        .init();

    // Run TUI
    miyabi_tui::run_tui().await
}

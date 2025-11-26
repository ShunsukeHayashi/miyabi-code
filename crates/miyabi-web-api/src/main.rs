use miyabi_web_api::AppConfig;

#[tokio::main]
async fn main() {
    // Load environment variables
    dotenvy::dotenv().ok();

    // Load configuration from environment
    let config = AppConfig::from_env().expect("Failed to load configuration");

    // Run server
    miyabi_web_api::run_server(config)
        .await
        .expect("Server error");
}

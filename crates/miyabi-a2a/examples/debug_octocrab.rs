//! Debug octocrab Issue creation
//!
//! Run with: cargo run --example debug_octocrab

use octocrab::Octocrab;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let token = std::env::var("GITHUB_TOKEN")?;

    println!("Creating Octocrab client...");
    let client = Octocrab::builder().personal_token(token).build()?;

    println!("Creating test issue...");
    match client
        .issues("customer-cloud", "miyabi-private")
        .create("[TEST] Octocrab Debug Test")
        .body("Testing octocrab Issue creation directly")
        .labels(vec!["a2a:submitted".to_string(), "a2a:testing".to_string()])
        .send()
        .await
    {
        Ok(issue) => {
            println!(
                "✅ Success! Created Issue #{}: {}",
                issue.number, issue.html_url
            );
        }
        Err(e) => {
            println!("❌ Error: {}", e);
            println!("❌ Error (debug): {:?}", e);
            return Err(e.into());
        }
    }

    Ok(())
}

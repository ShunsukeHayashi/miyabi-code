// VOICEVOX integration module for Miyabi Desktop
//
// Provides Tauri commands for VOICEVOX narration generation and playback

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Stdio;
use tauri::{AppHandle, Emitter};
use tokio::process::Command;

/// Speaker configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeakerConfig {
    pub id: u32,
    pub name: String,
}

impl Default for SpeakerConfig {
    fn default() -> Self {
        Self {
            id: 3, // ずんだもん (Default)
            name: "ずんだもん".to_string(),
        }
    }
}

/// Narration request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NarrationRequest {
    pub text: String,
    pub speaker_id: Option<u32>,
    pub speed: Option<f32>,
}

/// Narration metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NarrationMetadata {
    pub id: String,
    pub text: String,
    pub speaker_id: u32,
    pub speed: f32,
    pub audio_path: String,
    pub duration_ms: Option<u64>,
    pub created_at: u64,
}

/// Narration generation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NarrationResult {
    pub success: bool,
    pub metadata: Option<NarrationMetadata>,
    pub error: Option<String>,
}

/// Check if VOICEVOX Engine is running
pub async fn check_voicevox_engine() -> Result<bool, String> {
    let client = reqwest::Client::new();
    let url = "http://127.0.0.1:50021/version";

    match client.get(url).send().await {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

/// Start VOICEVOX Engine via Docker
pub async fn start_voicevox_engine() -> Result<bool, String> {
    // Check if Docker is available
    let docker_check = Command::new("docker")
        .arg("--version")
        .output()
        .await
        .map_err(|e| format!("Docker not found: {}", e))?;

    if !docker_check.status.success() {
        return Err("Docker is not running".to_string());
    }

    // Start VOICEVOX Engine container
    let output = Command::new("docker")
        .args([
            "run",
            "-d",
            "--rm",
            "-p",
            "127.0.0.1:50021:50021",
            "voicevox/voicevox_engine:cpu-latest",
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to start Docker container: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Docker command failed: {}", stderr));
    }

    // Wait for engine to be ready (max 30 seconds)
    let client = reqwest::Client::new();
    for _ in 0..30 {
        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
        if client
            .get("http://127.0.0.1:50021/version")
            .send()
            .await
            .is_ok()
        {
            return Ok(true);
        }
    }

    Err("VOICEVOX Engine did not start within 30 seconds".to_string())
}

/// Generate narration audio
pub async fn generate_narration(
    request: NarrationRequest,
    app_handle: AppHandle,
) -> Result<NarrationResult, String> {
    let narration_id = uuid::Uuid::new_v4().to_string();

    // Ensure VOICEVOX Engine is running
    if !check_voicevox_engine().await? {
        let _ = app_handle.emit("voicevox-status", "Starting VOICEVOX Engine...");
        start_voicevox_engine().await?;
    }

    let speaker_id = request.speaker_id.unwrap_or(3); // Default: ずんだもん
    let speed = request.speed.unwrap_or(1.0);

    // Find voicevox_enqueue.sh script
    let script_path = find_enqueue_script()?;

    let _ = app_handle.emit(
        "narration-generation-progress",
        format!("Generating narration: {}", narration_id),
    );

    // Execute voicevox_enqueue.sh
    let output = Command::new(&script_path)
        .arg(&request.text)
        .arg(speaker_id.to_string())
        .arg(speed.to_string())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to execute enqueue script: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Ok(NarrationResult {
            success: false,
            metadata: None,
            error: Some(format!("Enqueue script failed: {}", stderr)),
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Parse audio file path from script output
    // Expected format: "✅ キューに追加しました: /tmp/voicevox_queue/xxx.json"
    let audio_path = parse_audio_path_from_output(&stdout)?;

    let metadata = NarrationMetadata {
        id: narration_id.clone(),
        text: request.text,
        speaker_id,
        speed,
        audio_path,
        duration_ms: None, // TODO: Calculate from audio file
        created_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };

    let _ = app_handle.emit("narration-generated", &metadata);

    Ok(NarrationResult {
        success: true,
        metadata: Some(metadata),
        error: None,
    })
}

/// Find voicevox_enqueue.sh script
fn find_enqueue_script() -> Result<PathBuf, String> {
    let candidates = vec![
        PathBuf::from("tools/voicevox_enqueue.sh"),
        PathBuf::from("/tmp/voicevox_enqueue.sh"),
        PathBuf::from("../tools/voicevox_enqueue.sh"),
        PathBuf::from("../../tools/voicevox_enqueue.sh"),
    ];

    for path in candidates {
        if path.exists() {
            return Ok(path);
        }
    }

    Err("voicevox_enqueue.sh not found. Please check installation.".to_string())
}

/// Parse audio file path from voicevox_enqueue.sh output
fn parse_audio_path_from_output(output: &str) -> Result<String, String> {
    // Expected format: "✅ キューに追加しました: /tmp/voicevox_queue/xxx.json"
    for line in output.lines() {
        if line.contains("キューに追加しました:") || line.contains("Queue file:") {
            if let Some(path) = line.split(':').nth(1) {
                let json_path = path.trim();
                // Convert JSON path to WAV path
                let wav_path = json_path.replace(".json", ".wav");
                return Ok(wav_path);
            }
        }
    }

    Err("Could not parse audio path from script output".to_string())
}

/// Get available speakers
pub async fn get_speakers() -> Result<Vec<SpeakerConfig>, String> {
    let client = reqwest::Client::new();
    let url = "http://127.0.0.1:50021/speakers";

    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch speakers: {}", e))?;

    let speakers_json = response
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Failed to parse speakers: {}", e))?;

    let mut speakers = Vec::new();

    if let Some(speakers_array) = speakers_json.as_array() {
        for speaker in speakers_array {
            if let (Some(name), Some(styles)) = (
                speaker.get("name").and_then(|n| n.as_str()),
                speaker.get("styles").and_then(|s| s.as_array()),
            ) {
                for style in styles {
                    if let Some(id) = style.get("id").and_then(|i| i.as_u64()) {
                        speakers.push(SpeakerConfig {
                            id: id as u32,
                            name: name.to_string(),
                        });
                    }
                }
            }
        }
    }

    Ok(speakers)
}

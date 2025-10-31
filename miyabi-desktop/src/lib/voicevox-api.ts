// VOICEVOX API wrapper for Tauri

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

/**
 * Speaker configuration
 */
export interface SpeakerConfig {
  id: number;
  name: string;
}

/**
 * Narration request
 */
export interface NarrationRequest {
  text: string;
  speaker_id?: number;
  speed?: number;
}

/**
 * Narration metadata
 */
export interface NarrationMetadata {
  id: string;
  text: string;
  speaker_id: number;
  speed: number;
  audio_path: string;
  duration_ms?: number;
  created_at: number;
}

/**
 * Narration generation result
 */
export interface NarrationResult {
  success: boolean;
  metadata?: NarrationMetadata;
  error?: string;
}

/**
 * Check if VOICEVOX Engine is running
 */
export async function checkVoicevoxEngine(): Promise<boolean> {
  return await invoke<boolean>("check_voicevox_engine_command");
}

/**
 * Start VOICEVOX Engine via Docker
 */
export async function startVoicevoxEngine(): Promise<boolean> {
  return await invoke<boolean>("start_voicevox_engine_command");
}

/**
 * Generate narration audio
 */
export async function generateNarration(
  request: NarrationRequest
): Promise<NarrationResult> {
  return await invoke<NarrationResult>("generate_narration_command", { request });
}

/**
 * Get available speakers
 */
export async function getSpeakers(): Promise<SpeakerConfig[]> {
  return await invoke<SpeakerConfig[]>("get_speakers_command");
}

/**
 * Listen to VOICEVOX engine status updates
 */
export async function listenToVoicevoxStatus(
  callback: (status: string) => void
): Promise<() => void> {
  const unlisten = await listen<string>("voicevox-status", (event) => {
    callback(event.payload);
  });
  return unlisten;
}

/**
 * Listen to narration generation progress
 */
export async function listenToNarrationProgress(
  callback: (progress: string) => void
): Promise<() => void> {
  const unlisten = await listen<string>("narration-generation-progress", (event) => {
    callback(event.payload);
  });
  return unlisten;
}

/**
 * Listen to narration generated events
 */
export async function listenToNarrationGenerated(
  callback: (metadata: NarrationMetadata) => void
): Promise<() => void> {
  const unlisten = await listen<NarrationMetadata>("narration-generated", (event) => {
    callback(event.payload);
  });
  return unlisten;
}

/**
 * Default speaker presets (commonly used)
 */
export const DEFAULT_SPEAKERS: SpeakerConfig[] = [
  { id: 3, name: "ずんだもん" },
  { id: 2, name: "四国めたん" },
  { id: 8, name: "春日部つむぎ" },
  { id: 0, name: "四国めたん (ノーマル)" },
  { id: 1, name: "ずんだもん (あまあま)" },
];

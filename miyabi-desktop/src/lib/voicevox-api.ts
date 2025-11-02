// VOICEVOX API wrapper for Tauri

import { safeInvoke, safeListen } from "./tauri-utils";

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
  const result = await safeInvoke<boolean>("check_voicevox_engine_command");
  return result || false;
}

/**
 * Start VOICEVOX Engine via Docker
 */
export async function startVoicevoxEngine(): Promise<boolean> {
  const result = await safeInvoke<boolean>("start_voicevox_engine_command");
  return result || false;
}

/**
 * Generate narration audio
 */
export async function generateNarration(
  request: NarrationRequest
): Promise<NarrationResult> {
  const result = await safeInvoke<NarrationResult>("generate_narration_command", { request });
  return result || { success: false, error: 'Tauri runtime not available' };
}

/**
 * Get available speakers
 */
export async function getSpeakers(): Promise<SpeakerConfig[]> {
  const result = await safeInvoke<SpeakerConfig[]>("get_speakers_command");
  return result || DEFAULT_SPEAKERS;
}

/**
 * Listen to VOICEVOX engine status updates
 */
export async function listenToVoicevoxStatus(
  callback: (status: string) => void
): Promise<() => void> {
  return await safeListen<string>("voicevox-status", callback);
}

/**
 * Listen to narration generation progress
 */
export async function listenToNarrationProgress(
  callback: (progress: string) => void
): Promise<() => void> {
  return await safeListen<string>("narration-generation-progress", callback);
}

/**
 * Listen to narration generated events
 */
export async function listenToNarrationGenerated(
  callback: (metadata: NarrationMetadata) => void
): Promise<() => void> {
  return await safeListen<NarrationMetadata>("narration-generated", callback);
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

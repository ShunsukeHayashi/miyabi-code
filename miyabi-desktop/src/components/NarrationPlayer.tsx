import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Square,
  Volume2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  generateNarration,
  checkVoicevoxEngine,
  startVoicevoxEngine,
  getSpeakers,
  listenToNarrationGenerated,
  listenToVoicevoxStatus,
  DEFAULT_SPEAKERS,
  type NarrationRequest,
  type NarrationMetadata,
  type SpeakerConfig,
} from "../lib/voicevox-api";

interface NarrationPlayerProps {
  className?: string;
}

export function NarrationPlayer({ className = "" }: NarrationPlayerProps) {
  // State
  const [engineRunning, setEngineRunning] = useState(false);
  const [engineStatus, setEngineStatus] = useState<string>("Checking...");
  const [speakers, setSpeakers] = useState<SpeakerConfig[]>(DEFAULT_SPEAKERS);
  const [selectedSpeaker, setSelectedSpeaker] = useState<number>(3); // Default: ずんだもん
  const [speed, setSpeed] = useState<number>(1.0);
  const [inputText, setInputText] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [narrations, setNarrations] = useState<NarrationMetadata[]>([]);
  const [currentNarration, setCurrentNarration] = useState<NarrationMetadata | null>(null);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);

  // Check VOICEVOX Engine status on mount
  useEffect(() => {
    checkEngine();
    loadSpeakers();

    // Listen to VOICEVOX status events
    const setupListeners = async () => {
      await listenToVoicevoxStatus((status) => {
        setEngineStatus(status);
      });

      await listenToNarrationGenerated((metadata) => {
        setNarrations((prev) => [metadata, ...prev]);
        setCurrentNarration(metadata);
        setGenerating(false);
      });
    };

    setupListeners();
  }, []);

  // Update audio element when narration changes
  useEffect(() => {
    if (currentNarration && audioRef.current) {
      // Convert file:// path to http:// served by Tauri
      // Note: This might need adjustment based on how Tauri serves local files
      const audioPath = `asset://${currentNarration.audio_path}`;
      audioRef.current.src = audioPath;
      audioRef.current.load();
    }
  }, [currentNarration]);

  // Audio time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Waveform visualization
  useEffect(() => {
    drawWaveform();
  }, [currentTime, duration, currentNarration]);

  const checkEngine = async () => {
    const running = await checkVoicevoxEngine();
    setEngineRunning(running);
    setEngineStatus(running ? "Running" : "Not running");
  };

  const startEngine = async () => {
    setEngineStatus("Starting engine...");
    try {
      const success = await startVoicevoxEngine();
      if (success) {
        setEngineRunning(true);
        setEngineStatus("Running");
      } else {
        setEngineStatus("Failed to start");
      }
    } catch (error) {
      console.error("Failed to start VOICEVOX Engine:", error);
      setEngineStatus("Error");
    }
  };

  const loadSpeakers = async () => {
    try {
      const availableSpeakers = await getSpeakers();
      if (availableSpeakers.length > 0) {
        setSpeakers(availableSpeakers);
      }
    } catch (error) {
      console.error("Failed to load speakers:", error);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;

    setGenerating(true);

    const request: NarrationRequest = {
      text: inputText,
      speaker_id: selectedSpeaker,
      speed,
    };

    try {
      const result = await generateNarration(request);
      if (!result.success) {
        console.error("Narration generation failed:", result.error);
        setGenerating(false);
      }
      // Success handling is done via event listener
    } catch (error) {
      console.error("Failed to generate narration:", error);
      setGenerating(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const drawWaveform = () => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, width, height);

    // Draw waveform placeholder (simple visualization)
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.beginPath();

    const barCount = 100;
    const barWidth = width / barCount;

    for (let i = 0; i < barCount; i++) {
      // Simple sine wave pattern (replace with actual audio data later)
      const barHeight = (Math.sin(i * 0.1) * 0.5 + 0.5) * height * 0.8;
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Draw playback position
    if (duration > 0) {
      const progress = (currentTime / duration) * width;
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(progress, 0, 2, height);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`h-full flex flex-col bg-white ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-light text-gray-900">VOICEVOX Narration</h2>
          <div className="flex items-center space-x-3">
            <span
              className={`text-sm font-light ${
                engineRunning ? "text-green-500" : "text-gray-400"
              }`}
            >
              {engineStatus}
            </span>
            {!engineRunning && (
              <button
                onClick={startEngine}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-light rounded-xl hover:bg-blue-600 transition-all duration-200"
              >
                Start Engine
              </button>
            )}
            <button
              onClick={checkEngine}
              className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
              title="Refresh status"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Generator Section */}
      <div className="p-6 border-b border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-light text-gray-700 mb-2">
            Text to Speech
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text to generate narration..."
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 text-sm font-light resize-none transition-all duration-200"
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-light text-gray-700 mb-2">
              Speaker
            </label>
            <select
              value={selectedSpeaker}
              onChange={(e) => setSelectedSpeaker(Number(e.target.value))}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 text-sm font-light transition-all duration-200"
            >
              {speakers.map((speaker) => (
                <option key={speaker.id} value={speaker.id}>
                  {speaker.name} (ID: {speaker.id})
                </option>
              ))}
            </select>
          </div>

          <div className="w-48">
            <label className="block text-sm font-light text-gray-700 mb-2">
              Speed: {speed.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="pt-6">
            <button
              onClick={handleGenerate}
              disabled={!engineRunning || generating || !inputText.trim()}
              className={`px-6 py-2 rounded-xl font-light transition-all duration-200 flex items-center space-x-2 ${
                !engineRunning || generating || !inputText.trim()
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              {generating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <span>Generate</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Player Section */}
      <div className="flex-1 flex flex-col p-6 space-y-6">
        {/* Waveform Visualization */}
        <div className="flex-1 bg-gray-900 rounded-2xl overflow-hidden relative">
          <canvas
            ref={waveformCanvasRef}
            width={800}
            height={200}
            className="w-full h-full"
          />
          {currentNarration && (
            <div className="absolute top-4 left-4 text-white text-sm font-light">
              <div className="bg-black bg-opacity-50 px-3 py-2 rounded-lg">
                {currentNarration.text.slice(0, 50)}
                {currentNarration.text.length > 50 ? "..." : ""}
              </div>
            </div>
          )}
        </div>

        {/* Playback Controls */}
        <div className="space-y-4">
          {/* Timeline */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full"
              disabled={!currentNarration}
            />
            <div className="flex items-center justify-between text-xs font-light text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={togglePlayPause}
              disabled={!currentNarration}
              className={`p-4 rounded-full transition-all duration-200 ${
                currentNarration
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={handleStop}
              disabled={!currentNarration}
              className={`p-4 rounded-full transition-all duration-200 ${
                currentNarration
                  ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Square size={24} />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3">
            <Volume2 size={18} className="text-gray-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-light text-gray-500 w-12 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Narration History */}
      {narrations.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <h3 className="text-sm font-light text-gray-700 mb-3">
            Recent Narrations
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {narrations.map((narration) => (
              <div
                key={narration.id}
                onClick={() => setCurrentNarration(narration)}
                className={`p-3 rounded-lg cursor-pointer transition-colors text-xs font-light ${
                  currentNarration?.id === narration.id
                    ? "bg-gray-900 text-white"
                    : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate flex-1">
                    {narration.text.slice(0, 40)}
                    {narration.text.length > 40 ? "..." : ""}
                  </span>
                  <span className="ml-2 text-gray-400">
                    {new Date(narration.created_at * 1000).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}

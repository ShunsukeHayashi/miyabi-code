import { useState, useEffect } from "react";
import { Save, Check, AlertCircle } from "lucide-react";
import { DEFAULT_SPEAKERS } from "../lib/voicevox-api";

interface Settings {
  githubToken: string;
  githubRepo: string;
  voicevoxSpeakerId: number;
  theme: "light" | "dark" | "system";
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>({
    githubToken: "",
    githubRepo: "ShunsukeHayashi/Miyabi",
    voicevoxSpeakerId: 3,
    theme: "light",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    // Load from localStorage
    const stored = localStorage.getItem("miyabi-settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...settings, ...parsed });
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }

    // Load from environment variables (if available via Tauri)
    const envToken = import.meta.env.VITE_GITHUB_TOKEN;
    const envRepo = import.meta.env.VITE_GITHUB_REPOSITORY;
    if (envToken) setSettings((s) => ({ ...s, githubToken: envToken }));
    if (envRepo) setSettings((s) => ({ ...s, githubRepo: envRepo }));
  };

  const saveSettings = () => {
    setLoading(true);
    setError(null);

    try {
      // Validate settings
      if (!settings.githubToken) {
        setError("GitHub Token is required");
        setLoading(false);
        return;
      }

      if (!settings.githubRepo) {
        setError("GitHub Repository is required");
        setLoading(false);
        return;
      }

      // Save to localStorage
      localStorage.setItem("miyabi-settings", JSON.stringify(settings));

      // Show success message
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings({ ...settings, [key]: value });
    setSaved(false);
  };

  return (
    <div className="px-12 py-24 overflow-y-auto h-full">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-24">
          <h1 className="text-6xl font-extralight tracking-tighter text-gray-900 mb-4">
            Settings
          </h1>
          <div className="h-px w-24 bg-gray-300"></div>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center space-x-3 text-green-700">
            <Check size={20} />
            <span className="text-sm font-light">
              Settings saved successfully
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3 text-red-700">
            <AlertCircle size={20} />
            <span className="text-sm font-light">{error}</span>
          </div>
        )}

        {/* Settings Form */}
        <div className="space-y-12">
          {/* GitHub Settings */}
          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-6">
              GitHub Integration
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-lg font-light text-gray-900 mb-4">
                  GitHub Token
                </label>
                <input
                  type="password"
                  value={settings.githubToken}
                  onChange={(e) => updateSetting("githubToken", e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxx"
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-gray-900 text-lg font-light transition-all duration-200"
                />
                <p className="mt-2 text-sm font-light text-gray-500">
                  Generate a token at{" "}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    github.com/settings/tokens
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-lg font-light text-gray-900 mb-4">
                  GitHub Repository
                </label>
                <input
                  type="text"
                  value={settings.githubRepo}
                  onChange={(e) => updateSetting("githubRepo", e.target.value)}
                  placeholder="owner/repository"
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-gray-900 text-lg font-light transition-all duration-200"
                />
                <p className="mt-2 text-sm font-light text-gray-500">
                  Format: owner/repository (e.g., ShunsukeHayashi/Miyabi)
                </p>
              </div>
            </div>
          </section>

          {/* VOICEVOX Settings */}
          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-6">
              VOICEVOX Configuration
            </h2>

            <div>
              <label className="block text-lg font-light text-gray-900 mb-4">
                Default Speaker
              </label>
              <select
                value={settings.voicevoxSpeakerId}
                onChange={(e) =>
                  updateSetting("voicevoxSpeakerId", Number(e.target.value))
                }
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-gray-900 text-lg font-light transition-all duration-200"
              >
                {DEFAULT_SPEAKERS.map((speaker) => (
                  <option key={speaker.id} value={speaker.id}>
                    {speaker.name} (ID: {speaker.id})
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm font-light text-gray-500">
                Select the default speaker for narration generation
              </p>
            </div>
          </section>

          {/* Appearance Settings */}
          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-6">
              Appearance
            </h2>

            <div>
              <label className="block text-lg font-light text-gray-900 mb-4">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-4">
                {(["light", "dark", "system"] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => updateSetting("theme", theme)}
                    className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                      settings.theme === theme
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-900 hover:border-gray-400"
                    }`}
                  >
                    <div className="text-lg font-light capitalize">{theme}</div>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm font-light text-gray-500">
                Note: Theme customization will be fully implemented in a future
                update
              </p>
            </div>
          </section>

          {/* Application Info */}
          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-6">About</h2>
            <div className="p-6 bg-gray-50 rounded-2xl space-y-2">
              <div className="flex justify-between text-sm font-light">
                <span className="text-gray-500">Application</span>
                <span className="text-gray-900">Miyabi Desktop</span>
              </div>
              <div className="flex justify-between text-sm font-light">
                <span className="text-gray-500">Version</span>
                <span className="text-gray-900">0.1.0</span>
              </div>
              <div className="flex justify-between text-sm font-light">
                <span className="text-gray-500">Framework</span>
                <span className="text-gray-900">Tauri 2.0 + React</span>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="pt-6">
            <button
              onClick={saveSettings}
              disabled={loading || saved}
              className={`px-8 py-4 text-lg font-light rounded-2xl transition-all duration-200 flex items-center space-x-3 ${
                saved
                  ? "bg-green-500 text-white"
                  : loading
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              {saved ? (
                <>
                  <Check size={20} />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>{loading ? "Saving..." : "Save Changes"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Info,
  Loader2,
  Monitor,
  Moon,
  Play,
  Save,
  Square,
  Sun,
} from "lucide-react";
import { SegmentedControl } from "./ui/segmented-control";
import {
  DEFAULT_REPOSITORY,
  type AppSettings,
  loadSettings as loadAppSettings,
  saveSettings as persistSettings,
} from "../lib/settings";
import { DEFAULT_SPEAKERS, generateNarration } from "../lib/voicevox-api";
import { setThemePreference } from "../lib/theme-manager";

const SAMPLE_PREVIEW_TEXT =
  "こちらはMiyabiデスクトップのナレーションテストです。保存前に音声をご確認ください。";

const DEFAULT_SETTINGS: AppSettings = {
  githubToken: "",
  githubRepo: DEFAULT_REPOSITORY,
  voicevoxSpeakerId: 3,
  theme: "light",
  agentExecutionEnabled: true,
};

const THEME_OPTIONS = [
  {
    value: "light" as const,
    label: "Light",
    icon: <Sun className="h-4 w-4" />,
  },
  {
    value: "dark" as const,
    label: "Dark",
    icon: <Moon className="h-4 w-4" />,
  },
  {
    value: "system" as const,
    label: "System",
    icon: <Monitor className="h-4 w-4" />,
  },
];

export function SettingsPanel() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState<AppSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const stopPreview = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    }
    setIsPreviewPlaying(false);
    setIsPreviewLoading(false);
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 3000);
  }, []);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const loaded = await loadAppSettings();
        if (!mounted) {
          return;
        }
        setSettings(loaded);
        setInitialSettings(loaded);
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        const message =
          loadError instanceof Error ? loadError.message : "設定の読み込みに失敗しました";
        setError(message);
      } finally {
        if (mounted) {
          setIsLoadingSettings(false);
        }
      }
    };

    hydrate();

    return () => {
      mounted = false;
      stopPreview();
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [stopPreview]);

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview, settings.voicevoxSpeakerId]);

  const isDirty = useMemo(() => {
    if (!initialSettings) {
      return false;
    }

    return (
      initialSettings.githubToken !== settings.githubToken ||
      initialSettings.githubRepo !== settings.githubRepo ||
      initialSettings.voicevoxSpeakerId !== settings.voicevoxSpeakerId ||
      initialSettings.theme !== settings.theme ||
      initialSettings.agentExecutionEnabled !== settings.agentExecutionEnabled
    );
  }, [initialSettings, settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      if (key === "voicevoxSpeakerId" && prev.voicevoxSpeakerId !== value) {
        stopPreview();
        setPreviewError(null);
      }
      if (key === "theme" && prev.theme !== value) {
        setThemePreference(value as AppSettings["theme"]);
      }
      return { ...prev, [key]: value };
    });
    setError(null);
  };

  const handleSave = useCallback(async () => {
    if (isSaving || !isDirty) {
      return;
    }

    const trimmedToken = settings.githubToken.trim();
    const trimmedRepo = settings.githubRepo.trim();

    if (!trimmedToken) {
      setError("GitHub Token を入力してください");
      return;
    }

    if (!trimmedRepo) {
      setError("GitHub Repository を入力してください");
      return;
    }

    const payload: AppSettings = {
      ...settings,
      githubToken: trimmedToken,
      githubRepo: trimmedRepo,
    };

    setIsSaving(true);
    setError(null);

    try {
      await persistSettings(payload);
      setSettings(payload);
      setInitialSettings(payload);
      setLastSavedAt(new Date().toISOString());
      showToast("設定を保存しました");
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "設定の保存に失敗しました";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [isDirty, isSaving, settings, showToast]);

  const handlePreview = useCallback(async () => {
    if (isPreviewPlaying) {
      stopPreview();
      return;
    }

    setPreviewError(null);
    setIsPreviewLoading(true);

    try {
      const result = await generateNarration({
        text: SAMPLE_PREVIEW_TEXT,
        speaker_id: settings.voicevoxSpeakerId,
      });

      if (!result.success || !result.metadata?.audio_path) {
        throw new Error(result.error || "音声プレビューの生成に失敗しました");
      }

      const audio = new Audio(`asset://${result.metadata.audio_path}`);
      audio.onended = () => setIsPreviewPlaying(false);
      audioRef.current = audio;

      await audio.play();
      setIsPreviewPlaying(true);
    } catch (previewErr) {
      stopPreview();
      const message =
        previewErr instanceof Error
          ? previewErr.message
          : "音声プレビューでエラーが発生しました";
      setPreviewError(message);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [isPreviewPlaying, settings.voicevoxSpeakerId, stopPreview]);

  const formattedLastSaved =
    lastSavedAt != null ? new Date(lastSavedAt).toLocaleString() : "未保存";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto px-10 py-16 sm:px-16 lg:px-24">
        <div className="mx-auto max-w-4xl space-y-8 pb-24">
          <header className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-extralight tracking-tight text-gray-900 sm:text-5xl">
                    Settings
                  </h1>
                  {isDirty && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      未保存の変更あり
                    </span>
                  )}
                </div>
                <p className="mt-3 max-w-2xl text-sm font-light text-gray-500">
                  GitHub連携、VOICEVOX、外観設定をまとめて管理できます。変更は保存すると即座に適用されます。
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                <Info className="h-4 w-4" />
                <span>最終保存: {formattedLastSaved}</span>
              </div>
            </div>
            <div className="h-px w-24 bg-gray-200" />
          </header>

          {error && (
            <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              <AlertCircle className="mt-[2px] h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">エラーが発生しました</p>
                <p className="mt-1 font-light">{error}</p>
              </div>
            </div>
          )}

          <section className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white/60 p-8 shadow-sm backdrop-blur">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-light text-gray-900">GitHub Integration</h2>
                  <p className="text-sm font-light text-gray-500">
                    MiyabiエージェントがPRやIssueを操作するための認証情報です。
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-800">GitHub Token</label>
                  <input
                    type="password"
                    value={settings.githubToken}
                    disabled={isLoadingSettings || isSaving}
                    onChange={(event) => updateSetting("githubToken", event.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxx"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-light text-gray-900 transition hover:border-gray-300 focus:border-gray-900 focus:outline-none"
                  />
                  <p className="text-xs font-light text-gray-500">
                    Personal access token を{" "}
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline-offset-2 transition hover:text-blue-600 hover:underline"
                    >
                      github.com/settings/tokens
                    </a>{" "}
                    で作成して入力してください。
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-800">
                    GitHub Repository
                  </label>
                  <input
                    type="text"
                    value={settings.githubRepo}
                    disabled={isLoadingSettings || isSaving}
                    onChange={(event) => updateSetting("githubRepo", event.target.value)}
                    placeholder="owner/repository"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-light text-gray-900 transition hover:border-gray-300 focus:border-gray-900 focus:outline-none"
                  />
                  <p className="text-xs font-light text-gray-500">
                    例: <span className="font-medium text-gray-700">ShunsukeHayashi/Miyabi</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white/60 p-8 shadow-sm backdrop-blur">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-light text-gray-900">VOICEVOX Configuration</h2>
                  <p className="text-sm font-light text-gray-500">
                    ナレーション生成時に使用するデフォルトスピーカーと音声プレビューを確認できます。
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-800">Default Speaker</label>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <select
                      value={settings.voicevoxSpeakerId}
                      disabled={isLoadingSettings || isSaving || isPreviewLoading}
                      onChange={(event) =>
                        updateSetting("voicevoxSpeakerId", Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-light text-gray-900 transition hover:border-gray-300 focus:border-gray-900 focus:outline-none sm:max-w-sm"
                    >
                      {DEFAULT_SPEAKERS.map((speaker) => (
                        <option key={speaker.id} value={speaker.id}>
                          {speaker.name} (ID: {speaker.id})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={isPreviewLoading || isLoadingSettings}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPreviewLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          プレビュー生成中…
                        </>
                      ) : isPreviewPlaying ? (
                        <>
                          <Square className="h-4 w-4" />
                          停止
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          試聴
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-light text-gray-500">
                    VOICEVOXエンジンが起動済みである必要があります。試聴は短いサンプル文で生成されます。
                  </p>
                  {previewError && (
                    <p className="text-xs font-medium text-red-500">{previewError}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white/60 p-8 shadow-sm backdrop-blur">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-light text-gray-900">Appearance</h2>
                  <p className="text-sm font-light text-gray-500">
                    テーマを切り替えてアプリ全体の見た目を調整します。今後より細かなカスタマイズを追加予定です。
                  </p>
                </div>
              </div>

              <SegmentedControl
                options={THEME_OPTIONS}
                value={settings.theme}
                onChange={(theme) => updateSetting("theme", theme)}
                aria-label="テーマの切り替え"
              />

              <p className="mt-4 text-xs font-light text-gray-500">
                システム設定に合わせる場合は「System」を選択してください。
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white/60 p-8 shadow-sm backdrop-blur">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-light text-gray-900">About</h2>
                  <p className="text-sm font-light text-gray-500">
                    アプリケーションのバージョン情報と実行環境です。
                  </p>
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-6 text-sm font-light text-gray-700 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-gray-400">Application</span>
                  <span className="font-medium text-gray-900">Miyabi Desktop</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-gray-400">Version</span>
                  <span className="font-medium text-gray-900">0.1.0</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-gray-400">Framework</span>
                  <span className="font-medium text-gray-900">Tauri 2.0 + React</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-gray-400">Repository</span>
                  <span className="font-medium text-gray-900">{settings.githubRepo}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-10 py-4 sm:px-16 lg:px-24">
          <div className="text-xs font-light text-gray-500">
            変更内容を保存すると、Miyabiエージェントにすぐ反映されます。
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving || isLoadingSettings}
            className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition enabled:hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                保存中…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                変更を保存
              </>
            )}
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 w-full max-w-xs rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-lg shadow-gray-200/80">
          <div className="flex items-center gap-3 text-gray-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-4 w-4 text-emerald-600" />
            </span>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPanel;

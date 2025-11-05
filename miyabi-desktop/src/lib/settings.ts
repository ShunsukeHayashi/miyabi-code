import { safeInvoke, isTauriAvailable } from "./tauri-utils";

export type ThemePreference = "light" | "dark" | "system";

export interface PreferenceSettings {
  voicevoxSpeakerId: number;
  theme: ThemePreference;
  agentExecutionEnabled: boolean;
}

export interface AppSettings extends PreferenceSettings {
  githubToken: string;
  githubRepo: string;
}

export interface TokenValidationResult {
  ok: boolean;
  login?: string;
  scopes?: string[];
  error?: string;
  status?: number;
}

export interface RepositoryValidationResult {
  ok: boolean;
  defaultBranch?: string;
  htmlUrl?: string;
  error?: string;
  status?: number;
}

export const DEFAULT_REPOSITORY = "ShunsukeHayashi/Miyabi";
const LOCAL_STORAGE_KEY = "miyabi-settings";

const DEFAULT_PREFERENCES: PreferenceSettings = {
  voicevoxSpeakerId: 3,
  theme: "light",
  agentExecutionEnabled: true,
};

interface LegacyStoredSettings extends Partial<AppSettings> {
  updatedAt?: string;
}

function readLocalStorage(): LegacyStoredSettings {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      return {};
    }
    return JSON.parse(stored) as LegacyStoredSettings;
  } catch (error) {
    console.warn("[settings] Failed to parse local storage settings:", error);
    return {};
  }
}

function writeLocalStorage(preferences: PreferenceSettings): void {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return;
  }

  const payload = JSON.stringify({
    ...preferences,
    updatedAt: new Date().toISOString(),
  });

  window.localStorage.setItem(LOCAL_STORAGE_KEY, payload);
}

export function maskToken(token: string): string {
  if (!token) {
    return "";
  }
  if (token.length <= 6) {
    return "*".repeat(token.length);
  }
  const visible = token.slice(-4);
  return `${"*".repeat(token.length - 4)}${visible}`;
}

export function parseRepository(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  const segments = trimmed.split("/");
  if (segments.length !== 2) {
    return null;
  }
  const [owner, repo] = segments;
  if (!owner || !repo) {
    return null;
  }
  return { owner, repo };
}

export async function loadSettings(): Promise<AppSettings> {
  const legacy = readLocalStorage();

  const preferences: PreferenceSettings = {
    voicevoxSpeakerId:
      typeof legacy.voicevoxSpeakerId === "number"
        ? legacy.voicevoxSpeakerId
        : DEFAULT_PREFERENCES.voicevoxSpeakerId,
    theme:
      legacy.theme === "light" || legacy.theme === "dark" || legacy.theme === "system"
        ? legacy.theme
        : DEFAULT_PREFERENCES.theme,
    agentExecutionEnabled:
      typeof legacy.agentExecutionEnabled === "boolean"
        ? legacy.agentExecutionEnabled
        : DEFAULT_PREFERENCES.agentExecutionEnabled,
  };

  let githubToken = "";
  let githubRepo = DEFAULT_REPOSITORY;

  const envToken = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;
  const envRepo = import.meta.env.VITE_GITHUB_REPOSITORY as string | undefined;
  if (envToken) {
    githubToken = envToken;
  }
  if (envRepo) {
    githubRepo = envRepo;
  }

  if (legacy.githubToken) {
    githubToken = legacy.githubToken;
  }
  if (legacy.githubRepo) {
    githubRepo = legacy.githubRepo;
  }

  if (isTauriAvailable()) {
    try {
      const [storedToken, storedRepo] = await Promise.all([
        safeInvoke<string | null>("get_github_token", undefined, { suppressErrors: true }),
        safeInvoke<string | null>("get_github_repository", undefined, { suppressErrors: true }),
      ]);

      if (storedToken) {
        githubToken = storedToken;
      }
      if (storedRepo) {
        githubRepo = storedRepo;
      }
    } catch (error) {
      console.warn("[settings] Failed to load config from Tauri store:", error);
    }
  }

  return {
    githubToken,
    githubRepo,
    ...preferences,
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const { githubToken, githubRepo, ...preferences } = settings;

  if (isTauriAvailable()) {
    try {
      await Promise.all([
        safeInvoke("save_github_token", { token: githubToken }),
        safeInvoke("save_github_repository", { repository: githubRepo }),
      ]);
    } catch (error) {
      console.error("[settings] Failed to persist GitHub config via Tauri:", error);
      throw error;
    }

    writeLocalStorage(preferences);
  } else if (typeof window !== "undefined" && "localStorage" in window) {
    // Fallback to local storage in browser-only mode
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        ...settings,
        updatedAt: new Date().toISOString(),
      }),
    );
  }
}

export async function clearStoredSettings(): Promise<void> {
  if (isTauriAvailable()) {
    try {
      await safeInvoke("clear_config");
    } catch (error) {
      console.error("[settings] Failed to clear config via Tauri:", error);
      throw error;
    }
  }

  if (typeof window !== "undefined" && "localStorage" in window) {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

export async function validateGithubToken(token: string): Promise<TokenValidationResult> {
  if (!token) {
    return { ok: false, error: "GitHub token is required" };
  }

  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Miyabi-Desktop/0.1",
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        ok: false,
        status: response.status,
        error: typeof data.message === "string" ? data.message : "Failed to validate token",
      };
    }

    const data = await response.json();
    const scopesHeader = response.headers.get("x-oauth-scopes");
    const scopes = scopesHeader
      ? scopesHeader
          .split(",")
          .map((scope) => scope.trim())
          .filter(Boolean)
      : undefined;

    return {
      ok: true,
      login: data?.login,
      scopes,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error validating token",
    };
  }
}

export async function validateGithubRepository(
  token: string,
  repository: string,
): Promise<RepositoryValidationResult> {
  const parsed = parseRepository(repository);
  if (!parsed) {
    return { ok: false, error: "Repository must follow owner/name format" };
  }

  try {
    const url = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Miyabi-Desktop/0.1",
        ...(token ? { Authorization: `token ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        ok: false,
        status: response.status,
        error: typeof data.message === "string" ? data.message : "Failed to validate repository",
      };
    }

    const data = await response.json();

    return {
      ok: true,
      defaultBranch: data?.default_branch,
      htmlUrl: data?.html_url,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unknown error validating repository connection",
    };
  }
}

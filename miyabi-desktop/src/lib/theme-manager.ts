import type { ThemePreference } from "./settings";

type ResolvedTheme = "light" | "dark";

const SETTINGS_STORAGE_KEY = "miyabi-settings";

let currentPreference: ThemePreference = "light";
let mediaQuery: MediaQueryList | null = null;

function readStoredPreference(): ThemePreference | null {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<{ theme: ThemePreference }>;
    if (parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system") {
      return parsed.theme;
    }
  } catch (error) {
    console.warn("[theme] Failed to read stored preference:", error);
  }
  return null;
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") {
    if (typeof window !== "undefined" && "matchMedia" in window) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  }
  return preference;
}

function applyResolvedTheme(theme: ResolvedTheme) {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.style.setProperty("color-scheme", theme);
}

function handleSystemChange(event: MediaQueryListEvent) {
  if (currentPreference === "system") {
    applyResolvedTheme(event.matches ? "dark" : "light");
  }
}

function bindSystemListener() {
  if (typeof window === "undefined" || !("matchMedia" in window)) {
    return;
  }
  releaseSystemListener();
  if (currentPreference !== "system") {
    return;
  }
  mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", handleSystemChange);
}

function releaseSystemListener() {
  if (mediaQuery) {
    mediaQuery.removeEventListener("change", handleSystemChange);
    mediaQuery = null;
  }
}

function handleStorageSync(event: StorageEvent) {
  if (event.key !== SETTINGS_STORAGE_KEY || event.newValue === event.oldValue || !event.newValue) {
    return;
  }
  try {
    const parsed = JSON.parse(event.newValue) as Partial<{ theme: ThemePreference }>;
    if (parsed.theme && parsed.theme !== currentPreference) {
      setThemePreference(parsed.theme);
    }
  } catch (error) {
    console.warn("[theme] Failed to parse storage update:", error);
  }
}

export function initializeTheme(initialPreference?: ThemePreference) {
  if (typeof window === "undefined") {
    return;
  }

  currentPreference =
    initialPreference ??
    readStoredPreference() ??
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  applyResolvedTheme(resolveTheme(currentPreference));
  bindSystemListener();

  window.addEventListener("storage", handleStorageSync);
}

export function setThemePreference(preference: ThemePreference) {
  currentPreference = preference;
  bindSystemListener();
  applyResolvedTheme(resolveTheme(preference));
}

export function getCurrentThemePreference(): ThemePreference {
  return currentPreference;
}

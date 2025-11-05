import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

type Listener = (payload: unknown) => void;
const listeners = new Map<string, Set<Listener>>();

vi.mock("@tauri-apps/api/core", () => {
  return {
    invoke: vi.fn(async () => undefined),
  };
});

vi.mock("@tauri-apps/api/event", () => {
  return {
    listen: vi.fn(async (event: string, handler: (event: { payload: unknown }) => void) => {
      const callbacks = listeners.get(event) ?? new Set<Listener>();
      const listener: Listener = (payload) => handler({ payload });
      callbacks.add(listener);
      listeners.set(event, callbacks);
      return async () => {
        callbacks.delete(listener);
        if (callbacks.size === 0) {
          listeners.delete(event);
        }
      };
    }),
    emit: vi.fn(async (event: string, payload: unknown) => {
      const callbacks = listeners.get(event);
      if (!callbacks) return;
      for (const callback of callbacks) {
        callback(payload);
      }
    }),
  };
});

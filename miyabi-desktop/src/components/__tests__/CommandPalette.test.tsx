import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CommandPalette } from "../CommandPalette";

describe("CommandPalette", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders navigation commands for each primary view", () => {
    render(
      <CommandPalette isOpen onClose={() => {}} onNavigate={() => {}} />
    );

    expect(screen.getByText("ダッシュボード概要")).toBeTruthy();
    expect(screen.getByText("tmuxモニタ")).toBeTruthy();
    expect(screen.getByText("Worktrees")).toBeTruthy();
    expect(screen.getByText("Issue ダッシュボード")).toBeTruthy();
    expect(screen.getByText("アプリ設定")).toBeTruthy();
  });

  it("navigates when a command is selected", () => {
    const handleNavigate = vi.fn();
    const handleClose = vi.fn();

    render(
      <CommandPalette
        isOpen
        onClose={handleClose}
        onNavigate={handleNavigate}
      />
    );

    const monitorButton = screen.getByText("tmuxモニタ").closest("button");
    expect(monitorButton).toBeTruthy();

    fireEvent.click(monitorButton!);

    expect(handleNavigate).toHaveBeenCalledWith("monitor");
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

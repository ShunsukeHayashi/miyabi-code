import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { spawnTerminal, writeToTerminal, listenToTerminalOutput } from '../lib/tauri-api';
import { getThemeByName } from '../lib/themes';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  tabId: string;
  fontSize?: number;
  colorScheme?: string;
}

export function Terminal({ tabId, fontSize = 13, colorScheme = 'dark' }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [_sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const selectedTheme = getThemeByName(colorScheme);
    const term = new XTerm({
      cursorBlink: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: fontSize,
      lineHeight: 1.2,
      theme: selectedTheme.theme,
      scrollback: 10000,
      allowTransparency: false,
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    // Open terminal
    term.open(terminalRef.current);
    fitAddon.fit();

    // Store refs
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Spawn PTY session
    let stopListening: (() => void) | undefined;
    const initTerminal = async () => {
      try {
        const session = await spawnTerminal(term.cols, term.rows);
        if (!session) {
          term.writeln('\x1b[1;33mNo PTY session available. Ensure the Tauri backend is running.\x1b[0m');
          return;
        }
        setSessionId(session.id);

        // Listen to output from PTY
        stopListening = await listenToTerminalOutput(session.id, (data) => {
          term.write(data);
        });

        // Handle user input
        term.onData((data) => {
          if (session.id) {
            writeToTerminal(session.id, data).catch((err) => {
              console.error('Failed to write to terminal:', err);
            });
          }
        });
      } catch (error) {
        console.error('Failed to spawn terminal:', error);
        term.writeln('\x1b[1;31mFailed to spawn terminal session\x1b[0m');
        term.writeln(`\x1b[90m${error}\x1b[0m`);
      }
    };

    initTerminal();

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      stopListening?.();
      term.dispose();
    };
  }, [tabId]); // Re-initialize when tab changes

  // Update font size when it changes
  useEffect(() => {
    if (xtermRef.current && fontSize) {
      xtermRef.current.options.fontSize = fontSize;
      fitAddonRef.current?.fit();
    }
  }, [fontSize]);

  // Update color scheme when it changes
  useEffect(() => {
    if (xtermRef.current && colorScheme) {
      const selectedTheme = getThemeByName(colorScheme);
      xtermRef.current.options.theme = selectedTheme.theme;
    }
  }, [colorScheme]);

  return (
    <div
      ref={terminalRef}
      className="h-full w-full overflow-hidden rounded-lg bg-[var(--color-terminal-bg)] p-6 shadow-brand-md"
    />
  );
}

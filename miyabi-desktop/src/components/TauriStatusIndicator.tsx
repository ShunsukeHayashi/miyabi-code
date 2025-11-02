import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { isTauriAvailable, getTauriStatusMessage } from '../lib/tauri-utils';

export function TauriStatusIndicator() {
  const [isTauri, setIsTauri] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setIsTauri(isTauriAvailable());
    setMessage(getTauriStatusMessage());
  }, []);

  // Don't show anything if Tauri is available (normal mode)
  if (isTauri) {
    return null;
  }

  // Show warning banner when running in browser mode
  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
      <div className="container mx-auto flex items-center gap-3 text-sm">
        <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
        <div className="flex-1">
          <span className="text-yellow-900 font-medium">Development Mode: </span>
          <span className="text-yellow-800">{message}</span>
        </div>
        <code className="text-xs bg-yellow-100 text-yellow-900 px-2 py-1 rounded font-mono">
          npm run tauri dev
        </code>
      </div>
    </div>
  );
}

/**
 * Minimal status badge for header
 */
export function TauriStatusBadge() {
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    setIsTauri(isTauriAvailable());
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs">
      {isTauri ? (
        <>
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span className="text-green-700 font-medium">Tauri</span>
        </>
      ) : (
        <>
          <AlertCircle className="w-3 h-3 text-yellow-500" />
          <span className="text-yellow-700 font-medium">Browser</span>
        </>
      )}
    </div>
  );
}

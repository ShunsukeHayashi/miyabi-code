import { safeInvoke } from './tauri-utils';
import type { WorktreeGraph } from '../types/worktrees';

export async function fetchWorktreeGraph(): Promise<WorktreeGraph | null> {
  return await safeInvoke<WorktreeGraph>('worktrees:graph');
}

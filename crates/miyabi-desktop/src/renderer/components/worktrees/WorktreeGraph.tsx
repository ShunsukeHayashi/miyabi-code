import { templateExtend, Orientation } from '@gitgraph/core';
import { Gitgraph } from '@gitgraph/react';
import type { CommitOptions, BranchUserApi } from '@gitgraph/react';
import type { WorktreeGraphData } from '../../types/electron';

const statusColors = {
  active: '#1f6feb',
  idle: '#8b949e',
  stuck: '#f85149',
};

const template = templateExtend('metro', {
  colors: ['#1f6feb', '#2ea043', '#d29922', '#f85149', '#8b949e'],
  branch: {
    lineWidth: 4,
    spacing: 30,
    label: {
      display: true,
      font: '12px "Inter"',
    },
  },
  commit: {
    spacing: 50,
    hasTooltipInCompactMode: true,
    dot: {
      size: 6,
    },
    message: {
      displayAuthor: false,
      displayBranch: false,
      displayHash: false,
      font: '12px "Inter"',
    },
  },
});

interface WorktreeGraphProps {
  data: WorktreeGraphData;
  onSelectWorktree?: (id: string) => void;
}

export function WorktreeGraph({ data, onSelectWorktree }: WorktreeGraphProps) {
  return (
    <div className="bg-background-light border border-background-lighter rounded-lg p-4 overflow-auto">
      <div className="min-w-[640px] h-[460px]">
        <Gitgraph
          options={{
            template,
            orientation: Orientation.Horizontal,
            author: '',
          }}
        >
          {(gitgraph) => {
            const branchMap = new Map<string, BranchUserApi>();

            const getBranch = (name: string): BranchUserApi => {
              let branch = branchMap.get(name);
              if (!branch) {
                branch = gitgraph.branch({ name });
                branchMap.set(name, branch);
              }
              return branch;
            };

            const commits = [...data.commits].reverse();
            commits.forEach((commit) => {
              const branchName = commit.branches[0] ?? 'main';
              const branch = getBranch(branchName);
              const color = commit.worktree ? statusColors[commit.worktree.status] : undefined;

              const options: CommitOptions<SVGElement> = {
                subject: commit.message,
                hash: commit.sha.slice(0, 7),
                style: commit.isWorktreeHead
                  ? {
                      dot: {
                        color: color ?? '#1f6feb',
                        size: 8,
                      },
                      message: {
                        color: color ?? '#1f6feb',
                      },
                    }
                  : undefined,
                onMessageClick: commit.worktree
                  ? () => onSelectWorktree?.(commit.worktree!.id)
                  : undefined,
              };

              const commitApi = branch.commit(options);

              if (commit.isWorktreeHead && commit.worktree) {
                commitApi.tag({
                  name: `${commit.worktree.branch} (${commit.worktree.status})`,
                  style: {
                    bgColor: color ?? '#1f6feb',
                    color: '#0d1117',
                  },
                });
              }
            });
          }}
        </Gitgraph>
      </div>
    </div>
  );
}

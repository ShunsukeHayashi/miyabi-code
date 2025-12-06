/**
 * A2A Agent Status Utility
 * 各エージェントの状態を表示するユーティリティ
 */

interface Agent {
  id: string;
  name: string;
  pane: string;
  role: string;
  status: "active" | "idle" | "busy" | "error";
}

const agents: Agent[] = [
  { id: "shikiroon", name: "指揮論", pane: "%18", role: "Conductor", status: "active" },
  { id: "kaede", name: "楓", pane: "%19", role: "CodeGen", status: "active" },
  { id: "sakura", name: "桜", pane: "%20", role: "Review", status: "idle" },
  { id: "tsubaki", name: "椿", pane: "%21", role: "PR", status: "idle" },
  { id: "botan", name: "牡丹", pane: "%22", role: "Deploy", status: "idle" },
  { id: "mitsukeroon", name: "見付論", pane: "%23", role: "Issue", status: "idle" },
];

function getStatusEmoji(status: Agent["status"]): string {
  const emojis = {
    active: "🟢",
    idle: "⚪",
    busy: "🟡",
    error: "🔴",
  };
  return emojis[status];
}

function displayAgentStatus(agent: Agent): void {
  console.log(
    `${getStatusEmoji(agent.status)} ${agent.pane} ${agent.name} (${agent.role}): ${agent.status}`
  );
}

function displayAllAgents(): void {
  console.log("=== A2A Agent Status ===");
  console.log("");
  agents.forEach(displayAgentStatus);
  console.log("");
  console.log(`Total: ${agents.length} agents`);
}

// メイン実行
displayAllAgents();
console.log("");
console.log("[楓→指揮論] 完了: エージェント状態表示");

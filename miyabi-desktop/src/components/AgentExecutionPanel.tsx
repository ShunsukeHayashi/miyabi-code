import { useState, useEffect, useRef } from "react";
import { Play, AlertCircle, CheckCircle, Clock, RefreshCw, ExternalLink, Terminal, GitBranch, FileText } from "lucide-react";
import {
  AgentType,
  AgentExecutionStatus,
  AgentExecutionResult,
  AVAILABLE_AGENTS,
  executeAgent,
  listenToAgentStatus,
  listenToAgentOutput,
  getAgentsByCategory,
} from "../lib/agent-api";
import { listIssues, type GitHubIssue } from "../lib/github-api";

interface AgentExecution {
  executionId: string;
  agentType: AgentType;
  status: AgentExecutionStatus;
  exitCode?: number;
  durationMs?: number;
  output: string[];
  startTime: number;
}

export function AgentExecutionPanel() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [issueNumber, setIssueNumber] = useState<string>("");
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [activeExecution, setActiveExecution] = useState<AgentExecution | null>(null);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const outputEndRef = useRef<HTMLDivElement>(null);

  // Load open issues on mount
  useEffect(() => {
    loadOpenIssues();
  }, []);

  const loadOpenIssues = async () => {
    setLoadingIssues(true);
    try {
      const openIssues = await listIssues("open", []);
      setIssues(openIssues);
    } catch (error) {
      console.error("Failed to load issues:", error);
    } finally {
      setLoadingIssues(false);
    }
  };

  // Listen to agent status updates
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      unlisten = await listenToAgentStatus((result: AgentExecutionResult) => {
        setExecutions((prev) => {
          const existingIndex = prev.findIndex(
            (e) => e.executionId === result.execution_id
          );

          const execution: AgentExecution = {
            executionId: result.execution_id,
            agentType: result.agent_type,
            status: result.status,
            exitCode: result.exit_code,
            durationMs: result.duration_ms,
            output: result.output,
            startTime: Date.now() - (result.duration_ms || 0),
          };

          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = execution;
            return updated;
          } else {
            return [...prev, execution];
          }
        });

        // Update active execution
        setActiveExecution((prev) => {
          if (prev && prev.executionId === result.execution_id) {
            return {
              ...prev,
              status: result.status,
              exitCode: result.exit_code,
              durationMs: result.duration_ms,
            };
          }
          return prev;
        });
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Listen to active execution output
  useEffect(() => {
    if (!activeExecution) return;

    let unlisten: (() => void) | null = null;

    const setupOutputListener = async () => {
      console.log('[DEBUG] Setting up output listener for execution:', activeExecution.executionId);
      unlisten = await listenToAgentOutput(
        activeExecution.executionId,
        (line: string) => {
          console.log('[DEBUG] Received agent output:', line);
          setActiveExecution((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              output: [...prev.output, line],
            };
          });
        }
      );
      console.log('[DEBUG] Output listener setup complete');
    };

    setupOutputListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [activeExecution?.executionId]);

  // Auto-scroll output to bottom
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeExecution?.output]);

  const handleExecuteAgent = async () => {
    if (!selectedAgent) return;

    try {
      // Create a promise to capture the execution_id from the status event
      const executionIdPromise = new Promise<string>((resolve) => {
        const unlisten = listenToAgentStatus((result: AgentExecutionResult) => {
          if (result.status === "starting" || result.status === "running") {
            console.log('[DEBUG] Received execution_id from status event:', result.execution_id);
            resolve(result.execution_id);
            unlisten(); // Clean up listener after we get the ID
          }
        });
      });

      // Execute agent (this will trigger the "starting" status event)
      const executePromise = executeAgent({
        agent_type: selectedAgent,
        issue_number: issueNumber ? parseInt(issueNumber) : undefined,
        args: [],
      });

      // Wait for execution_id from status event
      const executionId = await executionIdPromise;

      // Immediately register output listener with the real execution_id
      const unlistenOutput = await listenToAgentOutput(
        executionId,
        (line: string) => {
          console.log('[DEBUG] Received agent output:', line);
          setActiveExecution((prev) => {
            if (!prev || prev.executionId !== executionId) return prev;
            return {
              ...prev,
              output: [...prev.output, line],
            };
          });
        }
      );
      console.log('[DEBUG] Output listener registered for:', executionId);

      // Set initial execution state
      setActiveExecution({
        executionId: executionId,
        agentType: selectedAgent,
        status: "running",
        output: [],
        startTime: Date.now(),
      });

      // Wait for execution to complete
      const result = await executePromise;

      // Update execution with final result
      setActiveExecution((prev) => ({
        ...prev!,
        status: result.status,
        exitCode: result.exit_code,
        durationMs: result.duration_ms,
      }));

      // Clean up listener after a delay to ensure all output is captured
      setTimeout(() => {
        if (unlistenOutput) unlistenOutput();
      }, 1000);
    } catch (error) {
      console.error("Failed to execute agent:", error);
      setActiveExecution((prev) =>
        prev ? { ...prev, status: "failed" } : null
      );
    }
  };

  const codingAgents = getAgentsByCategory("coding");
  const selectedAgentMetadata = AVAILABLE_AGENTS.find(
    (a) => a.type === selectedAgent
  );

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Agent Selection */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-light text-gray-900 mb-2">エージェント</h2>
          <p className="text-sm font-light text-gray-500 mb-4">
            実行するエージェントを選択
          </p>

          {/* Quick Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1">
            <p className="font-medium mb-1">💡 使い方</p>
            <p>1. 下からエージェントを選択</p>
            <p>2. Issue番号を選択（任意）</p>
            <p>3. 「Execute Agent」をクリック</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {codingAgents.map((agent) => (
            <button
              key={agent.type}
              onClick={() => setSelectedAgent(agent.type)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                selectedAgent === agent.type
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-900 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: agent.color }}
                ></div>
                <span className="font-light">{agent.characterName}</span>
              </div>
              <p className="text-xs font-light opacity-80">
                {agent.description}
              </p>
            </button>
          ))}
        </div>

        {/* Execution Controls */}
        <div className="p-6 border-t border-gray-200 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-light text-gray-700">
                Select Issue (optional)
              </label>
              <button
                onClick={loadOpenIssues}
                disabled={loadingIssues}
                className="p-1 text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-50"
                title="Refresh issues"
              >
                <RefreshCw size={14} className={loadingIssues ? "animate-spin" : ""} />
              </button>
            </div>
            <select
              value={issueNumber}
              onChange={(e) => setIssueNumber(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 text-sm font-light transition-all duration-200"
            >
              <option value="">No Issue (Auto-select)</option>
              {issues.map((issue) => (
                <option key={issue.number} value={issue.number.toString()}>
                  #{issue.number} - {issue.title.slice(0, 40)}
                  {issue.title.length > 40 ? "..." : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs font-light text-gray-500">
              {issues.length} open issues
            </p>
          </div>

          <button
            onClick={handleExecuteAgent}
            disabled={!selectedAgent || activeExecution?.status === "running"}
            className={`w-full px-6 py-3 rounded-xl font-light transition-all duration-200 flex items-center justify-center space-x-2 ${
              !selectedAgent || activeExecution?.status === "running"
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            <Play size={18} />
            <span>Execute Agent</span>
          </button>
        </div>
      </div>

      {/* Right Panel - Execution Output */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-light text-gray-900 mb-1">
                {selectedAgentMetadata?.displayName || "No Agent Selected"}
              </h2>
              {activeExecution && (
                <div className="flex items-center space-x-4 text-sm font-light text-gray-500">
                  <span className="flex items-center space-x-1">
                    {activeExecution.status === "running" && (
                      <>
                        <Clock size={14} />
                        <span>Running...</span>
                      </>
                    )}
                    {activeExecution.status === "success" && (
                      <>
                        <CheckCircle size={14} className="text-green-500" />
                        <span>Success</span>
                      </>
                    )}
                    {activeExecution.status === "failed" && (
                      <>
                        <AlertCircle size={14} className="text-red-500" />
                        <span>Failed</span>
                      </>
                    )}
                  </span>
                  {activeExecution.durationMs && (
                    <span>
                      {(activeExecution.durationMs / 1000).toFixed(2)}s
                    </span>
                  )}
                  {activeExecution.exitCode !== undefined && (
                    <span>Exit code: {activeExecution.exitCode}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Output Display */}
        <div className="flex-1 overflow-y-auto bg-gray-900 p-6 font-mono text-sm text-gray-100">
          {activeExecution ? (
            <>
              {activeExecution.output.length > 0 ? (
                <>
                  {activeExecution.output.map((line, index) => (
                    <div key={index} className="mb-1">
                      {line}
                    </div>
                  ))}
                  <div ref={outputEndRef} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-8 p-8">
                  {/* Status Icon and Message */}
                  <div className="text-center space-y-4">
                    {activeExecution.status === "running" && (
                      <>
                        <div className="w-16 h-16 mx-auto">
                          <Clock size={64} className="text-blue-400 animate-pulse" />
                        </div>
                        <p className="text-2xl font-light text-blue-400">
                          実行中...
                        </p>
                        <p className="text-sm text-gray-500">
                          エージェントがタスクを処理しています
                        </p>
                      </>
                    )}
                    {activeExecution.status === "success" && (
                      <>
                        <div className="w-16 h-16 mx-auto">
                          <CheckCircle size={64} className="text-green-400" />
                        </div>
                        <p className="text-2xl font-light text-green-400">
                          実行完了
                        </p>
                        <p className="text-sm text-gray-500">
                          {activeExecution.durationMs && (
                            <>実行時間: {(activeExecution.durationMs / 1000).toFixed(1)}秒</>
                          )}
                        </p>
                      </>
                    )}
                    {activeExecution.status === "failed" && (
                      <>
                        <div className="w-16 h-16 mx-auto">
                          <AlertCircle size={64} className="text-red-400" />
                        </div>
                        <p className="text-2xl font-light text-red-400">
                          実行失敗
                        </p>
                        {activeExecution.exitCode && (
                          <p className="text-sm text-red-400">
                            Exit code: {activeExecution.exitCode}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Action Buttons for Completed Executions */}
                  {(activeExecution.status === "success" || activeExecution.status === "failed") && (
                    <div className="w-full max-w-md space-y-3">
                      <p className="text-sm text-gray-500 text-center mb-4">
                        実行結果を確認:
                      </p>

                      <button
                        onClick={() => {
                          const repo = localStorage.getItem("miyabi-settings");
                          const repoName = repo ? JSON.parse(repo).githubRepo : "ShunsukeHayashi/Miyabi";
                          window.open(`https://github.com/${repoName}/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc`, "_blank");
                        }}
                        className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-200 text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <ExternalLink size={20} className="text-blue-400" />
                          <div>
                            <div className="text-sm font-light text-gray-100">GitHubを開く</div>
                            <div className="text-xs text-gray-500">Issue/PRの更新を確認</div>
                          </div>
                        </div>
                        <span className="text-gray-600">→</span>
                      </button>

                      <button
                        onClick={() => {
                          // TODO: Switch to terminal panel
                          alert("ターミナルパネルに切り替えて詳細ログを確認してください");
                        }}
                        className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-200 text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <Terminal size={20} className="text-purple-400" />
                          <div>
                            <div className="text-sm font-light text-gray-100">詳細ログ</div>
                            <div className="text-xs text-gray-500">ターミナルで確認</div>
                          </div>
                        </div>
                        <span className="text-gray-600">→</span>
                      </button>

                      <button
                        onClick={() => {
                          const repo = localStorage.getItem("miyabi-settings");
                          const repoName = repo ? JSON.parse(repo).githubRepo : "ShunsukeHayashi/Miyabi";
                          window.open(`https://github.com/${repoName}/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc`, "_blank");
                        }}
                        className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-200 text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <GitBranch size={20} className="text-green-400" />
                          <div>
                            <div className="text-sm font-light text-gray-100">Pull Requests</div>
                            <div className="text-xs text-gray-500">作成されたPRを確認</div>
                          </div>
                        </div>
                        <span className="text-gray-600">→</span>
                      </button>

                      {issueNumber && (
                        <button
                          onClick={() => {
                            const repo = localStorage.getItem("miyabi-settings");
                            const repoName = repo ? JSON.parse(repo).githubRepo : "ShunsukeHayashi/Miyabi";
                            window.open(`https://github.com/${repoName}/issues/${issueNumber}`, "_blank");
                          }}
                          className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-200 text-left"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText size={20} className="text-yellow-400" />
                            <div>
                              <div className="text-sm font-light text-gray-100">Issue #{issueNumber}</div>
                              <div className="text-xs text-gray-500">対象Issueを開く</div>
                            </div>
                          </div>
                          <span className="text-gray-600">→</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p className="text-lg font-light">
                Select an agent and click Execute to start
              </p>
            </div>
          )}
        </div>

        {/* Execution History */}
        {executions.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-light text-gray-700">
                実行履歴
              </h3>
              <span className="text-xs text-gray-500">
                {executions.length}件
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {executions
                .slice()
                .reverse()
                .map((execution) => {
                  const agent = AVAILABLE_AGENTS.find(
                    (a) => a.type === execution.agentType
                  );
                  const isActive = activeExecution?.executionId === execution.executionId;

                  return (
                    <div
                      key={execution.executionId}
                      onClick={() => setActiveExecution(execution)}
                      className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        isActive
                          ? "bg-gray-900 text-white shadow-lg"
                          : "bg-white text-gray-900 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: agent?.color }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-light truncate ${isActive ? "text-white" : "text-gray-900"}`}>
                            {agent?.characterName}
                          </div>
                          <div className={`text-xs truncate ${isActive ? "text-gray-400" : "text-gray-500"}`}>
                            {new Date(execution.startTime).toLocaleTimeString("ja-JP", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                      <div className={`flex items-center space-x-3 flex-shrink-0 ${isActive ? "text-gray-400" : "text-gray-500"}`}>
                        {execution.status === "running" && (
                          <Clock size={14} className="text-blue-400 animate-pulse" />
                        )}
                        {execution.status === "success" && (
                          <CheckCircle size={14} className="text-green-400" />
                        )}
                        {execution.status === "failed" && (
                          <AlertCircle size={14} className="text-red-400" />
                        )}
                        {execution.durationMs && (
                          <span className="text-xs font-light">
                            {(execution.durationMs / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default AgentExecutionPanel;

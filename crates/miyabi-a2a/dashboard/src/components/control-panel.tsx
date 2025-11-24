import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Switch,
  Select,
  SelectItem,
  Divider,
  Chip,
  Card,
  CardBody,
} from "@heroui/react";
import { Icon } from "@iconify/react";

interface ControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ isOpen, onClose }) => {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = React.useState(true);
  const [refreshInterval, setRefreshInterval] = React.useState("5");
  const [agentsPaused, setAgentsPaused] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState<{
    title: string;
    message: string;
    action: () => void;
  } | null>(null);

  const handlePauseAllAgents = () => {
    setShowConfirmDialog({
      title: "Pause All Agents?",
      message: "This will pause all running agents. Ongoing tasks will be interrupted.",
      action: () => {
        console.log("[Control Panel] Pausing all agents");
        setAgentsPaused(true);
        setShowConfirmDialog(null);
        // TODO: API call to pause agents
      },
    });
  };

  const handleResumeAllAgents = () => {
    console.log("[Control Panel] Resuming all agents");
    setAgentsPaused(false);
    // TODO: API call to resume agents
  };

  const handleRestartAgent = (agentId: string) => {
    setShowConfirmDialog({
      title: `Restart ${agentId}?`,
      message: "This will restart the selected agent. Current tasks may be interrupted.",
      action: () => {
        console.log(`[Control Panel] Restarting agent: ${agentId}`);
        setShowConfirmDialog(null);
        // TODO: API call to restart agent
      },
    });
  };

  const handleClearTaskQueue = () => {
    setShowConfirmDialog({
      title: "Clear Task Queue?",
      message: "This will remove all pending tasks. This action cannot be undone.",
      action: () => {
        console.log("[Control Panel] Clearing task queue");
        setShowConfirmDialog(null);
        // TODO: API call to clear queue
      },
    });
  };

  const handleExportSystemState = () => {
    console.log("[Control Panel] Exporting system state");

    const systemState = {
      timestamp: new Date().toISOString(),
      agents: [], // TODO: Fetch from API
      tasks: [],  // TODO: Fetch from API
      metrics: {}, // TODO: Fetch from API
    };

    const blob = new Blob([JSON.stringify(systemState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `miyabi-system-state-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportWorkflow = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const workflow = JSON.parse(event.target?.result as string);
            console.log("[Control Panel] Imported workflow:", workflow);
            // TODO: API call to import workflow
          } catch (error) {
            console.error("[Control Panel] Failed to parse workflow file:", error);
            alert("Invalid workflow file");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        size="3xl"
        scrollBehavior="inside"
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
          <ModalHeader className="flex items-center gap-2">
            <Icon icon="lucide:settings" className="h-5 w-5 text-miyabi-primary" />
            <span>System Controls</span>
          </ModalHeader>

          <ModalBody>
            <div className="space-y-6">
              {/* Auto-refresh Controls */}
              <Card>
                <CardBody className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Icon icon="lucide:refresh-cw" className="h-5 w-5 text-miyabi-primary" />
                        Auto-refresh
                      </h3>
                      <p className="text-sm text-foreground-500 mt-1">
                        Automatically refresh dashboard data
                      </p>
                    </div>
                    <Switch
                      isSelected={autoRefreshEnabled}
                      onValueChange={setAutoRefreshEnabled}
                      color="primary"
                      aria-label="Auto-refresh toggle"
                    />
                  </div>

                  {autoRefreshEnabled && (
                    <Select
                      label="Refresh Interval"
                      placeholder="Select interval"
                      selectedKeys={[refreshInterval]}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;
                        setRefreshInterval(value);
                      }}
                      variant="bordered"
                      size="sm"
                    >
                      <SelectItem key="5">5 seconds</SelectItem>
                      <SelectItem key="10">10 seconds</SelectItem>
                      <SelectItem key="30">30 seconds</SelectItem>
                      <SelectItem key="60">1 minute</SelectItem>
                    </Select>
                  )}
                </CardBody>
              </Card>

              <Divider />

              {/* Agent Management */}
              <Card>
                <CardBody className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Icon icon="lucide:users" className="h-5 w-5 text-miyabi-info" />
                        Agent Management
                      </h3>
                      <p className="text-sm text-foreground-500 mt-1">
                        Control agent execution and status
                      </p>
                    </div>
                    <Chip
                      color={agentsPaused ? "warning" : "success"}
                      variant="flat"
                      size="sm"
                    >
                      {agentsPaused ? "Paused" : "Running"}
                    </Chip>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {agentsPaused ? (
                      <Button
                        color="success"
                        variant="flat"
                        fullWidth
                        startContent={<Icon icon="lucide:play" className="h-4 w-4" />}
                        onPress={handleResumeAllAgents}
                      >
                        Resume All
                      </Button>
                    ) : (
                      <Button
                        color="warning"
                        variant="flat"
                        fullWidth
                        startContent={<Icon icon="lucide:pause" className="h-4 w-4" />}
                        onPress={handlePauseAllAgents}
                      >
                        Pause All
                      </Button>
                    )}

                    <Select
                      label="Restart Agent"
                      placeholder="Select agent"
                      variant="bordered"
                      size="sm"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleRestartAgent(e.target.value);
                        }
                      }}
                      startContent={<Icon icon="lucide:refresh-ccw" className="h-4 w-4" />}
                    >
                      <SelectItem key="coordinator">🔴 しきるん (Coordinator)</SelectItem>
                      <SelectItem key="codegen">🟢 つくるん (CodeGen)</SelectItem>
                      <SelectItem key="review">🟢 めだまん (Review)</SelectItem>
                      <SelectItem key="deploy">🟡 はこぶん (Deploy)</SelectItem>
                      <SelectItem key="docs">🟡 まとめるん (Docs)</SelectItem>
                    </Select>
                  </div>
                </CardBody>
              </Card>

              <Divider />

              {/* Advanced Operations */}
              <Card>
                <CardBody className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Icon icon="lucide:wrench" className="h-5 w-5 text-miyabi-warning" />
                      Advanced Operations
                    </h3>
                    <p className="text-sm text-foreground-500 mt-1">
                      Dangerous operations requiring confirmation
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      color="danger"
                      variant="flat"
                      fullWidth
                      startContent={<Icon icon="lucide:trash-2" className="h-4 w-4" />}
                      onPress={handleClearTaskQueue}
                    >
                      Clear Task Queue
                    </Button>

                    <Button
                      color="primary"
                      variant="flat"
                      fullWidth
                      startContent={<Icon icon="lucide:download" className="h-4 w-4" />}
                      onPress={handleExportSystemState}
                    >
                      Export System State
                    </Button>

                    <Button
                      color="primary"
                      variant="flat"
                      fullWidth
                      startContent={<Icon icon="lucide:upload" className="h-4 w-4" />}
                      onPress={handleImportWorkflow}
                    >
                      Import Workflow
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Info Notice */}
              <div className="flex items-start gap-2 rounded-md bg-content2 p-3">
                <Icon icon="lucide:info" className="h-5 w-5 text-miyabi-info flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Dangerous operations will require confirmation. All actions are logged for audit purposes.
                </p>
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <Modal
          isOpen={true}
          onOpenChange={(open) => {
            if (!open) setShowConfirmDialog(null);
          }}
          size="md"
          placement="center"
        >
          <ModalContent>
            {(onClose) => (
              <>
            <ModalHeader className="flex items-center gap-2">
              <Icon icon="lucide:alert-triangle" className="h-5 w-5 text-miyabi-warning" />
              <span>{showConfirmDialog.title}</span>
            </ModalHeader>
            <ModalBody>
              <p>{showConfirmDialog.message}</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="danger"
                onPress={showConfirmDialog.action}
              >
                Confirm
              </Button>
            </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

import React from "react";
import { Card, CardBody, Button, Chip, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useErrorDashboard } from "../hooks/use-error-dashboard";

export const ErrorDashboard: React.FC = () => {
  const { criticalErrors, warnings, clearError, retryTask, cancelWorkflow } = useErrorDashboard();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(
    "Notification" in window && Notification.permission === "granted"
  );

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications");
      return;
    }

    if (Notification.permission === "granted") {
      setNotificationsEnabled(true);
      return;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
        new Notification("🔔 Notifications Enabled", {
          body: "You will now receive alerts for critical errors",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Critical Errors */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Icon icon="lucide:alert-circle" className="h-5 w-5 text-miyabi-error" />
          <h2 className="text-xl font-semibold">Critical Errors ({criticalErrors.length})</h2>
        </div>
        
        {criticalErrors.length > 0 ? (
          <Card>
            <CardBody className="p-0">
              <ul className="divide-y divide-divider">
                {criticalErrors.map((error) => (
                  <li key={error.id} className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-miyabi-error">{error.message}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-sm text-foreground-500">
                            Agent: {error.agentName}
                          </span>
                          <span className="text-sm text-foreground-500">
                            Time: {error.timestamp}
                          </span>
                          {error.taskId && (
                            <Chip size="sm" variant="flat" color="danger">
                              Task #{error.taskId}
                            </Chip>
                          )}
                          {error.retryCount !== undefined && error.retryCount > 0 && (
                            <Chip size="sm" variant="flat" color="warning">
                              Retry {error.retryCount}/3
                            </Chip>
                          )}
                          {error.nextRetryAt && (
                            <Chip size="sm" variant="flat" color="primary">
                              Next: {new Date(error.nextRetryAt).toLocaleTimeString()}
                            </Chip>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          variant="flat" 
                          color="primary"
                          onPress={() => {}}
                        >
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="flat" 
                          color="success"
                          onPress={() => retryTask(error.taskId)}
                        >
                          Retry
                        </Button>
                        <Button 
                          size="sm" 
                          variant="flat" 
                          color="danger"
                          onPress={() => cancelWorkflow(error.workflowId)}
                        >
                          Cancel Workflow
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="flex items-center justify-center p-8">
              <div className="text-center">
                <Icon icon="lucide:check-circle" className="mx-auto h-12 w-12 text-miyabi-success" />
                <p className="mt-2 text-lg font-medium">No critical errors</p>
                <p className="text-sm text-foreground-500">All systems operating normally</p>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
      
      {/* Warnings */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Icon icon="lucide:alert-triangle" className="h-5 w-5 text-miyabi-warning" />
          <h2 className="text-xl font-semibold">Warnings ({warnings.length})</h2>
        </div>
        
        {warnings.length > 0 ? (
          <Card>
            <CardBody className="p-0">
              <ul className="divide-y divide-divider">
                {warnings.map((warning) => (
                  <li key={warning.id} className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-miyabi-warning">{warning.message}</p>
                        <p className="mt-1 text-sm text-foreground-500">
                          {warning.timestamp}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="flat" 
                          color="primary"
                          onPress={() => {}}
                        >
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="flat" 
                          color="default"
                          onPress={() => clearError(warning.id)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="flex items-center justify-center p-8">
              <div className="text-center">
                <Icon icon="lucide:check-circle" className="mx-auto h-12 w-12 text-miyabi-success" />
                <p className="mt-2 text-lg font-medium">No warnings</p>
                <p className="text-sm text-foreground-500">System is running smoothly</p>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
      
      <div className="flex items-center gap-2 rounded-md bg-content2 p-3">
        <Icon
          icon={notificationsEnabled ? "lucide:bell" : "lucide:bell-off"}
          className={`h-5 w-5 ${notificationsEnabled ? "text-miyabi-success" : "text-miyabi-primary"}`}
        />
        <p className="text-sm flex-1">
          {notificationsEnabled
            ? "Browser notifications are enabled. You will be alerted about critical errors."
            : "Enable browser notifications to get alerted about critical errors."
          }
        </p>
        {!notificationsEnabled && (
          <Button size="sm" variant="flat" color="primary" onPress={enableNotifications}>
            Enable Notifications
          </Button>
        )}
      </div>
    </div>
  );
};
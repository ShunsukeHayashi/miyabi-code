import React from "react";
import { Card, CardBody, Progress, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";

// Mock data
const systemHealth = {
  status: "healthy", // healthy, warning, critical
  activeAgents: 3,
  totalAgents: 7,
  activeTasks: 5,
  queuedTasks: 2,
  taskThroughput: 12, // tasks per hour
  avgCompletionTime: 5.2, // minutes
};

const agents = [
  { id: 1, name: "しきるん", role: "Coordinator", status: "active", tasks: 2, color: "leader" },
  { id: 2, name: "つくるん", role: "CodeGen", status: "working", tasks: 1, color: "executor" },
  { id: 3, name: "めだまん", role: "Review", status: "idle", tasks: 0, color: "executor" },
  { id: 4, name: "まとめるん", role: "Docs", status: "idle", tasks: 0, color: "support" },
  { id: 5, name: "はこぶん", role: "Deploy", status: "idle", tasks: 0, color: "support" },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
    case "working":
      return <span className="animate-pulse relative flex h-3 w-3 mr-1">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>;
    case "idle":
      return <span className="relative flex h-3 w-3 mr-1">
        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
      </span>;
    default:
      return <span className="relative flex h-3 w-3 mr-1">
        <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
      </span>;
  }
};

const getAgentColorClass = (color: string) => {
  switch (color) {
    case "leader":
      return "border-l-agent-leader";
    case "executor":
      return "border-l-agent-executor";
    case "analyst":
      return "border-l-agent-analyst";
    case "support":
      return "border-l-agent-support";
    default:
      return "border-l-gray-300";
  }
};

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <Card className="w-full">
          <CardBody>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Icon icon="lucide:activity" className="text-miyabi-primary" />
              System Health
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="flex items-center text-miyabi-success font-medium">
                    <Icon icon="lucide:check-circle" className="mr-1" />
                    Healthy
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Agents</span>
                  <span className="font-medium">{systemHealth.activeAgents}/{systemHealth.totalAgents}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Tasks</span>
                  <span className="font-medium">{systemHealth.activeTasks}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Queued Tasks</span>
                  <span className="font-medium">{systemHealth.queuedTasks}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Task Throughput</span>
                  <span className="font-medium">{systemHealth.taskThroughput} tasks/hour</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Avg Completion Time</span>
                  <span className="font-medium">{systemHealth.avgCompletionTime} minutes</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">System Load</span>
                  <div className="w-32">
                    <Progress 
                      aria-label="System Load" 
                      value={45} 
                      color="primary" 
                      className="max-w-md"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Memory Usage</span>
                  <div className="w-32">
                    <Progress 
                      aria-label="Memory Usage" 
                      value={62} 
                      color="warning" 
                      className="max-w-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <Card key={agent.id} className={`border-l-4 ${getAgentColorClass(agent.color)}`}>
            <CardBody className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium flex items-center">
                    {getStatusIcon(agent.status)}
                    {agent.name}
                  </h3>
                  <p className="text-sm text-gray-500">{agent.role}</p>
                </div>
                <Tooltip content={`${agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}`}>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-gray-500">Tasks: {agent.tasks}</span>
                  </div>
                </Tooltip>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};
import React from "react";
import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import { Icon } from "@iconify/react";

export const AgentCollaboration: React.FC = () => {
  return (
    <Card className="h-full">
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Icon icon="lucide:users" className="text-miyabi-primary" />
          Agent Collaboration
        </h2>
        <Button size="sm" variant="light" startContent={<Icon icon="lucide:refresh-cw" />}>
          Refresh
        </Button>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col items-center">
          {/* User */}
          <div className="bg-gray-100 rounded-lg p-3 w-40 text-center mb-4">
            <div className="font-medium">User</div>
            <div className="text-xs text-gray-500">Message</div>
          </div>
          
          {/* Arrow down */}
          <div className="h-8 flex items-center justify-center">
            <Icon icon="lucide:arrow-down" className="text-gray-400" />
          </div>
          
          {/* Coordinator */}
          <div className="bg-agent-leader bg-opacity-10 border border-agent-leader rounded-lg p-3 w-48 text-center mb-4">
            <div className="font-medium">🔴 しきるん (Coordinator)</div>
            <div className="text-xs text-gray-500">Task Decomposition</div>
          </div>
          
          {/* Multiple arrows */}
          <div className="w-full flex justify-center mb-4">
            <div className="flex flex-col items-center">
              <div className="h-8 flex items-center justify-center">
                <Icon icon="lucide:git-branch" className="text-gray-400" />
              </div>
              <div className="flex space-x-2">
                {/* CodeGen */}
                <div className="bg-agent-executor bg-opacity-10 border border-agent-executor rounded-lg p-3 w-32 text-center">
                  <div className="font-medium">🟢 つくるん</div>
                  <div className="text-xs text-gray-500">CodeGen</div>
                </div>
                
                {/* Review */}
                <div className="bg-agent-executor bg-opacity-10 border border-agent-executor rounded-lg p-3 w-32 text-center">
                  <div className="font-medium">🟢 めだまん</div>
                  <div className="text-xs text-gray-500">Review</div>
                </div>
                
                {/* Docs */}
                <div className="bg-agent-support bg-opacity-10 border border-agent-support rounded-lg p-3 w-32 text-center">
                  <div className="font-medium">🟡 まとめるん</div>
                  <div className="text-xs text-gray-500">Docs</div>
                </div>
                
                {/* Deploy */}
                <div className="bg-agent-support bg-opacity-10 border border-agent-support rounded-lg p-3 w-32 text-center">
                  <div className="font-medium">🟡 はこぶん</div>
                  <div className="text-xs text-gray-500">Deploy</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Arrow down */}
          <div className="h-8 flex items-center justify-center">
            <Icon icon="lucide:arrow-down" className="text-gray-400" />
          </div>
          
          {/* Result */}
          <div className="bg-gray-100 rounded-lg p-3 w-40 text-center">
            <div className="font-medium">User ✅</div>
            <div className="text-xs text-gray-500">Result</div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Current Workflow</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Active Agents:</span>
              <span className="text-sm font-medium">3/7</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Current Phase:</span>
              <span className="text-sm font-medium">Code Generation</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Elapsed Time:</span>
              <span className="text-sm font-medium">00:05:32</span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
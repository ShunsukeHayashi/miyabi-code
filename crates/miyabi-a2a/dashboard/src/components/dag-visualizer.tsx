import React from "react";
import { Card, CardBody, Spinner, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { useDagVisualizer } from "../hooks/use-dag-visualizer";

// Register dagre layout
cytoscape.use(dagre);

export const DagVisualizer: React.FC = () => {
  const { dagData, isLoading } = useDagVisualizer();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const cyRef = React.useRef<cytoscape.Core | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = React.useState("workflow-270");

  // Initialize Cytoscape
  React.useEffect(() => {
    if (!containerRef.current || isLoading) return;

    // Clear previous instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // Status colors
    const statusColors: Record<string, string> = {
      completed: "#10b981", // green
      working: "#3b82f6",   // blue
      pending: "#94a3b8",   // gray
      failed: "#ef4444",    // red
    };

    const statusIcons: Record<string, string> = {
      completed: "✅",
      working: "🔄",
      pending: "⏸️",
      failed: "❌",
    };

    // Convert DAG data to Cytoscape elements
    const elements = [
      ...dagData.nodes.map((node) => ({
        data: {
          id: node.id,
          label: `${statusIcons[node.status]} ${node.label}\n${node.agent}`,
          status: node.status,
          agent: node.agent,
          agentType: node.agentType,
        },
      })),
      ...dagData.edges.map((edge) => ({
        data: {
          id: `${edge.from}-${edge.to}`,
          source: edge.from,
          target: edge.to,
        },
      })),
    ];

    // Create Cytoscape instance
    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": (ele) => statusColors[ele.data("status")] || "#94a3b8",
            "label": "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "text-wrap": "wrap",
            "text-max-width": "100px",
            "color": "#fff",
            "font-size": "12px",
            "font-weight": "bold",
            "width": "140px",
            "height": "70px",
            "border-width": "3px",
            "border-color": "#fff",
            "shape": "roundrectangle",
          },
        },
        {
          selector: "node[status='working']",
          style: {
            "border-color": "#3b82f6",
            "border-width": "4px",
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-color": "#f59e0b",
            "border-width": "5px",
          },
        },
        {
          selector: "edge",
          style: {
            "width": 3,
            "line-color": "#cbd5e1",
            "target-arrow-color": "#cbd5e1",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "arrow-scale": 1.5,
          },
        },
      ],
      layout: {
        name: "dagre",
        rankDir: "TB", // Top to bottom
        nodeSep: 50,
        rankSep: 80,
        padding: 30,
      } as any,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cyRef.current = cy;

    // Add event listeners
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      console.log("Node clicked:", node.data());

      // Show node details (future enhancement)
      alert(`Task: ${node.data("label")}\nAgent: ${node.data("agent")}\nStatus: ${node.data("status")}`);
    });

    // Auto-fit on load
    cy.fit(undefined, 50);

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [dagData, isLoading]);

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
      cyRef.current.center();
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
      cyRef.current.center();
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 50);
    }
  };

  const handleExport = () => {
    if (cyRef.current) {
      const png = cyRef.current.png({ scale: 2 });
      const link = document.createElement("a");
      link.href = png;
      link.download = `workflow-dag-${Date.now()}.png`;
      link.click();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner color="primary" />
          <p className="text-foreground-500">Loading workflow graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Workflow DAG</h2>
          <Chip size="sm" variant="flat" color="primary">
            {dagData.nodes.length} tasks
          </Chip>
        </div>

        <div className="flex flex-wrap gap-2">
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="flat"
                endContent={<Icon icon="lucide:chevron-down" className="h-4 w-4" />}
              >
                {selectedWorkflow}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Select workflow"
              onAction={(key) => setSelectedWorkflow(key as string)}
            >
              <DropdownItem key="workflow-270">Workflow #270</DropdownItem>
              <DropdownItem key="workflow-271">Workflow #271</DropdownItem>
              <DropdownItem key="workflow-272">Workflow #272</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Button
            variant="flat"
            isIconOnly
            onPress={handleZoomIn}
            title="Zoom In"
          >
            <Icon icon="lucide:zoom-in" className="h-4 w-4" />
          </Button>

          <Button
            variant="flat"
            isIconOnly
            onPress={handleZoomOut}
            title="Zoom Out"
          >
            <Icon icon="lucide:zoom-out" className="h-4 w-4" />
          </Button>

          <Button
            variant="flat"
            isIconOnly
            onPress={handleFit}
            title="Fit to Screen"
          >
            <Icon icon="lucide:maximize" className="h-4 w-4" />
          </Button>

          <Button
            variant="flat"
            startContent={<Icon icon="lucide:download" className="h-4 w-4" />}
            onPress={handleExport}
          >
            Export PNG
          </Button>
        </div>
      </div>

      <Card className="h-[600px]">
        <CardBody className="p-0">
          <div ref={containerRef} className="h-full w-full" />
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-2 rounded-md bg-content2 p-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm font-medium">Completed</p>
            <p className="text-xs text-foreground-500">
              {dagData.nodes.filter((n) => n.status === "completed").length} tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md bg-content2 p-3">
          <span className="text-2xl">🔄</span>
          <div>
            <p className="text-sm font-medium">Working</p>
            <p className="text-xs text-foreground-500">
              {dagData.nodes.filter((n) => n.status === "working").length} tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md bg-content2 p-3">
          <span className="text-2xl">⏸️</span>
          <div>
            <p className="text-sm font-medium">Pending</p>
            <p className="text-xs text-foreground-500">
              {dagData.nodes.filter((n) => n.status === "pending").length} tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md bg-content2 p-3">
          <span className="text-2xl">❌</span>
          <div>
            <p className="text-sm font-medium">Failed</p>
            <p className="text-xs text-foreground-500">
              {dagData.nodes.filter((n) => n.status === "failed").length} tasks
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md bg-content2 p-3">
        <Icon icon="lucide:info" className="h-5 w-5 text-miyabi-info" />
        <p className="text-sm">
          Click on any node to view task details. Use mouse wheel to zoom, drag to pan.
        </p>
      </div>
    </div>
  );
};

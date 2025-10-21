import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from "recharts";

// Sample data for the chart
const data = [
  { time: "10:00", tasks: 5, agents: 3, errors: 0 },
  { time: "10:30", tasks: 8, agents: 4, errors: 0 },
  { time: "11:00", tasks: 12, agents: 5, errors: 1 },
  { time: "11:30", tasks: 15, agents: 6, errors: 0 },
  { time: "12:00", tasks: 10, agents: 5, errors: 0 },
  { time: "12:30", tasks: 8, agents: 4, errors: 0 },
  { time: "13:00", tasks: 12, agents: 5, errors: 2 },
  { time: "13:30", tasks: 16, agents: 7, errors: 0 },
  { time: "14:00", tasks: 14, agents: 6, errors: 0 },
  { time: "14:30", tasks: 12, agents: 5, errors: 1 },
];

export const MetricsChart: React.FC = () => {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorAgents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="tasks"
            stroke="#6366f1"
            fillOpacity={1}
            fill="url(#colorTasks)"
            name="Active Tasks"
          />
          <Area
            type="monotone"
            dataKey="agents"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorAgents)"
            name="Active Agents"
          />
          <Area
            type="monotone"
            dataKey="errors"
            stroke="#ef4444"
            fillOpacity={1}
            fill="url(#colorErrors)"
            name="Errors"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
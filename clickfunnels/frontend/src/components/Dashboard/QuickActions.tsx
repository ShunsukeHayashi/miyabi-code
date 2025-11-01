/**
 * Quick Actions Component
 *
 * Provides quick access to common actions.
 */

import React from 'react';
import { Plus, FileText, Settings, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: <Plus className="w-5 h-5" />,
      label: 'Create Funnel',
      description: 'Start building a new sales funnel',
      onClick: () => navigate('/funnels/new'),
      color: 'bg-blue-500',
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Create Page',
      description: 'Design a new landing page',
      onClick: () => navigate('/pages/new'),
      color: 'bg-green-500',
    },
    {
      icon: <BarChart className="w-5 h-5" />,
      label: 'View Analytics',
      description: 'Check your performance metrics',
      onClick: () => navigate('/analytics'),
      color: 'bg-purple-500',
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Integrations',
      description: 'Connect external services',
      onClick: () => navigate('/integrations'),
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
      </div>
      <div className="p-6 space-y-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left"
          >
            <div className={`p-2 rounded-lg text-white ${action.color}`}>
              {action.icon}
            </div>
            <div>
              <p className="font-medium text-gray-900">{action.label}</p>
              <p className="text-sm text-gray-600">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

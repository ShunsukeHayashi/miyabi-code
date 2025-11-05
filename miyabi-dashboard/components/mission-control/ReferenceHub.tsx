'use client';

import React from 'react';
import { Reference } from '@/lib/mockData';

interface ReferenceHubProps {
  references: Reference[];
}

const ReferenceHub: React.FC<ReferenceHubProps> = ({ references }) => {
  const getCategoryColor = (category: Reference['category']) => {
    switch (category) {
      case 'docs':
        return 'bg-blue-100 text-blue-800';
      case 'guide':
        return 'bg-purple-100 text-purple-800';
      case 'api':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: Reference['category']) => {
    switch (category) {
      case 'docs':
        return '📄';
      case 'guide':
        return '📖';
      case 'api':
        return '⚙️';
      default:
        return '📌';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Reference Hub</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {references.map((reference) => (
          <a
            key={reference.id}
            href={reference.url}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all hover:border-blue-300"
          >
            <div className="flex items-start">
              <span className="text-2xl mr-3">{getCategoryIcon(reference.category)}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-1">{reference.title}</h3>
                <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(reference.category)}`}>
                  {reference.category}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
      {references.length === 0 && (
        <p className="text-center text-gray-500 py-8">No references available</p>
      )}
    </div>
  );
};

export default ReferenceHub;

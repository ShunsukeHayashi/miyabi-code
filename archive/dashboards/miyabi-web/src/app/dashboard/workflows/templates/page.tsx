'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Eye, Star } from 'lucide-react';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'coding' | 'business' | 'mixed';
  nodeCount: number;
  popularity: number;
  isPublic: boolean;
  author: string;
  createdAt: Date;
  tags: string[];
}

export default function WorkflowTemplatesPage() {
  const router = useRouter();
  const [templates] = useState<WorkflowTemplate[]>([
    {
      id: '1',
      name: 'Auto Issue Triage Workflow',
      description: 'Automatically analyze new issues with IssueAgent, label them, and assign to appropriate team members',
      category: 'coding',
      nodeCount: 5,
      popularity: 142,
      isPublic: true,
      author: 'Miyabi Team',
      createdAt: new Date('2025-10-20'),
      tags: ['automation', 'issue-management', 'triage'],
    },
    {
      id: '2',
      name: 'Full CI/CD Pipeline',
      description: 'Complete workflow from CodeGen → Review → PR → Deployment with quality gates',
      category: 'coding',
      nodeCount: 8,
      popularity: 98,
      isPublic: true,
      author: 'Miyabi Team',
      createdAt: new Date('2025-10-18'),
      tags: ['cicd', 'deployment', 'quality'],
    },
    {
      id: '3',
      name: 'Product Launch Strategy',
      description: 'End-to-end product launch from market research → persona → funnel design → marketing',
      category: 'business',
      nodeCount: 12,
      popularity: 76,
      isPublic: true,
      author: 'Miyabi Team',
      createdAt: new Date('2025-10-15'),
      tags: ['strategy', 'launch', 'marketing'],
    },
    {
      id: '4',
      name: 'Content Marketing Automation',
      description: 'Automated content creation, SNS posting, and analytics tracking workflow',
      category: 'business',
      nodeCount: 10,
      popularity: 65,
      isPublic: true,
      author: 'Miyabi Team',
      createdAt: new Date('2025-10-12'),
      tags: ['content', 'marketing', 'automation'],
    },
    {
      id: '5',
      name: 'Parallel Issue Processing',
      description: 'Process multiple issues in parallel with Coordinator → multiple CodeGenAgents → merge',
      category: 'coding',
      nodeCount: 7,
      popularity: 54,
      isPublic: true,
      author: 'Community',
      createdAt: new Date('2025-10-10'),
      tags: ['parallel', 'performance', 'automation'],
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'coding' | 'business' | 'mixed'>('all');

  const filteredTemplates = templates.filter(
    (t) => selectedCategory === 'all' || t.category === selectedCategory
  );

  const categoryConfig = {
    coding: { label: 'Coding', color: 'bg-purple-100 text-purple-700', borderColor: 'border-purple-200' },
    business: { label: 'Business', color: 'bg-green-100 text-green-700', borderColor: 'border-green-200' },
    mixed: { label: 'Mixed', color: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-200' },
  };

  const handleUseTemplate = (templateId: string) => {
    // Navigate to workflow editor with template
    router.push(`/workflow/new?template=${templateId}`);
  };

  const handlePreview = (templateId: string) => {
    // Open template preview modal (to be implemented)
    alert(`Preview template ${templateId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-5xl font-semibold tracking-tight text-gray-900 mb-3">
              Workflow Templates
            </h2>
            <p className="text-lg text-gray-600">
              すぐに使えるワークフローテンプレート - カスタマイズして使用できます
            </p>
          </div>
          <Button
            size="lg"
            className="bg-gray-900 hover:bg-gray-800 text-white"
            onClick={() => router.push('/workflow/new')}
          >
            <Plus className="h-5 w-5 mr-2" />
            新規作成
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({templates.length})
          </button>
          <button
            onClick={() => setSelectedCategory('coding')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'coding'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            Coding ({templates.filter((t) => t.category === 'coding').length})
          </button>
          <button
            onClick={() => setSelectedCategory('business')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'business'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Business ({templates.filter((t) => t.category === 'business').length})
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const categoryStyle = categoryConfig[template.category];
          return (
            <Card
              key={template.id}
              className={`border-2 ${categoryStyle.borderColor} hover:shadow-lg transition-shadow`}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge className={`${categoryStyle.color} font-medium`}>
                    {categoryStyle.label}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{template.popularity}</span>
                  </div>
                </div>
                <CardTitle className="text-xl">{template.name}</CardTitle>
                <CardDescription className="line-clamp-2">{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{template.nodeCount} nodes</span>
                  <span>•</span>
                  <span>by {template.author}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePreview(template.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-lg text-gray-600 font-light">No templates found in this category</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setSelectedCategory('all')}
          >
            View All Templates
          </Button>
        </Card>
      )}
    </div>
  );
}

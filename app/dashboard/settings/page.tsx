'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(' ');
}

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: {
    agents: number;
    apiCalls: number;
    tokens: number;
  };
  current?: boolean;
  recommended?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Up to 3 AI agents',
      '1,000 API calls/month',
      '100K tokens/month',
      'Community support',
      'Basic analytics',
    ],
    limits: { agents: 3, apiCalls: 1000, tokens: 100000 },
    current: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    features: [
      'Up to 10 AI agents',
      '10,000 API calls/month',
      '500K tokens/month',
      'Priority support',
      'Advanced analytics',
      'Custom prompts',
      'Webhook integrations',
    ],
    limits: { agents: 10, apiCalls: 10000, tokens: 500000 },
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    features: [
      'Unlimited AI agents',
      'Unlimited API calls',
      'Unlimited tokens',
      'Dedicated support',
      'Custom integrations',
      'SSO/SAML',
      'SLA guarantee',
      'On-premise option',
    ],
    limits: { agents: -1, apiCalls: -1, tokens: -1 },
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'notifications' | 'api'>('general');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState('daily');

  const currentUsage = {
    agents: 3,
    apiCalls: 2847,
    tokens: 156000,
  };

  const currentPlan = plans.find((p) => p.current);

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Manage your account and preferences</p>
        </div>

        <div className="flex gap-2 border-b border-gray-800 pb-4">
          {(['general', 'billing', 'notifications', 'api'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab
                  ? 'bg-miyabi-blue/20 text-miyabi-blue'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800',
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'general' && (
          <div className="space-y-6">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your GitHub account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                  <img
                    src="https://github.com/identicons/miyabi.png"
                    alt="Avatar"
                    className="w-16 h-16 rounded-full ring-2 ring-gray-700"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-white">miyabi-user</h3>
                    <p className="text-sm text-gray-400">miyabi@example.com</p>
                    <Badge variant="success" className="mt-2">Connected via GitHub</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                    <Input defaultValue="Miyabi User" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <Input defaultValue="miyabi@example.com" type="email" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>Irreversible actions for your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-red-500/30 bg-red-500/5">
                  <div>
                    <h4 className="text-sm font-medium text-white">Delete All Agents</h4>
                    <p className="text-xs text-gray-400">Remove all agents and their data</p>
                  </div>
                  <Button variant="outline" size="sm">Delete All</Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-red-500/30 bg-red-500/5">
                  <div>
                    <h4 className="text-sm font-medium text-white">Disconnect GitHub</h4>
                    <p className="text-xs text-gray-400">Revoke GitHub App installation</p>
                  </div>
                  <Button variant="outline" size="sm">Disconnect</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your subscription and usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-miyabi-blue/10 to-miyabi-purple/10 border border-miyabi-blue/30">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{currentPlan?.name}</h3>
                      <Badge variant="primary">Current</Badge>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {currentPlan?.price === 0 ? 'Free forever' : `$${currentPlan?.price}/month`}
                    </p>
                  </div>
                  <Button variant="outline">Manage Subscription</Button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-300">Usage This Month</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Agents</span>
                        <span className="text-white">
                          {currentUsage.agents} / {currentPlan?.limits.agents === -1 ? 'Unlimited' : currentPlan?.limits.agents}
                        </span>
                      </div>
                      <Progress
                        value={currentPlan?.limits.agents === -1 ? 0 : (currentUsage.agents / currentPlan!.limits.agents) * 100}
                        variant={currentUsage.agents >= (currentPlan?.limits.agents || 0) ? 'warning' : 'default'}
                        animated={false}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">API Calls</span>
                        <span className="text-white">
                          {currentUsage.apiCalls.toLocaleString()} / {currentPlan?.limits.apiCalls === -1 ? 'Unlimited' : currentPlan?.limits.apiCalls.toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={currentPlan?.limits.apiCalls === -1 ? 0 : (currentUsage.apiCalls / currentPlan!.limits.apiCalls) * 100}
                        animated={false}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Tokens</span>
                        <span className="text-white">
                          {(currentUsage.tokens / 1000).toFixed(0)}K / {currentPlan?.limits.tokens === -1 ? 'Unlimited' : `${(currentPlan!.limits.tokens / 1000).toFixed(0)}K`}
                        </span>
                      </div>
                      <Progress
                        value={currentPlan?.limits.tokens === -1 ? 0 : (currentUsage.tokens / currentPlan!.limits.tokens) * 100}
                        animated={false}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Available Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    variant={plan.recommended ? 'gradient' : 'glass'}
                    className={cn(plan.recommended && 'ring-2 ring-miyabi-blue/50')}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-white">{plan.name}</h4>
                        {plan.recommended && (
                          <Badge variant="primary">Recommended</Badge>
                        )}
                        {plan.current && (
                          <Badge variant="success">Current</Badge>
                        )}
                      </div>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-white">${plan.price}</span>
                        <span className="text-gray-400">/month</span>
                      </div>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-miyabi-green">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        variant={plan.current ? 'outline' : plan.recommended ? 'default' : 'secondary'}
                        className="w-full"
                        disabled={plan.current}
                      >
                        {plan.current ? 'Current Plan' : 'Upgrade'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                <div>
                  <h4 className="text-sm font-medium text-white">Enable Notifications</h4>
                  <p className="text-xs text-gray-400">Receive notifications about agent activity</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-colors',
                    notificationsEnabled ? 'bg-miyabi-blue' : 'bg-gray-600',
                  )}
                >
                  <div className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    notificationsEnabled ? 'translate-x-7' : 'translate-x-1',
                  )} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Email Digest Frequency</label>
                <div className="flex gap-2">
                  {(['never', 'daily', 'weekly'] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setEmailDigest(freq)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                        emailDigest === freq
                          ? 'bg-miyabi-blue/20 text-miyabi-blue border border-miyabi-blue/50'
                          : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600',
                      )}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Notify me about:</h4>
                {[
                  { id: 'task_completed', label: 'Task completed', description: 'When an agent completes a task' },
                  { id: 'task_failed', label: 'Task failed', description: 'When an agent fails to complete a task' },
                  { id: 'agent_error', label: 'Agent errors', description: 'When an agent encounters an error' },
                  { id: 'usage_limit', label: 'Usage limits', description: 'When approaching usage limits' },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/50"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-miyabi-blue focus:ring-miyabi-blue/50"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage your API keys for programmatic access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                  <div>
                    <h4 className="text-sm font-medium text-white">Production Key</h4>
                    <p className="text-xs text-gray-400 font-mono mt-1">mya_prod_*****...***</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">Reveal</Button>
                    <Button variant="ghost" size="sm">Regenerate</Button>
                  </div>
                </div>
                <Button variant="outline">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                  Create New Key
                </Button>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle>Webhooks</CardTitle>
                <CardDescription>Configure webhook endpoints for real-time updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-white">Main Webhook</h4>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <p className="text-xs text-gray-400 font-mono">https://api.example.com/webhooks/miyabi</p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm">Test</Button>
                    <Button variant="ghost" size="sm">Delete</Button>
                  </div>
                </div>
                <Button variant="outline">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                  Add Webhook
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

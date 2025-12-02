import React, { useState } from 'react';
import { Search, Target, Building2, Users, TrendingUp, MessageSquare, Linkedin, Mail, Calendar, ChevronRight, ExternalLink, Sparkles, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

// Design System
const colors = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  bg: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0'
};

// Components
const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Card = ({ children, className = '', hover = false }) => (
  <div className={`bg-white rounded-xl border border-slate-200 ${hover ? 'hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer' : 'shadow-sm'} ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', icon: Icon, className = '', ...props }) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700',
    ghost: 'hover:bg-slate-100 text-slate-600'
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  return (
    <button className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

const PriorityIndicator = ({ priority }) => {
  const config = {
    1: { color: 'bg-red-500', label: 'P1', textColor: 'text-red-700' },
    2: { color: 'bg-amber-500', label: 'P2', textColor: 'text-amber-700' },
    3: { color: 'bg-emerald-500', label: 'P3', textColor: 'text-emerald-700' }
  };
  const { color, label, textColor } = config[priority] || config[3];
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className={`text-xs font-semibold ${textColor}`}>{label}</span>
    </div>
  );
};

const ChannelIcon = ({ channel }) => {
  const icons = {
    linkedin: { icon: Linkedin, color: 'text-blue-600', bg: 'bg-blue-50' },
    email: { icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50' },
    event: { icon: Calendar, color: 'text-green-600', bg: 'bg-green-50' }
  };
  const { icon: Icon, color, bg } = icons[channel] || icons.email;
  return (
    <div className={`p-2 rounded-lg ${bg}`}>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
  );
};

// Main Dashboard Component
export default function BDRHunterDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const companyData = {
    name: 'マネーフォワード',
    industry: 'SaaS / FinTech',
    employees: 2916,
    revenue: '¥300億+',
    targetRevenue: '¥1,000億+',
    confidenceScore: 0.9
  };
  
  const keypersons = [
    {
      id: 1,
      name: '中出匠哉',
      title: '取締役執行役員 グループCTO',
      priority: 1,
      channel: 'linkedin',
      whyNow: '日本CTO協会理事就任、Four Keys推進中',
      avatar: '👑'
    },
    {
      id: 2,
      name: 'AI活用推進担当',
      title: 'グループ執行役員',
      priority: 2,
      channel: 'email',
      whyNow: '2024/8新設ポジション、AI効果測定ニーズ',
      avatar: '💡'
    },
    {
      id: 3,
      name: '技術本部EM',
      title: 'Engineering Manager',
      priority: 3,
      channel: 'event',
      whyNow: 'EM採用強化中、現場評価担当',
      avatar: '👤'
    }
  ];
  
  const painPoints = [
    { label: '組織スケール', value: '2000→2900名', severity: 'high' },
    { label: 'グローバル化', value: 'エンジニア組織英語化', severity: 'high' },
    { label: 'Four Keys可視化', value: '60+プロダクト', severity: 'medium' },
    { label: 'AI活用推進', value: '効果測定ニーズ', severity: 'medium' }
  ];
  
  const timeline = [
    { week: 'Week 1', action: 'LinkedIn接続 + Email送信', status: 'pending' },
    { week: 'Week 2', action: '初回ミーティング設定', status: 'upcoming' },
    { week: 'Week 3', action: 'トライアル提案', status: 'upcoming' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-slate-900">BDR Hunter</span>
              </div>
              <Badge variant="primary">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" icon={Search}>検索</Button>
              <Button variant="primary" icon={Target}>新規分析</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Company Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{companyData.name}</h1>
                <Badge variant="success">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  分析完了
                </Badge>
              </div>
              <p className="text-slate-600">{companyData.industry} • 従業員 {companyData.employees.toLocaleString()}名</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500 mb-1">Confidence Score</div>
              <div className="text-2xl font-bold text-blue-600">{(companyData.confidenceScore * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-slate-500">売上高</div>
                <div className="text-xl font-bold text-slate-900">{companyData.revenue}</div>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm text-slate-500">2028年目標</div>
                <div className="text-xl font-bold text-slate-900">{companyData.targetRevenue}</div>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-slate-500">キーマン</div>
                <div className="text-xl font-bold text-slate-900">{keypersons.length}名</div>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-xl">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-slate-500">Pain Points</div>
                <div className="text-xl font-bold text-slate-900">{painPoints.length}件</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Key Persons */}
          <div className="col-span-2">
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">🎯 Target Contacts</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {keypersons.map((person) => (
                  <div key={person.id} className="p-5 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{person.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-slate-900">{person.name}</h3>
                          <PriorityIndicator priority={person.priority} />
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{person.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="primary">{person.whyNow}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <ChannelIcon channel={person.channel} />
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                <Button variant="outline" className="w-full" icon={ExternalLink}>
                  詳細を見る
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Pain Points */}
            <Card>
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">❗ Pain Points</h2>
              </div>
              <div className="p-5 space-y-3">
                {painPoints.map((pain, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{pain.label}</div>
                      <div className="text-xs text-slate-500">{pain.value}</div>
                    </div>
                    <Badge variant={pain.severity === 'high' ? 'danger' : 'warning'}>
                      {pain.severity === 'high' ? 'High' : 'Medium'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Timeline */}
            <Card>
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">📅 Approach Timeline</h2>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {timeline.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        item.status === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="font-medium text-slate-900 text-sm">{item.week}</div>
                        <div className="text-xs text-slate-500">{item.action}</div>
                      </div>
                      {item.status === 'pending' && (
                        <Clock className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Key Messages */}
            <Card>
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">💬 Key Messages</h2>
              </div>
              <div className="p-5 space-y-2">
                {[
                  'Four Keysをリアルタイムで可視化',
                  '60+プロダクトでの導入実績',
                  'グローバル組織での生産性ベンチマーク',
                  'AI活用の効果測定'
                ].map((msg, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm text-emerald-900">{msg}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>分析完了 • 2024-12-02 23:10</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" icon={MessageSquare}>メッセージ作成</Button>
              <Button variant="primary" icon={Linkedin}>LinkedIn接続を開始</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

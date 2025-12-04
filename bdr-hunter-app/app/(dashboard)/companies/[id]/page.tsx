'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardBody, CardHeader, Chip, Button, Divider, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

interface Analysis {
  id: string;
  companyName: string;
  companyUrl: string | null;
  status: string;
  companyProfile: any;
  decisionMakers: any[];
  strategy: any;
  deepResearch: any;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  error: string | null;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`/api/analyze/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || '分析が見つかりません');
          return;
        }

        setAnalysis(data.analysis);
      } catch (err) {
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error || '分析が見つかりません'}</p>
        <Link href="/companies">
          <Button className="mt-4">一覧に戻る</Button>
        </Link>
      </div>
    );
  }

  const getStatusChip = (status: string) => {
    const statusMap: Record<string, { color: 'warning' | 'primary' | 'success' | 'danger'; label: string }> = {
      pending: { color: 'warning', label: '待機中' },
      processing: { color: 'primary', label: '処理中' },
      completed: { color: 'success', label: '完了' },
      failed: { color: 'danger', label: '失敗' },
    };
    const { color, label } = statusMap[status] || { color: 'primary' as const, label: status };
    return <Chip color={color}>{label}</Chip>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/companies" className="text-blue-500 hover:underline text-sm">
            ← 一覧に戻る
          </Link>
          <h1 className="text-2xl font-bold mt-2">{analysis.companyName}</h1>
          {analysis.companyUrl && (
            <a href={analysis.companyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              {analysis.companyUrl}
            </a>
          )}
        </div>
        {getStatusChip(analysis.status)}
      </div>

      {/* Company Profile */}
      {analysis.companyProfile && (
        <Card>
          <CardHeader>
            <Icon icon="mdi:domain" className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold">企業プロフィール</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              {analysis.companyProfile.industry && (
                <div>
                  <p className="text-sm text-gray-500">業界</p>
                  <p className="font-medium">{analysis.companyProfile.industry}</p>
                </div>
              )}
              {analysis.companyProfile.size && (
                <div>
                  <p className="text-sm text-gray-500">企業規模</p>
                  <p className="font-medium">{analysis.companyProfile.size}</p>
                </div>
              )}
              {analysis.companyProfile.employees && (
                <div>
                  <p className="text-sm text-gray-500">従業員数</p>
                  <p className="font-medium">{analysis.companyProfile.employees}</p>
                </div>
              )}
              {analysis.companyProfile.headquarters && (
                <div>
                  <p className="text-sm text-gray-500">本社所在地</p>
                  <p className="font-medium">{analysis.companyProfile.headquarters}</p>
                </div>
              )}
            </div>
            {analysis.companyProfile.description && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">説明</p>
                <p>{analysis.companyProfile.description}</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Decision Makers */}
      {analysis.decisionMakers && analysis.decisionMakers.length > 0 && (
        <Card>
          <CardHeader>
            <Icon icon="mdi:account-group" className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold">意思決定者</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {analysis.decisionMakers.map((dm: any, index: number) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium">{dm.name || dm.title}</p>
                  {dm.department && <p className="text-sm text-gray-500">{dm.department}</p>}
                  {dm.seniority && <Chip size="sm" className="mt-1">{dm.seniority}</Chip>}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Strategy */}
      {analysis.strategy && Object.keys(analysis.strategy).length > 0 && (
        <Card>
          <CardHeader>
            <Icon icon="mdi:strategy" className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold">BDR戦略</h2>
          </CardHeader>
          <CardBody>
            {analysis.strategy.approach && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">アプローチ</p>
                <p>{analysis.strategy.approach}</p>
              </div>
            )}
            {analysis.strategy.channels && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">チャネル</p>
                <div className="flex gap-2 mt-1">
                  {analysis.strategy.channels.map((channel: string, i: number) => (
                    <Chip key={i} size="sm">{channel}</Chip>
                  ))}
                </div>
              </div>
            )}
            {analysis.strategy.painPoints && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">ペインポイント</p>
                <ul className="list-disc list-inside">
                  {analysis.strategy.painPoints.map((point: string, i: number) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Deep Research */}
      {analysis.deepResearch && (
        <Card>
          <CardHeader>
            <Icon icon="mdi:magnify" className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold">Deep Research</h2>
            {analysis.deepResearch.researchMetadata?.confidenceScore && (
              <Chip size="sm" color="success" className="ml-2">
                信頼度: {Math.round(analysis.deepResearch.researchMetadata.confidenceScore * 100)}%
              </Chip>
            )}
          </CardHeader>
          <CardBody>
            {analysis.deepResearch.challenges && analysis.deepResearch.challenges.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 font-medium">課題</p>
                <div className="space-y-2 mt-2">
                  {analysis.deepResearch.challenges.map((c: any, i: number) => (
                    <div key={i} className="p-3 bg-red-50 dark:bg-red-900/20 rounded">
                      <p className="font-medium">{c.challenge}</p>
                      {c.evidence && <p className="text-sm text-gray-600">{c.evidence}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analysis.deepResearch.opportunities && analysis.deepResearch.opportunities.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 font-medium">機会</p>
                <div className="space-y-2 mt-2">
                  {analysis.deepResearch.opportunities.map((o: any, i: number) => (
                    <div key={i} className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                      <p className="font-medium">{o.opportunity}</p>
                      {o.rationale && <p className="text-sm text-gray-600">{o.rationale}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analysis.deepResearch.sources && analysis.deepResearch.sources.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 font-medium">ソース ({analysis.deepResearch.sources.length}件)</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysis.deepResearch.sources.map((s: any, i: number) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer">
                      <Chip size="sm" variant="flat">{s.title}</Chip>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <div className="text-sm text-gray-500">
        <p>作成日時: {new Date(analysis.createdAt).toLocaleString('ja-JP')}</p>
        {analysis.completedAt && (
          <p>完了日時: {new Date(analysis.completedAt).toLocaleString('ja-JP')}</p>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, useDisclosure } from '@heroui/react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

interface Analysis {
  id: string;
  companyName: string;
  companyUrl: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export default function CompaniesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyUrl, setNewCompanyUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchAnalyses = async () => {
    try {
      const res = await fetch('/api/analyze');
      const data = await res.json();
      setAnalyses(data.analyses || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const handleSubmit = async () => {
    if (!newCompanyName.trim()) {
      setError('企業名は必須です');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: newCompanyName,
          companyUrl: newCompanyUrl || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'エラーが発生しました');
        return;
      }

      onClose();
      setNewCompanyName('');
      setNewCompanyUrl('');
      fetchAnalyses();
    } catch (err) {
      setError('分析の作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusChip = (status: string) => {
    const statusMap: Record<string, { color: 'warning' | 'primary' | 'success' | 'danger'; label: string }> = {
      pending: { color: 'warning', label: '待機中' },
      processing: { color: 'primary', label: '処理中' },
      completed: { color: 'success', label: '完了' },
      failed: { color: 'danger', label: '失敗' },
    };
    const { color, label } = statusMap[status] || { color: 'default' as const, label: status };
    return <Chip color={color} size="sm">{label}</Chip>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">企業分析一覧</h1>
        <Button color="primary" onPress={onOpen} startContent={<Icon icon="mdi:plus" />}>
          新規分析
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">分析リスト ({total}件)</h2>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              まだ分析がありません。新規分析を開始してください。
            </div>
          ) : (
            <Table aria-label="企業分析一覧">
              <TableHeader>
                <TableColumn>企業名</TableColumn>
                <TableColumn>ステータス</TableColumn>
                <TableColumn>作成日時</TableColumn>
                <TableColumn>アクション</TableColumn>
              </TableHeader>
              <TableBody>
                {analyses.map((analysis) => (
                  <TableRow key={analysis.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{analysis.companyName}</div>
                        {analysis.companyUrl && (
                          <div className="text-sm text-gray-500">{analysis.companyUrl}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusChip(analysis.status)}</TableCell>
                    <TableCell>{new Date(analysis.createdAt).toLocaleString('ja-JP')}</TableCell>
                    <TableCell>
                      <Link href={`/companies/${analysis.id}`}>
                        <Button size="sm" variant="flat">詳細</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>新規企業分析</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="企業名"
                placeholder="例: 株式会社テスト"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                isRequired
              />
              <Input
                label="企業URL (任意)"
                placeholder="https://example.com"
                value={newCompanyUrl}
                onChange={(e) => setNewCompanyUrl(e.target.value)}
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>キャンセル</Button>
            <Button color="primary" onPress={handleSubmit} isLoading={submitting}>
              分析開始
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

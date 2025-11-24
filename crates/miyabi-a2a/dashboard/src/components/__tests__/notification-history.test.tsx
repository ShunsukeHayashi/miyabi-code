import React, { useEffect } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationHistory } from '../notification-history';
import { NotificationProvider, useNotifications } from '../../contexts/notification-context';

const HistoryHarness: React.FC<{
  onClose?: () => void;
  seedCount?: number;
}> = ({ onClose = vi.fn(), seedCount = 1 }) => {
  const { addNotification } = useNotifications();

  useEffect(() => {
    for (let i = 0; i < seedCount; i++) {
      addNotification({
        type: i % 2 === 0 ? 'success' : 'error',
        title: `通知 ${i + 1}`,
        message: `message-${i + 1}`,
        duration: 0,
      });
    }
  }, [addNotification, seedCount]);

  return <NotificationHistory isOpen onClose={onClose} />;
};

const renderHistory = (props?: { onClose?: () => void; seedCount?: number }) =>
  render(
    <NotificationProvider>
      <HistoryHarness {...props} />
    </NotificationProvider>,
  );

describe('NotificationHistory', () => {
  it('renders notifications and supports clearing all', async () => {
    renderHistory({ seedCount: 2 });

    const notifications = await screen.findAllByText('通知 1');
    expect(notifications.length).toBeGreaterThan(0);
    expect(screen.getByText('2件の通知')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'すべて削除' }));
    expect(await screen.findByText('通知はありません')).toBeInTheDocument();
  });

  it('invokes onClose handler from footer button', async () => {
    const onClose = vi.fn();
    renderHistory({ onClose });

    await screen.findAllByText('通知 1');
    await userEvent.click(screen.getByRole('button', { name: '閉じる' }));

    expect(onClose).toHaveBeenCalled();
  });
});

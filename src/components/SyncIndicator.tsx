import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import type { SyncStatus } from '../types';

interface SyncIndicatorProps {
  status: SyncStatus;
}

// 同期状態をクラウドアイコンで表示する。hasPendingWrites / fromCache から導出。
export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ status }) => {
  const config = {
    synced: { Icon: Cloud, label: 'Synced', cls: 'text-green-500' },
    pending: { Icon: RefreshCw, label: 'Syncing...', cls: 'text-blue-500 animate-spin' },
    offline: { Icon: CloudOff, label: 'Offline', cls: 'text-gray-400' },
  }[status];

  const { Icon, label, cls } = config;

  return (
    <div
      className="flex items-center gap-1.5 text-xs font-medium text-gray-500"
      title={`Sync status: ${label}`}
    >
      <Icon size={16} className={clsx(cls)} />
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
};

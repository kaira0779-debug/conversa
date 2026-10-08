import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[#6B3A4A]/90 backdrop-blur-md px-4 py-1.5 text-xs font-medium text-[#EDE7F0] border border-[#E8825A]/40 shadow-lg shadow-[#0D0A1A]">
      <WifiOff className="w-3.5 h-3.5 text-[#F5A87E] animate-pulse" />
      <span>Modo sin conexión — usando datos locales en memoria</span>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface WelcomeBackToastProps {
  userName: string;
  streak: number;
  onDismiss: () => void;
}

export const WelcomeBackToast: React.FC<WelcomeBackToastProps> = ({
  userName,
  streak,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] animate-fade-in-up pointer-events-none">
      <div className="px-4 py-3 rounded-2xl glass-card flex items-center gap-3 shadow-cinematic max-w-[90vw]">
        <div className="p-2 rounded-xl bg-[#E8825A]/20 border border-[#E8825A]/30 glow-coral">
          <Sparkles className="w-4 h-4 text-[#E8825A]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#EDE7F0] truncate">
            Bienvenido de nuevo, {userName}
          </p>
          {streak > 1 && (
            <p className="text-[11px] text-[#F5A87E]/80">
              🔥 Racha de {streak} días seguidos
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
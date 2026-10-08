import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {isInstallable && (
        <button
          onClick={install}
          className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E8825A] to-[#F5A87E] text-[#0D0A1A] font-medium shadow-md shadow-[#E8825A]/20 hover:opacity-95 transition-all active:scale-95 ${
            compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm w-full justify-center'
          }`}
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>Instalar Conversa (PWA)</span>
        </button>
      )}

      {isIOS && (
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 rounded-xl border border-[#3D2E4A] bg-[#1A1430]/80 text-[#EDE7F0] hover:border-[#E8825A]/60 transition-all ${
            compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm w-full justify-center'
          }`}
        >
          <Download className="w-4 h-4 text-[#F5A87E]" />
          <span>Instalar en iPhone / iPad</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0A1A]/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#1A1430] border border-[#2A2145] p-6 shadow-2xl relative text-[#EDE7F0]">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 text-[#EDE7F0]/60 hover:text-[#EDE7F0] p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-[#EDE7F0] flex items-center gap-2 font-serif-cinematic tracking-wide">
              Instalar Conversa en iOS
            </h3>
            <div className="mt-4 space-y-3 text-sm text-[#EDE7F0]/80">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#2A2145]/40 border border-[#3D2E4A]/40">
                <Share2 className="w-5 h-5 text-[#E8825A] mt-0.5 shrink-0" />
                <p>1. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.</p>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#2A2145]/40 border border-[#3D2E4A]/40">
                <PlusSquare className="w-5 h-5 text-[#F5A87E] mt-0.5 shrink-0" />
                <p>2. Desplázate hacia abajo y selecciona <strong>Agregar a pantalla de inicio</strong>.</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-[#2A2145] hover:bg-[#3D2E4A] py-2.5 text-sm font-medium text-[#EDE7F0] transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

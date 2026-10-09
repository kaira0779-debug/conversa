import React from 'react';
import { Sparkles, X, Check } from 'lucide-react';
import { ChangelogEntry, APP_VERSION } from '../../lib/version';

interface ChangelogModalProps {
  entries: ChangelogEntry[];
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ entries, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0D0A1A]/92 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md max-h-[88vh] rounded-3xl glass-card overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="relative p-5 pb-4 border-b border-[#2A2145]/60 bg-gradient-to-br from-[#1A1430] to-[#0D0A1A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#E8825A]/15 border border-[#E8825A]/30 glow-coral">
              <Sparkles className="w-5 h-5 text-[#E8825A]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-[#EDE7F0]">Novedades</h2>
              <p className="text-xs text-[#F5A87E]/70">
                Versión {APP_VERSION}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#2A2145]/50 hover:bg-[#2A2145] text-[#EDE7F0]/70 hover:text-[#EDE7F0] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {entries.map((entry, idx) => (
            <div key={entry.version} className="relative">
              {/* Timeline line */}
              {idx < entries.length - 1 && (
                <div className="absolute left-[14px] top-8 bottom-[-24px] w-[2px] bg-gradient-to-b from-[#E8825A]/50 to-transparent" />
              )}

              <div className="flex gap-3">
                {/* Version badge */}
                <div className="shrink-0 mt-0.5">
                  <div className="w-7 h-7 rounded-full bg-[#2A2145] border-2 border-[#E8825A]/60 flex items-center justify-center text-sm">
                    {entry.emoji}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#E8825A]">
                      v{entry.version}
                    </span>
                    <span className="text-[10px] text-[#EDE7F0]/40">
                      {new Date(entry.date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#EDE7F0] mt-1">
                    {entry.title}
                  </h3>

                  <ul className="mt-2.5 space-y-2">
                    {entry.changes.map((change, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-[13px] text-[#EDE7F0]/85 leading-relaxed"
                      >
                        <Check className="w-3.5 h-3.5 text-[#E8825A] shrink-0 mt-1" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2A2145]/60 bg-[#0D0A1A]/70">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-[#E8825A] hover:bg-[#E8825A]/90 text-[#0D0A1A] font-bold text-sm glow-coral active:scale-[0.98] transition"
          >
            Entendido, ¡seguimos!
          </button>
        </div>
      </div>
    </div>
  );
};
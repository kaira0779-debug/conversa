import React, { useState } from 'react';
import { Lock, Delete, ShieldAlert } from 'lucide-react';

interface PinLockModalProps {
  storedPin: string;
  onSuccess: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({ storedPin, onSuccess }) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');

      if (nextPin.length === storedPin.length) {
        if (nextPin === storedPin) {
          onSuccess();
        } else {
          setError('PIN incorrecto. Inténtalo de nuevo.');
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0A1A]/95 backdrop-blur-xl p-4">
      <div className="w-full max-w-xs text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-3xl bg-[#1A1430] border border-[#2A2145] flex items-center justify-center text-[#E8825A] mb-5 shadow-xl shadow-[#0D0A1A]">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold font-serif-cinematic tracking-wide text-[#EDE7F0]">
          Conversa Protegida
        </h2>
        <p className="text-xs text-[#EDE7F0]/60 mt-1 mb-6">
          Ingresa tu PIN de seguridad para acceder a tus historias
        </p>

        {/* PIN Indicators */}
        <div className="flex items-center gap-3 mb-6">
          {Array.from({ length: storedPin.length || 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                i < pin.length
                  ? 'bg-[#E8825A] border-[#E8825A] scale-110 shadow-sm shadow-[#E8825A]'
                  : 'bg-[#1A1430] border-[#3D2E4A]'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-[#E8825A] mb-4 bg-[#6B3A4A]/30 px-3 py-1.5 rounded-lg border border-[#6B3A4A]/50">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-[#1A1430] hover:bg-[#2A2145] active:scale-95 border border-[#2A2145]/60 text-lg font-semibold text-[#EDE7F0] transition flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-[#1A1430] hover:bg-[#2A2145] active:scale-95 border border-[#2A2145]/60 text-lg font-semibold text-[#EDE7F0] transition flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-[#1A1430] hover:bg-[#2A2145] active:scale-95 border border-[#2A2145]/60 text-sm font-medium text-[#EDE7F0]/70 transition flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

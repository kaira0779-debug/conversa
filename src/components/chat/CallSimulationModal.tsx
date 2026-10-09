import React, { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, Sparkles } from 'lucide-react';
import { Character } from '../../types';

interface CallSimulationModalProps {
  character: Character;
  onClose: () => void;
}

export const CallSimulationModal: React.FC<CallSimulationModalProps> = ({
  character,
  onClose,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [whisperIndex, setWhisperIndex] = useState(0);

  const ambientWhispers = [
    `"...¿estás ahí? Por fin puedo escuchar tu respiración en el silencio..."`,
    `"...el viento afuera no deja de soplar, pero tu voz hace que todo se detenga..."`,
    `"...dime lo que estás pensando ahora mismo. No me ocultes nada..."`,
    `"...hay cosas que solo se pueden confesar cuando cae la noche completa..."`,
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    const whisperTimer = setInterval(() => {
      setWhisperIndex(prev => (prev + 1) % ambientWhispers.length);
    }, 6000);

    return () => {
      clearInterval(timer);
      clearInterval(whisperTimer);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#0D0A1A]/95 backdrop-blur-2xl p-6 text-[#EDE7F0]">
      {/* Top info */}
      <div className="pt-8 text-center flex flex-col items-center">
        <span className="text-xs uppercase tracking-widest text-[#E8825A] flex items-center gap-1.5 font-medium mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          Conexión Íntima Activa
        </span>
        <h2 className="text-3xl font-bold font-serif-cinematic tracking-wide mt-1">
          {character.name}
        </h2>
        <span className="text-sm text-[#EDE7F0]/60 mt-1 font-mono">
          {formatTime(seconds)}
        </span>
      </div>

      {/* Central Portrait & Pulsing Audio Waves */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        {/* Animated aura rings */}
        <div className="absolute w-56 h-56 rounded-full border border-[#E8825A]/20 animate-ping opacity-30" />
        <div className="absolute w-64 h-64 rounded-full border border-[#2A2145] animate-pulse" />

        <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-[#2A2145] shadow-2xl glow-coral">
          <img
            src={character.avatar}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Audio Visualizer Wave simulation */}
        <div className="flex items-center gap-1.5 mt-8 h-8">
          {[40, 75, 30, 95, 60, 100, 45, 80, 50, 90, 35].map((height, i) => (
            <div
              key={i}
              className="w-1.5 bg-[#E8825A] rounded-full transition-all duration-300"
              style={{
                height: `${Math.max(12, height * (0.4 + Math.sin((seconds * 2 + i)) * 0.4))}%`,
                opacity: 0.6 + (i % 3) * 0.2,
              }}
            />
          ))}
        </div>

        {/* Dynamic whisper subtitle */}
        <p className="text-sm font-serif-cinematic italic text-[#F5A87E]/90 mt-5 max-w-xs text-center px-4 transition-opacity duration-700">
          {ambientWhispers[whisperIndex]}
        </p>
      </div>

      {/* Bottom Controls */}
      <div className="pb-8 w-full max-w-xs flex items-center justify-around">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-full border transition active:scale-95 ${
            isMuted
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
              : 'bg-[#1A1430] border-[#2A2145] text-[#EDE7F0]'
          }`}
          title={isMuted ? 'Desmutear' : 'Silenciar'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={onClose}
          className="p-5 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-90 text-white shadow-xl shadow-rose-950 transition"
          title="Colgar"
        >
          <PhoneOff className="w-7 h-7" />
        </button>

        <button
          className="p-4 rounded-full bg-[#1A1430] border border-[#2A2145] text-[#EDE7F0] hover:bg-[#2A2145] transition"
          title="Altavoz"
        >
          <Volume2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { SoundscapeItem } from '../../types';
import { audioEngine } from '../../lib/audioEngine';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';

interface SoundscapePlayerModalProps {
  soundscape: SoundscapeItem;
  onClose: () => void;
}

export const SoundscapePlayerModal: React.FC<SoundscapePlayerModalProps> = ({
  soundscape,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [targetDuration, setTargetDuration] = useState(soundscape.durationSeconds || 1200);
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Start audio on mount
    audioEngine.setVolume(volume);
    audioEngine.playPreset(soundscape.synthPreset);
    setIsPlaying(true);

    return () => {
      audioEngine.stop();
    };
  }, [soundscape]);

  // Timer countdown
  useEffect(() => {
    let interval: number | null = null;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setElapsedSeconds(prev => {
          if (prev >= targetDuration) {
            audioEngine.stop();
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, targetDuration]);

  const togglePlay = () => {
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
    } else {
      audioEngine.playPreset(soundscape.synthPreset);
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    audioEngine.setVolume(newVol);
    if (newVol > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Progress computation for SVG circle
  const progressPercent = Math.min(elapsedSeconds / targetDuration, 1);
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressPercent * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0A1A]/95 backdrop-blur-2xl p-4 text-[#EDE7F0]">
      {/* Background ambient lighting */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-20 filter blur-xl scale-110"
        style={{ backgroundImage: `url(${soundscape.bgImage})` }}
      />

      <div className="relative w-full max-w-sm rounded-3xl bg-[#1A1430]/90 border border-[#2A2145] p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={() => {
            audioEngine.stop();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-[#EDE7F0]/60 hover:text-[#EDE7F0] rounded-xl hover:bg-[#2A2145]/50 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Category Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2A2145]/60 border border-[#3D2E4A]/80 text-[#F5A87E] text-[10px] font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3 h-3 text-[#E8825A]" />
          <span>{soundscape.category}</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold font-serif-cinematic tracking-wide text-[#EDE7F0]">
          {soundscape.title}
        </h2>
        <p className="text-xs text-[#EDE7F0]/70 mt-1 mb-6 max-w-xs leading-relaxed">
          {soundscape.description}
        </p>

        {/* Gradient Progress Ring: Lavanda (#2A2145) to Coral (#E8825A) */}
        <div className="relative w-56 h-56 flex items-center justify-center mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 220 220">
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2A2145" />
                <stop offset="50%" stopColor="#6B3A4A" />
                <stop offset="100%" stopColor="#E8825A" />
              </linearGradient>
            </defs>
            {/* Background ring */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              className="stroke-[#1A1430]"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Ambient track ring */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              className="stroke-[#2A2145]/60"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Gradient progress ring */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="url(#ringGradient)"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>

          {/* Center Info in the ring */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-serif-cinematic tracking-wider text-[#EDE7F0]">
              {formatTime(targetDuration - elapsedSeconds)}
            </span>
            <span className="text-[10px] text-[#EDE7F0]/50 uppercase tracking-widest mt-0.5">
              restante
            </span>
            {isPlaying && (
              <div className="flex items-center gap-1 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8825A] animate-ping" />
                <span className="text-[10px] text-[#F5A87E]">Sintetizador activo</span>
              </div>
            )}
          </div>
        </div>

        {/* Duration presets */}
        <div className="flex items-center gap-2 mb-6 text-xs">
          {[
            { label: '10 min', secs: 600 },
            { label: '20 min', secs: 1200 },
            { label: '30 min', secs: 1800 },
            { label: 'Infinito', secs: 999999 },
          ].map(p => (
            <button
              key={p.label}
              onClick={() => {
                setTargetDuration(p.secs);
                setElapsedSeconds(0);
              }}
              className={`px-2.5 py-1 rounded-lg border transition ${
                targetDuration === p.secs
                  ? 'bg-[#E8825A]/20 border-[#E8825A] text-[#F5A87E] font-semibold'
                  : 'bg-[#1A1430] border-[#2A2145] text-[#EDE7F0]/60 hover:text-[#EDE7F0]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Minimalist Controls */}
        <div className="w-full flex items-center justify-center gap-6 mb-6">
          <button
            onClick={toggleMute}
            className="p-3 rounded-full bg-[#2A2145]/50 text-[#EDE7F0]/70 hover:text-[#EDE7F0] transition"
            title={isMuted ? 'Desmutear' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Primary Play / Pause button in coral */}
          <button
            onClick={togglePlay}
            className="p-5 rounded-full bg-[#E8825A] hover:bg-[#E8825A]/90 text-[#0D0A1A] font-bold shadow-xl shadow-[#E8825A]/30 glow-coral transition active:scale-95"
            title={isPlaying ? 'Pausar ambiente' : 'Reproducir ambiente'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-[#0D0A1A]" />
            ) : (
              <Play className="w-6 h-6 fill-[#0D0A1A] ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setElapsedSeconds(0)}
            className="p-3 rounded-full bg-[#2A2145]/50 text-[#EDE7F0]/70 hover:text-[#EDE7F0] transition"
            title="Reiniciar temporizador"
          >
            <Clock className="w-5 h-5" />
          </button>
        </div>

        {/* Volume slider */}
        <div className="w-full flex items-center gap-3 px-4">
          <span className="text-[10px] text-[#EDE7F0]/40 uppercase tracking-wider">Volumen</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="flex-1 accent-[#E8825A] h-1.5 rounded-lg bg-[#2A2145] cursor-pointer"
          />
          <span className="text-[10px] text-[#EDE7F0]/60 font-mono w-7 text-right">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

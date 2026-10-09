import React, { useState } from 'react';
import { INITIAL_SOUNDSCAPES } from '../../lib/storage';
import { SoundscapeItem } from '../../types';
import { Sparkles, Play, Clock, Headphones } from 'lucide-react';
import { SoundscapePlayerModal } from './SoundscapePlayerModal';

export const ExploreScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [activeSoundscape, setActiveSoundscape] = useState<SoundscapeItem | null>(null);

  const categories = [
    'Todas',
    'Fantasía Oscura',
    'Cyberpunk Noir',
    'Refugios & Lluvia',
    'Trance & Sueño',
    'Romance & Calma',
  ];

  const filtered = selectedCategory === 'Todas'
    ? INITIAL_SOUNDSCAPES
    : INITIAL_SOUNDSCAPES.filter(s => s.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#0D0A1A] pb-24 text-[#EDE7F0]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0D0A1A]/85 backdrop-blur-xl border-b border-[#2A2145]/70 pt-safe px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold font-serif-cinematic tracking-wide text-[#EDE7F0]">
              Mindly & Ambientes <span className="text-[#E8825A]">✦</span>
            </h1>
            <p className="text-[11px] text-[#EDE7F0]/60">
              Inmersión acústica cinematográfica, concentración y descanso
            </p>
          </div>
          <div className="p-2 rounded-xl bg-[#2A2145]/60 border border-[#3D2E4A]/50 text-[#E8825A]">
            <Headphones className="w-5 h-5" />
          </div>
        </div>

        {/* Categories horizontal bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition border ${
                selectedCategory === cat
                  ? 'bg-[#E8825A] text-[#0D0A1A] font-bold border-[#E8825A] shadow-md shadow-[#E8825A]/20'
                  : 'bg-[#1A1430] text-[#EDE7F0]/70 border-[#2A2145] hover:text-[#EDE7F0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Featured Inspiration Card */}
        <div className="relative p-5 rounded-3xl bg-gradient-to-br from-[#1A1430] via-[#2A2145] to-[#3D2E4A] border border-[#3D2E4A] overflow-hidden shadow-xl">
          <div className="relative z-10">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#F5A87E] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Experiencia Acústica Sintetizada
            </span>
            <h2 className="text-xl font-bold font-serif-cinematic text-[#EDE7F0] leading-snug">
              Desconecta del mundo exterior. Sumérgete en el relato.
            </h2>
            <p className="text-xs text-[#EDE7F0]/80 mt-1 max-w-xs leading-relaxed font-sans">
              Sonidos generados en tiempo real mediante Web Audio API en tu dispositivo: lluvia binaural, crepitar de brasas y drones armónicos.
            </p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-[#E8825A]/15 blur-2xl pointer-events-none" />
        </div>

        {/* Soundscapes List */}
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveSoundscape(item)}
              className="group relative rounded-2xl bg-[#1A1430] border border-[#2A2145] overflow-hidden hover:border-[#E8825A]/50 transition-all cursor-pointer shadow-md flex items-center p-3 gap-3.5 active:scale-[0.99]"
            >
              {/* Thumbnail with overlay & play icon */}
              <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-[#2A2145]">
                <img
                  src={item.bgImage}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                />
                <div className="absolute inset-0 bg-[#0D0A1A]/40 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#E8825A] text-[#0D0A1A] flex items-center justify-center shadow-md group-hover:scale-110 transition glow-coral">
                    <Play className="w-4 h-4 fill-[#0D0A1A] ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#F5A87E] truncate">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-[#EDE7F0]/40 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {Math.round(item.durationSeconds / 60)} min
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#EDE7F0] font-serif-cinematic tracking-wide group-hover:text-[#F5A87E] transition truncate">
                  {item.title}
                </h3>
                <p className="text-[11px] text-[#EDE7F0]/65 line-clamp-2 leading-relaxed mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Soundscape Modal Player */}
      {activeSoundscape && (
        <SoundscapePlayerModal
          soundscape={activeSoundscape}
          onClose={() => setActiveSoundscape(null)}
        />
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Character } from '../../types';
import { Storage } from '../../lib/storage';
import { Search, Heart, Star, Plus, Info, Maximize2 } from 'lucide-react';
import { ImageViewerModal } from '../common/ImageViewerModal';

type SortMode = 'recent' | 'az' | 'favorites' | 'category';
type CategoryFilter = 'todos' | 'anime' | 'videojuegos' | 'libros' | 'fantasia';

interface CharacterGridScreenProps {
  onOpenCharacterProfile: (charId: string) => void;
  onStartChat: (char: Character) => void;
  onOpenCreateCharacter?: () => void;
}

export const CharacterGridScreen: React.FC<CharacterGridScreenProps> = ({
  onOpenCharacterProfile,
  onStartChat,
  onOpenCreateCharacter,
}) => {
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [category, setCategory] = useState<CategoryFilter>('todos');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewingImage, setViewingImage] = useState<{ src: string; alt: string } | null>(null);
  const [, forceRefresh] = useState(0);

  const allCharacters = Storage.getCharacters();

  const filtered = useMemo(() => {
    let list = [...allCharacters];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.occupation && c.occupation.toLowerCase().includes(q)) ||
          (c.originSource && c.originSource.toLowerCase().includes(q))
      );
    }
    if (category !== 'todos') list = list.filter((c) => c.category === category);
    if (onlyFavorites) list = list.filter((c) => c.isFavorite);

    switch (sortMode) {
      case 'az': list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'favorites': list.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)); break;
      case 'category': list.sort((a, b) => (a.category || '').localeCompare(b.category || '')); break;
    }
    return list;
  }, [allCharacters, search, category, onlyFavorites, sortMode]);

  const toggleFavorite = (char: Character, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...char, isFavorite: !char.isFavorite };
    Storage.saveCharacter(updated);
    forceRefresh((n) => n + 1);
  };

  const categories: { id: CategoryFilter; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'anime', label: 'Anime' },
    { id: 'videojuegos', label: 'Juegos' },
    { id: 'libros', label: 'Libros' },
    { id: 'fantasia', label: 'Fantasía' },
  ];

  return (
    <div className="relative min-h-screen bg-[#0D0A1A] pb-24 text-[#EDE7F0] overflow-hidden">
      <div className="ambient-glow-top" />

      {/* Header */}
      <header className="sticky top-0 z-30 glass-panel border-b border-[#2A2145]/40">
        <div className="max-w-md mx-auto px-4 pt-safe pb-3">
          <div className="flex items-center justify-between mb-3 pt-3">
            <div className="animate-fade-in-up">
              <h1 className="text-2xl leading-none font-bold tracking-wide">
                Conversa <span className="text-[#E8825A]">✦</span>
              </h1>
              <p className="text-[11px] text-[#F5A87E]/70 mt-1 tracking-wider uppercase">
                {filtered.length} personajes
              </p>
            </div>
            <div className="flex items-center gap-1.5 animate-fade-in-up">
              <button
                onClick={() => setOnlyFavorites((v) => !v)}
                className={`p-2 rounded-xl transition-all ${
                  onlyFavorites
                    ? 'bg-[#6B3A4A]/50 border border-[#E8825A]/60 text-[#E8825A] glow-coral'
                    : 'bg-[#1A1430]/60 border border-[#2A2145]/60 text-[#EDE7F0]/60'
                }`}
              >
                <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-[#E8825A]' : ''}`} />
              </button>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="px-2.5 py-2 rounded-xl bg-[#1A1430]/60 border border-[#2A2145]/60 text-xs text-[#EDE7F0]/80 focus:outline-none focus:border-[#E8825A]/60"
              >
                <option value="recent">Recientes</option>
                <option value="az">A-Z</option>
                <option value="favorites">Favoritos</option>
                <option value="category">Categoría</option>
              </select>
            </div>
          </div>

          <div className="relative mb-2.5 animate-fade-in-up">
            <Search className="w-4 h-4 text-[#F5A87E]/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, serie o rol..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 animate-fade-in-up">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  category === cat.id
                    ? 'bg-[#E8825A] text-[#0D0A1A] font-bold shadow-lg shadow-[#E8825A]/25'
                    : 'bg-[#1A1430]/60 text-[#EDE7F0]/70 border border-[#2A2145]/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Grid 2 COLUMNAS */}
      <main className="max-w-md mx-auto px-4 py-4 relative z-10">
        {filtered.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <p className="text-base font-semibold">Sin personajes</p>
            <p className="text-sm text-[#EDE7F0]/50 mt-1">Crea uno con el botón +</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 stagger">
            {filtered.map((char, idx) => (
              <button
                key={char.id}
                onClick={() => onStartChat(char)}
                className="flex flex-col active:scale-[0.97] transition-transform animate-fade-in-up text-left"
                style={{ animationDelay: `${Math.min(idx * 0.02, 0.3)}s` }}
              >
                {/* Card container */}
                <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[#1A1430] border border-[#2A2145]/80 active:border-[#E8825A] transition-all shadow-cinematic group">
                  <img
                    src={char.avatar}
                    alt={char.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://image.pollinations.ai/prompt/${encodeURIComponent(
                        `${char.name}, ${char.appearance || 'character'}, cinematic portrait, high quality`
                      )}?width=1024&height=1536&model=flux&seed=${Math.floor(Math.random() * 999999)}&nologo=true`;
                    }}
                  />

                  {/* Gradient overlay inferior */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0D0A1A] via-[#0D0A1A]/60 to-transparent pointer-events-none" />

                  {/* Info inferior sobre la imagen */}
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-base font-bold text-[#EDE7F0] truncate leading-tight drop-shadow-lg">
                      {char.name}
                    </p>
                    {char.occupation && (
                      <p className="text-[11px] text-[#F5A87E] truncate mt-0.5 font-medium drop-shadow">
                        {char.occupation}
                      </p>
                    )}
                    {char.personalityTags && char.personalityTags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 overflow-hidden">
                        {char.personalityTags.slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#0D0A1A]/80 backdrop-blur-sm border border-[#6B3A4A]/50 text-[#F5A87E] whitespace-nowrap"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Botones superiores flotantes */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                    <button
                      onClick={(e) => toggleFavorite(char, e)}
                      className="p-1.5 rounded-full bg-[#0D0A1A]/80 backdrop-blur-md active:scale-90 transition"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          char.isFavorite ? 'fill-[#E8825A] text-[#E8825A]' : 'text-[#EDE7F0]/70'
                        }`}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingImage({ src: char.avatar, alt: char.name });
                      }}
                      className="p-1.5 rounded-full bg-[#0D0A1A]/80 backdrop-blur-md active:scale-90 transition"
                      title="Ver imagen completa"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-[#EDE7F0]/70" />
                    </button>
                  </div>

                  {/* Botón perfil esquina inferior derecha */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCharacterProfile(char.id);
                    }}
                    className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[#0D0A1A]/80 backdrop-blur-md active:scale-90 transition"
                    title="Ver perfil"
                  >
                    <Info className="w-3.5 h-3.5 text-[#F5A87E]" />
                  </button>

                  {/* Villain badge */}
                  {char.isVillain && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-950/90 backdrop-blur-sm text-[9px] font-bold text-rose-300 border border-rose-800/60">
                      VILLANO
                    </span>
                  )}
                </div>
              </button>
            ))}

            {/* Crear personaje */}
            {onOpenCreateCharacter && (
              <button
                onClick={onOpenCreateCharacter}
                className="flex flex-col active:scale-[0.97] transition-transform animate-fade-in-up"
              >
                <div className="w-full aspect-[3/4] rounded-2xl bg-gradient-to-br from-[#1A1430]/60 to-[#0D0A1A]/60 border-2 border-dashed border-[#3D2E4A]/60 flex flex-col items-center justify-center text-[#F5A87E]/60 gap-2">
                  <Plus className="w-8 h-8" />
                  <span className="text-xs font-medium">Crear personaje</span>
                </div>
              </button>
            )}
          </div>
        )}
      </main>

      {/* Image viewer */}
      {viewingImage && (
        <ImageViewerModal
          src={viewingImage.src}
          alt={viewingImage.alt}
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  );
};
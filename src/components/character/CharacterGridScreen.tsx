import React, { useState, useMemo } from 'react';
import { Character } from '../../types';
import { Storage } from '../../lib/storage';
import { Search, Heart, Sparkles, Star, Plus, Layers } from 'lucide-react';

type SortMode = 'recent' | 'az' | 'favorites' | 'category';
type CategoryFilter = 'todos' | 'anime' | 'videojuegos' | 'libros' | 'fantasia';

interface CharacterGridScreenProps {
  onOpenCharacterProfile: (charId: string) => void;
  onStartChat: (char: Character) => void;
  onOpenCreateCharacter?: () => void;
}

// 🔥 Componente de avatar con fallback automático
const CharacterAvatar: React.FC<{ character: Character; className?: string }> = ({
  character,
  className = '',
}) => {
  const [imgSrc, setImgSrc] = useState(character.avatar);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (failed) return;
    setFailed(true);
    // Genera una URL nueva de Pollinations con el nombre del personaje
    const seed = Math.floor(Math.random() * 999999);
    const prompt = encodeURIComponent(
      `${character.name}, ${character.appearance || character.occupation || 'male character'}, portrait, cinematic lighting, highly detailed`
    );
    setImgSrc(
      `https://image.pollinations.ai/prompt/${prompt}?width=768&height=1024&model=flux&seed=${seed}&nologo=true`
    );
  };

  return (
    <img
      src={imgSrc}
      alt={character.name}
      loading="lazy"
      onError={handleError}
      className={className}
    />
  );
};

export const CharacterGridScreen: React.FC<CharacterGridScreenProps> = ({
  onOpenCharacterProfile,
  onStartChat,
  onOpenCreateCharacter,
}) => {
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [category, setCategory] = useState<CategoryFilter>('todos');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [longPressChar, setLongPressChar] = useState<Character | null>(null);
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

      <header className="sticky top-0 z-30 glass-panel border-b border-[#2A2145]/40">
        <div className="max-w-md mx-auto px-4 pt-safe pb-3">
          <div className="flex items-center justify-between mb-3 pt-3">
            <div className="animate-fade-in-up">
              <h1 className="text-2xl leading-none font-bold tracking-wide text-[#EDE7F0]">
                Conversa <span className="text-[#E8825A]">✦</span>
              </h1>
              <p className="text-[11px] text-[#F5A87E]/70 mt-1 tracking-wider uppercase">
                {filtered.length} {filtered.length === 1 ? 'personaje' : 'personajes'}
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

      <main className="max-w-md mx-auto px-4 py-4 relative z-10">
        {filtered.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-[#1A1430] border border-[#2A2145] flex items-center justify-center text-[#F5A87E]/40">
              <Sparkles className="w-7 h-7" />
            </div>
            <p className="text-base font-semibold text-[#EDE7F0]">
              {search ? 'Sin coincidencias' : 'Sin personajes aquí aún'}
            </p>
            <p className="text-sm text-[#EDE7F0]/50 mt-1 max-w-xs mx-auto">
              {search ? 'Prueba con otro nombre o cambia el filtro.' : 'Crea uno nuevo o explora el catálogo.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 stagger">
            {filtered.map((char, idx) => (
              <button
                key={char.id}
                onClick={() => onOpenCharacterProfile(char.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setLongPressChar(char);
                }}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform animate-fade-in-up"
                style={{ animationDelay: `${Math.min(idx * 0.015, 0.3)}s` }}
              >
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#1A1430] border border-[#2A2145]/80 active:border-[#E8825A] transition-all shadow-cinematic">
                  {/* 🔥 Avatar con fallback automático */}
                  <CharacterAvatar
                    character={char}
                    className="w-full h-full object-cover transition-transform duration-500"
                  />

                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0D0A1A]/70 via-[#0D0A1A]/20 to-transparent pointer-events-none" />

                  <button
                    onClick={(e) => toggleFavorite(char, e)}
                    className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-[#0D0A1A]/80 backdrop-blur-md active:scale-90 transition"
                  >
                    <Star
                      className={`w-3 h-3 ${
                        char.isFavorite ? 'fill-[#E8825A] text-[#E8825A]' : 'text-[#EDE7F0]/70'
                      }`}
                    />
                  </button>

                  {char.category && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-[#0D0A1A]/80 backdrop-blur-md text-[8px] uppercase tracking-wider text-[#F5A87E] font-bold border border-[#6B3A4A]/40">
                      {char.category === 'videojuegos'
                        ? 'GAME'
                        : char.category === 'anime'
                        ? 'ANIME'
                        : char.category === 'libros'
                        ? 'LIBRO'
                        : 'FANT'}
                    </span>
                  )}

                  {char.isVillain && (
                    <span className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0D0A1A]/70" />
                  )}
                </div>

                <span className="text-[12px] font-medium text-[#EDE7F0] truncate w-full text-center leading-tight">
                  {char.name}
                </span>
                {char.occupation && (
                  <span className="text-[10px] text-[#F5A87E]/60 truncate w-full text-center -mt-1">
                    {char.occupation.split(' ').slice(0, 2).join(' ')}
                  </span>
                )}
              </button>
            ))}

            {onOpenCreateCharacter && (
              <button
                onClick={onOpenCreateCharacter}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform animate-fade-in-up"
              >
                <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-[#1A1430]/60 to-[#0D0A1A]/60 border-2 border-dashed border-[#3D2E4A]/60 flex items-center justify-center text-[#F5A87E]/40">
                  <Plus className="w-7 h-7" />
                </div>
                <span className="text-[11px] text-[#F5A87E]/50 text-center">Crear</span>
              </button>
            )}
          </div>
        )}
      </main>

      {longPressChar && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center p-4 animate-fade-in"
          onClick={() => setLongPressChar(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl glass-card p-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-[#2A2145]/60 mb-3">
              <CharacterAvatar
                character={longPressChar}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#3D2E4A]/70"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-base truncate text-[#EDE7F0]">{longPressChar.name}</p>
                <p className="text-xs text-[#F5A87E]/70 truncate">{longPressChar.occupation}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  onStartChat(longPressChar);
                  setLongPressChar(null);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#E8825A] text-[#0D0A1A] font-bold text-sm glow-coral active:scale-[0.98] transition"
              >
                <span>Iniciar conversación</span>
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  onOpenCharacterProfile(longPressChar.id);
                  setLongPressChar(null);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#2A2145]/50 text-sm text-[#EDE7F0]"
              >
                <span>Ver perfil completo</span>
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLongPressChar(null)}
                className="w-full p-2.5 rounded-xl text-sm text-[#EDE7F0]/50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
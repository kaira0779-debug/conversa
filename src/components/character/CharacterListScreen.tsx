import React, { useState } from 'react';
import { Character, CharacterCategory } from '../../types';
import { Storage } from '../../lib/storage';
import { generateFantasyCharacter, generateBatchFantasyCharacters } from '../../lib/characterGenerator';
import { Search, Plus, Heart, Sparkles, MessageSquare, ShieldAlert, Wand2, Loader2, Gamepad2, BookOpen, Swords, Sparkle, Compass } from 'lucide-react';
import { CharacterEditorModal } from './CharacterEditorModal';

interface CharacterListScreenProps {
  onOpenCharacterProfile: (charId: string) => void;
  onStartChat: (character: Character) => void;
}

export const CharacterListScreen: React.FC<CharacterListScreenProps> = ({
  onOpenCharacterProfile,
  onStartChat,
}) => {
  const [characters, setCharacters] = useState<Character[]>(() => Storage.getCharacters());
  const [search, setSearch] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CharacterCategory>('todos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSummoning, setIsSummoning] = useState(false);
  const [summonMessage, setSummonMessage] = useState<string | null>(null);

  const categories: { id: CharacterCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'todos', label: 'Todos', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'videojuegos', label: 'Videojuegos', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
    { id: 'anime', label: 'Anime', icon: <Swords className="w-3.5 h-3.5" /> },
    { id: 'libros', label: 'Libros & Novelas', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'fantasia', label: 'Fantasía Arcana', icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  const handleSummonCharacter = async (categoryChoice?: CharacterCategory) => {
    setIsSummoning(true);
    const cat = categoryChoice || selectedCategory;
    setSummonMessage(`Invocando personaje original de ${cat === 'todos' ? 'ficción' : cat}...`);

    try {
      const newChar = await generateFantasyCharacter({ category: cat });
      Storage.saveCharacter(newChar);
      const updatedList = Storage.getCharacters();
      setCharacters(updatedList);
      setSummonMessage(`¡${newChar.name} (${newChar.occupation}) ha despertado!`);
      setTimeout(() => setSummonMessage(null), 3500);
    } catch (err: any) {
      console.error(err);
      setSummonMessage('Error al invocar. Inténtalo de nuevo.');
      setTimeout(() => setSummonMessage(null), 3000);
    } finally {
      setIsSummoning(false);
    }
  };

  const handleSummonBatch = async () => {
    setIsSummoning(true);
    setSummonMessage('Invocando lote de 3 personajes con portada ilustrada...');
    try {
      const batch = await generateBatchFantasyCharacters(3, selectedCategory);
      batch.forEach(c => Storage.saveCharacter(c));
      setCharacters(Storage.getCharacters());
      setSummonMessage('¡3 nuevos personajes de ficción añadidos al catálogo!');
      setTimeout(() => setSummonMessage(null), 3500);
    } catch (err) {
      console.error(err);
      setSummonMessage('Error al generar lote.');
      setTimeout(() => setSummonMessage(null), 3000);
    } finally {
      setIsSummoning(false);
    }
  };

  const filtered = characters.filter((c) => {
    const matchesCategory =
      selectedCategory === 'todos' ||
      c.category === selectedCategory ||
      (!c.category && selectedCategory === 'fantasia');

    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.occupation.toLowerCase().includes(search.toLowerCase()) ||
      (c.originSource && c.originSource.toLowerCase().includes(search.toLowerCase())) ||
      c.personalityTags?.some(t => t.toLowerCase().includes(search.toLowerCase()));

    const matchesFav = onlyFavorites ? c.isFavorite : true;
    return matchesCategory && matchesSearch && matchesFav;
  });

  const handleToggleFavorite = (e: React.MouseEvent, charId: string) => {
    e.stopPropagation();
    const updated = characters.map(c => (c.id === charId ? { ...c, isFavorite: !c.isFavorite } : c));
    setCharacters(updated);
    Storage.saveCharacters(updated);
  };

  const handleSaveNewCharacter = (newChar: Character) => {
    Storage.saveCharacter(newChar);
    setCharacters(Storage.getCharacters());
  };

  return (
    <div className="min-h-screen bg-[#0D0A1A] pb-24 text-[#EDE7F0]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0D0A1A]/90 backdrop-blur-xl border-b border-[#2A2145]/80 pt-safe px-3.5 py-3">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h1 className="text-xl font-bold font-serif-cinematic tracking-wide text-[#EDE7F0] flex items-center gap-1.5">
              <span>Personajes de Ficción</span>
              <span className="text-[#E8825A] text-base">✦</span>
            </h1>
            <p className="text-[10px] text-[#EDE7F0]/60">
              Videojuegos, anime y novelas ilustradas con memoria continua
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 rounded-xl border border-[#3D2E4A] hover:bg-[#2A2145] text-xs font-medium text-[#EDE7F0] transition flex items-center gap-1"
              title="Crear personaje manualmente"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Manual</span>
            </button>
            <button
              onClick={handleSummonBatch}
              disabled={isSummoning}
              className="px-2.5 py-1.5 rounded-xl bg-[#2A2145] hover:bg-[#3D2E4A] text-xs font-medium text-[#F5A87E] border border-[#3D2E4A] transition disabled:opacity-50"
              title="Generar lote de 3 personajes"
            >
              +3 Lote
            </button>
            <button
              onClick={() => handleSummonCharacter()}
              disabled={isSummoning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8825A] hover:bg-[#E8825A]/90 text-[#0D0A1A] text-xs font-bold shadow-md shadow-[#E8825A]/25 transition active:scale-95 glow-coral disabled:opacity-60"
            >
              {isSummoning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              <span>{isSummoning ? 'Invocando...' : 'Invocar IA'}</span>
            </button>
          </div>
        </div>

        {/* Category Pills (Videojuegos, Anime, Libros, Fantasía) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition shrink-0 whitespace-nowrap active:scale-95 ${
                selectedCategory === cat.id
                  ? 'bg-[#E8825A] text-[#0D0A1A] font-bold shadow-md shadow-[#E8825A]/20'
                  : 'bg-[#1A1430] hover:bg-[#2A2145] text-[#EDE7F0]/80 border border-[#2A2145]'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Summon notification feedback */}
        {summonMessage && (
          <div className="mb-2 p-2 rounded-xl bg-[#6B3A4A]/50 border border-[#E8825A]/50 text-xs text-[#F5A87E] text-center flex items-center justify-center gap-2 animate-fade-in shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-[#E8825A] animate-spin" />
            <span>{summonMessage}</span>
          </div>
        )}

        {/* Search and Favorite toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#EDE7F0]/40 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, videojuego, anime o rasgo..."
              className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs placeholder:text-[#EDE7F0]/30"
            />
          </div>
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`p-2 rounded-xl border transition-all ${
              onlyFavorites
                ? 'bg-[#6B3A4A]/40 border-[#E8825A] text-[#E8825A]'
                : 'border-[#2A2145] text-[#EDE7F0]/60 hover:text-[#EDE7F0] bg-[#1A1430]'
            }`}
            title="Solo favoritos"
          >
            <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-[#E8825A]' : ''}`} />
          </button>
        </div>
      </header>

      {/* Grid of Characters */}
      <main className="max-w-md mx-auto px-3.5 py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Sparkles className="w-12 h-12 text-[#EDE7F0]/30 mx-auto mb-3" />
            <h3 className="text-base font-serif-cinematic font-bold">Sin personajes en esta categoría</h3>
            <p className="text-xs text-[#EDE7F0]/50 mt-1 mb-4">
              {search ? 'No encontramos coincidencias para tu búsqueda.' : 'Invoca un personaje con IA para esta categoría.'}
            </p>
            <button
              onClick={() => handleSummonCharacter()}
              className="px-4 py-2 rounded-xl bg-[#E8825A] text-[#0D0A1A] text-xs font-bold flex items-center gap-2 mx-auto"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Invocar {selectedCategory !== 'todos' ? selectedCategory : 'Personaje'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((char) => (
              <div
                key={char.id}
                onClick={() => onOpenCharacterProfile(char.id)}
                className="group relative rounded-3xl bg-[#1A1430] border border-[#2A2145] overflow-hidden hover:border-[#E8825A]/50 transition-all cursor-pointer shadow-lg active:scale-[0.99]"
              >
                {/* Character Banner/Portrait */}
                <div className="relative h-48 w-full overflow-hidden bg-[#0D0A1A]">
                  <img
                    src={char.avatar}
                    alt={char.name}
                    loading="lazy"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1430] via-black/25 to-transparent" />

                  {/* Badges on Top */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-1.5 max-w-[80%]">
                      {char.originSource && (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#0D0A1A]/85 backdrop-blur-md text-[#E8825A] border border-[#E8825A]/40 truncate">
                          {char.originSource.slice(0, 32)}
                        </span>
                      )}
                      <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#0D0A1A]/80 backdrop-blur-md text-[#F5A87E] border border-[#3D2E4A]">
                        {char.occupation}
                      </span>
                      {char.isVillain && (
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-950/80 backdrop-blur-md text-rose-300 border border-rose-800 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          Villano
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleToggleFavorite(e, char.id)}
                      className={`p-2 rounded-full backdrop-blur-md transition shrink-0 ${
                        char.isFavorite
                          ? 'bg-[#6B3A4A]/80 text-[#E8825A] border border-[#E8825A]/60'
                          : 'bg-[#0D0A1A]/60 text-[#EDE7F0]/70 hover:text-[#EDE7F0] border border-[#2A2145]'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${char.isFavorite ? 'fill-[#E8825A]' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-4 pt-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-bold font-serif-cinematic tracking-wide text-[#EDE7F0] group-hover:text-[#F5A87E] transition">
                      {char.name}
                    </h3>
                    <span className="text-xs text-[#EDE7F0]/50 font-sans">
                      {char.age}
                    </span>
                  </div>

                  {char.quote && (
                    <p className="text-xs font-serif-cinematic italic text-[#F5A87E]/80 line-clamp-1 mb-2">
                      "{char.quote}"
                    </p>
                  )}

                  {/* Personality tags */}
                  {char.personalityTags && char.personalityTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {char.personalityTags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[#2A2145]/60 text-[#EDE7F0]/80 border border-[#3D2E4A]/30"
                        >
                          {tag}
                        </span>
                      ))}
                      {char.personalityTags.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#2A2145]/40 text-[#EDE7F0]/40">
                          +{char.personalityTags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#2A2145]/60">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartChat(char);
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#E8825A] hover:bg-[#E8825A]/90 text-[#0D0A1A] font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 glow-coral"
                    >
                      <MessageSquare className="w-3.5 h-3.5 fill-[#0D0A1A]" />
                      <span>Iniciar Conversación</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCharacterProfile(char.id);
                      }}
                      className="py-2.5 px-3 rounded-xl border border-[#3D2E4A] hover:bg-[#2A2145] text-xs font-medium text-[#EDE7F0] transition"
                    >
                      Perfil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <CharacterEditorModal
          initialCharacter={null}
          onSave={handleSaveNewCharacter}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

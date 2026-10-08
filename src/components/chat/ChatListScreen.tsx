import React, { useState } from 'react';
import { ChatSession, Character } from '../../types';
import { Storage } from '../../lib/storage';
import { Search, Plus, Heart, Trash2, Sparkles, MessageSquareDashed } from 'lucide-react';

interface ChatListScreenProps {
  onOpenChat: (chatId: string) => void;
  onOpenCharacterProfile: (charId: string) => void;
  onStartNewChatWith: (char: Character) => void;
}

export const ChatListScreen: React.FC<ChatListScreenProps> = ({
  onOpenChat,
  onOpenCharacterProfile,
  onStartNewChatWith,
}) => {
  const [search, setSearch] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const chats = Storage.getChats();
  const characters = Storage.getCharacters();

  // Map chats with character metadata
  const characterMap = new Map<string, Character>(characters.map(c => [c.id, c]));

  const enrichedChats = chats.map(chat => {
    const char = characterMap.get(chat.characterId);
    return {
      ...chat,
      character: char,
    };
  });

  const filteredChats = enrichedChats.filter(item => {
    const charName = item.character?.name || 'Desconocido';
    const matchesSearch =
      charName.toLowerCase().includes(search.toLowerCase()) ||
      (item.lastMessageSnippet && item.lastMessageSnippet.toLowerCase().includes(search.toLowerCase()));
    const matchesFav = onlyFavorites ? item.character?.isFavorite : true;
    return matchesSearch && matchesFav;
  });

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (window.confirm('¿Seguro que deseas eliminar esta conversación? Las memorias asociadas también se borrarán.')) {
      Storage.deleteChat(chatId);
      // Trigger re-render by local state refresh
      setSearch(s => s);
    }
  };

  const formatTimestamp = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      const now = new Date();
      const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
      if (diffHours < 24 && d.getDate() === now.getDate()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0A1A] pb-24 text-[#EDE7F0]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0D0A1A]/85 backdrop-blur-xl border-b border-[#2A2145]/70 pt-safe px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif-cinematic tracking-wide text-[#EDE7F0]">
              Conversaciones <span className="text-[#E8825A]">✦</span>
            </h1>
          </div>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8825A] hover:bg-[#E8825A]/90 text-[#0D0A1A] text-xs font-semibold shadow-md shadow-[#E8825A]/20 transition active:scale-95 glow-coral"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Chat</span>
          </button>
        </div>

        {/* Search bar and Favorites filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#EDE7F0]/40 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por personaje o mensaje..."
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
            title="Filtrar favoritos"
          >
            <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-[#E8825A]' : ''}`} />
          </button>
        </div>
      </header>

      {/* Chat List Content */}
      <main className="max-w-md mx-auto px-4 py-3">
        {filteredChats.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-3xl bg-[#1A1430] border border-[#2A2145] flex items-center justify-center text-[#EDE7F0]/40 mx-auto mb-4">
              <MessageSquareDashed className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-serif-cinematic font-semibold text-[#EDE7F0]">
              {search ? 'Sin coincidencias' : 'Aún no tienes conversaciones'}
            </h3>
            <p className="text-xs text-[#EDE7F0]/60 mt-1 mb-6 max-w-xs mx-auto">
              Elige uno de tus personajes o crea uno nuevo para sumergirte en una historia inolvidable.
            </p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8825A] text-[#0D0A1A] font-semibold text-xs shadow-md shadow-[#E8825A]/25 glow-coral hover:opacity-95"
            >
              <Sparkles className="w-4 h-4 fill-[#0D0A1A]" />
              <span>Elegir un personaje para conversar</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#2A2145]/40">
            {filteredChats.map((item) => {
              const char = item.character;
              return (
                <div
                  key={item.id}
                  onClick={() => onOpenChat(item.id)}
                  className="group flex items-center gap-3.5 py-3.5 px-2 rounded-2xl hover:bg-[#1A1430]/70 cursor-pointer transition-all active:bg-[#1A1430]"
                >
                  {/* Circular Avatar with Online Indicator */}
                  <div
                    className="relative shrink-0"
                    onClick={(e) => {
                      if (char) {
                        e.stopPropagation();
                        onOpenCharacterProfile(char.id);
                      }
                    }}
                  >
                    <img
                      src={char?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                      alt={char?.name || 'Avatar'}
                      className="w-13 h-13 rounded-full object-cover border-2 border-[#2A2145] group-hover:border-[#E8825A]/50 transition shadow-sm"
                    />
                    {/* Online badge */}
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-[#0D0A1A] shadow-sm" />
                  </div>

                  {/* Message Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-sm text-[#EDE7F0] truncate font-serif-cinematic tracking-wide">
                          {char?.name || item.title || 'Personaje'}
                        </span>
                        {char?.isFavorite && (
                          <Heart className="w-3 h-3 fill-[#E8825A] text-[#E8825A] shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-[#EDE7F0]/40 shrink-0 ml-2">
                        {formatTimestamp(item.lastActivityAt)}
                      </span>
                    </div>

                    <p className="text-xs text-[#EDE7F0]/65 truncate pr-2 leading-relaxed">
                      {item.lastMessageSnippet || 'Iniciando conversación...'}
                    </p>

                    {/* Tags / Details */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-[#F5A87E]/80 bg-[#2A2145]/40 px-2 py-0.5 rounded-md border border-[#3D2E4A]/40 truncate">
                        {char?.occupation || 'Compañero'}
                      </span>
                      {item.explicitLevel && (
                        <span className="text-[9px] uppercase tracking-wider text-[#EDE7F0]/40 px-1.5 py-0.5 rounded bg-[#1A1430]">
                          {item.explicitLevel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions / Unread badge */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {item.unreadCount > 0 ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#E8825A] text-[#0D0A1A] text-[10px] font-bold">
                        {item.unreadCount}
                      </span>
                    ) : null}
                    <button
                      onClick={(e) => handleDeleteChat(e, item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#EDE7F0]/40 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Eliminar conversación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal: Iniciar nuevo chat eligiendo personaje */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0A1A]/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#1A1430] border border-[#2A2145] p-5 shadow-2xl relative text-[#EDE7F0] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2145] mb-3">
              <h3 className="font-serif-cinematic text-lg font-bold">
                Elegir personaje para conversar
              </h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-xs text-[#EDE7F0]/60 hover:text-[#EDE7F0] p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {characters.map(char => (
                <div
                  key={char.id}
                  onClick={() => {
                    setShowNewChatModal(false);
                    onStartNewChatWith(char);
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#2A2145]/40 hover:bg-[#2A2145]/80 border border-[#3D2E4A]/40 cursor-pointer transition"
                >
                  <img
                    src={char.avatar}
                    alt={char.name}
                    className="w-12 h-12 rounded-full object-cover border border-[#3D2E4A]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm font-serif-cinematic truncate">
                        {char.name}
                      </span>
                      {char.isFavorite && (
                        <Heart className="w-3 h-3 fill-[#E8825A] text-[#E8825A]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#EDE7F0]/60 truncate">
                      {char.occupation} • {char.age}
                    </p>
                  </div>
                  <span className="text-[#E8825A] text-xs font-bold px-2 py-1 bg-[#E8825A]/10 rounded-lg">
                    Chatear →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

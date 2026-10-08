import React, { useState } from 'react';
import { Character } from '../../types';
import { Storage } from '../../lib/storage';
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Share2,
  Edit,
  ShieldAlert,
  Sparkles,
  Users,
  Compass,
  Check,
} from 'lucide-react';
import { CharacterEditorModal } from './CharacterEditorModal';

interface CharacterProfileScreenProps {
  characterId: string;
  onBack: () => void;
  onStartChat: (character: Character) => void;
}

export const CharacterProfileScreen: React.FC<CharacterProfileScreenProps> = ({
  characterId,
  onBack,
  onStartChat,
}) => {
  const [character, setCharacter] = useState<Character | null>(() => {
    return Storage.getCharacters().find(c => c.id === characterId) || null;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!character) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex flex-col items-center justify-center p-4 text-[#EDE7F0]">
        <p className="text-sm">Personaje no encontrado.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 rounded-xl bg-[#2A2145] text-xs">
          Regresar
        </button>
      </div>
    );
  }

  const toggleFavorite = () => {
    const updated = { ...character, isFavorite: !character.isFavorite };
    setCharacter(updated);
    Storage.saveCharacter(updated);
  };

  const handleShare = () => {
    // Generate shareable payload in URL hash
    try {
      const shareData = encodeURIComponent(JSON.stringify(character));
      const shareUrl = `${window.location.origin}${window.location.pathname}?import_char=${shareData}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback simple link
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSaveEdited = (updatedChar: Character) => {
    setCharacter(updatedChar);
    Storage.saveCharacter(updatedChar);
  };

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-[#EDE7F0] pb-24">
      {/* Hero Header with Cinematic Portrait */}
      <div className="relative h-96 w-full overflow-hidden bg-[#1A1430]">
        <img
          src={character.avatar}
          alt={character.name}
          className="w-full h-full object-cover object-top scale-105"
        />
        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0A1A] via-[#0D0A1A]/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0A1A]/70 via-transparent to-[#0D0A1A]/70" />

        {/* Top Floating Nav */}
        <div className="absolute top-0 inset-x-0 pt-safe px-4 py-3 flex items-center justify-between z-10">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-[#0D0A1A]/60 backdrop-blur-md text-[#EDE7F0] hover:bg-[#0D0A1A] transition border border-[#2A2145]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-[#0D0A1A]/60 backdrop-blur-md text-[#EDE7F0] hover:text-[#E8825A] hover:bg-[#0D0A1A] transition border border-[#2A2145]"
              title="Compartir enlace de personaje"
            >
              {copiedLink ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-full bg-[#0D0A1A]/60 backdrop-blur-md text-[#EDE7F0] hover:text-[#E8825A] hover:bg-[#0D0A1A] transition border border-[#2A2145]"
              title="Editar personaje"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-full backdrop-blur-md transition border ${
                character.isFavorite
                  ? 'bg-[#6B3A4A]/70 border-[#E8825A] text-[#E8825A]'
                  : 'bg-[#0D0A1A]/60 border-[#2A2145] text-[#EDE7F0]'
              }`}
            >
              <Heart className={`w-5 h-5 ${character.isFavorite ? 'fill-[#E8825A]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Floating Title on bottom of Hero */}
        <div className="absolute bottom-4 inset-x-0 px-6 z-10">
          {copiedLink && (
            <div className="mb-2 py-1 px-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center inline-block">
              ¡Enlace copiado al portapapeles!
            </div>
          )}

          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider text-[#F5A87E] font-medium bg-[#1A1430]/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-[#3D2E4A]">
              {character.occupation}
            </span>
            <span className="text-xs text-[#EDE7F0]/60">
              • {character.age}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold font-serif-cinematic tracking-wide text-[#EDE7F0] drop-shadow-lg">
            {character.name}
          </h1>

          <div className="flex items-center gap-3 text-xs text-[#EDE7F0]/70 mt-1">
            <span>{character.gender}</span>
            <span>•</span>
            <span>{character.pronouns}</span>
            <span>•</span>
            <span>{character.sexuality}</span>
          </div>
        </div>
      </div>

      {/* Main Profile Body */}
      <main className="max-w-md mx-auto px-5 py-5 space-y-6">
        {/* Antagonist Warning Banner if isVillain */}
        {character.isVillain && (
          <div className="p-3.5 rounded-2xl bg-[#6B3A4A]/30 border border-rose-500/50 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                Amenaza Antagonista Activa
              </h4>
              <p className="text-xs text-[#EDE7F0]/85 mt-0.5 leading-relaxed">
                {character.villainDetails || 'Este personaje actúa con intereses oscuros y es una amenaza letal dentro del mundo.'}
              </p>
            </div>
          </div>
        )}

        {/* Quote */}
        {character.quote && (
          <div className="p-4 rounded-2xl bg-[#1A1430]/70 border border-[#2A2145] text-center italic font-serif-cinematic text-[#F5A87E] text-sm md:text-base leading-relaxed glow-subtle">
            "{character.quote}"
          </div>
        )}

        {/* Personality Tags */}
        {character.personalityTags && character.personalityTags.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-[#F5A87E] tracking-wider uppercase mb-2">
              Rasgos de Personalidad
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {character.personalityTags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-xl bg-[#2A2145]/70 border border-[#3D2E4A]/60 text-xs text-[#EDE7F0] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section: Acerca de / Trasfondo */}
        <div className="p-4 rounded-2xl bg-[#1A1430]/70 border border-[#2A2145] space-y-3">
          <h3 className="text-xs font-bold text-[#F5A87E] tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Acerca de {character.name}
          </h3>
          <p className="text-xs md:text-sm text-[#EDE7F0]/85 leading-relaxed whitespace-pre-line">
            {character.backstory}
          </p>

          {character.personality && (
            <div className="pt-2 border-t border-[#2A2145]/50">
              <span className="text-[11px] font-semibold text-[#EDE7F0]/60 block mb-1">
                Conducta y Temperamento:
              </span>
              <p className="text-xs text-[#EDE7F0]/80 leading-relaxed">
                {character.personality}
              </p>
            </div>
          )}

          {character.appearance && (
            <div className="pt-2 border-t border-[#2A2145]/50">
              <span className="text-[11px] font-semibold text-[#EDE7F0]/60 block mb-1">
                Apariencia Física:
              </span>
              <p className="text-xs text-[#EDE7F0]/80 leading-relaxed">
                {character.appearance}
              </p>
            </div>
          )}
        </div>

        {/* Preferences Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {character.likes && (
            <div className="p-3 rounded-xl bg-[#2A2145]/40 border border-[#3D2E4A]/40">
              <span className="text-[10px] text-[#F5A87E] font-bold block mb-0.5">GUSTOS</span>
              <span className="text-[#EDE7F0]/80">{character.likes}</span>
            </div>
          )}
          {character.dislikes && (
            <div className="p-3 rounded-xl bg-[#2A2145]/40 border border-[#3D2E4A]/40">
              <span className="text-[10px] text-[#F5A87E] font-bold block mb-0.5">DISGUSTOS</span>
              <span className="text-[#EDE7F0]/80">{character.dislikes}</span>
            </div>
          )}
          {character.fears && (
            <div className="p-3 rounded-xl bg-[#2A2145]/40 border border-[#3D2E4A]/40">
              <span className="text-[10px] text-[#F5A87E] font-bold block mb-0.5">MIEDOS</span>
              <span className="text-[#EDE7F0]/80">{character.fears}</span>
            </div>
          )}
          {character.desires && (
            <div className="p-3 rounded-xl bg-[#2A2145]/40 border border-[#3D2E4A]/40">
              <span className="text-[10px] text-[#F5A87E] font-bold block mb-0.5">DESEOS</span>
              <span className="text-[#EDE7F0]/80">{character.desires}</span>
            </div>
          )}
        </div>

        {/* World Rules */}
        {character.worldRules && (
          <div className="p-4 rounded-2xl bg-[#1A1430]/70 border border-[#2A2145] space-y-1.5">
            <h3 className="text-xs font-bold text-[#F5A87E] tracking-wider uppercase flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Leyes del Mundo
            </h3>
            <p className="text-xs text-[#EDE7F0]/80 leading-relaxed">
              {character.worldRules}
            </p>
          </div>
        )}

        {/* Relational Graph / Entities */}
        {character.relations && character.relations.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#1A1430]/70 border border-[#2A2145] space-y-3">
            <h3 className="text-xs font-bold text-[#F5A87E] tracking-wider uppercase flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Vínculos y Relaciones Vinculadas
            </h3>
            <div className="space-y-2">
              {character.relations.map((rel, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#2A2145]/40 border border-[#3D2E4A]/30 text-xs"
                >
                  <div>
                    <span className="font-semibold text-[#EDE7F0]">{rel.name}</span>
                    {rel.notes && (
                      <p className="text-[10px] text-[#EDE7F0]/60 mt-0.5">{rel.notes}</p>
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#1A1430] text-[#F5A87E] border border-[#3D2E4A]/50">
                    {rel.relation}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Action Button: Coral "Iniciar conversación" */}
        <div className="sticky bottom-4 z-20 pt-2">
          <button
            onClick={() => onStartChat(character)}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#E8825A] hover:bg-[#E8825A]/90 text-[#0D0A1A] font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-[#E8825A]/25 glow-coral transition active:scale-95"
          >
            <MessageSquare className="w-5 h-5 fill-[#0D0A1A]" />
            <span>Iniciar Conversación con {character.name}</span>
          </button>
        </div>
      </main>

      {/* Edit Modal */}
      {isEditing && (
        <CharacterEditorModal
          initialCharacter={character}
          onSave={handleSaveEdited}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Wand2, Loader2, X, Check, Gamepad2, Swords, BookOpen, Cpu } from 'lucide-react';

interface ImageGeneratorModalProps {
  characterName: string;
  characterAppearance?: string;
  contextSnippet?: string;
  onImageGenerated: (imageUrl: string, prompt: string) => void;
  onClose: () => void;
}

export const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = ({
  characterName,
  characterAppearance = '',
  contextSnippet = '',
  onImageGenerated,
  onClose,
}) => {
  // If contextSnippet is provided, clean markdown asterisks for visual prompt
  const initialPrompt = contextSnippet
    ? contextSnippet.replace(/\*/g, '').replace(/["']/g, '').trim().slice(0, 200)
    : '';

  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedStyle, setSelectedStyle] = useState<string>('anime_cinematic');
  const [aspectRatio, setAspectRatio] = useState<'portrait' | 'landscape'>('portrait');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const styleOptions = [
    { id: 'anime_cinematic', label: 'Anime Cinematográfico', icon: <Swords className="w-3.5 h-3.5" /> },
    { id: 'videogame_concept', label: 'Concept Art Videojuego', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
    { id: 'dark_fantasy_book', label: 'Portada de Novela', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'cyberpunk_anime', label: 'Cyberpunk Anime', icon: <Cpu className="w-3.5 h-3.5" /> },
  ];

  // Suggested prompt ideas based on fantasy & animation roleplay
  const suggestions = [
    `${characterName} en la penumbra de un balcón arcano bajo una luna púrpura mirándome fijamente`,
    `Momento íntimo: ${characterName} acorta la distancia entre ambos con una mirada intensa y desarmante`,
    `Escena de combate: ${characterName} desenvaina su arma con runas resplandecientes en las ruinas`,
    `${characterName} sonriendo enigmáticamente mientras extiende una mano envuelta en sombras mágicas`,
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/image/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName,
          characterAppearance,
          sceneContext: prompt.trim(),
          artStyle: selectedStyle,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'No se pudo generar la imagen de la escena');
      }

      setPreviewUrl(data.url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al conectar con el servicio de imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleAttach = () => {
    if (previewUrl) {
      onImageGenerated(previewUrl, prompt);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0A1A]/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#1A1430] border border-[#2A2145] p-5 shadow-2xl relative text-[#EDE7F0] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2145]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#2A2145] text-[#E8825A]">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-cinematic text-lg font-bold">Ilustrar Escena de Conversación</h3>
              <p className="text-[10px] text-[#EDE7F0]/60">Pollinations AI (Gratuito, sin censura ni API key)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#EDE7F0]/60 hover:text-[#EDE7F0]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3.5">
          {/* Style Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#EDE7F0]/80 mb-1.5">
              Estilo artístico de la escena:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {styleOptions.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStyle(st.id)}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-[11px] font-medium border transition ${
                    selectedStyle === st.id
                      ? 'bg-[#E8825A] text-[#0D0A1A] font-bold border-[#E8825A]'
                      : 'bg-[#2A2145]/40 hover:bg-[#2A2145] text-[#EDE7F0]/80 border-[#3D2E4A]/40'
                  }`}
                >
                  {st.icon}
                  <span className="truncate">{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-[#EDE7F0]/80">
                Momento / diálogo a ilustrar:
              </label>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setAspectRatio('portrait')}
                  className={`px-1.5 py-0.5 rounded ${aspectRatio === 'portrait' ? 'bg-[#E8825A] text-[#0D0A1A] font-bold' : 'text-[#EDE7F0]/60'}`}
                >
                  Vertical
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('landscape')}
                  className={`px-1.5 py-0.5 rounded ${aspectRatio === 'landscape' ? 'bg-[#E8825A] text-[#0D0A1A] font-bold' : 'text-[#EDE7F0]/60'}`}
                >
                  Panorámica
                </button>
              </div>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Describe qué está pasando en la escena o pega un diálogo de ${characterName}...`}
              rows={3}
              className="w-full p-3 rounded-xl glass-input text-xs resize-none"
            />
          </div>

          {/* Quick Suggestions if no prompt yet */}
          <div>
            <span className="text-[10px] text-[#F5A87E] font-medium flex items-center gap-1 mb-1.5">
              <Sparkles className="w-3 h-3" />
              Momentos sugeridos para {characterName}:
            </span>
            <div className="space-y-1">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(s)}
                  className="w-full text-left p-1.5 rounded-lg bg-[#2A2145]/30 hover:bg-[#2A2145]/70 text-[10px] text-[#EDE7F0]/80 border border-[#3D2E4A]/30 transition truncate block"
                >
                  "{s}"
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-[#6B3A4A]/40 border border-[#E8825A]/40 text-xs text-[#F5A87E]">
              {error}
            </div>
          )}

          {/* Preview Image */}
          {previewUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-[#3D2E4A] bg-[#0D0A1A]">
              <img
                src={previewUrl}
                alt="Escena generada"
                className={`w-full ${aspectRatio === 'landscape' ? 'h-48' : 'h-64'} object-cover`}
              />
              <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-[#0D0A1A] via-[#0D0A1A]/80 to-transparent text-[10px] text-[#EDE7F0]/90 italic line-clamp-2">
                {prompt}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#2A2145] flex items-center gap-2">
          {!previewUrl ? (
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full py-2.5 rounded-xl bg-[#E8825A] hover:bg-[#E8825A]/90 text-[#0D0A1A] font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition shadow-md shadow-[#E8825A]/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Pintando escena con IA...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generar Imagen de la Escena</span>
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-[#3D2E4A] hover:bg-[#2A2145] text-xs font-medium text-[#EDE7F0] transition"
              >
                Regenerar
              </button>
              <button
                onClick={handleAttach}
                className="flex-1 py-2.5 rounded-xl bg-[#E8825A] hover:bg-[#E8825A]/90 text-[#0D0A1A] font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-[#E8825A]/20"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Adjuntar a la Historia</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

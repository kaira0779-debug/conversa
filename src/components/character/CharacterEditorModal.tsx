import React, { useState } from 'react';
import { Character, CharacterRelation, ExplicitLevel } from '../../types';
import { generateFantasyCharacter } from '../../lib/characterGenerator';
import {
  X,
  Sparkles,
  Wand2,
  Plus,
  Trash2,
  ShieldAlert,
  Save,
  Loader2,
  Palette,
  Check,
} from 'lucide-react';

interface CharacterEditorModalProps {
  initialCharacter?: Character | null;
  onSave: (character: Character) => void;
  onClose: () => void;
}

const WORLD_PRESETS = [
  { name: 'Fantasía Gótica Oscura', desc: 'Vampiros de alta alcurnia, castillos neblinosos, sociedades secretas e inquisidores.' },
  { name: 'Cyberpunk Distópico', desc: 'Megacorporaciones, lluvia ácida, implantes neuronales ilegales y hackers fugitivos.' },
  { name: 'Romance Noir Contemporáneo', desc: 'Detectives atormentados, whisky barato, bares de jazz a medianoche y crímenes pasionales.' },
  { name: 'Omegaverse Dinástico', desc: 'Jerarquías de castas (Alfa, Beta, Omega), marcas de unión biológica, aromas y alianzas dinásticas.' },
  { name: 'Ciencia Ficción Espacial', desc: 'Estaciones orbitales en los bordes de la galaxia, IA sentientes y corsarios del hiperespacio.' },
];

export const CharacterEditorModal: React.FC<CharacterEditorModalProps> = ({
  initialCharacter,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialCharacter?.name || '');
  const [avatar, setAvatar] = useState(
    initialCharacter?.avatar || 'https://image.pollinations.ai/prompt/handsome%20dark%20fantasy%20knight%20anime%20concept%20art%2C%20glowing%20amber%20eyes%2C%20messy%20hair%2C%20visual%20novel%20portrait%2C%20masterpiece%2C%20non-photorealistic?width=768&height=1024&model=flux&seed=182903&nologo=true'
  );
  const [gender, setGender] = useState<Character['gender']>(initialCharacter?.gender || 'masculino');
  const [pronouns, setPronouns] = useState(initialCharacter?.pronouns || 'Él / Compañero');
  const [sexuality, setSexuality] = useState(initialCharacter?.sexuality || 'Bisexual intenso y leal');
  const [age, setAge] = useState(initialCharacter?.age || '27 años');
  const [occupation, setOccupation] = useState(initialCharacter?.occupation || 'Paladín Renegado');
  const [quote, setQuote] = useState(initialCharacter?.quote || 'El acero y la lealtad son lo único que no se quiebra en la oscuridad.');
  const [greeting, setGreeting] = useState(
    initialCharacter?.greeting || '*Te observo desde la penumbra con una mirada afilada y penetrante.*\n\n"¿Qué te trae a mis dominios? Habla con honestidad si valoras tu vida."'
  );
  const [backstory, setBackstory] = useState(initialCharacter?.backstory || '');
  const [worldRules, setWorldRules] = useState(
    initialCharacter?.worldRules || 'Fantasía Gótica Oscura'
  );
  const [personality, setPersonality] = useState(initialCharacter?.personality || '');
  const [tagsInput, setTagsInput] = useState(initialCharacter?.personalityTags?.join(', ') || 'Misterioso, Intenso');
  const [appearance, setAppearance] = useState(initialCharacter?.appearance || '');
  const [likes, setLikes] = useState(initialCharacter?.likes || '');
  const [dislikes, setDislikes] = useState(initialCharacter?.dislikes || '');
  const [fears, setFears] = useState(initialCharacter?.fears || '');
  const [desires, setDesires] = useState(initialCharacter?.desires || '');
  const [relations, setRelations] = useState<CharacterRelation[]>(initialCharacter?.relations || []);
  const [category, setCategory] = useState<Character['category']>(initialCharacter?.category || 'fantasia');
  const [originSource, setOriginSource] = useState(initialCharacter?.originSource || '');
  const [isVillain, setIsVillain] = useState(initialCharacter?.isVillain || false);
  const [villainDetails, setVillainDetails] = useState(initialCharacter?.villainDetails || '');
  const [explicitLevel, setExplicitLevel] = useState<ExplicitLevel>(initialCharacter?.explicitLevel || 'sugerente');
  const [preferredModel, setPreferredModel] = useState(initialCharacter?.preferredModel || 'gemini-2.5-flash');
  const [systemPrompt, setSystemPrompt] = useState(initialCharacter?.systemPrompt || '');

  // AI Avatar Generator helper
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const handleAutoFillWithAI = async () => {
    setIsAutoFilling(true);
    try {
      const c = await generateFantasyCharacter({ archetype: occupation || '' });
      if (c) {
        setName(c.name);
        setAvatar(c.avatar);
        setGender(c.gender);
        setPronouns(c.pronouns);
        setSexuality(c.sexuality);
        setAge(c.age);
        setOccupation(c.occupation);
        setQuote(c.quote || '');
        setGreeting(c.greeting);
        setBackstory(c.backstory);
        setWorldRules(c.worldRules);
        setPersonality(c.personality);
        setTagsInput(c.personalityTags?.join(', ') || '');
        setAppearance(c.appearance);
        setLikes(c.likes);
        setDislikes(c.dislikes);
        setFears(c.fears);
        setDesires(c.desires);
        setRelations(c.relations || []);
        setIsVillain(c.isVillain);
        setVillainDetails(c.villainDetails || '');
        setCategory(c.category || 'fantasia');
        setOriginSource(c.originSource || '');
        setExplicitLevel(c.explicitLevel || 'sugerente');
        setSystemPrompt(c.systemPrompt || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!avatarPrompt.trim()) return;
    setGeneratingAvatar(true);
    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${avatarPrompt}, anime character illustration, fantasy visual novel art, book cover concept art, non-photorealistic, highly detailed`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        setAvatar(data.url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAvatar(false);
    }
  };

  // Dedicated generator: Artistic portrait synthesized directly from backstory & personality (Unfiltered & Non-realistic)
  const [generatingFromLore, setGeneratingFromLore] = useState(false);
  const [loreArtSuccess, setLoreArtSuccess] = useState<string | null>(null);

  const handleGeneratePortraitFromLore = async () => {
    setGeneratingFromLore(true);
    setLoreArtSuccess(null);

    try {
      // Synthesize rich lore and psychological cues into an evocative artistic prompt
      const elements: string[] = [];

      if (name) elements.push(`Character: ${name}`);
      if (gender) elements.push(`gender: ${gender}`);
      if (occupation) elements.push(`role: ${occupation}`);
      if (appearance) elements.push(`appearance: ${appearance}`);
      if (tagsInput) elements.push(`archetype traits: ${tagsInput}`);
      if (personality) elements.push(`temperament & expression: ${personality}`);
      if (backstory) elements.push(`origin backstory: ${backstory.slice(0, 220)}`);
      if (worldRules) elements.push(`universe: ${worldRules.slice(0, 90)}`);

      const characterContext = elements.length > 0 ? elements.join(', ') : 'mystical dark fantasy character';

      // Uncensored, non-photorealistic digital illustration keywords
      const uncensoredArtPrompt = `${characterContext}, masterpiece dark fantasy anime concept art, visual novel character portrait, illustrated book cover digital painting, expressive stylized features, ethereal moody atmospheric lighting, vibrant rich colors, non-photorealistic, no real human photography, uncensored artistic expression`;

      const seed = Math.floor(Math.random() * 999999);
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: uncensoredArtPrompt,
          style: 'dark fantasy visual novel art, anime illustration, stylized book cover digital painting, non-photorealistic',
          seed,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'No se pudo generar la imagen');
      }

      setAvatar(data.url);
      setLoreArtSuccess('¡Retrato ilustrado generado con éxito desde el trasfondo y la personalidad!');
      setTimeout(() => setLoreArtSuccess(null), 4500);
    } catch (err: any) {
      console.error('Error generating portrait from lore:', err);
      // Fallback direct Pollinations URL (100% uncensored, zero-barrier)
      const directSeed = Math.floor(Math.random() * 999999);
      const promptEncoded = encodeURIComponent(
        `${name || 'fantasy character'}, ${occupation || 'mythical'}, ${appearance || personality || 'dark fantasy anime character'}, visual novel portrait illustration, anime concept art, book cover painting, non-photorealistic`
      );
      const directUrl = `https://image.pollinations.ai/prompt/${promptEncoded}?width=768&height=1024&model=flux&seed=${directSeed}&nologo=true`;
      setAvatar(directUrl);
      setLoreArtSuccess('¡Retrato artístico generado con éxito!');
      setTimeout(() => setLoreArtSuccess(null), 4500);
    } finally {
      setGeneratingFromLore(false);
    }
  };

  const handleAddRelation = () => {
    const newRel: CharacterRelation = {
      id: `rel-${Date.now()}`,
      name: '',
      relation: 'amigo',
      notes: '',
    };
    setRelations([...relations, newRel]);
  };

  const handleUpdateRelation = (index: number, updated: Partial<CharacterRelation>) => {
    const copy = [...relations];
    copy[index] = { ...copy[index], ...updated };
    setRelations(copy);
  };

  const handleDeleteRelation = (index: number) => {
    setRelations(relations.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const personalityTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const character: Character = {
      id: initialCharacter?.id || `char-${Date.now()}`,
      name: name.trim(),
      avatar: avatar.trim(),
      gender,
      pronouns: pronouns.trim(),
      sexuality: sexuality.trim(),
      age: age.trim(),
      occupation: occupation.trim(),
      quote: quote.trim(),
      greeting: greeting.trim(),
      backstory: backstory.trim(),
      worldRules: worldRules.trim(),
      personality: personality.trim(),
      personalityTags,
      appearance: appearance.trim(),
      likes: likes.trim(),
      dislikes: dislikes.trim(),
      fears: fears.trim(),
      desires: desires.trim(),
      relations,
      isVillain,
      villainDetails: isVillain ? villainDetails.trim() : '',
      category,
      originSource: originSource.trim(),
      explicitLevel,
      preferredModel,
      systemPrompt: systemPrompt.trim(),
      isFavorite: initialCharacter?.isFavorite || false,
      createdAt: initialCharacter?.createdAt || new Date().toISOString(),
    };

    onSave(character);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0A1A]/90 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-[#1A1430] border border-[#2A2145] p-5 shadow-2xl relative text-[#EDE7F0] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2145]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#2A2145] text-[#E8825A]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-cinematic text-xl font-bold">
                {initialCharacter ? 'Editar Personaje' : 'Crear Nuevo Personaje'}
              </h3>
              <p className="text-[10px] text-[#EDE7F0]/60">Fantasía, animación y libros con memoria persistente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoFillWithAI}
              disabled={isAutoFilling}
              className="px-2.5 py-1.5 rounded-xl bg-[#E8825A]/20 hover:bg-[#E8825A]/30 text-[#F5A87E] border border-[#E8825A]/40 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              title="Generar automáticamente un personaje completo de fantasía con IA"
            >
              {isAutoFilling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              <span>{isAutoFilling ? 'Generando...' : 'Autocompletar IA'}</span>
            </button>
            <button onClick={onClose} className="p-1 rounded-lg text-[#EDE7F0]/60 hover:text-[#EDE7F0]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* Identity & Avatar Section */}
          <div className="p-4 rounded-2xl bg-[#2A2145]/30 border border-[#3D2E4A]/40 space-y-4">
            <h4 className="text-xs font-bold text-[#F5A87E] tracking-wider uppercase">
              1. Identidad Principal y Avatar
            </h4>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#E8825A]/60 shrink-0 shadow-lg glow-coral">
                <img src={avatar} alt="Avatar preview" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 space-y-2 w-full">
                <div>
                  <label className="block text-xs text-[#EDE7F0]/70 mb-1">URL del Avatar</label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
                    required
                  />
                </div>

                {/* Instant AI Avatar Generator & Lore-Based Uncensored Portrait Generator */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleGeneratePortraitFromLore}
                    disabled={generatingFromLore}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#6B3A4A] via-[#3D2E4A] to-[#2A2145] hover:border-[#E8825A]/60 border border-[#3D2E4A] text-[#EDE7F0] text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98] disabled:opacity-50"
                    title="Crea un retrato artístico ilustrado (no realista) interpretando el trasfondo, personalidad y rasgos del personaje. Sin filtros de censura."
                  >
                    {generatingFromLore ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#E8825A]" />
                    ) : (
                      <Palette className="w-4 h-4 text-[#E8825A]" />
                    )}
                    <span>
                      {generatingFromLore
                        ? 'Pintando retrato artístico desde el trasfondo...'
                        : '🎨 Generar Retrato Artístico desde Trasfondo y Personalidad'}
                    </span>
                  </button>

                  <div className="flex items-center justify-between text-[10px] text-[#EDE7F0]/60 px-1">
                    <span>Estilo ilustración / anime / novela (no realista)</span>
                    <span className="text-[#F5A87E] font-medium">✦ Sin censura</span>
                  </div>

                  {loreArtSuccess && (
                    <div className="p-2 rounded-xl bg-[#6B3A4A]/40 border border-[#E8825A]/50 text-xs text-[#F5A87E] text-center flex items-center justify-center gap-1.5 animate-fade-in">
                      <Sparkles className="w-3.5 h-3.5 text-[#E8825A]" />
                      <span>{loreArtSuccess}</span>
                    </div>
                  )}

                  {/* Manual prompt fallback */}
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      value={avatarPrompt}
                      onChange={(e) => setAvatarPrompt(e.target.value)}
                      placeholder="O escribe un prompt manual para el avatar..."
                      className="flex-1 px-3 py-1.5 rounded-xl glass-input text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateAvatar}
                      disabled={generatingAvatar || !avatarPrompt.trim()}
                      className="px-3 py-1.5 rounded-xl bg-[#E8825A] hover:bg-[#E8825A]/90 disabled:opacity-50 text-[#0D0A1A] font-semibold text-xs flex items-center gap-1 shrink-0"
                    >
                      {generatingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                      <span>Generar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs text-[#EDE7F0]/70 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Valeria Thorne"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#EDE7F0]/70 mb-1">Ocupación / Rol *</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Ej: Mercenario cibernético, Condesa..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#EDE7F0]/70 mb-1">Edad</label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Ej: 28 años / 280 años aparenta 27"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-[#EDE7F0]/70 mb-1">Género</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Character['gender'])}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-[#1A1430] text-[#EDE7F0]"
                >
                  <option value="masculino">Masculino (Por defecto)</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#EDE7F0]/70 mb-1">Categoría / Universo</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Character['category'])}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-[#1A1430] text-[#EDE7F0]"
                >
                  <option value="videojuegos">🎮 Videojuegos</option>
                  <option value="anime">⚔️ Anime & Manga</option>
                  <option value="libros">📖 Libros & Novelas</option>
                  <option value="fantasia">🔮 Fantasía & Lore Original</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#EDE7F0]/70 mb-1">Obra u Origen Específico</label>
                <input
                  type="text"
                  value={originSource}
                  onChange={(e) => setOriginSource(e.target.value)}
                  placeholder="Ej: Elden Ring, Berserk, Jujutsu Kaisen, Duna..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-[#EDE7F0]/70 mb-1">Pronombres</label>
                <input
                  type="text"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  placeholder="Ej: Ella / La Condesa / Él"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-[#EDE7F0]/70 mb-1">Sexualidad / Orientación</label>
                <input
                  type="text"
                  value={sexuality}
                  onChange={(e) => setSexuality(e.target.value)}
                  placeholder="Ej: Bisexual, Pansexual, Heterosexual..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#EDE7F0]/70 mb-1">Cita Representativa</label>
              <input
                type="text"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Una frase poética o desafiante que define su filosofía..."
                className="w-full px-3 py-2 rounded-xl glass-input text-xs italic font-serif-cinematic"
              />
            </div>
          </div>

          {/* Saludo Inicial */}
          <div className="p-4 rounded-2xl bg-[#2A2145]/30 border border-[#3D2E4A]/40 space-y-2">
            <h4 className="text-xs font-bold text-[#F5A87E] tracking-wider uppercase">
              2. Introducción / Saludo Inicial
            </h4>
            <p className="text-[10px] text-[#EDE7F0]/60">
              Primer mensaje al abrir la conversación. Escribe acciones y ambientación en cursiva entre asteriscos (ej: *Mira hacia ti con una copa en la mano.*)
            </p>
            <textarea
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-xl glass-input text-xs font-sans leading-relaxed"
              required
            />
          </div>

          {/* Reglas del Mundo y Ambientación */}
          <div className="p-4 rounded-2xl bg-[#2A2145]/30 border border-[#3D2E4A]/40 space-y-3">
            <h4 className="text-xs font-bold text-[#F5A87E] tracking-wider uppercase">
              3. Reglas del Mundo y Ambientación
            </h4>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {WORLD_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setWorldRules(`${preset.name}: ${preset.desc}`)}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-[#1A1430] hover:bg-[#2A2145] text-[#EDE7F0]/80 border border-[#3D2E4A]/40 transition"
                >
                  {preset.name}
                </button>
              ))}
            </div>
            <textarea
              value={worldRules}
              onChange={(e) => setWorldRules(e.target.value)}
              rows={2}
              className="w-full p-3 rounded-xl glass-input text-xs"
              placeholder="Reglas del universo: magia, tecnología, sociedad, leyes de sangre..."
            />
          </div>

          {/* Psicología y Apariencia */}
          <div className="p-4 rounded-2xl bg-[#2A2145]/30 border border-[#3D2E4A]/40 space-y-3">
            <h4 className="text-xs font-bold text-[#F5A87E] tracking-wider uppercase">
              4. Psicología, Historia y Apariencia
            </h4>

            <div>
              <label className="block text-xs text-[#EDE7F0]/70 mb-1">Tags de Personalidad (separados por coma)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Ej: Aristócrata, Seductora, Melancólica, Lealtad Feroz"
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-[#EDE7F0]/70 mb-1">Descripción Libre de Personalidad</label>
              <textarea
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                rows={2}
                placeholder="Cómo piensa, reacciona, qué lo enoja, su sentido del humor..."
                className="w-full p-3 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-[#EDE7F0]/70 mb-1">Apariencia Física Detallada</label>
              <textarea
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                rows={2}
                placeholder="Ojos, cabello, cicatrices, vestimenta, olor, porte..."
                className="w-full p-3 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-[#EDE7F0]/70 mb-1">Historia y Trasfondo Profundo</label>
              <textarea
                value={backstory}
                onChange={(e) => setBackstory(e.target.value)}
                rows={3}
                placeholder="Su origen, pérdidas, triunfos y secretos del pasado..."
                className="w-full p-3 rounded-xl glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#EDE7F0]/70 mb-1">Gustos</label>
                <input
                  type="text"
                  value={likes}
                  onChange={(e) => setLikes(e.target.value)}
                  placeholder="Vino añejo, música clásica..."
                  className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-[#EDE7F0]/70 mb-1">Disgustos</label>
                <input
                  type="text"
                  value={dislikes}
                  onChange={(e) => setDislikes(e.target.value)}
                  placeholder="La mentira, la luz solar..."
                  className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-[#EDE7F0]/70 mb-1">Miedos</label>
                <input
                  type="text"
                  value={fears}
                  onChange={(e) => setFears(e.target.value)}
                  placeholder="Perder la cordura, la soledad..."
                  className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-[#EDE7F0]/70 mb-1">Deseos Ocultos</label>
                <input
                  type="text"
                  value={desires}
                  onChange={(e) => setDesires(e.target.value)}
                  placeholder="Encontrar un igual que no tema..."
                  className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            {/* Action to create artistic portrait from this section */}
            <div className="pt-2 border-t border-[#3D2E4A]/40 flex items-center justify-between">
              <span className="text-[11px] text-[#EDE7F0]/60 italic">
                ¿Has terminado de definir la historia y personalidad?
              </span>
              <button
                type="button"
                onClick={handleGeneratePortraitFromLore}
                disabled={generatingFromLore}
                className="py-1.5 px-3 rounded-xl bg-[#2A2145] hover:bg-[#3D2E4A] text-[#F5A87E] border border-[#3D2E4A] text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                {generatingFromLore ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E8825A]" /> : <Palette className="w-3.5 h-3.5 text-[#E8825A]" />}
                <span>Pintar Retrato con esta Historia</span>
              </button>
            </div>
          </div>

          {/* Relaciones con Otros Personajes */}
          <div className="p-4 rounded-2xl bg-[#2A2145]/30 border border-[#3D2E4A]/40 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#F5A87E] tracking-wider uppercase">
                5. Vínculos y Relaciones Vinculadas
              </h4>
              <button
                type="button"
                onClick={handleAddRelation}
                className="px-2.5 py-1 rounded-lg bg-[#2A2145] hover:bg-[#3D2E4A] text-xs font-medium text-[#EDE7F0] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Vínculo</span>
              </button>
            </div>

            {relations.length === 0 ? (
              <p className="text-xs text-[#EDE7F0]/50 italic">
                Sin relaciones agregadas. Añade amigos, enemigos, amantes o parientes para que la IA los recuerde con precisión.
              </p>
            ) : (
              <div className="space-y-2">
                {relations.map((rel, idx) => (
                  <div key={rel.id || idx} className="p-3 rounded-xl bg-[#1A1430] border border-[#2A2145] space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={rel.name}
                        onChange={(e) => handleUpdateRelation(idx, { name: e.target.value })}
                        placeholder="Nombre de la entidad"
                        className="flex-1 px-2.5 py-1.5 rounded-lg glass-input text-xs"
                      />
                      <select
                        value={rel.relation}
                        onChange={(e) => handleUpdateRelation(idx, { relation: e.target.value as CharacterRelation['relation'] })}
                        className="px-2 py-1.5 rounded-lg glass-input text-xs bg-[#1A1430]"
                      >
                        <option value="amigo">Amigo</option>
                        <option value="amante">Amante</option>
                        <option value="enemigo">Enemigo</option>
                        <option value="familia">Familia</option>
                        <option value="hijo">Hijo</option>
                        <option value="compañero">Compañero</option>
                        <option value="otro">Otro</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleDeleteRelation(idx)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={rel.notes || ''}
                      onChange={(e) => handleUpdateRelation(idx, { notes: e.target.value })}
                      placeholder="Detalle o historia compartida..."
                      className="w-full px-2.5 py-1.5 rounded-lg glass-input text-[11px]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Antagonista / Villano */}
          <div className="p-4 rounded-2xl bg-[#2A2145]/30 border border-[#3D2E4A]/40 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isVillain"
                checked={isVillain}
                onChange={(e) => setIsVillain(e.target.checked)}
                className="w-4 h-4 rounded accent-[#E8825A]"
              />
              <label htmlFor="isVillain" className="text-xs font-bold text-[#F5A87E] flex items-center gap-1.5 cursor-pointer">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Marcar como Villano / Antagonista (Amenaza Real)
              </label>
            </div>

            {isVillain && (
              <div>
                <label className="block text-xs text-[#EDE7F0]/70 mb-1">
                  Plan, Poder y Motivación Antagónica
                </label>
                <textarea
                  value={villainDetails}
                  onChange={(e) => setVillainDetails(e.target.value)}
                  rows={2}
                  placeholder="Describe qué lo hace peligroso, cuál es su objetivo y cómo ejerce su dominio o crueldad..."
                  className="w-full p-3 rounded-xl glass-input text-xs"
                />
              </div>
            )}
          </div>

          {/* Nivel de Explicitud y Prompt de Sistema */}
          <div className="p-4 rounded-2xl bg-[#2A2145]/30 border border-[#3D2E4A]/40 space-y-3">
            <h4 className="text-xs font-bold text-[#F5A87E] tracking-wider uppercase">
              6. Configuración de IA y Explicitud
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#EDE7F0]/70 mb-1">Nivel de Explicitud Predeterminado</label>
                <select
                  value={explicitLevel}
                  onChange={(e) => setExplicitLevel(e.target.value as ExplicitLevel)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-[#1A1430]"
                >
                  <option value="normal">Normal (Narrativa e intriga)</option>
                  <option value="sugerente">Sugerente (Tensión romántica y pasión)</option>
                  <option value="explícito">Explícito (+18 Sin censura)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#EDE7F0]/70 mb-1">Modelo Preferido</label>
                <select
                  value={preferredModel}
                  onChange={(e) => setPreferredModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-[#1A1430]"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultrarrápido y Literario)</option>
                  <option value="mistral-nemo">Mistral Nemo (Vía OpenRouter)</option>
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Vía Groq / OpenRouter)</option>
                  <option value="euryale-70b">Euryale / Modelos Rol Sin Censura</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#EDE7F0]/70 mb-1">Prompt de Sistema Personalizado (Opcional)</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={2}
                placeholder="Instrucciones directas adicionales al motor de IA..."
                className="w-full p-3 rounded-xl glass-input text-xs font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#E8825A] hover:bg-[#E8825A]/90 text-[#0D0A1A] font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#E8825A]/25 glow-coral transition active:scale-95"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar Personaje</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

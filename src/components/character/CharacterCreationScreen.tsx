import React, { useState } from 'react';
import { Character, CharacterRelation, ExplicitLevel } from '../../types';
import { Storage } from '../../lib/storage';
import { ImageViewerModal } from '../common/ImageViewerModal';
import {
  ArrowLeft,
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Loader2,
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  User,
} from 'lucide-react';

interface CharacterCreationScreenProps {
  onBack: () => void;
  onCreated: (char: Character) => void;
}

const CATEGORIES = [
  { id: 'anime', label: 'Anime' },
  { id: 'videojuegos', label: 'Videojuegos' },
  { id: 'libros', label: 'Libros' },
  { id: 'fantasia', label: 'Fantasía' },
] as const;

const GENDERS = [
  { id: 'masculino', label: 'Masculino' },
  { id: 'femenino', label: 'Femenino' },
  { id: 'no binario', label: 'No binario' },
] as const;

const EXPLICIT_LEVELS: { id: ExplicitLevel; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'sugerente', label: 'Sugerente' },
  { id: 'explícito', label: 'Explícito +18' },
];

export const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({
  onBack,
  onCreated,
}) => {
  // 🔥 Estado del formulario
  const [name, setName] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]['id']>('anime');
  const [gender, setGender] = useState<typeof GENDERS[number]['id']>('masculino');
  const [pronouns, setPronouns] = useState('Él');
  const [sexuality, setSexuality] = useState('Bisexual');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [originSource, setOriginSource] = useState('');
  const [quote, setQuote] = useState('');
  const [greeting, setGreeting] = useState('');
  const [backstory, setBackstory] = useState('');
  const [worldRules, setWorldRules] = useState('');
  const [personality, setPersonality] = useState('');
  const [personalityTags, setPersonalityTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [appearance, setAppearance] = useState('');
  const [likes, setLikes] = useState('');
  const [dislikes, setDislikes] = useState('');
  const [fears, setFears] = useState('');
  const [desires, setDesires] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [voiceStyle, setVoiceStyle] = useState('');
  const [isVillain, setIsVillain] = useState(false);
  const [villainDetails, setVillainDetails] = useState('');
  const [explicitLevel, setExplicitLevel] = useState<ExplicitLevel>('sugerente');
  const [relations, setRelations] = useState<CharacterRelation[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const [autoPrompt, setAutoPrompt] = useState('');
  const [showViewer, setShowViewer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Genera el avatar con IA
  const handleGenerateAvatar = async () => {
    setIsGeneratingImage(true);
    setError(null);
    try {
      const res = await fetch('/api/image/generate-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: name || 'Character',
          appearance: appearance || imagePrompt,
          personality,
          gender,
        }),
      });
      const data = await res.json();
      if (data.url) {
        setAvatarUrl(data.url);
      } else {
        setError('No se pudo generar el avatar');
      }
    } catch {
      setError('Error al conectar con el generador');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Autocompleta el personaje con IA
  const handleAutocomplete = async () => {
    if (!autoPrompt.trim()) return;
    setIsAutocompleting(true);
    setError(null);
    try {
      const res = await fetch('/api/character/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortPrompt: autoPrompt, explicitLevel }),
      });
      const json = await res.json();
      if (json.data) {
        const d = json.data;
        if (d.name) setName(d.name);
        if (d.category) setCategory(d.category);
        if (d.gender) setGender(d.gender);
        if (d.pronouns) setPronouns(d.pronouns);
        if (d.sexuality) setSexuality(d.sexuality);
        if (d.age) setAge(d.age);
        if (d.occupation) setOccupation(d.occupation);
        if (d.quote) setQuote(d.quote);
        if (d.greeting) setGreeting(d.greeting);
        if (d.backstory) setBackstory(d.backstory);
        if (d.worldRules) setWorldRules(d.worldRules);
        if (d.personality) setPersonality(d.personality);
        if (Array.isArray(d.personalityTags)) setPersonalityTags(d.personalityTags);
        if (d.appearance) setAppearance(d.appearance);
        if (d.likes) setLikes(d.likes);
        if (d.dislikes) setDislikes(d.dislikes);
        if (d.fears) setFears(d.fears);
        if (d.desires) setDesires(d.desires);
        if (d.systemPrompt) setSystemPrompt(d.systemPrompt);
        if (d.voiceStyle) setVoiceStyle(d.voiceStyle);
        if (d.isVillain !== undefined) setIsVillain(!!d.isVillain);
        if (d.villainDetails) setVillainDetails(d.villainDetails);
      }
    } catch {
      setError('No se pudo autocompletar');
    } finally {
      setIsAutocompleting(false);
    }
  };

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !personalityTags.includes(t)) {
      setPersonalityTags([...personalityTags, t]);
      setTagInput('');
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    setError(null);

    // Fallback avatar si no hay imagen
    const finalAvatar = avatarUrl ||
      `https://image.pollinations.ai/prompt/${encodeURIComponent(
        `${name}, ${appearance || 'character'}, cinematic portrait, high quality, attractive`
      )}?width=1024&height=1536&model=flux&seed=${Math.floor(Math.random() * 999999)}&nologo=true`;

    const newChar: Character = {
      id: `char-custom-${Date.now()}`,
      name: name.trim(),
      avatar: finalAvatar,
      category,
      originSource: originSource || 'Creación original',
      gender,
      pronouns,
      sexuality,
      age: age || 'Desconocida',
      occupation: occupation || 'Misterioso',
      quote,
      greeting: greeting || `*${name} te observa en silencio.*\n\n"Vaya... no esperaba verte por aquí."\n\n»Interesante.«`,
      backstory,
      worldRules: worldRules || 'Mundo sin reglas definidas',
      personality,
      personalityTags: personalityTags.length ? personalityTags : ['Misterioso'],
      appearance,
      likes,
      dislikes,
      fears,
      desires,
      relations,
      isVillain,
      villainDetails,
      explicitLevel,
      systemPrompt,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    Storage.saveCharacter(newChar);
    setSaving(false);
    onCreated(newChar);
  };

  return (
    <div className="relative min-h-screen bg-[#0D0A1A] text-[#EDE7F0] overflow-hidden">
      <div className="ambient-glow-top" />

      {/* Header */}
      <header className="sticky top-0 z-30 glass-panel border-b border-[#2A2145]/40">
        <div className="max-w-md mx-auto px-4 pt-safe pb-3 pt-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl text-[#EDE7F0]/70 hover:text-[#EDE7F0] hover:bg-[#2A2145]/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Crear personaje</h1>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-3 py-1.5 rounded-xl bg-[#E8825A] text-[#0D0A1A] font-bold text-xs disabled:opacity-40 flex items-center gap-1.5 glow-coral"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Guardar
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 pb-32 space-y-5 relative z-10">
        {/* AUTORRELLENO */}
        <section className="p-4 rounded-2xl glass-card">
          <label className="text-xs font-semibold text-[#F5A87E] flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Autocompletar con IA
          </label>
          <textarea
            value={autoPrompt}
            onChange={(e) => setAutoPrompt(e.target.value)}
            placeholder="Ej: Un príncipe demonio sensual de un reino ardiente, con pasado trágico..."
            rows={2}
            className="w-full p-3 rounded-xl glass-input text-xs resize-none mb-2"
          />
          <button
            onClick={handleAutocomplete}
            disabled={isAutocompleting || !autoPrompt.trim()}
            className="w-full py-2.5 rounded-xl bg-[#6B3A4A]/60 hover:bg-[#6B3A4A]/80 disabled:opacity-40 text-sm font-medium flex items-center justify-center gap-2"
          >
            {isAutocompleting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
            ) : (
              <><Wand2 className="w-4 h-4" /> Autocompletar personaje</>
            )}
          </button>
        </section>

        {/* IDENTIDAD Y AVATAR */}
        <section className="p-4 rounded-2xl glass-card space-y-3">
          <h2 className="text-sm font-bold text-[#F5A87E]">1. Identidad y Avatar</h2>

          {/* Avatar preview */}
          <div className="flex justify-center">
            <div className="relative w-40 h-56 rounded-2xl overflow-hidden bg-[#1A1430] border border-[#2A2145]">
              {avatarUrl ? (
                <>
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setShowViewer(true)}
                    className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[#0D0A1A]/80 backdrop-blur-sm"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#F5A87E]" />
                  </button>
                  <button
                    onClick={() => setAvatarUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-[#0D0A1A]/80 backdrop-blur-sm"
                  >
                    <X className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#EDE7F0]/40 gap-2">
                  <User className="w-8 h-8" />
                  <span className="text-[11px]">Sin imagen</span>
                </div>
              )}
            </div>
          </div>

          {/* Botones de imagen */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleGenerateAvatar}
              disabled={isGeneratingImage}
              className="py-2.5 rounded-xl bg-[#E8825A]/15 border border-[#E8825A]/40 text-[#E8825A] text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              {isGeneratingImage ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> Generar IA</>
              )}
            </button>
            <label className="py-2.5 rounded-xl bg-[#2A2145]/60 border border-[#3D2E4A] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Subir imagen
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>

          {!avatarUrl && (
            <input
              type="text"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="O describe la apariencia para el avatar IA..."
              className="w-full p-3 rounded-xl glass-input text-xs"
            />
          )}
        </section>

        {/* BÁSICO */}
        <section className="p-4 rounded-2xl glass-card space-y-3">
          <h2 className="text-sm font-bold text-[#F5A87E]">2. Datos básicos</h2>

          <div>
            <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Nombre *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Kaelen el Sin Alma"
              className="w-full p-3 rounded-xl glass-input text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Categoría</label>
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`py-2 rounded-xl text-[11px] font-medium transition ${
                    category === c.id
                      ? 'bg-[#E8825A] text-[#0D0A1A] font-bold'
                      : 'bg-[#2A2145]/50 text-[#EDE7F0]/70 border border-[#3D2E4A]/50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Género</label>
            <div className="grid grid-cols-3 gap-1.5">
              {GENDERS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setGender(g.id);
                    setPronouns(g.id === 'femenino' ? 'Ella' : g.id === 'no binario' ? 'Elle' : 'Él');
                  }}
                  className={`py-2 rounded-xl text-[11px] font-medium transition ${
                    gender === g.id
                      ? 'bg-[#E8825A] text-[#0D0A1A] font-bold'
                      : 'bg-[#2A2145]/50 text-[#EDE7F0]/70 border border-[#3D2E4A]/50'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Pronombres</label>
              <input
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Sexualidad</label>
              <input
                value={sexuality}
                onChange={(e) => setSexuality(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Edad</label>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Ej: 28 años"
                className="w-full p-2.5 rounded-xl glass-input text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Ocupación</label>
              <input
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="Ej: Paladín"
                className="w-full p-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Origen / Serie</label>
            <input
              value={originSource}
              onChange={(e) => setOriginSource(e.target.value)}
              placeholder="Ej: Inspirado en Dark Souls"
              className="w-full p-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          <div>
            <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Nivel de contenido</label>
            <div className="grid grid-cols-3 gap-1.5">
              {EXPLICIT_LEVELS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setExplicitLevel(l.id)}
                  className={`py-2 rounded-xl text-[11px] font-medium transition ${
                    explicitLevel === l.id
                      ? 'bg-[#E8825A] text-[#0D0A1A] font-bold'
                      : 'bg-[#2A2145]/50 text-[#EDE7F0]/70 border border-[#3D2E4A]/50'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* PERSONALIDAD */}
        <section className="p-4 rounded-2xl glass-card space-y-3">
          <h2 className="text-sm font-bold text-[#F5A87E]">3. Personalidad</h2>

          <div>
            <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Descripción</label>
            <textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Cómo es, qué le mueve, contradicciones..."
              rows={3}
              className="w-full p-3 rounded-xl glass-input text-xs resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Añadir tag y Enter"
                className="flex-1 p-2.5 rounded-xl glass-input text-xs"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-2.5 rounded-xl bg-[#2A2145]/60 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {personalityTags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-lg bg-[#2A2145]/60 border border-[#3D2E4A]/50 text-[11px] flex items-center gap-1"
                >
                  {tag}
                  <button onClick={() => setPersonalityTags(personalityTags.filter((_, idx) => idx !== i))}>
                    <X className="w-3 h-3 text-rose-400" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Voz única (cómo habla)</label>
            <input
              value={voiceStyle}
              onChange={(e) => setVoiceStyle(e.target.value)}
              placeholder="Ej: Frases cortas, ironía seca..."
              className="w-full p-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          <div>
            <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Apariencia física</label>
            <textarea
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              placeholder="Complexión, cabello, ojos, ropa..."
              rows={2}
              className="w-full p-3 rounded-xl glass-input text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input value={likes} onChange={(e) => setLikes(e.target.value)} placeholder="Gustos" className="p-2.5 rounded-xl glass-input text-xs" />
            <input value={dislikes} onChange={(e) => setDislikes(e.target.value)} placeholder="Disgustos" className="p-2.5 rounded-xl glass-input text-xs" />
            <input value={fears} onChange={(e) => setFears(e.target.value)} placeholder="Miedos" className="p-2.5 rounded-xl glass-input text-xs" />
            <input value={desires} onChange={(e) => setDesires(e.target.value)} placeholder="Deseos" className="p-2.5 rounded-xl glass-input text-xs" />
          </div>
        </section>

        {/* HISTORIA Y MUNDO */}
        <section className="p-4 rounded-2xl glass-card space-y-3">
          <h2 className="text-sm font-bold text-[#F5A87E]">4. Historia y mundo</h2>

          <div>
            <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Cita memorable</label>
            <input
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Frase que lo define"
              className="w-full p-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          <div>
            <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Mensaje de bienvenida (primer mensaje al chatear)</label>
            <textarea
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="*acciones entre asteriscos* y 'diálogo entre comillas'"
              rows={4}
              className="w-full p-3 rounded-xl glass-input text-xs resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Trasfondo</label>
            <textarea
              value={backstory}
              onChange={(e) => setBackstory(e.target.value)}
              placeholder="Historia personal..."
              rows={3}
              className="w-full p-3 rounded-xl glass-input text-xs resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Reglas del mundo</label>
            <textarea
              value={worldRules}
              onChange={(e) => setWorldRules(e.target.value)}
              placeholder="Fantasía, sci-fi, histórico, etc."
              rows={2}
              className="w-full p-3 rounded-xl glass-input text-xs resize-none"
            />
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#2A2145]/40 border border-[#3D2E4A]/50">
            <input
              type="checkbox"
              checked={isVillain}
              onChange={(e) => setIsVillain(e.target.checked)}
              className="accent-[#E8825A]"
              id="villain-check"
            />
            <label htmlFor="villain-check" className="text-xs text-[#EDE7F0]/80 flex-1">
              Es villano / antagonista real
            </label>
          </div>

          {isVillain && (
            <textarea
              value={villainDetails}
              onChange={(e) => setVillainDetails(e.target.value)}
              placeholder="Poder, motivación, amenaza..."
              rows={2}
              className="w-full p-3 rounded-xl glass-input text-xs resize-none"
            />
          )}

          <div>
            <label className="text-xs text-[#EDE7F0]/70 mb-1 block">Instrucciones de interpretación (opcional)</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Directrices para que la IA interprete al personaje"
              rows={2}
              className="w-full p-3 rounded-xl glass-input text-xs resize-none"
            />
          </div>
        </section>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
            {error}
          </div>
        )}

        {/* CTA FINAL */}
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="w-full py-4 rounded-2xl bg-[#E8825A] text-[#0D0A1A] font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 glow-coral active:scale-[0.98] transition"
        >
          <Save className="w-5 h-5" />
          Guardar personaje
        </button>
      </main>

      {showViewer && avatarUrl && (
        <ImageViewerModal
          src={avatarUrl}
          alt={name || 'Avatar'}
          onClose={() => setShowViewer(false)}
        />
      )}
    </div>
  );
};
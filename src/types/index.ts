export type ExplicitLevel = 'normal' | 'sugerente' | 'explícito';

export interface CharacterRelation {
  id: string;
  name: string;
  relation: 'amigo' | 'familia' | 'hijo' | 'compañero' | 'enemigo' | 'amante' | 'otro';
  notes?: string;
}

export type CharacterCategory =
  | 'videojuegos'
  | 'anime'
  | 'libros'
  | 'fantasia'
  | 'todos';

// 🔥 NUEVO: Memory Card (inspirado en Hi Waifu)
export interface MemoryCard {
  id: string;
  content: string;        // Ej: "El usuario tiene un gato llamado Michi"
  priority: number;       // 1-5, mayor = más importante
  category: 'identidad' | 'relacion' | 'evento' | 'promesa' | 'secreto' | 'mundo';
  createdAt: string;
  isPinned?: boolean;     // Si está fijado, siempre se inyecta
}

// 🔥 NUEVO: Lorebook Entry (inspirado en Hi Waifu)
export interface LorebookEntry {
  id: string;
  title: string;          // Ej: "Ciudad de Neo-Veridia"
  content: string;        // Descripción completa
  keywords: string[];     // Palabras que activan esta entrada
  category: 'lugar' | 'faccion' | 'objeto' | 'evento' | 'magia' | 'personaje';
  isActive: boolean;
}

// 🔥 NUEVO: Relationship Level (inspirado en Replika)
export type BondLevel =
  | 'Desconocidos'
  | 'Conocidos'
  | 'Aliados'
  | 'Confidentes'
  | 'Vínculo Íntimo'
  | 'Almas Enlazadas';

export interface Character {
  id: string;
  name: string;
  avatar: string;
  banner?: string;
  category?: 'videojuegos' | 'anime' | 'libros' | 'fantasia';
  originSource?: string;
  gender: 'femenino' | 'masculino' | 'no binario' | 'personalizado';
  pronouns: string;
  sexuality: string;
  age: string;
  occupation: string;
  quote?: string;
  greeting: string;
  backstory: string;
  worldRules: string;
  personality: string;
  personalityTags: string[];
  appearance: string;
  likes: string;
  dislikes: string;
  fears: string;
  desires: string;
  relations: CharacterRelation[];
  isVillain: boolean;
  villainDetails?: string;
  explicitLevel: ExplicitLevel;
  preferredModel?: string;
  systemPrompt?: string;
  isFavorite?: boolean;
  createdAt: string;
  // 🔥 NUEVO
  lorebook?: LorebookEntry[];
  voiceStyle?: string;        // Descripción de cómo habla
  hiddenSecret?: string;      // Secreto que revela al alcanzar cierto vínculo
}

export interface UserRole {
  id: string;
  name: string;
  gender?: string;
  age?: string;
  appearance?: string;
  personality?: string;
  likes?: string;
  backstory?: string;
  avatar?: string;
  isActive: boolean;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'audio';
  url: string;
  prompt?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  isEdited?: boolean;
  attachments?: MessageAttachment[];
  // 🔥 NUEVO
  isSceneImage?: boolean;        // Si es una imagen de escena
  characterId?: string;          // Para chats grupales
  characterName?: string;        // Para chats grupales
  thoughts?: string;             // Pensamientos internos del personaje
  reaction?: string;             // Reacción rápida tipo "❤️" o "😏"
}

export interface ChatSession {
  id: string;
  characterId: string;
  userRoleId?: string;
  title: string;
  lastMessageSnippet: string;
  lastActivityAt: string;
  unreadCount: number;
  explicitLevel: ExplicitLevel;
  wallpaperTheme?: string;
  episodicSummary?: string;
  semanticMemories: string[];
  bondLevel?: string;
  emotionalState?: string;
  // 🔥 NUEVO
  memoryCards?: MemoryCard[];
  messagesSinceLastSummary?: number;
  bondScore?: number;             // 0-100, sube con cada interacción
  lastInteractionDate?: string;   // Para streaks
  streakDays?: number;            // Días consecutivos de interacción
  isGroupChat?: boolean;          // Si es chat grupal
  characterIds?: string[];        // Para chats grupales
  storyMode?: 'libre' | 'drama' | 'aventura' | 'romance';
}

export interface SoundscapeItem {
  id: string;
  title: string;
  category: string;
  durationSeconds: number;
  description: string;
  synthPreset: 'rain' | 'fire' | 'drone' | 'wind' | 'chimes';
  accentGradient: string;
  bgImage: string;
}

export interface AppSettings {
  pinEnabled: boolean;
  pinHash?: string;
  ageVerified: boolean;
  activeProvider: 'gemini' | 'openrouter' | 'groq';
  openRouterApiKey?: string;
  groqApiKey?: string;
  geminiApiKey?: string;
  imageProvider: 'pollinations' | 'huggingface' | 'custom';
  huggingFaceApiKey?: string;
  chatTheme: 'midnight' | 'twilight' | 'obsidian' | 'crimson';
  fontSize: 'normal' | 'large';
  hapticFeedback: boolean;
  // 🔥 NUEVO
  showThoughts?: boolean;         // Mostrar pensamientos automáticamente
  showSceneImages?: boolean;      // Auto-generar imágenes de escena
  dailyRewardsEnabled?: boolean;
}

// 🔥 NUEVO: Daily Reward
export interface DailyReward {
  day: number;          // 1-7
  reward: string;       // Descripción
  claimed: boolean;
  type: 'coins' | 'unlock' | 'memory_slot' | 'image_credit';
}

// 🔥 NUEVO: Scene Image Request
export interface SceneImageRequest {
  characterId: string;
  characterName: string;
  sceneDescription: string;
  mood: 'neutral' | 'feliz' | 'triste' | 'enojado' | 'sorprendido' | 'coqueto' | 'pensativo' | 'asustado';
  style: 'anime' | 'cinematic' | 'dark_fantasy' | 'cyberpunk' | 'photorealistic';
}
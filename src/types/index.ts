export type ExplicitLevel = 'normal' | 'sugerente' | 'explícito';

export interface CharacterRelation {
  id: string;
  name: string;
  relation: 'amigo' | 'familia' | 'hijo' | 'compañero' | 'enemigo' | 'amante' | 'otro';
  notes?: string;
}

export type CharacterCategory = 'videojuegos' | 'anime' | 'libros' | 'fantasia' | 'todos';

export interface Character {
  id: string;
  name: string;
  avatar: string;
  banner?: string;
  category?: 'videojuegos' | 'anime' | 'libros' | 'fantasia';
  originSource?: string; // Ej: "Inspirado en Dark Souls / Elden Ring", "Novela de Fantasía Oscura", "Anime Cyberpunk", etc.
  gender: 'femenino' | 'masculino' | 'no binario' | 'personalizado';
  pronouns: string;
  sexuality: string;
  age: string;
  occupation: string;
  quote?: string;
  greeting: string; // Saludo inicial
  backstory: string; // Trasfondo profundo
  worldRules: string; // Reglas del mundo
  personality: string; // Descripción libre
  personalityTags: string[]; // Tags
  appearance: string; // Apariencia física
  likes: string; // Gustos
  dislikes: string; // Disgustos
  fears: string; // Miedos
  desires: string; // Deseos
  relations: CharacterRelation[]; // Grafo de relaciones vinculadas
  isVillain: boolean; // Si es amenaza real
  villainDetails?: string; // Plan, poder, motivación
  explicitLevel: ExplicitLevel;
  preferredModel?: string;
  systemPrompt?: string;
  isFavorite?: boolean;
  createdAt: string;
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
  semanticMemories: string[]; // Hechos persistentes extraídos
  bondLevel?: string; // Vínculo emocional (ej: "Conocidos", "Aliados", "Confidentes", "Vínculo Íntimo", "Almas Enlazadas")
  emotionalState?: string; // Estado de ánimo actual del personaje
}

export interface SoundscapeItem {
  id: string;
  title: string;
  category: 'Fantasía Oscura' | 'Cyberpunk Noir' | 'Refugios & Lluvia' | 'Trance & Sueño' | 'Romance & Calma';
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
}

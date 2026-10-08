import { Character, ChatSession, ChatMessage, UserRole, AppSettings, SoundscapeItem } from '../types';
import { CATALOG_CHARACTERS } from '../data/charactersCatalog';

const STORAGE_KEYS = {
  CHARACTERS: 'conversa_characters_v6_catalog_220',
  CHATS: 'conversa_chats_v2',
  MESSAGES: 'conversa_messages_v2',
  USER_ROLES: 'conversa_user_roles_v2',
  SETTINGS: 'conversa_settings_v2',
  PIN_CODE: 'conversa_pin_code_v2',
  AUTH_USER: 'conversa_auth_user_v2',
};

// Full catalog of 220+ strictly masculine characters across Videojuegos, Anime, Libros y Fantasía
export const INITIAL_CHARACTERS: Character[] = CATALOG_CHARACTERS;

export const INITIAL_USER_ROLE: UserRole = {
  id: 'default-role',
  name: 'Ren',
  gender: 'No especificado / Flexible',
  age: '26',
  appearance: 'Ojos despiertos, cabello oscuro despeinado, ropa cómoda oscura con una capa de viaje.',
  personality: 'Curioso, perspicaz, con agudeza mental y capacidad para adaptarse a mundos hostiles.',
  likes: 'Secretos antiguos, fogatas en la noche, conversaciones sinceras sin máscaras.',
  backstory: 'Un viajero errante que ha cruzado fronteras y dimensiones buscando respuestas que ningún mapa contiene.',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
  isActive: true,
};

export const INITIAL_SOUNDSCAPES: SoundscapeItem[] = [
  {
    id: 'rain-shelter',
    title: 'Refugio en la Tormenta',
    category: 'Refugios & Lluvia',
    durationSeconds: 1200,
    description: 'Gotas densas de lluvia sobre tejados de zinc, truenos distantes y el calor reconfortante de un hogar seguro.',
    synthPreset: 'rain',
    accentGradient: 'from-[#1A1430] via-[#2A2145] to-[#E8825A]',
    bgImage: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'medieval-hearth',
    title: 'Fuego de Hogar en la Mansión',
    category: 'Fantasía Oscura',
    durationSeconds: 1500,
    description: 'Chispas de leña de cedro crepitando en una chimenea de piedra labrada mientras la noche arrecia afuera.',
    synthPreset: 'fire',
    accentGradient: 'from-[#3D2E4A] via-[#6B3A4A] to-[#E8825A]',
    bgImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cyber-drone',
    title: 'Pulso de Neo-Veridia',
    category: 'Cyberpunk Noir',
    durationSeconds: 1800,
    description: 'Zumbidos armónicos de baja frecuencia, resonancias analógicas y susurros de tráfico en la estratosfera.',
    synthPreset: 'drone',
    accentGradient: 'from-[#0D0A1A] via-[#1A1430] to-[#F5A87E]',
    bgImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'midnight-pines',
    title: 'Susurros del Bosque Crepuscular',
    category: 'Trance & Sueño',
    durationSeconds: 1200,
    description: 'Viento suave balanceando las copas de abetos milenarios bajo un manto de estrellas violetas.',
    synthPreset: 'wind',
    accentGradient: 'from-[#1A1430] via-[#3D2E4A] to-[#E8825A]',
    bgImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'astral-calm',
    title: 'Campanas del Santuario Lunar',
    category: 'Romance & Calma',
    durationSeconds: 900,
    description: 'Armónicos cristalinos suspendidos en el éter que inducen calma profunda, ensoñación y alivio de ansiedad.',
    synthPreset: 'chimes',
    accentGradient: 'from-[#2A2145] via-[#6B3A4A] to-[#F5A87E]',
    bgImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  pinEnabled: false,
  ageVerified: false,
  activeProvider: 'gemini',
  imageProvider: 'pollinations',
  chatTheme: 'midnight',
  fontSize: 'normal',
  hapticFeedback: true,
};

// Storage helper functions
export const Storage = {
  getCharacters(): Character[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(INITIAL_CHARACTERS));
        return INITIAL_CHARACTERS;
      }
      const parsed: Character[] = JSON.parse(data);
      // Migrate any legacy realistic human avatars to fantasy/animation art
      let modified = false;
      const updated = parsed.map(c => {
        if (c.avatar.includes('images.unsplash.com')) {
          modified = true;
          const match = INITIAL_CHARACTERS.find(ic => ic.name === c.name || ic.id === c.id);
          if (match) {
            return { ...c, avatar: match.avatar };
          }
          const prompt = encodeURIComponent(`${c.name}, ${c.appearance || 'fantasy character'}, dark fantasy anime concept art, visual novel illustration, masterpiece, non-photorealistic`);
          return {
            ...c,
            avatar: `https://image.pollinations.ai/prompt/${prompt}?width=768&height=1024&model=flux&nologo=true`
          };
        }
        return c;
      });
      if (modified) {
        localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(updated));
      }
      return updated;
    } catch {
      return INITIAL_CHARACTERS;
    }
  },

  saveCharacters(characters: Character[]): void {
    localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
  },

  saveCharacter(char: Character): void {
    const list = this.getCharacters();
    const idx = list.findIndex(c => c.id === char.id);
    if (idx >= 0) {
      list[idx] = char;
    } else {
      list.unshift(char);
    }
    this.saveCharacters(list);
  },

  deleteCharacter(id: string): void {
    const list = this.getCharacters().filter(c => c.id !== id);
    this.saveCharacters(list);
  },

  getChats(): ChatSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHATS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveChats(chats: ChatSession[]): void {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  },

  getChat(id: string): ChatSession | undefined {
    return this.getChats().find(c => c.id === id);
  },

  saveChat(chat: ChatSession): void {
    const chats = this.getChats();
    const idx = chats.findIndex(c => c.id === chat.id);
    if (idx >= 0) {
      chats[idx] = chat;
    } else {
      chats.unshift(chat);
    }
    this.saveChats(chats);
  },

  deleteChat(id: string): void {
    const chats = this.getChats().filter(c => c.id !== id);
    this.saveChats(chats);
    // Delete corresponding messages
    this.deleteMessagesByChat(id);
  },

  getMessages(chatId: string): ChatMessage[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.MESSAGES}_${chatId}`);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveMessages(chatId: string, messages: ChatMessage[]): void {
    localStorage.setItem(`${STORAGE_KEYS.MESSAGES}_${chatId}`, JSON.stringify(messages));
  },

  deleteMessagesByChat(chatId: string): void {
    localStorage.removeItem(`${STORAGE_KEYS.MESSAGES}_${chatId}`);
  },

  getUserRoles(): UserRole[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_ROLES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.USER_ROLES, JSON.stringify([INITIAL_USER_ROLE]));
        return [INITIAL_USER_ROLE];
      }
      return JSON.parse(data);
    } catch {
      return [INITIAL_USER_ROLE];
    }
  },

  saveUserRoles(roles: UserRole[]): void {
    localStorage.setItem(STORAGE_KEYS.USER_ROLES, JSON.stringify(roles));
  },

  getActiveUserRole(): UserRole {
    const roles = this.getUserRoles();
    return roles.find(r => r.isActive) || roles[0] || INITIAL_USER_ROLE;
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
        return INITIAL_SETTINGS;
      }
      return { ...INITIAL_SETTINGS, ...JSON.parse(data) };
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  },

  getPin(): string | null {
    return localStorage.getItem(STORAGE_KEYS.PIN_CODE);
  },

  savePin(pin: string | null): void {
    if (pin) {
      localStorage.setItem(STORAGE_KEYS.PIN_CODE, pin);
    } else {
      localStorage.removeItem(STORAGE_KEYS.PIN_CODE);
    }
  },

  getAuthUser(): { email: string; name: string } | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveAuthUser(user: { email: string; name: string } | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
  },

  exportAllData(): string {
    const data = {
      characters: this.getCharacters(),
      chats: this.getChats(),
      userRoles: this.getUserRoles(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
      version: '2.0',
    };
    return JSON.stringify(data, null, 2);
  },

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.characters)) this.saveCharacters(data.characters);
      if (Array.isArray(data.chats)) this.saveChats(data.chats);
      if (Array.isArray(data.userRoles)) this.saveUserRoles(data.userRoles);
      if (data.settings) this.saveSettings(data.settings);
      return true;
    } catch {
      return false;
    }
  }
};

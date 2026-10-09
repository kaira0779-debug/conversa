import { Character, ChatSession, ChatMessage, UserRole, AppSettings, SoundscapeItem, MemoryCard, LorebookEntry, DailyReward } from '../types';
import { CATALOG_CHARACTERS } from '../data/charactersCatalog';
import { FAMOUS_CHARACTERS } from '../data/famousCharacters';

const STORAGE_KEYS = {
  CHARACTERS: 'conversa_characters_v8_memory',
  CHATS: 'conversa_chats_v3',
  MESSAGES: 'conversa_messages_v3',
  USER_ROLES: 'conversa_user_roles_v3',
  SETTINGS: 'conversa_settings_v3',
  PIN_CODE: 'conversa_pin_code_v3',
  AUTH_USER: 'conversa_auth_user_v3',
  DAILY_REWARDS: 'conversa_daily_rewards_v1',
  LAST_LOGIN: 'conversa_last_login_v1',
  STREAK: 'conversa_streak_v1',
};

export const INITIAL_CHARACTERS: Character[] = [
  ...FAMOUS_CHARACTERS,
  ...CATALOG_CHARACTERS,
];

export const INITIAL_USER_ROLE: UserRole = {
  id: 'default-role',
  name: 'Ren',
  gender: 'No especificado',
  age: '26',
  appearance: 'Ojos despiertos, cabello oscuro despeinado, ropa cómoda oscura.',
  personality: 'Curioso, perspicaz, con agudeza mental.',
  likes: 'Secretos antiguos, fogatas, conversaciones sinceras.',
  backstory: 'Un viajero errante que ha cruzado dimensiones buscando respuestas.',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
  isActive: true,
};

export const INITIAL_SOUNDSCAPES: SoundscapeItem[] = [
  {
    id: 'rain-shelter',
    title: 'Refugio en la Tormenta',
    category: 'Refugios & Lluvia',
    durationSeconds: 1200,
    description: 'Gotas densas de lluvia sobre tejados de zinc.',
    synthPreset: 'rain',
    accentGradient: 'from-[#1A1430] via-[#2A2145] to-[#E8825A]',
    bgImage: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'medieval-hearth',
    title: 'Fuego de Hogar',
    category: 'Fantasía Oscura',
    durationSeconds: 1500,
    description: 'Chispas de leña crepitando en una chimenea.',
    synthPreset: 'fire',
    accentGradient: 'from-[#3D2E4A] via-[#6B3A4A] to-[#E8825A]',
    bgImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
  },
];

export const INITIAL_SETTINGS: AppSettings = {
  pinEnabled: false,
  ageVerified: false,
  activeProvider: 'openrouter',
  imageProvider: 'pollinations',
  chatTheme: 'midnight',
  fontSize: 'normal',
  hapticFeedback: true,
  showThoughts: true,
  showSceneImages: false,
  dailyRewardsEnabled: true,
};

export const Storage = {
  getCharacters(): Character[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(INITIAL_CHARACTERS));
        return INITIAL_CHARACTERS;
      }
      return JSON.parse(data);
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
    if (idx >= 0) list[idx] = char;
    else list.unshift(char);
    this.saveCharacters(list);
  },

  deleteCharacter(id: string): void {
    const list = this.getCharacters().filter(c => c.id !== id);
    this.saveCharacters(list);
  },

  // ═══ CHATS ═══
  getChats(): ChatSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHATS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
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
    if (idx >= 0) chats[idx] = chat;
    else chats.unshift(chat);
    this.saveChats(chats);
  },

  deleteChat(id: string): void {
    const chats = this.getChats().filter(c => c.id !== id);
    this.saveChats(chats);
    this.deleteMessagesByChat(id);
  },

  // ═══ MESSAGES ═══
  getMessages(chatId: string): ChatMessage[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.MESSAGES}_${chatId}`);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  saveMessages(chatId: string, messages: ChatMessage[]): void {
    localStorage.setItem(`${STORAGE_KEYS.MESSAGES}_${chatId}`, JSON.stringify(messages));
  },

  deleteMessagesByChat(chatId: string): void {
    localStorage.removeItem(`${STORAGE_KEYS.MESSAGES}_${chatId}`);
  },

  // ═══ USER ROLES ═══
  getUserRoles(): UserRole[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_ROLES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.USER_ROLES, JSON.stringify([INITIAL_USER_ROLE]));
        return [INITIAL_USER_ROLE];
      }
      return JSON.parse(data);
    } catch { return [INITIAL_USER_ROLE]; }
  },

  saveUserRoles(roles: UserRole[]): void {
    localStorage.setItem(STORAGE_KEYS.USER_ROLES, JSON.stringify(roles));
  },

  getActiveUserRole(): UserRole {
    const roles = this.getUserRoles();
    return roles.find(r => r.isActive) || roles[0] || INITIAL_USER_ROLE;
  },

  // ═══ SETTINGS ═══
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
        return INITIAL_SETTINGS;
      }
      return { ...INITIAL_SETTINGS, ...JSON.parse(data) };
    } catch { return INITIAL_SETTINGS; }
  },

  saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  },

  // ═══ PIN & AUTH ═══
  getPin(): string | null {
    return localStorage.getItem(STORAGE_KEYS.PIN_CODE);
  },

  savePin(pin: string | null): void {
    if (pin) localStorage.setItem(STORAGE_KEYS.PIN_CODE, pin);
    else localStorage.removeItem(STORAGE_KEYS.PIN_CODE);
  },

  getAuthUser(): { email: string; name: string } | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  saveAuthUser(user: { email: string; name: string } | null): void {
    if (user) localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  },

  // ═══ 🔥 MEMORY CARDS ═══
  getMemoryCards(chatId: string): MemoryCard[] {
    const chat = this.getChat(chatId);
    return chat?.memoryCards || [];
  },

  saveMemoryCards(chatId: string, cards: MemoryCard[]): void {
    const chat = this.getChat(chatId);
    if (chat) {
      chat.memoryCards = cards;
      this.saveChat(chat);
    }
  },

  addMemoryCard(chatId: string, card: Omit<MemoryCard, 'id' | 'createdAt'>): MemoryCard {
    const newCard: MemoryCard = {
      ...card,
      id: `mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    const cards = this.getMemoryCards(chatId);
    cards.push(newCard);
    this.saveMemoryCards(chatId, cards);
    return newCard;
  },

  deleteMemoryCard(chatId: string, cardId: string): void {
    const cards = this.getMemoryCards(chatId).filter(c => c.id !== cardId);
    this.saveMemoryCards(chatId, cards);
  },

  // ═══ 🔥 LOREBOOK ═══
  getLorebook(characterId: string): LorebookEntry[] {
    const char = this.getCharacters().find(c => c.id === characterId);
    return char?.lorebook || [];
  },

  saveLorebook(characterId: string, entries: LorebookEntry[]): void {
    const char = this.getCharacters().find(c => c.id === characterId);
    if (char) {
      char.lorebook = entries;
      this.saveCharacter(char);
    }
  },

  addLorebookEntry(characterId: string, entry: Omit<LorebookEntry, 'id'>): LorebookEntry {
    const newEntry: LorebookEntry = {
      ...entry,
      id: `lore-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    const entries = this.getLorebook(characterId);
    entries.push(newEntry);
    this.saveLorebook(characterId, entries);
    return newEntry;
  },

  // ═══ 🔥 DAILY REWARDS ═══
  getDailyRewards(): DailyReward[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_REWARDS);
      if (data) return JSON.parse(data);
    } catch {}
    // Default 7-day rewards
    return [
      { day: 1, reward: '+1 memoria', claimed: false, type: 'memory_slot' },
      { day: 2, reward: '+1 imagen IA', claimed: false, type: 'image_credit' },
      { day: 3, reward: '+2 memorias', claimed: false, type: 'memory_slot' },
      { day: 4, reward: '+1 imagen IA', claimed: false, type: 'image_credit' },
      { day: 5, reward: 'Desbloqueo: Peeking', claimed: false, type: 'unlock' },
      { day: 6, reward: '+3 memorias', claimed: false, type: 'memory_slot' },
      { day: 7, reward: 'Monedas legendarias', claimed: false, type: 'coins' },
    ];
  },

  saveDailyRewards(rewards: DailyReward[]): void {
    localStorage.setItem(STORAGE_KEYS.DAILY_REWARDS, JSON.stringify(rewards));
  },

  claimDailyReward(day: number): DailyReward[] {
    const rewards = this.getDailyRewards();
    const updated = rewards.map(r => r.day === day ? { ...r, claimed: true } : r);
    this.saveDailyRewards(updated);
    return updated;
  },

  // ═══ 🔥 STREAKS ═══
  getStreak(): number {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STREAK);
      return data ? parseInt(data, 10) : 0;
    } catch { return 0; }
  },

  updateStreak(): number {
    const lastLogin = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN);
    const today = new Date().toDateString();
    let streak = this.getStreak();

    if (lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastLogin === yesterday.toDateString()) {
        streak += 1;
      } else {
        streak = 1;
      }
      localStorage.setItem(STORAGE_KEYS.STREAK, String(streak));
      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN, today);
    }

    return streak;
  },

  // ═══ 🔥 EXPORT / IMPORT ═══
  exportAllData(): string {
    const data = {
      characters: this.getCharacters(),
      chats: this.getChats(),
      userRoles: this.getUserRoles(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
      version: '3.0',
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
    } catch { return false; }
  },

    // ═══ 🔥 SESIÓN PERSISTENTE ═══
  
  // Registra un nuevo usuario SOLO si no existe ya
  registerUser(email: string, name: string): { email: string; name: string; isNew: boolean } {
    const existing = this.getAuthUser();
    if (existing && existing.email === email) {
      // Ya existe, solo actualiza el nombre si cambió
      const updated = { email, name: existing.name || name };
      this.saveAuthUser(updated);
      return { ...updated, isNew: false };
    }
    // Si existe otro usuario con distinto email, se reemplaza (por ahora single-user)
    const user = { email, name };
    this.saveAuthUser(user);
    localStorage.setItem('conversa_registered_at', new Date().toISOString());
    return { ...user, isNew: true };
  },

  // Devuelve true si el usuario ya se había registrado antes
  isReturningUser(): boolean {
    const user = this.getAuthUser();
    const registeredAt = localStorage.getItem('conversa_registered_at');
    return !!user && !!registeredAt;
  },

  // Devuelve la fecha de registro
  getRegisteredAt(): string | null {
    return localStorage.getItem('conversa_registered_at');
  },

  // Devuelve la última sesión activa
  getLastSessionAt(): string | null {
    return localStorage.getItem('conversa_last_seen_at');
  },

  // Marca la sesión como activa (llamado al iniciar la app)
  markSessionActive(): void {
    localStorage.setItem('conversa_last_seen_at', new Date().toISOString());
  },
};
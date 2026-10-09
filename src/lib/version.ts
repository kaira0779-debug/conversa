// Sistema de versión y changelog de Conversa
// Actualiza APP_VERSION y añade una entrada al CHANGELOG cada vez que hagamos cambios importantes

export const APP_VERSION = '4.0.0';
export const APP_BUILD_DATE = '2026-10-08';

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
  emoji: string;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '4.0.0',
    date: '2026-10-08',
    title: 'Memoria persistente y personajes sensuales',
    emoji: '✨',
    changes: [
      '🧠 Memory Cards: los personajes ahora recuerdan eventos importantes (guerras, promesas, secretos)',
      '📖 Lorebook: contexto del mundo inyectado automáticamente al mencionar palabras clave',
      '💎 Sistema de vínculo: tu relación con cada personaje sube con cada interacción',
      '» Pensamientos internos «: los personajes revelan lo que piensan en cada respuesta',
      '🎁 Recompensas diarias + racha de días seguidos',
      '🔥 Personajes más sensuales con retratos detallados de cuerpo completo',
      '⛔ Anti-repetición: las respuestas ya no se repiten entre turnos',
      '💾 Sesión persistente: no tendrás que registrarte de nuevo cada vez',
      '📢 Este panel de novedades: verás qué cambia con cada actualización',
    ],
  },
  {
    version: '3.0.0',
    date: '2026-10-07',
    title: 'Overhaul visual + catálogo famoso',
    emoji: '🎨',
    changes: [
      '🖼️ Cuadrícula 3x3 de personajes con animaciones cinematográficas',
      '⭐ 15 personajes famosos (Bakugo, Levi, Gojo, Leon Kennedy, Xaden Riorson...)',
      '🎨 Design system completo: glassmorphism, glow coral, tipografía unificada',
      '📱 PWA instalable desde el navegador',
    ],
  },
  {
    version: '2.0.0',
    date: '2026-10-06',
    title: 'Motor sin censura',
    emoji: '🔓',
    changes: [
      '🔓 Motor OpenRouter sin censura por defecto',
      '📝 Respuestas largas (400-800 palabras)',
      '🎭 Voz única por personaje',
      '⚙️ Configuración de proveedor en Ajustes',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-10-05',
    title: 'Lanzamiento inicial',
    emoji: '🚀',
    changes: [
      '💬 Chat con personajes IA',
      '👤 Creación de roles de usuario',
      '🔐 Bloqueo por PIN',
      '🖼️ Generación de imágenes con IA',
    ],
  },
];

// Verifica si es la primera vez que el usuario ve esta versión
export function shouldShowChangelog(): boolean {
  try {
    const seenVersion = localStorage.getItem('conversa_seen_version');
    return seenVersion !== APP_VERSION;
  } catch {
    return true;
  }
}

// Marca la versión actual como vista
export function markChangelogAsSeen(): void {
  try {
    localStorage.setItem('conversa_seen_version', APP_VERSION);
    localStorage.setItem('conversa_last_seen_at', new Date().toISOString());
  } catch {}
}

// Devuelve la versión anterior vista
export function getLastSeenVersion(): string | null {
  try {
    return localStorage.getItem('conversa_seen_version');
  } catch {
    return null;
  }
}

// Devuelve el changelog desde la última versión vista
export function getChangesSinceLastSeen(): ChangelogEntry[] {
  const lastSeen = getLastSeenVersion();
  if (!lastSeen) return CHANGELOG;
  const idx = CHANGELOG.findIndex(e => e.version === lastSeen);
  if (idx === -1) return CHANGELOG;
  return CHANGELOG.slice(0, idx);
}
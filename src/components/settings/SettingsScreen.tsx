import React, { useState } from 'react';
import { Storage } from '../../lib/storage';
import { UserRole, AppSettings } from '../../types';
import {
  User,
  Key,
  Shield,
  Download,
  Upload,
  Palette,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Lock,
} from 'lucide-react';
import { PWAInstallButton } from '../layout/PWAInstallButton';

interface SettingsScreenProps {
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onLogout }) => {
  const [settings, setSettings] = useState<AppSettings>(() => Storage.getSettings());
  const [userRoles, setUserRoles] = useState<UserRole[]>(() => Storage.getUserRoles());
  const [activeRole, setActiveRole] = useState<UserRole>(() => Storage.getActiveUserRole());
  const [editingRole, setEditingRole] = useState<UserRole>({ ...activeRole });

  // PIN settings state
  const [pinInput, setPinInput] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinMessage, setPinMessage] = useState('');

  // API keys state
  const [openRouterKey, setOpenRouterKey] = useState(settings.openRouterApiKey || '');
  const [groqKey, setGroqKey] = useState(settings.groqApiKey || '');
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [savedKeysMsg, setSavedKeysMsg] = useState(false);

  // Backup state
  const [backupMsg, setBackupMsg] = useState('');

  const handleSaveActiveRole = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedRoles = userRoles.map(r => (r.id === editingRole.id ? editingRole : r));
    setUserRoles(updatedRoles);
    Storage.saveUserRoles(updatedRoles);
    setActiveRole(editingRole);
    alert('Perfil de usuario actualizado correctamente.');
  };

  const handleSelectRole = (role: UserRole) => {
    const updated = userRoles.map(r => ({ ...r, isActive: r.id === role.id }));
    setUserRoles(updated);
    Storage.saveUserRoles(updated);
    setActiveRole({ ...role, isActive: true });
    setEditingRole({ ...role, isActive: true });
  };

  const handleAddNewRole = () => {
    const newRole: UserRole = {
      id: `role-${Date.now()}`,
      name: 'Nuevo Rol',
      gender: 'No binario',
      age: '25',
      appearance: 'Atuendo oscuro y mirada reflexiva.',
      personality: 'Perspicaz y cauteloso.',
      likes: 'Noches despejadas.',
      backstory: 'Un nuevo viajero en este mundo.',
      isActive: false,
    };
    const updated = [...userRoles, newRole];
    setUserRoles(updated);
    Storage.saveUserRoles(updated);
    handleSelectRole(newRole);
  };

  const handleDeleteRole = (id: string) => {
    if (userRoles.length <= 1) {
      alert('Debes mantener al menos un rol de usuario activo.');
      return;
    }
    const filtered = userRoles.filter(r => r.id !== id);
    if (filtered.length > 0) {
      filtered[0].isActive = true;
    }
    setUserRoles(filtered);
    Storage.saveUserRoles(filtered);
    setActiveRole(filtered[0]);
    setEditingRole(filtered[0]);
  };

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = Storage.saveSettings({
      openRouterApiKey: openRouterKey.trim(),
      groqApiKey: groqKey.trim(),
      geminiApiKey: geminiKey.trim(),
    });
    setSettings(updated);
    setSavedKeysMsg(true);
    setTimeout(() => setSavedKeysMsg(false), 2500);
  };

  const handleSavePin = () => {
    if (pinInput.length < 4 || pinInput.length > 6) {
      setPinMessage('El PIN debe tener entre 4 y 6 dígitos numéricos.');
      return;
    }
    Storage.savePin(pinInput);
    const updated = Storage.saveSettings({ pinEnabled: true });
    setSettings(updated);
    setShowPinSetup(false);
    setPinInput('');
    setPinMessage('PIN de seguridad activado con éxito.');
    setTimeout(() => setPinMessage(''), 3000);
  };

  const handleDisablePin = () => {
    Storage.savePin(null);
    const updated = Storage.saveSettings({ pinEnabled: false });
    setSettings(updated);
    setPinMessage('PIN de seguridad desactivado.');
    setTimeout(() => setPinMessage(''), 3000);
  };

  const handleExportBackup = () => {
    const dataStr = Storage.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (Storage.importData(text)) {
        setBackupMsg('Copia de seguridad restaurada. Recargando...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setBackupMsg('Error: archivo JSON de copia inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#0D0A1A] pb-24 text-[#EDE7F0]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0D0A1A]/85 backdrop-blur-xl border-b border-[#2A2145]/70 pt-safe px-4 py-3">
        <h1 className="text-2xl font-bold font-serif-cinematic tracking-wide text-[#EDE7F0]">
          Ajustes & Mi Personaje <span className="text-[#E8825A]">✦</span>
        </h1>
        <p className="text-[11px] text-[#EDE7F0]/60">
          Personalización, rol del usuario, seguridad y claves de IA
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-4 space-y-6">
        {/* Section 1: User Persona ("Mi Personaje") */}
        <section className="p-4 rounded-3xl bg-[#1A1430] border border-[#2A2145] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#2A2145] text-[#E8825A]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-serif-cinematic tracking-wide">
                  Mi Personaje (Rol del Usuario)
                </h2>
                <p className="text-[10px] text-[#EDE7F0]/60">
                  La IA te tratará con este perfil en cada escena
                </p>
              </div>
            </div>
            <button
              onClick={handleAddNewRole}
              className="p-1.5 rounded-xl bg-[#2A2145] hover:bg-[#3D2E4A] text-[#EDE7F0] text-xs flex items-center gap-1"
              title="Añadir nuevo rol"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo</span>
            </button>
          </div>

          {/* Switchable user roles tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {userRoles.map(role => (
              <button
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition border flex items-center gap-1.5 ${
                  role.id === activeRole.id
                    ? 'bg-[#E8825A]/20 border-[#E8825A] text-[#F5A87E] font-semibold'
                    : 'bg-[#2A2145]/40 border-[#3D2E4A]/40 text-[#EDE7F0]/70'
                }`}
              >
                <span>{role.name}</span>
                {role.id === activeRole.id && <Check className="w-3 h-3 text-[#E8825A]" />}
              </button>
            ))}
          </div>

          {/* Editing form for active role */}
          <form onSubmit={handleSaveActiveRole} className="space-y-3 pt-2 border-t border-[#2A2145]">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-[#EDE7F0]/70 mb-1">Tu Nombre *</label>
                <input
                  type="text"
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#EDE7F0]/70 mb-1">Edad</label>
                <input
                  type="text"
                  value={editingRole.age || ''}
                  onChange={(e) => setEditingRole({ ...editingRole, age: e.target.value })}
                  placeholder="Ej: 26"
                  className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-[#EDE7F0]/70 mb-1">Género</label>
                <input
                  type="text"
                  value={editingRole.gender || ''}
                  onChange={(e) => setEditingRole({ ...editingRole, gender: e.target.value })}
                  placeholder="Masculino, Femenino..."
                  className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#EDE7F0]/70 mb-1">Gustos / Intereses</label>
                <input
                  type="text"
                  value={editingRole.likes || ''}
                  onChange={(e) => setEditingRole({ ...editingRole, likes: e.target.value })}
                  placeholder="Misterio, armas, libros..."
                  className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#EDE7F0]/70 mb-1">Apariencia Física</label>
              <textarea
                value={editingRole.appearance || ''}
                onChange={(e) => setEditingRole({ ...editingRole, appearance: e.target.value })}
                rows={2}
                placeholder="Ropa, altura, ojos, cabello, cicatrices..."
                className="w-full p-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#EDE7F0]/70 mb-1">Historia y Motivación</label>
              <textarea
                value={editingRole.backstory || ''}
                onChange={(e) => setEditingRole({ ...editingRole, backstory: e.target.value })}
                rows={2}
                placeholder="Quién eres, de dónde vienes y qué buscas en la trama..."
                className="w-full p-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {userRoles.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteRole(editingRole.id)}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 p-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar rol</span>
                </button>
              )}
              <button
                type="submit"
                className="ml-auto px-4 py-2 rounded-xl bg-[#E8825A] hover:bg-[#E8825A]/90 text-[#0D0A1A] font-bold text-xs flex items-center gap-1.5 glow-coral transition"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Guardar Mi Personaje</span>
              </button>
            </div>
          </form>
        </section>

        {/* Section 2: Security & PIN Code */}
        <section className="p-4 rounded-3xl bg-[#1A1430] border border-[#2A2145] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#2A2145] text-[#E8825A]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-serif-cinematic tracking-wide">
                  Seguridad y Privacidad
                </h2>
                <p className="text-[10px] text-[#EDE7F0]/60">
                  Bloqueo por PIN de 4-6 dígitos y verificación de edad (+18)
                </p>
              </div>
            </div>
            {settings.pinEnabled && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                PIN Activo
              </span>
            )}
          </div>

          {pinMessage && (
            <div className="p-2 rounded-xl bg-[#2A2145] text-xs text-[#F5A87E] text-center">
              {pinMessage}
            </div>
          )}

          {settings.pinEnabled ? (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-[#EDE7F0]/80">
                Tu aplicación está protegida por PIN local cifrado.
              </span>
              <button
                onClick={handleDisablePin}
                className="px-3 py-1.5 rounded-xl border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 text-xs font-medium"
              >
                Desactivar PIN
              </button>
            </div>
          ) : (
            <div className="pt-2">
              {showPinSetup ? (
                <div className="space-y-2">
                  <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ingresa 4-6 dígitos numéricos..."
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-center font-mono tracking-widest text-lg"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowPinSetup(false)}
                      className="px-3 py-1.5 rounded-xl bg-[#2A2145] text-xs text-[#EDE7F0]/70"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSavePin}
                      className="px-3 py-1.5 rounded-xl bg-[#E8825A] text-[#0D0A1A] font-bold text-xs"
                    >
                      Activar PIN
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowPinSetup(true)}
                  className="w-full py-2.5 rounded-xl border border-[#3D2E4A] hover:border-[#E8825A]/50 bg-[#2A2145]/30 text-xs font-semibold text-[#EDE7F0] flex items-center justify-center gap-2 transition"
                >
                  <Lock className="w-4 h-4 text-[#E8825A]" />
                  <span>Configurar PIN de Acceso</span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* Section 3: AI Engine & Provider Keys */}
        <section className="p-4 rounded-3xl bg-[#1A1430] border border-[#2A2145] space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#2A2145] text-[#E8825A]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-cinematic tracking-wide">
                Motor de IA y Proveedores
              </h2>
              <p className="text-[10px] text-[#EDE7F0]/60">
                Gemini (Preconfigurado y gratuito) o conecta tus claves privadas
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveKeys} className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] text-[#EDE7F0]/70 mb-1">Proveedor Principal</label>
              <select
                value={settings.activeProvider}
                onChange={(e) => {
                  const updated = Storage.saveSettings({ activeProvider: e.target.value as any });
                  setSettings(updated);
                }}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-[#1A1430]"
              >
                <option value="gemini">Google Gemini 2.5 Flash (Recomendado, incluido y rápido)</option>
                <option value="openrouter">OpenRouter (Modelos abiertos sin censura: Mistral, Euryale)</option>
                <option value="groq">Groq (Plan gratuito ultrarrápido Llama 3.3)</option>
              </select>
            </div>

            {settings.activeProvider === 'openrouter' && (
              <div>
                <label className="block text-[11px] text-[#EDE7F0]/70 mb-1">Clave de API OpenRouter</label>
                <input
                  type="password"
                  value={openRouterKey}
                  onChange={(e) => setOpenRouterKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>
            )}

            {settings.activeProvider === 'groq' && (
              <div>
                <label className="block text-[11px] text-[#EDE7F0]/70 mb-1">Clave de API Groq</label>
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>
            )}

            {settings.activeProvider === 'gemini' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] text-[#EDE7F0]/70">
                    Clave Gemini personalizada (Recomendado para IA en vivo)
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#F5A87E] hover:underline"
                  >
                    Obtener clave gratis ↗
                  </a>
                </div>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
                <p className="text-[10px] text-[#EDE7F0]/50">
                  Si la clave por defecto del servidor reporta límite o bloqueo, pega aquí tu propia clave gratuita de Google AI Studio para disfrutar de respuestas ilimitadas en tiempo real.
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-[#2A2145] hover:bg-[#3D2E4A] text-xs font-semibold text-[#EDE7F0] flex items-center justify-center gap-1.5 transition"
            >
              {savedKeysMsg ? <Check className="w-4 h-4 text-emerald-400" /> : <Key className="w-4 h-4" />}
              <span>{savedKeysMsg ? 'Claves actualizadas' : 'Guardar preferencias de IA'}</span>
            </button>
          </form>
        </section>

        {/* Section 4: Visual Themes & Customization */}
        <section className="p-4 rounded-3xl bg-[#1A1430] border border-[#2A2145] space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#2A2145] text-[#E8825A]">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-cinematic tracking-wide">
                Personalización Visual
              </h2>
              <p className="text-[10px] text-[#EDE7F0]/60">
                Paleta oficial dark-cinematic, tamaño de fuente y fondos
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <label className="block text-[11px] text-[#EDE7F0]/70 mb-1">Tema Atmosférico</label>
              <select
                value={settings.chatTheme}
                onChange={(e) => {
                  const updated = Storage.saveSettings({ chatTheme: e.target.value as any });
                  setSettings(updated);
                }}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-[#1A1430]"
              >
                <option value="midnight">Midnight Navy (#0D0A1A)</option>
                <option value="twilight">Twilight Lavender (#2A2145)</option>
                <option value="obsidian">Obsidian Deep</option>
                <option value="crimson">Crimson Burgundy (#6B3A4A)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-[#EDE7F0]/70 mb-1">Tamaño de Fuente</label>
              <select
                value={settings.fontSize}
                onChange={(e) => {
                  const updated = Storage.saveSettings({ fontSize: e.target.value as any });
                  setSettings(updated);
                }}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-[#1A1430]"
              >
                <option value="normal">Estándar (Cómodo)</option>
                <option value="large">Grande (Inmersivo)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 5: PWA Installation */}
        <section className="p-4 rounded-3xl bg-[#1A1430] border border-[#2A2145] space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#2A2145] text-[#E8825A]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-cinematic tracking-wide">
                Instalar Conversa (PWA)
              </h2>
              <p className="text-[10px] text-[#EDE7F0]/60">
                Experiencia a pantalla completa en móvil o escritorio
              </p>
            </div>
          </div>
          <PWAInstallButton />
        </section>

        {/* Section 6: Data Backup & Restore */}
        <section className="p-4 rounded-3xl bg-[#1A1430] border border-[#2A2145] space-y-3">
          <h2 className="text-sm font-bold font-serif-cinematic tracking-wide text-[#EDE7F0]">
            Copia de Seguridad y Exportación
          </h2>
          <p className="text-[11px] text-[#EDE7F0]/60">
            Exporta todos tus personajes, chats y memorias a un archivo JSON o restáuralos en otro dispositivo.
          </p>

          {backupMsg && (
            <div className="p-2 rounded-xl bg-[#2A2145] text-xs text-[#F5A87E] text-center">
              {backupMsg}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleExportBackup}
              className="flex-1 py-2 px-3 rounded-xl bg-[#2A2145] hover:bg-[#3D2E4A] text-xs font-semibold text-[#EDE7F0] flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Backup</span>
            </button>

            <label className="flex-1 py-2 px-3 rounded-xl border border-[#3D2E4A] hover:bg-[#2A2145] text-xs font-semibold text-[#EDE7F0] flex items-center justify-center gap-1.5 cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Importar Backup</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </section>

        {/* Logout */}
        <div className="pt-2 text-center">
          <button
            onClick={onLogout}
            className="text-xs text-rose-400 hover:text-rose-300 py-2 px-4 rounded-xl hover:bg-rose-500/10 transition"
          >
            Cerrar sesión actual
          </button>
        </div>
      </main>
    </div>
  );
};

import React, { useState } from 'react';
import { Storage } from '../../lib/storage';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, User, AlertTriangle } from 'lucide-react';
import { PWAInstallButton } from '../layout/PWAInstallButton';

interface WelcomeScreenProps {
  onAuthenticated: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onAuthenticated }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [pendingAuthAction, setPendingAuthAction] = useState<(() => void) | null>(null);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const settings = Storage.getSettings();
    if (!settings.ageVerified) {
      setPendingAuthAction(() => proceedAuth);
      setShowAgeModal(true);
      return;
    }
    proceedAuth();
  };

  const proceedAuth = () => {
    const user = {
      email: email.trim() || 'usuario@conversa.app',
      name: name.trim() || (email ? email.split('@')[0] : 'Viajero'),
    };
    Storage.saveAuthUser(user);

    // Update active user persona name if custom name entered
    if (name.trim()) {
      const roles = Storage.getUserRoles();
      if (roles.length > 0) {
        roles[0].name = name.trim();
        Storage.saveUserRoles(roles);
      }
    }

    onAuthenticated();
  };

  const handleGuestEntry = () => {
    const settings = Storage.getSettings();
    if (!settings.ageVerified) {
      setPendingAuthAction(() => proceedGuest);
      setShowAgeModal(true);
      return;
    }
    proceedGuest();
  };

  const proceedGuest = () => {
    Storage.saveAuthUser({
      email: 'invitado@conversa.app',
      name: 'Viajero Silencioso',
    });
    onAuthenticated();
  };

  const confirmAgeVerification = () => {
    Storage.saveSettings({ ageVerified: true });
    setShowAgeModal(false);
    if (pendingAuthAction) {
      pendingAuthAction();
      setPendingAuthAction(null);
    } else {
      proceedGuest();
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#0D0A1A]">
      {/* Twilight atmospheric landscape backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80')`,
          filter: 'brightness(0.35) saturate(1.2)',
        }}
      />
      {/* Deep cinematic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D0A1A]/85 via-[#1A1430]/75 to-[#0D0A1A] pointer-events-none" />

      {/* Top Bar / Brand */}
      <header className="relative z-10 pt-8 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#2A2145]/80 border border-[#3D2E4A] flex items-center justify-center text-[#E8825A] shadow-md shadow-[#0D0A1A]">
            <Sparkles className="w-4 h-4 fill-[#E8825A]" />
          </div>
          <span className="text-xl font-bold font-serif-cinematic tracking-wider text-[#EDE7F0]">
            Conversa <span className="text-[#E8825A]">✦</span>
          </span>
        </div>
        <div className="max-w-[170px]">
          <PWAInstallButton compact />
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 px-6 py-8 flex flex-col items-center text-center max-w-md mx-auto w-full my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2A2145]/60 border border-[#3D2E4A]/80 text-[#F5A87E] text-xs font-medium mb-4 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#E8825A] animate-pulse" />
          <span>Roleplay Literario con IA & Memoria</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold font-serif-cinematic tracking-tight text-[#EDE7F0] leading-tight">
          Conversa <span className="text-[#E8825A]">✦</span>
        </h1>
        <p className="text-sm md:text-base text-[#EDE7F0]/80 mt-2 font-serif-cinematic italic">
          "Historias que siempre están contigo."
        </p>

        {/* Authentication Card */}
        <div className="w-full mt-6 p-6 rounded-3xl bg-[#1A1430]/80 border border-[#2A2145] backdrop-blur-xl shadow-2xl text-left">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#2A2145]">
            <span className="text-sm font-semibold text-[#EDE7F0]">
              {isRegister ? 'Crear cuenta personal' : 'Iniciar sesión'}
            </span>
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-[#F5A87E] hover:underline"
            >
              {isRegister ? '¿Ya tienes cuenta?' : 'Registrarse'}
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-[#EDE7F0]/70 mb-1">Nombre o Apodo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#EDE7F0]/40 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre en la historia..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs placeholder:text-[#EDE7F0]/30"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#EDE7F0]/70 mb-1">Correo electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#EDE7F0]/40 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs placeholder:text-[#EDE7F0]/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#EDE7F0]/70 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#EDE7F0]/40 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs placeholder:text-[#EDE7F0]/30"
                />
              </div>
            </div>

            {/* Coral Primary Button: "Comenzar →" */}
            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#E8825A] hover:bg-[#E8825A]/90 text-[#0D0A1A] font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#E8825A]/25 transition-all active:scale-[0.98] glow-coral"
            >
              <span>{isRegister ? 'Registrarme y Comenzar' : 'Comenzar'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Guest Direct Entry */}
          <div className="mt-4 pt-3 border-t border-[#2A2145]/60 text-center">
            <button
              type="button"
              onClick={handleGuestEntry}
              className="text-xs text-[#EDE7F0]/70 hover:text-[#EDE7F0] transition flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg hover:bg-[#2A2145]/40"
            >
              <span>Explorar directamente como invitado</span>
              <span className="text-[#E8825A]">→</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-[#EDE7F0]/50 mt-4 max-w-xs">
          Ambiente privado, seguro y cifrado localmente en tu dispositivo. Compatible con PWA offline.
        </p>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-[#EDE7F0]/40 border-t border-[#2A2145]/40">
        <span>Conversa PWA ✦ Dark-Cinematic Roleplay Edition</span>
      </footer>

      {/* +18 Age Verification Modal */}
      {showAgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0A1A]/90 backdrop-blur-xl p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#1A1430] border border-[#6B3A4A] p-6 shadow-2xl relative text-[#EDE7F0] text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#6B3A4A]/40 border border-[#6B3A4A] flex items-center justify-center text-[#E8825A] mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold font-serif-cinematic text-[#EDE7F0]">
              Aviso de Contenido Adulto (+18)
            </h3>
            <p className="mt-2 text-xs text-[#EDE7F0]/80 leading-relaxed">
              Conversa está diseñada exclusivamente para personas mayores de 18 años. Puede contener narrativas de ficción maduras, romance pasional, lenguaje explícito, temas oscuros y elementos sin censura.
            </p>

            <div className="mt-6 space-y-2.5">
              <button
                onClick={confirmAgeVerification}
                className="w-full py-2.5 px-4 rounded-xl bg-[#E8825A] hover:bg-[#E8825A]/90 text-[#0D0A1A] font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#E8825A]/25 transition"
              >
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>Soy mayor de 18 años y deseo continuar</span>
              </button>
              <button
                onClick={() => setShowAgeModal(false)}
                className="w-full py-2 px-4 rounded-xl border border-[#3D2E4A] hover:bg-[#2A2145] text-xs text-[#EDE7F0]/60 transition"
              >
                Cancelar y salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

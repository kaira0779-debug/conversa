import React, { useState, useEffect } from 'react';
import { Storage } from './lib/storage';
import { Character, ChatSession } from './types';
import { shouldShowChangelog, markChangelogAsSeen, getChangesSinceLastSeen, APP_VERSION } from './lib/version';
import { WelcomeScreen } from './components/auth/WelcomeScreen';
import { PinLockModal } from './components/auth/PinLockModal';
import { ChangelogModal } from './components/layout/ChangelogModal';
import { WelcomeBackToast } from './components/layout/WelcomeBackToast';
import { Navbar, NavTab } from './components/layout/Navbar';
import { OfflineIndicator } from './components/layout/OfflineIndicator';
import { ChatListScreen } from './components/chat/ChatListScreen';
import { ConversationScreen } from './components/chat/ConversationScreen';
import { CharacterGridScreen } from './components/character/CharacterGridScreen';
import { CharacterProfileScreen } from './components/character/CharacterProfileScreen';
import { ExploreScreen } from './components/explore/ExploreScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';

export default function App() {
  // 🔥 Persistencia de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!Storage.getAuthUser();
  });

  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(() => {
    const settings = Storage.getSettings();
    return !settings.pinEnabled || !Storage.getPin();
  });

  const [activeTab, setActiveTab] = useState<NavTab>('characters');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeProfileCharId, setActiveProfileCharId] = useState<string | null>(null);

  // 🔥 Estados nuevos: changelog + welcome back
  const [showChangelog, setShowChangelog] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [changelogEntries, setChangelogEntries] = useState<ReturnType<typeof getChangesSinceLastSeen>>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [userName, setUserName] = useState('');

  // 🔥 Al montar: actualiza streak, decide si mostrar changelog o welcome back
  useEffect(() => {
    const authUser = Storage.getAuthUser();
    if (authUser?.name) setUserName(authUser.name);

    const newStreak = Storage.updateStreak();
    setStreakDays(newStreak);

    if (isAuthenticated && authUser) {
      if (shouldShowChangelog()) {
        setChangelogEntries(getChangesSinceLastSeen());
        setTimeout(() => setShowChangelog(true), 600);
      } else {
        // Solo mostrar welcome back si NO es la primera vez del día
        const lastLogin = localStorage.getItem('conversa_last_welcome_shown');
        const today = new Date().toDateString();
        if (lastLogin !== today) {
          localStorage.setItem('conversa_last_welcome_shown', today);
          setTimeout(() => setShowWelcomeBack(true), 400);
        }
      }
    }
  }, [isAuthenticated]);

  // Shareable character import
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const importParam = params.get('import_char');
      if (importParam) {
        const decoded = JSON.parse(decodeURIComponent(importParam));
        if (decoded && decoded.name) {
          const existing = Storage.getCharacters().find(c => c.name === decoded.name);
          if (existing) {
            setActiveProfileCharId(existing.id);
          } else {
            const importedChar: Character = {
              ...decoded,
              id: `imported-${Date.now()}`,
              createdAt: new Date().toISOString(),
            };
            Storage.saveCharacter(importedChar);
            setActiveProfileCharId(importedChar.id);
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch {}
  }, []);

  // 🔥 Navegación con botón atrás del móvil
  useEffect(() => {
    const handlePopState = () => {
      if (activeChatId) {
        setActiveChatId(null);
        window.history.pushState(null, '', window.location.pathname);
        return;
      }
      if (activeProfileCharId) {
        setActiveProfileCharId(null);
        window.history.pushState(null, '', window.location.pathname);
        return;
      }
      // En la pantalla principal, no hacemos nada (deja que el navegador maneje)
    };

    // Empujamos un estado inicial para tener algo que interceptar
    if (isAuthenticated && isPinUnlocked) {
      window.history.pushState(null, '', window.location.pathname);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeChatId, activeProfileCharId, isAuthenticated, isPinUnlocked]);

  const handleStartChatWithCharacter = (character: Character) => {
    const chats = Storage.getChats();
    let existingChat = chats.find(c => c.characterId === character.id);

    if (!existingChat) {
      const newChat: ChatSession = {
        id: `chat-${Date.now()}`,
        characterId: character.id,
        title: character.name,
        lastMessageSnippet: character.greeting.slice(0, 80),
        lastActivityAt: new Date().toISOString(),
        unreadCount: 0,
        explicitLevel: character.explicitLevel || 'sugerente',
        wallpaperTheme: 'midnight',
        semanticMemories: [],
        memoryCards: [],
        bondScore: 0,
        bondLevel: 'Desconocidos',
      };
      Storage.saveChat(newChat);
      existingChat = newChat;
    }

    setActiveProfileCharId(null);
    setActiveChatId(existingChat.id);
  };

  const handleLogout = () => {
    Storage.saveAuthUser(null);
    setIsAuthenticated(false);
    setIsPinUnlocked(true);
    setActiveChatId(null);
    setActiveProfileCharId(null);
  };

  const handleCloseChangelog = () => {
    markChangelogAsSeen();
    setShowChangelog(false);
  };

  if (!isAuthenticated) {
    return <WelcomeScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const storedPin = Storage.getPin();
  if (!isPinUnlocked && storedPin) {
    return (
      <>
        <PinLockModal storedPin={storedPin} onSuccess={() => setIsPinUnlocked(true)} />
      </>
    );
  }

  if (activeChatId) {
    return (
      <>
        <OfflineIndicator />
        <ConversationScreen
          chatId={activeChatId}
          onBack={() => setActiveChatId(null)}
          onOpenCharacterProfile={(charId) => {
            setActiveChatId(null);
            setActiveProfileCharId(charId);
          }}
        />
      </>
    );
  }

  if (activeProfileCharId) {
    return (
      <>
        <OfflineIndicator />
        <CharacterProfileScreen
          characterId={activeProfileCharId}
          onBack={() => setActiveProfileCharId(null)}
          onStartChat={handleStartChatWithCharacter}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-[#EDE7F0] flex flex-col justify-between selection:bg-[#E8825A]/30 selection:text-[#F5A87E]">
      <OfflineIndicator />

      {/* 🔥 Welcome back toast */}
      {showWelcomeBack && userName && (
        <WelcomeBackToast
          userName={userName}
          streak={streakDays}
          onDismiss={() => setShowWelcomeBack(false)}
        />
      )}

      <div className="flex-1">
        {activeTab === 'chats' && (
          <ChatListScreen
            onOpenChat={(chatId) => setActiveChatId(chatId)}
            onOpenCharacterProfile={(charId) => setActiveProfileCharId(charId)}
            onStartNewChatWith={handleStartChatWithCharacter}
          />
        )}

        {activeTab === 'characters' && (
          <CharacterGridScreen
            onOpenCharacterProfile={(charId) => setActiveProfileCharId(charId)}
            onStartChat={handleStartChatWithCharacter}
          />
        )}

        {activeTab === 'explore' && <ExploreScreen />}
        {activeTab === 'settings' && <SettingsScreen onLogout={handleLogout} />}
      </div>

      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        unreadCount={0}
        appVersion={APP_VERSION}
      />

      {/* 🔥 Changelog modal */}
      {showChangelog && changelogEntries.length > 0 && (
        <ChangelogModal
          entries={changelogEntries}
          onClose={handleCloseChangelog}
        />
      )}
    </div>
  );
}
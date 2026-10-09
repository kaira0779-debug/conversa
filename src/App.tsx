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
import { CharacterCreationScreen } from './components/character/CharacterCreationScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!Storage.getAuthUser());
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(() => {
    const settings = Storage.getSettings();
    return !settings.pinEnabled || !Storage.getPin();
  });

  const [activeTab, setActiveTab] = useState<NavTab>('characters');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeProfileCharId, setActiveProfileCharId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [showChangelog, setShowChangelog] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [changelogEntries, setChangelogEntries] = useState<any[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [userName, setUserName] = useState('');

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
        const lastLogin = localStorage.getItem('conversa_last_welcome_shown');
        const today = new Date().toDateString();
        if (lastLogin !== today) {
          localStorage.setItem('conversa_last_welcome_shown', today);
          setTimeout(() => setShowWelcomeBack(true), 400);
        }
      }
    }
  }, [isAuthenticated]);

  // Botón atrás del móvil respeta el flujo interno
  useEffect(() => {
    const handlePop = () => {
      if (showCreate) {
        setShowCreate(false);
        window.history.pushState(null, '', window.location.pathname);
        return;
      }
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
    };
    if (isAuthenticated && isPinUnlocked) {
      window.history.pushState(null, '', window.location.pathname);
    }
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [activeChatId, activeProfileCharId, showCreate, isAuthenticated, isPinUnlocked]);

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

  const handleCharacterCreated = (char: Character) => {
    setShowCreate(false);
    setTimeout(() => handleStartChatWithCharacter(char), 300);
  };

  const handleLogout = () => {
    Storage.saveAuthUser(null);
    setIsAuthenticated(false);
    setIsPinUnlocked(true);
    setActiveChatId(null);
    setActiveProfileCharId(null);
    setShowCreate(false);
  };

  if (!isAuthenticated) return <WelcomeScreen onAuthenticated={() => setIsAuthenticated(true)} />;

  const storedPin = Storage.getPin();
  if (!isPinUnlocked && storedPin) {
    return <PinLockModal storedPin={storedPin} onSuccess={() => setIsPinUnlocked(true)} />;
  }

  if (showCreate) {
    return (
      <>
        <OfflineIndicator />
        <CharacterCreationScreen
          onBack={() => setShowCreate(false)}
          onCreated={handleCharacterCreated}
        />
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
    <div className="min-h-screen bg-[#0D0A1A] text-[#EDE7F0] flex flex-col justify-between">
      <OfflineIndicator />

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
            onOpenCreateCharacter={() => setShowCreate(true)}
          />
        )}

        {activeTab === 'create' && (
          <CharacterCreationScreen
            onBack={() => setActiveTab('characters')}
            onCreated={handleCharacterCreated}
          />
        )}

        {activeTab === 'settings' && <SettingsScreen onLogout={handleLogout} />}
      </div>

      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        unreadCount={0}
        appVersion={APP_VERSION}
      />

      {showChangelog && changelogEntries.length > 0 && (
        <ChangelogModal
          entries={changelogEntries}
          onClose={() => {
            markChangelogAsSeen();
            setShowChangelog(false);
          }}
        />
      )}
    </div>
  );
}
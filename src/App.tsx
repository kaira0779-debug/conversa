import React, { useState, useEffect } from 'react';
import { Storage } from './lib/storage';
import { Character, ChatSession } from './types';
import { WelcomeScreen } from './components/auth/WelcomeScreen';
import { PinLockModal } from './components/auth/PinLockModal';
import { Navbar, NavTab } from './components/layout/Navbar';
import { OfflineIndicator } from './components/layout/OfflineIndicator';
import { ChatListScreen } from './components/chat/ChatListScreen';
import { ConversationScreen } from './components/chat/ConversationScreen';
import { CharacterListScreen } from './components/character/CharacterListScreen';
import { CharacterProfileScreen } from './components/character/CharacterProfileScreen';
import { ExploreScreen } from './components/explore/ExploreScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!Storage.getAuthUser();
  });
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(() => {
    const settings = Storage.getSettings();
    return !settings.pinEnabled || !Storage.getPin();
  });

  const [activeTab, setActiveTab] = useState<NavTab>('chats');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeProfileCharId, setActiveProfileCharId] = useState<string | null>(null);

  // Check URL query params for shareable character import (?import_char=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const importParam = params.get('import_char');
      if (importParam) {
        const decoded = JSON.parse(decodeURIComponent(importParam));
        if (decoded && decoded.name) {
          // If already exists, just open it, otherwise import
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
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (e) {
      console.warn('Could not parse shared character URL:', e);
    }
  }, []);

  // Handle starting a new conversation with a specific character
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

  // Screen 1: Welcome / Login
  if (!isAuthenticated) {
    return <WelcomeScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  // PIN lock layer if enabled and not unlocked this session
  const storedPin = Storage.getPin();
  if (!isPinUnlocked && storedPin) {
    return (
      <PinLockModal
        storedPin={storedPin}
        onSuccess={() => setIsPinUnlocked(true)}
      />
    );
  }

  // Active full-screen conversation view
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

  // Active character profile view
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

  // Main App with Bottom Navigation
  return (
    <div className="min-h-screen bg-[#0D0A1A] text-[#EDE7F0] flex flex-col justify-between selection:bg-[#E8825A]/30 selection:text-[#F5A87E]">
      <OfflineIndicator />

      {/* Tab Screen Content */}
      <div className="flex-1">
        {activeTab === 'chats' && (
          <ChatListScreen
            onOpenChat={(chatId) => setActiveChatId(chatId)}
            onOpenCharacterProfile={(charId) => setActiveProfileCharId(charId)}
            onStartNewChatWith={handleStartChatWithCharacter}
          />
        )}

        {activeTab === 'characters' && (
          <CharacterListScreen
            onOpenCharacterProfile={(charId) => setActiveProfileCharId(charId)}
            onStartChat={handleStartChatWithCharacter}
          />
        )}

        {activeTab === 'explore' && <ExploreScreen />}

        {activeTab === 'settings' && <SettingsScreen onLogout={handleLogout} />}
      </div>

      {/* Bottom Nav */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        unreadCount={0}
      />
    </div>
  );
}

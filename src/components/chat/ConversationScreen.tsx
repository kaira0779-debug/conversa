import React, { useState, useEffect, useRef } from 'react';
import { Character, ChatMessage, ChatSession, ExplicitLevel } from '../../types';
import { Storage } from '../../lib/storage';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Send,
  Image as ImageIcon,
  Brain,
  RefreshCw,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Download,
  Smile,
} from 'lucide-react';
import { ImageGeneratorModal } from './ImageGeneratorModal';
import { MemoryInspectorModal } from './MemoryInspectorModal';
import { CallSimulationModal } from './CallSimulationModal';

interface ConversationScreenProps {
  chatId: string;
  onBack: () => void;
  onOpenCharacterProfile: (charId: string) => void;
}

export const ConversationScreen: React.FC<ConversationScreenProps> = ({
  chatId,
  onBack,
  onOpenCharacterProfile,
}) => {
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Modals state
  const [showImageGen, setShowImageGen] = useState(false);
  const [sceneContextForGen, setSceneContextForGen] = useState<string>('');
  const [showMemory, setShowMemory] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [wallpaper, setWallpaper] = useState<string>('midnight');
  const [activeLightboxImage, setActiveLightboxImage] = useState<{ url: string; prompt?: string } | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat session & messages
  useEffect(() => {
    const currentChat = Storage.getChat(chatId);
    if (!currentChat) {
      onBack();
      return;
    }
    setChat(currentChat);
    setWallpaper(currentChat.wallpaperTheme || 'midnight');

    const char = Storage.getCharacters().find(c => c.id === currentChat.characterId);
    if (char) {
      setCharacter(char);
    }

    let msgs = Storage.getMessages(chatId);
    // If empty chat, initialize with character's greeting!
    if (msgs.length === 0 && char) {
      const initialGreeting: ChatMessage = {
        id: `msg-${Date.now()}`,
        chatId: chatId,
        role: 'assistant',
        content: char.greeting,
        createdAt: new Date().toISOString(),
      };
      msgs = [initialGreeting];
      Storage.saveMessages(chatId, msgs);
      currentChat.lastMessageSnippet = char.greeting.slice(0, 80);
      currentChat.lastActivityAt = new Date().toISOString();
      Storage.saveChat(currentChat);
    }
    setMessages(msgs);
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distanceToBottom > 280);
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleIllustrateMessage = (text: string) => {
    setSceneContextForGen(text);
    setShowImageGen(true);
  };

  const updateExplicitLevel = (level: ExplicitLevel) => {
    if (!chat) return;
    const updated = { ...chat, explicitLevel: level };
    setChat(updated);
    Storage.saveChat(updated);
  };

  const handleSend = async (customText?: string, attachments?: any[]) => {
    const textToSend = customText !== undefined ? customText : inputValue;
    if ((!textToSend.trim() && (!attachments || attachments.length === 0)) || !chat || !character || isStreaming) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      chatId,
      role: 'user',
      content: textToSend.trim(),
      createdAt: new Date().toISOString(),
      attachments,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    Storage.saveMessages(chatId, newMessages);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Trigger AI response stream
    await streamAssistantReply(newMessages);
  };

  const streamAssistantReply = async (currentMessages: ChatMessage[]) => {
    if (!chat || !character) return;
    setIsStreaming(true);

    const activeUserRole = Storage.getActiveUserRole();
    const settings = Storage.getSettings();

    const assistantMsgId = `msg-${Date.now() + 1}`;
    const placeholderMsg: ChatMessage = {
      id: assistantMsgId,
      chatId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setMessages([...currentMessages, placeholderMsg]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages,
          character: character,
          userRole: activeUserRole,
          worldRules: character.worldRules,
          memories: chat.semanticMemories || [],
          episodicSummary: chat.episodicSummary || '',
          explicitLevel: chat.explicitLevel || 'sugerente',
          provider: settings.activeProvider || 'gemini',
          apiKey: settings.activeProvider === 'openrouter' ? settings.openRouterApiKey : (settings.activeProvider === 'groq' ? settings.groqApiKey : settings.geminiApiKey),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Error al conectar con el servidor de chat');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          if (trimmed === 'data: [DONE]') break;

          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.text) {
              accumulatedText += data.text;
              setMessages(prev =>
                prev.map(m => (m.id === assistantMsgId ? { ...m, content: accumulatedText } : m))
              );
            }
          } catch {
            // Ignore parse errors on raw tokens
          }
        }
      }

      const finalMessages = currentMessages.concat({
        ...placeholderMsg,
        content: accumulatedText.trim() || `*${character.name} te mira en silencio con un destello en la mirada.*`,
      });

      setMessages(finalMessages);
      Storage.saveMessages(chatId, finalMessages);

      // Update chat snippet
      const updatedChat = {
        ...chat,
        lastMessageSnippet: accumulatedText.slice(0, 100),
        lastActivityAt: new Date().toISOString(),
      };
      setChat(updatedChat);
      Storage.saveChat(updatedChat);

      // Auto-summarize trigger: Every 6 new turns, trigger background episodic memory synthesis
      if (finalMessages.length > 4 && finalMessages.length % 6 === 0) {
        triggerAutoSummarize(finalMessages, updatedChat);
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: `*${character.name} parece absorto por un instante.* "La penumbra nos envuelve... ¿qué me decías?"` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const triggerAutoSummarize = async (allMsgs: ChatMessage[], currentChat: ChatSession) => {
    try {
      const activeUserRole = Storage.getActiveUserRole();
      const res = await fetch('/api/memory/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMsgs,
          characterName: character?.name,
          userName: activeUserRole.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newSemantic = Array.from(new Set([...(currentChat.semanticMemories || []), ...(data.facts || [])]));
        const updated = {
          ...currentChat,
          episodicSummary: data.summary || currentChat.episodicSummary,
          semanticMemories: newSemantic,
        };
        setChat(updated);
        Storage.saveChat(updated);
      }
    } catch (e) {
      console.warn('Auto summarize skipped:', e);
    }
  };

  const handleRegenerateLast = async () => {
    if (messages.length < 2 || isStreaming) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'assistant') return;

    const trimmedMessages = messages.slice(0, -1);
    setMessages(trimmedMessages);
    Storage.saveMessages(chatId, trimmedMessages);
    await streamAssistantReply(trimmedMessages);
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!editContent.trim()) return;
    const msgIndex = messages.findIndex(m => m.id === msgId);
    if (msgIndex === -1) return;

    // Truncate conversation from this user message forward and regenerate
    const updatedUserMsg = { ...messages[msgIndex], content: editContent.trim(), isEdited: true };
    const truncated = messages.slice(0, msgIndex).concat(updatedUserMsg);

    setMessages(truncated);
    Storage.saveMessages(chatId, truncated);
    setEditingMessageId(null);

    await streamAssistantReply(truncated);
  };

  const handleExportChat = (format: 'markdown' | 'txt') => {
    if (!chat || !character) return;
    let text = `# Conversa ✦ ${character.name}\n`;
    text += `Fecha: ${new Date().toLocaleString()}\n`;
    text += `Nivel de explicitud: ${chat.explicitLevel}\n\n---\n\n`;

    messages.forEach(m => {
      const sender = m.role === 'user' ? 'Tú' : character.name;
      text += `**${sender}** (${new Date(m.createdAt).toLocaleTimeString()}):\n${m.content}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa_${character.name.toLowerCase().replace(/\s+/g, '_')}.${format === 'markdown' ? 'md' : 'txt'}`;
    a.click();
    setShowMenu(false);
  };

  const handleClearMessages = () => {
    if (window.confirm('¿Deseas reiniciar esta conversación desde el saludo inicial?')) {
      if (character) {
        const greetingMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          chatId,
          role: 'assistant',
          content: character.greeting,
          createdAt: new Date().toISOString(),
        };
        setMessages([greetingMsg]);
        Storage.saveMessages(chatId, [greetingMsg]);
      }
      setShowMenu(false);
    }
  };

  // Helper to format narrative text with italics
  const renderFormattedContent = (content: string) => {
    // Split by lines and parse markdown-style asterisks
    const parts = content.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <span key={index} className="italic text-[#F5A87E]/95 block my-1 pl-2 border-l-2 border-[#E8825A]/40 font-serif-cinematic">
            {part.slice(1, -1)}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Wallpaper themes
  const getWallpaperClass = () => {
    switch (wallpaper) {
      case 'twilight':
        return 'bg-gradient-to-b from-[#1A1430] via-[#2A2145] to-[#0D0A1A]';
      case 'obsidian':
        return 'bg-gradient-to-b from-[#0D0A1A] via-[#1A1430] to-[#0D0A1A]';
      case 'crimson':
        return 'bg-gradient-to-b from-[#3D2E4A] via-[#1A1430] to-[#0D0A1A]';
      default:
        return 'bg-[#0D0A1A]';
    }
  };

  if (!character || !chat) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-[#EDE7F0]">
        <Sparkles className="w-6 h-6 animate-spin text-[#E8825A]" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen ${getWallpaperClass()} text-[#EDE7F0] overflow-hidden`}>
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#0D0A1A]/85 backdrop-blur-xl border-b border-[#2A2145]/70 pt-safe px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-xl text-[#EDE7F0]/70 hover:text-[#EDE7F0] hover:bg-[#2A2145]/50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar and name */}
          <div
            onClick={() => onOpenCharacterProfile(character.id)}
            className="flex items-center gap-2.5 cursor-pointer group min-w-0"
          >
            <div className="relative shrink-0">
              <img
                src={character.avatar}
                alt={character.name}
                className="w-10 h-10 rounded-full object-cover border border-[#2A2145] group-hover:border-[#E8825A] transition shadow-sm"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0D0A1A]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm font-serif-cinematic truncate tracking-wide">
                  {character.name}
                </span>
                {character.isVillain && (
                  <span className="text-[9px] bg-rose-950 text-rose-300 px-1 rounded border border-rose-800 shrink-0">
                    Villano
                  </span>
                )}
              </div>
              <span className="text-[10px] text-emerald-400/90 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                en línea
              </span>
            </div>
          </div>
        </div>

        {/* Top actions & Explicit mode toggle */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Bond Level Pill */}
          <button
            onClick={() => setShowMemory(true)}
            className="hidden xs:flex items-center gap-1 bg-[#2A2145]/70 hover:bg-[#2A2145] text-[10px] text-[#F5A87E] px-2 py-1 rounded-lg border border-[#3D2E4A] transition"
            title="Nivel de vínculo y recuerdos con el personaje"
          >
            <Sparkles className="w-3 h-3 text-[#E8825A]" />
            <span className="font-semibold">{chat.bondLevel || 'Vínculo ✦'}</span>
          </button>

          {/* Explicit level pill */}
          <select
            value={chat.explicitLevel}
            onChange={(e) => updateExplicitLevel(e.target.value as ExplicitLevel)}
            className="bg-[#2A2145]/60 hover:bg-[#2A2145] text-[10px] uppercase font-bold tracking-wider text-[#F5A87E] px-2 py-1 rounded-lg border border-[#3D2E4A] cursor-pointer focus:outline-none"
            title="Cambiar tono y nivel de explicitud"
          >
            <option value="normal">Normal</option>
            <option value="sugerente">Sugerente</option>
            <option value="explícito">Explícito +18</option>
          </select>

          {/* Quick Scene Camera Action */}
          <button
            onClick={() => {
              const lastSnippet = messages.slice(-2).map(m => m.content).join(' ');
              handleIllustrateMessage(lastSnippet);
            }}
            className="p-2 rounded-xl text-[#EDE7F0]/70 hover:text-[#E8825A] hover:bg-[#2A2145]/50 transition"
            title="Ilustrar escena actual con IA"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Memory Inspector Button */}
          <button
            onClick={() => setShowMemory(true)}
            className="p-2 rounded-xl text-[#EDE7F0]/70 hover:text-[#E8825A] hover:bg-[#2A2145]/50 transition relative"
            title="Núcleo de memoria del personaje"
          >
            <Brain className="w-4 h-4" />
            {chat.semanticMemories && chat.semanticMemories.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E8825A]" />
            )}
          </button>

          {/* Call button */}
          <button
            onClick={() => setShowCall(true)}
            className="p-2 rounded-xl text-[#EDE7F0]/70 hover:text-[#E8825A] hover:bg-[#2A2145]/50 transition"
            title="Llamada íntima simulada"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Video / Call icon */}
          <button
            onClick={() => setShowCall(true)}
            className="p-2 rounded-xl text-[#EDE7F0]/70 hover:text-[#E8825A] hover:bg-[#2A2145]/50 transition hidden sm:inline-flex"
            title="Videollamada simulada"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-xl text-[#EDE7F0]/70 hover:text-[#EDE7F0] hover:bg-[#2A2145]/50 transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 w-48 rounded-2xl bg-[#1A1430] border border-[#2A2145] shadow-2xl p-2 z-50 text-xs space-y-1">
                <button
                  onClick={() => {
                    onOpenCharacterProfile(character.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-[#2A2145] text-[#EDE7F0] transition"
                >
                  Ver Perfil de {character.name}
                </button>
                <button
                  onClick={() => handleExportChat('markdown')}
                  className="w-full text-left p-2 rounded-xl hover:bg-[#2A2145] text-[#EDE7F0] flex items-center justify-between transition"
                >
                  <span>Exportar historia (.md)</span>
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const themes = ['midnight', 'twilight', 'obsidian', 'crimson'];
                    const next = themes[(themes.indexOf(wallpaper) + 1) % themes.length];
                    setWallpaper(next);
                    Storage.saveChat({ ...chat, wallpaperTheme: next });
                    setShowMenu(false);
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-[#2A2145] text-[#EDE7F0] transition"
                >
                  Cambiar Fondo ({wallpaper})
                </button>
                <div className="border-t border-[#2A2145]/60 my-1" />
                <button
                  onClick={handleClearMessages}
                  className="w-full text-left p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 flex items-center justify-between transition"
                >
                  <span>Reiniciar chat</span>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Message List */}
      <main
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 relative"
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const isLastAssistant = !isUser && index === messages.length - 1;

          return (
            <div
              key={msg.id}
              className={`flex flex-col group ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Message Bubble Container */}
              <div className={`flex gap-2 max-w-[92%] sm:max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Assistant Avatar for character bubble */}
                {!isUser && (
                  <img
                    src={character.avatar}
                    alt={character.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-1 border border-[#3D2E4A]"
                  />
                )}

                {/* Bubble Body */}
                <div
                  className={`relative p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed shadow-md transition-all ${
                    isUser
                      ? 'bg-[#2A2145] text-[#EDE7F0] border border-[#3D2E4A]/60 rounded-tr-none'
                      : 'bg-[#1A1430]/90 text-[#EDE7F0] border border-[#2A2145] rounded-tl-none'
                  }`}
                >
                  {/* Inline Edit Mode for user */}
                  {editingMessageId === msg.id ? (
                    <div className="space-y-2 min-w-[200px]">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full p-2 rounded-xl glass-input text-xs"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingMessageId(null)}
                          className="p-1 rounded text-[#EDE7F0]/60 hover:text-[#EDE7F0]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSaveEdit(msg.id)}
                          className="px-2 py-1 rounded bg-[#E8825A] text-[#0D0A1A] font-bold text-xs"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Attachments if any */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-2.5 space-y-2">
                          {msg.attachments.map((att, attIdx) => (
                            <div
                              key={attIdx}
                              onClick={() => setActiveLightboxImage({ url: att.url, prompt: att.prompt })}
                              className="rounded-2xl overflow-hidden border border-[#3D2E4A] group/img relative cursor-pointer shadow-lg bg-[#0D0A1A]"
                            >
                              <img
                                src={att.url}
                                alt="Escena ilustrada"
                                className="w-full max-h-72 object-cover group-hover/img:scale-102 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center">
                                <span className="opacity-0 group-hover/img:opacity-100 transition-opacity p-2 rounded-full bg-[#0D0A1A]/80 text-[#EDE7F0] text-xs flex items-center gap-1 shadow-lg">
                                  <ImageIcon className="w-3.5 h-3.5 text-[#E8825A]" />
                                  <span>Ver en grande</span>
                                </span>
                              </div>
                              {att.prompt && (
                                <p className="p-2 text-[10px] bg-[#0D0A1A]/85 text-[#EDE7F0]/80 italic border-t border-[#2A2145]">
                                  "{att.prompt}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Content */}
                      <div className="whitespace-pre-wrap font-sans text-xs md:text-sm leading-relaxed">
                        {renderFormattedContent(msg.content)}
                      </div>

                      {/* Timestamp & Edited status */}
                      <div
                        className={`flex items-center gap-1.5 mt-2 text-[10px] ${
                          isUser ? 'text-[#EDE7F0]/40 justify-end' : 'text-[#EDE7F0]/40'
                        }`}
                      >
                        {msg.isEdited && <span>(editado)</span>}
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Message Action Bar (Always touch-accessible on mobile or on hover) */}
              <div
                className={`flex items-center gap-1.5 mt-1 px-1 transition-opacity ${
                  isUser ? 'justify-end mr-1' : 'justify-start ml-9'
                }`}
              >
                {/* Illustrate scene button for ANY message */}
                <button
                  onClick={() => handleIllustrateMessage(msg.content)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#1A1430]/60 hover:bg-[#2A2145] text-[10px] text-[#EDE7F0]/60 hover:text-[#E8825A] border border-[#2A2145]/40 transition active:scale-95"
                  title="Generar imagen de esta escena con IA"
                >
                  <ImageIcon className="w-3 h-3 text-[#E8825A]" />
                  <span>Ilustrar escena</span>
                </button>

                {/* Copy button */}
                <button
                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                  className="p-1 rounded-lg text-[#EDE7F0]/40 hover:text-[#EDE7F0] transition"
                  title="Copiar texto"
                >
                  {copiedMsgId === msg.id ? (
                    <span className="text-[10px] text-emerald-400 font-bold">Copiado</span>
                  ) : (
                    <span className="text-[10px] text-[#EDE7F0]/50 hover:text-[#EDE7F0]">Copiar</span>
                  )}
                </button>

                {isUser ? (
                  <button
                    onClick={() => handleStartEdit(msg)}
                    className="p-1 text-[#EDE7F0]/40 hover:text-[#E8825A] rounded transition"
                    title="Editar mensaje"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                ) : (
                  isLastAssistant && (
                    <button
                      onClick={handleRegenerateLast}
                      disabled={isStreaming}
                      className="flex items-center gap-1 p-1 text-[10px] text-[#EDE7F0]/50 hover:text-[#E8825A] rounded transition"
                      title="Regenerar respuesta del personaje"
                    >
                      <RefreshCw className={`w-3 h-3 ${isStreaming ? 'animate-spin' : ''}`} />
                      <span>Regenerar</span>
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-[#EDE7F0]/70 italic pl-9 py-1 bg-[#1A1430]/40 rounded-xl w-fit border border-[#2A2145]/40 pr-3">
            <span className="w-2 h-2 rounded-full bg-[#E8825A] animate-ping" />
            <span>{character.name} está redactando una respuesta profunda...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-20 right-4 z-40 p-2.5 rounded-full bg-[#1A1430] border border-[#E8825A]/60 text-[#E8825A] shadow-xl hover:scale-105 active:scale-95 transition flex items-center gap-1.5 text-xs font-bold backdrop-blur-md"
        >
          <span>↓</span>
          <span className="text-[10px]">Al final</span>
        </button>
      )}

      {/* Emoji fast picker popup */}
      {showEmojiPicker && (
        <div className="p-2 bg-[#1A1430] border-t border-[#2A2145] flex items-center justify-around text-lg">
          {['✦', '🖤', '🍷', '🌙', '🥀', '✨', '🔥', '⚔️', '👁️', '💋'].map(emoji => (
            <button
              key={emoji}
              onClick={() => {
                setInputValue(prev => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="p-1 hover:scale-125 transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <footer className="bg-[#1A1430]/90 backdrop-blur-xl border-t border-[#2A2145]/70 p-3 pb-safe">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          {/* Action buttons (Emoji & Image Generator) */}
          <div className="flex items-center gap-1 pb-1">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-xl text-[#EDE7F0]/60 hover:text-[#EDE7F0] hover:bg-[#2A2145]/50 transition"
              title="Emojis y símbolos"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowImageGen(true)}
              className="p-2 rounded-xl text-[#EDE7F0]/60 hover:text-[#E8825A] hover:bg-[#2A2145]/50 transition"
              title="Generar imagen de la escena (Pollinations AI)"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Text input area */}
          <div className="flex-1 min-w-0 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Escribe a ${character.name}... (usa *acciones* entre asteriscos)`}
              rows={1}
              className="w-full max-h-32 py-2.5 px-3.5 rounded-2xl glass-input text-xs md:text-sm resize-none placeholder:text-[#EDE7F0]/30 leading-relaxed"
            />
          </div>

          {/* Coral Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isStreaming}
            className="p-3 rounded-2xl bg-[#E8825A] hover:bg-[#E8825A]/90 disabled:opacity-40 disabled:hover:bg-[#E8825A] text-[#0D0A1A] font-bold shadow-lg shadow-[#E8825A]/25 transition active:scale-95 glow-coral shrink-0"
            title="Enviar mensaje"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </footer>

      {/* Modals */}
      {showImageGen && (
        <ImageGeneratorModal
          characterName={character.name}
          characterAppearance={character.appearance}
          contextSnippet={sceneContextForGen || messages.slice(-2).map(m => m.content).join(' ')}
          onImageGenerated={(url, prompt) => {
            const attachment = { id: `att-${Date.now()}`, type: 'image' as const, url, prompt };
            handleSend(`*Te muestra la imagen de la escena:* "${prompt}"`, [attachment]);
            setSceneContextForGen('');
          }}
          onClose={() => {
            setShowImageGen(false);
            setSceneContextForGen('');
          }}
        />
      )}

      {/* Lightbox for scene images */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div className="flex items-center justify-between z-10">
            <span className="text-xs text-[#EDE7F0]/70 flex items-center gap-1.5 font-medium">
              <ImageIcon className="w-4 h-4 text-[#E8825A]" />
              Ilustración de Escena ✦ {character.name}
            </span>
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="p-2 rounded-full bg-[#1A1430] text-[#EDE7F0] hover:text-[#E8825A] border border-[#2A2145]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeLightboxImage.url}
              alt="Escena ampliada"
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-[#3D2E4A]"
            />
          </div>

          {activeLightboxImage.prompt && (
            <div
              className="max-w-xl mx-auto w-full p-3.5 rounded-2xl bg-[#1A1430]/90 border border-[#2A2145] text-xs text-[#EDE7F0]/90 italic text-center z-10"
              onClick={(e) => e.stopPropagation()}
            >
              "{activeLightboxImage.prompt}"
            </div>
          )}
        </div>
      )}

      {showMemory && (
        <MemoryInspectorModal
          characterName={character.name}
          episodicSummary={chat.episodicSummary}
          semanticMemories={chat.semanticMemories || []}
          relationsCount={character.relations?.length || 0}
          recentMessagesCount={messages.length}
          onUpdateSummary={(newSummary) => {
            const updated = { ...chat, episodicSummary: newSummary };
            setChat(updated);
            Storage.saveChat(updated);
          }}
          onDeleteSemanticMemory={(index) => {
            const updatedFacts = [...(chat.semanticMemories || [])];
            updatedFacts.splice(index, 1);
            const updated = { ...chat, semanticMemories: updatedFacts };
            setChat(updated);
            Storage.saveChat(updated);
          }}
          onAddSemanticFact={(fact) => {
            const updatedFacts = [...(chat.semanticMemories || []), fact];
            const updated = { ...chat, semanticMemories: updatedFacts };
            setChat(updated);
            Storage.saveChat(updated);
          }}
          onWipeAllMemories={() => {
            const updated = { ...chat, episodicSummary: '', semanticMemories: [] };
            setChat(updated);
            Storage.saveChat(updated);
          }}
          onClose={() => setShowMemory(false)}
        />
      )}

      {showCall && (
        <CallSimulationModal
          character={character}
          onClose={() => setShowCall(false)}
        />
      )}
    </div>
  );
};

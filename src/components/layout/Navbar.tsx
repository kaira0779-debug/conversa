import React from 'react';
import { MessageSquare, Users, Sparkles, Settings2 } from 'lucide-react';

export type NavTab = 'chats' | 'characters' | 'explore' | 'settings';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  unreadCount = 0,
}) => {
  const tabs = [
    {
      id: 'chats' as NavTab,
      label: 'Chats',
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      id: 'characters' as NavTab,
      label: 'Personajes',
      icon: Users,
      badge: null,
    },
    {
      id: 'explore' as NavTab,
      label: 'Explorar',
      icon: Sparkles,
      badge: null,
    },
    {
      id: 'settings' as NavTab,
      label: 'Ajustes',
      icon: Settings2,
      badge: null,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#1A1430]/90 backdrop-blur-xl border-t border-[#2A2145]/70 pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center w-16 py-1 transition-all group"
            >
              <div
                className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-[#E8825A] bg-[#2A2145]/60 glow-coral'
                    : 'text-[#EDE7F0]/60 hover:text-[#EDE7F0] group-hover:bg-[#2A2145]/30'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 bg-[#E8825A] text-[#0D0A1A] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-[#1A1430]">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium mt-0.5 tracking-wider transition-colors ${
                  isActive ? 'text-[#E8825A] font-semibold' : 'text-[#EDE7F0]/50'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-5 h-0.5 bg-[#E8825A] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

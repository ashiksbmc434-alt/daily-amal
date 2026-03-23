import React from 'react';
import { Home, BookOpen, History as HistoryIcon, Calendar, Wallet, User as UserIcon } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'amal', label: 'আমল', icon: Home },
    { id: 'notes', label: 'নোট', icon: BookOpen },
    { id: 'accounts', label: 'হিসাব', icon: Wallet },
    { id: 'history', label: 'ইতিহাস', icon: HistoryIcon },
    { id: 'developer', label: 'ডেভেলপার', icon: UserIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-emerald-100 safe-area-bottom z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 bg-emerald-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

import React, { useState } from 'react';
import { User, Home, Zap, Droplets, PlusCircle, Calendar, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'tenant', label: 'Tenant', icon: <User className="w-5 h-5" /> },
  { id: 'rent', label: 'Rent', icon: <Home className="w-5 h-5" /> },
  { id: 'electricity', label: 'Electric', icon: <Zap className="w-5 h-5" /> },
  { id: 'water', label: 'Water', icon: <Droplets className="w-5 h-5" /> },
  { id: 'extra', label: 'Extra', icon: <PlusCircle className="w-5 h-5" /> },
  { id: 'date', label: 'Date', icon: <Calendar className="w-5 h-5" /> },
  { id: 'send', label: 'Send', icon: <Send className="w-5 h-5" /> },
];

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg safe-area-bottom z-50">
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 min-w-[64px] flex flex-col items-center justify-center py-2 px-1 transition-all duration-200 tap-highlight",
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "relative p-1.5 rounded-xl transition-all duration-200",
              activeTab === tab.id && "bg-primary-light"
            )}>
              {tab.icon}
            </div>
            <span className={cn(
              "text-[10px] mt-0.5 font-medium transition-all",
              activeTab === tab.id ? "font-semibold" : ""
            )}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

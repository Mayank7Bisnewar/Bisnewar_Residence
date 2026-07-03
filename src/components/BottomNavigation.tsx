import { User, Send, BookOpen, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: 'nav' | 'action';
}

const tabs: Tab[] = [
  { id: 'tenant', label: 'Tenants', icon: <User className="w-5 h-5" />, type: 'nav' },
  { id: 'send', label: 'Summary', icon: <Send className="w-5 h-5" />, type: 'nav' },
  { id: 'add', label: 'Add', icon: <Plus className="w-8 h-8" />, type: 'action' },
  { id: 'directory', label: 'Directory', icon: <BookOpen className="w-5 h-5" />, type: 'nav' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, type: 'nav' },
];

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onAddClick: () => void;
}

export function BottomNavigation({ activeTab, onTabChange, onAddClick }: BottomNavigationProps) {
  return (
    <nav
      className="fixed bottom-[5px] left-0 right-0 z-50 flex justify-center px-5 overflow-visible"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)', overflow: 'visible', background: 'transparent' }}
    >
      {/* Single floating pill bar */}
      <div
        className="flex items-center justify-around h-[58px] w-full max-w-[340px] rounded-full"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'linear-gradient(90deg, #014c9c 0%, #0d2150f4 50%, #014c9c 100%)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.type === 'action') {
                  if (tab.id === 'add') onAddClick();
                } else {
                  onTabChange(tab.id);
                }
              }}
              className={cn(
                "relative flex items-center justify-center tap-highlight",
                tab.id === 'add' ? 'w-12 h-12' : 'w-10 h-10'
              )}
            >
              <motion.div
                animate={{ scale: tab.id === 'add' ? 1.05 : isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={cn(
                  'relative z-0 transition-colors duration-200 flex items-center justify-center',
                  tab.id === 'add'
                    ? 'w-12 h-12 rounded-[16px] bg-[#0b1633] text-white flex items-center justify-center shadow-md'
                    : isActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white'
                )}
              >
                {tab.icon}
              </motion.div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}


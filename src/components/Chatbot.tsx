import React, { Suspense, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

const ChatbotPanel = React.lazy(() => import('./ChatbotPanel').then((m) => ({ default: m.ChatbotPanel })));

export function Chatbot() {
  const [hasOpened, setHasOpened] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => { setHasOpened(true); setIsOpen(true); }}
        className={cn(
          "fixed bottom-24 right-6 w-14 h-14 bg-tp-red hover:bg-[#D91F33] text-white rounded-full shadow-lg flex items-center justify-center transition-all z-40 hover:scale-105",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {hasOpened && (
        <Suspense fallback={null}>
          <ChatbotPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

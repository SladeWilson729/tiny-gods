import React from 'react';
import { motion } from 'framer-motion';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

const DEFAULT_CARD_BACK = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e04136fbb307df3e4a61ec/3c3af97fa_GenericCardback.png';

// Memoize to prevent unnecessary re-renders
export default React.memo(function DeckVisual({ deckCount, cardBackUrl, onClick }) {
  const displayCardBack = cardBackUrl || DEFAULT_CARD_BACK;
  
  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className="relative cursor-pointer"
          style={{ width: '100px', height: '140px' }}
        >
          {/* Stack of cards effect */}
          <div className="absolute inset-0">
            {[0, 1, 2].map((offset) => (
              <motion.div
                key={offset}
                className="absolute rounded-lg border-2 border-purple-500 overflow-hidden shadow-2xl"
                style={{
                  width: '100px',
                  height: '140px',
                  left: `${offset * 3}px`,
                  top: `${offset * 3}px`,
                  zIndex: 3 - offset,
                  opacity: 1 - offset * 0.2,
                  backgroundImage: `url(${displayCardBack})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: offset === 0 ? '0 10px 30px rgba(139, 92, 246, 0.5)' : 'none'
                }}
              >
                {/* Dark overlay for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-black/40" />
              </motion.div>
            ))}
          </div>

          {/* Card count badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-2 -right-2 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg border-2 border-white z-10"
          >
            {deckCount}
          </motion.div>
        </motion.div>
      </HoverCardTrigger>
      <HoverCardContent className="bg-black/95 border-purple-600">
        <div className="space-y-2">
          <h4 className="font-bold text-purple-400">Draw Pile</h4>
          <p className="text-sm text-gray-300">
            {deckCount} {deckCount === 1 ? 'card' : 'cards'} remaining
          </p>
          <p className="text-xs text-gray-400 italic">
            Click to view your full deck
          </p>
          {cardBackUrl && (
            <div className="text-xs text-purple-400 flex items-center gap-1">
              <span>✨</span>
              <span>Custom Card Back Equipped</span>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
});
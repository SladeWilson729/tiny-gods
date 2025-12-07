
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import BattleCard from './BattleCard';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DeckViewModal({ open, onClose, deck, godImage }) {
  // Count card occurrences
  const cardCounts = deck.reduce((acc, card) => {
    const key = `${card.name}-${card.type}-${card.value}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Get unique cards
  const uniqueCards = deck.filter((card, index, self) => {
    const key = `${card.name}-${card.type}-${card.value}`;
    return index === self.findIndex(c => `${c.name}-${c.type}-${c.value}` === key);
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-gradient-to-br from-indigo-950 via-purple-950 to-black border-purple-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl text-purple-400">Your Deck</DialogTitle>
          <DialogDescription className="text-lg">
            Total Cards: {deck.length}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh] pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4">
            {uniqueCards.map((card, index) => {
              const key = `${card.name}-${card.type}-${card.value}`;
              const count = cardCounts[key];
              
              return (
                <motion.div
                  key={`${key}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <BattleCard 
                    card={card}
                    onPlay={() => {}}
                    disabled={true}
                    index={index}
                    godImage={godImage}
                  />
                  {count > 1 && (
                    <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg shadow-lg border-2 border-white">
                      {count}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

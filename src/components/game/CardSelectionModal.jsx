import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import BattleCard from './BattleCard';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function CardSelectionModal({ open, onCardSelected, godCards, currentGod, godTalents, playerRelics, isWildMode = false }) {
  const [cardChoices, setCardChoices] = useState([]);
  const [allGods, setAllGods] = useState([]);
  
  useEffect(() => {
    const loadAllGods = async () => {
      if (isWildMode) {
        try {
          const gods = await base44.entities.God.list();
          setAllGods(gods);
        } catch (error) {
          console.error('Failed to load all gods:', error);
          setAllGods([]);
        }
      }
    };
    
    if (open) {
      loadAllGods();
    }
  }, [open, isWildMode]);

  useEffect(() => {
    if (open && ((isWildMode && allGods.length > 0) || (!isWildMode && godCards && godCards.length > 0))) {
      const numCards = 3;
      
      let cardPool = [];
      
      if (isWildMode) {
        // Combine all cards from all gods
        allGods.forEach(god => {
          if (god.cards && Array.isArray(god.cards)) {
            cardPool = [...cardPool, ...god.cards];
          }
        });
      } else {
        // Use only the current god's cards
        cardPool = [...godCards];
      }
      
      // Generate random cards from the pool
      const shuffled = cardPool.sort(() => Math.random() - 0.5);
      const choices = shuffled.slice(0, Math.min(numCards, cardPool.length));
      setCardChoices(choices);
    }
  }, [open, godCards, playerRelics, isWildMode, allGods]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl bg-gradient-to-br from-gray-900 via-gray-800 to-black border-amber-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl text-amber-400">
            Battle Won!
            {isWildMode && <span className="text-cyan-400 ml-3">🎲 Wild Mode</span>}
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-300">
            {isWildMode 
              ? 'The gods are pleased. Add a card from any pantheon to your deck.'
              : 'The gods are pleased. Add a new card to your deck.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          {cardChoices.length === 0 ? (
            <div className="text-center text-gray-400">
              <p>Generating card choices...</p>
            </div>
          ) : (
            <div className="flex justify-center gap-6 flex-wrap">
              {cardChoices.map((card, index) => (
                <motion.div
                  key={`${card.name}-${index}`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  onClick={() => onCardSelected(card)}
                >
                  <BattleCard 
                    card={card}
                    onPlay={() => onCardSelected(card)}
                    disabled={false}
                    index={index}
                    godImage={currentGod?.image}
                    comboActive={false}
                    surgeActive={false}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
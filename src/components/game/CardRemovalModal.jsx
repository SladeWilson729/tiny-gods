
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import BattleCard from './BattleCard';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';

export default function CardRemovalModal({ open, onCardRemoved, onSkip, deck, godImage, maxRemovals = 4 }) {
  const [selectedCardCounts, setSelectedCardCounts] = useState({});

  // Count card occurrences for display
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

  const getTotalSelected = () => {
    return Object.values(selectedCardCounts).reduce((sum, count) => sum + count, 0);
  };

  const handleSelectCard = (card) => {
    const key = `${card.name}-${card.type}-${card.value}`;
    const currentSelected = selectedCardCounts[key] || 0;
    const availableCount = cardCounts[key];
    const totalSelected = getTotalSelected();
    
    // Only select if there's space globally and for this specific card type
    if (totalSelected < maxRemovals && currentSelected < availableCount) {
      setSelectedCardCounts(prevCounts => ({
        ...prevCounts,
        [key]: currentSelected + 1
      }));
    }
  };

  const handleDeselectCard = (card) => {
    const key = `${card.name}-${card.type}-${card.value}`;
    const currentSelected = selectedCardCounts[key] || 0;

    // Only deselect if this card type is currently selected
    if (currentSelected > 0) {
      setSelectedCardCounts(prevCounts => {
        const newCounts = { ...prevCounts };
        newCounts[key] = currentSelected - 1;
        if (newCounts[key] === 0) {
          delete newCounts[key];
        }
        return newCounts;
      });
    }
  };

  const handleConfirmRemoval = () => {
    const totalSelected = getTotalSelected();
    
    if (totalSelected === 0) {
      onSkip();
      return;
    }

    let newDeck = [...deck];
    
    // Remove cards based on selectedCardCounts
    Object.entries(selectedCardCounts).forEach(([key, count]) => {
      for (let i = 0; i < count; i++) {
        const index = newDeck.findIndex(c => `${c.name}-${c.type}-${c.value}` === key);
        if (index >= 0) {
          newDeck.splice(index, 1);
        }
      }
    });
    
    console.log('[CardRemovalModal] Removing', totalSelected, 'cards');
    console.log('[CardRemovalModal] Old deck length:', deck.length, 'New deck length:', newDeck.length);
    
    setSelectedCardCounts({});
    onCardRemoved(newDeck);
  };

  const handleSkip = () => {
    setSelectedCardCounts({});
    onSkip();
  };

  const getCardSelectionInfo = (card) => {
    const key = `${card.name}-${card.type}-${card.value}`;
    const selected = selectedCardCounts[key] || 0;
    const available = cardCounts[key];
    return { selected, available, key };
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-gray-800 to-black border-amber-600 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl flex items-center gap-3 text-amber-400">
            <Trash2 className="w-8 h-8" />
            Remove Up To {maxRemovals} Cards
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-300">
            Choose up to {maxRemovals} cards to permanently remove. Click to toggle selection (or right-click to deselect)!
          </DialogDescription>
        </DialogHeader>

        <div className="text-center text-yellow-300 font-bold text-lg mb-2">
          Selected: {getTotalSelected()} / {maxRemovals}
        </div>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4">
            {uniqueCards.map((card, index) => {
              const { selected, available, key } = getCardSelectionInfo(card);

              return (
                <motion.div
                  key={`${key}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative cursor-pointer"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent default browser behavior (e.g., text selection)
                    if (e.button === 0) { // Left-click
                      if (selected > 0) {
                        handleDeselectCard(card);
                      } else {
                        handleSelectCard(card);
                      }
                    } else if (e.button === 2) { // Right-click
                      handleDeselectCard(card);
                    }
                  }}
                  onContextMenu={(e) => e.preventDefault()} // Explicitly prevent context menu
                >
                  <div className={`${selected > 0 ? 'ring-4 ring-red-500 scale-105' : 'hover:scale-105'} transition-all rounded-xl`}>
                    <BattleCard 
                      card={card}
                      onPlay={() => {}}
                      disabled={false}
                      index={index}
                      godImage={godImage}
                    />
                  </div>
                  
                  {/* Available count badge */}
                  {available > 1 && (
                    <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg shadow-lg border-2 border-white z-10">
                      {available}
                    </div>
                  )}
                  
                  {/* Selected count badge */}
                  {selected > 0 && (
                    <>
                      <div className="absolute inset-0 bg-red-500/20 rounded-xl flex items-center justify-center z-10">
                        <Trash2 className="w-12 h-12 text-red-500" />
                      </div>
                      <div className="absolute top-2 left-2 bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl shadow-lg border-2 border-white z-20">
                        {selected}
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t border-amber-800">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="border-gray-500 text-gray-300 hover:bg-gray-800"
          >
            Skip (Keep All Cards)
          </Button>

          <Button
            onClick={handleConfirmRemoval}
            disabled={getTotalSelected() === 0}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove {getTotalSelected()} Card{getTotalSelected() !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

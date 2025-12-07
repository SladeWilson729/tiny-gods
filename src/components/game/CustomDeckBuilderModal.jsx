import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, Minus, Coins, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BattleCard from './BattleCard';
import { base44 } from '@/api/base44Client';

const TOTAL_POINTS = 30;

export default function CustomDeckBuilderModal({ open, onComplete, onCancel, selectedGod }) {
  const [allCards, setAllCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [pointsUsed, setPointsUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    if (open && selectedGod) {
      loadCards();
    }
  }, [open, selectedGod]);

  const loadCards = async () => {
    setIsLoading(true);
    try {
      // Load all gods to get all available cards
      const gods = await base44.entities.God.list();
      
      // Combine all cards from all gods
      const cardPool = [];
      gods.forEach(god => {
        if (god.cards && Array.isArray(god.cards)) {
          god.cards.forEach(card => {
            cardPool.push({
              ...card,
              godName: god.name,
              godImage: god.image
            });
          });
        }
      });
      
      setAllCards(cardPool);
    } catch (error) {
      console.error('Failed to load cards:', error);
      setAllCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCardCost = (card) => {
    return Math.max(1, card.cost || 0);
  };

  const getCardCount = (card) => {
    return selectedCards.filter(c => c.name === card.name && c.godName === card.godName).length;
  };

  const canAddCard = (card) => {
    const cardCost = getCardCost(card);
    return pointsUsed + cardCost <= TOTAL_POINTS;
  };

  const handleAddCard = (card) => {
    if (!canAddCard(card)) return;
    
    const cardCost = getCardCost(card);
    const cardWithId = { ...card, id: crypto.randomUUID() };
    
    setSelectedCards([...selectedCards, cardWithId]);
    setPointsUsed(pointsUsed + cardCost);
  };

  const handleRemoveCard = (card) => {
    const cardIndex = selectedCards.findIndex(c => c.name === card.name && c.godName === card.godName);
    if (cardIndex === -1) return;
    
    const cardCost = getCardCost(card);
    const newSelectedCards = [...selectedCards];
    newSelectedCards.splice(cardIndex, 1);
    
    setSelectedCards(newSelectedCards);
    setPointsUsed(pointsUsed - cardCost);
  };

  const handleStartRun = () => {
    if (selectedCards.length === 0) {
      alert('Please select at least one card!');
      return;
    }
    onComplete(selectedCards);
  };

  const pointsRemaining = TOTAL_POINTS - pointsUsed;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-7xl h-[90vh] bg-gradient-to-br from-gray-900 via-purple-900 to-black border-amber-600 text-white flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-3xl flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-400" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
              Build Your Custom Deck
            </span>
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-300">
            Create your perfect deck with {TOTAL_POINTS} points. Each card costs energy equal to its cost (minimum 1).
            Face 20 enemies with your custom creation!
          </DialogDescription>
        </DialogHeader>

        {/* Points Display */}
        <div className="bg-black/60 border-2 border-amber-600 rounded-lg p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-amber-400" />
              <span className="text-2xl font-bold text-white">
                Points: <span className={pointsRemaining < 5 ? 'text-red-400' : 'text-amber-400'}>{pointsRemaining}</span> / {TOTAL_POINTS}
              </span>
            </div>
            <div className="text-gray-400">
              Cards Selected: <span className="text-white font-bold">{selectedCards.length}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onCancel}
              variant="outline"
              className="border-gray-500 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartRun}
              disabled={selectedCards.length === 0}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold"
            >
              Start Run with Custom Deck
            </Button>
          </div>
        </div>

        {/* Card Description Box */}
        {hoveredCard && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/80 border-2 border-purple-600 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-400 mb-2">{hoveredCard.name}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{hoveredCard.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400">
                  <span className="text-amber-300 font-bold text-sm">Cost: {getCardCost(hoveredCard)}</span>
                </div>
                <div className="text-xs text-purple-300">from {hoveredCard.godName}</div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
          {/* Card Pool */}
          <div className="flex flex-col overflow-hidden">
            <h3 className="text-xl font-bold text-amber-400 mb-3">Available Cards</h3>
            <ScrollArea className="flex-1 pr-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                </div>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
                  {allCards.map((card, index) => {
                    const cardCost = getCardCost(card);
                    const cardCount = getCardCount(card);
                    const canAdd = canAddCard(card);
                    
                    return (
                      <motion.div
                        key={`${card.name}-${card.godName}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.01 }}
                        className="relative"
                        style={{ pointerEvents: 'auto' }}
                        onMouseEnter={() => setHoveredCard(card)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        <div className={`${!canAdd && cardCount === 0 ? 'opacity-50' : ''} pointer-events-none`}>
                          <BattleCard
                            card={card}
                            disabled={true}
                            index={index}
                            godImage={card.godImage}
                            comboActive={false}
                            surgeActive={false}
                          />
                        </div>
                        
                        {/* Count Badge */}
                        {cardCount > 0 && (
                          <div className="absolute top-2 left-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full font-bold shadow-lg border-2 border-green-300 pointer-events-none text-sm" style={{ zIndex: 100 }}>
                            x{cardCount}
                          </div>
                        )}
                        
                        {/* God Name Badge */}
                        <div className="absolute bottom-14 left-2 bg-black/80 text-purple-300 px-2 py-1 rounded text-xs font-bold pointer-events-none" style={{ zIndex: 100 }}>
                          {card.godName}
                        </div>
                        
                        {/* Add/Remove Buttons - HIGHER Z-INDEX AND POINTER EVENTS */}
                        <div className="absolute bottom-2 right-2 flex gap-1" style={{ zIndex: 200, pointerEvents: 'auto' }}>
                          {cardCount > 0 && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCard(card);
                              }}
                              size="sm"
                              variant="destructive"
                              className="h-8 w-8 p-0 pointer-events-auto"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddCard(card);
                            }}
                            disabled={!canAdd}
                            size="sm"
                            className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 disabled:opacity-50 pointer-events-auto"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Selected Deck */}
          <div className="flex flex-col overflow-hidden border-l-2 border-amber-600 pl-4">
            <h3 className="text-xl font-bold text-green-400 mb-3">Your Deck ({selectedCards.length} cards)</h3>
            <ScrollArea className="flex-1 pr-4">
              {selectedCards.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No cards selected yet</p>
                    <p className="text-sm">Add cards from the left to build your deck</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
                  <AnimatePresence>
                    {selectedCards.map((card, index) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: index * 0.02 }}
                        className="relative"
                        style={{ pointerEvents: 'auto' }}
                        onMouseEnter={() => setHoveredCard(card)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        <div className="pointer-events-none">
                          <BattleCard
                            card={card}
                            disabled={true}
                            index={index}
                            godImage={card.godImage}
                            comboActive={false}
                            surgeActive={false}
                          />
                        </div>
                        
                        {/* Remove Button */}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCard(card);
                          }}
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 h-8 w-8 p-0 pointer-events-auto"
                          style={{ zIndex: 200 }}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
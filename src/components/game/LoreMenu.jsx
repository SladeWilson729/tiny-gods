import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { X, Lock, BookOpen, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function LoreMenu({ god, runsCompleted, onClose }) {
  const [loreCards, setLoreCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLoreCards();
  }, [god]);

  const loadLoreCards = async () => {
    setIsLoading(true);
    try {
      const lore = await base44.entities.PantheonLore.filter(
        { god_name: god.name },
        'card_number'
      );
      
      const allCards = Array.from({ length: 10 }, (_, i) => {
        const existing = lore.find(l => l.card_number === i + 1);
        return existing || {
          god_name: god.name,
          card_number: i + 1,
          title: `Chapter ${i + 1}`,
          content: 'This lore has not been written yet...',
          unlock_requirement: i + 1,
          placeholder: true
        };
      });
      
      setLoreCards(allCards);
    } catch (error) {
      console.error('Failed to load lore cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (card) => {
    if (card.card_number <= runsCompleted) {
      setSelectedCard(card);
    }
  };

  const navigateCard = (direction) => {
    if (!selectedCard) return;
    
    const currentIndex = loreCards.findIndex(c => c.card_number === selectedCard.card_number);
    let newIndex = currentIndex + direction;
    
    while (newIndex >= 0 && newIndex < loreCards.length) {
      if (loreCards[newIndex].card_number <= runsCompleted) {
        setSelectedCard(loreCards[newIndex]);
        return;
      }
      newIndex += direction;
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-black via-purple-950 to-indigo-950 border-4 border-amber-500/50 p-0">
          <div className="relative h-full">
            <div className="relative h-48 overflow-hidden border-b-4 border-amber-500/50">
              <img
                src={god.image}
                alt={god.name}
                className="w-full h-full object-cover brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 mb-2">
                    {god.name}
                  </h2>
                  <p className="text-xl text-purple-200">
                    {runsCompleted}/10 Lore Cards Unlocked
                  </p>
                </motion.div>
              </div>

              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(95vh-12rem)]">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {loreCards.map((card, index) => {
                    const isUnlocked = card.card_number <= runsCompleted;
                    const isNew = card.card_number === runsCompleted && runsCompleted > 0;

                    return (
                      <motion.div
                        key={card.card_number}
                        initial={{ opacity: 0, rotateY: 90 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={isUnlocked ? { scale: 1.1, rotateY: 5 } : {}}
                        onClick={() => handleCardClick(card)}
                      >
                        <Card 
                          className={`relative h-72 overflow-hidden transition-all duration-500 cursor-pointer ${
                            isUnlocked 
                              ? 'border-2 border-purple-500 hover:border-amber-500' 
                              : 'border-2 border-gray-700 opacity-50'
                          }`}
                          style={{
                            boxShadow: isUnlocked ? '0 0 20px rgba(139, 92, 246, 0.5)' : 'none',
                            transform: 'perspective(1000px)'
                          }}
                        >
                          <div 
                            className="absolute inset-0 bg-gradient-to-br from-purple-900/80 to-black/80"
                            style={{
                              backgroundImage: card.image_url && isUnlocked ? `url(${card.image_url})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          />
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                          {isNew && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold z-10"
                            >
                              NEW!
                            </motion.div>
                          )}

                          <div className="relative h-full flex flex-col items-center justify-center p-4">
                            {isUnlocked ? (
                              <>
                                <BookOpen className="w-12 h-12 text-amber-400 mb-4" />
                                <h3 className="text-lg font-bold text-white text-center mb-2">
                                  {card.title}
                                </h3>
                                <p className="text-xs text-purple-300 text-center">
                                  Chapter {card.card_number}
                                </p>
                              </>
                            ) : (
                              <>
                                <Lock className="w-12 h-12 text-gray-600 mb-4" />
                                <p className="text-sm text-gray-500 text-center">
                                  Complete {card.card_number} run{card.card_number !== 1 ? 's' : ''}
                                </p>
                              </>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedCard && (
        <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
          <DialogContent className="max-w-4xl bg-gradient-to-br from-black via-purple-950 to-black border-4 border-amber-500">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative"
            >
              <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none z-10">
                <Button
                  onClick={() => navigateCard(-1)}
                  variant="outline"
                  size="icon"
                  className="pointer-events-auto bg-black/80 border-purple-500 hover:bg-purple-500/20"
                  disabled={selectedCard.card_number === 1}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  onClick={() => navigateCard(1)}
                  variant="outline"
                  size="icon"
                  className="pointer-events-auto bg-black/80 border-purple-500 hover:bg-purple-500/20"
                  disabled={selectedCard.card_number === runsCompleted || selectedCard.card_number === 10}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>

              <div className="p-8">
                {selectedCard.image_url && (
                  <div className="mb-6 h-64 rounded-lg overflow-hidden border-2 border-purple-500/50">
                    <img
                      src={selectedCard.image_url}
                      alt={selectedCard.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="inline-block bg-purple-900/50 px-4 py-2 rounded-full mb-4">
                    <span className="text-purple-300 text-sm">Chapter {selectedCard.card_number} of 10</span>
                  </div>
                  <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 mb-4">
                    {selectedCard.title}
                  </h2>
                </div>

                <div className="bg-black/40 rounded-lg p-6 border border-purple-700/50">
                  <p className="text-lg text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {selectedCard.content}
                  </p>
                </div>

                <div className="mt-6 text-center">
                  <Button
                    onClick={() => setSelectedCard(null)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
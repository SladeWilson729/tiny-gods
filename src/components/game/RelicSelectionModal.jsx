
import React, { useState, useEffect } from 'react';
import { ShieldCheck, HeartPulse, BookOpen, Zap, BrainCircuit, Trophy, ShoppingBag, Gem, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const iconMap = {
  ShieldCheck,
  HeartPulse,
  BookOpen,
  Zap,
  BrainCircuit,
  Trophy,
  ShoppingBag,
  Gem,
};

export default function RelicSelectionModal({ open, onRelicSelected, playerRelics = [], currentGod = null, godTalents = {}, divineRank = 0 }) {
  const [relicChoices, setRelicChoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      const fetchRelics = async () => {
        setIsLoading(true);
        try {
          const allRelics = await base44.entities.Relic.list();
          const playerRelicIds = new Set((playerRelics || []).map(r => r.id));
          const availableRelics = allRelics.filter(r => !playerRelicIds.has(r.id));
          
          const shuffled = availableRelics.sort(() => 0.5 - Math.random());
          
          // Check if current god is Hades with Lord of Riches talent
          let relicCount = 3; // Default
          if (currentGod?.name === 'Hades' && godTalents?.tier1 === 'lord_of_riches') {
            relicCount = 4;
            console.log('[RelicSelection] Hades Lord of Riches: Showing 4 relics');
          }
          
          let selectedRelics = shuffled.slice(0, relicCount);
          
          // Apply empowerment at Rank 6+
          if (divineRank >= 6) {
            selectedRelics = selectedRelics.map(relic => ({
              ...relic,
              is_empowered: true,
              name: relic.name + '+',
              description: relic.empowered_description || relic.description + ' (EMPOWERED: Enhanced effects)'
            }));
            console.log('[RelicSelection] Divine Rank 6+: Relics empowered!');
          }
          
          setRelicChoices(selectedRelics);
        } catch (error) {
          console.error("Error fetching relics:", error);
          setRelicChoices([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRelics();
    }
  }, [open, playerRelics, currentGod, godTalents, divineRank]);

  const handleSkip = () => {
    // Pass null to indicate no relic was selected (skip)
    onRelicSelected(null);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl bg-gradient-to-br from-gray-900 via-gray-800 to-black border-amber-600 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl text-yellow-400 flex items-center gap-2">
            Victory!
            {divineRank >= 6 && (
              <span className="text-lg text-purple-400 animate-pulse">⚡ EMPOWERED ⚡</span>
            )}
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-300">
            {divineRank >= 6 
              ? '🌟 Divine Rank 6+: Your relics are empowered with celestial might!'
              : 'Your power grows. Choose a divine relic to aid you.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-12 h-12 animate-spin text-amber-400" />
            </div>
          ) : relicChoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-6 text-lg">No new relics available - you've collected them all!</p>
              <Button
                onClick={handleSkip}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold"
              >
                Continue Without Relic
              </Button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                {relicChoices.map((relic, index) => {
                  const Icon = iconMap[relic.icon_name] || iconMap.Gem;
                  const isEmpowered = relic.is_empowered;
                  
                  return (
                    <motion.div
                      key={relic.id}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 }}
                    >
                      <Card 
                        className={`relative overflow-hidden border-2 h-full flex flex-col p-6 text-center hover:bg-gray-900 cursor-pointer transition-all shadow-xl hover:scale-105 ${
                          isEmpowered 
                            ? 'bg-gradient-to-br from-purple-950/60 to-black border-purple-500 hover:border-purple-400' 
                            : 'bg-black border-amber-600 hover:border-amber-500'
                        }`}
                        onClick={() => onRelicSelected(relic)}
                        style={isEmpowered ? {
                          boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)'
                        } : {}}
                      >
                        {isEmpowered && (
                          <>
                            <motion.div
                              className="absolute inset-0 pointer-events-none"
                              animate={{
                                background: [
                                  'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.2), transparent 50%)',
                                  'radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.2), transparent 50%)',
                                  'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.2), transparent 50%)'
                                ]
                              }}
                              transition={{ duration: 3, repeat: Infinity }}
                            />
                            <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                              ⚡ EMPOWERED
                            </div>
                          </>
                        )}
                        
                        <div 
                          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${
                            isEmpowered 
                              ? 'bg-purple-500/30 border-purple-400' 
                              : 'bg-amber-500/20 border-amber-500'
                          }`}
                        >
                          <Icon className={`w-8 h-8 ${isEmpowered ? 'text-purple-300' : 'text-amber-400'}`} />
                        </div>
                        <h3 className={`text-xl font-bold mb-2 ${isEmpowered ? 'text-purple-300' : 'text-white'}`}>
                          {relic.name}
                        </h3>
                        <p className="text-sm text-gray-300 flex-grow">{relic.description}</p>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-6 text-center">
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  className="border-gray-500 text-gray-300 hover:bg-gray-800"
                >
                  Skip Relic
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Sparkles, Heart, TrendingUp, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CompanionBondModal({ open, onClose, companionIds = [], victories }) {
  const [companions, setCompanions] = useState([]);
  const [bondProgress, setBondProgress] = useState({});
  const [levelUps, setLevelUps] = useState([]);
  const [selectedBlessings, setSelectedBlessings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && companionIds.length > 0) {
      loadBondData();
    }
  }, [open, companionIds]);

  const loadBondData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      const config = await base44.entities.companions_config.list();
      const xpPerVictory = config[0]?.bond_xp_per_victory || 1;

      // Load companion data
      const companionData = await Promise.all(
        companionIds.map(id => base44.entities.Companion.get(id))
      );
      setCompanions(companionData);

      // Calculate bond progress
      const progress = {};
      const levelsGained = [];

      companionData.forEach(companion => {
        const currentXP = user.companion_bond_xp?.[companion.id] || 0;
        const currentLevel = user.companion_bond_levels?.[companion.id] || 0;
        const newXP = currentXP + xpPerVictory;

        // Check if level up occurred
        const bondLevels = companion.bond_levels || [];
        bondLevels.forEach(levelData => {
          if (currentLevel < levelData.level && newXP >= levelData.victories_required) {
            levelsGained.push({
              companionId: companion.id,
              companionName: companion.name,
              level: levelData.level,
              blessings: levelData.blessing_choices || []
            });
          }
        });

        progress[companion.id] = {
          oldXP: currentXP,
          newXP,
          oldLevel: currentLevel,
          nextLevel: bondLevels.find(l => l.level > currentLevel)
        };
      });

      setBondProgress(progress);
      setLevelUps(levelsGained);
    } catch (error) {
      console.error('Failed to load bond data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlessingSelect = (companionId, level, blessing) => {
    setSelectedBlessings({
      ...selectedBlessings,
      [`${companionId}_${level}`]: blessing
    });
  };

  const handleConfirm = async () => {
    try {
      const user = await base44.auth.me();
      const newBondXP = { ...user.companion_bond_xp };
      const newBondLevels = { ...user.companion_bond_levels };
      const newChosenBlessings = { ...user.companion_chosen_blessings };

      // Update XP and levels
      Object.keys(bondProgress).forEach(companionId => {
        newBondXP[companionId] = bondProgress[companionId].newXP;
      });

      levelUps.forEach(levelUp => {
        newBondLevels[levelUp.companionId] = levelUp.level;
        
        // Save chosen blessing
        const key = `${levelUp.companionId}_${levelUp.level}`;
        if (selectedBlessings[key]) {
          if (!newChosenBlessings[levelUp.companionId]) {
            newChosenBlessings[levelUp.companionId] = {};
          }
          newChosenBlessings[levelUp.companionId][levelUp.level] = selectedBlessings[key].name;
        }
      });

      await base44.auth.updateMe({
        companion_bond_xp: newBondXP,
        companion_bond_levels: newBondLevels,
        companion_chosen_blessings: newChosenBlessings
      });

      onClose();
    } catch (error) {
      console.error('Failed to save bond progress:', error);
    }
  };

  const allBlessingsSelected = levelUps.every(levelUp => {
    const key = `${levelUp.companionId}_${levelUp.level}`;
    return selectedBlessings[key] != null;
  });

  return (
    <Dialog open={open} onOpenChange={levelUps.length === 0 ? onClose : undefined}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-purple-950 to-black border-2 border-purple-500 text-white overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl text-center flex items-center justify-center gap-2">
            <Heart className="w-8 h-8 text-pink-400" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              Companion Bond
            </span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-gray-300">Strengthening bonds...</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* XP Gain Animation */}
            {companions.map(companion => {
              const progress = bondProgress[companion.id];
              if (!progress) return null;

              return (
                <motion.div
                  key={companion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-black/40 border-purple-600 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-purple-300">{companion.name}</div>
                      <div className="text-sm text-gray-400">
                        Level {progress.oldLevel}
                      </div>
                    </div>
                    <div className="relative w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                      <motion.div
                        initial={{ width: `${(progress.oldXP / (progress.nextLevel?.victories_required || 100)) * 100}%` }}
                        animate={{ width: `${(progress.newXP / (progress.nextLevel?.victories_required || 100)) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1 text-center">
                      {progress.newXP} / {progress.nextLevel?.victories_required || '∞'} XP
                      {progress.nextLevel && ` to Level ${progress.nextLevel.level}`}
                    </div>
                  </Card>
                </motion.div>
              );
            })}

            {/* Level Up & Blessing Selection */}
            {levelUps.length > 0 && (
              <div className="space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, type: 'spring' }}
                  className="text-center"
                >
                  <TrendingUp className="w-16 h-16 text-yellow-400 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-yellow-400">BOND LEVEL UP!</h3>
                </motion.div>

                {levelUps.map((levelUp, index) => (
                  <motion.div
                    key={`${levelUp.companionId}_${levelUp.level}`}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 + index * 0.3 }}
                  >
                    <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-2 border-yellow-500 p-6">
                      <div className="text-center mb-4">
                        <h4 className="text-xl font-bold text-yellow-400 mb-1">
                          {levelUp.companionName}
                        </h4>
                        <div className="flex items-center justify-center gap-2">
                          <Star className="w-5 h-5 text-yellow-400" />
                          <span className="text-lg text-white">Level {levelUp.level}</span>
                          <Star className="w-5 h-5 text-yellow-400" />
                        </div>
                      </div>

                      <p className="text-center text-purple-300 mb-4">
                        Choose a Divine Blessing:
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        {levelUp.blessings.map((blessing, bIndex) => {
                          const key = `${levelUp.companionId}_${levelUp.level}`;
                          const isSelected = selectedBlessings[key]?.name === blessing.name;

                          return (
                            <motion.div
                              key={bIndex}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Card
                                onClick={() => handleBlessingSelect(levelUp.companionId, levelUp.level, blessing)}
                                className={`p-4 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-2 border-yellow-400 bg-yellow-500/20'
                                    : 'border border-purple-600 hover:border-purple-400'
                                }`}
                              >
                                <h5 className="font-bold text-purple-300 mb-2">
                                  {blessing.name}
                                  {isSelected && <span className="ml-2 text-yellow-400">✓</span>}
                                </h5>
                                <p className="text-sm text-gray-300">{blessing.description}</p>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center gap-4 pt-4 border-t border-purple-700">
          {levelUps.length === 0 ? (
            <Button onClick={handleConfirm} className="bg-purple-600 hover:bg-purple-700">
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={!allBlessingsSelected}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
            >
              Confirm Blessings
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
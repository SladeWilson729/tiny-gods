
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Crown, Zap, Shield, Flame, Coins, Sparkles, ChevronRight } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import RankEmblemParticles from './RankEmblemParticles';
import RankEmblemGlow from './RankEmblemGlow';

const RANK_TIERS = {
  0: { name: 'Mortal', tier: 'Mortal', color: '#6b7280', glow: 'rgba(107, 114, 128, 0.3)' },
  1: { name: 'Ascendant I', tier: 'Ascendant', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
  2: { name: 'Ascendant II', tier: 'Ascendant', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
  3: { name: 'Ascendant III', tier: 'Ascendant', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
  4: { name: 'Demi-God I', tier: 'Demi-God', color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)' },
  5: { name: 'Demi-God II', tier: 'Demi-God', color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)' },
  6: { name: 'Demi-God III', tier: 'Demi-God', color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)' },
  7: { name: 'Divine I', tier: 'Divine', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
  8: { name: 'Divine II', tier: 'Divine', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
  9: { name: 'Divine III', tier: 'Divine', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
  10: { name: 'Eternal', tier: 'Eternal', color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.8)' },
};

const CATEGORY_ICONS = {
  enemy_buff: Shield,
  player_debuff: Flame,
  combat_dynamic: Zap,
  economy: Coins,
};

export default function AscensionSelectionScreen({ open, onConfirm, onCancel, selectedGod, playerData }) {
  const [selectedRank, setSelectedRank] = useState(0);
  const [availableModifiers, setAvailableModifiers] = useState([]);
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allRanks, setAllRanks] = useState([]);

  useEffect(() => {
    if (open) {
      loadRanksAndModifiers();
    }
  }, [open]);

  const loadRanksAndModifiers = async () => {
    setIsLoading(true);
    try {
      // Load all divine ranks
      const ranks = await base44.entities.DivineRank.list();
      setAllRanks(ranks);

      // Load all modifiers
      const modifiers = await base44.entities.DivineModifier.list();
      setAvailableModifiers(modifiers);

      // Set default rank based on player's highest completed
      const playerRank = playerData?.highest_rank_completed || -1; // Start at -1 so Rank 0 is unlocked by default
      setSelectedRank(Math.min(playerRank + 1, 0)); // Start at rank 0 by default, or next unlocked if applicable
    } catch (error) {
      console.error('Failed to load ascension data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectRandomModifiers = (rank) => {
    if (rank === 0) {
      setSelectedModifiers([]);
      return;
    }

    const rankData = RANK_TIERS[rank] || RANK_TIERS[10];
    const modifierCount = rankData.tier === 'Mortal' ? 0 : 2;

    // Filter modifiers valid for this rank
    const validModifiers = availableModifiers.filter(m => 
      (m.min_rank || 1) <= rank && 
      (!m.max_rank || m.max_rank >= rank)
    );

    // Weighted random selection
    const selected = [];
    const usedCategories = new Set();

    while (selected.length < modifierCount && validModifiers.length > 0) {
      // Calculate weights
      const weights = validModifiers.map(m => {
        // Reduce weight if category already used
        const baseWeight = m.weight || 1;
        return usedCategories.has(m.category) ? baseWeight * 0.3 : baseWeight;
      });

      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      let random = Math.random() * totalWeight;

      for (let i = 0; i < validModifiers.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          const modifier = validModifiers[i];
          selected.push(modifier);
          usedCategories.add(modifier.category);
          validModifiers.splice(i, 1);
          break;
        }
      }
    }

    setSelectedModifiers(selected);
  };

  const handleRankSelect = (rank) => {
    // FIXED: Proper unlock logic based on victories, not completed ranks
    const highestCompleted = playerData?.highest_rank_completed || -1;
    const totalVictories = playerData?.total_victories || 0;
    
    const rankInfo = allRanks.find(r => r.rank_number === rank);
    const minVictories = rankInfo?.min_victories_required || 0;

    // Determine the highest rank unlocked based on total victories
    let highestUnlockedRank = 0;
    if (totalVictories >= 40) highestUnlockedRank = 10;
    else if (totalVictories >= 30) highestUnlockedRank = 9;
    else if (totalVictories >= 25) highestUnlockedRank = 8;
    else if (totalVictories >= 20) highestUnlockedRank = 7;
    else if (totalVictories >= 16) highestUnlockedRank = 6;
    else if (totalVictories >= 12) highestUnlockedRank = 5;
    else if (totalVictories >= 8) highestUnlockedRank = 4;
    else if (totalVictories >= 5) highestUnlockedRank = 3;
    else if (totalVictories >= 3) highestUnlockedRank = 2;
    else if (totalVictories >= 1) highestUnlockedRank = 1;
    else highestUnlockedRank = 0;

    // Can select if rank is at or below the highest unlocked rank
    const canSelect = rank <= highestUnlockedRank;

    if (!canSelect) {
      console.log(`Rank ${rank} locked: need ${minVictories} victories, have ${totalVictories}`);
      return;
    }

    setSelectedRank(rank);
    selectRandomModifiers(rank);
  };

  const handleConfirm = () => {
    onConfirm({
      rank: selectedRank,
      modifiers: selectedModifiers,
      rankData: RANK_TIERS[selectedRank] || RANK_TIERS[0]
    });
  };

  const rankInfo = RANK_TIERS[selectedRank] || RANK_TIERS[0];
  const highestCompleted = playerData?.highest_rank_completed || -1; 
  const totalVictories = playerData?.total_victories || 0;

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-6xl max-h-[95vh] bg-gradient-to-br from-gray-900 via-purple-950 to-black border-2 border-amber-500 text-white overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-4xl text-center mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-300">
              ⚡ Divine Ascension ⚡
            </span>
          </DialogTitle>
          <p className="text-center text-gray-300 text-lg">
            Choose your challenge level and face divine trials
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Sparkles className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
              <p className="text-gray-400">Consulting the divine archives...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Rank Selection Grid */}
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Select Divine Rank
                <span className="text-sm text-gray-400 ml-2">
                  (Highest Completed: {highestCompleted >= 0 ? RANK_TIERS[highestCompleted]?.name : 'None'})
                </span>
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Object.keys(RANK_TIERS).map(rank => {
                  const rankNum = parseInt(rank);
                  const info = RANK_TIERS[rankNum];
                  
                  // FIXED: Proper unlock check based on victories
                  const totalVictories = playerData?.total_victories || 0;
                  
                  let highestUnlockedRank = 0;
                  if (totalVictories >= 40) highestUnlockedRank = 10;
                  else if (totalVictories >= 30) highestUnlockedRank = 9;
                  else if (totalVictories >= 25) highestUnlockedRank = 8;
                  else if (totalVictories >= 20) highestUnlockedRank = 7;
                  else if (totalVictories >= 16) highestUnlockedRank = 6;
                  else if (totalVictories >= 12) highestUnlockedRank = 5;
                  else if (totalVictories >= 8) highestUnlockedRank = 4;
                  else if (totalVictories >= 5) highestUnlockedRank = 3;
                  else if (totalVictories >= 3) highestUnlockedRank = 2;
                  else if (totalVictories >= 1) highestUnlockedRank = 1;
                  else highestUnlockedRank = 0;
                  
                  const canSelect = rankNum <= highestUnlockedRank;
                  const rankData = allRanks.find(r => r.rank_number === rankNum);

                  return (
                    <HoverCard key={rankNum} openDelay={200}>
                      <HoverCardTrigger asChild>
                        <motion.button
                          whileHover={canSelect ? { scale: 1.05 } : {}}
                          whileTap={canSelect ? { scale: 0.95 } : {}}
                          onClick={() => canSelect && handleRankSelect(rankNum)}
                          disabled={!canSelect}
                          className={`relative p-4 rounded-xl border-2 transition-all ${
                            selectedRank === rankNum
                              ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/50'
                              : canSelect
                              ? 'border-gray-600 bg-black/40 hover:border-amber-400/50'
                              : 'border-gray-800 bg-black/20 opacity-40 cursor-not-allowed'
                          }`}
                          style={{
                            boxShadow: selectedRank === rankNum ? `0 0 30px ${info.glow}` : ''
                          }}
                        >
                          <div className="text-center">
                            <div 
                              className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center font-bold text-xl"
                              style={{
                                background: canSelect ? `radial-gradient(circle, ${info.color}, ${info.color}dd)` : '#1f2937',
                                border: `3px solid ${canSelect ? info.color : '#374151'}`
                              }}
                            >
                              {rankNum}
                            </div>
                            <div className="text-xs font-bold" style={{ color: canSelect ? info.color : '#6b7280' }}>
                              {info.name}
                            </div>
                          </div>
                          {!canSelect && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                              <span className="text-xs text-red-400 font-bold">🔒</span>
                            </div>
                          )}
                        </motion.button>
                      </HoverCardTrigger>
                      <HoverCardContent className="bg-black/95 border-amber-600">
                        <div className="space-y-2">
                          <h4 className="font-bold text-amber-400">{info.name}</h4>
                          <p className="text-xs text-gray-300">{rankData?.description || 'Choose your divine challenge level'}</p>
                          {rankData && rankNum > 0 && (
                            <div className="text-xs space-y-1">
                              <div className="text-yellow-400">Rewards on Victory:</div>
                              <div className="text-gray-300">• {rankData.favor_reward || (rankNum * 10)} Favor Tokens</div>
                              <div className="text-cyan-400">• {rankData.essence_reward || (rankNum * 5)} Essence Crystals</div>
                            </div>
                          )}
                          {!canSelect && (
                            <div className="text-xs text-red-400 font-bold">
                              Requires {rankData?.min_victories_required || 0} total victories
                            </div>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </div>
            </div>

            {/* Selected Rank Display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/60 backdrop-blur-md rounded-2xl p-6 border-2 overflow-hidden"
              style={{
                borderColor: rankInfo.color,
                boxShadow: `0 0 40px ${rankInfo.glow}`
              }}
            >
              <div className="text-center mb-4">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <RankEmblemParticles 
                    rank={selectedRank} 
                    color={rankInfo.color}
                    size="lg"
                  />
                  <RankEmblemGlow
                    rank={selectedRank}
                    color={rankInfo.color}
                    glow={rankInfo.glow}
                    size="lg"
                  />
                </div>
                <h2 className="text-3xl font-bold mb-2" style={{ color: rankInfo.color }}>
                  {rankInfo.name}
                </h2>
                <p className="text-lg text-gray-400">{rankInfo.tier} Tier</p>
              </div>

              {/* Active Modifiers */}
              {selectedModifiers.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Active Modifiers ({selectedModifiers.length})
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {selectedModifiers.map((mod, idx) => {
                      const Icon = CATEGORY_ICONS[mod.category] || Sparkles;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-black/40 border rounded-lg p-3"
                          style={{ borderColor: mod.color || '#ef4444' }}
                        >
                          <div className="flex items-start gap-2">
                            <Icon className="w-5 h-5 flex-shrink-0" style={{ color: mod.color || '#ef4444' }} />
                            <div>
                              <h4 className="font-bold text-sm" style={{ color: mod.color || '#ef4444' }}>
                                {mod.name}
                              </h4>
                              <p className="text-xs text-gray-400 mt-1">{mod.description}</p>
                              <p className="text-xs text-purple-400 mt-1 capitalize">
                                {mod.category.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedRank === 0 && (
                <div className="text-center text-gray-400 py-6">
                  <p className="text-lg">Standard Mode - No modifiers active</p>
                  <p className="text-sm mt-2">Complete your first run to unlock Divine Ranks</p>
                </div>
              )}
            </motion.div>

            {/* Rewards Preview */}
            {selectedRank > 0 && (
              <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-600 rounded-xl p-4">
                <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  Victory Rewards
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center mb-4">
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {(selectedRank * 10) || 0}
                    </div>
                    <div className="text-sm text-gray-300">Favor Tokens</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-cyan-400">
                      {(selectedRank * 5) || 0}
                    </div>
                    <div className="text-sm text-gray-300">Essence Crystals</div>
                  </div>
                </div>
                
                {/* Pantheon Blessing Info */}
                <div className="bg-black/40 rounded-lg p-3 border border-yellow-600/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-bold text-yellow-400">Pantheon Blessing</span>
                  </div>
                  <p className="text-xs text-gray-300">
                    Remove one active modifier during your run (once per run)
                  </p>
                </div>
                
                {selectedRank >= 6 && (
                  <div className="bg-purple-900/40 rounded-lg p-3 border border-purple-600/30 mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-bold text-purple-400">Relic Empowerment</span>
                    </div>
                    <p className="text-xs text-gray-300">
                      All relics are empowered with enhanced effects (+50% power)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-4 border-t border-gray-700">
              <Button
                onClick={onCancel}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-bold px-8"
                disabled={isLoading}
              >
                Begin Ascension Run
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

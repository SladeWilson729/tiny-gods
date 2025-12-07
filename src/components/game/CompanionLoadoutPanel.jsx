import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { 
  Sparkles, Lock, Heart, Shield, Zap, Coins, Skull, 
  Droplet, Flame, Eye, Snowflake, TreeDeciduous, Star
} from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

const ICON_MAP = {
  Flame,
  Eye,
  Zap,
  Shield,
  Sparkles,
  Heart,
  Skull,
  Coins,
  Droplet,
  Snowflake,
  TreeDeciduous,
};

const RARITY_COLORS = {
  common: { border: '#6b7280', glow: 'rgba(107, 114, 128, 0.3)', text: 'text-gray-400' },
  rare: { border: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', text: 'text-blue-400' },
  epic: { border: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)', text: 'text-purple-400' },
  legendary: { border: '#fbbf24', glow: 'rgba(251, 191, 36, 0.6)', text: 'text-yellow-400' },
};

export default function CompanionLoadoutPanel({ open, onClose, onLoadoutChanged }) {
  const [companions, setCompanions] = useState([]);
  const [unlockedCompanions, setUnlockedCompanions] = useState([]);
  const [equippedIds, setEquippedIds] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [secondSlotUnlocked, setSecondSlotUnlocked] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const allCompanions = await base44.entities.Companion.list();
      setCompanions(allCompanions);

      const unlocked = userData.unlocked_companions || [];
      const equipped = userData.equipped_companions || [];
      setUnlockedCompanions(unlocked);
      setEquippedIds(equipped);

      // Check if second slot is unlocked
      const config = await base44.entities.companions_config.list();
      const requiredRank = config[0]?.second_slot_unlock_rank || 5;
      setSecondSlotUnlocked((userData.highest_rank_completed || 0) >= requiredRank);
    } catch (error) {
      console.error('Failed to load companion data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isUnlocked = (companion) => {
    // Check unlock conditions
    if (companion.unlock_condition === 'tutorial_complete') {
      return true; // Always unlocked
    }
    if (companion.unlock_condition === 'favor_tokens_cost') {
      return unlockedCompanions.includes(companion.id);
    }
    if (companion.unlock_condition?.startsWith('divine_rank_')) {
      const requiredRank = parseInt(companion.unlock_condition.split('_')[2]);
      return (user?.highest_rank_completed || 0) >= requiredRank;
    }
    return unlockedCompanions.includes(companion.id);
  };

  const canEquip = (companion) => {
    if (!isUnlocked(companion)) return false;
    if (equippedIds.includes(companion.id)) return false;
    if (equippedIds.length >= 1 && !secondSlotUnlocked) return false;
    if (equippedIds.length >= 2) return false;
    return true;
  };

  const handleEquip = async (companion) => {
    if (!canEquip(companion)) return;

    const newEquipped = [...equippedIds, companion.id];
    setEquippedIds(newEquipped);

    try {
      await base44.auth.updateMe({
        equipped_companions: newEquipped
      });
      if (onLoadoutChanged) onLoadoutChanged(newEquipped);
    } catch (error) {
      console.error('Failed to equip companion:', error);
    }
  };

  const handleUnequip = async (companionId) => {
    const newEquipped = equippedIds.filter(id => id !== companionId);
    setEquippedIds(newEquipped);

    try {
      await base44.auth.updateMe({
        equipped_companions: newEquipped
      });
      if (onLoadoutChanged) onLoadoutChanged(newEquipped);
    } catch (error) {
      console.error('Failed to unequip companion:', error);
    }
  };

  const handlePurchase = async (companion) => {
    if (!user || (user.favor_tokens || 0) < companion.unlock_cost) return;

    try {
      await base44.auth.updateMe({
        favor_tokens: user.favor_tokens - companion.unlock_cost,
        unlocked_companions: [...unlockedCompanions, companion.id]
      });
      setUnlockedCompanions([...unlockedCompanions, companion.id]);
      setUser({ ...user, favor_tokens: user.favor_tokens - companion.unlock_cost });
    } catch (error) {
      console.error('Failed to purchase companion:', error);
    }
  };

  const equippedCompanions = companions.filter(c => equippedIds.includes(c.id));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-purple-950 to-black border-2 border-amber-500 text-white overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Divine Companions
            </span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-gray-300">Loading companions...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Equipped Companions Section */}
            <div>
              <h3 className="text-xl font-bold text-purple-400 mb-4">Active Companions</h3>
              <div className="grid grid-cols-2 gap-4">
                <CompanionSlot
                  companion={equippedCompanions[0]}
                  onUnequip={handleUnequip}
                  slotNumber={1}
                />
                <CompanionSlot
                  companion={equippedCompanions[1]}
                  onUnequip={handleUnequip}
                  slotNumber={2}
                  locked={!secondSlotUnlocked}
                  lockMessage={`Unlock at Divine Rank 5`}
                />
              </div>
            </div>

            {/* Available Companions */}
            <div>
              <h3 className="text-xl font-bold text-purple-400 mb-4">
                Available Companions ({companions.filter(c => isUnlocked(c)).length}/{companions.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {companions.map(companion => {
                  const unlocked = isUnlocked(companion);
                  const equipped = equippedIds.includes(companion.id);
                  const Icon = ICON_MAP[companion.icon_name] || Star;
                  const rarityStyle = RARITY_COLORS[companion.rarity] || RARITY_COLORS.common;

                  return (
                    <HoverCard key={companion.id}>
                      <HoverCardTrigger asChild>
                        <motion.div whileHover={unlocked ? { scale: 1.05 } : {}}>
                          <Card
                            className={`relative p-4 cursor-pointer transition-all ${
                              equipped
                                ? 'border-2 border-green-500 bg-green-500/10'
                                : unlocked
                                ? 'border-2 hover:border-purple-400'
                                : 'opacity-50'
                            }`}
                            style={{
                              borderColor: equipped ? '#22c55e' : unlocked ? rarityStyle.border : '#374151',
                              boxShadow: equipped ? '0 0 20px rgba(34, 197, 94, 0.4)' : unlocked ? `0 0 15px ${rarityStyle.glow}` : 'none'
                            }}
                            onClick={() => {
                              if (equipped) {
                                handleUnequip(companion.id);
                              } else if (canEquip(companion)) {
                                handleEquip(companion);
                              } else if (!unlocked && companion.unlock_condition === 'favor_tokens_cost') {
                                handlePurchase(companion);
                              }
                            }}
                          >
                            <div className="flex flex-col items-center">
                              <Icon className={`w-12 h-12 mb-2 ${unlocked ? rarityStyle.text : 'text-gray-600'}`} />
                              <div className={`text-sm font-bold text-center ${unlocked ? 'text-white' : 'text-gray-500'}`}>
                                {companion.name}
                              </div>
                              {equipped && (
                                <div className="text-xs text-green-400 mt-1">✓ Equipped</div>
                              )}
                              {!unlocked && companion.unlock_condition === 'favor_tokens_cost' && (
                                <div className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                                  <Coins className="w-3 h-3" />
                                  {companion.unlock_cost}
                                </div>
                              )}
                              {!unlocked && companion.unlock_condition !== 'favor_tokens_cost' && (
                                <Lock className="w-4 h-4 text-red-400 mt-1" />
                              )}
                            </div>
                          </Card>
                        </motion.div>
                      </HoverCardTrigger>
                      <HoverCardContent className="bg-black/95 border-purple-600 w-80">
                        <div className="space-y-2">
                          <h4 className={`font-bold ${rarityStyle.text}`}>{companion.name}</h4>
                          <p className="text-sm text-gray-300">{companion.description}</p>
                          <div className="text-xs text-purple-400 capitalize">
                            {companion.archetype} • {companion.rarity}
                          </div>
                          <div className="bg-purple-900/40 rounded p-2 text-xs">
                            <div className="text-purple-300 font-bold mb-1">Base Effect:</div>
                            <div className="text-gray-300">{companion.base_effect.effect_type}</div>
                          </div>
                          {!unlocked && (
                            <div className="text-xs text-red-400">
                              {companion.unlock_condition === 'favor_tokens_cost' 
                                ? `Cost: ${companion.unlock_cost} Favor Tokens` 
                                : `Unlock: ${companion.unlock_condition}`}
                            </div>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center pt-4 border-t border-purple-700">
          <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompanionSlot({ companion, onUnequip, slotNumber, locked, lockMessage }) {
  if (locked) {
    return (
      <Card className="bg-black/40 border-2 border-gray-700 p-6 text-center">
        <Lock className="w-12 h-12 text-gray-500 mx-auto mb-2" />
        <div className="text-sm text-gray-500">Slot {slotNumber}</div>
        <div className="text-xs text-gray-600 mt-1">{lockMessage}</div>
      </Card>
    );
  }

  if (!companion) {
    return (
      <Card className="bg-black/40 border-2 border-dashed border-gray-700 p-6 text-center">
        <div className="text-gray-500 text-4xl mb-2">+</div>
        <div className="text-sm text-gray-500">Empty Slot {slotNumber}</div>
      </Card>
    );
  }

  const Icon = ICON_MAP[companion.icon_name] || Star;
  const rarityStyle = RARITY_COLORS[companion.rarity] || RARITY_COLORS.common;

  return (
    <Card
      className="border-2 p-6 relative"
      style={{
        borderColor: rarityStyle.border,
        background: `linear-gradient(to br, ${rarityStyle.border}20, ${rarityStyle.border}05)`,
        boxShadow: `0 0 20px ${rarityStyle.glow}`
      }}
    >
      <Button
        onClick={() => onUnequip(companion.id)}
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 text-red-400 hover:text-red-300"
      >
        ✕
      </Button>
      <div className="flex flex-col items-center">
        <Icon className={`w-16 h-16 mb-3 ${rarityStyle.text}`} />
        <div className="text-lg font-bold text-white text-center">{companion.name}</div>
        <div className={`text-xs ${rarityStyle.text} mt-1 capitalize`}>
          {companion.archetype} • {companion.rarity}
        </div>
        <div className="text-xs text-gray-400 mt-2 text-center">
          {companion.description.slice(0, 60)}...
        </div>
      </div>
    </Card>
  );
}
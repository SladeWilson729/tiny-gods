
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Lock, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const isVideo = (url) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.mov');
};

export default function GodCard({ god, onSelect, isSelected, isLocked = false }) {
  const [equippedArt, setEquippedArt] = useState(null);

  useEffect(() => {
    const loadEquippedCosmetic = async () => {
      try {
        const user = await base44.auth.me();
        const equipped = user.equipped_cosmetics || {};
        const godArts = equipped.god_art;
        
        if (godArts) {
          let artIdForThisGod = null;
          
          // Check if it's the new object format or old string format
          if (typeof godArts === 'object' && !Array.isArray(godArts)) {
            // New format: { "Zeus": "art_id", "Thor": "art_id" }
            artIdForThisGod = godArts[god.name] || godArts[god.id];
          } else if (typeof godArts === 'string') {
            // Old format: single ID - check if it matches this god
            // We need to fetch the cosmetic first to check its target
            const cosmetic = await base44.entities.CosmeticReward.get(godArts);
            if (cosmetic && (cosmetic.target_id === god.id || cosmetic.target_name === god.name)) {
              artIdForThisGod = godArts;
            }
          }
          
          if (artIdForThisGod) {
            const cosmetic = await base44.entities.CosmeticReward.get(artIdForThisGod);
            if (cosmetic) {
              setEquippedArt(cosmetic.asset_url);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load equipped cosmetic:', error);
      }
    };

    loadEquippedCosmetic();
  }, [god.id, god.name]);

  const getLockMessage = () => {
    if (god.name === 'Susanoo') {
      return (
        <>
          Complete 10 runs with<br/>all other gods to unlock
        </>
      );
    }
    if (god.name === 'The Morrígan') {
      return (
        <>
          Complete 20 runs with<br/>all gods (including Susanoo)
        </>
      );
    }
    if (god.name === 'Lucifer') {
      return (
        <>
          Complete 15 runs with<br/>all base gods to unlock
        </>
      );
    }
    return (
      <>
        Complete unlock<br/>requirements
      </>
    );
  };

  const displayImage = equippedArt || god.image;

  return (
    <motion.div
      whileHover={!isLocked ? { scale: 1.05, y: -10 } : {}}
      whileTap={!isLocked ? { scale: 0.95 } : {}}
      onClick={!isLocked ? onSelect : undefined}
    >
      <Card className={`relative overflow-hidden cursor-pointer transition-all duration-300 rounded-2xl aspect-[3/4] ${
        isLocked 
          ? 'opacity-60 cursor-not-allowed' 
          : isSelected 
            ? 'ring-4 ring-yellow-400 shadow-2xl' 
            : 'hover:shadow-xl'
      }`}>
        {isVideo(displayImage) ? (
          <video 
            src={displayImage} 
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img src={displayImage} alt={god.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        
        {equippedArt && !isLocked && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-lg">
            <Sparkles className="w-3 h-3" />
            Custom
          </div>
        )}
        
        {isLocked && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
            <div className="text-center p-4">
              <Lock className="w-16 h-16 text-red-400 mx-auto mb-3" />
              <div className="text-white font-bold text-lg mb-2">LOCKED</div>
              <div className="text-gray-300 text-sm">
                {getLockMessage()}
              </div>
            </div>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        
        <div className="relative p-6 text-white h-full flex flex-col justify-end">
          <h3 className="text-3xl font-bold mb-2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">{god.name}</h3>
          <p className="text-sm text-center opacity-90 mb-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">{god.description}</p>
          
          <div className="w-full space-y-2 text-xs backdrop-blur-md bg-black/60 p-3 rounded-lg border border-white/20 shadow-lg">
            <div className="flex justify-between">
              <span className="font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">Starting HP:</span>
              <span className="font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">{god.baseHealth}</span>
            </div>
            <div className="border-t border-white/20 pt-2">
              <div className="text-yellow-300 font-bold mb-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">⚡ Static Ability:</div>
              <div className="text-[10px] leading-tight italic drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                {god.static_ability || "No ability defined"}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

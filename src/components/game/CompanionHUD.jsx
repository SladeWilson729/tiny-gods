import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Heart, Shield, Zap, Coins, Skull, 
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
  common: { border: '#6b7280', glow: 'rgba(107, 114, 128, 0.3)' },
  rare: { border: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
  epic: { border: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)' },
  legendary: { border: '#fbbf24', glow: 'rgba(251, 191, 36, 0.6)' },
};

// Memoize to prevent unnecessary re-renders
export default React.memo(function CompanionHUD({ companions = [], readyStates = {} }) {
  if (!companions || companions.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex gap-3">
      {companions.map((companion, index) => {
        const Icon = ICON_MAP[companion.icon_name] || Star;
        const rarityStyle = RARITY_COLORS[companion.rarity] || RARITY_COLORS.common;
        const isReady = readyStates[companion.id] || false;

        return (
          <HoverCard key={companion.id}>
            <HoverCardTrigger asChild>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center border-2 backdrop-blur-md cursor-help transition-all"
                  style={{
                    borderColor: rarityStyle.border,
                    background: `radial-gradient(circle, ${rarityStyle.border}40, ${rarityStyle.border}10)`,
                    boxShadow: isReady ? `0 0 20px ${rarityStyle.glow}, 0 0 40px ${rarityStyle.glow}` : `0 0 10px ${rarityStyle.glow}`
                  }}
                >
                  <Icon 
                    className="w-8 h-8 text-white" 
                    style={{ 
                      filter: isReady ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))' : 'none' 
                    }}
                  />
                </div>

                {/* Ready indicator */}
                {isReady && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white"
                  />
                )}

                {/* Pulse animation when ready */}
                {isReady && (
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: `2px solid ${rarityStyle.border}`,
                      background: 'transparent'
                    }}
                  />
                )}
              </motion.div>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="bg-black/95 border-purple-600 w-80">
              <div className="space-y-2">
                <h4 className="font-bold text-purple-400">{companion.name}</h4>
                <p className="text-sm text-gray-300">{companion.description}</p>
                <div className="bg-purple-900/40 rounded p-2 text-xs">
                  <div className="text-purple-300 font-bold mb-1">Active Effect:</div>
                  <div className="text-gray-300">
                    Trigger: {companion.base_effect.trigger_type.replace(/_/g, ' ')}
                  </div>
                </div>
                {isReady && (
                  <div className="text-xs text-yellow-400 font-bold text-center">
                    ⚡ READY TO TRIGGER ⚡
                  </div>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
});
import React, { useState } from 'react';
import { Shield, Flame, Zap, Coins, Sparkles, ChevronDown, Crown } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_ICONS = {
  enemy_buff: Shield,
  player_debuff: Flame,
  combat_dynamic: Zap,
  economy: Coins,
};

const CATEGORY_COLORS = {
  enemy_buff: '#ef4444',
  player_debuff: '#3b82f6',
  combat_dynamic: '#fbbf24',
  economy: '#10b981',
};

// Memoize to prevent unnecessary re-renders
export default React.memo(function ModifierHUD({ 
  modifiers = [], 
  divineRank = 0, 
  rankData = null, 
  blessingAvailable = false,
  onBlessingClick 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!modifiers || modifiers.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-40">
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-black/80 backdrop-blur-md rounded-xl border-2 p-3 shadow-2xl"
        style={{
          borderColor: rankData?.color || '#fbbf24',
          boxShadow: `0 0 20px ${rankData?.glow || 'rgba(251, 191, 36, 0.5)'}`
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center gap-2 cursor-pointer mb-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
            style={{
              background: `radial-gradient(circle, ${rankData?.color || '#fbbf24'}, ${rankData?.color}aa)`,
              border: `2px solid ${rankData?.color || '#fbbf24'}`
            }}
          >
            {divineRank}
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold" style={{ color: rankData?.color || '#fbbf24' }}>
              {rankData?.name || 'Ascension'}
            </div>
            <div className="text-[10px] text-gray-400">{modifiers.length} Modifiers</div>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>

        {/* Pantheon Blessing Button */}
        {blessingAvailable && modifiers.length > 0 && (
          <Button
            onClick={onBlessingClick}
            size="sm"
            className="w-full mb-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white text-xs"
          >
            <Crown className="w-3 h-3 mr-1" />
            Pantheon Blessing
          </Button>
        )}

        {/* Modifier Icons */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden"
            >
              {modifiers.map((mod, idx) => {
                const Icon = CATEGORY_ICONS[mod.category] || Sparkles;
                const color = CATEGORY_COLORS[mod.category] || '#fbbf24';

                return (
                  <HoverCard key={idx} openDelay={100}>
                    <HoverCardTrigger asChild>
                      <div 
                        className="flex items-center gap-2 p-2 rounded-lg border cursor-help transition-all hover:bg-white/5"
                        style={{ borderColor: color }}
                      >
                        <Icon className="w-4 h-4" style={{ color }} />
                        <span className="text-xs flex-1 text-gray-300">{mod.name}</span>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent 
                      side="left" 
                      className="bg-black/95 border-amber-600 w-80"
                    >
                      <div className="space-y-2">
                        <h4 className="font-bold text-amber-400 flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color }} />
                          {mod.name}
                        </h4>
                        <p className="text-sm text-gray-300">{mod.description}</p>
                        <div className="text-xs text-purple-400 capitalize pt-2 border-t border-gray-700">
                          Category: {mod.category.replace('_', ' ')}
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
});
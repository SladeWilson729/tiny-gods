import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Sparkles, Shield, Flame, Zap, Coins, Crown } from 'lucide-react';

const CATEGORY_ICONS = {
  enemy_buff: Shield,
  player_debuff: Flame,
  combat_dynamic: Zap,
  economy: Coins,
};

export default function PantheonBlessingModal({ open, modifiers = [], onModifierRemoved, onCancel }) {
  const handleRemove = (modifier) => {
    onModifierRemoved(modifier);
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl bg-gradient-to-br from-gray-900 via-purple-950 to-black border-2 border-yellow-500 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl text-center flex items-center justify-center gap-3">
            <Crown className="w-8 h-8 text-yellow-400" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-300">
              Pantheon Blessing
            </span>
            <Crown className="w-8 h-8 text-yellow-400" />
          </DialogTitle>
          <DialogDescription className="text-center text-lg text-gray-300">
            The gods offer their grace. Choose one divine modifier to remove from your trials.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {modifiers.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <p className="text-xl text-gray-300 mb-2">No Active Modifiers</p>
              <p className="text-sm text-gray-400">You are running at Rank 0 with no challenges active.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-yellow-300 font-semibold mb-6">
                Select a modifier to permanently remove for the remainder of this run
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {modifiers.map((mod, idx) => {
                  const Icon = CATEGORY_ICONS[mod.category] || Sparkles;
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card
                        onClick={() => handleRemove(mod)}
                        className="bg-black/60 border-2 p-4 cursor-pointer hover:bg-black/80 transition-all hover:scale-105"
                        style={{ 
                          borderColor: mod.color || '#ef4444',
                          boxShadow: `0 0 20px ${mod.color}40`
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="w-6 h-6 flex-shrink-0" style={{ color: mod.color || '#ef4444' }} />
                          <div className="flex-1">
                            <h4 className="font-bold text-lg mb-1" style={{ color: mod.color || '#ef4444' }}>
                              {mod.name}
                            </h4>
                            <p className="text-sm text-gray-300 mb-2">{mod.description}</p>
                            <p className="text-xs text-purple-400 capitalize">
                              {mod.category.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4 pt-4 border-t border-gray-700">
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
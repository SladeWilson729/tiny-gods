import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import BattleCard from './BattleCard';
import { motion } from 'framer-motion';

export default function CardPeekModal({ open, onCardSelected, cardChoices, godImage }) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl bg-gradient-to-br from-indigo-950 via-purple-950 to-black border-purple-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl text-blue-400">Allfather's Wisdom</DialogTitle>
          <DialogDescription className="text-lg">
            Glimpse the future. Choose one card to add to your opening hand.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="flex justify-center gap-6">
            {cardChoices.map((card, index) => (
              <motion.div
                key={card.name + index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                onClick={() => onCardSelected(card, index)}
              >
                <BattleCard 
                  card={card}
                  onPlay={() => {}}
                  disabled={false}
                  index={index}
                  godImage={godImage}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
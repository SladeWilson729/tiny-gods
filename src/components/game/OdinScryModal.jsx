import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import BattleCard from './BattleCard';
import { Eye, ArrowDown, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OdinScryModal({ open, onChoice, topCard, godImage }) {
  if (!open || !topCard) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-indigo-950 via-blue-950 to-black border-blue-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl text-blue-400 flex items-center gap-2">
            <Eye className="w-8 h-8" />
            All-Father's Sight
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-300">
            Odin peers into the threads of fate. The next card is revealed...
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.5 }}
            >
              <BattleCard 
                card={topCard}
                onPlay={() => {}}
                disabled={true}
                index={0}
                godImage={godImage}
              />
            </motion.div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => onChoice('top')}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-lg px-8 py-6"
            >
              <ArrowUp className="w-5 h-5 mr-2" />
              Keep on Top
            </Button>
            <Button
              onClick={() => onChoice('bottom')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg px-8 py-6"
            >
              <ArrowDown className="w-5 h-5 mr-2" />
              Send to Bottom
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
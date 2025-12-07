
import React from 'react';
import { ShieldCheck, HeartPulse, BookOpen, Zap, BrainCircuit, Trophy, ShoppingBag, Gem } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { AnimatePresence, motion } from 'framer-motion';

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

export default function RelicDisplay({ relics }) {
  return (
    <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700/50 mt-4">
      <CardHeader className="p-4">
        <CardTitle className="text-md text-white">Collected Relics</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {relics.length === 0 ? (
          <p className="text-sm text-gray-400">None yet. Win battles to earn relics.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            <AnimatePresence>
              {relics.map((relic, index) => {
                const Icon = iconMap[relic.icon_name] || iconMap.Gem;
                return (
                  <motion.div
                    key={relic.id || index}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <HoverCard>
                      <HoverCardTrigger>
                        <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center border-2 border-purple-500 cursor-pointer">
                          <Icon className="w-5 h-5 text-purple-300" />
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="bg-black border-purple-700 text-white">
                        <h4 className="font-bold text-purple-300">{relic.name}</h4>
                        <p className="text-sm text-gray-200">{relic.description}</p>
                      </HoverCardContent>
                    </HoverCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skull, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BossAbilitiesPanel({ boss }) {
  if (!boss || !boss.special_abilities || boss.special_abilities.length === 0) {
    return null;
  }

  const isVideo = (url) => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm') || url.toLowerCase().endsWith('.mov');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="bg-gradient-to-br from-purple-900/40 to-red-900/40 border-2 border-purple-500 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl flex items-center gap-2 text-purple-300">
            <Skull className="w-6 h-6" />
            Boss Abilities: {boss.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4 mb-4">
            {boss.image && (
              <div className="w-20 h-20 rounded-lg border-2 border-purple-500 overflow-hidden flex-shrink-0">
                {isVideo(boss.image) ? (
                  <video
                    src={boss.image}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img src={boss.image} alt={boss.name} className="w-full h-full object-cover" />
                )}
              </div>
            )}
            <p className="text-purple-200 text-sm italic flex-1">{boss.description}</p>
          </div>

          <div className="space-y-2">
            {boss.special_abilities.map((ability, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-black/40 border border-purple-400 rounded-lg p-2 hover:bg-purple-900/30 transition-colors"
              >
                <div className="flex items-start gap-2 mb-1">
                  <Zap className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
                  <h4 className="font-bold text-purple-200 text-xs leading-tight">{ability.name}</h4>
                </div>
                <p className="text-[10px] text-purple-300 leading-relaxed ml-5">
                  {ability.description}
                </p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

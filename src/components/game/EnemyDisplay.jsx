import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skull, Swords, Shield, Flame } from 'lucide-react';

// Memoize to prevent unnecessary re-renders
const EnemyDisplay = React.memo(function EnemyDisplay({ enemy, damageAnimation }) {
  const healthPercent = (enemy.health / enemy.maxHealth) * 100;

  const isVideo = (url) => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm') || url.toLowerCase().endsWith('.mov');
  };
  
  return (
    <div className={`transition-transform ${damageAnimation ? 'animate-shake' : ''}`}>
      <Card className={`${enemy.isBoss ? 'bg-gradient-to-br from-purple-900 to-black border-purple-500 shadow-2xl' : 'bg-gradient-to-br from-red-900 to-black border-red-500/50'} p-2 md:p-6 w-full max-w-sm`}>
        <div className="flex flex-col items-center">
          {enemy.isBoss && (
            <div className="mb-2 bg-purple-600 text-white font-bold px-4 py-1 rounded-full text-sm animate-pulse">
              ⚔️ BOSS ⚔️
            </div>
          )}
          
          <motion.div 
            className={`w-20 h-20 md:w-32 md:h-32 ${enemy.isBoss ? 'bg-purple-500/20' : 'bg-red-500/20'} rounded-full flex items-center justify-center mb-2 md:mb-4 backdrop-blur-sm overflow-hidden`}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {enemy.image ? (
              isVideo(enemy.image) ? (
                <video 
                  src={enemy.image} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                />
              ) : (
                <img src={enemy.image} alt={enemy.name} className="w-full h-full object-cover" />
              )
            ) : (
              <Skull className={`w-10 h-10 md:w-16 md:h-16 ${enemy.isBoss ? 'text-purple-400' : 'text-red-400'}`} />
            )}
          </motion.div>
          
          <h3 className={`text-lg md:text-2xl font-bold text-white mb-1 md:mb-2 ${enemy.isBoss ? 'text-purple-200' : ''}`}>
            {enemy.name}
          </h3>
          
          <p className="text-xs md:text-sm text-red-200 mb-2 md:mb-4 text-center">{enemy.description}</p>
          
          <div className="w-full space-y-2 md:space-y-3">
            <div>
              <div className="flex justify-between text-white text-xs md:text-sm mb-1">
                <span className="font-semibold">Health</span>
                <span className="font-bold">{enemy.health}/{enemy.maxHealth}</span>
              </div>
              <Progress value={healthPercent} className="h-2 md:h-3 bg-black/50" />
            </div>
            
            {enemy.shield > 0 && (
              <div className="flex items-center justify-between text-white bg-blue-900/30 px-2 py-1 rounded">
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
                  <span className="text-xs md:text-sm font-semibold">Shield</span>
                </div>
                <span className="font-bold">{enemy.shield}</span>
              </div>
            )}

            {enemy.poisonStacks > 0 && (
              <div className="flex items-center justify-between text-white bg-green-900/30 p-2 rounded border border-green-500">
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm font-bold text-green-300">☠ Poisoned</span>
                </div>
                <span className="font-bold text-green-300">{enemy.poisonStacks * 2} dmg/turn</span>
              </div>
            )}

            {enemy.burnStacks > 0 && (
              <motion.div
                className="flex items-center justify-between text-white bg-orange-900/30 p-2 rounded border border-orange-500"
                animate={{
                  boxShadow: [
                    '0 0 10px rgba(249, 115, 22, 0.5)',
                    '0 0 20px rgba(249, 115, 22, 0.8)',
                    '0 0 10px rgba(249, 115, 22, 0.5)',
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                  <span className="text-xs md:text-sm font-bold text-orange-300">🔥 Burning</span>
                </div>
                <span className="font-bold text-orange-300">{enemy.burnStacks} dmg/turn</span>
              </motion.div>
            )}

            {enemy.isVulnerable && (
              <div className="flex items-center justify-center text-white bg-orange-900/30 p-2 rounded border border-orange-500">
                <span className="text-xs md:text-sm font-bold text-orange-300">⚠ Vulnerable (+50% dmg)</span>
              </div>
            )}

            {enemy.isStunned && (
              <div className="flex items-center justify-center text-white bg-yellow-900/30 p-2 rounded border border-yellow-500">
                <span className="text-xs md:text-sm font-bold text-yellow-300">💫 Stunned (-50% dmg next turn)</span>
              </div>
            )}

            {enemy.confusedStacks > 0 && (
              <div className="flex items-center justify-between text-white bg-purple-900/30 p-2 rounded border border-purple-500">
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm font-bold text-purple-300">🌀 Confused</span>
                </div>
                <span className="font-bold text-purple-300">{enemy.confusedStacks} stack{enemy.confusedStacks !== 1 ? 's' : ''} (50% skip)</span>
              </div>
            )}

            {enemy.startOfTurnDamage > 0 && (
              <div className="flex items-center justify-between text-white bg-red-900/30 p-2 rounded border border-red-500">
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm font-bold text-red-300">🔥 Start-of-Turn Damage</span>
                </div>
                <span className="font-bold text-red-300">{enemy.startOfTurnDamage} dmg/turn</span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-white bg-red-900/30 px-2 py-1 rounded">
              <div className="flex items-center gap-2">
                <Swords className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
                <span className="text-xs md:text-sm font-semibold">Next Attack</span>
              </div>
              <span className="font-bold text-red-400">
                {enemy.nextAttack}
                {enemy.affixes?.some(a => a.effect === 'swift') ? ' x2' : ''}
                {enemy.affixes?.some(a => a.effect === 'legendary_swift') ? ' x3' : ''}
              </span>
            </div>

            {enemy.affixes && enemy.affixes.length > 0 && (
              <div className="space-y-1 w-full">
                {enemy.affixes.map((affix, index) => {
                  const isFrostAura = affix.effect === 'frost_aura';
                  const isVengefulStrike = affix.effect === 'vengeful_strike';
                  const isVenomSpiral = affix.effect === 'venom_spiral';
                  
                  return (
                    <div 
                      key={index} 
                      className={`${
                        isFrostAura ? 'bg-cyan-900/50 border-cyan-500' : 
                        isVengefulStrike ? 'bg-red-900/50 border-red-500' :
                        isVenomSpiral ? 'bg-green-900/50 border-green-500' :
                        'bg-purple-900/50 border-purple-500'
                      } border rounded px-2 py-1`}
                    >
                      <p className={`text-xs md:text-sm font-bold ${
                        isFrostAura ? 'text-cyan-300' : 
                        isVengefulStrike ? 'text-red-300' :
                        isVenomSpiral ? 'text-green-300' :
                        'text-purple-300'
                      }`}>
                        {isFrostAura ? '❄️' : isVengefulStrike ? '⚡' : isVenomSpiral ? '🐍' : '🔥'} {affix.name}
                      </p>
                      <p className={`text-[10px] md:text-xs ${
                        isFrostAura ? 'text-cyan-200' : 
                        isVengefulStrike ? 'text-red-200' :
                        isVenomSpiral ? 'text-green-200' :
                        'text-purple-200'
                      }`}>
                        {affix.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
  });

  export default EnemyDisplay;
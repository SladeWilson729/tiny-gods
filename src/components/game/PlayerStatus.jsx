
import React from 'react';
import { Card, CardContent } from '@/components/ui/card'; // Added CardContent
import { Heart, Shield, Zap, Sparkles, Skull, UserIcon } from 'lucide-react'; // Added UserIcon
import { Button } from '@/components/ui/button';
import { ShieldCheck, HeartPulse, BookOpen, BrainCircuit, Trophy, ShoppingBag, Gem } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

// Memoize to prevent unnecessary re-renders
export default React.memo(function PlayerStatus({
  health,
  maxHealth,
  shield,
  energy,
  maxEnergy,
  burnStacks = 0,
  poisonStacks = 0,
  weakStacks = 0,
  god,
  godImage, // Changed to accept godImage prop instead of using god.image directly
  godTalents,
  godState,
  odinRunesUsedThisBattle,
  onUseOdinRunes,
  necromancyStacks,
  damageReflection,
  relics = [],
  susanooWrathStacks = 0,
  anubisEternalBalanceStacks = 0 // Added anubisEternalBalanceStacks as a prop
}) {
  const healthPercent = (health / maxHealth) * 100;
  const energyPercent = (energy / maxEnergy) * 100;

  // The Anubis Eternal Balance bonus calculation is removed as it's now passed as a prop.

  const hasRunesOfPower = god?.name === 'Odin' && godTalents?.tier1 === 'runes_of_power';
  const maxRunesUses = godTalents?.tier2 === 'greater_runes' ? 2 : 1;
  const runesRemaining = maxRunesUses - (odinRunesUsedThisBattle || 0);
  const energyGain = godTalents?.tier3 === 'supreme_runes' ? 3 : 2;
  const canUseRunes = hasRunesOfPower && runesRemaining > 0 && health > 1;

  // The internal godImage and godName derivation is removed as godImage is a prop and god.name is used directly.

  return (
    <Card className="bg-gradient-to-br from-purple-900/40 via-black/60 to-black/80 backdrop-blur-md border-2 border-purple-700 shadow-2xl">
      <CardContent className="p-4">
        {/* God Header */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-purple-700">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500 bg-black/40 flex-shrink-0">
            {godImage ? (
              <img src={godImage} alt={god?.name || 'God'} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-purple-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">{god?.name || 'Unknown'}</h3>
            <p className="text-xs text-purple-300">Champion</p>
          </div>
        </div>

        {/* Odin Runes of Power Button (Talent Ability) */}
        {hasRunesOfPower && (
          <div className="mb-3">
            <Button
              onClick={onUseOdinRunes}
              disabled={!canUseRunes}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm py-2"
            >
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              Runes of Power ({runesRemaining}/{maxRunesUses})
              <span className="ml-2 text-xs">-1 HP, +{energyGain} Energy</span>
            </Button>
          </div>
        )}

        <div className="space-y-2 md:space-y-3">
          <div>
            <div className="flex justify-between text-white text-xs md:text-sm mb-1">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
                <span className="font-semibold">Health</span>
              </div>
              <span className="font-bold">{health}/{maxHealth}</span>
            </div>
            <div className="h-2 md:h-3 bg-black rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                style={{ width: `${healthPercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-white text-xs md:text-sm mb-1">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
                <span className="font-semibold">Shield</span>
              </div>
              <span className="font-bold">{shield}</span>
            </div>
            {shield > 0 ? (
              <div className="h-2 md:h-3 bg-blue-500/80 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 w-full" />
              </div>
            ) : (
              <div className="h-2 md:h-3 bg-gray-700/50 rounded-full" />
            )}
          </div>

          <div>
            <div className="flex justify-between text-white text-xs md:text-sm mb-1">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                <span className="font-semibold">Energy</span>
              </div>
              <span className="font-bold">{energy}/{maxEnergy}</span>
            </div>
            <div className="h-2 md:h-3 bg-black rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-300"
                style={{ width: `${energyPercent}%` }}
              />
            </div>
          </div>

          {/* Necromancy Stacks Display */}
          {necromancyStacks > 0 && (
            <div>
              <div className="flex justify-between text-white text-xs md:text-sm mb-1">
                <div className="flex items-center gap-1">
                  <Skull className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                  <span className="font-semibold">Necromancy Stacks</span>
                </div>
                <span className="font-bold">{necromancyStacks}</span>
              </div>
              <div className="h-2 md:h-3 bg-green-900/50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-lime-400" style={{ width: `${Math.min(necromancyStacks * 10, 100)}%` }} />
              </div>
            </div>
          )}

          {/* Damage Reflection Display */}
          {damageReflection > 0 && (
            <div>
              <div className="flex justify-between text-white text-xs md:text-sm mb-1">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 md:w-4 md:h-4 text-orange-400" />
                  <span className="font-semibold">Damage Reflection</span>
                </div>
                <span className="font-bold">{damageReflection}%</span>
              </div>
              <div className="h-2 md:h-3 bg-orange-900/50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-300" style={{ width: `${damageReflection}%` }} />
              </div>
            </div>
          )}

          {/* Status Effects and Buffs */}
          <div className="flex flex-wrap gap-2">
            {/* Susanoo Wrath Stacks Display */}
            {susanooWrathStacks > 0 && (
              <div className="flex items-center gap-2 bg-purple-900/40 px-3 py-1.5 rounded-lg border border-purple-500">
                <span className="text-xl">⚡</span>
                <div>
                  <div className="text-xs text-purple-300">Wrath Stacks</div>
                  <div className="text-sm font-bold text-white">+{susanooWrathStacks * 2} ATK</div>
                </div>
              </div>
            )}

            {anubisEternalBalanceStacks > 0 && (
              <div className="bg-purple-900/60 px-3 py-2 rounded-lg border border-purple-500 flex items-center gap-2">
                <span className="text-2xl">⚖️👑</span>
                <div>
                  <div className="text-xs text-purple-300 font-bold">ETERNAL BALANCE</div>
                  <div className="text-sm text-white">
                    {anubisEternalBalanceStacks} {anubisEternalBalanceStacks === 1 ? 'stack' : 'stacks'}
                  </div>
                  <div className="text-xs text-purple-200">
                    +{anubisEternalBalanceStacks * 5} Damage & Shield
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Relics Display - Integrated */}
        {relics.length > 0 && (
          <div className="mt-4 pt-4 border-t border-purple-500/30">
            <h4 className="text-xs md:text-sm font-bold text-purple-300 mb-2">Divine Relics</h4>
            <div className="flex flex-wrap gap-2">
              {relics.map((relic, index) => {
                const Icon = iconMap[relic.icon_name] || iconMap.Gem;
                const isEmpowered = relic.is_empowered || relic.name?.endsWith('+');
                
                return (
                  <HoverCard key={index}>
                    <HoverCardTrigger>
                      <div 
                        className={`relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 cursor-pointer transition-colors ${
                          isEmpowered 
                            ? 'bg-purple-500/30 border-purple-400 hover:bg-purple-500/40' 
                            : 'bg-purple-500/20 border-purple-500 hover:bg-purple-500/30'
                        }`}
                        style={isEmpowered ? {
                          boxShadow: '0 0 10px rgba(139, 92, 246, 0.6)'
                        } : {}}
                      >
                        <Icon className={`w-4 h-4 md:w-5 md:h-5 ${isEmpowered ? 'text-purple-300' : 'text-purple-300'}`} />
                        {isEmpowered && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                            +
                          </div>
                        )}
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className={`border-purple-700 text-white ${isEmpowered ? 'bg-purple-950/95' : 'bg-black'}`}>
                      <h4 className={`font-bold ${isEmpowered ? 'text-purple-300' : 'text-purple-300'}`}>
                        {relic.name}
                        {isEmpowered && <span className="ml-2 text-xs text-purple-400">⚡ EMPOWERED</span>}
                      </h4>
                      <p className="text-sm text-gray-200">{relic.description}</p>
                    </HoverCardContent>
                  </HoverCard>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

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

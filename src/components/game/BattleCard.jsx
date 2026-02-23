import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Swords, Heart, Shield, Zap, Flame, Star, BookOpen, Skull, TrendingUp, Coins, X, Sparkles, Zap as ChargeIcon, Droplet, Bolt } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

const effectIcons = {
  damage: Swords,
  heal: Heart,
  shield: Shield,
  draw: BookOpen,
  energy: Zap,
  burn: Flame
};

const typeLabels = {
  damage: 'ATTACK',
  heal: 'HEAL',
  shield: 'DEFEND',
  draw: 'DRAW',
  energy: 'ENERGY',
  burn: 'BURN'
};

const isVideo = (url) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.mov');
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(function BattleCard({ card, onPlay, disabled, index, godImage, comboActive = false, surgeActive = false, relics = [] }) {
  const Icon = effectIcons[card.type] || Swords;
  const typeLabel = typeLabels[card.type] || 'CARD';
  
  // Check if card has effects - only if value > 0
  const hasDualEffect = card.healValue > 0;
  const hasBonusShield = card.shieldValue > 0;
  const hasTripleEffect = hasDualEffect && hasBonusShield;
  const hasEnergyReturn = card.energyReturn > 0;
  const hasDrawCards = card.drawCards > 0;
  const hasDiscardCards = card.discardCards > 0;
  const hasSelfDamage = card.selfDamage > 0;
  const hasNextAttackBonus = card.nextAttackBonus > 0;
  const hasNextAttackBonusPercent = card.nextAttackBonusPercent > 0;
  const hasNextCardDiscount = card.nextCardDiscount > 0;
  const hasApplyBurn = card.applyBurn > 0;
  const hasApplyPoison = card.applyPoison > 0;
  const hasApplyVulnerable = card.applyVulnerable === true;
  const hasApplyStun = card.applyStun === true;
  const hasDamageReflection = card.damageReflection > 0;
  const hasZeusBonus = card.zeusBonus > 0;
  const hasAttackBonus = card.attackBonus > 0;
  const hasCostReduction = card.costReduction > 0;
  const hasLokiDiscount = card.lokiDiscount === true;
  const hasQuetzalcoatlDiscount = card.quetzalcoatlDiscount;
  const hasPhilosophersStone = relics.some(r => r.name === "Philosopher's Stone");
  const hasCombo = card.comboType && card.comboType !== '';
  const hasCharge = card.chargeValue > 0;
  const hasLeech = card.applyLeech === true;
  const hasSurge = card.hasSurge === true;
  const hasDebuffAmplify = card.debuffAmplify && card.debuffAmplify !== '';
  const hasKnowledge = card.knowledgeType && card.knowledgeType !== '' && card.knowledgeValue > 0;
  const chargeStacks = card.chargeStacks || 0;
  const chargeBonus = hasCharge ? chargeStacks * card.chargeValue : 0;
  
  // Calculate total cost reduction
  const totalCostReduction = (hasCostReduction ? card.costReduction : 0) + 
                             (hasLokiDiscount ? 1 : 0) + 
                             (hasQuetzalcoatlDiscount ? 1 : 0) +
                             (hasPhilosophersStone ? 1 : 0);
  
  const finalCost = Math.max(0, card.cost - totalCostReduction);
  const showCostReduction = totalCostReduction > 0;
  
  const handleClick = useCallback(() => {
    if (!disabled && onPlay && typeof onPlay === 'function') {
      onPlay();
    }
  }, [disabled, onPlay]);

  const isComboGlowing = hasCombo && comboActive;
  const isChargeGlowing = hasCharge && chargeStacks > 0;
  const isSurgeGlowing = hasSurge && surgeActive;

  // Build tooltip effects list - only include non-zero values
  const tooltipEffects = [];
  
  if (hasEnergyReturn) tooltipEffects.push({ icon: Zap, text: `Energy Return: +${card.energyReturn}`, color: 'text-yellow-400' });
  if (hasDrawCards) tooltipEffects.push({ icon: BookOpen, text: `Draw: ${card.drawCards} cards`, color: 'text-blue-400' });
  if (hasDiscardCards) tooltipEffects.push({ icon: X, text: `Discard: ${card.discardCards} cards`, color: 'text-gray-400' });
  if (hasSelfDamage) tooltipEffects.push({ icon: Skull, text: `Self Damage: ${card.selfDamage}`, color: 'text-red-400' });
  if (hasNextAttackBonus) tooltipEffects.push({ icon: Swords, text: `Next Attack Bonus: +${card.nextAttackBonus}`, color: 'text-red-400' });
  if (hasNextAttackBonusPercent) tooltipEffects.push({ icon: TrendingUp, text: `Next Attack Bonus: +${card.nextAttackBonusPercent}%`, color: 'text-orange-400' });
  if (hasNextCardDiscount) tooltipEffects.push({ icon: Coins, text: `Next Card Discount: ${card.nextCardDiscount} energy`, color: 'text-green-400' });
  if (hasApplyBurn) tooltipEffects.push({ icon: Flame, text: `Apply Burn: ${card.applyBurn}`, color: 'text-orange-400' });
  if (hasApplyPoison) tooltipEffects.push({ icon: Droplet, text: `Apply Poison: ${card.applyPoison}`, color: 'text-purple-400' });
  if (hasApplyVulnerable) tooltipEffects.push({ icon: () => <span className="text-xl">⚠</span>, text: 'Apply Vulnerable', color: 'text-pink-400' });
  if (hasApplyStun) tooltipEffects.push({ icon: Bolt, text: 'Apply Stun', color: 'text-yellow-400' });
  if (hasDamageReflection) tooltipEffects.push({ icon: Shield, text: `Damage Reflection: ${card.damageReflection}%`, color: 'text-indigo-400' });
  if (hasZeusBonus) tooltipEffects.push({ icon: Zap, text: `Zeus Bonus: +${card.zeusBonus} damage`, color: 'text-yellow-400' });
  if (hasAttackBonus) tooltipEffects.push({ icon: Swords, text: `Bonus Damage: +${card.attackBonus}`, color: 'text-red-400' });
  if (hasLeech) tooltipEffects.push({ icon: Heart, text: 'Leech Health', color: 'text-red-400' });
  if (hasSurge) tooltipEffects.push({ icon: Zap, text: 'Surge Active (Double if last card)', color: 'text-cyan-400' });
  if (hasDebuffAmplify) tooltipEffects.push({ icon: TrendingUp, text: `Debuff Amplify: ${card.debuffAmplify}`, color: 'text-purple-400' });
  if (hasKnowledge) tooltipEffects.push({ icon: BookOpen, text: `Knowledge: +${card.knowledgeValue} ${card.knowledgeType} per card in hand`, color: 'text-cyan-400' });
  if (hasCombo) tooltipEffects.push({ icon: Sparkles, text: `Combo: ${card.comboType.toUpperCase()} (+${card.comboBonus || 0})`, color: 'text-purple-400' });
  if (hasCharge) tooltipEffects.push({ icon: ChargeIcon, text: `Charge: +${card.chargeValue} per turn in hand (${chargeStacks} stacks)`, color: 'text-yellow-400' });

  // Use card.image directly - custom card art feature removed for performance
  const displayImage = card.image;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <motion.div 
          initial={false}
          whileHover={{ scale: disabled ? 1 : 1.05, y: disabled ? 0 : -8 }}
          onClick={handleClick}
          className={`relative overflow-hidden w-40 sm:w-48 h-72 sm:h-80 cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${showCostReduction ? 'ring-4 ring-green-400 shadow-lg shadow-green-400/50 animate-pulse' : ''} ${
            isComboGlowing ? 'ring-4 ring-purple-400 shadow-lg shadow-purple-400/50' : ''
          } ${isChargeGlowing ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-400/50' : ''} ${
            hasLeech ? 'ring-4 ring-red-400 shadow-lg shadow-red-400/50' : ''
          } ${isSurgeGlowing ? 'ring-4 ring-cyan-400 shadow-lg shadow-cyan-400/50 animate-pulse' : ''}`}
          style={{
            background: 'linear-gradient(to bottom, #d4af37 0%, #d4af37 8%, #f5e6d3 8%, #f5e6d3 92%, #d4af37 92%, #d4af37 100%)',
            border: '3px solid #8b7355',
            boxShadow: isSurgeGlowing
              ? 'inset 0 0 0 2px #d4af37, inset 0 0 0 4px #8b7355, 0 0 30px rgba(6, 182, 212, 0.8), 0 0 60px rgba(6, 182, 212, 0.4)'
              : hasLeech
              ? 'inset 0 0 0 2px #d4af37, inset 0 0 0 4px #8b7355, 0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.4)'
              : isChargeGlowing
              ? 'inset 0 0 0 2px #d4af37, inset 0 0 0 4px #8b7355, 0 0 30px rgba(250, 204, 21, 0.8), 0 0 60px rgba(250, 204, 21, 0.4)'
              : isComboGlowing
              ? 'inset 0 0 0 2px #d4af37, inset 0 0 0 4px #8b7355, 0 0 30px rgba(168, 85, 247, 0.8), 0 0 60px rgba(168, 85, 247, 0.4)'
              : showCostReduction
              ? 'inset 0 0 0 2px #d4af37, inset 0 0 0 4px #8b7355, 0 0 30px rgba(74, 222, 128, 0.8), 0 0 60px rgba(74, 222, 128, 0.4)' 
              : 'inset 0 0 0 2px #d4af37, inset 0 0 0 4px #8b7355',
            borderRadius: '1rem'
          }}
        >
          {/* Shine Effects */}
          {isSurgeGlowing && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 0%, rgba(6, 182, 212, 0.4) 50%, transparent 100%)',
                animation: 'shimmer 1.5s infinite'
              }}
            />
          )}
          {hasLeech && !isSurgeGlowing && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 0%, rgba(239, 68, 68, 0.3) 50%, transparent 100%)',
                animation: 'shimmer 2s infinite'
              }}
            />
          )}
          {isChargeGlowing && !hasLeech && !isSurgeGlowing && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 0%, rgba(250, 204, 21, 0.3) 50%, transparent 100%)',
                animation: 'shimmer 2s infinite'
              }}
            />
          )}
          {isComboGlowing && !isChargeGlowing && !hasLeech && !isSurgeGlowing && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 0%, rgba(168, 85, 247, 0.3) 50%, transparent 100%)',
                animation: 'shimmer 2s infinite'
              }}
            />
          )}
          {showCostReduction && !isComboGlowing && !isChargeGlowing && !hasLeech && !isSurgeGlowing && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 0%, rgba(74, 222, 128, 0.3) 50%, transparent 100%)',
                animation: 'shimmer 2s infinite'
              }}
            />
          )}

          {/* Charge Indicator Badge - Top Left */}
          {hasCharge && chargeStacks > 0 && (
            <div className="absolute top-1 left-1 bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-2 py-1 text-xs font-bold rounded-br-lg z-20 flex items-center gap-1 shadow-lg border-2 border-yellow-300 animate-pulse">
              <ChargeIcon className="w-3 h-3" fill="currentColor" />
              <span className="text-base">+{chargeBonus}</span>
            </div>
          )}

          {/* Combo Indicator Badge - Top Right */}
          {hasCombo && (
            <div className={`absolute top-1 right-1 ${isComboGlowing ? 'bg-gradient-to-br from-purple-400 to-pink-500 animate-pulse' : 'bg-gradient-to-br from-purple-600 to-indigo-600'} text-white px-2 py-1 text-xs font-bold rounded-bl-lg z-20 flex items-center gap-1 shadow-lg border-2 ${isComboGlowing ? 'border-purple-300' : 'border-purple-800'}`}>
              <Sparkles className="w-3 h-3" />
              <span>COMBO</span>
            </div>
          )}

          {/* Cost Reduction Badge - Top Right */}
          {showCostReduction && (
            <div className={`absolute ${hasCombo ? 'top-10' : 'top-1'} right-1 bg-gradient-to-br from-green-400 to-emerald-500 text-white px-3 py-1.5 text-sm font-bold rounded-bl-lg z-20 flex items-center gap-1 shadow-lg animate-bounce`}>
              <Coins className="w-4 h-4" fill="currentColor" />
              <span className="text-base">-{totalCostReduction}</span>
            </div>
          )}

          {/* Card Name Header */}
          <div className="relative h-10 flex items-center justify-center border-b-2 border-[#8b7355] bg-gradient-to-b from-[#d4af37] to-[#c9a961]">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, #8b7355 2px, #8b7355 4px)'
            }} />
            <h4 className="text-sm sm:text-base font-bold text-center px-2 relative z-10 truncate" style={{
              color: '#2c1810',
              textShadow: '1px 1px 0 rgba(255,255,255,0.3)'
            }}>
              {card.name}
            </h4>
          </div>

          {/* Energy Cost Circle - Upper Left - Only show if cost > 0 OR if there's cost reduction */}
          {(card.cost > 0 || showCostReduction) && (
            <div className="absolute top-12 left-2 z-20 flex items-center justify-center"
              style={{
                background: showCostReduction 
                  ? 'radial-gradient(circle, rgba(74, 222, 128, 1) 0%, rgba(34, 197, 94, 1) 100%)'
                  : 'radial-gradient(circle, rgba(250, 204, 21, 1) 0%, rgba(234, 179, 8, 1) 100%)',
                borderRadius: '50%',
                border: showCostReduction ? '3px solid #86efac' : '3px solid #fef3c7',
                width: '2.5rem',
                height: '2.5rem',
                boxShadow: showCostReduction 
                  ? '0 0 20px rgba(74, 222, 128, 0.8), 0 4px 8px rgba(0,0,0,0.4)'
                  : '0 4px 8px rgba(0,0,0,0.4)'
              }}
            >
              <div className="flex flex-col items-center -mt-1">
                <Star className={`w-3 h-3 ${showCostReduction ? 'text-white' : 'text-amber-900'}`} fill="currentColor" />
                {showCostReduction ? (
                  <div className="flex items-center gap-0.5 -mt-0.5">
                    <span className="text-xs font-black text-white/60 line-through" style={{ textShadow: '0 0 4px rgba(0, 0, 0, 0.8)' }}>
                      {card.cost}
                    </span>
                    <span className="text-base font-black text-white" style={{ textShadow: '0 0 8px rgba(0, 0, 0, 0.8), 0 0 4px rgba(74, 222, 128, 1)' }}>
                      {finalCost}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-black text-amber-900 -mt-0.5" style={{ textShadow: '0 0 4px rgba(255, 255, 255, 0.8)' }}>
                    {card.cost}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Card Art - Large Center Square */}
          <div className="relative h-36 sm:h-40 overflow-hidden bg-[#f5e6d3] border-b-2 border-[#8b7355] mt-0">
            {displayImage ? (
              isVideo(displayImage) ? (
                <video 
                  src={displayImage} 
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img src={displayImage} alt={card.name} className="w-full h-full object-cover" />
              )
            ) : (
              <>
                <img src={godImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm" />
                <div className={`absolute inset-0 ${card.gradient || 'bg-gradient-to-br from-gray-600 to-gray-800'} opacity-60`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon className="w-16 h-16 sm:w-20 sm:h-20 text-white/80" />
                </div>
              </>
            )}
          </div>

          {/* Type Label */}
          <div className="relative bg-[#f5e6d3] px-2 py-1 border-b border-[#8b7355]">
            <div className="text-xs sm:text-sm font-bold text-center" style={{ color: '#2c1810' }}>
              TYPE: {typeLabel}
            </div>
          </div>
          
          {/* Description Text Box */}
          <div className="bg-[#f5e6d3] px-2 py-2 border-t border-[#8b7355] text-xs sm:text-sm text-[#2c1810] flex-1 flex flex-col justify-start overflow-y-auto">
            <p className="leading-tight">{card.description}</p>
            
            {/* Show key effects inline - only if > 0 */}
            {(hasEnergyReturn || hasDrawCards || hasSelfDamage || hasApplyBurn || hasApplyPoison) && (
              <div className="mt-1 space-y-0.5">
                {hasEnergyReturn && (
                  <div className="flex items-center gap-1 text-yellow-700 font-semibold text-[10px]">
                    <Zap className="w-3 h-3" />
                    <span>Energy +{card.energyReturn}</span>
                  </div>
                )}
                {hasDrawCards && (
                  <div className="flex items-center gap-1 text-blue-700 font-semibold text-[10px]">
                    <BookOpen className="w-3 h-3" />
                    <span>Draw {card.drawCards}</span>
                  </div>
                )}
                {hasSelfDamage && (
                  <div className="flex items-center gap-1 text-red-700 font-semibold text-[10px]">
                    <Skull className="w-3 h-3" />
                    <span>Self Dmg {card.selfDamage}</span>
                  </div>
                )}
                {hasApplyBurn && (
                  <div className="flex items-center gap-1 text-orange-700 font-semibold text-[10px]">
                    <Flame className="w-3 h-3" />
                    <span>Burn {card.applyBurn}</span>
                  </div>
                )}
                {hasApplyPoison && (
                  <div className="flex items-center gap-1 text-purple-700 font-semibold text-[10px]">
                    <Droplet className="w-3 h-3" />
                    <span>Poison {card.applyPoison}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer with God Name */}
          <div className="absolute bottom-1 left-2 text-[8px] font-bold uppercase tracking-wider" style={{ color: '#2c1810' }}>
            {card.godName || 'Divine'}
          </div>

          {/* Bottom decorative border */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8b7355] via-[#d4af37] to-[#8b7355]" />
        </motion.div>
      </HoverCardTrigger>

      {tooltipEffects.length > 0 && (
        <HoverCardContent 
          className="bg-gradient-to-br from-black to-purple-950 border-2 border-amber-600 text-white p-4 w-80 max-h-96 overflow-y-auto z-[9999]"
          side="top"
          align="center"
        >
          <div className="space-y-2">
            <h4 className="font-bold text-amber-400 text-lg border-b border-amber-600 pb-2">{card.name} Effects</h4>
            {tooltipEffects.map((effect, idx) => {
              const EffectIcon = effect.icon;
              return (
                <div key={idx} className="flex items-center gap-2 py-1">
                  {typeof EffectIcon === 'function' ? (
                    <EffectIcon className={`w-5 h-5 ${effect.color} flex-shrink-0`} />
                  ) : (
                    <EffectIcon className={`w-5 h-5 ${effect.color} flex-shrink-0`} />
                  )}
                  <span className="text-sm text-gray-200">{effect.text}</span>
                </div>
              );
            })}
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  );
});

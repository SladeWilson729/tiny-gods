
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Zap, BookOpen, Flame, Skull, TrendingUp, Coins, Heart, Star, Shield, X, Sparkles, Droplet, Bolt } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CardEffectsLegendModal({ open, onClose }) {
  const effects = [
    {
      icon: Star,
      color: 'bg-yellow-400',
      textColor: 'text-amber-900',
      name: 'Energy Cost',
      description: 'Amount of Energy required to play this card',
      position: 'Top Left'
    },
    {
      icon: BookOpen,
      color: 'bg-blue-500',
      textColor: 'text-white',
      name: 'Draw Cards',
      description: 'Draw this many cards immediately when played',
      position: 'Top Right or Card Effect'
    },
    {
      icon: X,
      color: 'bg-red-600',
      textColor: 'text-white',
      name: 'Discard Cards',
      description: 'Discard this many cards from your hand when played',
      position: 'Top Right'
    },
    {
      icon: Zap,
      color: 'bg-yellow-400',
      textColor: 'text-amber-900',
      name: 'Energy Return',
      description: 'Gain this much Energy back after playing the card',
      position: 'Below Cost'
    },
    {
      icon: Flame,
      color: 'bg-orange-600',
      textColor: 'text-white',
      name: 'Burn Damage',
      description: 'Enemy takes this damage at the start of their turn',
      position: 'Top Right'
    },
    {
      icon: () => <span className="text-2xl">⚠</span>,
      color: 'bg-pink-600',
      textColor: 'text-white',
      name: 'Apply Vulnerable',
      description: 'Enemy takes +50% damage from all attacks this turn',
      position: 'Top Right'
    },
    {
      icon: () => <span className="text-2xl">💫</span>,
      color: 'bg-yellow-600',
      textColor: 'text-white',
      name: 'Apply Stun',
      description: 'Enemy\'s next attack deals 50% less damage',
      position: 'Top Right'
    },
    {
      icon: Shield,
      color: 'bg-indigo-600',
      textColor: 'text-white',
      name: 'Damage Reflection',
      description: 'Reflects this much damage back to enemy when you take damage this turn',
      position: 'Bottom Right'
    },
    {
      icon: TrendingUp,
      color: 'bg-orange-500',
      textColor: 'text-white',
      name: 'Next Attack Bonus',
      description: 'Your next attack deals this much extra damage (flat number) or X% more damage (percentage)',
      position: 'Bottom Right'
    },
    {
      icon: Coins,
      color: 'bg-cyan-500',
      textColor: 'text-white',
      name: 'Next Card Discount',
      description: 'Your next card costs this much less Energy',
      position: 'Bottom Left'
    },
    {
      icon: Skull,
      color: 'bg-red-600',
      textColor: 'text-white',
      name: 'Self Damage',
      description: 'You take this much damage when playing the card',
      position: 'Bottom Left'
    },
    {
      icon: Heart,
      color: 'bg-green-600',
      textColor: 'text-white',
      name: 'Bonus Heal',
      description: 'Restore this much Health in addition to card effect',
      position: 'Card Value'
    },
    {
      icon: Zap,
      color: 'bg-yellow-400',
      textColor: 'text-black',
      name: 'Zeus Bonus / Attack Boost',
      description: 'Yellow flash: This card has a temporary damage bonus',
      position: 'Top Right Corner'
    },
    {
      icon: Coins,
      color: 'bg-yellow-400',
      textColor: 'text-black',
      name: 'Cost Reduction',
      description: 'Yellow flash: This card costs less Energy this turn',
      position: 'Top Right Corner'
    },
    {
      icon: Sparkles,
      color: 'bg-purple-600',
      textColor: 'text-white',
      name: 'Combo',
      description: 'If you played the specified card type this turn, this card gets bonus effects. Glows purple when combo is active.',
      position: 'Top Right Corner'
    },
    {
      icon: Zap,
      color: 'bg-yellow-500',
      textColor: 'text-white',
      name: 'Charge',
      description: 'Gains +X to primary effect for each turn this card stays in your hand. Glows yellow when charged. Resets when played or discarded.',
      position: 'Top Left Corner'
    },
    {
      icon: Droplet,
      color: 'bg-red-600',
      textColor: 'text-white',
      name: 'Leech',
      description: 'All damage dealt this turn heals the player for 100% of the damage dealt. Card glows red.',
      position: 'Bottom Right'
    },
    {
      icon: Bolt,
      color: 'bg-cyan-500',
      textColor: 'text-white',
      name: 'Surge',
      description: 'If this is the last card you can play this turn, its primary effects (damage, heal, shield, draw) are DOUBLED. Card glows cyan when Surge will activate.',
      position: 'Top Left (below cost)'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gradient-to-br from-indigo-950 via-purple-950 to-black border-purple-700 text-white overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-yellow-400">Card Effects Legend</DialogTitle>
          <DialogDescription className="text-gray-300">
            Learn what each icon and indicator on your cards means
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 py-4">
          {effects.map((effect, index) => {
            const Icon = effect.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-black/40 border-purple-800 p-4 hover:bg-purple-900/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div 
                      className={`${effect.color} ${effect.textColor} p-2 rounded-full flex-shrink-0 shadow-lg`}
                      style={{ width: '40px', height: '40px' }}
                    >
                      {typeof Icon === 'function' ? <Icon /> : <Icon className="w-full h-full" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white mb-1">{effect.name}</h4>
                      <p className="text-sm text-gray-300 mb-1">{effect.description}</p>
                      <p className="text-xs text-purple-400 italic">Position: {effect.position}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4 mt-4">
          <h4 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Pro Tip
          </h4>
          <p className="text-sm text-gray-300">
            Multiple effects can appear on a single card! Look for all the indicators to maximize your strategy. 
            Cards with yellow glowing borders have temporary bonuses or cost reductions active.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

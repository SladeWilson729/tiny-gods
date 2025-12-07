
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Heart, Shield, Zap, Swords, Trophy, Scroll, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const tutorialSteps = [
  {
    title: "Welcome to Tiny Gods!",
    icon: Sparkles,
    iconColor: "text-yellow-400",
    content: (
      <div className="space-y-4">
        <p className="text-lg text-gray-300">
          Embark on a legendary journey as a divine champion! Battle fearsome enemies, collect powerful cards, and prove your worth among the gods.
        </p>
        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
          <h4 className="font-bold text-yellow-400 mb-2">🎯 Your Goal</h4>
          <p className="text-gray-300">Win <span className="text-yellow-400 font-bold">10 battles</span> in a row to complete your divine run and claim victory!</p>
        </div>
      </div>
    )
  },
  {
    title: "Choose Your God",
    icon: Trophy,
    iconColor: "text-amber-400",
    content: (
      <div className="space-y-4">
        <p className="text-gray-300">
          Each god has unique abilities and a custom deck of cards. Choose wisely!
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-900/30 border border-blue-700 rounded p-3">
            <p className="font-bold text-blue-300 mb-1">⚡ Zeus</p>
            <p className="text-xs text-gray-400">Master of lightning and raw power</p>
          </div>
          <div className="bg-purple-900/30 border border-purple-700 rounded p-3">
            <p className="font-bold text-purple-300 mb-1">🛡️ Athena</p>
            <p className="text-xs text-gray-400">Strategic defense and shields</p>
          </div>
          <div className="bg-green-900/30 border border-green-700 rounded p-3">
            <p className="font-bold text-green-300 mb-1">💀 Anubis</p>
            <p className="text-xs text-gray-400">Life drain and survival</p>
          </div>
          <div className="bg-red-900/30 border border-red-700 rounded p-3">
            <p className="font-bold text-red-300 mb-1">🔨 Thor</p>
            <p className="text-xs text-gray-400">Mighty strikes and endurance</p>
          </div>
        </div>
        <p className="text-sm text-yellow-300 italic">...and 8 more gods to discover!</p>
      </div>
    )
  },
  {
    title: "Understanding Combat Stats",
    icon: Heart,
    iconColor: "text-red-400",
    content: (
      <div className="space-y-4">
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-red-400" />
            <h4 className="font-bold text-red-300">Health</h4>
          </div>
          <p className="text-sm text-gray-300">Your life force. If it reaches 0, you lose the run!</p>
        </div>
        
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <h4 className="font-bold text-blue-300">Shield</h4>
          </div>
          <p className="text-sm text-gray-300">Temporary protection that blocks damage. Resets each battle.</p>
        </div>
        
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h4 className="font-bold text-yellow-300">Energy</h4>
          </div>
          <p className="text-sm text-gray-300">Used to play cards. Refills at the start of your turn (usually 3).</p>
        </div>
      </div>
    )
  },
  {
    title: "Card Types",
    icon: Scroll,
    iconColor: "text-purple-400",
    content: (
      <div className="space-y-4">
        <p className="text-gray-300">There are three main types of cards in your deck:</p>
        
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 border border-red-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Swords className="w-4 h-4 text-red-400" />
              <h4 className="font-bold text-red-300">Attack Cards</h4>
            </div>
            <p className="text-sm text-gray-300">Deal damage to enemies. The bigger the number, the more damage!</p>
            <p className="text-xs text-red-300 mt-1">Example: "Lightning Strike - Deal 12 damage"</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-green-400" />
              <h4 className="font-bold text-green-300">Heal Cards</h4>
            </div>
            <p className="text-sm text-gray-300">Restore your health. Can't go above your maximum health.</p>
            <p className="text-xs text-green-300 mt-1">Example: "Divine Blessing - Heal 10 health"</p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-blue-400" />
              <h4 className="font-bold text-blue-300">Shield Cards</h4>
            </div>
            <p className="text-sm text-gray-300">Gain shield to block incoming damage. Stacks with existing shield.</p>
            <p className="text-xs text-blue-300 mt-1">Example: "Iron Wall - Gain 8 shield"</p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "How Combat Works",
    icon: Swords,
    iconColor: "text-red-400",
    content: (
      <div className="space-y-4">
        <p className="text-gray-300">Each battle follows the same pattern:</p>
        
        <div className="space-y-3">
          <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3">
            <p className="font-bold text-purple-300 mb-1">1️⃣ Your Turn</p>
            <ul className="text-sm text-gray-300 space-y-1 ml-4">
              <li>• Draw cards (usually 3 per turn)</li>
              <li>• Play cards using your energy</li>
              <li>• Attack, heal, or shield as needed</li>
              <li>• Click "End Turn" when done</li>
            </ul>
          </div>
          
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
            <p className="font-bold text-red-300 mb-1">2️⃣ Enemy Turn</p>
            <ul className="text-sm text-gray-300 space-y-1 ml-4">
              <li>• Enemy attacks (shown on their card)</li>
              <li>• Your shield blocks damage first</li>
              <li>• Remaining damage hits your health</li>
            </ul>
          </div>
          
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
            <p className="font-bold text-green-300 mb-1">3️⃣ Repeat!</p>
            <p className="text-sm text-gray-300">Continue until you or the enemy reaches 0 health.</p>
          </div>
        </div>
        
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
          <p className="text-xs text-yellow-300">💡 <span className="font-bold">Pro Tip:</span> Balance offense and defense! Sometimes it's better to shield up than go all-out attacking.</p>
        </div>
      </div>
    )
  },
  {
    title: "Progression & Rewards",
    icon: Trophy,
    iconColor: "text-yellow-400",
    content: (
      <div className="space-y-4">
        <p className="text-gray-300">After winning each battle, you'll grow stronger:</p>
        
        <div className="space-y-3">
          <div className="bg-indigo-900/30 border border-indigo-700 rounded-lg p-3">
            <p className="font-bold text-indigo-300 mb-1">📜 New Cards</p>
            <p className="text-sm text-gray-300">Choose 1 of 3 cards to add to your deck. Build powerful combos!</p>
          </div>
          
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
            <p className="font-bold text-amber-300 mb-1">✨ Relics (Every 3rd Win)</p>
            <p className="text-sm text-gray-300">Powerful passive abilities that last the entire run. Choose wisely!</p>
            <p className="text-xs text-amber-400 mt-1">Examples: +15 Max Health, +1 Energy, Deal extra damage</p>
          </div>
          
          <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3">
            <p className="font-bold text-purple-300 mb-1">🗺️ Map Path</p>
            <p className="text-sm text-gray-300">Choose your path: Elite enemies for better rewards or safer normal enemies.</p>
          </div>
        </div>
        
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
          <p className="text-xs text-green-300">✅ <span className="font-bold">Remember:</span> Win 10 battles to complete your run!</p>
        </div>
      </div>
    )
  },
  {
    title: "Advanced Tips",
    icon: Sparkles,
    iconColor: "text-cyan-400",
    content: (
      <div className="space-y-4">
        <p className="text-gray-300">Master these strategies to become a legendary champion:</p>
        
        <div className="space-y-3">
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
            <p className="font-bold text-blue-300 mb-1">🎯 Deck Building</p>
            <ul className="text-sm text-gray-300 space-y-1 ml-4">
              <li>• Quality over quantity - a focused deck is stronger</li>
              <li>• Balance attack and defense cards</li>
              <li>• Synergize with your god's ability</li>
            </ul>
          </div>
          
          <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3">
            <p className="font-bold text-purple-300 mb-1">⚡ Energy Management</p>
            <ul className="text-sm text-gray-300 space-y-1 ml-4">
              <li>• Don't waste energy - use it all each turn</li>
              <li>• High-cost cards are usually powerful</li>
              <li>• Some relics give +1 energy per turn</li>
            </ul>
          </div>
          
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
            <p className="font-bold text-red-300 mb-1">🛡️ Know When to Defend</p>
            <ul className="text-sm text-gray-300 space-y-1 ml-4">
              <li>• Shield up before big enemy attacks</li>
              <li>• Some gods get bonuses with high shield</li>
              <li>• Shield doesn't carry between battles</li>
            </ul>
          </div>
          
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
            <p className="font-bold text-amber-300 mb-1">🎲 Hard & Heroic Modes</p>
            <p className="text-sm text-gray-300">Unlock after your first win! Enemies gain powerful affixes making them much stronger. Greater challenge, greater glory!</p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Ready to Begin!",
    icon: Trophy,
    iconColor: "text-yellow-400",
    content: (
      <div className="space-y-4 text-center">
        <div className="text-6xl mb-4">⚔️</div>
        <p className="text-xl text-gray-300">
          You're ready to embark on your divine journey!
        </p>
        <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-700 rounded-lg p-6">
          <p className="text-lg text-yellow-300 font-bold mb-3">Remember:</p>
          <ul className="text-left text-gray-300 space-y-2">
            <li>✅ Win 10 battles to complete your run</li>
            <li>✅ Balance your deck with attack, defense, and healing</li>
            <li>✅ Use your god's unique abilities wisely</li>
            <li>✅ Manage your energy efficiently</li>
            <li>✅ Choose relics that complement your strategy</li>
          </ul>
        </div>
        <p className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-purple-400 font-bold">
          May the gods favor your journey! 🏆
        </p>
      </div>
    )
  }
];

export default function TutorialModal({ open, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-gray-800 to-black border-amber-600 text-white overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl flex items-center gap-3">
            <Icon className={`w-8 h-8 ${step.iconColor}`} />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
              {step.title}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {step.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-4">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-amber-500'
                  : index < currentStep
                  ? 'w-2 bg-amber-700'
                  : 'w-2 bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-amber-800">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            variant="outline"
            className="border-amber-500 text-amber-300 hover:bg-amber-500/20 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <span className="text-sm text-gray-400">
            Step {currentStep + 1} of {tutorialSteps.length}
          </span>

          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
          >
            {currentStep === tutorialSteps.length - 1 ? (
              "Let's Play!"
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Skip Tutorial Button */}
        <div className="text-center pt-2">
          <button
            onClick={handleClose}
            className="text-sm text-gray-400 hover:text-gray-200 underline"
          >
            Skip Tutorial
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

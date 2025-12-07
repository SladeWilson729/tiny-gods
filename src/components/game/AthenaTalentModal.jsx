
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, Swords, Zap, Loader2, CheckCircle, Eye, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TALENTS_TIER1 = [
  {
    id: 'calculated_strike',
    name: 'Calculated Strike',
    description: '+10% chance to deal double damage with attack cards if shield ≥ 4',
    icon: Swords,
    color: 'from-red-500 to-orange-500'
  },
  {
    id: 'shield_readiness',
    name: 'Shield Readiness',
    description: 'Gain 8 shield at the start of each turn',
    icon: Shield,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'divine_patience',
    name: 'Divine Patience',
    description: 'Draw 1 less card at turn start, gain +2 energy instead',
    icon: Zap,
    color: 'from-yellow-500 to-amber-500'
  }
];

const TALENTS_TIER2 = [
  {
    id: 'aggressive_defense', // Fixed ID to use snake_case for consistency
    name: 'Aggressive Defense',
    description: 'After completing 2 attacks, deal half the amount of shield you have as damage to the enemy',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'insight_edge',
    name: 'Insight Edge',
    description: 'Negate the first attack each combat',
    icon: Eye,
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'shared_wisdom',
    name: 'Shared Wisdom',
    description: 'Shield spells cost 1 less energy',
    icon: Shield,
    color: 'from-green-500 to-teal-500'
  }
];

export default function AthenaTalentModal({ open, onClose }) {
  const [currentTalent, setCurrentTalent] = useState('none');
  const [currentTalentTier2, setCurrentTalentTier2] = useState('none');
  const [athenaRunsCount, setAthenaRunsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('tier1');

  useEffect(() => {
    if (open) {
      loadCurrentTalents();
    }
  }, [open]);

  const loadCurrentTalents = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentTalent(user.athena_talent || 'none');
      setCurrentTalentTier2(user.athena_talent_tier2 || 'none');
      setAthenaRunsCount(user.athena_runs_count || 0);
      
      // Auto-switch to tier 2 if user has unlocked it and hasn't selected tier 2 yet
      if (user.athena_runs_count >= 3 && user.athena_talent_tier2 === 'none' && user.athena_talent !== 'none') {
        setActiveTab('tier2');
      }
    } catch (error) {
      console.error("Failed to load talents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTalent = async (talentId, tier) => {
    setIsSaving(true);
    try {
      const updateData = tier === 1 
        ? { athena_talent: talentId }
        : { athena_talent_tier2: talentId };
      
      await base44.auth.updateMe(updateData);
      
      if (tier === 1) {
        setCurrentTalent(talentId);
      } else {
        setCurrentTalentTier2(talentId);
      }
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Failed to save talent:", error);
      alert("Failed to save talent. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const tier2Unlocked = athenaRunsCount >= 3;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-gradient-to-br from-indigo-950 via-purple-950 to-black border-purple-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl text-yellow-400">Athena's Wisdom Tree</DialogTitle>
          <DialogDescription className="text-lg text-gray-300">
            Choose permanent enhancements for Athena across all future runs.
            {currentTalent !== 'none' && " You may change your selection at any time."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/40">
              <TabsTrigger value="tier1" className="text-white data-[state=active]:bg-purple-600">
                Tier 1
              </TabsTrigger>
              <TabsTrigger 
                value="tier2" 
                className="text-white data-[state=active]:bg-purple-600"
                disabled={!tier2Unlocked}
              >
                Tier 2 {!tier2Unlocked && `(${athenaRunsCount}/3 runs)`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tier1" className="py-6">
              <div className="grid md:grid-cols-3 gap-6">
                {TALENTS_TIER1.map((talent, index) => {
                  const Icon = talent.icon;
                  const isSelected = currentTalent === talent.id;
                  
                  return (
                    <motion.div
                      key={talent.id}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 }}
                    >
                      <Card 
                        className={`relative bg-black/40 border-2 h-full flex flex-col p-6 text-center transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-yellow-500 bg-yellow-500/20 shadow-yellow-500/50 shadow-lg' 
                            : 'border-purple-800 hover:bg-purple-900/50 hover:border-purple-600'
                        }`}
                        onClick={() => !isSaving && handleSelectTalent(talent.id, 1)}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle className="w-6 h-6 text-yellow-400" />
                          </div>
                        )}
                        
                        <div className={`w-20 h-20 bg-gradient-to-br ${talent.color} rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/20`}>
                          <Icon className="w-10 h-10 text-white" />
                        </div>
                        
                        <h3 className="text-xl font-bold text-purple-300 mb-3">{talent.name}</h3>
                        <p className="text-sm flex-grow text-gray-200">{talent.description}</p>
                        
                        {isSelected && (
                          <div className="mt-4 text-yellow-400 font-bold">
                            ACTIVE
                          </div>
                        )}
                        
                        {!isSelected && (
                          <Button 
                            className="mt-4 bg-purple-600 hover:bg-purple-700"
                            disabled={isSaving}
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Select'}
                          </Button>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="tier2" className="py-6">
              {!tier2Unlocked ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                  <h3 className="text-2xl font-bold text-purple-300 mb-2">Tier 2 Locked</h3>
                  <p className="text-gray-300">
                    Complete {3 - athenaRunsCount} more run{3 - athenaRunsCount !== 1 ? 's' : ''} with Athena to unlock Tier 2 talents.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Progress: {athenaRunsCount}/3 runs
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {TALENTS_TIER2.map((talent, index) => {
                    const Icon = talent.icon;
                    const isSelected = currentTalentTier2 === talent.id;
                    
                    return (
                      <motion.div
                        key={talent.id}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.15 }}
                      >
                        <Card 
                          className={`relative bg-black/40 border-2 h-full flex flex-col p-6 text-center transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-yellow-500 bg-yellow-500/20 shadow-yellow-500/50 shadow-lg' 
                              : 'border-purple-800 hover:bg-purple-900/50 hover:border-purple-600'
                          }`}
                          onClick={() => !isSaving && handleSelectTalent(talent.id, 2)}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle className="w-6 h-6 text-yellow-400" />
                            </div>
                          )}
                          
                          <div className={`w-20 h-20 bg-gradient-to-br ${talent.color} rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/20`}>
                            <Icon className="w-10 h-10 text-white" />
                          </div>
                          
                          <h3 className="text-xl font-bold text-purple-300 mb-3">{talent.name}</h3>
                          <p className="text-sm flex-grow text-gray-200">{talent.description}</p>
                          
                          {isSelected && (
                            <div className="mt-4 text-yellow-400 font-bold">
                              ACTIVE
                            </div>
                          )}
                          
                          {!isSelected && (
                            <Button 
                              className="mt-4 bg-purple-600 hover:bg-purple-700"
                              disabled={isSaving}
                            >
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Select'}
                            </Button>
                          )}
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}


import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Sparkles, Crown, Coins, ChevronRight, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import RankEmblemParticles from '../components/game/RankEmblemParticles';
import RankEmblemGlow from '../components/game/RankEmblemGlow';

const RANK_TIERS = {
  0: { name: 'Mortal', color: '#6b7280', nextAt: 1 }, // Need 1 victory to reach Rank 1
  1: { name: 'Ascendant I', color: '#3b82f6', nextAt: 3 }, // Need 3 victories to reach Rank 2
  2: { name: 'Ascendant II', color: '#3b82f6', nextAt: 5 }, // Need 5 victories to reach Rank 3
  3: { name: 'Ascendant III', color: '#3b82f6', nextAt: 8 }, // Need 8 victories to reach Rank 4
  4: { name: 'Demi-God I', color: '#8b5cf6', nextAt: 12 }, // Need 12 victories to reach Rank 5
  5: { name: 'Demi-God II', color: '#8b5cf6', nextAt: 16 }, // Need 16 victories to reach Rank 6
  6: { name: 'Demi-God III', color: '#8b5cf6', nextAt: 20 }, // Need 20 victories to reach Rank 7
  7: { name: 'Divine I', color: '#f59e0b', nextAt: 25 }, // Need 25 victories to reach Rank 8
  8: { name: 'Divine II', color: '#f59e0b', nextAt: 30 }, // Need 30 victories to reach Rank 9
  9: { name: 'Divine III', color: '#f59e0b', nextAt: 40 }, // Need 40 victories to reach Rank 10
  10: { name: 'Eternal', color: '#fbbf24', nextAt: null }, // Max rank
};

export default function Victory() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const godName = urlParams.get('god');
  const victories = urlParams.get('victories');
  const hasChecked = useRef(false);
  const [isChecking, setIsChecking] = useState(true);
  const [ascensionRewards, setAscensionRewards] = useState(null);
  const [divineRankData, setDivineRankData] = useState(null);
  const [rankProgression, setRankProgression] = useState(null);
  const [newRankUnlocked, setNewRankUnlocked] = useState(false);
  
  console.log("🏆 VICTORY PAGE LOADED");
  console.log("God:", godName, "Victories:", victories);
  
  useEffect(() => {
    const verifyProgress = async () => {
      if (hasChecked.current || !godName) {
        setIsChecking(false);
        return;
      }
      
      hasChecked.current = true;
      
      try {
        console.log("Victory page - Verifying user progress...");
        
        // Wait a moment to ensure updates have propagated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const user = await base44.auth.me();
        console.log("Victory page - User god_runs_completed:", user.god_runs_completed);
        console.log("Victory page - Runs for", godName, ":", user.god_runs_completed?.[godName] || 0);
        
        // FIXED: Get the specific run from URL params instead of just the most recent
        const urlParams = new URLSearchParams(window.location.search);
        const runId = urlParams.get('runId');
        
        let completedRuns = [];
        if (runId) {
          // Get the specific run by ID
          const specificRun = await base44.entities.GameRun.filter({ id: runId, status: 'won' });
          completedRuns = specificRun;
          console.log('Victory page - Fetched specific run:', runId, specificRun);
        } else {
          // Fallback to most recent won run
          completedRuns = await base44.entities.GameRun.filter({ 
            status: 'won',
            created_by: user.email 
          }, '-created_date', 1);
          console.log('Victory page - Fetched most recent won run:', completedRuns);
        }
        
        const totalVictories = user.total_victories || 0;
        const previousHighestRank = user.highest_rank_completed || 0;
        
        // Calculate rank progression - FIXED LOGIC
        let currentRankNum = 0;
        
        // Find the highest rank the player has unlocked based on total victories
        // Start from highest rank and work down
        if (totalVictories >= 40) currentRankNum = 10; // Eternal
        else if (totalVictories >= 30) currentRankNum = 9; // Divine III
        else if (totalVictories >= 25) currentRankNum = 8; // Divine II
        else if (totalVictories >= 20) currentRankNum = 7; // Divine I
        else if (totalVictories >= 16) currentRankNum = 6; // Demi-God III
        else if (totalVictories >= 12) currentRankNum = 5; // Demi-God II
        else if (totalVictories >= 8) currentRankNum = 4; // Demi-God I
        else if (totalVictories >= 5) currentRankNum = 3; // Ascendant III
        else if (totalVictories >= 3) currentRankNum = 2; // Ascendant II
        else if (totalVictories >= 1) currentRankNum = 1; // Ascendant I
        else currentRankNum = 0; // Mortal
        
        const currentRankInfo = RANK_TIERS[currentRankNum];
        const nextRankInfo = RANK_TIERS[currentRankNum + 1];
        
        // Calculate progress to next rank
        const victoriesAtCurrentRank = currentRankNum === 0 ? 0 : RANK_TIERS[currentRankNum - 1]?.nextAt || 0;
        const victoriesForNextRank = currentRankInfo.nextAt;
        
        let progressPercent = 0;
        let victoriesNeeded = 0;

        if (nextRankInfo && victoriesForNextRank !== null) {
          const victoriesInSegment = totalVictories - victoriesAtCurrentRank;
          const totalVictoriesInSegment = victoriesForNextRank - victoriesAtCurrentRank;
          progressPercent = (victoriesInSegment / totalVictoriesInSegment) * 100;
          victoriesNeeded = victoriesForNextRank - totalVictories;
        } else {
          progressPercent = 100;
          victoriesNeeded = 0;
        }

        setRankProgression({
          current: currentRankNum,
          currentName: currentRankInfo.name,
          currentColor: currentRankInfo.color,
          next: nextRankInfo ? currentRankNum + 1 : null,
          nextName: nextRankInfo?.name,
          nextColor: nextRankInfo?.color,
          progressPercent: Math.min(100, Math.max(0, progressPercent)),
          victoriesNeeded: Math.max(0, victoriesNeeded),
          totalVictories
        });
        
        // Check if new rank was unlocked
        if (currentRankNum > previousHighestRank) {
          setNewRankUnlocked(true);
        }
        
        if (completedRuns.length > 0) {
          const lastRun = completedRuns[0];
          
          // Update highest_rank_completed
          const runDivineRank = lastRun.divine_rank || 0;
          const currentHighest = user.highest_rank_completed || 0;
          
          console.log('Victory page - Run divine rank:', runDivineRank, 'Current highest:', currentHighest);
          
          if (runDivineRank > currentHighest) {
            await base44.auth.updateMe({
              highest_rank_completed: runDivineRank
            });
            console.log(`✅ Updated highest_rank_completed to ${runDivineRank}`);
          }
          
          // ALWAYS GRANT REWARDS - scale with rank
          const baseReward = 5;
          const favorTokens = runDivineRank > 0 ? (runDivineRank * 10) : baseReward;
          const essenceCrystals = runDivineRank > 0 ? (runDivineRank * 5) : 2;
          
          console.log(`Victory page - Granting rewards for rank ${runDivineRank}:`, { favorTokens, essenceCrystals });
          
          setAscensionRewards({
            rank: runDivineRank,
            favorTokens,
            essenceCrystals,
            modifiers: lastRun.active_modifiers || []
          });
          
          // Get rank tier info
          const rankTier = runDivineRank >= 10 ? 'Eternal' :
                          runDivineRank >= 7 ? 'Divine' :
                          runDivineRank >= 4 ? 'Demi-God' :
                          runDivineRank >= 1 ? 'Ascendant' : 'Mortal';
          
          const rankName = runDivineRank >= 10 ? 'Eternal' :
                          runDivineRank >= 7 ? `Divine ${['I', 'II', 'III'][runDivineRank - 7]}` :
                          runDivineRank >= 4 ? `Demi-God ${['I', 'II', 'III'][runDivineRank - 4]}` :
                          runDivineRank >= 1 ? `Ascendant ${['I', 'II', 'III'][runDivineRank - 1]}` : 'Mortal';
          
          setDivineRankData({ tier: rankTier, name: rankName, number: runDivineRank });
          
          // Update user with rewards
          const currentFavor = user.favor_tokens || 0;
          const currentEssence = user.essence_crystals || 0;
          
          await base44.auth.updateMe({
            favor_tokens: currentFavor + favorTokens,
            essence_crystals: currentEssence + essenceCrystals
          });
          
          console.log('✅ Victory rewards granted:', { 
            rank: runDivineRank,
            favorTokens, 
            essenceCrystals,
            newFavorTotal: currentFavor + favorTokens,
            newEssenceTotal: currentEssence + essenceCrystals
          });
        } else {
          console.warn('⚠️ No completed run found for reward calculation');
        }
        
        if (!user.god_runs_completed || !user.god_runs_completed[godName]) {
          console.warn("⚠️ Victory page - God runs not updated! Attempting manual update...");
          
          const currentGodRuns = user.god_runs_completed || {};
          const currentGodRunCount = currentGodRuns[godName] || 0;
          
          await base44.auth.updateMe({
            god_runs_completed: {
              ...currentGodRuns,
              [godName]: currentGodRunCount + 1
            }
          });
          
          console.log("✅ Victory page - Manual update complete");
        } else {
          console.log("✅ Victory page - Progress verified");
        }
      } catch (error) {
        console.error("Victory page - Error verifying progress:", error);
      } finally {
        setIsChecking(false);
      }
    };
    
    verifyProgress();
  }, [godName]);
  
  const rankColor = divineRankData?.number >= 10 ? '#fbbf24' :
                    divineRankData?.number >= 7 ? '#f59e0b' :
                    divineRankData?.number >= 4 ? '#8b5cf6' :
                    divineRankData?.number >= 1 ? '#3b82f6' : '#6b7280';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-950 via-orange-950 to-purple-950 p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 1 }}
        >
          <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-md border-yellow-500 border-2 p-12 text-center shadow-2xl">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-32 h-32 mx-auto mb-6"
            >
              <Trophy className="w-full h-full text-yellow-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              VICTORY!
            </h1>
            
            <div className="text-white space-y-4 mb-8">
              <p className="text-2xl font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                <span className="text-yellow-300">{godName}</span> has triumphed!
              </p>
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
                <p className="text-xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                  Enemies Defeated: <span className="font-bold text-yellow-300">{victories}</span>
                </p>
                <Sparkles className="w-5 h-5 text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
              </div>
              <p className="text-lg text-yellow-200 font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                The pantheon celebrates your legendary victory!
              </p>
              {isChecking && (
                <p className="text-sm text-yellow-300 italic">Updating divine records...</p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={() => navigate(createPageUrl('Leaderboard'))}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold"
              >
                View Leaderboard
              </Button>
              <Button
                onClick={() => navigate(createPageUrl('GodSelection'))}
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
              >
                New Run
              </Button>
              <Button
                onClick={() => navigate(createPageUrl('Home'))}
                size="lg"
                variant="outline"
                className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/20"
              >
                Main Menu
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Rank Progression Card */}
        <AnimatePresence>
          {rankProgression && !isChecking && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card 
                className="backdrop-blur-md border-2 p-6 shadow-2xl"
                style={{
                  background: `linear-gradient(to br, ${rankProgression.currentColor}20, ${rankProgression.currentColor}10)`,
                  borderColor: rankProgression.currentColor
                }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black"
                        style={{
                          background: `radial-gradient(circle, ${rankProgression.currentColor}, ${rankProgression.currentColor}aa)`,
                          border: `3px solid ${rankProgression.currentColor}`
                        }}
                      >
                        {rankProgression.current}
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Current Rank</div>
                        <div className="text-xl font-bold" style={{ color: rankProgression.currentColor }}>
                          {rankProgression.currentName}
                        </div>
                      </div>
                    </div>
                    
                    {rankProgression.next !== null && (
                      <>
                        <ChevronRight className="w-8 h-8 text-gray-500" />
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-sm text-gray-400 text-right">Next Rank</div>
                            <div className="text-xl font-bold text-right" style={{ color: rankProgression.nextColor }}>
                              {rankProgression.nextName}
                            </div>
                          </div>
                          <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black opacity-50"
                            style={{
                              background: `radial-gradient(circle, ${rankProgression.nextColor}, ${rankProgression.nextColor}aa)`,
                              border: `3px solid ${rankProgression.nextColor}`
                            }}
                          >
                            {rankProgression.next}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {rankProgression.next !== null && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-300 mb-2">
                        <span>{rankProgression.totalVictories} victories</span>
                        <span>{RANK_TIERS[rankProgression.current]?.nextAt} needed for next rank</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${rankProgression.progressPercent}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(to right, ${rankProgression.currentColor}, ${rankProgression.nextColor})`
                          }}
                        />
                      </div>
                      <p className="text-center text-sm text-gray-400 mt-2">
                        {rankProgression.victoriesNeeded} more {rankProgression.victoriesNeeded === 1 ? 'victory' : 'victories'} to unlock {rankProgression.nextName}
                      </p>
                    </div>
                  )}
                  
                  {rankProgression.next === null && (
                    <div className="text-center py-4">
                      <div className="text-2xl font-bold text-yellow-400 mb-2">⚡ MAXIMUM RANK ACHIEVED ⚡</div>
                      <p className="text-gray-300">You have reached the pinnacle of divine power</p>
                    </div>
                  )}
                  
                  {newRankUnlocked && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 }}
                      className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <TrendingUp className="w-6 h-6" />
                        <span className="text-lg font-bold">NEW RANK UNLOCKED!</span>
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <p className="text-center text-gray-300 mt-2">
                        You can now attempt <span className="font-bold" style={{ color: rankProgression.currentColor }}>{rankProgression.currentName}</span> runs!
                      </p>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ascension Rewards Card */}
        <AnimatePresence>
          {ascensionRewards && !isChecking && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card 
                className="backdrop-blur-md border-2 p-8 shadow-2xl overflow-hidden"
                style={{
                  background: `linear-gradient(to br, ${rankColor}20, ${rankColor}10)`,
                  borderColor: rankColor
                }}
              >
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Crown className="w-8 h-8" style={{ color: rankColor }} />
                    <h2 className="text-3xl font-bold text-white">Divine Ascension Complete</h2>
                    <Crown className="w-8 h-8" style={{ color: rankColor }} />
                  </div>
                  
                  {/* Enhanced Rank Emblem with Particles */}
                  <div className="relative w-32 h-32 mx-auto my-8">
                    <RankEmblemParticles 
                      rank={divineRankData.number} 
                      color={rankColor}
                      size="lg"
                    />
                    <RankEmblemGlow
                      rank={divineRankData.number}
                      color={rankColor}
                      glow={rankColor + '80'}
                      size="lg"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: rankColor }}>
                      {divineRankData.name}
                    </h3>
                    <p className="text-gray-300">{divineRankData.tier} Tier Conquered</p>
                  </div>
                  
                  <div className="bg-black/40 rounded-xl p-6 border" style={{ borderColor: `${rankColor}40` }}>
                    <h4 className="text-xl font-bold text-amber-400 mb-4 flex items-center justify-center gap-2">
                      <Coins className="w-6 h-6" />
                      Rewards Earned
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-yellow-400">
                          {ascensionRewards.favorTokens}
                        </div>
                        <div className="text-sm text-gray-300">Favor Tokens</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-cyan-400">
                          {ascensionRewards.essenceCrystals}
                        </div>
                        <div className="text-sm text-gray-300">Essence Crystals</div>
                      </div>
                    </div>
                  </div>
                  
                  {ascensionRewards.modifiers.length > 0 && (
                    <div className="text-left">
                      <h4 className="text-lg font-bold text-purple-400 mb-3">Challenges Overcome:</h4>
                      <div className="space-y-2">
                        {ascensionRewards.modifiers.map((mod, idx) => (
                          <div key={idx} className="bg-black/40 rounded-lg p-3 border border-purple-500/30 text-sm">
                            <span className="font-bold" style={{ color: mod.color || '#ef4444' }}>
                              {mod.name}
                            </span>
                            <p className="text-gray-400 text-xs mt-1">{mod.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Pantheon Blessing Indicator */}
                  {ascensionRewards.modifiers.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-600 rounded-lg p-3">
                      <div className="flex items-center justify-center gap-2 text-yellow-400">
                        <Crown className="w-5 h-5" />
                        <span className="text-sm font-semibold">
                          Pantheon Blessing available at Divine Rank 1+
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 text-center mt-1">
                        Remove one modifier once per run to ease your journey
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

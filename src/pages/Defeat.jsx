
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skull, Crown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import RankEmblemParticles from '../components/game/RankEmblemParticles';
import RankEmblemGlow from '../components/game/RankEmblemGlow';

const RANK_TIERS = {
  0: { name: 'Mortal', color: '#6b7280', nextAt: 1 },
  1: { name: 'Ascendant I', color: '#3b82f6', nextAt: 3 },
  2: { name: 'Ascendant II', color: '#3b82f6', nextAt: 5 },
  3: { name: 'Ascendant III', color: '#3b82f6', nextAt: 8 },
  4: { name: 'Demi-God I', color: '#8b5cf6', nextAt: 12 },
  5: { name: 'Demi-God II', color: '#8b5cf6', nextAt: 16 },
  6: { name: 'Demi-God III', color: '#8b5cf6', nextAt: 20 },
  7: { name: 'Divine I', color: '#f59e0b', nextAt: 25 },
  8: { name: 'Divine II', color: '#f59e0b', nextAt: 30 },
  9: { name: 'Divine III', color: '#f59e0b', nextAt: 40 },
  10: { name: 'Eternal', color: '#fbbf24', nextAt: null },
};

export default function Defeat() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const godName = urlParams.get('god');
  const victories = urlParams.get('victories');
  const [divineRankData, setDivineRankData] = useState(null);
  const [rankProgression, setRankProgression] = useState(null);

  useEffect(() => {
    const checkProgress = async () => {
      try {
        const user = await base44.auth.me();
        const totalVictories = user.total_victories || 0;
        
        // Calculate rank progression - FIXED LOGIC
        let currentRankNum = 0;
        
        // Find the highest rank the player has unlocked based on total victories
        if (totalVictories >= 40) currentRankNum = 10;
        else if (totalVictories >= 30) currentRankNum = 9;
        else if (totalVictories >= 25) currentRankNum = 8;
        else if (totalVictories >= 20) currentRankNum = 7;
        else if (totalVictories >= 16) currentRankNum = 6;
        else if (totalVictories >= 12) currentRankNum = 5;
        else if (totalVictories >= 8) currentRankNum = 4;
        else if (totalVictories >= 5) currentRankNum = 3;
        else if (totalVictories >= 3) currentRankNum = 2;
        else if (totalVictories >= 1) currentRankNum = 1;
        else currentRankNum = 0;
        
        const currentRankInfo = RANK_TIERS[currentRankNum];
        const nextRankInfo = RANK_TIERS[currentRankNum + 1];
        
        // Calculate progress to next rank
        const victoriesAtCurrentRankStart = currentRankNum === 0 ? 0 : RANK_TIERS[currentRankNum - 1]?.nextAt || 0;
        const victoriesForNextRankGoal = currentRankInfo.nextAt; // This is the total victories needed to *reach* the next rank

        let progressPercent = 0;
        let victoriesNeeded = 0;

        if (nextRankInfo && victoriesForNextRankGoal !== null) {
          // If currentRankNum is 0 (Mortal), victoriesAtCurrentRankStart is 0.
          // If currentRankNum is 1 (Ascendant I), victoriesAtCurrentRankStart is 0 (from Mortal's nextAt-1, or just 0 for base).
          // To calculate progress within the current *segment* from currentRankNum to nextRankNum
          const victoriesInCurrentSegment = victoriesForNextRankGoal - victoriesAtCurrentRankStart;
          const victoriesAchievedInSegment = totalVictories - victoriesAtCurrentRankStart;

          if (victoriesInCurrentSegment > 0) { // Avoid division by zero
            progressPercent = (victoriesAchievedInSegment / victoriesInCurrentSegment) * 100;
          } else {
            progressPercent = 0; // Or 100 if currentRankNum is max and nextRankGoal is null
          }
          
          victoriesNeeded = victoriesForNextRankGoal - totalVictories;

        } else { // At the highest rank (Eternal)
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
        
        const urlParams = new URLSearchParams(window.location.search);
        const runId = urlParams.get('runId');
        
        if (runId) {
          // Check achievements
          const result = await base44.functions.invoke('checkAchievements', { runId });
          console.log('Defeat achievements checked:', result.data);
          
          // Get run data to show rank attempt
          const runs = await base44.entities.GameRun.filter({ id: runId });
          if (runs.length > 0 && runs[0].divine_rank > 0) {
            const rank = runs[0].divine_rank;
            
            const divineAttemptRankInfo = RANK_TIERS[rank] || { name: 'Unknown', color: '#6b7280' };

            setDivineRankData({ 
              tier: divineAttemptRankInfo.name.includes('I') || divineAttemptRankInfo.name.includes('II') || divineAttemptRankInfo.name.includes('III') ? 
                    divineAttemptRankInfo.name.split(' ')[0] : divineAttemptRankInfo.name,
              name: divineAttemptRankInfo.name, 
              number: rank,
              color: divineAttemptRankInfo.color,
              modifiers: runs[0].active_modifiers || []
            });
          }
        }
      } catch (error) {
        console.error('Error checking defeat progress:', error);
      }
    };

    checkProgress();
  }, []);
  
  const rankColor = divineRankData?.color || '#6b7280'; // Use color from divineRankData if available

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-black to-purple-950 p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-red-900/30 to-black/50 backdrop-blur-md border-red-500 border-2 p-12 text-center shadow-2xl">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-32 h-32 mx-auto mb-6"
            >
              <Skull className="w-full h-full text-red-500 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              DEFEATED
            </h1>
            
            <div className="text-white space-y-4 mb-8">
              <p className="text-2xl font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                <span className="text-red-300">{godName}</span> has fallen in battle
              </p>
              <p className="text-xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                Enemies Defeated: <span className="font-bold text-red-300">{victories}</span>
              </p>
              <p className="text-lg text-gray-300 font-medium drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                The divine power wanes... but legends never die.
              </p>
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
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold"
              >
                Try Again
              </Button>
              <Button
                onClick={() => navigate(createPageUrl('Home'))}
                size="lg"
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500/20"
              >
                Main Menu
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Rank Progression Card */}
        <AnimatePresence>
          {rankProgression && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card 
                className="backdrop-blur-md border-2 p-6 shadow-2xl"
                style={{
                  background: `linear-gradient(to br, ${rankProgression.currentColor}15, ${rankProgression.currentColor}05)`,
                  borderColor: `${rankProgression.currentColor}80`
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
                  
                  {rankProgression.next !== null ? (
                    <div>
                      <div className="flex justify-between text-sm text-gray-300 mb-2">
                        <span>{rankProgression.totalVictories} victories</span>
                        <span>{RANK_TIERS[rankProgression.current]?.nextAt} needed</span>
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
                      <p className="text-center text-sm text-yellow-400 mt-2 font-semibold">
                        {rankProgression.victoriesNeeded} more {rankProgression.victoriesNeeded === 1 ? 'victory' : 'victories'} to unlock {rankProgression.nextName}!
                      </p>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-yellow-400 mt-2 font-semibold">
                      You have reached the highest rank: {rankProgression.currentName}!
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divine Rank Attempt Card */}
        <AnimatePresence>
          {divineRankData && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card 
                className="backdrop-blur-md border-2 p-6 shadow-2xl overflow-hidden"
                style={{
                  background: `linear-gradient(to br, ${rankColor}15, ${rankColor}05)`,
                  borderColor: `${rankColor}80`
                }}
              >
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Crown className="w-6 h-6" style={{ color: rankColor }} />
                    <h2 className="text-xl font-bold text-white">Divine Rank Attempted</h2>
                  </div>
                  
                  {/* Enhanced Rank Emblem with Particles */}
                  <div className="relative w-20 h-20 mx-auto my-6">
                    <RankEmblemParticles 
                      rank={divineRankData.number} 
                      color={rankColor}
                      size="sm"
                    />
                    <div className="opacity-50">
                      <RankEmblemGlow
                        rank={divineRankData.number}
                        color={rankColor}
                        glow={rankColor + '80'}
                        size="sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-lg font-bold" style={{ color: rankColor }}>
                      {divineRankData.name}
                    </div>
                    <div className="text-sm text-gray-400">{divineRankData.tier} Tier</div>
                  </div>
                  
                  {divineRankData.modifiers && divineRankData.modifiers.length > 0 && (
                    <div className="text-left bg-black/40 rounded-lg p-4 border border-gray-700">
                      <h4 className="text-sm font-bold text-red-400 mb-2">Active Modifiers:</h4>
                      <div className="space-y-1">
                        {divineRankData.modifiers.map((mod, idx) => (
                          <div key={idx} className="text-xs text-gray-400">
                            • <span className="font-semibold" style={{ color: mod.color || '#ef4444' }}>{mod.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-400 italic">
                    The path to divinity is fraught with peril. Rise again, stronger.
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

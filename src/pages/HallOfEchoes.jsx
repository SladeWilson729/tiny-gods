
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, Coins, Gem, Trophy, Lock, Zap } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import RankEmblemParticles from '../components/game/RankEmblemParticles';
import RankEmblemGlow from '../components/game/RankEmblemGlow';
import CompanionLoadoutPanel from '../components/game/CompanionLoadoutPanel';
import {
  Heart, Shield, Skull, Droplet, Flame, Eye, Snowflake, TreeDeciduous, Star, Users
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RANK_TIERS = {
  0: { name: 'Mortal', color: '#6b7280', glow: 'rgba(107, 114, 128, 0.3)', intensity: 0 },
  1: { name: 'Ascendant I', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', intensity: 0.3 },
  2: { name: 'Ascendant II', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', intensity: 0.4 },
  3: { name: 'Ascendant III', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', intensity: 0.5 },
  4: { name: 'Demi-God I', color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)', intensity: 0.6 },
  5: { name: 'Demi-God II', color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)', intensity: 0.7 },
  6: { name: 'Demi-God III', color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)', intensity: 0.8 },
  7: { name: 'Divine I', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)', intensity: 0.85 },
  8: { name: 'Divine II', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)', intensity: 0.9 },
  9: { name: 'Divine III', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)', intensity: 0.95 },
  10: { name: 'Eternal', color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.8)', intensity: 1 },
};

const ICON_MAP = {
  Flame,
  Eye,
  Zap,
  Shield,
  Sparkles,
  Heart,
  Skull,
  Coins,
  Droplet,
  Snowflake,
  TreeDeciduous,
};

const RARITY_COLORS = {
  common: { border: '#6b7280', glow: 'rgba(107, 114, 128, 0.3)', text: 'text-gray-400' },
  rare: { border: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', text: 'text-blue-400' },
  epic: { border: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)', text: 'text-purple-400' },
  legendary: { border: '#fbbf24', glow: 'rgba(251, 191, 36, 0.6)', text: 'text-yellow-400' },
};

const ParticleEffect = ({ rankIntensity }) => {
  const particleCount = Math.floor(rankIntensity * 30);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: particleCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-yellow-400 rounded-full"
          initial={{
            x: Math.random() * 100 + '%',
            y: '100%',
            opacity: 0
          }}
          animate={{
            y: '-10%',
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
};

export default function HallOfEchoes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [allGods, setAllGods] = useState([]); // Renamed from 'gods' to 'allGods'
  const [godRunsCompleted, setGodRunsCompleted] = useState({}); // New state for god runs
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGod, setSelectedGod] = useState(null);
  const [companions, setCompanions] = useState([]);
  const [unlockedCompanions, setUnlockedCompanions] = useState([]);
  const [showCompanionLoadout, setShowCompanionLoadout] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const godsList = await base44.entities.God.list(); // Renamed local variable
      // Filter out Zeus, Odin, Cthulhu, and Hades
      const availableGods = godsList.filter(god =>
        god.name !== 'Zeus' &&
        god.name !== 'Odin' &&
        god.name !== 'Cthulhu' &&
        god.name !== 'Hades'
      );
      setAllGods(availableGods); // Set to new state variable

      // Load companions
      const companionsList = await base44.entities.Companion.list();
      setCompanions(companionsList);
      setUnlockedCompanions(userData.unlocked_companions || []);

      const completedGodsCount = userData.god_runs_completed || {};
      setGodRunsCompleted(completedGodsCount); // Set to new state variable

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate current rank based on total victories (FIXED)
  const totalVictories = user?.total_victories || 0;
  let currentRank = 0;
  
  if (totalVictories >= 40) currentRank = 10;
  else if (totalVictories >= 30) currentRank = 9;
  else if (totalVictories >= 25) currentRank = 8;
  else if (totalVictories >= 20) currentRank = 7;
  else if (totalVictories >= 16) currentRank = 6;
  else if (totalVictories >= 12) currentRank = 5;
  else if (totalVictories >= 8) currentRank = 4;
  else if (totalVictories >= 5) currentRank = 3;
  else if (totalVictories >= 3) currentRank = 2;
  else if (totalVictories >= 1) currentRank = 1;
  else currentRank = 0;
  
  const rankInfo = RANK_TIERS[currentRank] || RANK_TIERS[0];
  const nextRankInfo = RANK_TIERS[currentRank + 1];

  // Calculate next rank requirements
  const nextRankRequirement = nextRankInfo ?
    (currentRank === 0 ? 1 :
     currentRank === 1 ? 3 :
     currentRank === 2 ? 5 :
     currentRank === 3 ? 8 :
     currentRank === 4 ? 12 :
     currentRank === 5 ? 16 :
     currentRank === 6 ? 20 :
     currentRank === 7 ? 25 :
     currentRank === 8 ? 30 :
     currentRank === 9 ? 40 : null) : null;

  const victoriesNeeded = nextRankRequirement ? nextRankRequirement - totalVictories : 0;

  const isCompanionUnlocked = (companion) => {
    if (companion.unlock_condition === 'tutorial_complete') return true;
    if (companion.unlock_condition === 'favor_tokens_cost') {
      return unlockedCompanions.includes(companion.id);
    }
    if (companion.unlock_condition?.startsWith('divine_rank_')) {
      const requiredRank = parseInt(companion.unlock_condition.split('_')[2]);
      return currentRank >= requiredRank; // Use the newly calculated currentRank
    }
    return unlockedCompanions.includes(companion.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-black relative overflow-hidden p-6">
      {/* Particle effects for high ranks */}
      {rankInfo.intensity > 0.5 && <ParticleEffect rankIntensity={rankInfo.intensity} />}

      <CompanionLoadoutPanel
        open={showCompanionLoadout}
        onClose={() => setShowCompanionLoadout(false)}
        onLoadoutChanged={loadData} // Ensure data is reloaded when loadout changes
      />

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-300">
            Hall of Echoes
          </h1>
          <p className="text-2xl text-purple-200 mb-2">
            Where legends ascend to divinity
          </p>
          <p className="text-gray-400 italic">
            Your divine achievements echo through eternity
          </p>
        </motion.div>

        {/* Action Buttons below header, before main content */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-12 flex justify-center gap-4 flex-wrap"
        >
            <Button
                onClick={() => setShowCompanionLoadout(true)}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8"
            >
                <Users className="w-5 h-5 mr-2" />
                Manage Companions
            </Button>
            <Button
                onClick={() => navigate(createPageUrl('GodSelection'))}
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-bold px-8"
            >
                <Zap className="w-5 h-5 mr-2" />
                Embark on New Run
            </Button>
            <Button
                onClick={() => navigate(createPageUrl('Achievements'))}
                size="lg"
                variant="outline"
                className="border-purple-500 text-purple-400 hover:bg-purple-500/20"
            >
                <Trophy className="w-5 h-5 mr-2" />
                View Achievements
            </Button>
        </motion.div>


        {isLoading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-16 h-16 animate-spin text-amber-400 mx-auto mb-4" />
              <p className="text-white text-xl">Entering the Hall of Echoes...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="gods" className="space-y-8">
            <TabsList className="bg-black/60 backdrop-blur-md border border-purple-700 grid w-full grid-cols-2">
              <TabsTrigger value="gods" className="data-[state=active]:bg-purple-600">
                <Crown className="w-4 h-4 mr-2" />
                Divine Pantheon
              </TabsTrigger>
              <TabsTrigger value="companions" className="data-[state=active]:bg-pink-600">
                <Users className="w-4 h-4 mr-2" />
                Divine Companions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gods">
              {/* Player Rank Display */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <Card
                  className="backdrop-blur-md border-2 p-8 shadow-2xl relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${rankInfo.color}20, ${rankInfo.color}05)`,
                    borderColor: rankInfo.color
                  }}
                >
                  <div className="absolute inset-0 opacity-10">
                    <div
                      className="absolute inset-0 animate-pulse"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${rankInfo.glow}, transparent 70%)`
                      }}
                    />
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    {/* Rank Badge */}
                    <div className="relative w-40 h-40">
                      <RankEmblemParticles
                        rank={currentRank}
                        color={rankInfo.color}
                        size="xl"
                      />
                      <RankEmblemGlow
                        rank={currentRank}
                        color={rankInfo.color}
                        glow={rankInfo.glow}
                        size="xl"
                      />
                    </div>

                    {/* Rank Info */}
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-4xl font-bold mb-2" style={{ color: rankInfo.color }}>
                        {rankInfo.name}
                      </h2>
                      <p className="text-2xl text-gray-300 mb-4">
                        {totalVictories} Total Victories
                      </p>

                      {nextRankInfo && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-lg">
                            <span className="text-gray-400">Next Rank:</span>
                            <span className="font-bold" style={{ color: nextRankInfo.color }}>
                              {nextRankInfo.name}
                            </span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-6 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (totalVictories / nextRankRequirement) * 100)}%` }}
                              transition={{ duration: 1.5, delay: 0.5 }}
                              className="h-full rounded-full flex items-center justify-end pr-2"
                              style={{
                                background: `linear-gradient(to right, ${rankInfo.color}, ${nextRankInfo.color})`
                              }}
                            >
                              {victoriesNeeded <= 5 && (
                                <span className="text-xs font-bold text-white drop-shadow-lg">
                                  {victoriesNeeded} more!
                                </span>
                              )}
                            </motion.div>
                          </div>
                          {victoriesNeeded > 0 && (
                            <p className="text-yellow-400 font-semibold">
                              {victoriesNeeded} {victoriesNeeded === 1 ? 'victory' : 'victories'} until next rank
                            </p>
                          )}
                        </div>
                      )}

                      {!nextRankInfo && (
                        <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500 rounded-lg p-4 mt-4">
                          <div className="flex items-center justify-center gap-3">
                            <Crown className="w-8 h-8 text-yellow-400" />
                            <span className="text-2xl font-bold text-yellow-400">
                              MAXIMUM RANK ACHIEVED
                            </span>
                            <Crown className="w-8 h-8 text-yellow-400" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Currency Display */}
                    <div className="flex flex-col gap-4">
                      <Card className="bg-black/60 p-4 border-yellow-600">
                        <div className="flex items-center gap-3">
                          <Coins className="w-8 h-8 text-yellow-400" />
                          <div>
                            <div className="text-3xl font-bold text-yellow-400">
                              {user?.favor_tokens || 0}
                            </div>
                            <div className="text-sm text-gray-300">Favor Tokens</div>
                          </div>
                        </div>
                      </Card>
                      <Card className="bg-black/60 p-4 border-cyan-600">
                        <div className="flex items-center gap-3">
                          <Gem className="w-8 h-8 text-cyan-400" />
                          <div>
                            <div className="text-3xl font-bold text-cyan-400">
                              {user?.essence_crystals || 0}
                            </div>
                            <div className="text-sm text-gray-300">Essence Crystals</div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* God Statues */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-3xl font-bold text-amber-400 mb-6 flex items-center gap-3">
                  <Trophy className="w-8 h-8" />
                  Pantheon of Champions
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {allGods.map((god, index) => { // Use allGods here
                    const godRuns = godRunsCompleted?.[god.name] || 0; // Use godRunsCompleted here
                    const godIntensity = Math.min(godRuns / 20, 1); // Max glow at 20 runs
                    const hasRuns = godRuns > 0;

                    return (
                      <motion.div
                        key={god.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        onClick={() => setSelectedGod(god)}
                        className="cursor-pointer"
                      >
                        <Card
                          className={`relative overflow-hidden border-2 transition-all duration-300 ${
                            hasRuns ? 'border-amber-500' : 'border-gray-700'
                          }`}
                          style={{
                            boxShadow: hasRuns ? `0 0 ${30 * godIntensity}px rgba(251, 191, 36, ${godIntensity})` : 'none'
                          }}
                        >
                          {/* Glow effect overlay */}
                          {hasRuns && (
                            <motion.div
                              className="absolute inset-0 pointer-events-none"
                              animate={{
                                opacity: [godIntensity * 0.3, godIntensity * 0.6, godIntensity * 0.3]
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                              style={{
                                background: `radial-gradient(circle at center, rgba(251, 191, 36, ${godIntensity}), transparent 70%)`
                              }}
                            />
                          )}

                          {/* God Image */}
                          <div className="relative aspect-[3/4]">
                            <img
                              src={god.image}
                              alt={god.name}
                              className={`w-full h-full object-cover ${!hasRuns ? 'grayscale opacity-40' : ''}`}
                            />

                            {/* Lock overlay for unused gods */}
                            {!hasRuns && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Lock className="w-12 h-12 text-gray-500" />
                              </div>
                            )}

                            {/* Eternal rank particle effect */}
                            {godIntensity === 1 && (
                              <div className="absolute inset-0 pointer-events-none">
                                {Array.from({ length: 10 }).map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                                    initial={{
                                      x: '50%',
                                      y: '50%',
                                      opacity: 0
                                    }}
                                    animate={{
                                      x: `${50 + (Math.cos(i * (Math.PI * 2 / 10)) * 100)}%`,
                                      y: `${50 + (Math.sin(i * (Math.PI * 2 / 10)) * 100)}%`,
                                      opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      delay: i * 0.2
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* God Info */}
                          <div className="p-3 bg-black/80">
                            <h3 className={`font-bold text-center mb-1 ${hasRuns ? 'text-amber-400' : 'text-gray-500'}`}>
                              {god.name}
                            </h3>
                            <div className="text-center">
                              {hasRuns ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Trophy className="w-4 h-4 text-yellow-400" />
                                  <span className="text-sm text-yellow-400 font-bold">
                                    {godRuns} {godRuns === 1 ? 'run' : 'runs'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">Not yet conquered</span>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="companions">
              <h2 className="text-3xl font-bold text-pink-400 mb-6 flex items-center gap-3">
                <Users className="w-8 h-8" />
                Divine Companions
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companions.map((companion, index) => {
                  const unlocked = isCompanionUnlocked(companion);
                  const Icon = ICON_MAP[companion.icon_name] || Star;
                  const rarityStyle = RARITY_COLORS[companion.rarity] || RARITY_COLORS.common;
                  const bondLevel = user?.companion_bond_levels?.[companion.id] || 0;

                  return (
                    <motion.div
                      key={companion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={`bg-black/40 border-2 p-6 transition-all ${
                          unlocked ? 'hover:scale-105' : 'opacity-60'
                        }`}
                        style={{
                          borderColor: unlocked ? rarityStyle.border : '#374151',
                          boxShadow: unlocked ? `0 0 20px ${rarityStyle.glow}` : 'none'
                        }}
                      >
                        <div className="flex flex-col items-center text-center">
                          {/* Icon */}
                          <div
                            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                            style={{
                              background: unlocked ? `radial-gradient(circle, ${rarityStyle.border}, ${rarityStyle.border}40)` : '#1f2937',
                              border: `3px solid ${unlocked ? rarityStyle.border : '#374151'}`
                            }}
                          >
                            <Icon className={`w-10 h-10 ${unlocked ? rarityStyle.text : 'text-gray-600'}`} />
                          </div>

                          {/* Name & Rarity */}
                          <h3 className={`text-xl font-bold mb-2 ${unlocked ? 'text-white' : 'text-gray-500'}`}>
                            {companion.name}
                          </h3>
                          <div className={`text-xs ${unlocked ? rarityStyle.text : 'text-gray-600'} mb-3 capitalize`}>
                            {companion.rarity} • {companion.archetype}
                          </div>

                          {/* Description */}
                          <p className={`text-sm mb-4 ${unlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                            {companion.description}
                          </p>

                          {/* Base Effect */}
                          {unlocked && (
                            <div className="w-full bg-purple-900/40 rounded p-3 mb-3 border border-purple-700">
                              <div className="text-xs text-purple-300 font-bold mb-1">Base Effect:</div>
                              <div className="text-xs text-gray-300">
                                {companion.base_effect.effect_type.replace(/_/g, ' ')}
                              </div>
                            </div>
                          )}

                          {/* Bond Level */}
                          {unlocked && bondLevel > 0 && (
                            <div className="flex items-center gap-2 text-pink-400">
                              <Heart className="w-4 h-4" />
                              <span className="text-sm font-bold">Bond Level {bondLevel}</span>
                            </div>
                          )}

                          {/* Locked Status */}
                          {!unlocked && (
                            <div className="text-xs text-red-400 mt-2">
                              {companion.unlock_condition === 'favor_tokens_cost'
                                ? `${companion.unlock_cost} Favor Tokens`
                                : companion.unlock_condition?.replace(/_/g, ' ')}
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* God Detail Modal */}
      <AnimatePresence>
        {selectedGod && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedGod(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full"
            >
              <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-amber-500 p-8">
                <div className="flex gap-6">
                  <img
                    src={selectedGod.image}
                    alt={selectedGod.name}
                    className="w-48 h-64 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h2 className="text-4xl font-bold text-amber-400 mb-4">
                      {selectedGod.name}
                    </h2>
                    <p className="text-gray-300 mb-4">{selectedGod.description}</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        <span className="text-white font-bold">
                          {godRunsCompleted?.[selectedGod.name] || 0} completed runs {/* Use godRunsCompleted here */}
                        </span>
                      </div>
                      <div className="bg-black/40 rounded-lg p-3 border border-amber-600/30">
                        <div className="text-amber-400 font-bold mb-2">Static Ability:</div>
                        <p className="text-sm text-gray-300">{selectedGod.static_ability}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedGod(null);
                        navigate(createPageUrl('GodSelection'));
                      }}
                      className="mt-6 w-full bg-gradient-to-r from-amber-600 to-yellow-600"
                    >
                      Play as {selectedGod.name}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

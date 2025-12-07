
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Lock, Trophy, Award, Star, Crown, Swords, Shield, Sparkles, Coins, Target, Flame, Heart, Zap, CheckCircle, CircleDot, Crosshair, Skull, Mountain, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Icon mapping for dynamic icon selection
const ICON_MAP = {
  Trophy,
  Award,
  Star,
  Crown,
  Swords,
  Shield,
  Sparkles,
  Coins,
  Target,
  Flame,
  Heart,
  Zap,
  CheckCircle,
  CircleDot,
  Crosshair,
  Skull,
  Mountain,
  Flag,
  Lock
};

export default function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    setIsLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Load all achievements
      const allAchievements = await base44.entities.Achievement.list();
      
      // Load user's achievement progress
      const userProgress = await base44.entities.UserAchievement.filter({
        user_id: userData.id
      });

      setAchievements(allAchievements);
      setUserAchievements(userProgress);
    } catch (error) {
      console.error("Failed to load achievements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserAchievement = (achievementId) => {
    return userAchievements.find(ua => ua.achievement_id === achievementId);
  };

  const getAchievementProgress = (achievement) => {
    const userProgress = getUserAchievement(achievement.id);
    
    if (!userProgress) {
      return { current: 0, max: achievement.criteria_value, percentage: 0, isUnlocked: false };
    }

    const current = userProgress.is_unlocked 
      ? achievement.criteria_value 
      : (userProgress.progress_current || 0);
    
    const max = achievement.criteria_value;
    const percentage = max > 0 ? Math.round((current / max) * 100) : 0;

    return {
      current,
      max,
      percentage: Math.min(percentage, 100),
      isUnlocked: userProgress.is_unlocked || false
    };
  };

  const getCategories = () => {
    const cats = new Set(['All']);
    achievements.forEach(a => cats.add(a.category || 'General'));
    return Array.from(cats);
  };

  const getFilteredAchievements = () => {
    if (selectedCategory === 'All') return achievements;
    return achievements.filter(a => (a.category || 'General') === selectedCategory);
  };

  const getStats = () => {
    const unlocked = userAchievements.filter(ua => ua.is_unlocked).length;
    const total = achievements.length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    
    return { unlocked, total, percentage };
  };

  const getIcon = (iconName) => {
    return ICON_MAP[iconName] || Trophy;
  };

  const getRewardIcon = (rewardType) => {
    switch (rewardType) {
      case 'coins': return Coins;
      case 'points': return Star; // Added for achievement points
      case 'relic_unlock': return Sparkles;
      case 'cosmetic_unlock': return Star;
      case 'god_unlock': return Crown;
      default: return Award;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Progression': return Trophy;
      case 'God Specific': return Crown;
      case 'Challenge': return Swords;
      case 'Combat': return Shield;
      default: return Award;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-6 flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-purple-400" />
      </div>
    );
  }

  const stats = getStats();
  const categories = getCategories();
  const filteredAchievements = getFilteredAchievements();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-block bg-black/70 backdrop-blur-md rounded-2xl p-6 border-2 border-purple-500/50 shadow-2xl">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-12 h-12 text-yellow-400" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">Achievements</h1>
              <Trophy className="w-12 h-12 text-yellow-400" />
            </div>
            <p className="text-xl text-purple-300 mb-4">Track your legendary accomplishments</p>
            
            {/* Progress Summary */}
            <div className="bg-black/60 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">Overall Progress</span>
                <span className="text-2xl font-bold text-yellow-400">
                  {stats.unlocked} / {stats.total}
                </span>
              </div>
              <Progress value={stats.percentage} className="h-3" />
              <p className="text-sm text-purple-300">{stats.percentage}% Complete</p>
              
              {/* Achievement Points Display */}
              {user && (
                <div className="flex items-center justify-center gap-2 pt-2 border-t border-purple-700">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-lg font-bold text-yellow-300">
                    {user.achievement_points || 0} Achievement Points
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Category Filters */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex flex-wrap gap-2 bg-black/60 backdrop-blur-md rounded-xl p-3 border border-purple-700">
            {categories.map(category => {
              const Icon = getCategoryIcon(category);
              const count = category === 'All' 
                ? achievements.length 
                : achievements.filter(a => (a.category || 'General') === category).length;
              
              return (
                <Button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  className={`${
                    selectedCategory === category
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-transparent border-purple-500 text-purple-300 hover:bg-purple-500/20'
                  }`}
                  size="sm"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {category} ({count})
                </Button>
              );
            })}
          </div>
        </div>

        {/* Achievements Grid */}
        <motion.div
          layout
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredAchievements.map((achievement, index) => {
              const progress = getAchievementProgress(achievement);
              const isSecret = achievement.is_secret && !progress.isUnlocked;
              const Icon = getIcon(achievement.icon_name);
              const RewardIcon = getRewardIcon(achievement.reward_type);

              return (
                <motion.div
                  key={achievement.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className={`relative overflow-hidden transition-all ${
                    progress.isUnlocked
                      ? 'bg-gradient-to-br from-yellow-900/40 to-purple-900/40 border-yellow-500 shadow-lg shadow-yellow-500/20'
                      : 'bg-black/40 border-purple-800 opacity-70'
                  }`}>
                    {progress.isUnlocked && (
                      <div className="absolute top-0 right-0 bg-yellow-500 text-black px-3 py-1 rounded-bl-lg font-bold text-xs flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        UNLOCKED
                      </div>
                    )}

                    {isSecret && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                        <Lock className="w-16 h-16 text-purple-500 mb-3" />
                        <p className="text-purple-300 font-bold text-lg">Secret Achievement</p>
                        <p className="text-gray-400 text-sm">Complete specific tasks to reveal</p>
                      </div>
                    )}

                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${
                          progress.isUnlocked ? 'bg-yellow-500/20' : 'bg-purple-900/30'
                        }`}>
                          <Icon className={`w-8 h-8 ${
                            progress.isUnlocked ? 'text-yellow-400' : 'text-purple-500'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className={`text-xl ${
                            progress.isUnlocked ? 'text-yellow-300' : 'text-purple-300'
                          }`}>
                            {achievement.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs border-purple-500 text-purple-300">
                              {achievement.category || 'General'}
                            </Badge>
                            {!isSecret && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs font-bold ${
                                  progress.isUnlocked 
                                    ? 'border-yellow-500 text-yellow-400' 
                                    : 'border-blue-500 text-blue-400'
                                }`}
                              >
                                {progress.percentage}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-300">
                        {achievement.description}
                      </p>

                      {/* Reward Display */}
                      {achievement.reward_type !== 'none' && achievement.reward_value && (
                        <div className="flex items-center gap-2 bg-black/40 rounded-lg p-2">
                          <RewardIcon className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-yellow-300 font-semibold">
                            Reward: {achievement.reward_value}
                            {achievement.reward_type === 'coins' && ' Coins'}
                            {achievement.reward_type === 'points' && ' Points'}
                          </span>
                        </div>
                      )}

                      {/* Progress Bar with Percentage */}
                      {!isSecret && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span className="font-semibold">
                              {progress.isUnlocked ? 'Completed!' : 'Progress'}
                            </span>
                            <span className={`font-bold ${
                              progress.isUnlocked ? 'text-yellow-400' : 'text-blue-400'
                            }`}>
                              {progress.current} / {progress.max}
                            </span>
                          </div>
                          <div className="relative">
                            <Progress 
                              value={progress.percentage} 
                              className={`h-3 ${
                                progress.isUnlocked 
                                  ? '[&>div]:bg-gradient-to-r [&>div]:from-yellow-500 [&>div]:to-orange-500' 
                                  : '[&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-500'
                              }`}
                            />
                            {progress.percentage > 15 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white drop-shadow-lg">
                                  {progress.percentage}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Unlock Date */}
                      {progress.isUnlocked && getUserAchievement(achievement.id)?.unlocked_date && (
                        <p className="text-xs text-gray-400 italic">
                          Unlocked: {new Date(getUserAchievement(achievement.id).unlocked_date).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-purple-500 mx-auto mb-4 opacity-50" />
            <p className="text-xl text-purple-300">No achievements in this category yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

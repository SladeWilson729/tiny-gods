
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  Target, Loader2, Trophy, Coins, Gem, CheckCircle, Clock,
  Flame, Swords, Heart, Shield, Award, Crown, Calendar, CalendarRange
} from 'lucide-react';

const DIFFICULTY_COLORS = {
  easy: { bg: 'bg-green-600', text: 'text-green-400', border: 'border-green-500' },
  medium: { bg: 'bg-yellow-600', text: 'text-yellow-400', border: 'border-yellow-500' },
  hard: { bg: 'bg-red-600', text: 'text-red-400', border: 'border-red-500' }
};

const ICON_MAP = {
  Target, Trophy, Coins, Gem, CheckCircle, Clock, Flame,
  Swords, Heart, Shield, Award, Crown, Calendar, CalendarRange
};

export default function Quests() {
  const [user, setUser] = useState(null);
  const [allQuests, setAllQuests] = useState([]);
  const [userQuests, setUserQuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const questsList = await base44.entities.Quest.filter({ is_active: true }, 'display_order');
      setAllQuests(questsList);

      // Check if quest rotation is needed
      const rotatedUser = await rotateQuestsIfNeeded(userData, questsList);
      if (rotatedUser) {
        setUser(rotatedUser);
      }

      const userQuestsList = await base44.entities.UserQuest.filter({ user_email: userData.email });
      setUserQuests(userQuestsList);
    } catch (error) {
      console.error('Failed to load quests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const rotateQuestsIfNeeded = async (userData, questsList) => {
    const now = new Date();
    let needsUpdate = false;
    const updates = {};

    // Check daily quest rotation (every 24 hours)
    const lastDailyReset = userData.last_daily_quest_reset ? new Date(userData.last_daily_quest_reset) : null;
    const allDailyQuests = questsList.filter(q => q.quest_type === 'daily');

    // Only rotate if there are actual daily quests to choose from
    if (allDailyQuests.length > 0) {
      if (!lastDailyReset || (now - lastDailyReset) >= 24 * 60 * 60 * 1000 || !userData.active_daily_quest_ids || userData.active_daily_quest_ids.length === 0) {
        // Rotate daily quests
        const shuffled = [...allDailyQuests].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(3, shuffled.length)).map(q => q.id);
        updates.active_daily_quest_ids = selected;
        updates.last_daily_quest_reset = now.toISOString();
        needsUpdate = true;
        console.log('[Quests] Rotated daily quests:', selected);
      }
    } else {
        // If no daily quests available, ensure active_daily_quest_ids is empty
        if (userData.active_daily_quest_ids && userData.active_daily_quest_ids.length > 0) {
            updates.active_daily_quest_ids = [];
            needsUpdate = true;
        }
    }


    // Check weekly quest rotation (every 7 days)
    const lastWeeklyReset = userData.last_weekly_quest_reset ? new Date(userData.last_weekly_quest_reset) : null;
    const allWeeklyQuests = questsList.filter(q => q.quest_type === 'weekly');

    // Only rotate if there are actual weekly quests to choose from
    if (allWeeklyQuests.length > 0) {
        if (!lastWeeklyReset || (now - lastWeeklyReset) >= 7 * 24 * 60 * 60 * 1000 || !userData.active_weekly_quest_ids || userData.active_weekly_quest_ids.length === 0) {
            // Rotate weekly quests
            const shuffled = [...allWeeklyQuests].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, Math.min(3, shuffled.length)).map(q => q.id);
            updates.active_weekly_quest_ids = selected;
            updates.last_weekly_quest_reset = now.toISOString();
            needsUpdate = true;
            console.log('[Quests] Rotated weekly quests:', selected);
        }
    } else {
        // If no weekly quests available, ensure active_weekly_quest_ids is empty
        if (userData.active_weekly_quest_ids && userData.active_weekly_quest_ids.length > 0) {
            updates.active_weekly_quest_ids = [];
            needsUpdate = true;
        }
    }

    if (needsUpdate) {
      const updatedUser = await base44.auth.updateMe(updates);
      return { ...userData, ...updates }; // Return merged object as base44.auth.updateMe doesn't return full user object
    }

    return null;
  };

  const handleClaimReward = async (userQuestId) => {
    if (isClaiming) return;

    setIsClaiming(userQuestId);
    try {
      const response = await base44.functions.invoke('claimQuestReward', {
        userQuestId
      });

      if (response.data.success) {
        alert(`✅ Quest Completed!\n\n+${response.data.rewards.favor} Favor Tokens\n+${response.data.rewards.essence} Essence Crystals`);
        await loadData(); // Reload all data after claiming
      }
    } catch (error) {
      console.error('Failed to claim reward:', error);
      alert('Failed to claim reward. Please try again.');
    } finally {
      setIsClaiming(null);
    }
  };

  const getQuestProgress = (quest) => {
    const userQuest = userQuests.find(uq => uq.quest_id === quest.id);
    return userQuest || { progress: 0, is_completed: false, is_claimed: false };
  };

  // This function is for individual quest expiration times, if applicable
  const getQuestExpirationTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;

    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  // This function is for general quest type rotation timers
  const getTimeRemaining = (questType, userData) => {
    if (!userData) return null;

    let resetDate;
    let resetInterval;

    if (questType === 'daily') {
      resetDate = userData.last_daily_quest_reset ? new Date(userData.last_daily_quest_reset) : null;
      resetInterval = 24 * 60 * 60 * 1000; // 24 hours
    } else if (questType === 'weekly') {
      resetDate = userData.last_weekly_quest_reset ? new Date(userData.last_weekly_quest_reset) : null;
      resetInterval = 7 * 24 * 60 * 60 * 1000; // 7 days
    } else {
      return null; // Permanent quests don't have a reset timer
    }

    if (!resetDate) return "Loading reset time...";

    const now = new Date();
    const nextReset = new Date(resetDate.getTime() + resetInterval);
    const msRemaining = nextReset - now;

    if (msRemaining <= 0) return 'Quests rotating now!';

    const totalSeconds = Math.floor(msRemaining / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    let timeString = '';
    if (days > 0) {
      timeString += `${days}d `;
    }
    if (hours > 0 || days > 0) { // Show hours if days exist, or if it's the largest unit
      timeString += `${hours}h `;
    }
    if (minutes > 0 || hours > 0 || days > 0) { // Show minutes if hours exist, or if it's the largest unit
      timeString += `${minutes}m `;
    }
    timeString += `${seconds}s`;

    return `Resets in ${timeString}`;
  };

  const renderQuest = (quest, index) => {
    const progress = getQuestProgress(quest);
    const Icon = ICON_MAP[quest.icon_name] || Target;
    const difficultyStyle = DIFFICULTY_COLORS[quest.difficulty];
    const progressPercent = Math.min((progress.progress / quest.objective_value) * 100, 100);
    const timeRemaining = getQuestExpirationTimeRemaining(progress.expires_at); // Using the original individual quest timer

    return (
      <motion.div
        key={quest.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className={`bg-black/40 border-2 ${progress.is_completed ? 'border-green-500' : 'border-purple-800'} hover:bg-purple-900/20 transition-all`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`${difficultyStyle.bg} p-3 rounded-lg flex-shrink-0`}>
                <Icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-white">{quest.title}</h3>
                    <p className="text-gray-300 text-sm mt-1">{quest.description}</p>
                  </div>
                  <span className={`text-xs ${difficultyStyle.text} uppercase font-bold px-2 py-1 ${difficultyStyle.bg} rounded`}>
                    {quest.difficulty}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Progress: {progress.progress} / {quest.objective_value}</span>
                    <span>{Math.floor(progressPercent)}%</span>
                  </div>
                  <div className="h-3 bg-black/60 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${progress.is_completed ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                    />
                  </div>
                </div>

                {/* Rewards */}
                <div className="flex items-center gap-4 mb-3">
                  {quest.reward_favor > 0 && (
                    <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-bold">{quest.reward_favor}</span>
                    </div>
                  )}
                  {quest.reward_essence > 0 && (
                    <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg">
                      <Gem className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-400 font-bold">{quest.reward_essence}</span>
                    </div>
                  )}
                  {timeRemaining && (
                    <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg ml-auto">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">{timeRemaining}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {progress.is_completed && !progress.is_claimed ? (
                  <Button
                    onClick={() => handleClaimReward(progress.id)}
                    disabled={isClaiming === progress.id}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isClaiming === progress.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <Trophy className="w-4 h-4 mr-2" />
                        Claim Reward
                      </>
                    )}
                  </Button>
                ) : progress.is_claimed ? (
                  <div className="flex items-center justify-center gap-2 text-green-400 font-bold">
                    <CheckCircle className="w-5 h-5" />
                    Completed
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white text-xl">Loading Quests...</p>
        </div>
      </div>
    );
  }

  // Filter quests to show only active ones based on user's active IDs
  const activeDailyQuests = user?.active_daily_quest_ids
    ? allQuests.filter(q => user.active_daily_quest_ids.includes(q.id))
    : [];

  const activeWeeklyQuests = user?.active_weekly_quest_ids
    ? allQuests.filter(q => user.active_weekly_quest_ids.includes(q.id))
    : [];

  const permanentQuests = allQuests.filter(q => q.quest_type === 'permanent');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-8 border-2 border-purple-500/50 shadow-2xl">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Target className="w-12 h-12 text-purple-400" />
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Quests
              </h1>
            </div>
            <p className="text-xl text-purple-200 mb-4">
              Complete objectives to earn rewards
            </p>

            {/* Currency Display */}
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 bg-black/60 px-6 py-3 rounded-full border border-yellow-600">
                <Coins className="w-6 h-6 text-yellow-400" />
                <span className="text-2xl font-bold text-yellow-400">
                  {user?.favor_tokens || 0}
                </span>
                <span className="text-sm text-gray-300">Favor Tokens</span>
              </div>
              <div className="flex items-center gap-2 bg-black/60 px-6 py-3 rounded-full border border-cyan-600">
                <Gem className="w-6 h-6 text-cyan-400" />
                <span className="text-2xl font-bold text-cyan-400">
                  {user?.essence_crystals || 0}
                </span>
                <span className="text-sm text-gray-300">Essence Crystals</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quest Tabs */}
        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="bg-black/60 backdrop-blur-md border border-purple-700 grid w-full grid-cols-3">
            <TabsTrigger value="daily" className="data-[state=active]:bg-purple-600">
              <Calendar className="w-4 h-4 mr-2" />
              Daily Quests
            </TabsTrigger>
            <TabsTrigger value="weekly" className="data-[state=active]:bg-purple-600">
              <CalendarRange className="w-4 h-4 mr-2" />
              Weekly Quests
            </TabsTrigger>
            <TabsTrigger value="permanent" className="data-[state=active]:bg-purple-600">
              <Trophy className="w-4 h-4 mr-2" />
              Permanent Quests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            {activeDailyQuests.length === 0 ? (
              <Card className="bg-black/40 border-purple-800 p-12 text-center">
                <Calendar className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">No Daily Quests Available</h3>
                <p className="text-gray-400">Check back tomorrow for new daily challenges!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {user?.last_daily_quest_reset && (
                  <div className="bg-black/40 border border-purple-700 rounded-lg p-4 text-center">
                    <p className="text-purple-300 text-sm">
                      ⏰ {getTimeRemaining('daily', user)}
                    </p>
                  </div>
                )}
                {activeDailyQuests.map((quest, index) => renderQuest(quest, index))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="weekly">
            {activeWeeklyQuests.length === 0 ? (
              <Card className="bg-black/40 border-purple-800 p-12 text-center">
                <CalendarRange className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">No Weekly Quests Available</h3>
                <p className="text-gray-400">Check back next week for new weekly challenges!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {user?.last_weekly_quest_reset && (
                  <div className="bg-black/40 border border-purple-700 rounded-lg p-4 text-center">
                    <p className="text-purple-300 text-sm">
                      ⏰ {getTimeRemaining('weekly', user)}
                    </p>
                  </div>
                )}
                {activeWeeklyQuests.map((quest, index) => renderQuest(quest, index))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="permanent">
            {permanentQuests.length === 0 ? (
              <Card className="bg-black/40 border-purple-800 p-12 text-center">
                <Trophy className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">No Permanent Quests Available</h3>
                <p className="text-gray-400">Complete daily and weekly quests to earn rewards!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {permanentQuests.map((quest, index) => renderQuest(quest, index))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

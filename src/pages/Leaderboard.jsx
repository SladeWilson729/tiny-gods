import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Medal, Award, Loader2, Crown, RefreshCw, User, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});
  const [profileFrames, setProfileFrames] = useState({});
  const [equippedTitles, setEquippedTitles] = useState({});
  const [activeTab, setActiveTab] = useState('victories');

  const loadLeaderboard = async () => {
    try {
      const me = await base44.auth.me();
      setCurrentUser(me);
      setIsAdmin(me?.role === 'admin');
      
      const allEntries = await base44.entities.LeaderboardEntry.list('-total_victories', 1000);
      setEntries(allEntries);

      // Fetch all user profiles to get profile pictures, equipped frames, and titles
      const allUsers = await base44.entities.User.list();
      const profileMap = {};
      const frameMap = {};
      const titleIdsToFetch = new Set();
      const titleMap = {};
      
      // Get all profile frame cosmetics
      const allCosmetics = await base44.entities.CosmeticReward.filter({ category: 'profile_frame' });
      
      allUsers.forEach(user => {
        profileMap[user.email] = {
          profile_picture: user.profile_picture,
          full_name: user.full_name
        };
        
        // Check if user has equipped a profile frame
        const equippedFrameId = user.equipped_cosmetics?.profile_frame;
        if (equippedFrameId) {
          const frameCosmetic = allCosmetics.find(c => c.id === equippedFrameId);
          if (frameCosmetic) {
            frameMap[user.email] = frameCosmetic.asset_url;
          }
        }

        // Collect equipped title IDs
        if (user.equipped_title) {
          titleIdsToFetch.add(user.equipped_title);
        }
      });
      
      // Fetch all equipped titles
      if (titleIdsToFetch.size > 0) {
        const allTitles = await base44.entities.TitleReward.list();
        allTitles.forEach(title => {
          if (titleIdsToFetch.has(title.id)) {
            titleMap[title.id] = title;
          }
        });
      }

      // Map titles to user emails
      const userTitleMap = {};
      allUsers.forEach(user => {
        if (user.equipped_title && titleMap[user.equipped_title]) {
          userTitleMap[user.email] = titleMap[user.equipped_title];
        }
      });
      
      setUserProfiles(profileMap);
      setProfileFrames(frameMap);
      setEquippedTitles(userTitleMap);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const handleSyncLeaderboard = async () => {
    setIsSyncing(true);
    try {
      const response = await base44.functions.invoke('syncLeaderboard');
      console.log('Sync result:', response.data);
      alert(`Sync complete!\nCreated: ${response.data.summary.entries_created}\nUpdated: ${response.data.summary.entries_updated}\nSkipped: ${response.data.summary.users_skipped}`);
      await loadLeaderboard();
    } catch (error) {
      console.error("Failed to sync leaderboard:", error);
      alert("Failed to sync leaderboard. Check console for details.");
    } finally {
      setIsSyncing(false);
    }
  };

  const getSortedEntries = () => {
    if (activeTab === 'victories') {
      return [...entries].sort((a, b) => (b.total_victories || 0) - (a.total_victories || 0));
    } else if (activeTab === 'wild') {
      return [...entries].sort((a, b) => (b.wild_mode_victories || 0) - (a.wild_mode_victories || 0));
    } else {
      return [...entries].sort((a, b) => (b.achievement_points || 0) - (a.achievement_points || 0));
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-700" />;
    return <Trophy className="w-5 h-5 text-amber-400" />;
  };

  const getRankBg = (rank, hasValue) => {
    if (!hasValue) return 'bg-black/20 border-gray-700';
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600';
    return 'bg-black/30 border-amber-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-amber-400" />
      </div>
    );
  }

  const sortedEntries = getSortedEntries();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 relative"
        >
          <div className="absolute top-0 left-0">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="bg-black/60 backdrop-blur-sm border-amber-500 text-amber-300 hover:bg-amber-500/20 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400 mb-4">
            Hall of Legends
          </h1>
          <p className="text-lg text-amber-300">
            All champions across all realms
          </p>
          
          {isAdmin && (
            <div className="absolute top-0 right-0">
              <Button
                onClick={handleSyncLeaderboard}
                disabled={isSyncing}
                variant="outline"
                className="bg-black/60 backdrop-blur-sm border-amber-500 text-amber-300 hover:bg-amber-500/20 hover:text-white"
              >
                {isSyncing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing...</>
                ) : (
                  <><RefreshCw className="w-4 h-4 mr-2" /> Sync All Users</>
                )}
              </Button>
            </div>
          )}
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 bg-black/60 backdrop-blur-md border border-amber-700">
            <TabsTrigger value="victories" className="data-[state=active]:bg-amber-600">
              <Trophy className="w-4 h-4 mr-2" />
              Victories
            </TabsTrigger>
            <TabsTrigger value="wild" className="data-[state=active]:bg-cyan-600">
              <Star className="w-4 h-4 mr-2" />
              Wild Mode
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-purple-600">
              <Star className="w-4 h-4 mr-2" />
              Achievement Points
            </TabsTrigger>
          </TabsList>

          <TabsContent value="victories" className="mt-6">
            {sortedEntries.length === 0 ? (
              <Card className="bg-black/40 border-amber-800 p-8 text-center">
                <p className="text-gray-300 text-lg">
                  No players have completed runs yet. Be the first!
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {sortedEntries.map((entry, index) => {
                  const rank = index + 1;
                  const isCurrentUser = currentUser && entry.user_email === currentUser.email;
                  const totalVictories = entry.total_victories || 0;
                  const hasVictories = totalVictories > 0;
                  const userProfile = userProfiles[entry.user_email];
                  const profilePicture = userProfile?.profile_picture;
                  const profileFrame = profileFrames[entry.user_email];
                  const equippedTitle = equippedTitles[entry.user_email];

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Card className={`${getRankBg(rank, hasVictories)} ${isCurrentUser ? 'ring-2 ring-amber-500' : ''} transition-all hover:scale-[1.01]`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black/40 flex-shrink-0">
                              {hasVictories ? getRankIcon(rank) : <span className="text-gray-400 font-bold">#{rank}</span>}
                            </div>
                            
                            <div className="relative w-12 h-12 flex-shrink-0">
                              {profileFrame && (
                                <img 
                                  src={profileFrame} 
                                  alt="Frame" 
                                  className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                                />
                              )}
                              <div className={`w-full h-full rounded-full border-2 ${profileFrame ? 'border-transparent' : 'border-amber-500'} overflow-hidden bg-black/40`}>
                                {profilePicture ? (
                                  <img 
                                    src={profilePicture} 
                                    alt={entry.user_name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="text-lg font-bold text-white truncate">
                                  {entry.user_name}
                                </h3>
                                {equippedTitle && (
                                  <div 
                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border"
                                    style={{ 
                                      borderColor: equippedTitle.color,
                                      backgroundColor: `${equippedTitle.color}30`,
                                      color: equippedTitle.color
                                    }}
                                  >
                                    <Crown className="w-3 h-3" />
                                    {equippedTitle.name}
                                  </div>
                                )}
                                {isCurrentUser && (
                                  <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded">YOU</span>
                                )}
                              </div>
                              <div className="flex gap-4 text-sm text-gray-300 flex-wrap">
                                <span className="text-white">Rank: <span className="font-bold text-amber-300">#{rank}</span></span>
                                <span className="text-white">Victories: <span className={`font-bold ${totalVictories > 0 ? 'text-green-400' : 'text-gray-500'}`}>{totalVictories}</span></span>
                                {!hasVictories && (
                                  <span className="text-gray-400 italic">No victories yet</span>
                                )}
                              </div>
                            </div>

                            {rank <= 3 && hasVictories && (
                              <div className="text-2xl font-bold hidden sm:block" style={{
                                color: rank === 1 ? '#fbbf24' : rank === 2 ? '#9ca3af' : '#d97706'
                              }}>
                                #{rank}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wild" className="mt-6">
            {sortedEntries.length === 0 ? (
              <Card className="bg-black/40 border-cyan-800 p-8 text-center">
                <p className="text-gray-300 text-lg">
                  No players have completed Wild Mode runs yet. Be the first!
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {sortedEntries.map((entry, index) => {
                  const rank = index + 1;
                  const isCurrentUser = currentUser && entry.user_email === currentUser.email;
                  const wildVictories = entry.wild_mode_victories || 0;
                  const hasVictories = wildVictories > 0;
                  const userProfile = userProfiles[entry.user_email];
                  const profilePicture = userProfile?.profile_picture;
                  const profileFrame = profileFrames[entry.user_email];
                  const equippedTitle = equippedTitles[entry.user_email];

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Card className={`${getRankBg(rank, hasVictories)} ${isCurrentUser ? 'ring-2 ring-cyan-500' : ''} transition-all hover:scale-[1.01]`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black/40 flex-shrink-0">
                              {hasVictories ? getRankIcon(rank) : <span className="text-gray-400 font-bold">#{rank}</span>}
                            </div>
                            
                            <div className="relative w-12 h-12 flex-shrink-0">
                              {profileFrame && (
                                <img 
                                  src={profileFrame} 
                                  alt="Frame" 
                                  className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                                />
                              )}
                              <div className={`w-full h-full rounded-full border-2 ${profileFrame ? 'border-transparent' : 'border-cyan-500'} overflow-hidden bg-black/40`}>
                                {profilePicture ? (
                                  <img 
                                    src={profilePicture} 
                                    alt={entry.user_name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="text-lg font-bold text-white truncate">
                                  {entry.user_name}
                                </h3>
                                {equippedTitle && (
                                  <div 
                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border"
                                    style={{ 
                                      borderColor: equippedTitle.color,
                                      backgroundColor: `${equippedTitle.color}30`,
                                      color: equippedTitle.color
                                    }}
                                  >
                                    <Crown className="w-3 h-3" />
                                    {equippedTitle.name}
                                  </div>
                                )}
                                {isCurrentUser && (
                                  <span className="text-xs bg-cyan-600 text-white px-2 py-1 rounded">YOU</span>
                                )}
                              </div>
                              <div className="flex gap-4 text-sm text-gray-300 flex-wrap">
                                <span className="text-white">Rank: <span className="font-bold text-cyan-300">#{rank}</span></span>
                                <span className="text-white">Wild Victories: <span className={`font-bold ${wildVictories > 0 ? 'text-cyan-400' : 'text-gray-500'}`}>{wildVictories}</span></span>
                                {!hasVictories && (
                                  <span className="text-gray-400 italic">No wild victories yet</span>
                                )}
                              </div>
                            </div>

                            {rank <= 3 && hasVictories && (
                              <div className="text-2xl font-bold hidden sm:block" style={{
                                color: rank === 1 ? '#fbbf24' : rank === 2 ? '#9ca3af' : '#d97706'
                              }}>
                                #{rank}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            {sortedEntries.length === 0 ? (
              <Card className="bg-black/40 border-purple-800 p-8 text-center">
                <p className="text-gray-300 text-lg">
                  No achievement points earned yet. Complete achievements to appear here!
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {sortedEntries.map((entry, index) => {
                  const rank = index + 1;
                  const isCurrentUser = currentUser && entry.user_email === currentUser.email;
                  const achievementPoints = entry.achievement_points || 0;
                  const hasPoints = achievementPoints > 0;
                  const userProfile = userProfiles[entry.user_email];
                  const profilePicture = userProfile?.profile_picture;
                  const profileFrame = profileFrames[entry.user_email];
                  const equippedTitle = equippedTitles[entry.user_email];

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Card className={`${getRankBg(rank, hasPoints)} ${isCurrentUser ? 'ring-2 ring-purple-500' : ''} transition-all hover:scale-[1.01]`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black/40 flex-shrink-0">
                              {hasPoints ? getRankIcon(rank) : <span className="text-gray-400 font-bold">#{rank}</span>}
                            </div>
                            
                            <div className="relative w-12 h-12 flex-shrink-0">
                              {profileFrame && (
                                <img 
                                  src={profileFrame} 
                                  alt="Frame" 
                                  className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                                />
                              )}
                              <div className={`w-full h-full rounded-full border-2 ${profileFrame ? 'border-transparent' : 'border-purple-500'} overflow-hidden bg-black/40`}>
                                {profilePicture ? (
                                  <img 
                                    src={profilePicture} 
                                    alt={entry.user_name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="text-lg font-bold text-white truncate">
                                  {entry.user_name}
                                </h3>
                                {equippedTitle && (
                                  <div 
                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border"
                                    style={{ 
                                      borderColor: equippedTitle.color,
                                      backgroundColor: `${equippedTitle.color}30`,
                                      color: equippedTitle.color
                                    }}
                                  >
                                    <Crown className="w-3 h-3" />
                                    {equippedTitle.name}
                                  </div>
                                )}
                                {isCurrentUser && (
                                  <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">YOU</span>
                                )}
                              </div>
                              <div className="flex gap-4 text-sm text-gray-300 flex-wrap">
                                <span className="text-white">Rank: <span className="font-bold text-purple-300">#{rank}</span></span>
                                <span className="text-white">Points: <span className={`font-bold ${achievementPoints > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>{achievementPoints}</span></span>
                                {!hasPoints && (
                                  <span className="text-gray-400 italic">No points yet</span>
                                )}
                              </div>
                            </div>

                            {rank <= 3 && hasPoints && (
                              <div className="text-2xl font-bold hidden sm:block" style={{
                                color: rank === 1 ? '#fbbf24' : rank === 2 ? '#9ca3af' : '#d97706'
                              }}>
                                #{rank}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
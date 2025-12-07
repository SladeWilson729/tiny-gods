
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, User as UserIcon, Trophy, Crown, Edit, Save, X, Award, Lock, Sparkles, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const RARITY_COLORS = {
  common: { border: 'border-gray-500', bg: 'bg-gray-600', text: 'text-gray-400', glow: 'rgba(107, 114, 128, 0.3)' },
  rare: { border: 'border-blue-500', bg: 'bg-blue-600', text: 'text-blue-400', glow: 'rgba(59, 130, 246, 0.5)' },
  epic: { border: 'border-purple-500', bg: 'bg-purple-600', text: 'text-purple-400', glow: 'rgba(139, 92, 246, 0.5)' },
  legendary: { border: 'border-yellow-500', bg: 'bg-yellow-600', text: 'text-yellow-400', glow: 'rgba(251, 191, 36, 0.6)' }
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profileFrame, setProfileFrame] = useState(null); // Stores asset_url
  const [equippedProfileFrameData, setEquippedProfileFrameData] = useState(null); // Stores the full cosmetic object for color
  const [allGods, setAllGods] = useState([]);
  const [allTitles, setAllTitles] = useState([]);
  const [equippedTitleData, setEquippedTitleData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedDisplayName, setEditedDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setEditedDisplayName(userData.display_name || userData.full_name || '');

        // Load equipped profile frame
        if (userData.equipped_cosmetics?.profile_frame) {
          const frameCosmetic = await base44.entities.CosmeticReward.get(userData.equipped_cosmetics.profile_frame);
          if (frameCosmetic) {
            setProfileFrame(frameCosmetic.asset_url);
            setEquippedProfileFrameData(frameCosmetic); // Store full cosmetic data for color
          }
        }

        // Load equipped title
        if (userData.equipped_title) {
          const titleData = await base44.entities.TitleReward.get(userData.equipped_title);
          if (titleData) {
            setEquippedTitleData(titleData);
          }
        }

        // Load all titles
        const titles = await base44.entities.TitleReward.list('display_order');
        setAllTitles(titles);

        // Load all gods and filter out specific ones
        const gods = await base44.entities.God.list();
        const availableGods = gods.filter(god =>
          god.name !== 'Zeus' &&
          god.name !== 'Odin' &&
          god.name !== 'Cthulhu' &&
          god.name !== 'Hades'
        );
        setAllGods(availableGods);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, []);

  const handleSaveDisplayName = async () => {
    if (!editedDisplayName.trim()) {
      alert('Display name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      await base44.auth.updateMe({ display_name: editedDisplayName.trim() });
      
      // Update leaderboard entry with new name
      const leaderboardEntries = await base44.entities.LeaderboardEntry.filter({ 
        user_email: user.email 
      });
      
      if (leaderboardEntries.length > 0) {
        await base44.entities.LeaderboardEntry.update(leaderboardEntries[0].id, {
          user_name: editedDisplayName.trim()
        });
      }
      
      setUser({ ...user, display_name: editedDisplayName.trim() });
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to update display name:', error);
      alert('Failed to update display name. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEquipTitle = async (titleId) => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({ equipped_title: titleId });
      const titleData = await base44.entities.TitleReward.get(titleId);
      setEquippedTitleData(titleData);
      setUser({ ...user, equipped_title: titleId });
    } catch (error) {
      console.error('Failed to equip title:', error);
      alert('Failed to equip title. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnequipTitle = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({ equipped_title: null });
      setEquippedTitleData(null);
      setUser({ ...user, equipped_title: null });
    } catch (error) {
      console.error('Failed to unequip title:', error);
      alert('Failed to unequip title. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isTitleUnlocked = (titleId) => {
    return user?.unlocked_titles?.includes(titleId) || false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white text-xl">Loading Profile...</p>
        </div>
      </div>
    );
  }

  const godRunsCompleted = user?.god_runs_completed || {};
  // const totalAttempted = user?.total_completed_runs || 0; // Replaced by new stats grid
  // const totalVictories = user?.total_victories || 0;     // Replaced by new stats grid
  const displayName = user?.display_name || user?.full_name || 'Unknown Player';
  const unlockedTitles = allTitles.filter(t => isTitleUnlocked(t.id));
  const lockedTitles = allTitles.filter(t => !isTitleUnlocked(t.id) && !t.is_secret);
  const secretTitles = allTitles.filter(t => !isTitleUnlocked(t.id) && t.is_secret);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card 
            className="bg-black/40 border-2 overflow-hidden relative"
            style={{
              borderColor: equippedProfileFrameData?.color || '#8b5cf6', // Use equippedProfileFrameData for color
              boxShadow: equippedProfileFrameData?.color ? `0 0 30px ${equippedProfileFrameData.color}40` : 'none'
            }}
          >
            {profileFrame && (
              <img 
                src={profileFrame} 
                alt="Frame" 
                className="absolute inset-0 w-full h-full object-cover z-0 opacity-50"
              />
            )}
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Profile Picture with Frame */}
                <div className="relative">
                  <div className={`w-32 h-32 rounded-full border-4 ${profileFrame ? 'border-transparent' : 'border-purple-500'} overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600`}>
                    {user?.profile_picture ? (
                      <img 
                        src={user.profile_picture} 
                        alt={displayName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserIcon className="w-16 h-16 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  {/* Display Name Editor */}
                  {isEditingName ? (
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={editedDisplayName}
                        onChange={(e) => setEditedDisplayName(e.target.value)}
                        className="bg-black/40 border-purple-500 text-white text-2xl font-bold"
                        placeholder="Enter display name"
                        maxLength={30}
                      />
                      <Button
                        onClick={handleSaveDisplayName}
                        disabled={isSaving}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditingName(false);
                          setEditedDisplayName(user?.display_name || user?.full_name || '');
                        }}
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-400 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center md:items-start gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-bold text-white">{displayName}</h1>
                        <Button
                          onClick={() => setIsEditingName(true)}
                          size="sm"
                          variant="ghost"
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Equipped Title Display */}
                      {equippedTitleData && (
                        <div 
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2"
                          style={{ 
                            borderColor: equippedTitleData.color,
                            backgroundColor: `${equippedTitleData.color}20`,
                            boxShadow: `0 0 20px ${equippedTitleData.color}40`
                          }}
                        >
                          <Crown className="w-5 h-5" style={{ color: equippedTitleData.color }} />
                          <span 
                            className="font-bold text-lg"
                            style={{ color: equippedTitleData.color }}
                          >
                            {equippedTitleData.name}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-purple-300 text-lg mb-4">{user?.email}</p>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-black/60 p-4 rounded-lg border border-purple-700/50">
                      <div className="text-purple-300 text-sm mb-1">Victories</div>
                      <div className="text-3xl font-bold text-white">{user.total_victories || 0}</div>
                    </div>
                    <div className="bg-black/60 p-4 rounded-lg border border-purple-700/50">
                      <div className="text-purple-300 text-sm mb-1">Runs Completed</div>
                      <div className="text-3xl font-bold text-white">{user.total_completed_runs || 0}</div>
                    </div>
                    <div className="bg-black/60 p-4 rounded-lg border border-purple-700/50">
                      <div className="text-purple-300 text-sm mb-1">Titles Earned</div>
                      <div className="text-3xl font-bold text-yellow-400">{user.unlocked_titles?.length || 0}</div>
                    </div>
                    <div className="bg-black/60 p-4 rounded-lg border border-red-700/50">
                      <div className="text-red-300 text-sm mb-1 flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        Lives
                      </div>
                      <div className="text-3xl font-bold text-red-400">
                        {user.lives ?? 5}/{user.lives_max ?? 5}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Titles Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-black/60 backdrop-blur-md border-2 border-purple-500">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-8 h-8 text-yellow-400" />
                <h2 className="text-3xl font-bold text-white">Titles</h2>
                <span className="text-sm text-gray-400">
                  {unlockedTitles.length}/{allTitles.filter(t => !t.is_secret).length + unlockedTitles.filter(t => t.is_secret).length} Unlocked
                </span>
              </div>

              {/* Unlocked Titles */}
              {unlockedTitles.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Unlocked Titles
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {unlockedTitles.map((title, index) => {
                      const rarityStyle = RARITY_COLORS[title.rarity] || RARITY_COLORS.common;
                      const isEquipped = user?.equipped_title === title.id;

                      return (
                        <motion.div
                          key={title.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                        >
                          <Card 
                            className={`overflow-hidden transition-all border-2 ${
                              isEquipped 
                                ? 'ring-4 ring-green-500 shadow-lg shadow-green-500/50' 
                                : rarityStyle.border
                            }`}
                            style={{
                              backgroundColor: isEquipped ? `${title.color}20` : '#00000066',
                              boxShadow: isEquipped ? `0 0 30px ${title.color}60` : `0 0 20px ${rarityStyle.glow}`
                            }}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <div 
                                  className={`${rarityStyle.bg} p-3 rounded-lg flex-shrink-0`}
                                >
                                  <Crown className="w-8 h-8 text-white" />
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 
                                      className="text-xl font-bold"
                                      style={{ color: title.color }}
                                    >
                                      {title.name}
                                    </h3>
                                    <span className={`text-xs ${rarityStyle.text} uppercase font-bold px-2 py-1 ${rarityStyle.bg} rounded`}>
                                      {title.rarity}
                                    </span>
                                  </div>
                                  
                                  <p className="text-gray-300 text-sm mb-3">{title.description}</p>

                                  {isEquipped ? (
                                    <Button
                                      onClick={handleUnequipTitle}
                                      disabled={isSaving}
                                      size="sm"
                                      className="bg-red-600 hover:bg-red-700 w-full"
                                    >
                                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
                                      Unequip
                                    </Button>
                                  ) : (
                                    <Button
                                      onClick={() => handleEquipTitle(title.id)}
                                      disabled={isSaving}
                                      size="sm"
                                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full"
                                    >
                                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Crown className="w-4 h-4 mr-2" />}
                                      Equip
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Locked Titles */}
              {lockedTitles.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-400 mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Locked Titles
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {lockedTitles.map((title, index) => {
                      const rarityStyle = RARITY_COLORS[title.rarity] || RARITY_COLORS.common;

                      return (
                        <motion.div
                          key={title.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + index * 0.05 }}
                        >
                          <Card className="overflow-hidden bg-black/40 border-2 border-gray-700 opacity-60">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <div className="bg-gray-700 p-3 rounded-lg flex-shrink-0">
                                  <Lock className="w-8 h-8 text-gray-500" />
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="text-xl font-bold text-gray-400">
                                      {title.name}
                                    </h3>
                                    <span className="text-xs text-gray-500 uppercase font-bold px-2 py-1 bg-gray-700 rounded">
                                      {title.rarity}
                                    </span>
                                  </div>
                                  
                                  <p className="text-gray-500 text-sm mb-3">{title.description}</p>

                                  <div className="bg-black/60 p-2 rounded border border-gray-700">
                                    <p className="text-xs text-gray-400">
                                      <span className="font-bold">Unlock: </span>
                                      {title.unlock_criteria_type.replace(/_/g, ' ')} - {title.unlock_criteria_value}
                                      {title.unlock_criteria_target_id && ` (${title.unlock_criteria_target_id})`}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Secret Titles */}
              {secretTitles.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-indigo-400 mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Secret Titles ({secretTitles.length} Hidden)
                  </h3>
                  <Card className="bg-black/40 border-2 border-indigo-700 p-6">
                    <div className="text-center text-gray-400">
                      <Lock className="w-12 h-12 mx-auto mb-3 text-indigo-500" />
                      <p className="text-lg">Mysterious titles await discovery...</p>
                      <p className="text-sm mt-2">Complete secret challenges to reveal them</p>
                    </div>
                  </Card>
                </div>
              )}

              {allTitles.length === 0 && (
                <div className="text-center py-8">
                  <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">No titles available yet</p>
                  <p className="text-gray-500">Check back later for prestigious titles!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* God Completions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-black/60 backdrop-blur-md border-2 border-purple-500">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Crown className="w-8 h-8 text-amber-400" />
                <h2 className="text-3xl font-bold text-white">God Completions</h2>
              </div>

              {allGods.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No gods available</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allGods.map((god, index) => {
                    const completions = godRunsCompleted[god.name] || 0;
                    const hasCompleted = completions > 0;

                    return (
                      <motion.div
                        key={god.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                      >
                        <Card className={`overflow-hidden transition-all ${
                          hasCompleted 
                            ? 'bg-gradient-to-br from-purple-900/40 to-black border-purple-500 hover:border-purple-400' 
                            : 'bg-black/40 border-gray-700'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500/50 flex-shrink-0">
                                <img 
                                  src={god.image} 
                                  alt={god.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1">{god.name}</h3>
                                <div className="flex items-center gap-2">
                                  <Trophy className={`w-4 h-4 ${hasCompleted ? 'text-yellow-400' : 'text-gray-600'}`} />
                                  <span className={`text-2xl font-bold ${hasCompleted ? 'text-yellow-400' : 'text-gray-600'}`}>
                                    {completions}
                                  </span>
                                  <span className="text-sm text-gray-400">
                                    {completions === 1 ? 'run' : 'runs'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {Object.keys(godRunsCompleted).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-lg mb-2">No runs completed yet</p>
                  <p className="text-purple-300">Start your journey to godhood!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

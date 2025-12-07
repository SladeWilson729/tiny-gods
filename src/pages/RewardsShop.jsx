
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  Sparkles, Crown, Image, Film, Mic, Frame, Layers,
  Coins, Gem, ShoppingBag, Check, Lock, Loader2, Star, X, Heart
} from 'lucide-react';

const CATEGORY_INFO = {
  god_art: {
    icon: Crown,
    label: 'God Alternate Art',
    color: 'from-purple-600 to-indigo-600',
    description: 'Alternate artwork for your favorite gods'
  },
  profile_picture: {
    icon: Image,
    label: 'Profile Pictures',
    color: 'from-blue-600 to-cyan-600',
    description: 'Customize your profile with unique avatars'
  },
  card_animation: {
    icon: Film,
    label: 'Animated Cards',
    color: 'from-pink-600 to-rose-600',
    description: 'Bring your cards to life with animations'
  },
  voice_effect: {
    icon: Mic,
    label: 'Voice Effects',
    color: 'from-amber-600 to-orange-600',
    description: 'Unique voice lines and sound effects'
  },
  profile_frame: {
    icon: Frame,
    label: 'Profile Frames',
    color: 'from-green-600 to-emerald-600',
    description: 'Customize your profile appearance'
  },
  card_back: {
    icon: Layers,
    label: 'Card Backs',
    color: 'from-violet-600 to-purple-600',
    description: 'Change how your deck looks'
  }
};

const RARITY_COLORS = {
  common: { border: '#6b7280', glow: 'rgba(107, 114, 128, 0.3)', text: 'text-gray-400', bg: 'bg-gray-600' },
  rare: { border: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', text: 'text-blue-400', bg: 'bg-blue-600' },
  epic: { border: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)', text: 'text-purple-400', bg: 'bg-purple-600' },
  legendary: { border: '#fbbf24', glow: 'rgba(251, 191, 36, 0.6)', text: 'text-yellow-400', bg: 'bg-yellow-600' }
};

const isVideo = (url) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.mov');
};

const isAudio = (url) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.mp3') || lowerUrl.endsWith('.wav') || lowerUrl.endsWith('.ogg') || lowerUrl.endsWith('.m4a');
};

export default function RewardsShop() {
  const [user, setUser] = useState(null);
  const [cosmetics, setCosmetics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExchanging, setIsExchanging] = useState(false);
  const [isRestoringLives, setIsRestoringLives] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const cosmeticsList = await base44.entities.CosmeticReward.filter(
        { is_available: true },
        'display_order'
      );
      setCosmetics(cosmeticsList);
    } catch (error) {
      console.error('Failed to load rewards shop:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreLives = async () => {
    if (isRestoringLives) return;

    const currentBalance = user?.favor_tokens || 0;
    const cost = 150;
    const currentLives = user?.lives ?? 5;
    const maxLives = user?.lives_max ?? 5;

    if (currentLives >= maxLives) {
      alert('Your lives are already full!');
      return;
    }

    if (currentBalance < cost) {
      alert(`Not enough Favor Tokens! You need ${cost} but have ${currentBalance}.`);
      return;
    }

    const confirmed = window.confirm(
      `Restore all lives for ${cost} Favor Tokens?\n\nCurrent Lives: ${currentLives}/${maxLives}\nAfter: ${maxLives}/${maxLives}`
    );

    if (!confirmed) return;

    setIsRestoringLives(true);
    try {
      await base44.auth.updateMe({
        favor_tokens: currentBalance - cost,
        lives: maxLives,
        last_life_recovery: new Date().toISOString()
      });

      await loadData();
      alert(`✅ Lives Restored!\n\nYou now have ${maxLives}/${maxLives} lives!`);
    } catch (error) {
      console.error('Failed to restore lives:', error);
      alert('Failed to restore lives. Please try again.');
    } finally {
      setIsRestoringLives(false);
    }
  };

  const handlePurchase = async (cosmetic) => {
    if (isPurchasing) return;

    const currencyLabel = cosmetic.currency_type === 'favor_tokens' ? 'Favor Tokens' : 'Essence Crystals';
    const currentBalance = cosmetic.currency_type === 'favor_tokens'
      ? user.favor_tokens
      : user.essence_crystals;

    if (currentBalance < cosmetic.cost) {
      alert(`Not enough ${currencyLabel}! You need ${cosmetic.cost} but have ${currentBalance}.`);
      return;
    }

    const confirmed = window.confirm(
      `Purchase "${cosmetic.name}" for ${cosmetic.cost} ${currencyLabel}?`
    );

    if (!confirmed) return;

    setIsPurchasing(true);
    try {
      const ownedCosmetics = user.owned_cosmetics || [];
      const newBalance = currentBalance - cosmetic.cost;

      const updateData = {
        owned_cosmetics: [...ownedCosmetics, cosmetic.id]
      };

      if (cosmetic.currency_type === 'favor_tokens') {
        updateData.favor_tokens = newBalance;
      } else {
        updateData.essence_crystals = newBalance;
      }

      await base44.auth.updateMe(updateData);

      await loadData();
      alert(`Successfully purchased "${cosmetic.name}"!`);
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleEquip = async (cosmetic) => {
    try {
      const currentEquipped = user.equipped_cosmetics || {};
      let updateData = {};

      // Handle god_art specially - it's an object mapping god names to art IDs
      if (cosmetic.category === 'god_art') {
        const currentGodArts = currentEquipped.god_art || {};
        const targetGod = cosmetic.target_name || cosmetic.target_id;

        if (!targetGod) {
          alert('This god art cosmetic is missing target information.');
          return;
        }

        updateData = {
          equipped_cosmetics: {
            ...currentEquipped,
            god_art: {
              ...currentGodArts,
              [targetGod]: cosmetic.id
            }
          }
        };
      } else {
        // For other categories, keep single ID
        updateData = {
          equipped_cosmetics: {
            ...currentEquipped,
            [cosmetic.category]: cosmetic.id
          }
        };
      }

      await base44.auth.updateMe(updateData);
      await loadData();
      alert(`Equipped "${cosmetic.name}"!`);
    } catch (error) {
      console.error('Failed to equip cosmetic:', error);
      alert('Failed to equip cosmetic. Please try again.');
    }
  };

  const handleUnequip = async (category, targetGod = null) => {
    try {
      const currentEquipped = user.equipped_cosmetics || {};
      let updateData = {};

      // Handle god_art specially
      if (category === 'god_art' && targetGod) {
        const currentGodArts = currentEquipped.god_art || {};
         
        const { [targetGod]: removed, ...remaining } = currentGodArts;

        updateData = {
          equipped_cosmetics: {
            ...currentEquipped,
            god_art: remaining
          }
        };
      } else {
        // For other categories, remove the single ID
         
        const { [category]: removed, ...remaining } = currentEquipped;
        updateData = {
          equipped_cosmetics: remaining
        };
      }

      await base44.auth.updateMe(updateData);
      await loadData();
      alert('Cosmetic unequipped!');
    } catch (error) {
      console.error('Failed to unequip cosmetic:', error);
      alert('Failed to unequip cosmetic. Please try again.');
    }
  };

  const isOwned = (cosmeticId) => {
    return user?.owned_cosmetics?.includes(cosmeticId);
  };

  const isEquipped = (cosmeticId, cosmetic) => {
    const equipped = user?.equipped_cosmetics || {};

    // For god_art, check the object mapping
    if (cosmetic.category === 'god_art') {
      const godArts = equipped.god_art || {};
      const targetGod = cosmetic.target_name || cosmetic.target_id;
      return godArts[targetGod] === cosmeticId;
    }

    // For other categories
    return Object.values(equipped).includes(cosmeticId);
  };

  const canPurchase = (cosmetic) => {
    if (isOwned(cosmetic.id)) return false;
    if (cosmetic.unlock_requirement) {
      // TODO: Add unlock requirement checking logic
      return true;
    }
    return true;
  };

  const handleExchange = async (type) => {
    if (isExchanging) return;

    let costCurrency, gainCurrency, costAmount, gainAmount;
    let currentCostBalance, currentGainBalance;
    let costLabel, gainLabel;

    if (type === 'favor_to_essence') {
      costCurrency = 'favor_tokens';
      gainCurrency = 'essence_crystals';
      costAmount = 10;
      gainAmount = 5;
      costLabel = 'Favor Tokens';
      gainLabel = 'Essence Crystals';
      currentCostBalance = user?.favor_tokens || 0;
      currentGainBalance = user?.essence_crystals || 0;
    } else { // essence_to_favor
      costCurrency = 'essence_crystals';
      gainCurrency = 'favor_tokens';
      costAmount = 5;
      gainAmount = 10;
      costLabel = 'Essence Crystals';
      gainLabel = 'Favor Tokens';
      currentCostBalance = user?.essence_crystals || 0;
      currentGainBalance = user?.favor_tokens || 0;
    }

    if (currentCostBalance < costAmount) {
      alert(`Not enough ${costLabel}! You need ${costAmount} but have ${currentCostBalance}.`);
      return;
    }

    const confirmed = window.confirm(
      `Exchange ${costAmount} ${costLabel} for ${gainAmount} ${gainLabel}?`
    );

    if (!confirmed) return;

    setIsExchanging(true);
    try {
      const updateData = {
        [costCurrency]: currentCostBalance - costAmount,
        [gainCurrency]: currentGainBalance + gainAmount
      };

      await base44.auth.updateMe(updateData);
      await loadData(); // Refresh user data after exchange
      alert('Exchange successful!');
    } catch (error) {
      console.error('Exchange failed:', error);
      alert('Exchange failed. Please try again.');
    } finally {
      setIsExchanging(false);
    }
  };

  const filteredCosmetics = cosmetics.filter(c => {
    const categoryMatch = selectedCategory === 'all' || c.category === selectedCategory;
    const searchMatch = searchQuery === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.target_name && c.target_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return categoryMatch && searchMatch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white text-xl">Loading Rewards Shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-8 border-2 border-purple-500/50 shadow-2xl">
            <div className="flex items-center justify-center gap-4 mb-4">
              <ShoppingBag className="w-12 h-12 text-purple-400" />
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Rewards Shop
              </h1>
            </div>
            <p className="text-xl text-purple-200 mb-4">
              Unlock exclusive cosmetics with your earned rewards
            </p>

            {/* Currency Display */}
            <div className="flex items-center justify-center gap-6 mb-6">
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

            {/* Lives Restore Section */}
            <div className="bg-gradient-to-br from-red-900/30 to-black/30 rounded-xl p-6 border border-red-500/30 mb-6">
              <h3 className="text-xl font-bold text-red-300 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Restore Lives
              </h3>
              <div className="flex items-center justify-center gap-4 mb-4">
                {[...Array(user?.lives_max ?? 5)].map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-6 h-6 ${i < (user?.lives ?? 5) ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
                  />
                ))}
                <span className="text-white font-bold text-lg">
                  {user?.lives ?? 5} / {user?.lives_max ?? 5}
                </span>
              </div>
              <Button
                onClick={handleRestoreLives}
                disabled={isRestoringLives || (user?.lives ?? 5) >= (user?.lives_max ?? 5) || (user?.favor_tokens || 0) < 150}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold px-8 py-4 disabled:opacity-50 w-full"
              >
                {isRestoringLives ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5 mr-2" />
                    Restore All Lives - 150
                    <Coins className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
              {(user?.lives ?? 5) >= (user?.lives_max ?? 5) && (
                <p className="text-xs text-gray-400 text-center mt-2">Lives are already full!</p>
              )}
            </div>

            {/* Currency Exchange Section */}
            <div className="bg-gradient-to-br from-purple-900/30 to-black/30 rounded-xl p-6 border border-purple-500/30">
              <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Currency Exchange
              </h3>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Button
                  onClick={() => handleExchange('favor_to_essence')}
                  disabled={isExchanging || (user?.favor_tokens || 0) < 10}
                  className="bg-gradient-to-r from-yellow-600 to-cyan-600 hover:from-yellow-700 hover:to-cyan-700 text-white font-bold px-6 py-3 disabled:opacity-50"
                >
                  <Coins className="w-5 h-5 mr-2" />
                  10 Favor Tokens
                  <span className="mx-2">→</span>
                  5 Essence Crystals
                  <Gem className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  onClick={() => handleExchange('essence_to_favor')}
                  disabled={isExchanging || (user?.essence_crystals || 0) < 5}
                  className="bg-gradient-to-r from-cyan-600 to-yellow-600 hover:from-cyan-700 hover:to-yellow-700 text-white font-bold px-6 py-3 disabled:opacity-50"
                >
                  <Gem className="w-5 h-5 mr-2" />
                  5 Essence Crystals
                  <span className="mx-2">→</span>
                  10 Favor Tokens
                  <Coins className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mt-6 max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, god, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pl-12 bg-black/60 border-2 border-purple-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="text-sm text-purple-300 mt-2">
                  Found {filteredCosmetics.length} result{filteredCosmetics.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Category Tabs */}
        <Tabs defaultValue="all" className="space-y-6" onValueChange={setSelectedCategory}>
          <TabsList className="bg-black/60 backdrop-blur-md border border-purple-700 grid w-full grid-cols-7 gap-2">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-600">
              All Items
            </TabsTrigger>
            {Object.entries(CATEGORY_INFO).map(([key, info]) => {
              const Icon = info.icon;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="data-[state=active]:bg-purple-600 flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{info.label.split(' ')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedCategory}>
            {filteredCosmetics.length === 0 ? (
              <Card className="bg-black/40 border-purple-800 p-12 text-center">
                <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="2xl font-bold text-white mb-2">
                  {searchQuery ? 'No Results Found' : 'No Items Available'}
                </h3>
                <p className="text-gray-400">
                  {searchQuery
                    ? `No cosmetics match "${searchQuery}". Try a different search.`
                    : 'Check back later for new cosmetics!'}
                </p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCosmetics.map((cosmetic, index) => {
                  const categoryInfo = CATEGORY_INFO[cosmetic.category];
                  const rarityStyle = RARITY_COLORS[cosmetic.rarity];
                  const owned = isOwned(cosmetic.id);
                  const equipped = isEquipped(cosmetic.id, cosmetic); // Updated call
                  const purchasable = canPurchase(cosmetic);
                  const Icon = categoryInfo.icon;

                  return (
                    <motion.div
                      key={cosmetic.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className="bg-black/40 border-2 overflow-hidden hover:scale-105 transition-all"
                        style={{
                          borderColor: equipped ? '#10b981' : rarityStyle.border,
                          boxShadow: equipped
                            ? '0 0 30px rgba(16, 185, 129, 0.6)'
                            : `0 0 20px ${rarityStyle.glow}`
                        }}
                      >
                        {/* Preview Image/Video/Audio */}
                        <div className="relative h-48 bg-gradient-to-br from-gray-800 to-black">
                          {cosmetic.category === 'voice_effect' && cosmetic.asset_url && isAudio(cosmetic.asset_url) ? (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                              <Mic className="w-16 h-16 text-purple-400 mb-4" />
                              {owned ? (
                                <audio controls className="w-full">
                                  <source src={cosmetic.asset_url} type="audio/mpeg" />
                                  Your browser does not support the audio element.
                                </audio>
                              ) : (
                                <div className="text-center">
                                  <Lock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                  <p className="text-xs text-gray-400">Purchase to preview</p>
                                </div>
                              )}
                            </div>
                          ) : cosmetic.preview_image ? (
                            isVideo(cosmetic.preview_image) ? (
                              <video
                                src={cosmetic.preview_image}
                                alt={cosmetic.name}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                              />
                            ) : (
                              <img
                                src={cosmetic.preview_image}
                                alt={cosmetic.name}
                                className="w-full h-full object-cover"
                              />
                            )
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon className={`w-20 h-20 ${rarityStyle.text}`} />
                            </div>
                          )}

                          {/* Owned Badge */}
                          {owned && (
                            <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                              <Check className="w-4 h-4" />
                              OWNED
                            </div>
                          )}

                          {/* Rarity Badge */}
                          <div
                            className={`absolute top-2 left-2 ${rarityStyle.bg} text-white px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg flex items-center gap-1`}
                          >
                            <Star className="w-3 h-3" fill="currentColor" />
                            {cosmetic.rarity}
                          </div>

                          {/* Animated Badge */}
                          {cosmetic.is_animated && (
                            <div className="absolute bottom-2 right-2 bg-pink-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                              <Film className="w-3 h-3" />
                              ANIMATED
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={`w-5 h-5 ${rarityStyle.text}`} />
                            <h3 className="text-lg font-bold text-white">{cosmetic.name}</h3>
                          </div>

                          <p className="text-sm text-gray-300 mb-3">{cosmetic.description}</p>

                          {cosmetic.target_name && (
                            <div className="bg-black/40 px-2 py-1 rounded mb-3 text-xs text-purple-300">
                              For: {cosmetic.target_name}
                            </div>
                          )}

                          {/* Equipped Badge */}
                          {equipped && (
                            <div className="bg-green-600 text-white px-3 py-2 rounded mb-3 text-sm font-bold flex items-center justify-center gap-2">
                              <Check className="w-4 h-4" />
                              Currently Equipped
                            </div>
                          )}

                          {/* Price & Actions */}
                          {!owned ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {cosmetic.currency_type === 'favor_tokens' ? (
                                    <>
                                      <Coins className="w-5 h-5 text-yellow-400" />
                                      <span className="text-xl font-bold text-yellow-400">
                                        {cosmetic.cost}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Gem className="w-5 h-5 text-cyan-400" />
                                      <span className="text-xl font-bold text-cyan-400">
                                        {cosmetic.cost}
                                      </span>
                                    </>
                                  )}
                                </div>

                                <Button
                                  onClick={() => handlePurchase(cosmetic)}
                                  disabled={!purchasable || isPurchasing}
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                >
                                  {!purchasable ? (
                                    <>
                                      <Lock className="w-4 h-4 mr-1" />
                                      Locked
                                    </>
                                  ) : (
                                    'Purchase'
                                  )}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  const targetGod = cosmetic.target_name || cosmetic.target_id;
                                  if (equipped) {
                                    handleUnequip(cosmetic.category, cosmetic.category === 'god_art' ? targetGod : null);
                                  } else {
                                    handleEquip(cosmetic);
                                  }
                                }}
                                className={equipped
                                  ? "flex-1 bg-red-600 hover:bg-red-700"
                                  : "flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                }
                              >
                                {equipped ? (
                                  <>
                                    <X className="w-4 h-4 mr-1" />
                                    Unequip
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4 mr-1" />
                                    Equip
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                          {cosmetic.unlock_requirement && !owned && (
                            <div className="mt-2 text-xs text-red-400">
                              Requires: {cosmetic.unlock_requirement}
                            </div>
                          )}
                        </div>
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

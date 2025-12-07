import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import GodCard from '../components/game/GodCard';
import TalentTreeModal from '../components/game/TalentTreeModal';
import { Shield, Sparkles, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


import CustomDeckBuilderModal from '../components/game/CustomDeckBuilderModal';
import AscensionSelectionScreen from '../components/game/AscensionSelectionScreen';
import CompanionLoadoutPanel from '../components/game/CompanionLoadoutPanel';
import { Card, CardContent } from '@/components/ui/card';

export default function GodSelection() {
  const navigate = useNavigate();
  const [allGods, setAllGods] = useState([]);
  const [chosenGod, setChosenGod] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [startingDeck, setStartingDeck] = useState([]);
  const [isHardMode, setIsHardMode] = useState(false);
  const [isHeroicMode, setIsHeroicMode] = useState(false);
  const [isMythicMode, setIsMythicMode] = useState(false);
  const [isWildMode, setIsWildMode] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [hasWonHardMode, setHasWonHardMode] = useState(false);
  const [hasWonHeroicMode, setHasWonHeroicMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTalentTree, setShowTalentTree] = useState(false);
  const [hasCompletedRun, setHasCompletedRun] = useState(false);
  const [user, setUser] = useState(null);
  const [showCustomDeckBuilder, setShowCustomDeckBuilder] = useState(false);
  const [customDeck, setCustomDeck] = useState([]);
  const [showAscensionSelection, setShowAscensionSelection] = useState(false);
  const [ascensionData, setAscensionData] = useState(null);
  const [showCompanionLoadout, setShowCompanionLoadout] = useState(false);
  const [isCreatingRun, setIsCreatingRun] = useState(false);
  const [livesData, setLivesData] = useState(null);

  const SUSANOO_NAME = 'Susanoo';
  const THE_MORRIGAN_NAME = 'The Morrígan';
  const LUCIFER_NAME = 'Lucifer';

  const loadGods = async () => {
    setIsLoading(true);
    try {
      const gods = await base44.entities.God.list();
      const availableGods = gods.filter(god =>
        god.name !== 'Zeus' &&
        god.name !== 'Odin' &&
        god.name !== 'Cthulhu' &&
        god.name !== 'Hades'
      );
      setAllGods(availableGods);
    } catch (error) {
      console.error("Failed to load gods:", error);
      if (error.response?.status === 403 || error.message?.includes('must be logged in')) {
        await base44.auth.redirectToLogin(window.location.href);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkLives = async () => {
    try {
      const response = await base44.functions.invoke('checkLivesRecovery', {});
      setLivesData(response.data);
    } catch (error) {
      console.error('Failed to check lives:', error);
    }
  };

  useEffect(() => {
    loadGods();
    checkAdminAndDefineStartingDeck();
    checkLives();
  }, []);

  const checkAdminAndDefineStartingDeck = async () => {
    let strikeImg = null;
    let defendImg = null;
    let healImg = null;

    try {
      const settings = await base44.entities.GameSettings.list();
      if (settings.length > 0) {
        strikeImg = settings[0].strike_card_image;
        defendImg = settings[0].defend_card_image;
        healImg = settings[0].heal_card_image;
      }
    } catch (e) {
      console.log("Could not load game settings, using defaults.", e);
    }

    try {
      const userData = await base44.auth.me();
      if (userData) {
          setUser(userData);
          
          if (userData.role === 'admin') {
            setIsAdmin(true);
          }

          if (userData.has_won_run) {
              setHasWon(true);
          }

          if (userData.has_won_hard_mode) {
              setHasWonHardMode(true);
          }

          if (userData.has_won_heroic_mode) {
              setHasWonHeroicMode(true);
          }

          const godRuns = userData.god_runs_completed || {};
          const hasAnyRun = Object.values(godRuns).some(count => count > 0);
          setHasCompletedRun(hasAnyRun);
        }
    } catch (e) {
      console.log("Not logged in, redirecting to login...", e);
      await base44.auth.redirectToLogin(window.location.href);
      return;
    }

    const STRIKE_CARD_DEFINITION = { name: "Strike", type: "damage", value: 8, cost: 1, description: "Deal 8 damage.", gradient: "bg-gradient-to-br from-red-500 to-orange-500", image: strikeImg };
    const DEFEND_CARD_DEFINITION = { name: "Defend", type: "shield", value: 6, cost: 1, description: "Gain 6 Shield.", gradient: "bg-gradient-to-br from-blue-500 to-cyan-500", image: defendImg };
    const HEAL_CARD_DEFINITION = { name: "Heal", type: "heal", value: 6, cost: 1, description: "Restore 6 Health.", gradient: "bg-gradient-to-br from-green-500 to-emerald-500", image: healImg };

    window.COMMON_CARD_DEFINITIONS = {
      STRIKE_CARD_DEFINITION,
      DEFEND_CARD_DEFINITION,
      HEAL_CARD_DEFINITION
    };

    setStartingDeck([
      {...STRIKE_CARD_DEFINITION}, {...STRIKE_CARD_DEFINITION}, {...STRIKE_CARD_DEFINITION},
      {...STRIKE_CARD_DEFINITION}, {...STRIKE_CARD_DEFINITION},
      {...DEFEND_CARD_DEFINITION}, {...DEFEND_CARD_DEFINITION}, {...DEFEND_CARD_DEFINITION},
      {...HEAL_CARD_DEFINITION}, {...HEAL_CARD_DEFINITION}
    ]);
  };

  const getGodUnlockStatus = (god, user, isAdmin) => {
    if (isAdmin) return { locked: false, reason: '' };
    return { locked: false, reason: '' };
  };

  const handleGodSelect = (god, isLocked) => {
    if (isLocked) {
      console.log(`${god.name} is locked. Complete the unlock conditions first.`);
      return;
    }
    if (isCreatingRun) return;

    if (livesData && livesData.lives <= 0) {
      const minutesRemaining = livesData.nextRecoveryIn || 60;
      alert(`❤️ Out of Lives!\n\nYou need at least 1 life to start a run.\nNext life recovers in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.\n\nLives regenerate at 1 per hour.`);
      return;
    }

    setChosenGod(god);
    setCustomDeck([]);
    setAscensionData(null);
  };

  const buildStartingDeck = (god) => {
    const { STRIKE_CARD_DEFINITION, DEFEND_CARD_DEFINITION, HEAL_CARD_DEFINITION } = window.COMMON_CARD_DEFINITIONS;
    const godDeckConfig = god.startingDeck || { strikes: 5, defends: 3, heals: 2 };

    const freshStartingDeck = [];
    for (let i = 0; i < godDeckConfig.strikes; i++) {
      freshStartingDeck.push({...STRIKE_CARD_DEFINITION});
    }
    for (let i = 0; i < godDeckConfig.defends; i++) {
      freshStartingDeck.push({...DEFEND_CARD_DEFINITION});
    }
    for (let i = 0; i < godDeckConfig.heals; i++) {
      freshStartingDeck.push({...HEAL_CARD_DEFINITION});
    }
    return freshStartingDeck;
  };

  const handleStartRun = async (customDeckOverride = null, ascensionDataOverride = null) => {
    if (!chosenGod) return;

    setIsCreatingRun(true);
    setIsStarting(true);

    try {
      const user = await base44.auth.me();
      if (!user) {
        await base44.auth.redirectToLogin(window.location.href);
        return;
      }

      if (livesData && livesData.lives <= 0) {
        alert('You are out of lives. Cannot start a new run.');
        return;
      }

      const currentLives = livesData?.lives ?? 5;
      const newLivesCount = Math.max(0, currentLives - 1);
      await base44.auth.updateMe({
        lives: newLivesCount,
        last_life_recovery: new Date().toISOString()
      });
      await checkLives();

      const oldRuns = await base44.entities.GameRun.filter({ status: 'in_progress', created_by: user.email });
      for (const run of oldRuns) {
        await base44.entities.GameRun.update(run.id, { status: 'lost' });
      }

      const deckToUse = customDeckOverride || customDeck;
      const newDeck = deckToUse.length > 0 ? deckToUse : buildStartingDeck(chosenGod);
      const dataToUse = ascensionDataOverride || ascensionData;

      console.log('[GodSelection] Built deck:', newDeck.length, 'cards', deckToUse.length > 0 ? '(Custom Deck)' : '(Starting Deck)');
      console.log('[GodSelection] Ascension data:', dataToUse);

      if (newDeck.length === 0) {
        console.error('[GodSelection] Failed to build deck - deck is empty.');
        return;
      }

      const runData = {
        god_id: chosenGod.id,
        victories: 0,
        status: 'in_progress',
        is_hard_mode: isHardMode,
        is_heroic_mode: isHeroicMode,
        is_mythic_mode: isMythicMode,
        is_wild_mode: isWildMode,
        is_custom_deck_mode: deckToUse.length > 0,
        divine_rank: dataToUse?.rank || 0,
        active_modifiers: dataToUse?.modifiers || [],
        run_data: {
          deck: newDeck,
          relics: [],
          player_health: null,
          max_player_health: null,
          necromancy_stacks: 0,
          cthulhu_madness: 0,
          cthulhu_next_attack_bonus: 0,
          player_burn_stacks: 0,
          player_poison_stacks: 0,
          enemy_confused_stacks: 0,
          baseEnergy: chosenGod.baseEnergy || 3
        }
      };

      console.log('[GodSelection] Creating run with data:', runData);

      const createdRun = await base44.entities.GameRun.create(runData);
      console.log('[GodSelection] Created new run:', createdRun);

      navigate(createPageUrl(`Combat?runId=${createdRun.id}`));
    } catch (error) {
      console.error('Failed to create run:', error);
      alert('Failed to start run. Please try again.');
      if (error.response?.status === 403 || error.message?.includes('must be logged in')) {
        await base44.auth.redirectToLogin(window.location.href);
      }
    } finally {
      setIsCreatingRun(false);
      setIsStarting(false);
    }
  };

  const handleCustomDeckComplete = (selectedCards) => {
    setCustomDeck(selectedCards);
    setShowCustomDeckBuilder(false);
    setTimeout(() => {
      handleStartRun(selectedCards, ascensionData);
    }, 100);
  };

  const confirmSelection = () => {
    setShowAscensionSelection(true);
  };

  const handleAscensionConfirm = (data) => {
    console.log('[GodSelection] Ascension confirmed with data:', data);
    setAscensionData(data);
    setShowAscensionSelection(false);
    handleStartRun(null, data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-6">
      <TalentTreeModal
        open={showTalentTree}
        onClose={() => setShowTalentTree(false)}
      />

      <CompanionLoadoutPanel
        open={showCompanionLoadout}
        onClose={() => setShowCompanionLoadout(false)}
        onLoadoutChanged={() => {}}
      />

      <CustomDeckBuilderModal
        open={showCustomDeckBuilder}
        onComplete={handleCustomDeckComplete}
        onCancel={() => {
          setShowCustomDeckBuilder(false);
          setCustomDeck([]);
        }}
        selectedGod={chosenGod}
      />

      <AscensionSelectionScreen
        open={showAscensionSelection}
        onConfirm={handleAscensionConfirm}
        onCancel={() => setShowAscensionSelection(false)}
        selectedGod={chosenGod}
        playerData={user}
      />

      <div className="max-w-6xl mx-auto">
        {livesData && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-black/60 border-2 border-red-500/50 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="w-6 h-6 text-red-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        {[...Array(livesData.maxLives)].map((_, i) => (
                          <Heart
                            key={i}
                            className={`w-5 h-5 ${i < livesData.lives ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
                          />
                        ))}
                        <span className="text-white font-bold ml-2">
                          {livesData.lives} / {livesData.maxLives}
                        </span>
                      </div>
                      {livesData.lives < livesData.maxLives && livesData.nextRecoveryIn && (
                        <p className="text-xs text-gray-400 mt-1">
                          Next life in {livesData.nextRecoveryIn} minute{livesData.nextRecoveryIn !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  {livesData.lives <= 0 && (
                    <div className="text-right">
                      <p className="text-red-400 font-bold">Out of Lives!</p>
                      <p className="text-xs text-gray-400">Recovers 1 per hour</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 relative"
        >
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-6 inline-block border-2 border-amber-500/50 shadow-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              Choose Your Deity
            </h1>
            <p className="text-lg md:text-xl text-amber-200 font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              Select the god who will champion your cause
            </p>
          </div>
          <div className="absolute top-0 right-0 flex flex-col sm:flex-row gap-2">
            {hasCompletedRun && (
              <>
                <Button
                  onClick={() => setShowTalentTree(true)}
                  variant="outline"
                  className="bg-black/80 backdrop-blur-sm border-cyan-500 text-cyan-300 hover:bg-cyan-500/20 hover:text-white shadow-lg"
                  disabled={isCreatingRun}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Talent Trees
                </Button>
                <Button
                  onClick={() => setShowCompanionLoadout(true)}
                  variant="outline"
                  className="bg-black/80 backdrop-blur-sm border-purple-500 text-purple-300 hover:bg-purple-500/20 hover:text-white shadow-lg"
                  disabled={isCreatingRun}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Companions
                </Button>
              </>
            )}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
          {isLoading ? (
            Array.from({ length: 12 }).map((_, index) => (
              <Skeleton key={index} className="w-full aspect-[3/4] rounded-2xl bg-gray-700/50" />
            ))
          ) : (
            allGods.map((god, index) => {
              const { locked: isGodLocked, reason: lockReason } = getGodUnlockStatus(god, user, isAdmin);

              return (
                <motion.div
                  key={god.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GodCard
                    god={god}
                    onSelect={() => handleGodSelect(god, isGodLocked)}
                    isSelected={chosenGod?.id === god.id}
                    isLocked={isGodLocked}
                    lockReason={lockReason}
                    disabled={isCreatingRun}
                  />
                </motion.div>
              );
            })
          )}
        </div>

        {hasWon && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center space-x-6 my-6 flex-wrap gap-4"
            >
                <div className="bg-black/80 backdrop-blur-md rounded-full px-6 py-3 flex items-center space-x-3 border-2 border-red-500/50 shadow-lg">
                  <Switch
                      id="hard-mode-toggle"
                      checked={isHardMode}
                      onCheckedChange={(checked) => {
                        setIsHardMode(checked);
                        if (!checked) {
                          setIsHeroicMode(false);
                          setIsMythicMode(false);
                        }
                      }}
                      className="data-[state=checked]:bg-red-600"
                      disabled={isCreatingRun}
                  />
                  <Label htmlFor="hard-mode-toggle" className="text-xl font-bold text-red-300 cursor-pointer drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      Hard Mode
                  </Label>
                </div>

                {hasWonHardMode && (
                    <div className={`bg-black/80 backdrop-blur-md rounded-full px-6 py-3 flex items-center space-x-3 border-2 shadow-lg ${isHardMode ? 'border-purple-500/50' : 'border-gray-600/50'}`}>
                      <Switch
                          id="heroic-mode-toggle"
                          checked={isHeroicMode}
                          onCheckedChange={(checked) => {
                            setIsHeroicMode(checked);
                            if (!checked) {
                              setIsMythicMode(false);
                            }
                          }}
                          disabled={!isHardMode || isCreatingRun}
                          className="data-[state=checked]:bg-purple-600"
                      />
                      <Label htmlFor="heroic-mode-toggle" className={`text-xl font-bold cursor-pointer drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${isHardMode ? 'text-purple-300' : 'text-gray-500'}`}>
                          Heroic Mode
                      </Label>
                    </div>
                )}

                {hasWonHeroicMode && (
                    <motion.div
                      className={`bg-black/80 backdrop-blur-md rounded-full px-6 py-3 flex items-center space-x-3 border-2 shadow-lg ${isHardMode && isHeroicMode ? 'border-amber-500/50' : 'border-gray-600/50'}`}
                      animate={isHardMode && isHeroicMode ? {
                        boxShadow: [
                          '0 0 20px rgba(245, 158, 11, 0.3)',
                          '0 0 40px rgba(245, 158, 11, 0.6)',
                          '0 0 20px rgba(245, 158, 11, 0.3)',
                        ]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Switch
                          id="mythic-mode-toggle"
                          checked={isMythicMode}
                          onCheckedChange={setIsMythicMode}
                          disabled={!isHardMode || !isHeroicMode || isCreatingRun}
                          className="data-[state=checked]:bg-amber-600"
                      />
                      <Label htmlFor="mythic-mode-toggle" className={`text-xl font-bold cursor-pointer drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${isHardMode && isHeroicMode ? 'text-amber-300' : 'text-gray-500'}`}>
                          Mythic Mode
                      </Label>
                    </motion.div>
                )}

                <div className="bg-black/80 backdrop-blur-md rounded-full px-6 py-3 flex items-center space-x-3 border-2 border-cyan-500/50 shadow-lg">
                  <Switch
                      id="wild-mode-toggle"
                      checked={isWildMode}
                      onCheckedChange={setIsWildMode}
                      className="data-[state=checked]:bg-cyan-600"
                      disabled={isCreatingRun}
                  />
                  <Label htmlFor="wild-mode-toggle" className="text-xl font-bold text-cyan-300 cursor-pointer drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      Wild Mode
                  </Label>
                </div>
            </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center space-y-4"
        >
          <Button
            onClick={() => {
              if (!chosenGod) {
                alert('Please select a god first!');
                return;
              }
              setShowCustomDeckBuilder(true);
            }}
            disabled={!chosenGod || isLoading || isStarting || isCreatingRun}
            size="lg"
            className="w-full max-w-md font-bold text-xl px-12 py-6 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 border-2 border-purple-800 text-white shadow-2xl"
          >
            <Sparkles className="w-6 h-6 mr-2" />
            Custom Deck Mode (20 Battles)
          </Button>

          <Button
            onClick={confirmSelection}
            disabled={!chosenGod || isLoading || startingDeck.length === 0 || isStarting || isCreatingRun}
            size="lg"
            className={`font-bold text-xl px-12 py-6 disabled:opacity-50 shadow-2xl ${
              isMythicMode
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-700 hover:via-orange-700 hover:to-red-700 border-2 border-amber-800'
                : isHeroicMode
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 border-2 border-red-800'
                  : isHardMode
                    ? 'bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 border-2 border-orange-800'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 border-2 border-amber-800'
            } text-white`}
          >
            {chosenGod ? `Battle as ${chosenGod.name}` : (isStarting ? 'Starting Run...' : 'Select a God')}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
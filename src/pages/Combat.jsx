import React, { useReducer, useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, BookOpen, Sparkles, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import ModifierHUD from '../components/game/ModifierHUD';
import CompanionHUD from '../components/game/CompanionHUD'; // Added for companion system
import CompanionBondModal from '../components/game/CompanionBondModal'; // Added for companion system
import DeckVisual from '../components/game/DeckVisual'; // Added for deck visual

// IMPORTANT: combatReducer and initialCombatState must be updated to include 'lastCardTypePlayed' in state
// and combatActions must include 'UPDATE_COMBAT_STATE' for this feature to work.
import { combatReducer, initialCombatState, combatActions } from '../components/game/combatReducer';
import {
  calculateShield,
  calculateHealing,
  calculateCardCost,
  loadEnemyForBattle,
} from '../components/game/combatHelpers';
import { createStaticAbilityHandlers } from '../components/game/GodStaticAbilities';
import { CompanionSystem } from '../components/game/CompanionSystem'; // Added for companion system

import PlayerStatus from '../components/game/PlayerStatus';
import EnemyDisplay from '../components/game/EnemyDisplay';
import BattleCard from '../components/game/BattleCard';
import RelicSelectionModal from '../components/game/RelicSelectionModal';
import CardSelectionModal from '../components/game/CardSelectionModal';
import DeckViewModal from '../components/game/DeckViewModal';
import CardRemovalModal from '../components/game/CardRemovalModal';
import CardEffectsLegendModal from '../components/game/CardEffectsLegendModal';
import GodAbilitiesModal from '../components/game/GodAbilitiesModal';
import PantheonBlessingModal from '../components/game/PantheonBlessingModal';

export default function Combat() {
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const runId = urlParams.get('runId');

  // Assume initialCombatState and combatReducer are updated to include 'isAnimating: false'
  // and combatActions includes 'SET_ANIMATING'.
  const [state, dispatch] = useReducer(combatReducer, { ...initialCombatState, isAnimating: false });

  const latestStateRef = useRef(state);
  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  const [isLoading, setIsLoading] = useState(true);
  const [showRelicModal, setShowRelicModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false); // Replaces showCardSelection
  const [showCardPeekModal, setShowCardPeekModal] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false); // Replaces showDeckView
  const [showTalentModal, setShowTalentModal] = useState(false);
  const [showLegendModal, setShowLegendModal] = useState(false); // Replaces showCardEffectsLegend
  const [showOdinScryModal, setShowOdinScryModal] = useState(false);
  const [showGodAbilitiesModal, setShowGodAbilitiesModal] = useState(false); // Replaces showGodAbilities
  const [showCardRemovalModal, setShowCardRemovalModal] = useState(false);
  const [showPantheonBlessingModal, setShowPantheonBlessingModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [equippedCompanions, setEquippedCompanions] = useState([]); // Added for companion system
  const [companionSystem, setCompanionSystem] = useState(null); // Added for companion system
  const [companionReadyStates, setCompanionReadyStates] = useState({}); // Added for companion system
  const [showCompanionBondModal, setShowCompanionBondModal] = useState(false); // Added for companion system
  const [currentRunData, setCurrentRunData] = useState(null);

  const [currentUser, setCurrentUser] = useState(null); // Added for DeckVisual
  const [allCosmetics, setAllCosmetics] = useState([]); // Added for DeckVisual
  const [equippedGodArt, setEquippedGodArt] = useState(null); // Added for equipped god art

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    setIsNavigating(false); // Initialize state based flag
    return () => {
      isMountedRef.current = false;
      console.log('[Combat] Component unmounting');
    };
  }, []);

  // Fetch cosmetics once on mount
  useEffect(() => {
    const fetchCosmetics = async () => {
      try {
        const cosmeticsList = await base44.entities.CosmeticReward.list();
        if (isMountedRef.current) {
          setAllCosmetics(cosmeticsList);
        }
      } catch (error) {
        console.error("[Combat] Error fetching cosmetics:", error);
      }
    };
    fetchCosmetics();
  }, []);


  const addLog = useCallback((message, type = 'info') => {
    if (!isMountedRef.current) return;
    dispatch({
      type: combatActions.ADD_BATTLE_LOG,
      payload: { message, type, timestamp: Date.now() },
    });
  }, []);

  const checkAnubisEternalBalance = useCallback((damageTaken) => {
    if (!latestStateRef.current.god || latestStateRef.current.god.name !== 'Anubis') return;
    if (!latestStateRef.current.godTalents?.tier4 || latestStateRef.current.godTalents.tier4 !== 'eternal_balance') return;

    const currentDamage = latestStateRef.current.godState.anubisEternalBalanceDamageTaken || 0;
    const newDamage = currentDamage + damageTaken;
    const currentStacks = latestStateRef.current.godState.anubisEternalBalanceStacks || 0;
    
    const oldStackCount = Math.floor(currentDamage / 25);
    const newStackCount = Math.floor(newDamage / 25);
    
    if (newStackCount > oldStackCount) {
      const stacksGained = newStackCount - oldStackCount;
      const newTotalStacks = currentStacks + stacksGained;
      
      dispatch({
        type: combatActions.UPDATE_GOD_STATE,
        payload: {
          anubisEternalBalanceDamageTaken: newDamage,
          anubisEternalBalanceStacks: newTotalStacks
        }
      });
      
      const damageBonus = stacksGained * 5;
      const shieldBonus = stacksGained * 5;
      addLog(`⚖️👑 Eternal Balance activated! +${damageBonus} Attack & +${shieldBonus} Shield (${newTotalStacks} total stacks)`, 'special');
      console.log('[Anubis] Eternal Balance gained', stacksGained, 'stack(s). Total:', newTotalStacks);
    } else {
      dispatch({
        type: combatActions.UPDATE_GOD_STATE,
        payload: { anubisEternalBalanceDamageTaken: newDamage }
      });
    }
  }, [dispatch, addLog, latestStateRef]);

  const calculateMaxHealth = useCallback((god, godTalents, relics, divineModifiers = []) => {
    let maxHealth = god.baseHealth;

    // Apply Divine Modifier player health reduction
    const healthMultModifier = divineModifiers.find(m => m.effect_type === 'player_max_health_mult');
    if (healthMultModifier) {
      maxHealth = Math.floor(maxHealth * healthMultModifier.effect_value);
      console.log('[calculateMaxHealth] Player max health multiplied:', healthMultModifier.effect_value, 'new max health:', maxHealth);
    }

    // Apply talent bonuses (STATIC - only applied once)
    if (god.name === 'Thor' && godTalents?.tier1 === 'asgardian_vigor') {
      maxHealth += 15;
    }
    if (god.name === 'Ra' && godTalents?.tier1 === 'sun_blessing') {
      maxHealth += 20;
    }
    if (god.name === 'Hades' && godTalents?.tier1 === 'dark_resilience') {
      maxHealth += 25;
    }
    if (god.name === 'Baron Samedi' && godTalents?.tier1 === 'voodoo_resilience') {
      maxHealth += 25;
    }
    if (god.name === 'Odin' && godTalents?.tier1 === 'valhalla_blessing') {
      maxHealth += 20;
    }
    if (god.name === 'Cthulhu' && godTalents?.tier2 === 'deep_one_blessing') {
      maxHealth += 30;
    }
    if (god.name === 'Zeus' && godTalents?.tier3 === 'god_king') {
      maxHealth += 20;
    }
    if (god.name === 'Odin' && godTalents?.tier3 === 'king_of_asgard') {
      maxHealth += 30;
    }

    // Apply relic bonuses
    const heartCount = relics.filter(r => r.name === "Ancient Heart").length;
    maxHealth += heartCount * 10;

    const shieldCount = relics.filter(r => r.name === "Titan's Shield").length;
    maxHealth += shieldCount * 15;

    return maxHealth;
  }, []);


  const calculateBonusEnergy = useCallback(({ relics }) => {
    let bonusEnergy = 0;
    // Relics that grant bonus energy
    const hasPureGold = relics?.some(r => r.name === "Pure Gold");
    if (hasPureGold) {
      bonusEnergy += 1;
    }
    
    const hasBerserkerHarness = relics?.some(r => r.name === "Berserker Harness");
    if (hasBerserkerHarness) {
      bonusEnergy += 2;
    }
    
    // Add other relics that modify max energy here
    return bonusEnergy;
  }, []);


  const handleDefeat = useCallback(() => {
    if (isNavigating) return;

    console.log('=== DEFEAT HANDLER ===');
    console.log('[handleDefeat] Player defeated');
    setIsNavigating(true);

    base44.entities.GameRun.update(state.run.id, {
      status: 'lost',
      victories: state.victories
    }).then(() => {
      console.log('[handleDefeat] ✓ Run updated to LOST');

      base44.auth.me().then(user => {
        base44.auth.updateMe({
          total_completed_runs: (user.total_completed_runs || 0) + 1,
        }).catch(e => console.error('[handleDefeat] Error updating user:', e));
      }).catch(e => console.error('[handleDefeat] Error fetching user:', e));

      // Also check achievements on defeat
      return base44.functions.invoke('checkAchievements', { runId: state.run.id });
    }).then((achievementResult) => {
      console.log('[handleDefeat] ✓ Achievements checked:', achievementResult.data);
      if (isMountedRef.current) {
        navigate(createPageUrl(`Defeat?god=${encodeURIComponent(state.god.name)}&victories=${state.victories}`));
      }
    }).catch(e => {
      console.error('[handleDefeat] Error updating run to lost or checking achievements:', e);
      if (isMountedRef.current) {
        navigate(createPageUrl(`Defeat?god=${encodeURIComponent(state.god.name)}&victories=${state.victories}`));
      }
    });
  }, [state, navigate, isMountedRef, isNavigating]);

  const handleVictoryAndProgressRun = useCallback(async () => {
    if (state.turnPhase === 'victory') return;
    if (isNavigating) {
      console.log('[handleVictoryAndProgressRun] Already navigating, aborting');
      return;
    }

    console.log('=== VICTORY HANDLER ===');
    console.log('[handleVictoryAndProgressRun] Current victories:', state.victories);
    dispatch({ type: combatActions.SET_PROCESSING, payload: true });

    const newVictories = state.victories + 1;
    console.log('[handleVictoryAndProgressRun] New victories will be:', newVictories);

    const hasVialOfIchor = state.relics?.some(r => r.name === "Vial of Ichor");
    if (hasVialOfIchor) {
      const healAmount = 15;
      const newHealth = Math.min(state.player.health + healAmount, state.player.maxHealth);
      dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: newHealth } });
      addLog('🧪 Vial of Ichor: Restored 15 HP!', 'heal');
    }

    let baronSamediLaughBonus = false;
    if (state.god?.name === 'Baron Samedi' &&
        state.godTalents?.tier4 === 'laughter_of_the_grave' &&
        state.enemy.burnStacks > 0) {
      baronSamediLaughBonus = true;
      addLog('🎭🔥 Enemy died while Burning! Next battle starts with +15 HP!', 'special');
      console.log('[handleVictoryAndProgressRun] Baron Samedi Laughter of the Grave bonus will be applied next battle');
    }

    dispatch({ type: combatActions.UPDATE_VICTORIES, payload: newVictories });

    const updatedRunData = {
      ...state.run.run_data,
      deck: [...state.deck.hand, ...state.deck.drawPile, ...state.deck.discardPile],
      relics: state.relics,
      player_health: state.player.health,
      max_player_health: state.player.maxHealth,
      necromancy_stacks: state.godState.necromancyStacks,
      cthulhu_madness: state.godState.cthulhuMadness,
      cthulhu_next_attack_bonus: state.godState.cthulhuNextAttackBonus,
      player_burn_stacks: state.player.burnStacks || 0,
      player_poison_stacks: state.player.poisonStacks || 0,
      base_energy: state.player.maxEnergy,
      last_card_type_played: state.lastCardTypePlayed, // Save last card type played
      athena_aegis_ascendant_used: state.godState.athenaAegisAscendantUsed,
      athena_aegis_ascendant_turns_remaining: state.godState.athenaAegisAscendantTurnsRemaining,
      shiva_dance_of_annihilation_active: state.godState.shivaDanceOfAnnihilationActive, // Save Shiva Dance of Annihilation state
      anubis_eternal_balance_stacks: state.godState.anubisEternalBalanceStacks || 0,
      baron_samedi_laugh_bonus: baronSamediLaughBonus, // Add this line
      ganesha_enlightenment_active: state.godState.ganeshaEnlightenmentActive || false,
      ganesha_total_charge_stacks: state.godState.ganeshaTotalChargeStacks || 0,
      // Persist boss counters
      typhon_monstrous_breath_counter: state.godState.typhonMonstrousBreathCounter || 0,
      typhon_terrifying_roar_counter: state.godState.typhonTerrifyingRoarCounter || 0,
      hydra_regenerate_head_counter: state.godState.hydraRegenerateHeadCounter || 0,
      hydra_acidic_spit_counter: state.godState.hydra_acidic_spit_counter || 0,
      thor_press_the_advantage_counter: state.godState.thorPressTheAdvantageCounter,
      thor_press_the_advantage_ready: state.godState.thorPressTheAdvantageReady,
      shiva_last_card_type: state.godState.shivaLastCardType,
      baron_samedi_first_attack_used: state.godState.baronSamediFirstAttackUsed,
      quetzalcoatl_cards_played_this_turn: state.godState.quetzalcoatlCardsPlayedThisTurn,
      loki_cards_played_this_turn: state.godState.lokiCardsPlayedThisTurn,
      loki_chaos_magic_active: state.godState.lokiChaosMagicActive,
      anubis_death_cheats_used: state.godState.anubisDeathCheatsUsed,
      susanoo_cards_played_this_battle: state.godState.susanooCardsPlayedThisBattle,
      susanoo_fury_unbound_bonus: state.godState.susanooFuryUnboundBonus,
      susanoo_wrath_stacks: state.godState.susanooWrathStacks,
      ra_next_damage_bonus: state.godState.raNextDamageBonus,
    };

    if (newVictories >= 10) {
      console.log('[handleVictoryAndProgressRun] 🏆 RUN COMPLETED! Updating to WON status');
      
      setIsNavigating(true);

      base44.entities.GameRun.update(state.run.id, {
        status: 'won',
        victories: newVictories,
        run_data: updatedRunData, // Use updatedRunData here as well
        equipped_companion_ids: equippedCompanions.map(c => c.id), // Added for companion system
        companion_telemetry: companionSystem?.getTelemetry() || {} // Added for companion system
      }).then(() => {
        console.log('[handleVictoryAndProgressRun] ✓ Run updated to WON');

        return base44.auth.me();
      }).then(user => {
        const godRuns = user.god_runs_completed || {};
        const isHardMode = state.run.is_hard_mode;
        const isHeroicMode = state.run.is_heroic_mode;
        const isMythicMode = state.run.is_mythic_mode;
        const isWildModeRun = state.run?.is_wild_mode === true; // Added from outline

        const updateData = {
          has_won_run: true,
          total_completed_runs: (user.total_completed_runs || 0) + 1,
          total_victories: (user.total_victories || 0) + 1,
          god_runs_completed: {
            ...godRuns,
            [state.god.name]: (godRuns[state.god.name] || 0) + 1,
          },
        };

        if (isHardMode) updateData.has_won_hard_mode = true;
        if (isHeroicMode) updateData.has_won_heroic_mode = true;
        if (isMythicMode) updateData.has_won_mythic_mode = true;
        if (isWildModeRun) { // Added from outline
          console.log("[Combat] 🎲 Wild Mode victory detected!");
          updateData.wild_mode_victories = (user.wild_mode_victories || 0) + 1;
        }
        
        // Update highest rank completed
        const currentRank = state.run?.divine_rank || 0;
        if (currentRank > (user.highest_rank_completed || 0)) {
          updateData.highest_rank_completed = currentRank;
        }

        return base44.auth.updateMe(updateData);
      }).then(async (user) => { // Made async to await leaderboard update
        console.log('[handleVictoryAndProgressRun] ✓ User stats updated');
        
        // Update leaderboard entry (Added from outline)
        const leaderboardEntries = await base44.entities.LeaderboardEntry.filter({ 
          user_email: user.email 
        });
        
        if (leaderboardEntries.length > 0) {
          const leaderboardUpdates = {
            total_victories: user.total_victories, // Use the updated user's data
            total_completed_runs: user.total_completed_runs // Use the updated user's data
          };
          
          const isWildModeRun = state.run?.is_wild_mode === true; // Redeclare or pass from parent scope
          if (isWildModeRun) {
            leaderboardUpdates.wild_mode_victories = user.wild_mode_victories; // Use the updated user's data
          }
          
          await base44.entities.LeaderboardEntry.update(leaderboardEntries[0].id, leaderboardUpdates);
          console.log("[Combat] ✅ Leaderboard updated successfully");
        }
        // End leaderboard update

        // Check for achievements
        return base44.functions.invoke('checkAchievements', { runId: state.run.id });
      }).then((achievementResult) => {
        console.log('[handleVictoryAndProgressRun] ✓ Achievements checked:', achievementResult.data);
        
        // Check for titles
        return base44.functions.invoke('checkTitles', { runId: state.run.id });
      }).then((titleResult) => {
        console.log('[handleVictoryAndProgressRun] ✓ Titles checked:', titleResult.data);
        
        // Check for quest progress
        return base44.functions.invoke('checkQuests', { runId: state.run.id });
      }).then((questResult) => {
        console.log('[handleVictoryAndProgressRun] ✓ Quests checked:', questResult.data);
        
        if (!isMountedRef.current) {
          console.log('[handleVictoryAndProgressRun] Component unmounted, aborting navigation');
          return;
        }

        console.log('[handleVictoryAndProgressRun] Navigating to Victory page');
        navigate(createPageUrl(`Victory?god=${encodeURIComponent(state.god.name)}&victories=${newVictories}&runId=${state.run.id}`));
      }).catch(e => {
        console.error('[handleVictoryAndProgressRun] Error in victory flow:', e);
        if (isMountedRef.current && !isNavigating) {
          navigate(createPageUrl(`Victory?god=${encodeURIComponent(state.god.name)}&victories=${newVictories}&runId=${state.run.id}`));
        }
      });
    } else {
      // Mid-run victory - show companion bond modal first if companions equipped
      console.log('[handleVictoryAndProgressRun] Mid-run victory, preparing rewards');

      base44.entities.GameRun.update(state.run.id, {
        victories: newVictories,
        run_data: updatedRunData,
        equipped_companion_ids: equippedCompanions.map(c => c.id), // Added for companion system
        companion_telemetry: companionSystem?.getTelemetry() || {} // Added for companion system
      }).then(() => {
        console.log('[handleVictoryAndProgressRun] Run progress saved');
        
        // Check for achievements even mid-run
        return base44.functions.invoke('checkAchievements', { runId: state.run.id });
      }).then((achievementResult) => {
        console.log('[handleVictoryAndProgressRun] Achievements checked:', achievementResult.data);
        
        // Check for titles mid-run
        return base44.functions.invoke('checkTitles', { runId: state.run.id });
      }).then((titleResult) => {
        console.log('[handleVictoryAndProgressRun] Titles checked:', titleResult.data);
        
        // Check for quest progress
        return base44.functions.invoke('checkQuests', { runId: state.run.id });
      }).then((questResult) => {
        console.log('[handleVictoryAndProgressRun] Quests checked:', questResult.data);

        if (!isMountedRef.current || isNavigating) {
          console.log('[handleVictoryAndProgressRun] Component unmounted or navigating, aborting reward modals');
          return;
        }

        // Show companion bond modal first if companions equipped
        if (equippedCompanions.length > 0) {
          if (isMountedRef.current) setShowCompanionBondModal(true);
        } else {
          // Show regular rewards
          // The victory count is state.victories (which is newVictories at this point)
          const currentVictories = state.victories;
          if (currentVictories === 4 || currentVictories === 8) {
            if (isMountedRef.current) setShowCardRemovalModal(true);
          } else if (currentVictories === 3 || currentVictories === 6 || currentVictories === 9) {
            if (isMountedRef.current) setShowRelicModal(true);
          } else {
            if (isMountedRef.current) setShowCardModal(true);
          }
        }
      }).catch(e => {
        console.error('[handleVictoryAndProgressRun] Error saving progress or checking achievements/titles:', e);
        // If save/achievement fails, still try to proceed with rewards if component is mounted
        if (!isMountedRef.current || isNavigating) {
          console.log('[handleVictoryAndProgressRun] Component unmounted or navigating, aborting reward modals after error');
          return;
        }
        // Fallback to show rewards even if companion modal logic fails
        if (equippedCompanions.length > 0) {
          if (isMountedRef.current) setShowCompanionBondModal(true);
        } else {
          // The victory count is state.victories (which is newVictories at this point)
          const currentVictories = state.victories;
          if (currentVictories === 4 || currentVictories === 8) {
              if (isMountedRef.current) setShowCardRemovalModal(true);
          } else if (currentVictories === 3 || currentVictories === 6 || currentVictories === 9) {
              if (isMountedRef.current) setShowRelicModal(true);
          } else {
              if (isMountedRef.current) setShowCardModal(true);
          }
        }
      });
    }
  }, [state, navigate, addLog, dispatch, isMountedRef, isNavigating, setShowCardRemovalModal, setShowRelicModal, setShowCardModal, equippedCompanions, companionSystem]);

  const saveProgress = useCallback(async (forceIsVictory = null) => {
    if (isNavigating) return;
    // This function's body is not provided in the outline.
    // It's assumed to be a new definition or a modification where only the signature and the guard are specified.
    // The previous state and dispatch are generally used for saving progress,
    // but the outline only requested the signature and guard.
  }, [isNavigating]);

  useEffect(() => {
    const loadRunData = async () => {
      if (isNavigating) {
        console.log('[Combat] Already navigating away, aborting load');
        return;
      }

      if (!runId) {
        console.log('[Combat] No runId, redirecting to home');
        if (isMountedRef.current && !isNavigating) {
          navigate(createPageUrl('Home'));
        }
        return;
      }

      try {
        console.log("=== LOADING RUN DATA ===");
        console.log('[Combat] Loading run data for runId:', runId);
        let runData = await base44.entities.GameRun.get(runId);

        if (!runData) {
          console.error('[Combat] Run not found');
          if (isMountedRef.current && !isNavigating) {
            navigate(createPageUrl('Home'));
          }
          return;
        }

        if (!isMountedRef.current) {
          console.log('[Combat] Component unmounted during load, aborting');
          return;
        }

        console.log("Run data loaded:", {
          id: runData.id,
          status: runData.status,
          victories: runData.victories
        });

        if (!isLoading) { // Changed from isInitialLoad
          console.log('[Combat] Not initial load, skipping status redirect check');
          return;
        }

        if (runData.status === 'won') {
          console.log('[Combat] Run status is \'won\', redirecting to Victory');
          if (isMountedRef.current && !isNavigating) {
            setIsNavigating(true);
            const godData = await base44.entities.God.get(runData.god_id);
            navigate(createPageUrl(`Victory?god=${encodeURIComponent(godData?.name || 'Unknown')}&victories=${runData.victories}`));
          }
          return;
        }
        if (runData.status === 'lost') {
          console.log('[Combat] Run status is \'lost\', redirecting to Defeat');
          if (isMountedRef.current && !isNavigating) {
            setIsNavigating(true);
            const godData = await base44.entities.God.get(runData.god_id);
            navigate(createPageUrl(`Defeat?god=${encodeURIComponent(godData?.name || 'Unknown')}&victories=${runData.victories}`));
          }
          return;
        }

        if (runData.status !== 'in_progress') {
            console.error('[Combat] Run has unexpected status:', runData.status, 'redirecting to Home');
            if (isMountedRef.current && !isNavigating) {
                navigate(createPageUrl('Home'));
            }
            return;
        }

        console.log("✓ Run status is 'in_progress', continuing...");

        setCurrentRunData(runData);

        console.log('[Combat] Loading god:', runData.god_id);
        const godData = await base44.entities.God.get(runData.god_id);

        if (!godData) {
          console.error('[Combat] God not found or component unmounted');
          if (isMountedRef.current && !isNavigating) {
            navigate(createPageUrl('Home'));
          }
          return;
        }

        if (!isMountedRef.current) {
          console.log('[Combat] Component unmounted during god data fetch, aborting.');
          return;
        }

        console.log("God data loaded:", godData);
        console.log("Run data structure:", runData.run_data);

        // Load user data and equipped cosmetics
        const user = await base44.auth.me(); // Fetch current user
        setCurrentUser(user); // Set currentUser state

        // Load equipped god art
        if (user.equipped_cosmetics?.god_art) {
          const godArts = user.equipped_cosmetics.god_art;
          
          // Check if it's the new object format or old string format
          if (typeof godArts === 'object' && !Array.isArray(godArts)) {
            // New format: { "Zeus": "art_id", "Thor": "art_id" }
            const artIdForThisGod = godArts[godData.name] || godArts[godData.id];
            if (artIdForThisGod) {
              const godArtCosmetic = await base44.entities.CosmeticReward.get(artIdForThisGod);
              if (godArtCosmetic) {
                setEquippedGodArt(godArtCosmetic.asset_url);
              }
            }
          } else if (typeof godArts === 'string') {
            // Old format: single ID - still support it
            const godArtCosmetic = await base44.entities.CosmeticReward.get(godArts);
            if (godArtCosmetic && (godArtCosmetic.target_id === godData.id || godArtCosmetic.target_name === godData.name)) {
              setEquippedGodArt(godArtCosmetic.asset_url);
            }
          }
        }

        // Load equipped companions
        const equippedIds = user.equipped_companions || [];
        let companionData = [];
        let system = null;
        
        if (equippedIds.length > 0) {
          companionData = await Promise.all(
            equippedIds.map(id => base44.entities.Companion.get(id))
          );
          setEquippedCompanions(companionData);
          
          // Initialize companion system
          const config = await base44.entities.companions_config.list();
          system = new CompanionSystem(companionData, config[0], addLog, setCompanionReadyStates);
          system.initBattle();
          setCompanionSystem(system);
          
          console.log('[loadRunData] Loaded companions:', companionData.map(c => c.name));
        }

        let playerDeck = runData.run_data?.deck || [];
        let playerRelics = runData.run_data?.relics || [];
        let playerHealth = runData.run_data?.player_health;
        let maxPlayerHealth = runData.run_data?.max_player_health;
        let necromancyStacks = runData.run_data?.necromancy_stacks || 0;
        let cthulhuMadness = runData.run_data?.cthulhu_madness || 0;
        let cthulhuNextAttackBonus = runData.run_data?.cthulhu_next_attack_bonus || 0;
        let playerBurnStacks = runData.run_data?.player_burn_stacks || 0;
        let playerPoisonStacks = runData.run_data?.player_poison_stacks || 0;
        let enemyConfusedStacks = runData.run_data?.enemy_confused_stacks || 0;
        let lastCardTypePlayed = runData.run_data?.last_card_type_played || null;

        // Athena Aegis Ascendant
        let athenaAegisAscendantUsed = runData.run_data?.athena_aegis_ascendant_used || false;
        let athenaAegisAscendantTurnsRemaining = runData.run_data?.athena_aegis_ascendant_turns_remaining || 0;
        
        // Shiva Dance of Annihilation
        let shivaDanceOfAnnihilationActive = runData.run_data?.shiva_dance_of_annihilation_active || false;
        
        // Ganesha Path of Enlightenment
        let ganeshaEnlightenmentActive = runData.run_data?.ganesha_enlightenment_active || false;
        let ganeshaTotalChargeStacks = runData.run_data?.ganesha_total_charge_stacks || 0;


        console.log("Extracted deck:", playerDeck.length, "cards");
        console.log("Extracted relics:", playerRelics.length, "relics");

        // const user = await base44.auth.me(); // Already fetched above
        console.log('[Combat] Loading user talents for god:', godData.name);

        const godTalents = {
          tier1: user.god_talents_tier1?.[godData.name] || null,
          tier2: user.god_talents_tier2?.[godData.name] || null,
          tier3: user.god_talents_tier3?.[godData.name] || null,
          tier4: user.god_talents_tier4?.[godData.name] || null,
        };

        console.log('[Combat] God talents loaded:', godTalents);

        // Calculate max health based on talents and relics
        const calculatedMaxHealth = calculateMaxHealth(godData, godTalents, playerRelics, runData.active_modifiers || []);
        if (maxPlayerHealth === null || maxPlayerHealth === undefined || maxPlayerHealth < calculatedMaxHealth) {
          maxPlayerHealth = calculatedMaxHealth;
          console.log("[Combat] Initialized/Updated max player health to:", maxPlayerHealth);
        }

        if (playerHealth === null || playerHealth === undefined) {
          playerHealth = maxPlayerHealth; // Start at full health if not previously set
          console.log("[Combat] Initialized player health to:", playerHealth);
        } else {
          // Ensure current health doesn't exceed new max health after recalculation
          playerHealth = Math.min(playerHealth, maxPlayerHealth);
        }

        if (playerDeck.length === 0) {
          console.log('[Combat] No deck found, creating starting deck');

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
            console.log('[Combat] Could not load game settings, using defaults');
          }

          const STRIKE_CARD_DEFINITION = {
            id: crypto.randomUUID(), // Assign unique ID
            name: "Strike",
            type: "damage",
            value: 8,
            cost: 1,
            description: "Deal 8 damage.",
            gradient: "bg-gradient-to-br from-red-500 to-orange-500",
            image: strikeImg,
            comboType: "damage", // Combo type for Strike
            comboBonus: 2, // Example combo bonus
          };
          const DEFEND_CARD_DEFINITION = {
            id: crypto.randomUUID(), // Assign unique ID
            name: "Defend",
            type: "shield",
            value: 6,
            cost: 1,
            description: "Gain 6 Shield.",
            gradient: "bg-gradient-to-br from-blue-500 to-cyan-500",
            image: defendImg,
            comboType: "shield", // Combo type for Defend
            comboBonus: 2, // Example combo bonus
          };
          const HEAL_CARD_DEFINITION = {
            id: crypto.randomUUID(), // Assign unique ID
            name: "Heal",
            type: "heal",
            value: 6,
            cost: 1,
            description: "Restore 6 Health.",
            gradient: "bg-gradient-to-br from-green-500 to-emerald-500",
            image: healImg,
            comboType: "heal", // Combo type for Heal
            comboBonus: 2, // Example combo bonus
          };

          const godDeckConfig = godData.startingDeck || { strikes: 5, defends: 3, heals: 2 };

          playerDeck = [];
          for (let i = 0; i < godDeckConfig.strikes; i++) {
            playerDeck.push({ ...STRIKE_CARD_DEFINITION, id: crypto.randomUUID() });
          }
          for (let i = 0; i < godDeckConfig.defends; i++) {
            playerDeck.push({ ...DEFEND_CARD_DEFINITION, id: crypto.randomUUID() });
          }
          for (let i = 0; i < godDeckConfig.heals; i++) {
            playerDeck.push({ ...HEAL_CARD_DEFINITION, id: crypto.randomUUID() });
          }

          console.log('[Combat] Created starting deck with', playerDeck.length, 'cards');

          await base44.entities.GameRun.update(runId, {
            run_data: {
              ...runData.run_data,
              deck: playerDeck
            }
          });
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        console.log("Loading enemy for battle");
        const enemy = await loadEnemyForBattle(runData.victories, 0, runData.is_custom_deck_mode || false, runData.active_modifiers || []);
        console.log("Enemy loaded:", enemy);
        
        // Apply Divine Ascension modifiers to enemy
        const activeModifiers = runData.active_modifiers || [];
        console.log('[Combat] Active modifiers:', activeModifiers);
        
        // Apply enemy health multiplier
        const healthMultModifier = activeModifiers.find(m => m.effect_type === 'enemy_health_mult');
        if (healthMultModifier) {
          enemy.maxHealth = Math.floor(enemy.maxHealth * healthMultModifier.effect_value);
          enemy.health = enemy.maxHealth;
          console.log('[Combat] Enemy health multiplied:', healthMultModifier.effect_value, 'new health:', enemy.maxHealth);
        }
        
        // Apply enemy attack multiplier
        const attackMultModifier = activeModifiers.find(m => m.effect_type === 'enemy_attack_mult');
        if (attackMultModifier) {
          enemy.nextAttack = Math.floor(enemy.nextAttack * attackMultModifier.effect_value);
          console.log('[Combat] Enemy attack multiplied:', attackMultModifier.effect_value, 'new attack:', enemy.nextAttack);
        }

        if (!isMountedRef.current) {
          console.log('[Combat] Component unmounted during enemy data fetch, aborting.');
          return;
        }

        if (enemyConfusedStacks > 0) {
          enemy.confusedStacks = enemyConfusedStacks;
        }

        const shuffledDeck = [...playerDeck].sort(() => Math.random() - 0.5);
        // Initial hand: Deal 5 cards for starting hand
        const initialHandSize = 5;
        const initialHand = shuffledDeck.slice(0, initialHandSize);
        const remainingDeck = shuffledDeck.slice(initialHandSize);

        let baseHealth = playerHealth;
        let baseMaxHealth = maxPlayerHealth;

        let startingShield = 0;

        // Moved talent-based starting shield logic to after INIT_COMBAT for proper accumulation via dispatch.
        // Only relic-based starting shield here.
        const hasAegisFragment = (playerRelics || []).some(r => r.name === "Aegis Fragment");
        if (hasAegisFragment) {
          startingShield += 8;
          console.log('[Combat] Aegis Fragment: +8 starting shield');
        }

        if (godData.name === 'Ra' && godTalents.tier2 === 'eternal_sun') {
          baseHealth = Math.min(baseHealth + 5, baseMaxHealth);
          console.log('[Combat] Ra Eternal Sun: +5 HP at battle start');
        }

        // Calculate base energy
        let baseEnergy = runData.run_data?.base_energy ?? godData.baseEnergy ?? 3;
        
        // Apply Divine Modifier energy reduction
        const energyReductionModifier = activeModifiers.find(m => m.effect_type === 'player_energy_reduction');
        if (energyReductionModifier) {
          baseEnergy = Math.max(1, baseEnergy + energyReductionModifier.effect_value); // effect_value is negative
          console.log('[Combat] Player energy reduced:', energyReductionModifier.effect_value, 'new energy:', baseEnergy);
        }

        // Add bonus energy from relics (e.g., Pure Gold, Berserker Harness)
        baseEnergy += calculateBonusEnergy({ relics: playerRelics });

        // Bag of Holding reduces max energy by 1
        // NOTE: This penalty should only be counted if not already applied to base_energy
        // If base_energy was saved from a previous battle, it already has the penalty
        // So we only apply it if this is the first battle OR if the relic was just picked up
        const hasBagOfHolding = (playerRelics || []).some(r => r.name === "Bag of Holding");
        const savedBaseEnergy = runData.run_data?.base_energy;
        
        // Only apply penalty if we don't have a saved base_energy (first battle)
        // The penalty will be persisted in base_energy for future battles
        if (hasBagOfHolding && !savedBaseEnergy) {
          baseEnergy = Math.max(1, baseEnergy - 1);
          addLog('🎒 Bag of Holding: -1 Max Energy!', 'debuff');
          console.log('[Combat] Bag of Holding: -1 Max Energy (first application)');
        }

        // Baron Samedi Tier 4: Laughter of the Grave (next battle starts with +15 HP)
        let bonusHealthFromLaugh = 0;
        if (godData.name === 'Baron Samedi' && godTalents.tier4 === 'laughter_of_the_grave' && runData.run_data?.baron_samedi_laugh_bonus) {
          bonusHealthFromLaugh = 15;
          addLog('🎭🔥 Laughter of the Grave: Started battle with +15 HP!', 'special');
          console.log('[Combat] Baron Samedi Laughter of the Grave bonus: +15 HP');
        }

        // Apply the bonus health, ensuring it doesn't exceed max health
        baseHealth = Math.min(baseHealth + bonusHealthFromLaugh, baseMaxHealth);

        // If the bonus was applied, clear the flag in runData.run_data for persistence
        if (bonusHealthFromLaugh > 0) {
          runData = { ...runData, run_data: { ...runData.run_data, baron_samedi_laugh_bonus: false } };
        }

        console.log('[Combat] Initializing combat state');
        dispatch({
          type: combatActions.INIT_COMBAT,
          payload: {
            god: godData,
            run: runData,
            victories: runData.victories || 0,
            godTalents,
            relics: playerRelics,
            player: {
              health: baseHealth,
              maxHealth: baseMaxHealth,
              shield: startingShield,
              energy: baseEnergy,
              maxEnergy: baseEnergy,
              damageReflection: 0,
              burnStacks: playerBurnStacks || 0,
              poisonStacks: playerPoisonStacks || 0,
              weakStacks: 0, // Initialize weakStacks for player
              cardsPlayedThisTurn: 0,
            },
            enemy,
            deck: { hand: initialHand, drawPile: remainingDeck, discardPile: [] },
            turnNumber: 0,
            godState: {
              necromancyStacks: necromancyStacks || 0,
              cthulhuMadness: cthulhuMadness || 0,
              cthulhuNextAttackBonus: cthulhuNextAttackBonus || 0,
              zeusAttacksPlayed: 0,
              thorDamageCardsPlayed: 0,
              thorFirstAttackUsed: false,
              thorPressTheAdvantageCounter: runData.run_data?.thor_press_the_advantage_counter || 0,
              thorPressTheAdvantageReady: runData.run_data?.thor_press_the_advantage_ready || false,
              shivaCardTypesPlayed: new Set(),
              shivaLastCardType: runData.run_data?.shiva_last_card_type || null,
              shivaCardsPlayedThisTurn: 0,
              shivaDamageCardsPlayed: 0,
              shivaShieldCardsPlayed: 0,
              shivaHealCardsPlayed: 0,
              shivaDrawCardsPlayed: 0,
              shivaNextDamageDiscount: false,
              shivaNextShieldDiscount: false,
              shivaNextHealDiscount: false,
              shivaNextDrawDiscount: false,
              shivaDanceOfAnnihilationActive: shivaDanceOfAnnihilationActive,
              raNextDamageBonus: runData.run_data?.ra_next_damage_bonus || 0,
              odinRunesUsedThisBattle: 0,
              athenaInsightUsed: false,
              athenaAegisAscendantUsed: athenaAegisAscendantUsed,
              athenaAegisAscendantTurnsRemaining: athenaAegisAscendantTurnsRemaining,
              baronSamediFirstAttackUsed: runData.run_data?.baron_samedi_first_attack_used || false,
              quetzalcoatl_cards_played_this_turn: runData.run_data?.quetzalcoatl_cards_played_this_turn || 0,
              loki_cards_played_this_turn: runData.run_data?.loki_cards_played_this_turn || 0,
              lokiChaosMagicActive: runData.run_data?.loki_chaos_magic_active || false,
              anubisDeathCheatsUsed: runData.run_data?.anubis_death_cheats_used || 0,
              anubisEternalBalanceDamageTaken: 0,
              anubisEternalBalanceStacks: runData.run_data?.anubis_eternal_balance_stacks || 0,
              susanoo_cards_played_this_battle: runData.run_data?.susanoo_cards_played_this_battle || 0,
              susanooFuryUnboundBonus: runData.run_data?.susanoo_fury_unbound_bonus || 0,
              susanooWrathStacks: runData.run_data?.susanoo_wrath_stacks || 0,
              phoenixFeatherUsed: false,
              ganeshaEnlightenmentActive: ganeshaEnlightenmentActive,
              ganeshaTotalChargeStacks: ganeshaTotalChargeStacks,
              // Boss tracking counters
              typhonMonstrousBreathCounter: runData.run_data?.typhon_monstrous_breath_counter || 0,
              typhonTerrifyingRoarCounter: runData.run_data?.typhon_terrifying_roaring_counter || 0,
              hydra_regenerate_head_counter: runData.run_data?.hydra_regenerate_head_counter || 0,
              hydra_acidic_spit_counter: runData.run_data?.hydra_acidic_spit_counter || 0,
            },
            tempBuffs: {
              nextAttackBonus: 0,
              nextAttackBonusPercent: 0,
              nextCardDiscount: 0,
              thunderStoneUsed: false,
              leechActive: false, // Initialize leechActive
            },
            turnPhase: 'player',
            isProcessing: false,
            damageAnimation: false,
            isAnimating: false, // Initialize isAnimating here
            battleLog: [{ message: '=== Your Turn ===', type: 'special', timestamp: Date.now() }],
            lastCardTypePlayed: lastCardTypePlayed, // Initialize lastCardTypePlayed
          },
        });

        // Trigger on_battle_start companions (add after dispatch INIT_COMBAT, before battle start shield)
        if (system && companionData.length > 0) {
          const userCompanionBlessings = user.companion_chosen_blessings || {};
          setTimeout(() => {
            if (!isMountedRef.current) return;
            system.trigger(
              { type: 'on_battle_start', card: null }, // Event object
              {
                ...latestStateRef.current, // Pass the entire current state as combatState
                chosenBlessings: userCompanionBlessings
              },
              dispatch,
              combatActions
            );
          }, 200);
        }

        // Apply battle start effects (talent-based shields)
        let battleStartShield = 0;

        // Baron Samedi Tier 1: Spirit Shield - Start with 7 Shield
        if (godData.name === 'Baron Samedi' && godTalents?.tier1 === 'spirit_shield') {
          battleStartShield += 7;
          addLog('👻🛡️ Spirit Shield: +7 Shield!', 'buff');
        }

        // Thor Tier 1: Storm Armor - Start with 6 Shield
        if (godData.name === 'Thor' && godTalents?.tier1 === 'storm_armor') {
          battleStartShield += 6;
          addLog('⚡🛡️ Storm Armor: +6 Shield!', 'buff');
        }

        // Quetzalcoatl Tier 1: Feathered Shield - Start with 7 Shield
        if (godData.name === 'Quetzalcoatl' && godTalents?.tier1 === 'feathered_shield') {
          battleStartShield += 7;
          addLog('🪶🛡️ Feathered Shield: +7 Shield!', 'buff');
        }

        // Cthulhu Tier 1: Void Shield - Start with 8 Shield
        if (godData.name === 'Cthulhu' && godTalents?.tier1 === 'void_shield') {
          battleStartShield += 8;
          addLog('🌑🛡️ Void Shield: +8 Shield!', 'buff');
        }

        // Anubis Tier 1: Eternal Guardian - Start with 10 Shield
        if (godData.name === 'Anubis' && godTalents?.tier1 === 'eternal_guardian') {
          battleStartShield += 10;
          addLog('💀🛡️ Eternal Guardian: +10 Shield!', 'buff');
        }

        // Athena Tier 1: Shield Readiness - Start with 8 Shield
        if (godData.name === 'Athena' && godTalents?.tier1 === 'shield_readiness') {
          battleStartShield += 8;
          addLog('🛡️ Athena Shield Readiness: +8 Shield!', 'buff');
        }


        if (battleStartShield > 0) {
          dispatch({
            type: combatActions.GAIN_SHIELD, // Use GAIN_SHIELD to add to existing shield
            payload: { amount: battleStartShield }
          });
        }

        // Start first turn
        await new Promise(resolve => setTimeout(resolve, 100));

        setIsLoading(false); // Changed from setIsInitialLoad
        console.log('[Combat] Combat initialized successfully with talents:', godTalents);
      } catch (error) {
        console.error('[Combat] Init error:', error);
        if (isMountedRef.current && !isNavigating) {
          console.error('[Combat] Redirecting to Home due to initialization error.');
          navigate(createPageUrl('Home'));
        }
      }
    };

    loadRunData();
  }, [navigate, runId, isLoading, addLog, calculateMaxHealth, calculateBonusEnergy, isNavigating, latestStateRef, allCosmetics]);

  // Check and trigger Aegis Ascendant when shield is gained
  useEffect(() => {
    // Only apply if the game state is loaded and not during initial setup
    if (isLoading || !state.god?.name || state.god.name !== 'Athena') return; // Changed from isInitialLoad
    if (state.godTalents?.tier4 !== 'aegis_ascendant') return;
    if (state.godState.athenaAegisAscendantUsed) return;
    
    if (state.player.shield > state.player.health) {
      dispatch({
        type: combatActions.UPDATE_GOD_STATE,
        payload: { 
          athenaAegisAscendantUsed: true,
          athenaAegisAscendantTurnsRemaining: 2
        }
      });
      // This will only be applied for the current turn. The expiration in endTurn will manage it.
      dispatch({
        type: combatActions.UPDATE_TEMP_BUFFS,
        payload: { damageReflection: 25 }
      });
      addLog('🛡️👑 Aegis Ascendant activated! +50% damage and 25% damage reflection for 2 turns!', 'special');
    }
  }, [state.player.shield, state.player.health, state.god, state.godTalents, state.godState.athenaAegisAscendantUsed, dispatch, addLog, isLoading]); // Changed isInitialLoad to isLoading

  const isPlayerTurn = useMemo(() =>
    state.turnPhase === 'player' && !state.isProcessing,
    [state.turnPhase, state.isProcessing]
  );

  const staticHandlers = useMemo(() => {
    if (!state.god?.name) return {};
    try {
      return createStaticAbilityHandlers(state.god.name);
    } catch (e) {
      console.error('[Combat] Error creating handlers:', e);
      return {};
    }
  }, [state.god?.name]);

  const calculateDamage = useCallback((card, state, currentEnemy) => {
    let damage = card.value;

    // Apply Anubis Tier 4: Eternal Balance bonus damage
    if (state.god?.name === 'Anubis' && state.godTalents?.tier4 === 'eternal_balance') {
      const eternalBalanceStacks = state.godState?.anubisEternalBalanceStacks || 0;
      if (eternalBalanceStacks > 0) {
        const bonusDamage = eternalBalanceStacks * 5;
        damage += bonusDamage;
        console.log('[calculateDamage] Anubis Eternal Balance: +', bonusDamage, 'damage (', eternalBalanceStacks, 'stacks)');
        // Log is now handled in the playCard function for these
      }
    }

    if (state.god?.name === 'Loki' && state.godTalents?.tier2 === 'clever_deception') {
      if (currentEnemy.confusedStacks > 0) {
        damage += 4;
        addLog('🎭💫 Loki Clever Deception: +4 damage to confused enemy!', 'buff');
      }
    }

    if (state.tempBuffs.nextAttackBonus > 0) {
      damage += state.tempBuffs.nextAttackBonus;
      dispatch({ type: combatActions.UPDATE_TEMP_BUFFS, payload: { nextAttackBonus: 0 } });
    }

    if (state.tempBuffs.nextAttackBonusPercent > 0) {
      const percentBonus = Math.floor(damage * (state.tempBuffs.nextAttackBonusPercent / 100));
      damage += percentBonus;
      addLog(`💥 Bonus: +${state.tempBuffs.nextAttackBonusPercent}% damage (+${percentBonus})!`, 'buff');
      dispatch({ type: combatActions.UPDATE_TEMP_BUFFS, payload: { nextAttackBonusPercent: 0 } });
    }

    if (state.god?.name === 'Ra' && state.godState.raNextDamageBonus > 0) {
      damage += state.godState.raNextDamageBonus;
      addLog(`☀️ Ra Solar Ascension: +${state.godState.raNextDamageBonus} damage!`, 'buff');
      dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { raNextDamageBonus: 0 } });
    }

    if (state.god?.name === 'Cthulhu' && state.godTalents?.tier2 === 'eldritch_madness' && state.godState.cthulhuNextAttackBonus > 0) {
      damage += state.godState.cthulhuNextAttackBonus;
      addLog(`🐙 Cthulhu Eldritch Madness: +${state.godState.cthulhuNextAttackBonus} bonus damage!`, 'buff');
      dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { cthulhuNextAttackBonus: 0 } });
    }

    if (state.god?.name === 'Baron Samedi' && state.godTalents?.tier1 === 'death_weaver') {
      if (!state.godState.baronSamediFirstAttackUsed) {
        damage += 8;
        addLog('💀 Baron Samedi Death Weaver: +8 bonus damage on first attack!', 'buff');
      }
    }

    if (state.god?.name === 'Athena' && state.godTalents?.tier1 === 'calculated_strike') {
      if (state.player.shield >= 4) {
        damage += 3;
      }
    }

    if (state.god?.name === 'Athena' && state.godTalents?.tier2 === 'aggressive_defense') {
      if (state.player.shield >= 10) {
        damage += 3;
      }
    }

    if (state.god?.name === 'Ra' && state.godTalents?.tier1 === 'desert_heat') {
      damage += 3;
      addLog('🌵 Ra Desert Heat: +3 damage!', 'buff');
    }

    if (state.god?.name === 'Zeus' && state.godTalents?.tier1 === 'lightning_surge') {
      const zeusAttacksPlayed = state.godState.zeusAttacksPlayed || 0;
      if ((zeusAttacksPlayed + 1) % 2 === 0) {
        damage += 6;
      }
    }

    if (state.god?.name === 'Zeus' && state.godTalents?.tier2 === 'thunderous_might') {
      const zeusAttacksPlayed = state.godState.zeusAttacksPlayed || 0;
      if (zeusAttacksPlayed === 0) {
        damage += 8;
      }
    }

    if (state.god?.name === 'Thor' && state.godTalents?.tier1 === 'mjolnir_strike') {
      if (!state.godState.thorFirstAttackUsed) {
        damage += 5;
        addLog('⚡ Thor Mjolnir\'s Strike: +5 bonus damage on first attack!', 'buff');
      }
    }

    if (state.god?.name === 'Thor' && state.godTalents?.tier1 === 'press_the_advantage') {
      if (state.godState.thorPressTheAdvantageReady) {
        damage += 10;
        addLog(`⚡ Thor's Press the Advantage: Next damage card will deal +10 damage!`, 'buff');
        // Logic to reset thorPressTheAdvantageReady is now in playCard
      }
    }

    if (state.god?.name === 'Thor' && state.godTalents?.tier3 === 'booming_presence') {
      if (currentEnemy.isStunned) {
        damage += 4;
      }
    }

    if (state.god?.name === 'Thor' && state.godTalents?.tier3 === 'thunderstrike') {
      const thorDamageCardsPlayed = state.godState.thorDamageCardsPlayed || 0;
      if ((thorDamageCardsPlayed + 1) === 3) {
        damage *= 3;
        addLog('⚡⚡⚡ Thor Thunderstrike: TRIPLE DAMAGE!', 'special');
      }
    }

    if (state.god?.name === 'Thor' && state.godTalents?.tier3 === 'godly_strength') {
      damage += 3;
      addLog('💪⚡ Thor Godly Strength: +3 damage!', 'buff');
    }

    if (state.god?.name === 'Shiva' && state.godTalents?.tier1 === 'destructive_power') {
      damage += 4;
    }

    if (state.god?.name === 'Shiva' && state.godTalents?.tier3 === 'destroyer_form') {
      damage += 5;
    }

    // Shiva Tier 4 Talent: Dance of Annihilation
    if (state.god?.name === 'Shiva' && state.godTalents?.tier4 === 'dance_of_annihilation' && state.godState.shivaDanceOfAnnihilationActive) {
      damage += 15;
      addLog('💃 Shiva Dance of Annihilation: +15 bonus damage!', 'buff');
    }

    if (state.god?.name === 'Hades' && state.godTalents?.tier2 === 'shadow_strike') {
      if (Math.random() < 0.15) {
        damage *= 2;
        addLog('🌑 Hades Shadow Strike: DOUBLE DAMAGE!', 'special');
      }
    }

    if (state.god?.name === 'Anubis' && state.player.health <= state.player.maxHealth * 0.5) {
      let bonusDamage = 5;
      bonusDamage = Math.floor(bonusDamage * 1.5);
      damage += bonusDamage;
      addLog(`💀 Anubis Death's Touch: +${bonusDamage} damage (player < 50% HP)!`, 'buff');
      console.log(`[calculateDamage] Anubis Death's Touch: Player HP ${state.player.health}/${state.player.maxHealth}, bonus: ${bonusDamage}`);
    } else {
      console.log(`[calculateDamage] Anubis Death's Touch: Player HP ${state.player.health}/${state.player.maxHealth} > 50% HP.`);
    }

    if (state.god?.name === 'Cthulhu' && state.godTalents?.tier1 === 'cosmic_horror') {
      damage += 4;
    }

    if (state.god?.name === 'Odin' && state.godTalents?.tier2 === 'gungnir_strike') {
      damage += 5;
    }

    if (state.god?.name === 'Susanoo' && state.godTalents?.tier1 === 'storm_s_fury') {
      damage += 2;
      addLog('⚔️ Susanoo Storm\'s Fury: +2 damage!', 'buff');
    }

    if (state.god?.name === 'Susanoo' && state.godTalents?.tier2 === 'fury_unbound') {
      if (state.godState.susanooFuryUnboundBonus > 0) {
        damage += state.godState.susanooFuryUnboundBonus;
        addLog(`🌪️ Susanoo Fury Unbound: +${state.godState.susanooFuryUnboundBonus} bonus damage!`, 'buff');
        // Logic to reset susanooFuryUnboundBonus is now in playCard
      }
    }

    if (state.god?.name === 'Susanoo' && state.godTalents?.tier3 === 'storm_gods_wrath') {
      if (currentEnemy.isVulnerable) {
        damage += 5;
        addLog('⚡ Susanoo Storm God\'s Wrath: +5 damage to vulnerable enemy!', 'buff');
      }
    }

    if (state.god?.name === 'Susanoo' && state.godTalents?.tier1 === 'blood_surge' && card.selfDamage && card.selfDamage > 0) {
      damage = Math.floor(damage * 1.5);
      addLog('🩸 Susanoo Blood Surge: +50% damage from self-damage card!', 'buff');
    }

    if (state.god?.name === 'Susanoo' && state.godState?.susanooWrathStacks && state.godState.susanooWrathStacks > 0) {
      const wrathBonus = (state.godState.susanooWrathStacks * 2);
      damage += wrathBonus;
      addLog(`⚡ Susanoo Wrath Bonus: +${wrathBonus} damage!`, 'buff');
    }

    if (state.god?.name === 'Anubis' && state.player.health <= state.player.maxHealth * 0.5) {
      console.log(`[calculateDamage] Anubis Balancing the Scales: Player HP ${state.player.health}/${state.player.maxHealth} <= 50%. Applying +50% damage.`);
      damage = Math.floor(damage * 1.5);
      addLog('⚖️ Anubis Balancing the Scales: +50% damage!', 'buff');
    } else if (state.god?.name === 'Anubis') {
      console.log(`[calculateDamage] Anubis Balancing the Scales: Player HP ${state.player.health}/${state.player.maxHealth} > 50%. Not applying +50% damage.`);
    }

    const hasThunderStone = state.relics?.some(r => r.name === "Thunder Stone");
    if (hasThunderStone && !state.tempBuffs.thunderStoneUsed) {
      damage += 3;
      // Dispatch for thunderStoneUsed is now in playCard
      addLog('⚡ Thunder Stone: +3 damage to first attack!', 'buff');
    }

    const hasAresBlessing = state.relics?.some(r => r.name === "Ares' Blessing");
    if (hasAresBlessing) {
      damage += 3;
    }

    const hasCursedIdol = state.relics?.some(r => r.name === "Cursed Idol");
    if (hasCursedIdol) {
      damage += 2;
      addLog('😈 Cursed Idol: +2 damage!', 'buff');
    }

    // Athena Tier 4 Aegis Ascendant: +50% damage
    if (state.god?.name === 'Athena' && state.godTalents?.tier4 === 'aegis_ascendant' && state.godState.athenaAegisAscendantUsed && state.godState.athenaAegisAscendantTurnsRemaining > 0) {
      damage = Math.floor(damage * 1.5);
      addLog('👑🛡️ Aegis Ascendant: +50% damage!', 'buff');
    }

    if (currentEnemy.isVulnerable) {
      const vulnerableMultiplier = state.god?.name === 'Cthulhu' && state.godTalents?.tier2 === 'maddening_presence'
        ? 1.75
        : (state.god?.name === 'Cthulhu' && state.godTalents?.tier3 === 'elder_god' ? 2.0 : 1.5);
      damage = Math.floor(damage * vulnerableMultiplier);
    }

    if (currentEnemy.isStunned) {
      damage = Math.floor(damage * 0.5);
    }

    if (currentEnemy.shield > 0) {
      const shieldAbsorbed = Math.min(damage, currentEnemy.shield);
      damage -= shieldAbsorbed;
      dispatch({ type: combatActions.UPDATE_ENEMY, payload: { shield: currentEnemy.shield - shieldAbsorbed } });
    }

    return Math.max(1, damage);
  }, [addLog, dispatch]);

  const handleAbandonRun = useCallback(async () => {
    const confirmed = window.confirm(
      'Are you sure you want to abandon this run? All progress will be lost and this will count as a defeat.'
    );

    if (!confirmed) return;

    console.log('[handleAbandonRun] Player abandoned run');

    try {
      if (isNavigating) {
        console.log('[handleAbandonRun] Already navigating away, aborting abandon run save');
        return;
      }
      setIsNavigating(true);

      await base44.entities.GameRun.update(state.run.id, { status: 'lost' });

      try {
        const user = await base44.auth.me();
        await base44.auth.updateMe({
          total_completed_runs: (user.total_completed_runs || 0) + 1,
        });
      } catch (e) {
        console.error('[handleAbandonRun] Error updating user:', e);
      }
      
      // Check achievements on abandon as well (counts as defeat)
      await base44.functions.invoke('checkAchievements', { runId: state.run.id });

      if (isMountedRef.current) {
        navigate(createPageUrl('Home'));
      }
    } catch (error) {
      console.error('[handleAbandonRun] Error abandoning run:', error);
      setIsNavigating(false); // Reset if navigation failed, allowing retry
    }
  }, [state, navigate, isMountedRef, isNavigating]);

  const drawCardsWithAbilities = useCallback((count) => {
    const handSizeBefore = latestStateRef.current.deck.hand.length;

    dispatch({ type: combatActions.DRAW_CARDS, payload: { count } });

    if (state.god?.name === 'Quetzalcoatl' && state.godTalents?.tier2 === 'divine_knowledge') {
      const shieldGain = count * 2;
      dispatch({ type: combatActions.GAIN_SHIELD, payload: { amount: shieldGain } });
      addLog(`📚🛡️ Quetzalcoatl Divine Knowledge: +${shieldGain} Shield from drawing ${count} card${count !== 1 ? 's' : ''}`, 'buff');
    }

    if (state.god?.name === 'Susanoo' && state.godTalents?.tier2 === 'gale_force') {
      const damage = count * 1;
      dispatch({ type: combatActions.DAMAGE_ENEMY, payload: { amount: damage } });
      addLog(`💨 Susanoo Gale Force: Enemy takes ${damage} damage from drawing ${count} card${count !== 1 ? 's' : ''}!`, 'damage');
    }

    setTimeout(() => {
      const currentState = latestStateRef.current;

      if (currentState.god?.name === 'Quetzalcoatl' && staticHandlers.onCardDrawn) {
        const currentHand = currentState.deck.hand;
        const newlyDrawnCards = currentHand.slice(handSizeBefore);

        if (newlyDrawnCards.length > 0) {
          console.log('[drawCardsWithAbilities] Quetzalcoatl: Processing newly drawn cards:', newlyDrawnCards.map(c => c.name));
          newlyDrawnCards.forEach(card => {
            try {
              staticHandlers.onCardDrawn({ card, state: currentState, dispatch, addLog });
            } catch (e) {
              console.error('[drawCardsWithAbilities] Error in onCardDrawn handler:', e);
            }
          });
        }
      }
    }, 50);
  }, [staticHandlers, dispatch, addLog, state.god, state.godTalents, latestStateRef]);

  const handleOdinRunesOfPower = useCallback(async () => {
    if (!isMountedRef.current || isNavigating) return;
    if (state.god?.name !== 'Odin') {
      addLog('This ability is only for Odin!', 'error');
      return;
    }
    // Assuming 'runes_of_power' is a placeholder talent for Odin's ability
    if (state.godTalents?.tier4 !== 'runes_of_power') { // Assuming a tier 4 talent
      addLog('Odin does not have Runes of Power talent!', 'error');
      return;
    }

    const currentRunesUsed = state.godState.odinRunesUsedThisBattle || 0;
    const maxRunes = 1; // Odin can use this talent once per battle (example)
    if (currentRunesUsed >= maxRunes) {
      addLog('Odin has used all Runes of Power this battle!', 'error');
      return;
    }

    dispatch({ type: combatActions.SET_PROCESSING, payload: true });
    dispatch({ type: combatActions.SET_ANIMATING, payload: true }); // Block UI during ability
    addLog('✨ Odin activates Runes of Power!', 'special');

    // Example effect: Draw 2 cards and gain 5 shield
    drawCardsWithAbilities(2);
    dispatch({ type: combatActions.GAIN_SHIELD, payload: { amount: 5 } });
    
    // Increment the counter for runes used
    dispatch({
      type: combatActions.UPDATE_GOD_STATE,
      payload: { odinRunesUsedThisBattle: currentRunesUsed + 1 }
    });

    // Example: also give a temporary damage boost
    dispatch({
      type: combatActions.UPDATE_TEMP_BUFFS,
      payload: { nextAttackBonus: (state.tempBuffs.nextAttackBonus || 0) + 10 }
    });
    addLog('+10 to next attack, draw 2 cards, gain 5 Shield!', 'buff');

    await new Promise(resolve => setTimeout(resolve, 500));
    dispatch({ type: combatActions.SET_PROCESSING, payload: false });
    dispatch({ type: combatActions.SET_ANIMATING, payload: false }); // Unblock UI
  }, [state, dispatch, addLog, drawCardsWithAbilities, isMountedRef, isNavigating]);

  const startNewTurn = useCallback(async () => {
    if (!isMountedRef.current) {
      console.log('[startNewTurn] Component unmounted, aborting');
      return;
    }
    if (isNavigating) { // Prevent new turn if already navigating
      console.log('[startNewTurn] Already navigating away, aborting start new turn');
      return;
    }

    dispatch({ type: combatActions.SET_ANIMATING, payload: true }); // Block UI at start of new turn logic
    console.log('[startNewTurn] Starting new turn');

    await new Promise(resolve => setTimeout(resolve, 400));
    if (!isMountedRef.current || isNavigating) {
      dispatch({ type: combatActions.SET_ANIMATING, payload: false });
      return;
    }

    dispatch({ type: combatActions.START_TURN });
    dispatch({ type: combatActions.UPDATE_PLAYER, payload: { cardsPlayedThisTurn: 0 } });
    
    // Trigger on_turn_start companions (add before drawing cards)
    if (companionSystem) {
      const user = await base44.auth.me();
      companionSystem.trigger(
        { type: 'on_turn_start' },
        {
          ...latestStateRef.current, // Pass the entire current state as combatState
          chosenBlessings: user.companion_chosen_blessings || {}
        },
        dispatch,
        combatActions
      );
    }

    // Increment charge stacks for all cards in hand
    const handWithCharges = state.deck.hand.map(card => {
      // Only apply if the card actually has a chargeValue defined and greater than 0
      if (card.chargeValue !== undefined && card.chargeValue > 0) {
        const currentStacks = card.chargeStacks || 0;
        let chargeGain = 1;
        
        // Ganesha Divine Focus - Charge cards gain an additional charge
        if (state.god?.name === 'Ganesha') {
          chargeGain += 1;
        }
        
        // Ganesha Tier 3: Meditative Flow - Charge cards gain +1 bonus stack every other turn
        if (state.god?.name === 'Ganesha' && state.godTalents?.tier3 === 'meditative_flow') {
          if (state.turnNumber % 2 === 0) {
            chargeGain += 1;
          }
        }
        
        return {
          ...card,
          chargeStacks: currentStacks + chargeGain
        };
      }
      return card;
    });
    
    // Calculate total charge stacks for Ganesha Path of Enlightenment
    if (state.god?.name === 'Ganesha' && state.godTalents?.tier4 === 'path_of_enlightenment') {
      const totalCharges = handWithCharges.reduce((sum, card) => {
        return sum + (card.chargeStacks || 0);
      }, 0);
      
      if (totalCharges >= 50 && !state.godState.ganeshaEnlightenmentActive) {
        dispatch({
          type: combatActions.UPDATE_GOD_STATE,
          payload: { ganeshaEnlightenmentActive: true }
        });
        addLog('👑🕉️ Ganesha Path of Enlightenment: All cards now cost 1 less!', 'special');
      }
      
      dispatch({
        type: combatActions.UPDATE_GOD_STATE,
        payload: { ganeshaTotalChargeStacks: totalCharges }
      });
    }
    
    // Update deck with charged cards
    dispatch({ 
      type: combatActions.UPDATE_DECK, 
      payload: { hand: handWithCharges } 
    });
    // Add a log entry for charges
    const chargedCardsCount = handWithCharges.filter(card => card.chargeValue > 0 && card.chargeStacks > 0).length;
    if (chargedCardsCount > 0) {
      addLog(`✨ All cards in hand gained 1 Charge stack!`, 'buff');
    }

    // Reset leechActive at the start of a new turn
    dispatch({ type: combatActions.UPDATE_TEMP_BUFFS, payload: { leechActive: false } });

    // Reset Baron Samedi first attack tracker for new turn
    if (state.god?.name === 'Baron Samedi') {
      dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { baronSamediFirstAttackUsed: false } });
    }
    
    // Reset Thor Mjolnir's Strike first attack tracker for new turn
    if (state.god?.name === 'Thor') {
      dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { thorFirstAttackUsed: false } });
    }

    if (state.god?.name === 'Susanoo') {
      dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { susanooCardsPlayedThisTurn: 0 } });
    }

    if (staticHandlers.onTurnStart) {
      try {
        staticHandlers.onTurnStart({ state, dispatch, addLog });
      } catch (e) {
        console.error('[startNewTurn] Error in onTurnStart handler:', e);
      }
    }

    if (state.god?.name === 'Ra' && state.godTalents?.tier3 === 'solar_regeneration') {
      dispatch({ type: combatActions.HEAL_PLAYER, payload: { amount: 5 } });
      addLog('☀️ Ra Solar Regeneration: +5 HP!', 'heal');
    }

    dispatch({ type: combatActions.UPDATE_TEMP_BUFFS, payload: { thunderStoneUsed: false } });

    if (state.god?.name === 'Susanoo' && state.godTalents?.tier1 === 'ocean_s_might') {
      dispatch({ type: combatActions.GAIN_SHIELD, payload: { amount: 3 } });
      addLog('🌊 Susanoo Ocean\'s Might: +3 Shield!', 'buff');
    }

    if (state.god?.name === 'Susanoo' && state.godTalents?.tier3 === 'kami_s_blessing') {
      setTimeout(() => {
        if (!isMountedRef.current) return;
        if (isNavigating) return; // Also check navigation here
        if (latestStateRef.current.deck.hand.length === 0) {
          dispatch({ type: combatActions.UPDATE_PLAYER, payload: { energy: latestStateRef.current.player.energy + 2 } });
          drawCardsWithAbilities(2);
          addLog('✨ Susanoo Kami\'s Blessing: +2 Energy and draw 2 cards!', 'buff');
        }
      }, 100);
    }

    let cardsDrawnThisTurn = 0;

    if (state.god?.name === 'Athena' && state.godTalents?.tier1 === 'divine_patience') {
      dispatch({ type: combatActions.UPDATE_PLAYER, payload: { energy: state.player.energy + 2 } });
      addLog('🛡️ Athena Divine Patience: +2 Energy', 'buff');
    }

    // Calculate initial cards to draw, incorporating all modifiers
    let initialDrawCount = state.god?.drawPerTurn || 3; // Base draw count

    // Apply Ganesha Tier 1: Sacred Stillness - Draw 1 fewer card
    if (state.god?.name === 'Ganesha' && state.godTalents?.tier1 === 'sacred_stillness') {
      initialDrawCount = Math.max(1, initialDrawCount - 1);
      addLog('🙏 Ganesha Sacred Stillness: Draw 1 fewer card.', 'debuff');
    }
    // Apply Berserker Harness relic - Draw 1 fewer card
    else if (state.relics?.some(r => r.name === "Berserker Harness")) {
      initialDrawCount = Math.max(1, initialDrawCount - 1);
      addLog('⚡ Berserker Harness: Draw 1 fewer card!', 'debuff');
    }
    // Apply Baron Samedi Tier 2: Spirit Vision - Draw 4 cards instead of 3
    else if (state.god.name === 'Baron Samedi' && state.godTalents?.tier2 === 'spirit_vision') {
      initialDrawCount = 4;
      addLog('🎭 Baron Samedi Spirit Vision: Draw 4 cards!', 'buff');
    }
    // Apply Shiva Tier 2: Third Eye - Draw 4 cards instead of 3
    else if (state.god.name === 'Shiva' && state.godTalents?.tier2 === 'third_eye') {
      initialDrawCount = 4;
      addLog('👁️ Shiva Third Eye: Draw 4 cards!', 'buff');
    }
    
    // Apply Bag of Holding relic - Draw +2 cards
    const hasBagOfHolding = state.relics?.some(r => r.name === "Bag of Holding");
    if (hasBagOfHolding) {
      initialDrawCount += 2;
      addLog('🎒 Bag of Holding: Draw +2 cards!', 'buff');
    }
    
    // Perform the initial card draw, one by one with animation
    for (let i = 0; i < initialDrawCount; i++) {
        await new Promise(resolve => setTimeout(resolve, 150));
        if (!isMountedRef.current || isNavigating) {
          dispatch({ type: combatActions.SET_ANIMATING, payload: false });
          return;
        }
        drawCardsWithAbilities(1); // Call the existing function to draw 1 card
    }
    cardsDrawnThisTurn += initialDrawCount; // Update count for subsequent talent checks

    if (state.god?.name === 'Quetzalcoatl' && state.godTalents?.tier1 === 'serpent_wisdom') {
      drawCardsWithAbilities(1);
      cardsDrawnThisTurn += 1;
      addLog('🐍 Quetzalcoatl Serpent\'s Wisdom: Draw +1 card', 'buff');
    }

    console.log('[startNewTurn] Checking Thor Lightning Reflexes...');
    if (state.god?.name === 'Thor' && state.godTalents?.tier2 === 'lightning_reflexes') {
      console.log('[startNewTurn] Thor Lightning Reflexes triggered!');
      drawCardsWithAbilities(1);
      cardsDrawnThisTurn += 1;
      addLog('⚡ Thor Lightning Reflexes: Draw 1 extra card', 'buff');
    }

    const hasAegisOfProtection = state.relics?.some(r => r.name === "Aegis of Protection" || r.name === "Aegis of Protection+");
    const empoweredAegisProtection = state.relics?.some(r => r.name === "Aegis of Protection+");
    if (hasAegisOfProtection) {
      const shieldAmount = empoweredAegisProtection ? 15 : 10; // Empowered: +15 instead of +10
      dispatch({ type: combatActions.GAIN_SHIELD, payload: { amount: shieldAmount } });
      addLog(`🛡️ Aegis of Protection: +${shieldAmount} Shield!${empoweredAegisProtection ? ' ⚡' : ''}`, 'buff');
    }

    const hasCrownOfWisdom = state.relics?.some(r => r.name === "Crown of Wisdom" || r.name === "Crown of Wisdom+");
    const empoweredCrown = state.relics?.some(r => r.name === "Crown of Wisdom+");
    if (hasCrownOfWisdom) {
      const drawAmount = empoweredCrown ? 2 : 1; // Empowered: Draw 2 instead of 1
      drawCardsWithAbilities(drawAmount);
      cardsDrawnThisTurn += drawAmount;
      addLog(`👑 Crown of Wisdom: Draw +${drawAmount} card${drawAmount > 1 ? 's' : ''}!${empoweredCrown ? ' ⚡' : ''}`, 'buff');
    }

    if (state.god?.name === 'Athena' && state.godTalents?.tier3 === 'tactical_supremacy') {
      setTimeout(() => {
        if (!isMountedRef.current) return;
        if (isNavigating) return; // Also check navigation here
        const currentShield = latestStateRef.current.player.shield;
        if (currentShield >= 15) {
          addLog('🛡️📜 Tactical Supremacy: Drawing 2 extra cards!', 'buff');
          drawCardsWithAbilities(2);
          // cardsDrawnThisTurn is not updated here because it's in a setTimeout and may not reflect instantly for other checks.
          // This is generally okay as Feathered Ascension check happens before this setTimeout.
        }
      }, 150);
    }

    if (state.god?.name === 'Quetzalcoatl' && state.godTalents?.tier3 === 'feathered_ascension') {
      if (cardsDrawnThisTurn >= 5) {
        setTimeout(() => {
          if (!isMountedRef.current) return;
          if (isNavigating) return; // Also check navigation here
          const currentHandAfterDraws = latestStateRef.current.deck.hand;

          const discountedHand = currentHandAfterDraws.map(card => ({
            ...card,
            featheredAscensionDiscount: true
          }));
          dispatch({
            type: combatActions.UPDATE_DECK,
            payload: { hand: discountedHand }
          });
          addLog('🐍✨ Quetzalcoatl Feathered Ascension: All cards cost 1 less this turn!', 'buff');
        }, 100);
      }
    }

    if (state.god?.name === 'Loki') {
      console.log('[startNewTurn] Loki ability check - applying random discount');
      setTimeout(() => {
        if (!isMountedRef.current) return;
        if (isNavigating) return; // Also check navigation here
        const currentHand = latestStateRef.current.deck.hand;

        if (currentHand && currentHand.length > 0) {
          const randomIndex = Math.floor(Math.random() * currentHand.length);

          const updatedHand = currentHand.map((card, idx) => {
            if (idx === randomIndex) {
              return { ...card, lokiDiscount: true };
            }
            return card;
          });

          dispatch({
            type: combatActions.UPDATE_DECK,
            payload: { hand: updatedHand }
          });
          addLog('🎭 Loki Unstable Trickster: A random card costs 1 less!', 'buff');
        }
      }, 200);
    }

    addLog('=== Your Turn ===', 'special');
    dispatch({ type: combatActions.SET_ANIMATING, payload: false }); // Unblock UI at end of turn start logic
  }, [addLog, state, dispatch, staticHandlers, drawCardsWithAbilities, latestStateRef, isMountedRef, isNavigating, companionSystem]);

  // Helper function to check if a card would be the last playable card
  const wouldBeLastCard = useCallback((playedCard, playedCardCost) => {
    const currentState = latestStateRef.current;
    const remainingEnergy = currentState.player.energy - playedCardCost;

    // Filter out the card that is about to be played from the hand
    const remainingHand = currentState.deck.hand.filter(c => c.id !== playedCard.id); // Use card.id for uniqueness

    // Check if any other card in the *remaining* hand can be played with the *remaining* energy
    const canPlayAnother = remainingHand.some(c => {
      // Must use a copy of 'c' to prevent modifying original card in hand, in case talent changes its cost temporarily
      let tempCard = { ...c };
      if (currentState.god?.name === 'Quetzalcoatl' && currentState.godTalents?.tier4 === 'serpents_momentum') {
        const cardsPlayedSoFar = currentState.player.cardsPlayedThisTurn || 0;
        if ((cardsPlayedSoFar + 1) % 3 === 0) { // If *this* card would gain Serpent's Momentum effects
          tempCard.hasSurge = true;
          if (tempCard.chargeValue === undefined || tempCard.chargeValue === null) {
              tempCard.chargeValue = 1;
          }
          tempCard.chargeStacks = (tempCard.chargeStacks || 0) + 2;
        }
      }
      const costOfThisRemainingCard = calculateCardCost(tempCard, currentState);
      return costOfThisRemainingCard <= remainingEnergy;
    });

    return !canPlayAnother;
  }, [latestStateRef]);


  // New helper function to process damage effects, extracted from main playCard for reuse.
  const processDamageEffects = useCallback(async (cardToPlay, finalDamage, currentCombatState) => {
    if (!isMountedRef.current || isNavigating) {
      dispatch({ type: combatActions.SET_ANIMATING, payload: false });
      return;
    }

    // Check for Disorienting Aura - 30% chance to miss
    const hasDisorientingAura = currentCombatState.enemy.affixes?.some(a => a.effect === 'disorienting_aura');
    if (hasDisorientingAura && Math.random() < 0.3) {
      addLog('😵 Disorienting Aura: Your attack misses!', 'enemy');
      await new Promise(resolve => setTimeout(resolve, 600));
      if (!isMountedRef.current || isNavigating) {
        dispatch({ type: combatActions.SET_ANIMATING, payload: false });
        return; // Damage effects are skipped
      }
      return;
    }

    // Baron Samedi Tier 1: Death Weaver / Death Curse first attack tracking
    if (currentCombatState.god?.name === 'Baron Samedi' && !currentCombatState.godState.baronSamediFirstAttackUsed) {
      dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { baronSamediFirstAttackUsed: true } });
      if (currentCombatState.godTalents?.tier1 === 'death_curse') {
        dispatch({
          type: combatActions.UPDATE_ENEMY,
          payload: { poisonStacks: (currentCombatState.enemy.poisonStacks || 0) + 1 }
        });
        addLog('💀 Death Curse: Applied 1 Poison!', 'debuff');
      }
    }

    // Thor Tier 1: Mjolnir's Strike first attack tracking
    if (currentCombatState.god?.name === 'Thor' && currentCombatState.godTalents?.tier1 === 'mjolnir_strike' && !currentCombatState.godState.thorFirstAttackUsed) {
      dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { thorFirstAttackUsed: true } });
    }

    // Zeus attacks played tracking
    if (currentCombatState.god?.name === 'Zeus') {
      dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { zeusAttacksPlayed: (currentCombatState.godState.zeusAttacksPlayed || 0) + 1 } });
    }

    // Thor Tier 3: Thunderstrike tracking
    if (currentCombatState.god?.name === 'Thor' && currentCombatState.godTalents?.tier3 === 'thunderstrike') {
      dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { thorDamageCardsPlayed: (currentCombatState.godState.thorDamageCardsPlayed || 0) + 1 } });
    }

    // Thor Tier 1: Press the Advantage tracking
    if (currentCombatState.god?.name === 'Thor' && currentCombatState.godTalents?.tier1 === 'press_the_advantage') {
      let newCounter = currentCombatState.godState.thorPressTheAdvantageCounter + 1;
      let newReadyState = currentCombatState.godState.thorPressTheAdvantageReady;

      if (newCounter >= 3) {
        newReadyState = true;
        newCounter = 0;
        addLog(`⚡ Thor's Press the Advantage: Next damage card will deal +10 damage!`, 'buff');
      }

      dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: {
        thorPressTheAdvantageCounter: newCounter,
        thorPressTheAdvantageReady: newReadyState
      }});
    }

    // Thunder Stone effect needs to be applied here as it's a global next attack bonus
    const hasThunderStone = currentCombatState.relics?.some(r => r.name === "Thunder Stone");
    if (hasThunderStone && !currentCombatState.tempBuffs.thunderStoneUsed) {
      dispatch({ type: combatActions.UPDATE_TEMP_BUFFS, payload: { thunderStoneUsed: true } });
      // Log is already in calculateDamage
    }
    
    // Fury Unbound reset here
    if (currentCombatState.god?.name === 'Susanoo' && currentCombatState.godTalents?.tier2 === 'fury_unbound') {
      if (currentCombatState.godState.susanooFuryUnboundBonus > 0) {
        dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { susanooFuryUnboundBonus: 0 } });
      }
    }
    
    dispatch({ type: combatActions.DAMAGE_ENEMY, payload: { amount: finalDamage } }); // Leech healing is automatically applied in DAMAGE_ENEMY reducer if leechActive
    addLog(`You dealt ${finalDamage} damage with ${cardToPlay.name}!`, 'player');

    // Trigger damage animation
    dispatch({ type: combatActions.TRIGGER_DAMAGE_ANIMATION });

    // Check for Vampiric Fang relic - heal 25% of damage dealt
    const hasVampireFang = currentCombatState.relics?.some(r => r.name === "Vampiric Fang" || r.name === "Vampire Fang");
    if (hasVampireFang && finalDamage > 0) {
      const healAmount = Math.floor(finalDamage * 0.25);
      dispatch({ type: combatActions.HEAL_PLAYER, payload: { amount: healAmount } });
      addLog(`🩸 Vampiric Fang: Healed ${healAmount} HP from damage!`, 'buff');
    }

    // God-specific damage dealt handlers
    if (staticHandlers.onDamageDealt) {
      staticHandlers.onDamageDealt({ state: currentCombatState, dispatch, addLog, damage: finalDamage });
    }

    // Baron Samedi Tier 2: Toxic Strike - Attacks that deal 10+ damage apply 1 Poison
    if (currentCombatState.god.name === 'Baron Samedi' && currentCombatState.godTalents?.tier2 === 'toxic_strike') {
      if (finalDamage >= 10) {
        dispatch({
          type: combatActions.UPDATE_ENEMY,
          payload: { poisonStacks: (currentCombatState.enemy.poisonStacks || 0) + 1 }
        });
        addLog('☠️ Toxic Strike: Applied 1 Poison!', 'special');
      }
    }

    // Consolidated Anubis healing
    if (currentCombatState.god?.name === 'Anubis' && (currentCombatState.godTalents?.tier1 === 'soul_harvest' || currentCombatState.godTalents?.tier3 === 'judge_of_souls')) {
      const healMultiplier = currentCombatState.godTalents?.tier3 === 'judge_of_souls' ? 1.0 : 0.5;
      const soulHealAmount = Math.floor(finalDamage * healMultiplier);
      dispatch({ type: combatActions.HEAL_PLAYER, payload: { amount: soulHealAmount } });
      addLog(`💀 ${currentCombatState.godTalents?.tier3 === 'judge_of_souls' ? 'Judge of Souls' : 'Anubis Soul Harvest'}: Healed ${soulHealAmount} HP!`, 'buff');
      console.log('[playCard] Anubis healed', soulHealAmount, 'HP from Soul Harvest/Judge of Souls');
    }

    if (currentCombatState.god?.name === 'Loki' && currentCombatState.godTalents?.tier1 === 'illusory_defense') {
      if (Math.random() < 0.25) {
        dispatch({
          type: combatActions.UPDATE_ENEMY,
          payload: { confusedStacks: (currentCombatState.enemy.confusedStacks || 0) + 1 }
        });
        addLog('🛡️ Loki Illusory Defense: Enemy confused!', 'buff');
      }
    }

    if (currentCombatState.god?.name === 'Loki' && currentCombatState.godTalents?.tier3 === 'glorious_purpose') {
      if (currentCombatState.enemy.confusedStacks > 0) {
        drawCardsWithAbilities(1);
        addLog('🎭✨ Loki Glorious Purpose: Drew a card from attacking confused enemy!', 'buff');
      }
    }

    if (staticHandlers.onDamageCardPlayed) {
      try {
        staticHandlers.onDamageCardPlayed({ card: cardToPlay, damage: finalDamage, state: currentCombatState, dispatch, addLog });
      } catch (e) {
        console.error('[playCard] Error in onDamageCardPlayed handler:', e);
      }
    }
    
    // Consume Shiva Dance of Annihilation buff after using it
    if (currentCombatState.god?.name === 'Shiva' && currentCombatState.godTalents?.tier4 === 'dance_of_annihilation' && currentCombatState.godState.shivaDanceOfAnnihilationActive) {
      dispatch({
        type: combatActions.UPDATE_GOD_STATE,
        payload: { shivaDanceOfAnnihilationActive: false }
      });
      addLog('💃 Dance of Annihilation consumed!', 'info');
    }

    // Check if enemy defeated after damage
    setTimeout(() => {
      if (!isMountedRef.current || isNavigating) {
        dispatch({ type: combatActions.SET_ANIMATING, payload: false });
        return;
      }
      const currentEnemyHealth = latestStateRef.current.enemy.health;
      if (currentEnemyHealth <= 0) {
        console.log('[playCard] Enemy defeated!');
        handleVictoryAndProgressRun();
      }
    }, 100);
  }, [addLog, dispatch, handleVictoryAndProgressRun, staticHandlers, latestStateRef, isMountedRef, isNavigating, drawCardsWithAbilities]);


  const playCard = useCallback(async (card, cardIndex) => {
    if (!isMountedRef.current) return;
    if (isNavigating) {
      console.log('[playCard] Already navigating away, ignoring card play');
      return;
    }
    // No need to check isPlayerTurn here as handlePlayCard already does, and we are now processing.

    // Store the type of card being played
    const cardTypePlayed = card.type;
    const currentLastCardTypePlayed = latestStateRef.current.lastCardTypePlayed; // Use latestStateRef.current

    // Create a copy of the card to potentially modify
    let cardToPlay = { ...card };

    // Tier 4: Quetzalcoatl Serpent's Momentum - Every 3rd card gains Surge and Charge 2
    const cardsPlayedSoFar = latestStateRef.current.player.cardsPlayedThisTurn || 0; // Use latestStateRef.current
    if (latestStateRef.current.god?.name === 'Quetzalcoatl' && latestStateRef.current.godTalents?.tier4 === 'serpents_momentum') {
      if ((cardsPlayedSoFar + 1) % 3 === 0) {
        cardToPlay.hasSurge = true;
        cardToPlay.chargeStacks = (cardToPlay.chargeStacks || 0) + 2;
        cardToPlay.chargeValue = cardToPlay.chargeValue || 1; // Ensure it has charge value
        addLog('🐍⚡ Serpent\'s Momentum: Card gains Surge and Charge 2!', 'special');
      }
    }
    
    // Determine if Surge is active *before* calculating effects
    const isSurgeActive = cardToPlay.hasSurge && wouldBeLastCard(cardToPlay, calculateCardCost(cardToPlay, latestStateRef.current));
    if (isSurgeActive) {
      addLog('⚡ SURGE! Effect doubled as the final card!', 'buff');
    }

    // Calculate actual effect values with all card-intrinsic modifiers
    // Calculate base values based on card type or specific secondary value properties
    let actualDamage = cardToPlay.type === 'damage' ? cardToPlay.value : (cardToPlay.damageValue || 0);
    let actualShield = cardToPlay.shieldValue || 0;
    let actualHeal = cardToPlay.healValue || 0;
    let actualDrawCards = cardToPlay.drawCards || 0; // Secondary draw value

    // If the card's primary type suggests a value from 'value' (e.g., 'Defend' uses 'value' for shield),
    // and no specific secondary value was set, use 'value' as the primary effect value.
    if (cardToPlay.type === 'shield' && !actualShield) { // If it's a shield card and actualShield is 0 (meaning shieldValue wasn't set)
      actualShield = cardToPlay.value || 0;
    } else if (cardToPlay.type === 'heal' && !actualHeal) { // If it's a heal card and actualHeal is 0
      actualHeal = cardToPlay.value || 0;
    } else if (cardToPlay.type === 'draw' && !actualDrawCards) { // If it's a draw card and actualDrawCards is 0
      actualDrawCards = cardToPlay.value || 0;
    }
    // End of modified section


    // Apply charge bonus if card has charge
    if (cardToPlay.chargeValue && cardToPlay.chargeStacks > 0) {
      const chargeBonusOriginal = cardToPlay.chargeStacks * cardToPlay.chargeValue;
      let chargeBonus = chargeBonusOriginal;

      // Ganesha Tier 2: Endless Patience - Doubled charge bonuses on Heal cards
      if (latestStateRef.current.god?.name === 'Ganesha' && latestStateRef.current.godTalents?.tier2 === 'endless_patience' && cardToPlay.type === 'heal') {
        chargeBonus *= 2;
        addLog('🙏 Ganesha Endless Patience: Doubled charge bonus on Heal card!', 'buff');
      }
      
      addLog(`⚡ CHARGED! ${cardToPlay.name} gains +${chargeBonusOriginal} from ${cardToPlay.chargeStacks} charge!` + (chargeBonus > chargeBonusOriginal ? ` (+${chargeBonus - chargeBonusOriginal} from talents)` : ''), 'special');
      
      // Apply charge bonus to damage/shield/heal/draw based on card type or specific fields
      actualDamage = (cardToPlay.type === 'damage' || cardToPlay.damageValue > 0) ? actualDamage + chargeBonus : actualDamage; // Added check for damageValue > 0
      actualShield = (cardToPlay.type === 'shield' || cardToPlay.shieldValue > 0) ? actualShield + chargeBonus : actualShield; // Added check for shieldValue > 0
      actualHeal = (cardToPlay.type === 'heal' || cardToPlay.healValue > 0) ? actualHeal + chargeBonus : actualHeal; // Added check for healValue > 0
      actualDrawCards += chargeBonus;
    }

    // Apply Knowledge bonus if active
    if (cardToPlay.knowledgeType && cardToPlay.knowledgeValue > 0) {
      // The hand in state.deck.hand has already been updated by handlePlayCard, so its length is correct
      const cardsInHandExcludingThis = latestStateRef.current.deck.hand.length; 
      let knowledgeBonus = 0;
      if (cardsInHandExcludingThis > 0) {
        knowledgeBonus = cardToPlay.knowledgeValue * cardsInHandExcludingThis;
        addLog(`📚 Knowledge: +${knowledgeBonus} ${cardToPlay.knowledgeType} from ${cardsInHandExcludingThis} card${cardsInHandExcludingThis !== 1 ? 's' : ''} remaining in hand!`, 'buff');
      }
      
      if (cardToPlay.knowledgeType === 'damage') {
        actualDamage += knowledgeBonus;
      } else if (cardToPlay.knowledgeType === 'shield') {
        actualShield += knowledgeBonus;
      } else if (cardToPlay.knowledgeType === 'heal') {
        actualHeal += knowledgeBonus;
      }
    }

    // Apply combo bonus if active
    const comboActive = cardToPlay.comboType && currentLastCardTypePlayed === cardToPlay.comboType;
    if (comboActive && cardToPlay.comboBonus > 0) {
      addLog(`💫 COMBO! ${cardToPlay.name} gets +${cardToPlay.comboBonus} bonus!`, 'special');
      
      actualDamage = (cardToPlay.type === 'damage' || cardToPlay.damageValue > 0) ? actualDamage + cardToPlay.comboBonus : actualDamage; // Added check for damageValue > 0
      actualShield = (cardToPlay.type === 'shield' || cardToPlay.shieldValue > 0) ? actualShield + cardToPlay.comboBonus : actualShield; // Added check for shieldValue > 0
      actualHeal = (cardToPlay.type === 'heal' || cardToPlay.healValue > 0) ? actualHeal + cardToPlay.comboBonus : actualHeal; // Added check for healValue > 0
      actualDrawCards += cardToPlay.comboBonus;
    }

    // Apply debuff amplification if active
    if (cardToPlay.debuffAmplify) {
      let amplifyActive = false;
      const enemy = latestStateRef.current.enemy;
      
      if (cardToPlay.debuffAmplify === 'stun' && enemy.isStunned) amplifyActive = true;
      else if (cardToPlay.debuffAmplify === 'confused' && (enemy.confusedStacks || 0) > 0) amplifyActive = true;
      else if (cardToPlay.debuffAmplify === 'burn' && (enemy.burnStacks || 0) > 0) amplifyActive = true;
      else if (cardToPlay.debuffAmplify === 'poison' && (enemy.poisonStacks || 0) > 0) amplifyActive = true;
      else if (cardToPlay.debuffAmplify === 'vulnerable' && enemy.isVulnerable) amplifyActive = true;
      
      if (amplifyActive) {
        const debuffName = cardToPlay.debuffAmplify.charAt(0).toUpperCase() + cardToPlay.debuffAmplify.slice(1);
        addLog(`⚡ ${debuffName} Amplification: +50% effect!`, 'special');
        actualDamage = Math.floor(actualDamage * 1.5);
        actualShield = Math.floor(actualShield * 1.5);
        actualHeal = Math.floor(actualHeal * 1.5);
      }
    }

    // Apply surge effect if this is the last card in hand
    if (isSurgeActive) { // Already logged above
      actualDamage = Math.floor(actualDamage * 2);
      actualShield = Math.floor(actualShield * 2);
      actualHeal = Math.floor(actualHeal * 2);
      actualDrawCards = Math.floor(actualDrawCards * 2); // Also apply to draw cards if they have 'value'
    }

    let finalCost = calculateCardCost(cardToPlay, latestStateRef.current); // Use cardToPlay here and latestStateRef.current

    if (cardToPlay.lokiDiscount) { // Use cardToPlay here
      finalCost = Math.max(0, finalCost - 1);
      // Don't delete here, it's a temporary property on the card instance in hand, and should persist for other checks
      addLog('🦹 Loki\'s Trickery: Card cost reduced by 1!', 'buff');
    }

    if (cardToPlay.bagOfHoldingDiscount) { // Use cardToPlay here
      finalCost = Math.max(0, finalCost - 1);
      // Don't delete here
      addLog('🎒 Bag of Holding: Card cost reduced by 1!', 'buff');
    }

    if (latestStateRef.current.god?.name === 'Loki' && latestStateRef.current.godTalents?.tier1 === 'chaos_magic' && latestStateRef.current.godState.lokiChaosMagicActive) {
      finalCost = Math.max(0, finalCost - 1);
      dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { lokiChaosMagicActive: false } });
      addLog('🎭 Loki Chaos Magic: Your next card costs 1 less!', 'buff');
    }
    
    // Ganesha Path of Enlightenment (Tier 4) - All cards cost 1 less if active
    if (latestStateRef.current.god?.name === 'Ganesha' && latestStateRef.current.godTalents?.tier4 === 'path_of_enlightenment' && latestStateRef.current.godState?.ganeshaEnlightenmentActive) {
      finalCost = Math.max(0, finalCost - 1);
      addLog('👑🕉️ Ganesha Path of Enlightenment: Card cost reduced by 1!', 'buff');
    }

    if (latestStateRef.current.god?.name === 'Shiva' && latestStateRef.current.godTalents?.tier1 === 'many_arms') { // Use latestStateRef.current
      if (cardToPlay.type === 'damage' && latestStateRef.current.godState.shivaNextDamageDiscount) { // Use cardToPlay here
        finalCost = Math.max(0, finalCost - 1);
        addLog('💃 Shiva Many Arms: Damage card costs 1 less!', 'buff');
        dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { shivaNextDamageDiscount: false } });
      } else if (cardToPlay.type === 'shield' && latestStateRef.current.godState.shivaNextShieldDiscount) { // Use cardToPlay here
        finalCost = Math.max(0, finalCost - 1);
        addLog('💃 Shiva Many Arms: Shield card costs 1 less!', 'buff');
        dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { shivaNextShieldDiscount: false } });
      } else if (cardToPlay.type === 'heal' && latestStateRef.current.godState.shivaNextHealDiscount) { // Use cardToPlay here
        finalCost = Math.max(0, finalCost - 1);
        addLog('💃 Shiva Many Arms: Heal card costs 1 less!', 'buff');
        dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { shivaNextHealDiscount: false } });
      } else if (cardToPlay.type === 'draw' && latestStateRef.current.godState.shivaNextDrawDiscount) { // Use cardToPlay here
        finalCost = Math.max(0, finalCost - 1);
        addLog('💃 Shiva Many Arms: Draw card costs 1 less!', 'buff');
        dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { shivaNextDrawDiscount: false } });
      }
    }

    if (finalCost > latestStateRef.current.player.energy) { // Use latestStateRef.current
      addLog('Not enough energy!', 'error');
      dispatch({ type: combatActions.SET_ANIMATING, payload: false }); // Unblock UI
      return;
    }

    console.log('[playCard] Playing card:', cardToPlay.name);

    dispatch({ type: combatActions.USE_ENERGY, payload: { amount: finalCost } });
    dispatch({ type: combatActions.UPDATE_PLAYER, payload: { cardsPlayedThisTurn: (latestStateRef.current.player.cardsPlayedThisTurn || 0) + 1 } }); // Use latestStateRef.current

    // Determine the charge stacks for the card as it goes to the discard pile.
    // By default, reset to 0, unless Ganesha's Calm Mind talent is active.
    let chargeStacksForDiscard = 0;
    if (latestStateRef.current.god?.name === 'Ganesha' && latestStateRef.current.godTalents?.tier1 === 'calm_mind') {
      // If Calm Mind is active, the card retains its current chargeStacks
      chargeStacksForDiscard = cardToPlay.chargeStacks || 0;
    }
    
    // Update the cardToPlay object with the determined chargeStacks for discard
    cardToPlay = { ...cardToPlay, chargeStacks: chargeStacksForDiscard };

    // Play the card (move to discard with these updated charges)
    dispatch({ 
      type: combatActions.PLAY_CARD, 
      payload: { card: cardToPlay, index: cardIndex } 
    });

    if (staticHandlers.onCardPlayed) {
      try {
        staticHandlers.onCardPlayed({ card: cardToPlay, state: latestStateRef.current, dispatch, addLog }); // Pass cardToPlay here and latestStateRef.current
      } catch (e) {
        console.error('[playCard] Error in onCardPlayed handler:', e);
      }
    }

    // Track card effect stats for quests
    const trackCardEffects = async () => {
      try {
        const user = await base44.auth.me();
        const updates = {};
        
        // Track combo cards
        if (comboActive) {
          updates.total_combo_cards_played = (user.total_combo_cards_played || 0) + 1;
        }
        
        // Track surge cards
        if (isSurgeActive) {
          updates.total_surge_cards_played = (user.total_surge_cards_played || 0) + 1;
        }
        
        // Track charge cards
        if (cardToPlay.chargeValue && cardToPlay.chargeStacks > 0) {
          updates.total_charge_cards_played = (user.total_charge_cards_played || 0) + 1;
        }
        
        // Track knowledge cards
        if (cardToPlay.knowledgeType && cardToPlay.knowledgeValue > 0) {
          updates.total_knowledge_cards_played = (user.total_knowledge_cards_played || 0) + 1;
        }
        
        // Track leech cards
        if (cardToPlay.applyLeech) {
          updates.total_leech_cards_played = (user.total_leech_cards_played || 0) + 1;
        }
        
        // Track burn cards
        if (cardToPlay.applyBurn && cardToPlay.applyBurn > 0) {
          updates.total_burn_cards_played = (user.total_burn_cards_played || 0) + 1;
        }
        
        // Track poison cards
        if (cardToPlay.applyPoison && cardToPlay.applyPoison > 0) {
          updates.total_poison_cards_played = (user.total_poison_cards_played || 0) + 1;
        }
        
        // Track vulnerable cards
        if (cardToPlay.applyVulnerable) {
          updates.total_vulnerable_cards_played = (user.total_vulnerable_cards_played || 0) + 1;
        }
        
        // Track stun cards
        if (cardToPlay.applyStun) {
          updates.total_stun_cards_played = (user.total_stun_cards_played || 0) + 1;
        }
        
        // Track confused cards
        if (cardToPlay.applyConfused && cardToPlay.applyConfused > 0) {
          updates.total_confused_cards_played = (user.total_confused_cards_played || 0) + 1;
        }
        
        // Track self-damage cards
        if (cardToPlay.selfDamage && cardToPlay.selfDamage > 0) {
          updates.total_self_damage_cards_played = (user.total_self_damage_cards_played || 0) + 1;
        }
        
        if (Object.keys(updates).length > 0) {
          await base44.auth.updateMe(updates);
        }
      } catch (error) {
        console.error('[playCard] Error tracking card effects:', error);
      }
    };
    
    // Track in background without blocking gameplay
    trackCardEffects();

    // Blood Stone relic - Take 5 damage when playing any card
    const hasBloodStone = latestStateRef.current.relics?.some(r => r.name === "Blood Stone");
    if (hasBloodStone) {
      const bloodStoneDamage = 5;
      const previousPlayerHealth = latestStateRef.current.player.health;
      dispatch({ type: combatActions.DAMAGE_PLAYER, payload: { amount: bloodStoneDamage } });
      addLog(`💀 Blood Stone: You take ${bloodStoneDamage} damage!`, 'damage');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      if (!isMountedRef.current || isNavigating) {
        dispatch({ type: combatActions.SET_ANIMATING, payload: false });
        return;
      }
      
      const damageToHealth = previousPlayerHealth - latestStateRef.current.player.health;
      if (damageToHealth > 0 && latestStateRef.current.god?.name === 'Anubis' && latestStateRef.current.godTalents?.tier4 === 'eternal_balance') {
        checkAnubisEternalBalance(damageToHealth);
      }

      // Check if player died from Blood Stone
      if (latestStateRef.current.player.health <= 0) {
        let playerSaved = false;
        
        if (latestStateRef.current.god?.name === 'Anubis' && latestStateRef.current.godTalents?.tier2 === 'underworld_resilience') {
          const maxCheats = latestStateRef.current.godTalents?.tier3 === 'death_defiance' ? 2 : 1;
          const cheatsUsed = latestStateRef.current.godState.anubisDeathCheatsUsed || 0;
          
          if (cheatsUsed < maxCheats) {
            const restoredHealth = Math.floor(latestStateRef.current.player.maxHealth * 0.5);
            dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: restoredHealth } });
            dispatch({
              type: combatActions.UPDATE_GOD_STATE,
              payload: { anubisDeathCheatsUsed: cheatsUsed + 1 }
            });
            
            if (latestStateRef.current.godTalents?.tier3 === 'death_defiance') {
              addLog(`💀🛡️⚡ Death Defiance: Anubis restored to ${restoredHealth} HP! (${cheatsUsed + 1}/${maxCheats} used)`, 'special');
            } else {
              addLog(`💀🛡️ Underworld Resilience: Anubis restored to ${restoredHealth} HP!`, 'special');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!isMountedRef.current || isNavigating) {
              dispatch({ type: combatActions.SET_ANIMATING, payload: false });
              return;
            }
            playerSaved = true;
          }
        }
        
        if (!playerSaved) {
          const hasPhoenixFeather = latestStateRef.current.relics?.some(r => r.name === "Phoenix Feather");
          if (hasPhoenixFeather && !latestStateRef.current.godState.phoenixFeatherUsed) {
            dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: 1 } });
            dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { phoenixFeatherUsed: true } });
            addLog('🔥🐦 Phoenix Feather: Restored to 1 HP!', 'special');
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!isMountedRef.current || isNavigating) {
              dispatch({ type: combatActions.SET_ANIMATING, payload: false });
              return;
            }
            playerSaved = true;
          }
        }
        
        if (!playerSaved) {
          console.log('[playCard] Player defeated by Blood Stone damage!');
          handleDefeat();
          return;
        }
      }
    }

    // Apply leech effect if card has it
    if (cardToPlay.applyLeech) { // Use cardToPlay here
      dispatch({
        type: combatActions.UPDATE_TEMP_BUFFS,
        payload: { leechActive: true }
      });
      addLog('🩸 Leech active! Damage dealt will heal you this turn!', 'buff');
    }

    if (latestStateRef.current.god?.name === 'Quetzalcoatl') { // Use latestStateRef.current
      const quetzalcoatlCardsPlayedThisTurnBeforeCurrent = latestStateRef.current.godState.quetzalcoatlCardsPlayedThisTurn || 0; // Use latestStateRef.current
      const newCount = quetzalcoatlCardsPlayedThisTurnBeforeCurrent + 1;

      dispatch({
        type: combatActions.UPDATE_GOD_STATE,
        payload: { quetzalcoatlCardsPlayedThisTurn: newCount }
      });

      if (latestStateRef.current.godTalents?.tier1 === 'whispering_winds' && newCount % 3 === 0) { // Use latestStateRef.current
        drawCardsWithAbilities(1);
        addLog('🌬️ Whispering Winds: Drew a card!', 'buff');

        if (latestStateRef.current.godTalents?.tier2 === 'wind_master') { // Use latestStateRef.current
          dispatch({ type: combatActions.GAIN_SHIELD, payload: { amount: 3 } });
          addLog('🌪️ Wind Master: +3 Shield!', 'buff');
        }

        if (latestStateRef.current.godTalents?.tier3 === 'storm_caller') { // Use latestStateRef.current
          dispatch({ type: combatActions.UPDATE_PLAYER, payload: { energy: latestStateRef.current.player.energy + 1 } }); // Use latestStateRef.current
          addLog('🌬️⚡ Storm Caller: +1 Energy!', 'buff');
        }
      }
    }

    if (latestStateRef.current.god?.name === 'Loki') { // Use latestStateRef.current
      const currentLokiCardsPlayed = latestStateRef.current.godState.lokiCardsPlayedThisTurn || 0; // Use latestStateRef.current
      const newLokiCardsPlayed = currentLokiCardsPlayed + 1;

      dispatch({
        type: combatActions.UPDATE_GOD_STATE,
        payload: { lokiCardsPlayedThisTurn: newLokiCardsPlayed }
      });

      if (latestStateRef.current.godTalents?.tier2 === 'mischief_maker' && newLokiCardsPlayed % 3 === 0) { // Use latestStateRef.current
        dispatch({ type: combatActions.UPDATE_PLAYER, payload: { energy: latestStateRef.current.player.energy + 1 } }); // Use latestStateRef.current
        addLog('🎭 Loki Mischief Maker: +1 Energy!', 'buff');
      }

      if (latestStateRef.current.godTalents?.tier3 === 'tricksters_triumph' && newLokiCardsPlayed % 5 === 0) { // Use latestStateRef.current
        drawCardsWithAbilities(2);
        addLog('🦹✨ Loki Trickster\'s Triumph: Drew 2 cards!', 'buff');
      }
    }

    if (latestStateRef.current.god?.name === 'Loki' && latestStateRef.current.godTalents?.tier1 === 'chaos_magic') { // Use latestStateRef.current
      if (Math.random() < 0.25) {
        dispatch({
          type: combatActions.UPDATE_GOD_STATE,
          payload: { lokiChaosMagicActive: true }
        });
        addLog('🎭 Loki Chaos Magic: Your next card costs 1 less!', 'buff');
      }
    }

    if (latestStateRef.current.god?.name === 'Susanoo') { // Use latestStateRef.current
      const susanooCardsPlayedThisTurn = (latestStateRef.current.godState.susanooCardsPlayedThisTurn || 0) + 1; // Use latestStateRef.current
      const susanooCardsPlayedThisBattle = (latestStateRef.current.godState.susanooCardsPlayedThisBattle || 0) + 1; // Use latestStateRef.current

      dispatch({
        type: combatActions.UPDATE_GOD_STATE,
        payload: {
          susanooCardsPlayedThisTurn: susanooCardsPlayedThisTurn,
          susanooCardsPlayedThisBattle: susanooCardsPlayedThisBattle
        }
      });

      if (latestStateRef.current.godTalents?.tier1 === 'raging_winds' && susanooCardsPlayedThisTurn % 3 === 0) { // Use latestStateRef.current
        drawCardsWithAbilities(1);
        addLog('💨 Susanoo Raging Winds: Drew a card!', 'buff');
      }

      if (latestStateRef.current.godTalents?.tier2 === 'fury_unbound' && susanooCardsPlayedThisBattle % 4 === 0) { // Use latestStateRef.current
          dispatch({
            type: combatActions.UPDATE_GOD_STATE,
            payload: { susanooFuryUnboundBonus: (latestStateRef.current.godState.susanooFuryUnboundBonus || 0) + 6 } // Use latestStateRef.current
          });
          addLog('🌪️ Susanoo Fury Unbound: Next attack will deal +6 bonus damage!', 'buff');
      }
    }

    if (latestStateRef.current.god?.name === 'Shiva' && latestStateRef.current.godTalents?.tier1 === 'many_arms') { // Use latestStateRef.current
      if (cardToPlay.type === 'damage') { // Use cardToPlay here
        const newCount = (latestStateRef.current.godState.shivaDamageCardsPlayed || 0) + 1; // Use latestStateRef.current
        if (newCount === 2) {
          dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: {
            shivaDamageCardsPlayed: 0,
            shivaNextDamageDiscount: true
          } });
          addLog('💃 Shiva Many Arms: Damage card costs 1 less!', 'buff');
        } else {
          dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { shivaDamageCardsPlayed: newCount } });
        }
      } else if (cardToPlay.type === 'shield') { // Use cardToPlay here
        const newCount = (latestStateRef.current.godState.shivaShieldCardsPlayed || 0) + 1; // Use latestStateRef.current
        if (newCount === 2) {
          dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: {
            shivaShieldCardsPlayed: 0,
            shivaNextShieldDiscount: true
          } });
          addLog('💃 Shiva Many Arms: Shield card costs 1 less!', 'buff');
        } else {
          dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { shivaShieldCardsPlayed: newCount } });
        }
      } else if (cardToPlay.type === 'heal') { // Use cardToPlay here
        const newCount = (latestStateRef.current.godState.shivaHealCardsPlayed || 0) + 1; // Use latestStateRef.current
        if (newCount === 2) {
          dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: {
            shivaHealCardsPlayed: 0,
            shivaNextHealDiscount: true
          } });
          addLog('💃 Shiva Many Arms: Heal card costs 1 less!', 'buff');
        } else {
          dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { shivaHealCardsPlayed: newCount } });
        }
      } else if (cardToPlay.type === 'draw') { // Use cardToPlay here
        const newCount = (latestStateRef.current.godState.shivaDrawCardsPlayed || 0) + 1; // Use latestStateRef.current
        if (newCount === 2) {
          dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: {
            shivaDrawCardsPlayed: 0,
            shivaNextDrawDiscount: true
          } });
          addLog('💃 Shiva Many Arms: Draw card costs 1 less!', 'buff');
        } else {
          dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { shivaDrawCardsPlayed: newCount } });
        }
      }
    }

    if (latestStateRef.current.god?.name === 'Shiva') { // Use latestStateRef.current
      const currentCardsPlayed = latestStateRef.current.godState.shivaCardsPlayedThisTurn || 0; // Use latestStateRef.current
      const newCardsPlayed = currentCardsPlayed + 1;

      dispatch({
        type: combatActions.UPDATE_GOD_STATE,
        payload: { shivaCardsPlayedThisTurn: newCardsPlayed }
      });

      if (latestStateRef.current.godTalents?.tier2 === 'tandava_fury' && newCardsPlayed === 4) { // Use latestStateRef.current
        dispatch({
          type: combatActions.UPDATE_PLAYER,
          payload: { energy: latestStateRef.current.player.energy + 2 } // Use latestStateRef.current
        });
        addLog('🔥💃 Shiva Tandava Fury: +2 Energy!', 'buff');
      }
    }

    // Execute card effects based on type
    if (cardToPlay.type === 'damage') {
      const finalDamage = calculateDamage({ ...cardToPlay, value: actualDamage }, latestStateRef.current, latestStateRef.current.enemy);
      await processDamageEffects(cardToPlay, finalDamage, latestStateRef.current);
      
      // Apply bonus shield if present and card explicitly has shield property
      if (actualShield > 0 && cardToPlay.shieldValue > 0) {
        const finalShield = calculateShield(actualShield, latestStateRef.current);
        dispatch({ type: combatActions.GAIN_SHIELD, payload: { amount: finalShield } });
        addLog(`Gained ${finalShield} shield!`, 'shield');
      }
    } else if (cardToPlay.type === 'shield') {
      let shieldAmount = actualShield;

      // Anubis Eternal Balance bonus shield
      if (latestStateRef.current.god?.name === 'Anubis' && latestStateRef.current.godTalents?.tier4 === 'eternal_balance') {
        const eternalBalanceStacks = latestStateRef.current.godState?.anubisEternalBalanceStacks || 0;
        if (eternalBalanceStacks > 0) {
          const bonusShield = eternalBalanceStacks * 5;
          shieldAmount += bonusShield;
          addLog(`⚖️👑 Eternal Balance: +${bonusShield} Shield (${eternalBalanceStacks} stacks)`, 'buff');
          console.log('[playCard] Anubis Eternal Balance: +', bonusShield, 'shield (', eternalBalanceStacks, 'stacks)');
        }
      }

      if (latestStateRef.current.god?.name === 'Susanoo' && latestStateRef.current.godTalents?.tier2 === 'tidal_embrace') {
        shieldAmount += 3;
        addLog('🌊 Susanoo Tidal Embrace: +3 bonus shield!', 'buff');
      }

      if (latestStateRef.current.god?.name === 'Susanoo' && latestStateRef.current.godTalents?.tier3 === 'divine_tempest') {
        shieldAmount += 5;
        dispatch({
          type: combatActions.UPDATE_ENEMY,
          payload: { isVulnerable: true }
        });
        addLog('🌪️ Susanoo Divine Tempest: +5 bonus shield and enemy is vulnerable!', 'buff');
      }
      
      const finalShield = calculateShield(shieldAmount, latestStateRef.current);
      dispatch({ type: combatActions.GAIN_SHIELD, payload: { amount: finalShield } });
      addLog(`Gained ${finalShield} shield!`, 'shield');
      
      // Only apply bonus damage if card explicitly has damage property
      if (actualDamage > 0 && cardToPlay.damageValue > 0) {
        const finalDamage = calculateDamage({ ...cardToPlay, value: actualDamage }, latestStateRef.current, latestStateRef.current.enemy);
        await processDamageEffects(cardToPlay, finalDamage, latestStateRef.current);
      }
    } else if (cardToPlay.type === 'heal') {
        const finalHeal = calculateHealing(actualHeal, latestStateRef.current);
        dispatch({ type: combatActions.HEAL_PLAYER, payload: { amount: finalHeal } });
        addLog(`Healed ${finalHeal} HP!`, 'heal');
        
        // Trigger onPlayerHealed for god abilities
        if (staticHandlers.onPlayerHealed) {
            try {
                staticHandlers.onPlayerHealed({ card: cardToPlay, state: latestStateRef.current, dispatch, addLog, amount: finalHeal });
            } catch (e) {
                console.error('[playCard] Error in onPlayerHealed handler:', e);
            }
        }
        
        // Only apply bonus shield if card explicitly has shield property
        if (actualShield > 0 && cardToPlay.shieldValue > 0) {
          const finalShield = calculateShield(actualShield, latestStateRef.current);
          dispatch({ type: combatActions.GAIN_SHIELD, payload: { amount: finalShield } });
          addLog(`Gained ${finalShield} shield!`, 'shield');
        }
        
        // Only apply bonus damage if card explicitly has damage property
        if (actualDamage > 0 && cardToPlay.damageValue > 0) {
          const finalDamage = calculateDamage({ ...cardToPlay, value: actualDamage }, latestStateRef.current, latestStateRef.current.enemy);
          await processDamageEffects(cardToPlay, finalDamage, latestStateRef.current);
        }
        
        // Apply secondary draw effect if present
        if (actualDrawCards > 0) {
          drawCardsWithAbilities(actualDrawCards);
          addLog(`Drew ${actualDrawCards} card${actualDrawCards !== 1 ? 's' : ''}!`, 'buff');
        }
      } else if (cardToPlay.type === 'draw') {
        console.log('[playCard] Draw card played:', cardToPlay.name, 'actualDrawCards:', actualDrawCards);
        if (actualDrawCards > 0) { // Check if there's any actual draw amount after modifiers
          drawCardsWithAbilities(actualDrawCards);
          addLog(`Drew ${actualDrawCards} card${actualDrawCards !== 1 ? 's' : ''}!`, 'buff');
        } else {
          console.warn('[playCard] Draw card has 0 cards to draw!', {
            cardName: cardToPlay.name,
            cardType: cardToPlay.type,
            cardValue: cardToPlay.value,
            cardDrawCards: cardToPlay.drawCards,
            actualDrawCards: actualDrawCards
          });
          addLog(`${cardToPlay.name} failed to draw cards (value is 0)`, 'error');
        }
      }

    if (cardToPlay.energyReturn && cardToPlay.energyReturn > 0) { // Use cardToPlay here
      dispatch({
        type: combatActions.UPDATE_PLAYER,
        payload: { energy: Math.min(latestStateRef.current.player.maxEnergy, latestStateRef.current.player.energy + cardToPlay.energyReturn) } // Use latestStateRef.current
      });
      addLog(`Gained ${cardToPlay.energyReturn} energy!`, 'buff');
    }

    if (cardToPlay.discardCards && cardToPlay.discardCards > 0) { // Use cardToPlay here
      const cardsToDiscard = Math.min(cardToPlay.discardCards, latestStateRef.current.deck.hand.length); // Use latestStateRef.current
      for (let i = 0; i < cardsToDiscard; i++) {
        if (latestStateRef.current.deck.hand.length > 0) { // Use latestStateRef.current
          const randomCard = latestStateRef.current.deck.hand[Math.floor(Math.random() * latestStateRef.current.deck.hand.length)]; // Use latestStateRef.current
          dispatch({ type: combatActions.DISCARD_CARD, payload: { card: randomCard } });
        }
      }
      addLog(`Discarded ${cardsToDiscard} card${cardsToDiscard !== 1 ? 's' : ''}!`, 'info');
    }

    if (cardToPlay.nextAttackBonus && cardToPlay.nextAttackBonus > 0) { // Use cardToPlay here
      dispatch({
        type: combatActions.UPDATE_TEMP_BUFFS,
        payload: { nextAttackBonus: (latestStateRef.current.tempBuffs.nextAttackBonus || 0) + cardToPlay.nextAttackBonus } // Use latestStateRef.current
      });
      addLog(`Next attack will deal +${cardToPlay.nextAttackBonus} damage!`, 'buff');
    }

    if (cardToPlay.nextAttackBonusPercent && cardToPlay.nextAttackBonusPercent > 0) { // Use cardToPlay here
      dispatch({
        type: combatActions.UPDATE_TEMP_BUFFS,
        payload: { nextAttackBonusPercent: (latestStateRef.current.tempBuffs.nextAttackBonusPercent || 0) + cardToPlay.nextAttackBonusPercent } // Use latestStateRef.current
      });
      addLog(`Next attack will deal +${cardToPlay.nextAttackBonusPercent}% damage!`, 'buff');
    }

    if (cardToPlay.nextCardDiscount && cardToPlay.nextCardDiscount > 0) { // Use cardToPlay here
      dispatch({
        type: combatActions.UPDATE_TEMP_BUFFS,
        payload: { nextCardDiscount: (latestStateRef.current.tempBuffs.nextCardDiscount || 0) + cardToPlay.nextCardDiscount } // Use latestStateRef.current
      });
      addLog(`Next card costs ${cardToPlay.nextCardDiscount} less!`, 'buff');
    }

    if (cardToPlay.applyBurn && cardToPlay.applyBurn > 0) { // Use cardToPlay here
      dispatch({
        type: combatActions.UPDATE_ENEMY,
        payload: { burnStacks: (latestStateRef.current.enemy.burnStacks || 0) + cardToPlay.applyBurn } // Use latestStateRef.current
      });
      addLog(`Applied ${cardToPlay.applyBurn} burn damage per turn!`, 'debuff');

      // Baron Samedi Tier 4: Laughter of the Grave - gain shield and heal when applying burn
      if (latestStateRef.current.god?.name === 'Baron Samedi' && latestStateRef.current.godTalents?.tier4 === 'laughter_of_the_grave') { // Use latestStateRef.current
        dispatch({ type: combatActions.GAIN_SHIELD, payload: { amount: 2 } });
        dispatch({ type: combatActions.HEAL_PLAYER, payload: { amount: 2 } });
        addLog('🎭🔥 Laughter of the Grave: +2 Shield and +2 HP!', 'buff');
      }

      if (staticHandlers.onBurnApplied) {
        try {
          staticHandlers.onBurnApplied({ card: cardToPlay, state: latestStateRef.current, dispatch, addLog });
        } catch (e) {
          console.error('[playCard] Error in onBurnApplied handler:', e);
        }
      }
    }

    if (cardToPlay.applyPoison && cardToPlay.applyPoison > 0) { // Use cardToPlay here
      let poisonAmount = cardToPlay.applyPoison;

      if (latestStateRef.current.god?.name === 'Baron Samedi' && latestStateRef.current.godTalents?.tier3 === 'voodoo_master') { // Use latestStateRef.current
        poisonAmount = poisonAmount * 3;
        addLog(`🎭 Baron Samedi Voodoo Master: Poison triplicated!`, 'buff');
      }

      dispatch({
        type: combatActions.UPDATE_ENEMY,
        payload: { poisonStacks: (latestStateRef.current.enemy.poisonStacks || 0) + poisonAmount } // Use latestStateRef.current
      });
      addLog(`Applied ${poisonAmount} poison stack${poisonAmount !== 1 ? 's' : ''}!`, 'debuff');
    }

    if (cardToPlay.applyVulnerable) { // Use cardToPlay here
      dispatch({
        type: combatActions.UPDATE_ENEMY,
        payload: { isVulnerable: true }
      });
      addLog(`Enemy is now vulnerable (+50% damage)!`, 'debuff');
    }

    if (cardToPlay.applyStun) { // Use cardToPlay here
      dispatch({
        type: combatActions.UPDATE_ENEMY,
        payload: { isStunned: true }
      });
      addLog(`Enemy is stunned (will deal -50% damage next turn)!`, 'debuff');
    }

    if (cardToPlay.applyConfused && cardToPlay.applyConfused > 0) { // Use cardToPlay here
      dispatch({
        type: combatActions.UPDATE_ENEMY,
        payload: { confusedStacks: (latestStateRef.current.enemy.confusedStacks || 0) + cardToPlay.applyConfused } // Use latestStateRef.current
      });
      addLog(`Applied ${cardToPlay.applyConfused} confusion stack${cardToPlay.applyConfused !== 1 ? 's' : ''}!`, 'debuff');
    }

    if (cardToPlay.damageReflection && cardToPlay.damageReflection > 0) { // Use cardToPlay here
      dispatch({
        type: combatActions.UPDATE_PLAYER,
        payload: { damageReflection: (latestStateRef.current.player.damageReflection || 0) + cardToPlay.damageReflection } // Use latestStateRef.current
      });
      addLog(`Will reflect ${cardToPlay.damageReflection}% of damage this turn!`, 'buff');
    }

    if (cardToPlay.selfDamage && cardToPlay.selfDamage > 0) { // Use cardToPlay here
      let selfDamageAmount = cardToPlay.selfDamage;

      if (latestStateRef.current.god?.name === 'Anubis' && latestStateRef.current.player.health <= latestStateRef.current.player.maxHealth * 0.5) { // Use latestStateRef.current
        console.log(`[playCard] Anubis Balancing the Scales (Self-Damage): Player HP ${latestStateRef.current.player.health}/${latestStateRef.current.player.maxHealth} <= 50%. Increasing self-damage by 50%.`); // Use latestStateRef.current
        selfDamageAmount = Math.floor(selfDamageAmount * 1.5);
        addLog('⚖️ Anubis Balancing the Scales (Self-Damage): +50% self-damage!', 'debuff');
      } else if (latestStateRef.current.god?.name === 'Anubis') { // Use latestStateRef.current
        console.log(`[playCard] Anubis Balancing the Scales (Self-Damage): Player HP ${latestStateRef.current.player.health}/${latestStateRef.current.player.maxHealth} > 50%. Not increasing self-damage.`); // Use latestStateRef.current
      }

      const previousPlayerHealth = latestStateRef.current.player.health;
      dispatch({ type: combatActions.DAMAGE_PLAYER, payload: { amount: selfDamageAmount } });
      addLog(`You took ${selfDamageAmount} self-damage from ${cardToPlay.name}!`, 'damage'); // Use cardToPlay here
      await new Promise(resolve => setTimeout(resolve, 300));
      if (!isMountedRef.current || isNavigating) {
        dispatch({ type: combatActions.SET_ANIMATING, payload: false }); // Unblock UI
        return;
      }
      
      const damageToHealth = previousPlayerHealth - latestStateRef.current.player.health;
      if (damageToHealth > 0 && latestStateRef.current.god?.name === 'Anubis' && latestStateRef.current.godTalents?.tier4 === 'eternal_balance') { // Use latestStateRef.current
        checkAnubisEternalBalance(damageToHealth);
      }

      // Trigger Susanoo's Wrath of the Storm on self-damage
      if (damageToHealth > 0 && latestStateRef.current.god?.name === 'Susanoo' && staticHandlers.Susanoo?.onDamageTaken) {
        console.log('[playCard] Triggering Susanoo onDamageTaken for self-damage:', damageToHealth);
        try {
          await new Promise(resolve => setTimeout(resolve, 200));
          if (!isMountedRef.current || isNavigating) {
            dispatch({ type: combatActions.SET_ANIMATING, payload: false }); // Unblock UI
            return;
          }
          staticHandlers.Susanoo.onDamageTaken({
            state: latestStateRef.current,
            dispatch,
            addLog,
            amount: damageToHealth
          });
        } catch (e) {
          console.error('[playCard] Error in Susanoo onDamageTaken handler (self-damage):', e);
        }
      }

      if (latestStateRef.current.player.health <= 0) {
        let playerSaved = false;

        if (latestStateRef.current.god?.name === 'Anubis' && latestStateRef.current.godTalents?.tier2 === 'underworld_resilience') { // Use latestStateRef.current
          const maxCheats = latestStateRef.current.godTalents?.tier3 === 'death_defiance' ? 2 : 1; // Use latestStateRef.current
          const cheatsUsed = latestStateRef.current.godState.anubisDeathCheatsUsed || 0; // Use latestStateRef.current

          if (cheatsUsed < maxCheats) {
            const restoredHealth = Math.floor(latestStateRef.current.player.maxHealth * 0.5); // Use latestStateRef.current
            dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: restoredHealth } });
            dispatch({
              type: combatActions.UPDATE_GOD_STATE,
              payload: { anubisDeathCheatsUsed: cheatsUsed + 1 }
            });

            if (latestStateRef.current.godTalents?.tier3 === 'death_defiance') { // Use latestStateRef.current
              addLog(`💀🛡️⚡ Death Defiance: Anubis restored to ${restoredHealth} HP! (${cheatsUsed + 1}/${maxCheats} used)`, 'special');
            } else {
              addLog(`💀🛡️ Underworld Resilience: Anubis restored to ${restoredHealth} HP!`, 'special');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!isMountedRef.current || isNavigating) {
              dispatch({ type: combatActions.SET_ANIMATING, payload: false }); // Unblock UI
              return;
            }
            playerSaved = true;
          }
        }

        if (!playerSaved) {
          const hasPhoenixFeather = latestStateRef.current.relics?.some(r => r.name === "Phoenix Feather"); // Use latestStateRef.current
          if (hasPhoenixFeather && !latestStateRef.current.godState.phoenixFeatherUsed) { // Use latestStateRef.current
            dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: 1 } });
            dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { phoenixFeatherUsed: true } });
            addLog('🔥🐦 Phoenix Feather: Restored to 1 HP!', 'special');
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!isMountedRef.current || isNavigating) {
              dispatch({ type: combatActions.SET_ANIMATING, payload: false }); // Unblock UI
              return;
            }
            playerSaved = true;
          }
        }

        if (!playerSaved) {
          console.log('[playCard] Player defeated by self-damage!');
          handleDefeat();
          return;
        }
      }
    }

    if (latestStateRef.current.god?.name === 'Quetzalcoatl' && latestStateRef.current.godTalents?.tier2 === 'zephyrs_grace') { // Use latestStateRef.current
      if (finalCost === 0) { // Check final cost after all reductions
        dispatch({ type: combatActions.GAIN_SHIELD, payload: { amount: 3 } });
        drawCardsWithAbilities(1);
        addLog('🪶✨ Quetzalcoatl Zephyr\'s Grace: +3 Shield and draw 1 card!', 'buff');
      }
    }

    // Update last card type played at the end of the turn
    dispatch({
      type: combatActions.UPDATE_COMBAT_STATE,
      payload: { lastCardTypePlayed: cardTypePlayed }
    });

    // Trigger on_card_played companions (add before final SET_ANIMATING false)
    if (companionSystem) {
      const user = await base44.auth.me(); // Fetch user for blessings
      companionSystem.trigger(
        { type: 'on_card_played', card: cardToPlay }, // Pass cardToPlay in the event object
        {
          ...latestStateRef.current, // Pass the entire current state as combatState
          chosenBlessings: user.companion_chosen_blessings || {},
        },
        dispatch,
        combatActions
      );
    }

    dispatch({ type: combatActions.SET_ANIMATING, payload: false }); // Unblock UI
  }, [addLog, handleVictoryAndProgressRun, handleDefeat, dispatch, drawCardsWithAbilities, calculateDamage, calculateShield, calculateHealing, latestStateRef, isMountedRef, isNavigating, wouldBeLastCard, checkAnubisEternalBalance, staticHandlers, processDamageEffects, companionSystem]);

  const handlePlayCard = useCallback(async (card, cardIndex) => {
    if (state.isProcessing || state.isAnimating) return;

    if (cardIndex === undefined || cardIndex < 0 || cardIndex >= state.deck.hand.length) {
      console.error('[handlePlayCard] Invalid card index:', cardIndex);
      return;
    }

    // Check for Frost Aura - limit to 2 cards per turn
    const hasFrostAura = state.enemy.affixes?.some(a => a.effect === 'frost_aura');
    if (hasFrostAura && state.player.cardsPlayedThisTurn >= 2) {
      addLog('❄️ Frost Aura: You can only play 2 cards per turn!', 'error');
      return;
    }

    // Get the original card from hand using the index
    const originalCard = state.deck.hand[cardIndex];

    // The dispatch for PLAY_CARD is now moved to `playCard` function
    // to ensure it happens after all card modifications are calculated.
    // However, for immediate UI feedback (removing from hand), we will temporarily remove it here,
    // and the `PLAY_CARD` action in reducer needs to handle that it's already removed if done this way.
    // Given the outline, the simplest and most direct interpretation is to remove the `PLAY_CARD` here
    // and let `playCard` handle the actual dispatch.

    dispatch({ type: combatActions.SET_PROCESSING, payload: true });

    try {
      await playCard(originalCard, cardIndex);
    } finally {
      dispatch({ type: combatActions.SET_PROCESSING, payload: false });
    }
  }, [state.isProcessing, state.isAnimating, state.deck.hand, state.enemy.affixes, state.player.cardsPlayedThisTurn, playCard, addLog]);

  const endTurn = useCallback(async () => {
    if (!isMountedRef.current) {
      console.log('[endTurn] Component unmounted, aborting');
      return;
    }
    if (isNavigating) { // Prevent end turn if already navigating
      console.log('[endTurn] Already navigating away, aborting end turn');
      return;
    }
    if (!isPlayerTurn) return;

    dispatch({ type: combatActions.SET_ANIMATING, payload: true }); // Block UI at start of end turn logic
    console.log('[endTurn] Ending player turn');

    // Store stun status before clearing it
    const enemyWasStunnedThisTurn = latestStateRef.current.enemy.isStunned;
    if (enemyWasStunnedThisTurn) {
      dispatch({ type: combatActions.UPDATE_ENEMY, payload: { isStunned: false } });
      addLog(`😵 ${latestStateRef.current.enemy.name} was stunned! Damage will be reduced by 50% this turn.`, 'buff');
    }

    if (staticHandlers.onTurnEnd) {
      try {
        staticHandlers.onTurnEnd({ state, dispatch, addLog });
      } catch (e) {
        console.error('[endTurn] Error in onTurnEnd handler:', e);
      }
    }
    
    if (state.god?.name === 'Ganesha' && state.godTalents?.tier4 === 'path_of_enlightenment' && state.godState?.ganeshaEnlightenmentActive) {
      // Path of Enlightenment remains active for the battle, no reset needed here.
      // But update the total charge stacks, as cards will be discarded/redrawn.
      const totalCharges = state.deck.drawPile.concat(state.deck.discardPile).reduce((sum, card) => {
        return sum + (card.chargeStacks || 0);
      }, 0);
      dispatch({
        type: combatActions.UPDATE_GOD_STATE,
        payload: { ganeshaTotalChargeStacks: totalCharges }
      });
    }

    if (state.god?.name === 'Loki') {
      dispatch({
        type: combatActions.UPDATE_GOD_STATE,
        payload: { lokiCardsPlayedThisTurn: 0 }
      });
    }

    if (state.god?.name === 'Quetzalcoatl') {
      dispatch({
        type: combatActions.UPDATE_GOD_STATE,
        payload: { quetzalcoatlCardsPlayedThisTurn: 0 }
      });
    }

    if (state.god?.name === 'Susanoo') {
      dispatch({
        type: combatActions.UPDATE_GOD_STATE,
        payload: { susanooCardsPlayedThisTurn: 0 }
      });
    }

    // Athena Aegis Ascendant expiration
    if (state.god?.name === 'Athena' && state.godTalents?.tier4 === 'aegis_ascendant' && state.godState.athenaAegisAscendantUsed) {
      let turnsRemaining = state.godState.athenaAegisAscendantTurnsRemaining - 1;
      if (turnsRemaining > 0) {
        dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { athenaAegisAscendantTurnsRemaining: turnsRemaining } });
      } else {
        dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { athenaAegisAscendantUsed: false, athenaAegisAscendantTurnsRemaining: 0 } });
        dispatch({ type: combatActions.UPDATE_TEMP_BUFFS, payload: { damageReflection: 0 } }); // Reset reflection
        addLog('🛡️👑 Aegis Ascendant buff expired!', 'debuff');
      }
    }

    dispatch({ type: combatActions.END_TURN });
    addLog('=== Enemy Turn ===', 'special');

    // Reset lastCardTypePlayed at the end of the turn as new turn begins for player
    dispatch({
      type: combatActions.UPDATE_COMBAT_STATE,
      payload: { lastCardTypePlayed: null }
    });

    await new Promise(resolve => setTimeout(resolve, 800));
    if (!isMountedRef.current || isNavigating) {
      dispatch({ type: combatActions.SET_ANIMATING, payload: false });
      return;
    }

    if (state.enemy.health <= 0) {
      console.log('[endTurn] Enemy already dead, triggering victory');
      handleVictoryAndProgressRun();
      return;
    }

    let totalPlayerStatusDamage = 0;

    if (state.player.burnStacks && state.player.burnStacks > 0) {
      const burnDamage = state.player.burnStacks;
      totalPlayerStatusDamage += burnDamage;
      addLog(`You take ${burnDamage} burn damage!`, 'enemy');
      dispatch({
        type: combatActions.UPDATE_PLAYER,
        payload: { burnStacks: Math.max(0, state.player.burnStacks - 1) }
      });
    }

    if (state.player.poisonStacks > 0) {
      const poisonDamage = state.player.poisonStacks * 2;
      totalPlayerStatusDamage += poisonDamage;
      addLog(`☠️ You take ${poisonDamage} poison damage! (${state.player.poisonStacks} stacks)`, 'enemy');
      dispatch({
        type: combatActions.UPDATE_PLAYER,
        payload: { poisonStacks: Math.max(0, state.player.poisonStacks - 1) }
      });
    }

    if (totalPlayerStatusDamage > 0) {
      const previousPlayerHealth = latestStateRef.current.player.health;
      // const previousPlayerShield = latestStateRef.current.player.shield; // unused variable

      dispatch({ type: combatActions.DAMAGE_PLAYER, payload: { amount: totalPlayerStatusDamage } });
      await new Promise(resolve => setTimeout(resolve, 600));
      if (!isMountedRef.current || isNavigating) {
        dispatch({ type: combatActions.SET_ANIMATING, payload: false });
        return;
      }
      
      const damageToHealth = previousPlayerHealth - latestStateRef.current.player.health;
      if (damageToHealth > 0 && state.god?.name === 'Anubis' && state.godTalents?.tier4 === 'eternal_balance') {
        checkAnubisEternalBalance(damageToHealth);
      }

      if (latestStateRef.current.player.health <= 0) {
        let playerSaved = false;
        
        if (latestStateRef.current.god?.name === 'Anubis' && latestStateRef.current.godTalents?.tier2 === 'underworld_resilience') {
          const maxCheats = state.godTalents?.tier3 === 'death_defiance' ? 2 : 1;
          const cheatsUsed = latestStateRef.current.godState.anubisDeathCheatsUsed || 0;
          
          if (cheatsUsed < maxCheats) {
            const restoredHealth = Math.floor(latestStateRef.current.player.maxHealth * 0.5);
            dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: restoredHealth } });
            dispatch({
              type: combatActions.UPDATE_GOD_STATE,
              payload: { anubisDeathCheatsUsed: cheatsUsed + 1 }
            });
            
            if (latestStateRef.current.godTalents?.tier3 === 'death_defiance') {
              addLog(`💀🛡️⚡ Death Defiance: Anubis restored to ${restoredHealth} HP! (${cheatsUsed + 1}/${maxCheats} used)`, 'special');
            } else {
              addLog(`💀🛡️ Underworld Resilience: Anubis restored to ${restoredHealth} HP!`, 'special');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!isMountedRef.current || isNavigating) {
              dispatch({ type: combatActions.SET_ANIMATING, payload: false });
              return;
            }
            playerSaved = true;
          }
        }
        
        if (!playerSaved) {
          const hasPhoenixFeather = state.relics?.some(r => r.name === "Phoenix Feather");
          if (hasPhoenixFeather && !state.godState.phoenixFeatherUsed) {
            dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: 1 } });
            dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { phoenixFeatherUsed: true } });
            addLog('🔥🐦 Phoenix Feather: Restored to 1 HP!', 'special');
            await new Promise(resolve => setTimeout(resolve, 800));
            if (!isMountedRef.current || isNavigating) {
              dispatch({ type: combatActions.SET_ANIMATING, payload: false });
              return;
            }
            playerSaved = true;
          }
        }
        
        if (!playerSaved) {
          console.log('[endTurn] Player defeated by status effects!');
          await new Promise(resolve => setTimeout(resolve, 500));
          if (!isMountedRef.current || isNavigating) {
            dispatch({ type: combatActions.SET_ANIMATING, payload: false });
            return;
          }
          handleDefeat();
          return;
        }
      }
    }

    // Ra Inferno ability
    if (state.god?.name === 'Ra' && state.godTalents?.tier3 === 'inferno') {
      if (state.player.health >= state.player.maxHealth) {
        dispatch({ type: combatActions.DAMAGE_ENEMY, payload: { amount: 5 } });
        addLog('☀️🔥 Ra Inferno: Enemy takes 5 burn damage!', 'damage');
        await new Promise(resolve => setTimeout(resolve, 600));
        if (!isMountedRef.current || isNavigating) {
          dispatch({ type: combatActions.SET_ANIMATING, payload: false });
          return;
        }

        if (latestStateRef.current.enemy.health <= 0) {
          console.log('[endTurn] Enemy defeated by Ra Inferno!');
          handleVictoryAndProgressRun();
          return;
        }
      }
    }

    // Apply burn damage to enemy
    if (state.enemy.burnStacks && state.enemy.burnStacks > 0) {
      let burnDamage = state.enemy.burnStacks;
      
      // Apply Divine Modifier burn reduction
      const activeModifiers = state.run?.active_modifiers || [];
      const burnReductionModifier = activeModifiers.find(m => m.effect_type === 'burn_reduction');
      if (burnReductionModifier) {
        burnDamage = Math.floor(burnDamage * burnReductionModifier.effect_value);
      }
      
      dispatch({ type: combatActions.DAMAGE_ENEMY, payload: { amount: burnDamage } });
      addLog(`🔥 ${state.enemy.name} takes ${burnDamage} burn damage!`, 'damage');
      
      // Decrement burn stacks after dealing damage
      dispatch({
        type: combatActions.UPDATE_ENEMY,
        payload: { burnStacks: Math.max(0, state.enemy.burnStacks - 1) }
      });

      await new Promise(resolve => setTimeout(resolve, 600));
      if (!isMountedRef.current || isNavigating) {
        dispatch({ type: combatActions.SET_ANIMATING, payload: false });
        return;
      }

      if (latestStateRef.current.enemy.health <= 0) {
        console.log('[endTurn] Enemy defeated by burn!');
        handleVictoryAndProgressRun();
        return;
      }
    }

    // Apply poison damage to enemy
    if (state.enemy.poisonStacks && state.enemy.poisonStacks > 0) {
      let poisonDamagePerStack = 2;

      if (state.god?.name === 'Baron Samedi') {
        if (state.godTalents?.tier3 === 'death_lord') {
          poisonDamagePerStack = 5;
          addLog('💀 Baron Samedi Death Lord: Poison deals 5 damage per stack!', 'buff');
        } else if (state.godTalents?.tier2 === 'master_of_death') {
          poisonDamagePerStack = 3;
          addLog('☠️ Baron Samedi Master of Death: Poison deals 3 damage per stack!', 'buff');
        }
      }

      let poisonDamage = state.enemy.poisonStacks * poisonDamagePerStack;
      
      // Apply Divine Modifier poison reduction
      const activeModifiers = state.run?.active_modifiers || [];
      const poisonReductionModifier = activeModifiers.find(m => m.effect_type === 'poison_reduction');
      if (poisonReductionModifier) {
        poisonDamage = Math.floor(poisonDamage * poisonReductionModifier.effect_value);
      }
      
      dispatch({ type: combatActions.DAMAGE_ENEMY, payload: { amount: poisonDamage } });
      addLog(`☠️ ${state.enemy.name} takes ${poisonDamage} poison damage!`, 'damage');
      
      // Poison stacks persist - no decrement

      if (state.god?.name === 'Baron Samedi') {
        dispatch({ type: combatActions.HEAL_PLAYER, payload: { amount: 1 } });
        addLog(`🎭 Baron Samedi: +1 Health from poison!`, 'heal');
      }

      if (state.god?.name === 'Baron Samedi' && state.godTalents?.tier2 === 'loa_blessing') {
        dispatch({ type: combatActions.HEAL_PLAYER, payload: { amount: 5 } });
        addLog(`🎭 Baron Samedi Loa's Blessing: +5 Health!`, 'heal');
      }

      await new Promise(resolve => setTimeout(resolve, 600));
      if (!isMountedRef.current || isNavigating) {
        dispatch({ type: combatActions.SET_ANIMATING, payload: false });
        return;
      }

      if (latestStateRef.current.enemy.health <= 0) {
        console.log('[endTurn] Enemy defeated by poison!');
        handleVictoryAndProgressRun();
        return;
      }
    }

    // Cthulhu Cosmic Dread
    if (state.god?.name === 'Cthulhu' && state.godTalents?.tier3 === 'cosmic_dread') {
      if (state.enemy.isVulnerable) {
        dispatch({ type: combatActions.DAMAGE_ENEMY, payload: { amount: 10 } });
        addLog('🐙💀 Cthulhu Cosmic Dread: Vulnerable enemy took 10 damage!', 'buff');
        await new Promise(resolve => setTimeout(resolve, 600));
        if (!isMountedRef.current || isNavigating) {
          dispatch({ type: combatActions.SET_ANIMATING, payload: false });
          return;
        }

        if (latestStateRef.current.enemy.health <= 0) {
          console.log('[endTurn] Enemy defeated by Cosmic Dread!');
          handleVictoryAndProgressRun();
          return;
        }
      }
    }

    // Athena Insight's Edge
    if (state.god?.name === 'Athena' && state.godTalents?.tier2 === 'insight_edge') {
      if (!state.godState.athenaInsightUsed) {
        dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { athenaInsightUsed: true } });
        addLog('👁️ Athena Insight\'s Edge: Enemy attack negated!', 'special');

        await new Promise(resolve => setTimeout(resolve, 800));
        if (!isMountedRef.current || isNavigating) {
          dispatch({ type: combatActions.SET_ANIMATING, payload: false });
          return;
        }
        startNewTurn();
        return;
      }
    }

    // Process boss abilities (on_turn_end trigger)
    if (state.enemy.isBoss && state.enemy.special_abilities) {
      for (const ability of state.enemy.special_abilities) {
        // Kraken: Tidal Crush - every 5th turn
        if (ability.name === 'Tidal Crush') {
          const currentTurn = state.turnNumber || 0;
          if (currentTurn > 0 && currentTurn % 5 === 0) {
            addLog('🌊 Tidal Crush: The ocean\'s full weight crashes down!', 'special');
            
            // Remove all player shield
            if (state.player.shield > 0) {
              dispatch({ type: combatActions.UPDATE_PLAYER, payload: { shield: 0 } });
              addLog('🌊 All your shield is destroyed!', 'enemy');
            }
            
            const previousPlayerHealth = latestStateRef.current.player.health;
            dispatch({ type: combatActions.DAMAGE_PLAYER, payload: { amount: 30 } });
            addLog('🌊 You take 30 crushing damage!', 'enemy');
            
            await new Promise(resolve => setTimeout(resolve, 800));
            if (!isMountedRef.current || isNavigating) {
              dispatch({ type: combatActions.SET_ANIMATING, payload: false });
              return;
            }

            const damageToHealth = previousPlayerHealth - latestStateRef.current.player.health;
            if (damageToHealth > 0 && state.god?.name === 'Anubis' && state.godTalents?.tier4 === 'eternal_balance') {
              checkAnubisEternalBalance(damageToHealth);
            }

            // Check if player died
            if (latestStateRef.current.player.health <= 0) {
              let playerSaved = false;
              const hasPhoenixFeather = state.relics?.some(r => r.name === "Phoenix Feather");
              if (hasPhoenixFeather && !state.godState.phoenixFeatherUsed) {
                dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: 1 } });
                dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { phoenixFeatherUsed: true } });
                addLog('🔥🐦 Phoenix Feather: Restored to 1 HP!', 'special');
                await new Promise(resolve => setTimeout(resolve, 800));
                if (!isMountedRef.current || isNavigating) {
                  dispatch({ type: combatActions.SET_ANIMATING, payload: false });
                  return;
                }
                playerSaved = true;
              } else if (state.god?.name === 'Anubis' && state.godTalents?.tier2 === 'underworld_resilience') {
                const maxCheats = state.godTalents?.tier3 === 'death_defiance' ? 2 : 1;
                const cheatsUsed = state.godState.anubisDeathCheatsUsed || 0;
                if (cheatsUsed < maxCheats) {
                  const restoredHealth = Math.floor(state.player.maxHealth * 0.5);
                  dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: restoredHealth } });
                  dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { anubisDeathCheatsUsed: cheatsUsed + 1 } });
                  if (state.godTalents?.tier3 === 'death_defiance') {
                    addLog(`💀🛡️⚡ Death Defiance: Anubis restored to ${restoredHealth} HP! (${cheatsUsed + 1}/${maxCheats} used)`, 'special');
                  } else {
                    addLog(`💀🛡️ Underworld Resilience: Anubis restored to ${restoredHealth} HP!`, 'special');
                  }
                  await new Promise(resolve => setTimeout(resolve, 500));
                  if (!isMountedRef.current || isNavigating) {
                    dispatch({ type: combatActions.SET_ANIMATING, payload: false });
                    return;
                  }
                  playerSaved = true;
                }
              }
              if (!playerSaved) {
                handleDefeat();
                return;
              }
            }
          }
        }
        // Typhon: Monstrous Breath (every 3 turns)
        else if (state.enemy.name === 'Typhon' && ability.name === 'Monstrous Breath') {
          const currentCounter = state.godState.typhonMonstrousBreathCounter || 0;
          if ((currentCounter + 1) % 3 === 0) { // Check if it's the 3rd turn since last
            addLog('💨 Typhon unleashes a Monstrous Breath!', 'special');
            const previousPlayerHealth = latestStateRef.current.player.health;
            dispatch({ type: combatActions.DAMAGE_PLAYER, payload: { amount: 15 } });
            addLog('🔥 You take 15 damage and 3 Burn!', 'enemy');
            dispatch({ type: combatActions.UPDATE_PLAYER, payload: { burnStacks: (state.player.burnStacks || 0) + 3 } });

            await new Promise(resolve => setTimeout(resolve, 800));
            if (!isMountedRef.current || isNavigating) {
              dispatch({ type: combatActions.SET_ANIMATING, payload: false });
              return;
            }

            const damageToHealth = previousPlayerHealth - latestStateRef.current.player.health;
            if (damageToHealth > 0 && state.god?.name === 'Anubis' && state.godTalents?.tier4 === 'eternal_balance') {
              checkAnubisEternalBalance(damageToHealth);
            }

            if (latestStateRef.current.player.health <= 0) {
              let playerSaved = false;
              const hasPhoenixFeather = state.relics?.some(r => r.name === "Phoenix Feather");
              if (hasPhoenixFeather && !state.godState.phoenixFeatherUsed) {
                dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: 1 } });
                dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { phoenixFeatherUsed: true } });
                addLog('🔥🐦 Phoenix Feather: Restored to 1 HP!', 'special');
                await new Promise(resolve => setTimeout(resolve, 800));
                if (!isMountedRef.current || isNavigating) {
                  dispatch({ type: combatActions.SET_ANIMATING, payload: false });
                  return;
                }
                playerSaved = true;
              } else if (state.god?.name === 'Anubis' && state.godTalents?.tier2 === 'underworld_resilience') {
                const maxCheats = state.godTalents?.tier3 === 'death_defiance' ? 2 : 1;
                const cheatsUsed = state.godState.anubisDeathCheatsUsed || 0;
                if (cheatsUsed < maxCheats) {
                  const restoredHealth = Math.floor(state.player.maxHealth * 0.5);
                  dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: restoredHealth } });
                  dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { anubisDeathCheatsUsed: cheatsUsed + 1 } });
                  if (state.godTalents?.tier3 === 'death_defiance') {
                    addLog(`💀🛡️⚡ Death Defiance: Anubis restored to ${restoredHealth} HP! (${cheatsUsed + 1}/${maxCheats} used)`, 'special');
                  } else {
                    addLog(`💀🛡️ Underworld Resilience: Anubis restored to ${restoredHealth} HP!`, 'special');
                  }
                  await new Promise(resolve => setTimeout(resolve, 500));
                  if (!isMountedRef.current || isNavigating) {
                    dispatch({ type: combatActions.SET_ANIMATING, payload: false });
                    return;
                  }
                  playerSaved = true;
                }
              }
              if (!playerSaved) {
                handleDefeat();
                return;
              }
            }
          }
        }
        // Typhon: Terrifying Roar (every 4 turns)
        else if (state.enemy.name === 'Typhon' && ability.name === 'Terrifying Roar') {
          const currentCounter = state.godState.typhonTerrifyingRoarCounter || 0;
          if ((currentCounter + 1) % 4 === 0) { // Check if it's the 4th turn since last
            addLog('👹 Typhon lets out a Terrifying Roar!', 'special');
            // Discard 1 random card
            if (state.deck.hand.length > 0) {
                const randomCardIndex = Math.floor(Math.random() * state.deck.hand.length);
                const discardedCard = state.deck.hand[randomCardIndex];
                dispatch({ type: combatActions.DISCARD_CARD, payload: { card: discardedCard } });
                addLog(`🫨 You discarded ${discardedCard.name}!`, 'enemy');
            }
            const previousPlayerHealth = latestStateRef.current.player.health;
            dispatch({ type: combatActions.DAMAGE_PLAYER, payload: { amount: 10 } });
            addLog('💥 You take 10 damage from the shockwave!', 'enemy');

            await new Promise(resolve => setTimeout(resolve, 800));
            if (!isMountedRef.current || isNavigating) {
              dispatch({ type: combatActions.SET_ANIMATING, payload: false });
              return;
            }
            
            const damageToHealth = previousPlayerHealth - latestStateRef.current.player.health;
            if (damageToHealth > 0 && state.god?.name === 'Anubis' && state.godTalents?.tier4 === 'eternal_balance') {
              checkAnubisEternalBalance(damageToHealth);
            }

            if (latestStateRef.current.player.health <= 0) {
              let playerSaved = false; // Player save logic
              const hasPhoenixFeather = state.relics?.some(r => r.name === "Phoenix Feather");
              if (hasPhoenixFeather && !state.godState.phoenixFeatherUsed) {
                dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: 1 } });
                dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { phoenixFeatherUsed: true } });
                addLog('🔥🐦 Phoenix Feather: Restored to 1 HP!', 'special');
                await new Promise(resolve => setTimeout(resolve, 800));
                if (!isMountedRef.current || isNavigating) {
                  dispatch({ type: combatActions.SET_ANIMATING, payload: false });
                  return;
                }
                playerSaved = true;
              } else if (state.god?.name === 'Anubis' && state.godTalents?.tier2 === 'underworld_resilience') {
                const maxCheats = state.godTalents?.tier3 === 'death_defiance' ? 2 : 1;
                const cheatsUsed = state.godState.anubisDeathCheatsUsed || 0;
                if (cheatsUsed < maxCheats) {
                  const restoredHealth = Math.floor(state.player.maxHealth * 0.5);
                  dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: restoredHealth } });
                  dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { anubisDeathCheatsUsed: cheatsUsed + 1 } });
                  if (state.godTalents?.tier3 === 'death_defiance') {
                    addLog(`💀🛡️⚡ Death Defiance: Anubis restored to ${restoredHealth} HP! (${cheatsUsed + 1}/${maxCheats} used)`, 'special');
                  } else {
                    addLog(`💀🛡️ Underworld Resilience: Anubis restored to ${restoredHealth} HP!`, 'special');
                  }
                  await new Promise(resolve => setTimeout(resolve, 500));
                  if (!isMountedRef.current || isNavigating) {
                    dispatch({ type: combatActions.SET_ANIMATING, payload: false });
                    return;
                  }
                  playerSaved = true;
                }
              }
              if (!playerSaved) {
                handleDefeat();
                return;
              }
            }
          }
        }
        // Hydra of Lerna: Regenerate Head (every 2 turns)
        else if (state.enemy.name === 'Hydra of Lerna' && ability.name === 'Regenerate Head') {
          const currentCounter = state.godState.hydraRegenerateHeadCounter || 0;
          if ((currentCounter + 1) % 2 === 0) { // Check if it's the 2nd turn since last
            addLog('🐍 Hydra regenerates a head!', 'special');
            dispatch({ type: combatActions.HEAL_ENEMY, payload: { amount: 10 } });
            dispatch({ type: combatActions.GAIN_ENEMY_SHIELD, payload: { amount: 5 } });
            addLog('💚 Hydra heals for 10 HP and gains 5 Shield!', 'buff');
            await new Promise(resolve => setTimeout(resolve, 800));
            if (!isMountedRef.current || isNavigating) {
              dispatch({ type: combatActions.SET_ANIMATING, payload: false });
              return;
            }
          }
        }
        // Hydra of Lerna: Acidic Spit (every 3 turns)
        else if (state.enemy.name === 'Hydra of Lerna' && ability.name === 'Acidic Spit') {
          const currentCounter = state.godState.hydraAcidicSpitCounter || 0;
          if ((currentCounter + 1) % 3 === 0) { // Check if it's the 3rd turn since last
            addLog('🧪 Hydra spits corrosive acid!', 'special');
            const previousPlayerHealth = latestStateRef.current.player.health;
            dispatch({ type: combatActions.DAMAGE_PLAYER, payload: { amount: 8 } });
            addLog('☠️ You take 8 damage and 2 Poison!', 'enemy');
            dispatch({ type: combatActions.UPDATE_PLAYER, payload: { poisonStacks: (state.player.poisonStacks || 0) + 2 } });

            await new Promise(resolve => setTimeout(resolve, 800));
            if (!isMountedRef.current || isNavigating) {
              dispatch({ type: combatActions.SET_ANIMATING, payload: false });
              return;
            }

            const damageToHealth = previousPlayerHealth - latestStateRef.current.player.health;
            if (damageToHealth > 0 && state.god?.name === 'Anubis' && state.godTalents?.tier4 === 'eternal_balance') {
              checkAnubisEternalBalance(damageToHealth);
            }

            if (latestStateRef.current.player.health <= 0) {
              let playerSaved = false; // Player save logic
              const hasPhoenixFeather = state.relics?.some(r => r.name === "Phoenix Feather");
              if (hasPhoenixFeather && !state.godState.phoenixFeatherUsed) {
                dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: 1 } });
                dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { phoenixFeatherUsed: true } });
                addLog('🔥🐦 Phoenix Feather: Restored to 1 HP!', 'special');
                await new Promise(resolve => setTimeout(resolve, 800));
                if (!isMountedRef.current || isNavigating) {
                  dispatch({ type: combatActions.SET_ANIMATING, payload: false });
                  return;
                }
                playerSaved = true;
              } else if (state.god?.name === 'Anubis' && state.godTalents?.tier2 === 'underworld_resilience') {
                const maxCheats = state.godTalents?.tier3 === 'death_defiance' ? 2 : 1;
                const cheatsUsed = state.godState.anubisDeathCheatsUsed || 0;
                if (cheatsUsed < maxCheats) {
                  const restoredHealth = Math.floor(state.player.maxHealth * 0.5);
                  dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: restoredHealth } });
                  dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { anubisDeathCheatsUsed: cheatsUsed + 1 } });
                  if (state.godTalents?.tier3 === 'death_defiance') {
                    addLog(`💀🛡️⚡ Death Defiance: Anubis restored to ${restoredHealth} HP! (${cheatsUsed + 1}/${maxCheats} used)`, 'special');
                  } else {
                    addLog(`💀🛡️ Underworld Resilience: Anubis restored to ${restoredHealth} HP!`, 'special');
                  }
                  await new Promise(resolve => setTimeout(resolve, 500));
                  if (!isMountedRef.current || isNavigating) {
                    dispatch({ type: combatActions.SET_ANIMATING, payload: false });
                    return;
                  }
                  playerSaved = true;
                }
              }
              if (!playerSaved) {
                handleDefeat();
                return;
              }
            }
          }
        }
      }
    }

    // Calculate enemy attack damage
    let attackDamage = state.enemy.nextAttack;
    console.log('[endTurn] Base enemy attack:', attackDamage);

    // Check for Confused - chance to skip attack entirely
    if (state.enemy.confusedStacks > 0) {
      const missChance = Math.min(0.5 * state.enemy.confusedStacks, 0.95); // 50% per stack, max 95%
      if (Math.random() < missChance) {
        addLog(`🌀 ${state.enemy.name} is too confused to attack!`, 'buff');
        
        // Reduce confused stacks
        dispatch({
          type: combatActions.UPDATE_ENEMY,
          payload: { confusedStacks: Math.max(0, state.enemy.confusedStacks - 1) }
        });
        
        await new Promise(resolve => setTimeout(resolve, 800));
        if (!isMountedRef.current || isNavigating) {
          dispatch({ type: combatActions.SET_ANIMATING, payload: false });
          return;
        }
        
        // Skip attack entirely, go to next turn
        startNewTurn();
        return;
      } else {
        addLog(`${state.enemy.name} powers through confusion!`, 'enemy');
        // Reduce confused stacks even if attack goes through
        dispatch({
          type: combatActions.UPDATE_ENEMY,
          payload: { confusedStacks: Math.max(0, state.enemy.confusedStacks - 1) }
        });
      }
    }

    // Apply stun reduction
    if (enemyWasStunnedThisTurn) {
      attackDamage = Math.floor(attackDamage * 0.5);
      console.log('[endTurn] Stun applied - damage reduced to:', attackDamage);
    }

    if (state.enemy.affixes?.some(a => a.effect === 'enraged')) {
      attackDamage += 5;
      addLog('💢 Enemy is Enraged: +5 attack damage!', 'enemy');
    }

    if (state.enemy.affixes?.some(a => a.effect === 'legendary_enraged')) {
      attackDamage += 10;
      addLog('💢💢 Enemy is Legendary Enraged: +10 attack damage!', 'enemy');
    }

    if (state.god?.name === 'Loki') {
      if (state.godTalents?.tier3 === 'god_of_mischief') {
        attackDamage = Math.max(0, attackDamage - 7);
        dispatch({ type: combatActions.GAIN_SHIELD, payload: { amount: 3 } });
        addLog('😈👑 Loki God of Mischief: Reduced enemy damage by 7 and gained 3 Shield!', 'buff');
      } else if (state.godTalents?.tier2 === 'master_of_death') {
        attackDamage = Math.max(0, attackDamage - 5);
        addLog('😈✨ Loki Master Deceiver: Reduced enemy damage by 5!', 'buff');
      } else if (state.godTalents?.tier1 === 'tricksters_guile') {
        attackDamage = Math.max(0, attackDamage - 3);
        addLog('😈 Loki Trickster\'s Guile: Reduced enemy damage by 3!', 'buff');
      }
    }

    console.log('[endTurn] Final enemy attack damage:', attackDamage);

    let previousPlayerHealth = state.player.health;
    let previousPlayerShield = state.player.shield;
    let hadShield = state.player.shield > 0;

    dispatch({ type: combatActions.DAMAGE_PLAYER, payload: { amount: attackDamage } });
    addLog(`${state.enemy.name} attacks for ${attackDamage} damage!`, 'enemy');
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!isMountedRef.current || isNavigating) {
      dispatch({ type: combatActions.SET_ANIMATING, payload: false });
      return;
    }

    const damageToHealth = previousPlayerHealth - latestStateRef.current.player.health;
    if (damageToHealth > 0 && state.god?.name === 'Anubis' && state.godTalents?.tier4 === 'eternal_balance') {
      checkAnubisEternalBalance(damageToHealth);
    }

    // Kraken: Abyssal Grip - 20% chance to steal 1 energy on attack
    if (state.enemy.isBoss && state.enemy.special_abilities) {
      const abyssalGrip = state.enemy.special_abilities.find(a => a.name === 'Abyssal Grip');
      if (abyssalGrip && Math.random() < 0.2) {
        if (state.player.energy > 0) {
          dispatch({ type: combatActions.UPDATE_PLAYER, payload: { energy: Math.max(0, state.player.energy - 1) } });
          addLog('💧 Abyssal Grip: The Kraken steals 1 Energy!', 'enemy');
          await new Promise(resolve => setTimeout(resolve, 400));
          if (!isMountedRef.current || isNavigating) {
            dispatch({ type: combatActions.SET_ANIMATING, payload: false });
            return;
          }
        }
      }
    }

    const hasSpikedShield = state.relics?.some(r => r.name === "Spiked Shield");
    if (hasSpikedShield && attackDamage > 0) {
      const reflectedDamage = Math.floor(attackDamage * 0.3);
      await new Promise(resolve => setTimeout(resolve, 400));
      if (!isMountedRef.current || isNavigating) {
        dispatch({ type: combatActions.SET_ANIMATING, payload: false });
        return;
      }
      dispatch({ type: combatActions.DAMAGE_ENEMY, payload: { amount: reflectedDamage } });
      addLog(`🛡️⚔️ Spiked Shield: Reflected ${reflectedDamage} damage back!`, 'buff');

      if (latestStateRef.current.enemy.health <= 0) {
        await new Promise(resolve => setTimeout(resolve, 400));
        if (!isMountedRef.current || isNavigating) {
          dispatch({ type: combatActions.SET_ANIMATING, payload: false });
          return;
        }
        handleVictoryAndProgressRun();
        return;
      }
    }

    if (state.god?.name === 'Susanoo' && staticHandlers.Susanoo && staticHandlers.Susanoo.onDamageTaken && attackDamage > 0) {
      try {
        await new Promise(resolve => setTimeout(resolve, 200));
        if (!isMountedRef.current || isNavigating) {
          dispatch({ type: combatActions.SET_ANIMATING, payload: false });
          return;
        }
        staticHandlers.Susanoo.onDamageTaken({
          state: latestStateRef.current,
          dispatch,
          addLog,
          amount: attackDamage
        });
      } catch (e) {
          console.error('[endTurn] Error in Susanoo onDamageTaken handler (enemy attack):', e);
      }
    }

    if (state.enemy.affixes?.some(a => a.effect === 'vampiric')) {
      const healAmount = Math.floor(attackDamage * 0.5);
      dispatch({ type: combatActions.UPDATE_ENEMY, payload: { health: Math.min(state.enemy.maxHealth, state.enemy.health + healAmount) } });
      addLog(`🧛 Enemy Vampiric: Healed ${healAmount} HP!`, 'enemy');
      await new Promise(resolve => setTimeout(resolve, 200));
      if (!isMountedRef.current || isNavigating) {
        dispatch({ type: combatActions.SET_ANIMATING, payload: false });
        return;
      }
    }

    if (state.enemy.affixes?.some(a => a.effect === 'legendary_vampiric')) {
      const healAmount = attackDamage;
      dispatch({ type: combatActions.UPDATE_ENEMY, payload: { health: Math.min(state.enemy.maxHealth, state.enemy.health + healAmount) } });
      addLog(`🧛🧛 Enemy Legendary Vampiric: Healed ${healAmount} HP!`, 'enemy');
      await new Promise(resolve => setTimeout(resolve, 200));
      if (!isMountedRef.current || isNavigating) {
        dispatch({ type: combatActions.SET_ANIMATING, payload: false });
        return;
      }
    }

    if (latestStateRef.current.player.health <= 0) {
      let playerSaved = false;

      if (state.god?.name === 'Anubis' && state.godTalents?.tier2 === 'underworld_resilience') {
        const maxCheats = state.godTalents?.tier3 === 'death_defiance' ? 2 : 1;
        const cheatsUsed = state.godState.anubisDeathCheatsUsed || 0;

        if (cheatsUsed < maxCheats) {
          const restoredHealth = Math.floor(state.player.maxHealth * 0.5);
          dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: restoredHealth } });
          dispatch({
            type: combatActions.UPDATE_GOD_STATE,
            payload: { anubisDeathCheatsUsed: cheatsUsed + 1 }
          });

          if (state.godTalents?.tier3 === 'death_defiance') {
            addLog(`💀🛡️⚡ Death Defiance: Anubis restored to ${restoredHealth} HP! (${cheatsUsed + 1}/${maxCheats} used)`, 'special');
          } else {
            addLog(`💀🛡️ Underworld Resilience: Anubis restored to ${restoredHealth} HP!`, 'special');
          }
          await new Promise(resolve => setTimeout(resolve, 500));
          if (!isMountedRef.current || isNavigating) {
            dispatch({ type: combatActions.SET_ANIMATING, payload: false });
            return;
          }
          playerSaved = true;
        }
      }

      if (!playerSaved) {
        const hasPhoenixFeather = state.relics?.some(r => r.name === "Phoenix Feather");
        if (hasPhoenixFeather && !state.godState.phoenixFeatherUsed) {
          dispatch({ type: combatActions.UPDATE_PLAYER, payload: { health: 1 } });
          dispatch({ type: combatActions.UPDATE_GOD_STATE, payload: { phoenixFeatherUsed: true } });
          addLog('🔥🐦 Phoenix Feather: Restored to 1 HP!', 'special');
          await new Promise(resolve => setTimeout(resolve, 800));
          if (!isMountedRef.current || isNavigating) {
            dispatch({ type: combatActions.SET_ANIMATING, payload: false });
            return;
          }
          playerSaved = true;
        }
      }

      if (!playerSaved) {
        console.log('[endTurn] Player defeated!');
        handleDefeat();
        return;
      }
    }

    const actualDamageToPlayerHealth = previousPlayerHealth - latestStateRef.current.player.health;
    const actualDamageToPlayerShield = latestStateRef.current.player.shield - previousPlayerShield; // Corrected
    const playerTookAnyDamage = actualDamageToPlayerHealth > 0 || actualDamageToPlayerShield < 0;

    if (state.god?.name === 'Baron Samedi' && state.godTalents?.tier3 === 'spirit_vengeance') {
      if (playerTookAnyDamage) {
        const poisonStacks = state.godTalents?.tier3 === 'voodoo_master' ? 3 : 1;
        dispatch({
          type: combatActions.UPDATE_ENEMY,
          payload: { poisonStacks: (state.enemy.poisonStacks || 0) + poisonStacks }
        });
        addLog(`👻💀 Baron Samedi Spirit Vengeance: Applied ${poisonStacks} Poison!`, 'debuff');
        await new Promise(resolve => setTimeout(resolve, 200));
        if (!isMountedRef.current || isNavigating) {
          dispatch({ type: combatActions.SET_ANIMATING, payload: false });
          return;
        }
      }
    }

    if (state.god?.name === 'Athena' && state.godTalents?.tier3 === 'divine_retribution') {
      if (hadShield) {
        await new Promise(resolve => setTimeout(resolve, 400));
        if (!isMountedRef.current || isNavigating) {
          dispatch({ type: combatActions.SET_ANIMATING, payload: false });
          return;
        }
        dispatch({ type: combatActions.DAMAGE_ENEMY, payload: { amount: 5 } });
        addLog('⚡🛡️ Athena Divine Retribution: Dealt 5 damage back!', 'buff');

        if (latestStateRef.current.enemy.health <= 0) {
          await new Promise(resolve => setTimeout(resolve, 400));
          if (!isMountedRef.current || isNavigating) {
            dispatch({ type: combatActions.SET_ANIMATING, payload: false });
            return;
          }
          handleVictoryAndProgressRun();
          return;
        }
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    if (!isMountedRef.current || isNavigating) {
      dispatch({ type: combatActions.SET_ANIMATING, payload: false });
      return;
    }

    // Update boss-specific counters for the next turn
    if (state.enemy.isBoss) {
      if (state.enemy.name === 'Typhon') {
        dispatch({
          type: combatActions.UPDATE_GOD_STATE,
          payload: {
            typhonMonstrousBreathCounter: ((state.godState.typhonMonstrousBreathCounter || 0) + 1),
            typhonTerrifyingRoarCounter: ((state.godState.typhonTerrifyingRoarCounter || 0) + 1),
          }
        });
      } else if (state.enemy.name === 'Hydra of Lerna') {
        dispatch({
          type: combatActions.UPDATE_GOD_STATE,
          payload: {
            hydraRegenerateHeadCounter: ((state.godState.hydraRegenerateHeadCounter || 0) + 1),
            hydraAcidicSpitCounter: ((state.godState.hydraAcidicSpitCounter || 0) + 1),
          }
        });
      }
    }

    startNewTurn();
    dispatch({ type: combatActions.SET_ANIMATING, payload: false }); // Unblock UI at very end of end turn logic
  }, [state, isPlayerTurn, addLog, startNewTurn, staticHandlers, handleVictoryAndProgressRun, handleDefeat, dispatch, latestStateRef, isMountedRef, isNavigating, checkAnubisEternalBalance]);

  const handleCardSelected = useCallback(async (card) => {
    console.log('=== CARD SELECTED ===');
    console.log('[handleCardSelected] Card:', card.name);

    if (isNavigating) {
      console.log('[handleCardSelected] Already navigating away, ignoring card selection save');
      if (isMountedRef.current) setShowCardModal(false);
      return;
    }
    
    // Ensure the card has an ID before adding to deck
    const cardWithId = { ...card, id: card.id || crypto.randomUUID() };

    dispatch({ type: combatActions.ADD_CARD_TO_DECK, payload: { card: cardWithId } });
    if (isMountedRef.current) setShowCardModal(false);

    const allCards = [...state.deck.hand, ...state.deck.drawPile, ...state.deck.discardPile, cardWithId];

    const updateData = {
      victories: state.victories,
      status: 'in_progress',
      run_data: {
        deck: allCards,
        relics: state.relics,
        player_health: state.player.health,
        max_player_health: state.player.maxHealth,
        necromancy_stacks: state.godState.necromancyStacks,
        cthulhu_madness: state.godState.cthulhuMadness,
        cthulhu_next_attack_bonus: state.godState.cthulhuNextAttackBonus,
        thor_press_the_advantage_counter: state.godState.thorPressTheAdvantageCounter,
        thor_press_the_advantage_ready: state.godState.thorPressTheAdvantageReady,
        shiva_last_card_type: state.godState.shivaLastCardType,
        shiva_dance_of_annihilation_active: state.godState.shivaDanceOfAnnihilationActive, // Save Shiva Dance of Annihilation state
        ra_next_damage_bonus: state.godState.raNextDamageBonus,
        baron_samedi_first_attack_used: state.godState.baronSamediFirstAttackUsed,
        quetzalcoatl_cards_played_this_turn: state.godState.quetzalcoatlCardsPlayedThisTurn,
        loki_cards_played_this_turn: state.godState.loki_cards_played_this_turn,
        loki_chaos_magic_active: state.godState.lokiChaosMagicActive,
        anubis_death_cheats_used: state.godState.anubisDeathCheatsUsed,
        anubis_eternal_balance_stacks: state.godState.anubisEternalBalanceStacks,
        susanoo_cards_played_this_battle: state.godState.susanooCardsPlayedThisBattle,
        susanoo_fury_unbound_bonus: state.godState.susanooFuryUnboundBonus,
        susanoo_wrath_stacks: state.godState.susanooWrathStacks,
        athena_aegis_ascendant_used: state.godState.athenaAegisAscendantUsed,
        athena_aegis_ascendant_turns_remaining: state.godState.athenaAegisAscendantTurnsRemaining,
        ganesha_enlightenment_active: state.godState.ganeshaEnlightenmentActive,
        ganesha_total_charge_stacks: state.godState.ganeshaTotalChargeStacks,
        base_energy: state.player.maxEnergy,
        player_burn_stacks: state.player.burnStacks,
        player_poison_stacks: state.player.poisonStacks,
        last_card_type_played: state.lastCardTypePlayed, // Save last card type played
        baron_samedi_laugh_bonus: state.run.run_data?.baron_samedi_laugh_bonus || false, // Preserve or clear the bonus flag
        typhon_monstrous_breath_counter: state.godState.typhonMonstrousBreathCounter || 0,
        typhon_terrifying_roar_counter: state.godState.typhonTerrifyingRoarCounter || 0,
        hydra_regenerate_head_counter: state.godState.hydraRegenerateHeadCounter || 0,
        hydra_acidic_spit_counter: state.godState.hydra_acidic_spit_counter || 0,
      },
    };

    try {
      await base44.entities.GameRun.update(state.run.id, updateData);
      console.log('[handleCardSelected] Run saved successfully');
      if (isMountedRef.current) {
        navigate(createPageUrl(`RunProgression?runId=${state.run.id}`));
      }
    } catch (error) {
      console.error('[handleCardSelected] Error saving run:', error);
      addLog('Error saving progress', 'error');
    }
  }, [state, navigate, dispatch, addLog, isMountedRef, isNavigating]);

  if (isLoading) { // Changed from isInitialLoad
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-xl text-white">Preparing for battle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-2 md:p-6">
      {/* Divine Rank Modifier HUD */}
      {state.run?.divine_rank > 0 && state.run?.active_modifiers && (
        <ModifierHUD 
          modifiers={state.run.active_modifiers}
          divineRank={state.run.divine_rank}
          rankData={{
            name: state.run.divine_rank >= 10 ? 'Eternal' : 
                  state.run.divine_rank >= 7 ? `Divine ${['I', 'II', 'III'][state.run.divine_rank - 7]}` :
                  state.run.divine_rank >= 4 ? `Demi-God ${['I', 'II', 'III'][state.run.divine_rank - 4]}` :
                  state.run.divine_rank >= 1 ? `Ascendant ${['I', 'II', 'III'][state.run.divine_rank - 1]}` : 'Mortal',
            color: state.run.divine_rank >= 10 ? '#fbbf24' :
                   state.run.divine_rank >= 7 ? '#f59e0b' :
                   state.run.divine_rank >= 4 ? '#8b5cf6' :
                   state.run.divine_rank >= 1 ? '#3b82f6' : '#6b7280',
            glow: state.run.divine_rank >= 10 ? 'rgba(251, 191, 36, 0.8)' :
                  state.run.divine_rank >= 7 ? 'rgba(245, 158, 11, 0.5)' :
                  state.run.divine_rank >= 4 ? 'rgba(139, 92, 246, 0.5)' :
                  state.run.divine_rank >= 1 ? 'rgba(59, 130, 246, 0.5)' : 'rgba(107, 114, 128, 0.3)'
          }}
          blessingAvailable={!state.run?.pantheon_blessing_used && state.run?.active_modifiers?.length > 0}
          onBlessingClick={() => setShowPantheonBlessingModal(true)}
        />
      )}

      {/* Companion HUD */}
      {equippedCompanions.length > 0 && (
        <CompanionHUD 
          companions={equippedCompanions}
          readyStates={companionReadyStates}
        />
      )}

      {/* Companion Bond Modal */}
      <CompanionBondModal
        open={showCompanionBondModal}
        onClose={() => {
          setShowCompanionBondModal(false);
          // Continue to card selection or relic based on CURRENT battle number
          // state.victories is already the NEW count after winning
          const currentVictories = state.victories;
          if (currentVictories === 4 || currentVictories === 8) {
            setShowCardRemovalModal(true);
          } else if (currentVictories === 3 || currentVictories === 6 || currentVictories === 9) {
            setShowRelicModal(true);
          } else {
            setShowCardModal(true);
          }
        }}
        companionIds={equippedCompanions.map(c => c.id)}
        victories={state.victories}
      />

      <PantheonBlessingModal
        open={showPantheonBlessingModal}
        modifiers={state.run?.active_modifiers || []}
        onModifierRemoved={async (modifier) => {
          try {
            // Remove the modifier from active modifiers
            const updatedModifiers = state.run.active_modifiers.filter(m => m.name !== modifier.name);
            
            // Update the run in database
            await base44.entities.GameRun.update(state.run.id, {
              active_modifiers: updatedModifiers,
              pantheon_blessing_used: true
            });
            
            // Update local state
            dispatch({
              type: combatActions.UPDATE_COMBAT_STATE,
              payload: {
                run: {
                  ...state.run,
                  active_modifiers: updatedModifiers,
                  pantheon_blessing_used: true
                }
              }
            });
            
            addLog(`👑✨ Pantheon Blessing: ${modifier.name} has been removed!`, 'special');
            setShowPantheonBlessingModal(false);
          } catch (error) {
            console.error('Failed to apply Pantheon Blessing:', error);
            addLog('Failed to apply blessing', 'error');
          }
        }}
        onCancel={() => setShowPantheonBlessingModal(false)}
      />

      <RelicSelectionModal
        open={showRelicModal}
        onRelicSelected={async (relic) => {
          if (relic) {
            dispatch({ type: combatActions.ADD_RELIC, payload: relic });
            
            // Track relic collection for achievements
            try {
              const user = await base44.auth.me();
              await base44.auth.updateMe({
                total_relics_collected: (user.total_relics_collected || 0) + 1
              });
              console.log('[Combat] Relic collected, total_relics_collected incremented');
            } catch (error) {
              console.error('[Combat] Error tracking relic collection:', error);
            }
          }
          if (isMountedRef.current) setShowRelicModal(false);
          if (isMountedRef.current) setShowCardModal(true); // Changed from setShowCardSelection
        }}
        playerRelics={state.relics}
        currentGod={state.god}
        godTalents={state.godTalents}
      />

      <CardSelectionModal
        open={showCardModal} // Changed from showCardSelection
        onCardSelected={handleCardSelected}
        godCards={state.god?.cards || []}
        currentGod={state.god}
        godTalents={state.godTalents}
        playerRelics={state.relics}
        isWildMode={state.run?.is_wild_mode || false}
      />

      <DeckViewModal
        open={showDeckModal} // Changed from showDeckView
        onClose={() => { if (isMountedRef.current) setShowDeckModal(false); }} // Changed from setShowDeckView
        deck={[...state.deck.hand, ...state.deck.drawPile, ...state.deck.discardPile]}
        godImage={equippedGodArt || state.god?.image}
      />

      <CardRemovalModal
        open={showCardRemovalModal}
        onClose={() => { if (isMountedRef.current) setShowCardRemovalModal(false); }}
        onCardRemoved={(newDeck) => {
          if (!isMountedRef.current) return;
          if (isNavigating) return;

          const shuffled = [...newDeck].sort(() => Math.random() - 0.5);
          dispatch({
            type: combatActions.UPDATE_DECK,
            payload: {
              hand: [],
              drawPile: shuffled,
              discardPile: []
            }
          });

          if (isMountedRef.current) setShowCardRemovalModal(false);

          // After deck edit, show card reward (every battle gets cards)
          if (isMountedRef.current) setShowCardModal(true);
        }}
        onSkip={() => {
          if (!isMountedRef.current) return;
          if (isNavigating) return;
          setShowCardRemovalModal(false);

          // After skipping deck edit, show card reward
          if (isMountedRef.current) setShowCardModal(true);
        }}
        deck={[...state.deck.hand, ...state.deck.drawPile, ...state.deck.discardPile]}
        godImage={equippedGodArt || state.god?.image}
        maxRemovals={4}
      />

      <CardEffectsLegendModal
        open={showLegendModal} // Changed from showCardSelection
        onClose={() => { if (isMountedRef.current) setShowLegendModal(false); }} // Changed from setShowCardEffectsLegend
      />

      <GodAbilitiesModal
        open={showGodAbilitiesModal} // Changed from showGodAbilities
        onClose={() => { if (isMountedRef.current) setShowGodAbilitiesModal(false); }} // Changed from setShowGodAbilities
        god={state.god}
        godTalents={state.godTalents}
      />

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-4">
          <Button
            onClick={handleAbandonRun}
            variant="outline"
            size="sm"
            className="border-red-500 text-red-400 hover:bg-red-500/20 hover:text-red-300"
          >
            Abandon Run
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Player Area */}
          <div className="flex gap-4">
            {/* Deck Visual */}
            <DeckVisual
              deckCount={state.deck.drawPile.length}
              cardBackUrl={currentUser?.equipped_cosmetics?.card_back ? 
                allCosmetics.find(c => c.id === currentUser.equipped_cosmetics.card_back)?.asset_url : null
              }
              onClick={() => setShowDeckModal(true)}
            />

            <PlayerStatus
              health={state.player.health}
              maxHealth={state.player.maxHealth}
              shield={state.player.shield}
              energy={state.player.energy}
              maxEnergy={state.player.maxEnergy}
              burnStacks={state.player.burnStacks}
              poisonStacks={state.player.poisonStacks}
              weakStacks={state.player.weakStacks || 0}
              god={state.god}
              godImage={equippedGodArt || state.god?.image}
              godTalents={state.godTalents}
              godState={state.godState}
              odinRunesUsedThisBattle={state.godState.odinRunesUsedThisBattle}
              onUseOdinRunes={handleOdinRunesOfPower}
              necromancyStacks={state.godState.necromancyStacks}
              damageReflection={state.player.damageReflection}
              relics={state.relics}
              susanooWrathStacks={state.godState.susanooWrathStacks}
              anubisEternalBalanceStacks={state.godState.anubisEternalBalanceStacks}
            />
          </div>
          <EnemyDisplay enemy={state.enemy} damageAnimation={state.damageAnimation} />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Your Hand</h3>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Info
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/95 border-purple-500">
                  <DropdownMenuItem
                    onClick={() => { if (isMountedRef.current) setShowDeckModal(true); }}
                    className="cursor-pointer text-white hover:bg-purple-500/20"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Deck ({state.deck.hand.length + state.deck.drawPile.length + state.deck.discardPile.length})
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-purple-500/30" />
                  <DropdownMenuItem
                    onClick={() => { if (isMountedRef.current) setShowLegendModal(true); }}
                    className="cursor-pointer text-white hover:bg-purple-500/20"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Card Effects Legend
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { if (isMountedRef.current) setShowGodAbilitiesModal(true); }}
                    className="cursor-pointer text-white hover:bg-purple-500/20"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    God Abilities & Talents
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={endTurn}
                disabled={!isPlayerTurn || state.isAnimating}
                className="bg-gradient-to-r from-red-600 to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                End Turn
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            {state.deck.hand.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>No cards in hand. End your turn to draw new cards.</p>
              </div>
            ) : (
              state.deck.hand.map((card, index) => {
                // Create a temporary card object to apply dynamic effects for display purposes
                let cardWithModifiers = { ...card };

                // Apply Fallen Star relic effect - All damage cards gain Energy Return: 1
                const hasFallenStar = state.relics?.some(r => r.name === "Fallen Star");
                if (hasFallenStar && cardWithModifiers.type === 'damage') {
                  cardWithModifiers.energyReturn = (cardWithModifiers.energyReturn || 0) + 1;
                }

                // Apply Quetzalcoatl Serpent's Momentum for display if applicable
                const cardsPlayedSoFar = state.player.cardsPlayedThisTurn || 0;
                if (state.god?.name === 'Quetzalcoatl' && state.godTalents?.tier4 === 'serpents_momentum') {
                  if ((cardsPlayedSoFar + 1) % 3 === 0) {
                    cardWithModifiers.hasSurge = true;
                    // Ensure chargeValue is set before adding stacks if it doesn't exist
                    if (cardWithModifiers.chargeValue === undefined || cardWithModifiers.chargeValue === null) {
                        cardWithModifiers.chargeValue = 1; // Default charge value for display
                    }
                    cardWithModifiers.chargeStacks = (cardWithModifiers.chargeStacks || 0) + 2;
                  }
                }

                // Calculate effective cost for displaying 'disabled' state and checking surge
                let finalCardCost = calculateCardCost(cardWithModifiers, state);

                // Check if this would be the last card for Surge visual indicator
                const surgeActive = cardWithModifiers.hasSurge && wouldBeLastCard(cardWithModifiers, finalCardCost);

                const comboActive = cardWithModifiers.comboType && state.lastCardTypePlayed === cardWithModifiers.comboType;


                return (
                  <BattleCard
                    key={`${card.id}-${index}`}
                    card={cardWithModifiers}
                    onPlay={() => handlePlayCard(card, index)}
                    disabled={state.player.energy < finalCardCost || state.isAnimating}
                    index={index}
                    godImage={equippedGodArt || state.god?.image}
                    comboActive={comboActive}
                    surgeActive={surgeActive}
                    relics={state.relics} // Add relics prop
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
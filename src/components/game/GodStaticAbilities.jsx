

// God Static Abilities - Separated from Talent Tree Logic
// Each god's innate ability that's always active

export const createStaticAbilityHandlers = (godName) => {
  const handlers = {
    Zeus: {
      onDamageCardPlayed: (context) => {
        const { state, dispatch, addLog } = context;
        
        const newCount = state.godState.zeusAttacksPlayed + 1;
        
        dispatch({
          type: 'UPDATE_GOD_STATE',
          payload: { zeusAttacksPlayed: newCount }
        });
        
        if (newCount % 3 === 0) {
          dispatch({
            type: 'UPDATE_PLAYER',
            payload: { energy: state.player.energy + 1 }
          });
          dispatch({
            type: 'UPDATE_ENEMY',
            payload: { isVulnerable: true }
          });
          addLog('⚡ Zeus Conduit of Power: +1 Energy and Enemy Vulnerable!', 'buff');
        }

        // Tier 2: Chain Lightning - After dealing damage 3 times in one turn, deal 10 bonus damage
        if (state.godTalents?.tier2 === 'chain_lightning' && newCount === 3) {
          dispatch({
            type: 'DAMAGE_ENEMY',
            payload: { amount: 10 }
          });
          addLog('⚡⚡ Zeus Chain Lightning: 10 bonus damage!', 'special');
        }
      },
      onTurnEnd: (context) => {
        const { dispatch } = context;
        dispatch({
          type: 'UPDATE_GOD_STATE',
          payload: { zeusAttacksPlayed: 0 }
        });
      }
    },

    Thor: {
      onDamageCardPlayed: (context) => {
        const { state, dispatch, addLog } = context;
        
        const newCount = state.godState.thorDamageCardsPlayed + 1;
        
        dispatch({
            type: 'UPDATE_GOD_STATE',
            payload: { thorDamageCardsPlayed: newCount }
        });
        
        if (newCount % 2 === 0) {
          dispatch({
            type: 'UPDATE_ENEMY',
            payload: { isStunned: true }
          });
          addLog('⚡🔨 Thor Shocking Strike: Enemy Stunned!', 'special');
        }
        
        if (state.godTalents?.tier2 === 'thunder_god' && newCount === 3) {
          dispatch({
            type: 'UPDATE_PLAYER',
            payload: { energy: state.player.energy + 1 }
          });
          addLog('⚡ Thor Thunder God: +1 Energy!', 'buff');
        }
        
        if (state.godTalents?.tier2 === 'press_the_advantage') {
          if (state.godState.thorPressTheAdvantageReady) {
            addLog('💥 Thor Press the Advantage: +5 damage!', 'buff');
            dispatch({
              type: 'UPDATE_GOD_STATE',
              payload: { 
                thorPressTheAdvantageReady: false,
                thorPressTheAdvantageCounter: 0
              }
            });
          } else {
            const newAdvantageCount = (state.godState.thorPressTheAdvantageCounter || 0) + 1;
            if (newAdvantageCount >= 2) {
              dispatch({
                type: 'UPDATE_GOD_STATE',
                payload: { 
                  thorPressTheAdvantageReady: true,
                  thorPressTheAdvantageCounter: newAdvantageCount
                }
              });
              addLog('💥 Thor Press the Advantage: Ready! Next attack +5 damage!', 'buff');
            } else {
              dispatch({
                type: 'UPDATE_GOD_STATE',
                payload: { thorPressTheAdvantageCounter: newAdvantageCount }
              });
            }
          }
        }
        
        if (state.godTalents?.tier3 === 'thunderstrike' && newCount === 3) {
          addLog('⚡⚡⚡ Thor Thunderstrike: TRIPLE DAMAGE!', 'special');
        }
        
        // Tier 4: Mjolnir's Judgment - Every 3rd attack deals 15 damage and restores 1 Energy
        if (state.godTalents?.tier4 === 'mjolnirs_judgment' && newCount % 3 === 0) {
          dispatch({
            type: 'DAMAGE_ENEMY',
            payload: { amount: 15 }
          });
          dispatch({
            type: 'UPDATE_PLAYER',
            payload: { energy: state.player.energy + 1 }
          });
          addLog('🔨⚡ Mjolnir\'s Judgment: Chain Lightning strikes for 15 damage and restores 1 Energy!', 'special');
        }
      },
      calculateDamageBonus: (context) => {
        const { state } = context;
        if (state.godTalents?.tier2 === 'press_the_advantage' && state.godState.thorPressTheAdvantageReady) {
            return 5;
        }
        return 0;
      },
      onTurnEnd: (context) => {
        const { dispatch } = context;
        dispatch({
          type: 'UPDATE_GOD_STATE',
          payload: { 
            thorDamageCardsPlayed: 0,
            thorPressTheAdvantageCounter: 0,
            thorPressTheAdvantageReady: false
          }
        });
      }
    },

    Shiva: {
      onCardPlayed: (context) => {
        const { card, state, dispatch, addLog } = context;

        const newSet = new Set(state.godState.shivaCardTypesPlayed);
        newSet.add(card.type);

        // Payload for godState update
        const godStatePayload = { shivaCardTypesPlayed: newSet };

        // Check and consume Dance of Annihilation effect if active for this card
        if (state.godTalents?.tier4 === 'dance_of_annihilation' && state.godState.shivaDanceOfAnnihilationActive) {
          godStatePayload.shivaDanceOfAnnihilationActive = false; // Consume the effect
          addLog('💃 Dance of Annihilation effect consumed.', 'info');
        }

        dispatch({
          type: 'UPDATE_GOD_STATE',
          payload: godStatePayload
        });

        const hasAllThree = newSet.has('damage') && newSet.has('shield') && newSet.has('heal');
        
        if (hasAllThree) {
          dispatch({
            type: 'UPDATE_TEMP_BUFFS',
            payload: { nextAttackBonus: 8 }
          });
          addLog('💃 Shiva Cosmic Dance: Next attack +8 damage!', 'buff');

          if (state.god && state.god.name === 'Shiva' && state.godTalents && state.godTalents.tier3 === 'cosmic_annihilation') {
            console.log('[Shiva] Cosmic Annihilation triggered! Dealing 15 damage');
            dispatch({
              type: 'DAMAGE_ENEMY',
              payload: { amount: 15 }
            });
            addLog('💥🌌 Shiva Cosmic Annihilation: 15 damage dealt!', 'special');
          }
        }
      },
      onDamageCardPlayed: (context) => {
        const { state, dispatch, addLog } = context;
        
        if (state.tempBuffs.nextAttackBonus > 0) {
          addLog(`💃 Shiva's Destruction: +${state.tempBuffs.nextAttackBonus} damage!`, 'buff');
        }
      },
      onDamageDealt: (context) => {
        const { state, dispatch, addLog } = context;
        
        // Tier 4: Dance of Annihilation - Track damage instances
        if (state.godTalents?.tier4 === 'dance_of_annihilation') {
          const newDamageCount = (state.godState.shivaDamageCountThisTurn || 0) + 1;
          
          dispatch({
            type: 'UPDATE_GOD_STATE',
            payload: { shivaDamageCountThisTurn: newDamageCount }
          });
          
          if (newDamageCount === 5 && !state.godState.shivaDanceOfAnnihilationActive) {
            dispatch({
              type: 'UPDATE_GOD_STATE',
              payload: { shivaDanceOfAnnihilationActive: true }
            });
            addLog('💃🔥 Dance of Annihilation activated! Next card costs 0 and deals double damage!', 'special');
          }
        }
      },
      calculateCostDiscount: (context) => {
        const { state } = context;
        
        // Tier 4: Dance of Annihilation - Free card
        if (state.godTalents?.tier4 === 'dance_of_annihilation' && state.godState.shivaDanceOfAnnihilationActive) {
          return 999; // Make it cost 0
        }
        
        return 0;
      },
      calculateDamageBonus: (context) => {
        const { state } = context;
        
        // Tier 4: Dance of Annihilation - Double damage
        if (state.godTalents?.tier4 === 'dance_of_annihilation' && state.godState.shivaDanceOfAnnihilationActive) {
          return { flat: 0, percent: 100 }; // +100% = double damage
        }
        
        return { flat: 0, percent: 0 };
      },
      onTurnEnd: (context) => {
        const { dispatch } = context;
        dispatch({
          type: 'UPDATE_GOD_STATE',
          payload: { 
            shivaCardTypesPlayed: new Set(),
            shivaDamageCountThisTurn: 0,
            shivaDanceOfAnnihilationActive: false
          }
        });
      }
    },

    Hades: {
      onTurnStart: (context) => {
        const { dispatch, addLog } = context;
        dispatch({
          type: 'DAMAGE_ENEMY',
          payload: { amount: 1 }
        });
        addLog('💀 Hades Underworld Grip: Enemy loses 1 Health!', 'debuff');
      }
    },

    Anubis: {
      onTurnEnd: (context) => {
        const { state, dispatch, addLog } = context;

        // Tier 4: Eternal Balance
        if (state.godTalents?.tier4 === 'eternal_balance') {
          const playerHealthPercent = (state.player.health / state.player.maxHealth) * 100;
          
          if (playerHealthPercent <= 50) {
            dispatch({ type: 'HEAL_PLAYER', payload: { amount: 10 } });
            addLog('⚖️ Anubis Eternal Balance: Below 50% HP, healed 10!', 'buff');
          } else if (playerHealthPercent >= 75) {
            dispatch({ type: 'GAIN_ENERGY', payload: { amount: 1 } });
            addLog('⚖️ Anubis Eternal Balance: Above 75% HP, gained 1 Energy!', 'buff');
          }
        }
      }
    },

    'Baron Samedi': {
      onBurnApplied: (context) => {
        const { card, state, dispatch, addLog } = context;
        if (card.applyBurn > 0) {
          dispatch({
            type: 'HEAL_PLAYER',
            payload: { amount: 3 }
          });
          addLog('🎭 Baron Samedi Deal with Death: +3 Health!', 'buff');
        }
      }
    },

    Ra: {
      onPlayerHealed: (context) => {
        const { dispatch, addLog } = context;
        dispatch({
          type: 'UPDATE_GOD_STATE',
          payload: { raNextDamageBonus: 6 }
        });
        addLog('☀️ Ra Solar Ascension: Next attack +6 damage!', 'buff');
      },
      onTurnStart: (context) => {
        const { state, dispatch, addLog } = context;
        
        // Tier 4: Solar Ascension - Every 4 turns, unleash Solar Blast
        if (state.godTalents?.tier4 === 'solar_ascension') {
          if (state.turnNumber % 4 === 0 && state.turnNumber > 0) {
            dispatch({
              type: 'UPDATE_ENEMY',
              payload: { burnStacks: (state.enemy.burnStacks || 0) + 20 }
            });
            dispatch({
              type: 'HEAL_PLAYER',
              payload: { amount: 15 }
            });
            addLog('☀️👑 Solar Ascension: Solar Blast unleashed! 20 Burn applied and 15 HP restored!', 'special');
          }
        }
      },
      onTurnEnd: (context) => {
        const { dispatch } = context;
        dispatch({
          type: 'UPDATE_GOD_STATE',
          payload: { raNextDamageBonus: 0 }
        });
      }
    },

    Cthulhu: {
      onCardDiscarded: (context) => {
        const { dispatch, addLog } = context;

        console.log('[Cthulhu Static] onCardDiscarded called');

        dispatch({
          type: 'UPDATE_ENEMY',
          payload: { isVulnerable: true }
        });
        addLog('🐙 Cthulhu Eldritch Touch: Enemy is Vulnerable!', 'special');
      }
    },

    Loki: {
      onCardPlayed: (context) => {
        const { card, state, dispatch, addLog } = context;

        // Tier 4: Trickster's Reversal - Gain 1 Energy when playing a 0-cost card
        if (state.godTalents?.tier4 === 'tricksters_reversal') {
          if (card.originalCost === 0) {
            dispatch({ type: 'GAIN_ENERGY', payload: { amount: 1 } });
            addLog('🃏 Loki Trickster\'s Reversal: Gained 1 Energy for playing a 0-cost card!', 'buff');
          }
        }
      },
      calculateCostDiscount: (context) => {
        const { card } = context;
        if (card.lokiDiscount) {
          delete card.lokiDiscount; // Remove the discount after using it
          return 1;
        }
        return 0;
      }
    },

    Quetzalcoatl: {
      onCardDiscarded: (context) => {
        const { dispatch, addLog } = context;
        dispatch({
          type: 'GAIN_SHIELD',
          payload: { amount: 1 }
        });
        addLog('🪶 Quetzalcoatl Wind Blessing: Gained 1 Shield from discarding!', 'buff');
      },
      onCardDrawn: (context) => {
        const { card, addLog } = context;
        
        if (!card || typeof card !== 'object') {
          console.warn('[GodStaticAbilities] Quetzalcoatl onCardDrawn called with invalid card:', card);
          return;
        }
        
        if (Math.random() < 0.1) {
          card.quetzalcoatlDiscount = true;
          addLog('🪶 Quetzalcoatl Feathered Serpent: Card costs 1 less!', 'buff');
        }
      },
      calculateCostDiscount: (context) => {
        const { card } = context;
        if (card && card.quetzalcoatlDiscount) {
          delete card.quetzalcoatlDiscount;
          return 1;
        }
        return 0;
      }
    },

    Athena: {
      onGainShield: (context) => {
        const { state, dispatch, addLog } = context;
        
        // Tier 4: Aegis Ascendant - Shield > HP triggers powerful buff
        if (state.godTalents?.tier4 === 'aegis_ascendant' && !state.godState.athenaAegisAscendantUsed) {
          if (state.player.shield > state.player.health) {
            dispatch({
              type: 'UPDATE_GOD_STATE',
              payload: { 
                athenaAegisAscendantUsed: true,
                athenaAegisAscendantTurnsRemaining: 2
              }
            });
            dispatch({
              type: 'UPDATE_TEMP_BUFFS',
              payload: { 
                damageReflection: 25
              }
            });
            addLog('🛡️👑 Aegis Ascendant activated! +50% damage and 25% reflection for 2 turns!', 'special');
          }
        }
      },
      
      onDamageDealt: (context) => {
        const { damage, state, dispatch, addLog } = context;
        if (damage > 0) {
          const shieldGain = Math.floor(damage * 0.5);
          if (shieldGain > 0) {
            dispatch({
              type: 'GAIN_SHIELD',
              payload: { amount: shieldGain }
            });
            addLog(`🛡️ Athena Aegis of Valor: Gained ${shieldGain} Shield from damage!`, 'buff');
          }
        }
      },
      
      onTurnStart: (context) => {
        const { state, dispatch, addLog } = context;
        
        // Tier 1: Shield Readiness - Start each battle with 8 Shield
        if (state.godTalents?.tier1 === 'shield_readiness' && state.turnNumber === 1) {
          dispatch({
            type: 'GAIN_SHIELD',
            payload: { amount: 8 }
          });
          addLog('🛡️ Athena Shield Readiness: +8 Shield!', 'buff');
        }
        
        // Tier 2: Insight's Edge - Negate first enemy attack
        if (state.godTalents?.tier2 === 'insight_edge' && !state.godState.athenaInsightUsed && state.turnNumber === 1) {
          dispatch({
            type: 'UPDATE_GOD_STATE',
            payload: { athenaInsightUsed: true }
          });
          dispatch({
            type: 'UPDATE_ENEMY',
            payload: { nextAttack: 0 }
          });
          addLog('👁️ Athena Insight\'s Edge: First enemy attack negated!', 'buff');
        }
        
        // Tier 3: Tactical Supremacy - Draw 2 cards if 15+ Shield
        if (state.godTalents?.tier3 === 'tactical_supremacy' && state.player.shield >= 15) {
          dispatch({
            type: 'DRAW_CARDS',
            payload: { count: 2 }
          });
          addLog('📜 Athena Tactical Supremacy: +2 cards!', 'buff');
        }
        
        // Tier 4: Aegis Ascendant - Decrement turns remaining
        if (state.godState.athenaAegisAscendantTurnsRemaining > 0) {
          const newTurns = state.godState.athenaAegisAscendantTurnsRemaining - 1;
          dispatch({
            type: 'UPDATE_GOD_STATE',
            payload: { athenaAegisAscendantTurnsRemaining: newTurns }
          });
          
          if (newTurns === 0) {
            dispatch({
              type: 'UPDATE_TEMP_BUFFS',
              payload: { damageReflection: 0 }
            });
            addLog('Aegis Ascendant effect ended.', 'info');
          }
        }
      },
      
      calculateDamageBonus: (context) => {
        const { state } = context;
        let bonus = 0;
        
        // Tier 1: Calculated Strike - +3 damage when 4+ Shield
        if (state.godTalents?.tier1 === 'calculated_strike' && state.player.shield >= 4) {
          bonus += 3;
        }
        
        // Tier 2: Aggressive Defense - +3 damage when 10+ Shield
        if (state.godTalents?.tier2 === 'aggressive_defense' && state.player.shield >= 10) {
          bonus += 3;
        }
        
        // Tier 4: Aegis Ascendant - +50% damage when active
        if (state.godState.athenaAegisAscendantTurnsRemaining > 0) {
          // This will be applied as a percentage in combat
          return { 
            flat: bonus, 
            percent: 50 
          };
        }
        
        return { flat: bonus, percent: 0 };
      },
      
      onEnemyAttack: (context) => {
        const { state, dispatch, addLog, damage } = context;
        
        // Tier 3: Divine Retribution - Deal 5 damage back when attacked with Shield
        if (state.godTalents?.tier3 === 'divine_retribution' && state.player.shield > 0 && damage > 0) {
          dispatch({
            type: 'DAMAGE_ENEMY',
            payload: { amount: 5 }
          });
          addLog('⚡🛡️ Athena Divine Retribution: 5 damage reflected!', 'buff');
        }
      }
    },

    Odin: {
      onTurnStart: (context) => {
        const { dispatch, addLog } = context;
        console.log('[GodStaticAbilities] Odin onTurnStart called');
        
        dispatch({
          type: 'DRAW_CARDS',
          payload: { count: 1 }
        });
        addLog('📖 Odin Allfather\'s Wisdom: Draw +1 card', 'buff');
      }
    },

    Susanoo: {
      onDamageTaken: (context) => {
        const { state, dispatch, addLog, amount } = context;
        
        console.log('[Susanoo] onDamageTaken called with amount:', amount);
        
        if (amount > 0) {
          const newWrathStacks = (state.godState?.susanooWrathStacks || 0) + 1;
          
          dispatch({
            type: 'UPDATE_GOD_STATE',
            payload: { 
              susanooWrathStacks: newWrathStacks,
              susanooTookDamageLastTurn: true
            }
          });
          
          dispatch({
            type: 'GAIN_SHIELD',
            payload: { amount: 2 }
          });
          
          addLog(`⚡🌀 Susanoo Wrath of the Storm: +2 Attack (${newWrathStacks * 2} total) and +2 Shield!`, 'buff');
          
          if (state.godTalents?.tier1 === 'rising_tempest') {
            dispatch({
              type: 'UPDATE_TEMP_BUFFS',
              payload: { nextAttackBonus: (state.tempBuffs?.nextAttackBonus || 0) + 5 }
            });
            addLog('⚡ Rising Tempest: Next attack +5 damage!', 'buff');
          }
        }
      },

      onTurnStart: (context) => {
        const { state, dispatch, addLog } = context;
        
        if (state.godTalents?.tier3 === 'storm_sovereign' && state.godState.susanooTookDamageLastTurn) {
          dispatch({ type: 'GAIN_ENERGY', payload: { amount: 1 } });
          addLog('⚡ Susanoo Storm Sovereign: +1 Energy!', 'buff');
        }
        
        dispatch({
          type: 'UPDATE_GOD_STATE',
          payload: { susanooTookDamageLastTurn: false }
        });
      }
    },

    "The Morrígan": {
      // Static Ability: Phantom's Grace - When enemy is below 50% HP, gain +5 damage and +5 healing
      calculateDamageBonus: (context) => {
        const { state } = context;
        if (!state.enemy) return { flat: 0, percent: 0 };
        
        const enemyHpPercent = (state.enemy.health / state.enemy.maxHealth) * 100;
        if (enemyHpPercent < 50) {
          return { flat: 5, percent: 0 };
        }
        return { flat: 0, percent: 0 };
      },
      
      calculateHealingBonus: (context) => {
        const { state } = context;
        if (!state.enemy) return 0;
        
        const enemyHpPercent = (state.enemy.health / state.enemy.maxHealth) * 100;
        if (enemyHpPercent < 50) {
          return 5;
        }
        return 0;
      },
      
      onBattleStart: (context) => {
        const { state, dispatch, addLog } = context;
        
        if (state.godTalents?.tier1 === 'blood_feather') {
          if (state.player.health <= state.player.maxHealth * 0.75) {
            dispatch({ type: 'GAIN_ENERGY', payload: { amount: 1 } });
            addLog('🐦 The Morrígan Blood Feather: +1 Energy!', 'buff');
          }
        }
      },

      onTurnStart: (context) => {
        const { state, dispatch, addLog } = context;
        
        if (state.godTalents?.tier1 === 'crows_hunger') {
          if (state.turnNumber % 3 === 0) {
            dispatch({ type: 'HEAL_PLAYER', payload: { amount: 5 } });
            addLog('🖤 The Morrígan Crow\'s Hunger: +5 HP!', 'buff');
          }
        }

        if (state.godTalents?.tier3 === 'prophecy_fulfilled') {
          if (state.player.shield >= 50) {
            dispatch({
              type: 'UPDATE_GOD_STATE',
              payload: { morriganDoubleAttackThisTurn: true }
            });
            addLog('🌑 The Morrígan Prophecy Fulfilled: Double Attack this turn!', 'buff');
          }
        }

        if (state.godTalents?.tier3 === 'queen_of_fate' && !state.godState.morriganQueenOfFateTriggered) {
          const enemyHpPercent = (state.enemy.health / state.enemy.maxHealth) * 100;
          if (enemyHpPercent < 30) {
            dispatch({
              type: 'DAMAGE_ENEMY',
              payload: { amount: 20 }
            });
            dispatch({
              type: 'UPDATE_ENEMY',
              payload: { isStunned: true, stunnedStacks: 3 } 
            });
            dispatch({
              type: 'UPDATE_GOD_STATE',
              payload: { morriganQueenOfFateTriggered: true }
            });
            addLog('🦅 The Morrígan Queen of Fate: 20 damage and Weak (3)!', 'buff');
          }
        }
      },

      onTurnEnd: (context) => {
        const { state, dispatch, addLog } = context;
        
        if (state.godTalents?.tier2 === 'foresight') {
          if (state.player.energy >= 2) {
            dispatch({ type: 'GAIN_SHIELD', payload: { amount: 6 } });
            dispatch({ type: 'DRAW_CARDS', payload: { count: 1 } });
            addLog('👁️ The Morrígan Foresight: +6 Shield and +1 card!', 'buff');
          }
        }

        dispatch({
          type: 'UPDATE_GOD_STATE',
          payload: { morriganDoubleAttackThisTurn: false }
        });
      }
    },

    Lucifer: {
      onTurnStart: (context) => {
        const { state, dispatch, addLog } = context;
        
        if (state.player.health <= state.player.maxHealth * 0.25) {
          dispatch({ type: 'HEAL_PLAYER', payload: { amount: 5 } });
          addLog('😈 Lucifer Fallen Radiance: +5 HP!', 'buff');
        }

        if (state.godTalents?.tier2 === 'hells_embrace' && state.enemy.burnStacks > 0) {
          dispatch({ type: 'HEAL_PLAYER', payload: { amount: 10 } });
          addLog('🌟 Lucifer Hell\'s Embrace: +10 HP from enemy burn!', 'buff');
        }
      },

      onDamageTaken: (context) => {
        const { state, dispatch, addLog } = context;
        
        if (state.godTalents?.tier1 === 'prideful_endurance' && !state.godState.luciferPridefulEnduranceUsed) {
          if (state.player.health <= state.player.maxHealth * 0.25) {
            dispatch({ type: 'GAIN_SHIELD', payload: { amount: 10 } });
            dispatch({
              type: 'UPDATE_GOD_STATE',
              payload: { luciferPridefulEnduranceUsed: true }
            });
            addLog('💀 Lucifer Prideful Endurance: +10 Shield!', 'buff');
          }
        }
      }
    },

    Ganesha: {
      onTurnStart: (context) => {
        const { state, dispatch, addLog } = context;
        
        // Tier 1: Sacred Stillness - Start each battle with +1 Energy
        if (state.godTalents?.tier1 === 'sacred_stillness' && state.turnNumber === 1) {
          dispatch({ type: 'GAIN_ENERGY', payload: { amount: 1 } });
          addLog('🕯️ Ganesha Sacred Stillness: +1 Energy!', 'buff');
        }
        
        // Tier 3: Inner Radiance - Gain +1 Energy every 4th turn permanently
        if (state.godTalents?.tier3 === 'inner_radiance' && state.turnNumber > 0 && state.turnNumber % 4 === 0) {
          const newMaxEnergy = state.player.maxEnergy + 1;
          dispatch({ 
            type: 'UPDATE_PLAYER', 
            payload: { 
              maxEnergy: newMaxEnergy,
              energy: state.player.energy + 1
            } 
          });
          addLog('🔥 Ganesha Inner Radiance: Permanent +1 Max Energy!', 'special');
        }
      },
      
      onCardDrawn: (context) => {
        const { dispatch, addLog, state } = context;
        
        // Tier 1: Gentle Wisdom - Heal +3 HP whenever you draw a card
        if (state.godTalents?.tier1 === 'gentle_wisdom') {
          dispatch({ type: 'HEAL_PLAYER', payload: { amount: 3 } });
          addLog('🐘 Ganesha Gentle Wisdom: +3 HP from drawing!', 'buff');
        }
      },
      
      onPlayerHealed: (context) => {
        const { state, dispatch, addLog, amount } = context;
        
        // Tier 3: Divine Harmony - When you Heal, gain Shield equal to 50% of healing
        if (state.godTalents?.tier3 === 'divine_harmony' && amount > 0) {
          const shieldGain = Math.floor(amount * 0.5);
          if (shieldGain > 0) {
            dispatch({ type: 'GAIN_SHIELD', payload: { amount: shieldGain } });
            addLog(`💫 Ganesha Divine Harmony: +${shieldGain} Shield from healing!`, 'buff');
          }
        }
      },
      
      onCardPlayed: (context) => {
        const { state, dispatch, addLog } = context;
        
        // Tier 2: Clear Insight - Every 3rd card costs 0
        const cardsPlayedThisTurn = (state.godState?.ganeshaCardsPlayedThisTurn || 0) + 1;
        
        dispatch({
          type: 'UPDATE_GOD_STATE',
          payload: { ganeshaCardsPlayedThisTurn: cardsPlayedThisTurn }
        });
        
        if (state.godTalents?.tier2 === 'clear_insight' && cardsPlayedThisTurn === 3) {
          addLog('📜 Ganesha Clear Insight: Next card costs 0!', 'buff');
        }
      },
      
      calculateCostDiscount: (context) => {
        const { state, card } = context;
        let discount = 0;
        
        // Tier 2: Clear Insight - Every 3rd card costs 0
        if (state.godTalents?.tier2 === 'clear_insight') {
          const nextCardNumber = (state.godState?.ganeshaCardsPlayedThisTurn || 0) + 1;
          if (nextCardNumber % 3 === 0) {
            discount = 999; // Make it free
          }
        }
        
        // Tier 2: Blessed Path - Heal cards cost 1 less if you have Shield
        if (state.godTalents?.tier2 === 'blessed_path' && card.type === 'heal' && state.player.shield > 0) {
          discount += 1;
        }
        
        // Tier 4: Path of Enlightenment - All cards cost 1 less after 50 charge stacks
        if (state.godTalents?.tier4 === 'path_of_enlightenment' && state.godState?.ganeshaEnlightenmentActive) {
          discount += 1;
        }
        
        return discount;
      },
      
      onTurnEnd: (context) => {
        const { dispatch } = context;
        dispatch({
          type: 'UPDATE_GOD_STATE',
          payload: { ganeshaCardsPlayedThisTurn: 0 }
        });
      }
    }
  };

  return handlers[godName] || {};
};

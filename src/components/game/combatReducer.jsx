
// Combat State Reducer - Centralizes all game state management

export const initialCombatState = {
  god: null,
  run: null,
  victories: 0,
  godTalents: { tier1: null, tier2: null, tier3: null, tier4: null },
  relics: [],
  player: {
    health: 60,
    maxHealth: 60,
    shield: 0,
    energy: 3,
    maxEnergy: 3,
    damageReflection: 0,
    burnStacks: 0,
    poisonStacks: 0,
    weakStacks: 0,
    cardsPlayedThisTurn: 0,
  },
  enemy: {
    name: 'Training Dummy',
    health: 50,
    maxHealth: 50,
    shield: 0,
    nextAttack: 5,
    burnStacks: 0,
    poisonStacks: 0,
    isVulnerable: false,
    isStunned: false,
    confusedStacks: 0,
  },
  deck: {
    hand: [],
    drawPile: [],
    discardPile: [],
  },
  turnNumber: 0,
  godState: {
    necromancyStacks: 0,
    cthulhuMadness: 0,
    cthulhuNextAttackBonus: 0,
    zeusAttacksPlayed: 0,
    thorDamageCardsPlayed: 0,
    thorFirstAttackUsed: false,
    thorPressTheAdvantageCounter: 0,
    thorPressTheAdvantageReady: false,
    shivaCardTypesPlayed: new Set(),
    shivaLastCardType: null,
    shivaCardsPlayedThisTurn: 0,
    shivaDamageCardsPlayed: 0,
    shivaShieldCardsPlayed: 0,
    shivaHealCardsPlayed: 0,
    shivaDrawCardsPlayed: 0,
    shivaNextDamageDiscount: false,
    shivaNextShieldDiscount: false,
    shivaNextHealDiscount: false,
    shivaNextDrawDiscount: false,
    shivaDamageCountThisTurn: 0,
    shivaDanceOfAnnihilationActive: false,
    raNextDamageBonus: 0,
    odinRunesUsedThisBattle: 0,
    athenaInsightUsed: false,
    athenaAegisAscendantUsed: false,
    athenaAegisAscendantTurnsRemaining: 0,
    baronSamediFirstAttackUsed: false,
    quetzalcoatlCardsPlayedThisTurn: 0,
    lokiCardsPlayedThisTurn: 0,
    lokiChaosMagicActive: false,
    anubisDeathCheatsUsed: 0,
    anubisEternalBalanceDamageTaken: 0,
    anubisEternalBalanceStacks: 0,
    susanooCardsPlayedThisBattle: 0,
    susanooFuryUnboundBonus: 0,
    susanooCardsPlayedThisTurn: 0,
    susanooWrathStacks: 0,
    susanooTookDamageLastTurn: false,
    morriganQueenOfFateTriggered: false,
    morriganDoubleAttackThisTurn: false,
    luciferPridefulEnduranceUsed: false,
    ganeshaCardsPlayedThisTurn: 0,
    ganeshaTotalChargeStacks: 0,
    ganeshaEnlightenmentActive: false,
    ganeshaChargeCardsGainedBonusThisTurn: false,
    phoenixFeatherUsed: false,
    typhonMonstrousBreathCounter: 0,
    typhonTerrifyingRoarCounter: 0,
    hydraRegenerateHeadCounter: 0,
    hydra_acidic_spit_counter: 0,
  },
  tempBuffs: {
    nextAttackBonus: 0,
    nextAttackBonusPercent: 0,
    nextCardDiscount: 0,
    thunderStoneUsed: false,
    leechActive: false,
  },
  turnPhase: 'player',
  isProcessing: false,
  damageAnimation: false,
  battleLog: [],
  lastCardTypePlayed: null,
};

export const combatActions = {
  INIT_COMBAT: 'INIT_COMBAT',
  START_TURN: 'START_TURN',
  END_TURN: 'END_TURN',
  PLAY_CARD: 'PLAY_CARD',
  DRAW_CARDS: 'DRAW_CARDS',
  DISCARD_CARD: 'DISCARD_CARD',
  USE_ENERGY: 'USE_ENERGY',
  DAMAGE_ENEMY: 'DAMAGE_ENEMY',
  HEAL_ENEMY: 'HEAL_ENEMY',
  GAIN_ENEMY_SHIELD: 'GAIN_ENEMY_SHIELD',
  DAMAGE_PLAYER: 'DAMAGE_PLAYER',
  HEAL_PLAYER: 'HEAL_PLAYER',
  GAIN_SHIELD: 'GAIN_SHIELD',
  UPDATE_PLAYER: 'UPDATE_PLAYER',
  UPDATE_ENEMY: 'UPDATE_ENEMY',
  UPDATE_DECK: 'UPDATE_DECK',
  UPDATE_GOD_STATE: 'UPDATE_GOD_STATE',
  UPDATE_TEMP_BUFFS: 'UPDATE_TEMP_BUFFS',
  UPDATE_VICTORIES: 'UPDATE_VICTORIES',
  ADD_CARD_TO_DECK: 'ADD_CARD_TO_DECK',
  ADD_RELIC: 'ADD_RELIC',
  SET_PROCESSING: 'SET_PROCESSING',
  ADD_BATTLE_LOG: 'ADD_BATTLE_LOG',
  UPDATE_COMBAT_STATE: 'UPDATE_COMBAT_STATE',
  TRIGGER_DAMAGE_ANIMATION: 'TRIGGER_DAMAGE_ANIMATION',
};

export function combatReducer(state, action) {
  switch (action.type) {
    case combatActions.INIT_COMBAT:
      return {
        ...initialCombatState,
        ...action.payload,
        turnPhase: 'player',
        isProcessing: false,
      };

    case combatActions.START_TURN:
      return {
        ...state,
        turnPhase: 'player',
        turnNumber: state.turnNumber + 1,
        player: {
          ...state.player,
          energy: state.player.maxEnergy,
          damageReflection: 0,
        },
        tempBuffs: {
          ...state.tempBuffs,
          nextCardDiscount: 0,
        },
        damageAnimation: false,
      };

    case combatActions.END_TURN:
      return {
        ...state,
        turnPhase: 'enemy',
        enemy: {
          ...state.enemy,
          isVulnerable: false,
        },
      };

    case combatActions.PLAY_CARD: {
      const { card, index } = action.payload;
      const newHand = state.deck.hand.filter((_, i) => i !== index);
      return {
        ...state,
        deck: {
          ...state.deck,
          hand: newHand,
          discardPile: [...state.deck.discardPile, card],
        },
      };
    }

    case combatActions.DRAW_CARDS: {
      const { count } = action.payload;
      let drawPile = [...state.deck.drawPile];
      let discardPile = [...state.deck.discardPile];
      let hand = [...state.deck.hand];

      for (let i = 0; i < count; i++) {
        if (drawPile.length === 0) {
          if (discardPile.length === 0) break;
          drawPile = [...discardPile].sort(() => Math.random() - 0.5);
          discardPile = [];
        }
        const drawnCard = drawPile.shift();
        if (drawnCard) hand.push(drawnCard);
      }

      return {
        ...state,
        deck: { hand, drawPile, discardPile },
      };
    }

    case combatActions.DISCARD_CARD: {
      const { card } = action.payload;
      const newHand = state.deck.hand.filter(c => c !== card);
      return {
        ...state,
        deck: {
          ...state.deck,
          hand: newHand,
          discardPile: [...state.deck.discardPile, card],
        },
      };
    }

    case combatActions.USE_ENERGY:
      return {
        ...state,
        player: {
          ...state.player,
          energy: Math.max(0, state.player.energy - action.payload.amount),
        },
      };

    case combatActions.DAMAGE_ENEMY: {
      const damage = action.payload.amount;
      let newHealth = Math.max(0, state.enemy.health - damage);
      
      // Apply leech if active
      if (state.tempBuffs.leechActive && damage > 0) {
        const healAmount = damage;
        const newPlayerHealth = Math.min(state.player.maxHealth, state.player.health + healAmount);
        return {
          ...state,
          enemy: {
            ...state.enemy,
            health: newHealth,
          },
          player: {
            ...state.player,
            health: newPlayerHealth,
          },
        };
      }
      
      return {
        ...state,
        enemy: {
          ...state.enemy,
          health: newHealth,
        },
      };
    }

    case combatActions.HEAL_ENEMY:
      return {
        ...state,
        enemy: {
          ...state.enemy,
          health: Math.min(state.enemy.maxHealth, state.enemy.health + action.payload.amount),
        },
      };

    case combatActions.GAIN_ENEMY_SHIELD:
      return {
        ...state,
        enemy: {
          ...state.enemy,
          shield: state.enemy.shield + action.payload.amount,
        },
      };

    case combatActions.DAMAGE_PLAYER: {
      const incomingDamage = action.payload.amount;
      let remainingDamage = incomingDamage;
      let newShield = state.player.shield;
      let newHealth = state.player.health;

      if (newShield > 0) {
        if (remainingDamage <= newShield) {
          newShield -= remainingDamage;
          remainingDamage = 0;
        } else {
          remainingDamage -= newShield;
          newShield = 0;
        }
      }

      if (remainingDamage > 0) {
        newHealth = Math.max(0, newHealth - remainingDamage);
      }

      return {
        ...state,
        player: {
          ...state.player,
          health: newHealth,
          shield: newShield,
        },
      };
    }

    case combatActions.HEAL_PLAYER:
      return {
        ...state,
        player: {
          ...state.player,
          health: Math.min(state.player.maxHealth, state.player.health + action.payload.amount),
        },
      };

    case combatActions.GAIN_SHIELD:
      return {
        ...state,
        player: {
          ...state.player,
          shield: state.player.shield + action.payload.amount,
        },
      };

    case combatActions.UPDATE_PLAYER:
      return {
        ...state,
        player: {
          ...state.player,
          ...action.payload,
        },
      };

    case combatActions.UPDATE_ENEMY:
      return {
        ...state,
        enemy: {
          ...state.enemy,
          ...action.payload,
        },
      };

    case combatActions.UPDATE_DECK:
      return {
        ...state,
        deck: {
          ...state.deck,
          ...action.payload,
        },
      };

    case combatActions.UPDATE_GOD_STATE:
      return {
        ...state,
        godState: {
          ...state.godState,
          ...action.payload,
        },
      };

    case combatActions.UPDATE_TEMP_BUFFS:
      return {
        ...state,
        tempBuffs: {
          ...state.tempBuffs,
          ...action.payload,
        },
      };

    case combatActions.UPDATE_VICTORIES:
      return {
        ...state,
        victories: action.payload,
      };

    case combatActions.ADD_CARD_TO_DECK: {
      const { card } = action.payload;
      return {
        ...state,
        deck: {
          ...state.deck,
          drawPile: [...state.deck.drawPile, card],
        },
      };
    }

    case combatActions.ADD_RELIC:
      return {
        ...state,
        relics: [...state.relics, action.payload],
      };

    case combatActions.SET_PROCESSING:
      return {
        ...state,
        isProcessing: action.payload,
      };

    case combatActions.ADD_BATTLE_LOG:
      return {
        ...state,
        battleLog: [...state.battleLog, action.payload],
      };

    case combatActions.UPDATE_COMBAT_STATE:
      return {
        ...state,
        ...action.payload,
      };

    case combatActions.TRIGGER_DAMAGE_ANIMATION:
      return {
        ...state,
        damageAnimation: true,
      };

    default:
      return state;
  }
}

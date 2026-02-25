
// Combat Helper Functions - Pure functions for game logic

// Cache for enemy data to avoid rate limits
let enemyCache = {
  enemies: null,
  elites: null,
  bosses: null,
  encounters: null,
  lastFetch: 0,
  cacheDuration: 60000, // 1 minute cache
};

export function applyDivineModifiers(baseValue, modifierType, activeModifiers = []) {
  let finalValue = baseValue;
  
  if (!activeModifiers || activeModifiers.length === 0) {
    return finalValue;
  }
  
  for (const modifier of activeModifiers) {
    if (modifier.effect_type === modifierType) {
      const effectValue = modifier.effect_value;
      
      // Handle multipliers (values > 1 or < 1)
      if (modifierType.includes('_mult')) {
        finalValue = Math.floor(finalValue * effectValue);
      }
      // Handle additions/subtractions
      else {
        finalValue += effectValue;
      }
    }
  }
  
  return Math.max(0, finalValue);
}

export function calculateDamage(baseDamage, state, card = null) {
  let damage = baseDamage;
  
  // God state bonuses
  if (state.godState.raNextDamageBonus) {
    damage += state.godState.raNextDamageBonus;
  }
  if (state.godState.cthulhuNextAttackBonus) {
    damage += state.godState.cthulhuNextAttackBonus;
  }
  
  // Temp buffs
  if (state.tempBuffs.nextAttackBonus) {
    damage += state.tempBuffs.nextAttackBonus;
  }

  // Temp buffs - Percentage bonus
  if (state.tempBuffs.nextAttackBonusPercent) {
    const percentBonus = Math.floor(damage * (state.tempBuffs.nextAttackBonusPercent / 100));
    damage += percentBonus;
  }

  // Thor Tier 1: Mjolnir Strike - First attack each turn deals +5 damage
  if (state.god?.name === 'Thor' && state.godTalents?.tier1 === 'mjolnir_strike') {
    if (!state.godState.thorFirstAttackUsed) {
      damage += 5;
    }
  }
  
  // Thor Tier 2: Press the Advantage - After 2 damage cards, next damage card gets +5
  if (state.god?.name === 'Thor' && state.godTalents?.tier2 === 'press_the_advantage') {
    if (state.godState.thorPressTheAdvantageReady) {
      damage += 5;
    }
  }
  
  // Thor Tier 3: Thunderstrike - 3rd attack card deals triple damage
  if (state.god?.name === 'Thor' && state.godTalents?.tier3 === 'thunderstrike') {
    if (state.godState.thorDamageCardsPlayed === 2) {
      damage = damage * 3;
    }
  }
  
  // Thor Tier 3: Godly Strength - All attack cards deal +3 damage
  if (state.god?.name === 'Thor' && state.godTalents?.tier3 === 'godly_strength') {
    damage += 3;
  }

  // Thor Tier 3: Booming Presence - While enemy is stunned, damage cards deal +4 damage
  if (state.god?.name === 'Thor' && state.godTalents?.tier3 === 'booming_presence') {
    if (state.enemy?.isStunned) {
      damage += 4;
    }
  }

  // Thor Tier 4: Mjolnir's Judgment - When a Stunned or Vulnerable enemy is attacked, deal an additional +10 damage.
  if (state.god?.name === 'Thor' && state.godTalents?.tier4 === 'mjolnirs_judgment') {
    if (state.enemy?.isStunned || state.enemy?.isVulnerable) {
      damage += 10;
    }
  }
  
  // Athena Tier 1: Calculated Strike - +3 damage when 4+ shield
  if (state.god?.name === 'Athena' && state.godTalents?.tier1 === 'calculated_strike') {
    if (state.player.shield >= 4) {
      damage += 3;
    }
  }
  
  // Athena Tier 2: Aggressive Defense - +3 damage when 10+ shield
  if (state.god?.name === 'Athena' && state.godTalents?.tier2 === 'aggressive_defense') {
    if (state.player.shield >= 10) {
      damage += 3;
    }
  }
  
  // Athena Tier 4: Aegis Ascendant - +50% damage when active
  if (state.god?.name === 'Athena' && state.godState.athenaAegisAscendantTurnsRemaining > 0) {
    damage = Math.floor(damage * 1.5);
  }
  
  // Ra Tier 1: Desert Heat - All attack cards deal +3 damage
  if (state.god?.name === 'Ra' && state.godTalents?.tier1 === 'desert_heat') {
    damage += 3;
  }
  
  // Shiva Tier 1: Destructive Power - All attack cards deal +4 damage
  if (state.god?.name === 'Shiva' && state.godTalents?.tier1 === 'destructive_power') {
    damage += 4;
  }
  
  // Shiva Tier 3: Destroyer Form - All attack cards deal +5 damage
  if (state.god?.name === 'Shiva' && state.godTalents?.tier3 === 'destroyer_form') {
    damage += 5;
  }
  
  // Enemy vulnerable
  if (state.enemy?.isVulnerable) {
    damage = Math.floor(damage * 1.5);
  }
  
  // Relics
  // Hammer of Might: +2/+4 damage
  if (state.relics && Array.isArray(state.relics)) {
    const hammerOfMight = state.relics.filter(r => r.name === 'Hammer of Might' || r.name === 'Hammer of Might+');
    const empoweredHammer = state.relics.some(r => r.name === 'Hammer of Might+');
    damage += hammerOfMight.length * (empoweredHammer ? 4 : 2); // Empowered: +4 instead of +2
    
    // Ares' Blessing
    const hasAresBlessing = state.relics?.some(r => r.name === "Ares' Blessing" || r.name === "Ares' Blessing+");
    const empoweredAres = state.relics?.some(r => r.name === "Ares' Blessing+");
    if (hasAresBlessing) {
      damage += empoweredAres ? 5 : 3; // Empowered: +5 instead of +3
    }
    
    // Cursed Idol
    const hasCursedIdol = state.relics?.some(r => r.name === "Cursed Idol" || r.name === "Cursed Idol+");
    const empoweredCursed = state.relics?.some(r => r.name === "Cursed Idol+");
    if (hasCursedIdol) {
      damage += empoweredCursed ? 4 : 2; // Empowered: +4 instead of +2
    }
    
    // Blood Stone: +8/+12 damage (high risk, high reward)
    const hasBloodStone = state.relics?.some(r => r.name === "Blood Stone" || r.name === "Blood Stone+");
    const empoweredBloodStone = state.relics?.some(r => r.name === "Blood Stone+");
    if (hasBloodStone) {
      damage += empoweredBloodStone ? 12 : 8; // Empowered: +12 instead of +8
    }
    
    // Tome of Knowledge: +2/+4 damage per card in hand (empowered)
    const hasTomeOfKnowledge = state.relics.some(r => r.name === 'Tome of Knowledge' || r.name === 'Tome of Knowledge+');
    const empoweredTome = state.relics.some(r => r.name === 'Tome of Knowledge+');
    if (hasTomeOfKnowledge && state.deck?.hand) {
      const cardsInHand = state.deck.hand.length;
      damage += cardsInHand * (empoweredTome ? 4 : 2); // Empowered: +4 per card
    }
  }
  
  return Math.max(0, damage);
}

export function calculateShield(baseShield, state) {
  let shield = baseShield;

  // Apply Divine Modifier penalties
  const activeModifiers = state.run?.active_modifiers || [];
  const shieldPenaltyModifier = activeModifiers.find(m => m.effect_type === 'shield_penalty');
  if (shieldPenaltyModifier) {
    shield = Math.floor(shield * shieldPenaltyModifier.effect_value);
  }

  // Susanoo: Tempest Guard bonus
  const card = state.currentCard;
  if (card?.susanoo_tempest_bonus && state.player.health <= state.player.maxHealth * 0.5) {
    shield = 25;
  }
  
  // Athena Tier 3: Aegis Mastery - Shield cards grant 50% more
  if (state.god?.name === 'Athena' && state.godTalents?.tier3 === 'aegis_mastery') {
    shield = Math.floor(shield * 1.5);
  }
  
  // Relics - add safety check for undefined relics
  if (state.relics && Array.isArray(state.relics)) {
    // Fortified Armor: +3/+5 shield
    const fortifiedArmor = state.relics.filter(r => r.name === 'Fortified Armor' || r.name === 'Fortified Armor+');
    const empoweredArmor = state.relics.some(r => r.name === 'Fortified Armor+');
    shield += fortifiedArmor.length * (empoweredArmor ? 5 : 3); // Empowered: +5 instead of +3
    
    // Iron Heart: All shield cards gain +3/+6 (empowered)
    const hasIronHeart = state.relics.some(r => r.name === 'Iron Heart' || r.name === 'Iron Heart+');
    const empoweredIronHeart = state.relics.some(r => r.name === 'Iron Heart+');
    if (hasIronHeart) {
      shield += empoweredIronHeart ? 6 : 3; // Empowered: +6 instead of +3
    }
    
    // Tome of Knowledge: +2/+4 shield per card in hand (empowered)
    const hasTomeOfKnowledge = state.relics.some(r => r.name === 'Tome of Knowledge' || r.name === 'Tome of Knowledge+');
    const empoweredTome = state.relics.some(r => r.name === 'Tome of Knowledge+');
    if (hasTomeOfKnowledge && state.deck?.hand) {
      const cardsInHand = state.deck.hand.length;
      shield += cardsInHand * (empoweredTome ? 4 : 2); // Empowered: +4 per card
    }
  }
  
  return Math.max(0, shield);
}

export function calculateHealing(baseHealing, state) {
  let healing = baseHealing;
  
  // Apply Divine Modifier penalties
  const activeModifiers = state.run?.active_modifiers || [];
  const healingPenaltyModifier = activeModifiers.find(m => m.effect_type === 'healing_penalty');
  if (healingPenaltyModifier) {
    healing = Math.floor(healing * healingPenaltyModifier.effect_value);
  }
  
  // The Morrígan: Phantom's Grace - +5 healing when enemy below 50% HP
  if (state.god?.name === "The Morrígan" && state.enemy) {
    const enemyHpPercent = (state.enemy.health / state.enemy.maxHealth) * 100;
    if (enemyHpPercent < 50) {
      healing += 5;
    }
  }
  
  // Phoenix Feather: +2/+4 healing
  const phoenixFeather = state.relics.filter(r => r.name === 'Phoenix Feather' || r.name === 'Phoenix Feather+');
  const empoweredPhoenix = state.relics.some(r => r.name === 'Phoenix Feather+');
  healing += phoenixFeather.length * (empoweredPhoenix ? 4 : 2); // Empowered: +4 instead of +2
  
  // Healing Chalice: All heal cards gain +3/+6 (empowered)
  const hasHealingChalice = state.relics.some(r => r.name === 'Healing Chalice' || r.name === 'Healing Chalice+');
  const empoweredChalice = state.relics.some(r => r.name === 'Healing Chalice+');
  if (hasHealingChalice) {
    healing += empoweredChalice ? 6 : 3; // Empowered: +6 instead of +3
  }
  
  // Tome of Knowledge: +2/+4 healing per card in hand (empowered)
  const hasTomeOfKnowledge = state.relics.some(r => r.name === 'Tome of Knowledge' || r.name === 'Tome of Knowledge+');
  const empoweredTome = state.relics.some(r => r.name === 'Tome of Knowledge+');
  if (hasTomeOfKnowledge && state.deck?.hand) {
    const cardsInHand = state.deck.hand.length;
    healing += cardsInHand * (empoweredTome ? 4 : 2); // Empowered: +4 per card
  }
  
  return Math.max(0, healing);
}

export function calculateCardCost(card, state) {
  let cost = card.cost || 0;
  
  // Apply Divine Modifier increases
  const activeModifiers = state.run?.active_modifiers || [];
  const costIncreaseModifier = activeModifiers.find(m => m.effect_type === 'card_cost_increase');
  if (costIncreaseModifier) {
    cost += costIncreaseModifier.effect_value;
  }
  
  // Temp buffs
  if (state.tempBuffs.nextCardDiscount) {
    cost -= state.tempBuffs.nextCardDiscount;
  }
  
  // Ra Tier 3: Sun God Ascendant - All cards cost 1 less at full health
  if (state.god?.name === 'Ra' && state.godTalents?.tier3 === 'sun_god_ascendant') {
    if (state.player.health >= state.player.maxHealth) {
      cost -= 1;
    }
  }
  
  // Anubis Tier 2: Scales of Judgment - All cards cost 1 less when below 50% HP
  if (state.god?.name === 'Anubis' && state.godTalents?.tier2 === 'scales_of_judgment') {
    const healthThreshold = state.player.maxHealth * 0.5;
    if (state.player.health <= healthThreshold) {
      cost -= 1;
    }
  }
  
  // Shiva Tier 1: Many Arms - Card costs 1 less if same type as previous
  if (state.god?.name === 'Shiva' && state.godTalents?.tier1 === 'cosmic_dance') {
    if (state.godState.shivaLastCardType === card.type) {
      cost -= 1;
    }
  }
  
  // Athena Tier 2: Shared Wisdom - Shield cards cost 1 less
  if (state.god?.name === 'Athena' && state.godTalents?.tier2 === 'shared_wisdom') {
    if (card.type === 'shield') {
      cost -= 1;
    }
  }

  // Zeus Tier 2: Divine Authority - All damage cards cost 1 less
  if (state.god?.name === 'Zeus' && state.godTalents?.tier2 === 'divine_authority') {
    if (card.type === 'damage') {
      cost -= 1;
    }
  }

  // Zeus Tier 3: Storm Lord - Every 3rd attack card costs 0
  if (state.god?.name === 'Zeus' && state.godTalents?.tier3 === 'storm_lord' && card.type === 'damage') {
    const zeusAttacksPlayed = state.godState?.zeusAttacksPlayed || 0;
    if ((zeusAttacksPlayed + 1) % 3 === 0) {
      cost = 0;
    }
  }

  // Hades Tier 3: Eternal Darkness - All attack cards cost 1 less
  if (state.god?.name === 'Hades' && state.godTalents?.tier3 === 'eternal_darkness') {
    if (card.type === 'damage') {
      cost -= 1;
    }
  }
  
  // God discounts
  if (card.lokiDiscount) {
    cost -= 1;
  }
  if (card.quetzalcoatlDiscount) {
    cost -= 1;
  }
  // Quetzalcoatl Tier 3: Feathered Ascension - Cards cost 1 less
  if (card.featheredAscensionDiscount) {
    cost -= 1;
  }
  
  // Relics
  const philosophersStone = state.relics.some(r => r.name === "Philosopher's Stone");
  if (philosophersStone) {
    cost -= 1;
  }
  
  return Math.max(0, cost);
}

export function calculateBonusEnergy(state) {
  let bonusEnergy = 0;

  // Apply Divine Modifier reductions FIRST
  const activeModifiers = state.run?.active_modifiers || [];
  const energyReductionModifier = activeModifiers.find(m => m.effect_type === 'player_energy_reduction');
  if (energyReductionModifier) {
    bonusEnergy -= energyReductionModifier.effect_value;
  }

  // Relics - check for both "Pure Gold" and "Pure Gold Coin"
  const hasPureGold = state.relics?.some(r => r.name === 'Pure Gold' || r.name === 'Pure Gold Coin');
  if (hasPureGold) {
    bonusEnergy += 1; 
  }
  
  const hasBerserkerHarness = state.relics?.some(r => r.name === "Berserker Harness");
  if (hasBerserkerHarness) {
    bonusEnergy += 2;
  }

  return bonusEnergy;
}

export function processBossAbilities(state, action) {
  if (!state.enemy.isBoss || !state.enemy.special_abilities) {
    return state;
  }

  let newState = { ...state };
  const boss = newState.enemy; // Use newState.enemy to ensure it reflects any prior changes in this turn
  const bossName = boss.name;

  // Process boss-specific abilities
  if (bossName === 'Hydra of Lerna') {
    newState = processHydraAbilities(newState, action);
  } else if (bossName === 'Typhon') {
    newState = processTyphonAbilities(newState, action);
  }

  // Generic boss ability processing for other bosses (not fully implemented in outline, keeping structure)
  boss.special_abilities?.forEach(ability => {
    if (ability.trigger === 'on_turn_start' && action.type === 'END_TURN') { // Assuming END_TURN is when we check for start of next turn abilities
      // Process generic turn start abilities
    } else if (ability.trigger === 'on_turn_end' && action.type === 'END_TURN') {
      // Process generic turn end abilities
    } else if (ability.trigger === 'on_damage_taken' && action.type === 'PLAY_CARD') { // Assuming damage is usually dealt by PLAY_CARD
      // Process generic damage taken abilities
    }
  });

  return newState;
}

function processHydraAbilities(state, action) {
  let newState = { ...state };
  const hydra = newState.enemy; // Reference the current hydra from newState

  // Initialize bossTracking and its specific properties if they don't exist
  if (!newState.bossTracking) {
    newState.bossTracking = {};
  }
  if (!newState.bossTracking.hydraThresholdsCrossed) {
    newState.bossTracking = { ...newState.bossTracking, hydraThresholdsCrossed: [] };
  }
  if (!newState.bossTracking.hydraInitialMaxHealth) {
    newState.bossTracking = { ...newState.bossTracking, hydraInitialMaxHealth: hydra.maxHealth };
  }
  
  // 1. Regenerative Fury - gains +2 attack when losing 25% HP
  // This should trigger after damage is dealt, so checking health when a card is played is appropriate
  if (action.type === 'PLAY_CARD') {
    const maxHP = newState.bossTracking.hydraInitialMaxHealth;
    const currentHP = hydra.health;
    const hpPercent = (currentHP / maxHP) * 100;
    
    const thresholds = [75, 50, 25];
    thresholds.forEach(threshold => {
      if (hpPercent <= threshold && !newState.bossTracking.hydraThresholdsCrossed.includes(threshold)) {
        newState.bossTracking = { 
          ...newState.bossTracking, 
          hydraThresholdsCrossed: [...newState.bossTracking.hydraThresholdsCrossed, threshold] 
        };
        newState.enemy = { ...hydra, attack: hydra.attack + 2 };
        newState.combatLog = [
          ...(newState.combatLog || []),
          { 
            type: 'boss_ability', 
            text: `🐍 Regenerative Fury activated! Hydra gains +2 Attack! (Now ${newState.enemy.attack})`,
            color: 'text-red-400'
          }
        ];
      }
    });
  }

  // 2. Venomous Sustenance - heals 5 HP per turn while player has poison
  if (action.type === 'END_TURN' && (newState.player.statusEffects?.poison || 0) > 0) {
    const healAmount = 5;
    newState.enemy = { ...hydra, health: Math.min(hydra.health + healAmount, hydra.maxHealth) };
    newState.combatLog = [
      ...(newState.combatLog || []),
      { 
        type: 'boss_ability', 
        text: `🐍 Venomous Sustenance! Hydra heals ${healAmount} HP from your poison!`,
        color: 'text-green-400'
      }
    ];
  }

  // 3. Toxic Demise - deals 20 poison on death
  // This needs to be checked after damage calculation when health drops to 0 or below.
  // The trigger 'hydra.health <= 0' implies this is processed after the entity's health changes.
  if (hydra.health <= 0 && !newState.bossTracking.toxicDemiseTriggered) {
    newState.bossTracking = { ...newState.bossTracking, toxicDemiseTriggered: true };
    
    // Assuming player status effects are under newState.player.statusEffects
    const currentPoison = newState.player.statusEffects?.poison || 0;
    newState.player = {
      ...newState.player,
      statusEffects: {
        ...(newState.player.statusEffects || {}),
        poison: currentPoison + 20
      }
    };
    newState.combatLog = [
      ...(newState.combatLog || []),
      { 
        type: 'boss_ability', 
        text: `☠️ Toxic Demise! The Hydra's death poisons you with 20 stacks!`,
        color: 'text-purple-400'
      }
    ];
  }

  return newState;
}

function processTyphonAbilities(state, action) {
  let newState = { ...state };
  const typhon = newState.enemy; // Reference the current typhon from newState
  
  // Initialize bossTracking and its specific properties if they don't exist
  if (!newState.bossTracking) {
    newState.bossTracking = {};
  }
  if (newState.bossTracking.typhonTurnCounter === undefined) {
    newState.bossTracking = { ...newState.bossTracking, typhonTurnCounter: 0 };
  }
  if (newState.bossTracking.volcanicCataclysm === undefined) {
    newState.bossTracking = { ...newState.bossTracking, volcanicCataclysm: 0 };
  }

  // Increment turn counter at end of turn
  if (action.type === 'END_TURN') {
    newState.bossTracking = { ...newState.bossTracking, typhonTurnCounter: newState.bossTracking.typhonTurnCounter + 1 };
    
    // 1. Infernal Tempest - every 3rd turn, apply Burn (10)
    if (newState.bossTracking.typhonTurnCounter % 3 === 0) {
      // Assuming player status effects are under newState.player.statusEffects
      const currentBurn = newState.player.statusEffects?.burn || 0;
      newState.player = {
        ...newState.player,
        statusEffects: {
          ...(newState.player.statusEffects || {}),
          burn: currentBurn + 10
        }
      };
      newState.combatLog = [
        ...(newState.combatLog || []),
        { 
          type: 'boss_ability', 
          text: `🔥 Infernal Tempest! Typhon burns you with searing chaos! (Burn +10)`,
          color: 'text-orange-400'
        }
      ];
    }

    // 2. Volcanic Cataclysm - trigger every 4 turns, lasts 3 turns
    if (newState.bossTracking.typhonTurnCounter % 4 === 0) {
      newState.bossTracking = { ...newState.bossTracking, volcanicCataclysm: 3 };
      newState.combatLog = [
        ...(newState.combatLog || []),
        { 
          type: 'boss_ability', 
          text: `🌩️ Volcanic Cataclysm! Molten ash rains down for 3 turns!`,
          color: 'text-red-400'
        }
      ];
    }

    // Apply Volcanic Cataclysm damage
    if (newState.bossTracking.volcanicCataclysm > 0) {
      const damage = 5;
      newState.player = {
        ...newState.player,
        health: Math.max(0, newState.player.health - damage)
      };
      newState.bossTracking = { ...newState.bossTracking, volcanicCataclysm: newState.bossTracking.volcanicCataclysm - 1 };
      newState.combatLog = [
        ...(newState.combatLog || []),
        { 
          type: 'boss_ability', 
          text: `🌩️ Volcanic ash deals ${damage} damage! (${newState.bossTracking.volcanicCataclysm} turns remaining)`,
          color: 'text-orange-400'
        }
      ];
    }
  }

  // 3. Unchained Chaos - immune to stun
  // This needs to be checked after any action that might attempt to stun Typhon.
  // Assuming 'isStunned' is a direct boolean property on the enemy object.
  if (typhon.isStunned) {
    newState.enemy = { ...typhon, isStunned: false };
    newState.combatLog = [
      ...(newState.combatLog || []),
      { 
        type: 'boss_ability', 
        text: `🗻 Unchained Chaos! Typhon cannot be stunned!`,
        color: 'text-gray-400'
      }
    ];
  }

  return newState;
}

export function checkVictoryCondition(state) {
  return state.enemy && state.enemy.health <= 0;
}

export function checkDefeatCondition(state) {
  return state.player.health <= 0;
}

// Helper to check if cache is still valid
function isCacheValid() {
  return enemyCache.lastFetch > 0 && (Date.now() - enemyCache.lastFetch) < enemyCache.cacheDuration;
}

// Fallback enemy data if network fails completely or returns empty
const FALLBACK_ENEMIES = [
  { id: 'fallback-1', name: 'Shadow Beast', description: 'A mysterious creature from the void', maxHealth: 50, attack: 8, image: '' },
  { id: 'fallback-2', name: 'Ancient Guardian', description: 'A weathered sentinel, slow but powerful', maxHealth: 60, attack: 10, image: '', affixes: [] }, // Added affixes for consistency
  { id: 'fallback-3', name: 'Void Walker', description: 'A being from beyond, ethereal and swift', maxHealth: 45, attack: 7, image: '', affixes: [] } // Added affixes for consistency
];

const FALLBACK_ELITES = [
  { id: 'fallback-elite-1', name: 'Elite Warrior', description: 'A seasoned fighter with enhanced abilities', maxHealth: 80, attack: 12, image: '', affixes: [] },
  { id: 'fallback-elite-2', name: 'Mystic Golem', description: 'A magical construct, resistant to damage', maxHealth: 90, attack: 10, image: '', affixes: [] }
];

const FALLBACK_BOSSES = [
  { id: 'fallback-boss-1', name: 'Ancient Evil', description: 'A terrifying foe, older than time itself', maxHealth: 150, attack: 18, image: '', special_abilities: [] },
  { id: 'fallback-boss-2', name: 'Grand Abomination', description: 'A monstrous being of pure chaos', maxHealth: 160, attack: 17, image: '', special_abilities: [] }
];

// Load all enemy data at once and cache it
async function loadAndCacheEnemyData(base44) {
  if (isCacheValid() && enemyCache.enemies && enemyCache.elites && enemyCache.bosses) {
    console.log('[loadAndCacheEnemyData] Using cached enemy data');
    return {
      enemies: enemyCache.enemies,
      elites: enemyCache.elites,
      bosses: enemyCache.bosses,
      encounters: enemyCache.encounters,
    };
  }

  console.log('[loadAndCacheEnemyData] Fetching fresh enemy data');
  
  let currentEnemies = FALLBACK_ENEMIES;
  let currentElites = FALLBACK_ELITES;
  let currentBosses = FALLBACK_BOSSES;
  let currentEncounters = [];

  // Try to fetch enemies
  try {
    console.log('[loadAndCacheEnemyData] Fetching enemies...');
    const fetched = await base44.entities.Enemy.list();
    if (fetched && fetched.length > 0) {
      currentEnemies = fetched;
    } else if (enemyCache.enemies && enemyCache.enemies.length > 0) {
      currentEnemies = enemyCache.enemies;
      console.log('[loadAndCacheEnemyData] Using cached enemies (API returned empty)');
    } else {
      console.log('[loadAndCacheEnemyData] Using fallback enemies (API returned empty and cache was empty)');
    }
    console.log('[loadAndCacheEnemyData] Enemies loaded:', currentEnemies?.length || 0);
    await new Promise(resolve => setTimeout(resolve, 300));
  } catch (error) {
    console.error('[loadAndCacheEnemyData] Error loading enemies:', error.message);
    if (enemyCache.enemies && enemyCache.enemies.length > 0) {
      currentEnemies = enemyCache.enemies;
      console.log('[loadAndCacheEnemyData] Using cached enemies');
    } else {
      currentEnemies = FALLBACK_ENEMIES; // Ensure currentEnemies always has a value
      console.log('[loadAndCacheEnemyData] Using fallback enemies');
    }
  }

  // Try to fetch elites
  try {
    console.log('[loadAndCacheEnemyData] Fetching elites...');
    const fetched = await base44.entities.EliteEnemy.list();
    if (fetched && fetched.length > 0) {
      currentElites = fetched;
    } else if (enemyCache.elites && enemyCache.elites.length > 0) {
      currentElites = enemyCache.elites;
      console.log('[loadAndCacheEnemyData] Using cached elites (API returned empty)');
    } else {
      console.log('[loadAndCacheEnemyData] Using fallback elites (API returned empty and cache was empty)');
    }
    console.log('[loadAndCacheEnemyData] Elites loaded:', currentElites?.length || 0);
    await new Promise(resolve => setTimeout(resolve, 300));
  } catch (error) {
    console.error('[loadAndCacheEnemyData] Error loading elites:', error.message);
    if (enemyCache.elites && enemyCache.elites.length > 0) {
      currentElites = enemyCache.elites;
      console.log('[loadAndCacheEnemyData] Using cached elites');
    } else {
      currentElites = FALLBACK_ELITES; // Ensure currentElites always has a value
      console.log('[loadAndCacheEnemyData] Using fallback elites');
    }
  }

  // Try to fetch bosses
  try {
    console.log('[loadAndCacheEnemyData] Fetching bosses...');
    const fetched = await base44.entities.Boss.list();
    if (fetched && fetched.length > 0) {
      currentBosses = fetched;
    } else if (enemyCache.bosses && enemyCache.bosses.length > 0) {
      currentBosses = enemyCache.bosses;
      console.log('[loadAndCacheEnemyData] Using cached bosses (API returned empty)');
    } else {
      console.log('[loadAndCacheEnemyData] Using fallback bosses (API returned empty and cache was empty)');
    }
    console.log('[loadAndCacheEnemyData] Bosses loaded:', currentBosses?.length || 0);
    await new Promise(resolve => setTimeout(resolve, 300));
  } catch (error) {
    console.error('[loadAndCacheEnemyData] Error loading bosses:', error.message);
    if (enemyCache.bosses && enemyCache.bosses.length > 0) {
      currentBosses = enemyCache.bosses;
      console.log('[loadAndCacheEnemyData] Using cached bosses');
    } else {
      currentBosses = FALLBACK_BOSSES; // Ensure currentBosses always has a value
      console.log('[loadAndCacheEnemyData] Using fallback bosses');
    }
  }

  // Try to fetch encounters
  try {
    console.log('[loadAndCacheEnemyData] Fetching encounters...');
    const rawEncounters = await base44.entities.EnemyEncounter.list();
    const fetched = (rawEncounters || []).filter(e => e.is_active);
    if (fetched && fetched.length > 0) {
      currentEncounters = fetched;
    } else if (enemyCache.encounters && enemyCache.encounters.length > 0) {
      currentEncounters = enemyCache.encounters;
      console.log('[loadAndCacheEnemyData] Using cached encounters (API returned empty)');
    } else {
      console.log('[loadAndCacheEnemyData] Encounters empty (API returned empty and cache was empty)');
    }
    console.log('[loadAndCacheEnemyData] Encounters loaded:', currentEncounters?.length || 0);
  } catch (error) {
    console.error('[loadAndCacheEnemyData] Error loading encounters:', error.message);
    if (enemyCache.encounters && enemyCache.encounters.length > 0) {
      currentEncounters = enemyCache.encounters;
      console.log('[loadAndCacheEnemyData] Using cached encounters');
    }
  }

  // Update cache
  enemyCache = {
    enemies: currentEnemies,
    elites: currentElites,
    bosses: currentBosses,
    encounters: currentEncounters,
    lastFetch: Date.now(),
    cacheDuration: 60000,
  };

  console.log('[loadAndCacheEnemyData] Final cached data:', {
    enemies: enemyCache.enemies.length,
    elites: enemyCache.elites.length,
    bosses: enemyCache.bosses.length,
    encounters: enemyCache.encounters.length
  });

  return {
    enemies: enemyCache.enemies,
    elites: enemyCache.elites,
    bosses: enemyCache.bosses,
    encounters: enemyCache.encounters,
  };
}

export async function loadEnemyForBattle(victories, retryCount = 0, customDeckMode = false, activeModifiers = []) {
  const { base44 } = await import('@/api/base44Client');
  const nextBattle = victories + 1;
  
  console.log('[loadEnemyForBattle] Loading enemy for battle:', nextBattle, customDeckMode ? '(Custom Deck Mode - 20 battles)' : '(Regular Mode - 10 battles)');
  console.log('[loadEnemyForBattle] Active modifiers:', activeModifiers);
  
  try {
    const { enemies, elites, bosses, encounters } = await loadAndCacheEnemyData(base44);
    
    let selectedEnemy = null;

    const configuredEncounter = encounters.find(e => e.battle_number === nextBattle);
    
    if (configuredEncounter) {
      console.log('[loadEnemyForBattle] Found configured encounter for battle', nextBattle, ':', configuredEncounter);
      
      if (configuredEncounter.enemy_id === 'random') {
        console.log('[loadEnemyForBattle] Encounter is set to RANDOM, selecting random enemy of type:', configuredEncounter.enemy_type);
        
        if (configuredEncounter.enemy_type === 'boss') {
          if (bosses && bosses.length > 0) {
            const boss = bosses[Math.floor(Math.random() * bosses.length)];
            selectedEnemy = {
              name: boss.name,
              description: boss.description,
              health: boss.maxHealth,
              maxHealth: boss.maxHealth,
              nextAttack: boss.attack,
              shield: 0,
              image: boss.image,
              isBoss: true,
              bossData: boss,
              special_abilities: boss.special_abilities || [],
              isVulnerable: false,
              isStunned: false,
              burnStacks: 0,
              poisonStacks: 0,
              confusedStacks: 0,
              affixes: [],
            };
          }
        } else if (configuredEncounter.enemy_type === 'elite') {
          if (elites && elites.length > 0) {
            const elite = elites[Math.floor(Math.random() * elites.length)];
            selectedEnemy = {
              name: elite.name,
              description: elite.description,
              health: elite.maxHealth,
              maxHealth: elite.maxHealth,
              nextAttack: elite.attack,
              shield: 0,
              image: elite.image,
              isBoss: false,
              isVulnerable: false,
              isStunned: false,
              burnStacks: 0,
              poisonStacks: 0,
              confusedStacks: 0,
              affixes: elite.affixes || [],
            };
          }
        } else { // Regular enemy
          if (enemies && enemies.length > 0) {
            const enemy = enemies[Math.floor(Math.random() * enemies.length)];
            selectedEnemy = {
              name: enemy.name,
              description: enemy.description,
              health: enemy.maxHealth,
              maxHealth: enemy.maxHealth,
              nextAttack: enemy.attack,
              shield: 0,
              image: enemy.image,
              isBoss: false,
              isVulnerable: false,
              isStunned: false,
              burnStacks: 0,
              poisonStacks: 0,
              confusedStacks: 0,
              affixes: [],
            };
          }
        }
      } else { // Specific enemy
        console.log('[loadEnemyForBattle] Using configured specific enemy:', configuredEncounter.enemy_name);
        
        let specificEnemy;
        if (configuredEncounter.enemy_type === 'boss') {
          specificEnemy = bosses.find(b => b.id === configuredEncounter.enemy_id);
          if (specificEnemy) {
            selectedEnemy = {
              name: specificEnemy.name,
              description: specificEnemy.description,
              health: specificEnemy.maxHealth,
              maxHealth: specificEnemy.maxHealth,
              nextAttack: specificEnemy.attack,
              shield: 0,
              image: specificEnemy.image,
              isBoss: true,
              bossData: specificEnemy,
              special_abilities: specificEnemy.special_abilities || [],
              isVulnerable: false,
              isStunned: false,
              burnStacks: 0,
              poisonStacks: 0,
              confusedStacks: 0,
              affixes: [],
            };
          }
        } else if (configuredEncounter.enemy_type === 'elite') {
          specificEnemy = elites.find(e => e.id === configuredEncounter.enemy_id);
          if (specificEnemy) {
            selectedEnemy = {
              name: specificEnemy.name,
              description: specificEnemy.description,
              health: specificEnemy.maxHealth,
              maxHealth: specificEnemy.maxHealth,
              nextAttack: specificEnemy.attack,
              shield: 0,
              image: specificEnemy.image,
              isBoss: false,
              isVulnerable: false,
              isStunned: false,
              burnStacks: 0,
              poisonStacks: 0,
              confusedStacks: 0,
              affixes: specificEnemy.affixes || [],
            };
          }
        } else { // Regular enemy
          specificEnemy = enemies.find(e => e.id === configuredEncounter.enemy_id);
          if (specificEnemy) {
            selectedEnemy = {
              name: specificEnemy.name,
              description: specificEnemy.description,
              health: specificEnemy.maxHealth,
              maxHealth: specificEnemy.maxHealth,
              nextAttack: specificEnemy.attack,
              shield: 0,
              image: specificEnemy.image,
              isBoss: false,
              isVulnerable: false,
              isStunned: false,
              burnStacks: 0,
              poisonStacks: 0,
              confusedStacks: 0,
              affixes: [],
            };
          }
        }
      }
    }
    
    // Regular/Custom deck mode random selection if no configured encounter or specific enemy found
    if (!selectedEnemy) {
      console.log('[loadEnemyForBattle] No configured encounter, using mode-based progression');
      
      // Custom deck mode: 20 battles
      // Bosses at: 5, 10, 15, 20
      // Elites at: 6-9, 11-14, 16-19
      // Regular: 1-4, etc.
      
      if (customDeckMode) {
        if (nextBattle === 5 || nextBattle === 10 || nextBattle === 15 || nextBattle === 20) {
          // Boss battle
          if (bosses && bosses.length > 0) {
            const boss = bosses[Math.floor(Math.random() * bosses.length)];
            selectedEnemy = {
              name: boss.name,
              description: boss.description,
              health: boss.maxHealth,
              maxHealth: boss.maxHealth,
              nextAttack: boss.attack,
              shield: 0,
              image: boss.image,
              isBoss: true,
              bossData: boss,
              special_abilities: boss.special_abilities || [],
              isVulnerable: false,
              isStunned: false,
              burnStacks: 0,
              poisonStacks: 0,
              confusedStacks: 0,
              affixes: [],
            };
          }
        } else if ((nextBattle >= 6 && nextBattle <= 9) || (nextBattle >= 11 && nextBattle <= 14) || (nextBattle >= 16 && nextBattle <= 19)) {
          // Elite enemy
          if (elites && elites.length > 0) {
            const elite = elites[Math.floor(Math.random() * elites.length)];
            selectedEnemy = {
              name: elite.name,
              description: elite.description,
              health: elite.maxHealth,
              maxHealth: elite.maxHealth,
              nextAttack: elite.attack,
              shield: 0,
              image: elite.image,
              isBoss: false,
              isVulnerable: false,
              isStunned: false,
              burnStacks: 0,
              poisonStacks: 0,
              confusedStacks: 0,
              affixes: elite.affixes || [],
            };
          }
        }
      } else {
        // Regular mode: 10 battles
        if (nextBattle === 5 || nextBattle === 10) {
          // Boss battle
          if (bosses && bosses.length > 0) {
            const boss = bosses[Math.floor(Math.random() * bosses.length)];
            selectedEnemy = {
              name: boss.name,
              description: boss.description,
              health: boss.maxHealth,
              maxHealth: boss.maxHealth,
              nextAttack: boss.attack,
              shield: 0,
              image: boss.image,
              isBoss: true,
              bossData: boss,
              special_abilities: boss.special_abilities || [],
              isVulnerable: false,
              isStunned: false,
              burnStacks: 0,
              poisonStacks: 0,
              confusedStacks: 0,
              affixes: [],
            };
          }
        } else if (nextBattle >= 6 && nextBattle <= 9) {
          // Elite enemy
          if (elites && elites.length > 0) {
            const elite = elites[Math.floor(Math.random() * elites.length)];
            selectedEnemy = {
              name: elite.name,
              description: elite.description,
              health: elite.maxHealth,
              maxHealth: elite.maxHealth,
              nextAttack: elite.attack,
              shield: 0,
              image: elite.image,
              isBoss: false,
              isVulnerable: false,
              isStunned: false,
              burnStacks: 0,
              poisonStacks: 0,
              confusedStacks: 0,
              affixes: elite.affixes || [],
            };
          }
        }
      }
      
      // Regular enemy (fallback for all modes if no specific boss/elite condition met)
      if (!selectedEnemy && enemies && enemies.length > 0) {
        const enemy = enemies[Math.floor(Math.random() * enemies.length)];
        selectedEnemy = {
          name: enemy.name,
          description: enemy.description,
          health: enemy.maxHealth,
          maxHealth: enemy.maxHealth,
          nextAttack: enemy.attack,
          shield: 0,
          image: enemy.image,
          isBoss: false,
          isVulnerable: false,
          isStunned: false,
          burnStacks: 0,
          poisonStacks: 0,
          confusedStacks: 0,
          affixes: [],
        };
      }
    }
    
    // If no enemy was selected by any logic, use a default
    if (!selectedEnemy) {
      console.log('[loadEnemyForBattle] No enemies found in database or cache via specific logic, using default enemy');
      selectedEnemy = createDefaultEnemy(nextBattle);
    }

    let finalEnemy = { ...selectedEnemy };
    
    // Apply active modifiers directly (passed from Combat)
    if (activeModifiers && activeModifiers.length > 0) {
      console.log('[loadEnemyForBattle] Applying modifiers to enemy');
      
      // Apply enemy health multiplier
      const healthMod = activeModifiers.find(m => m.effect_type === 'enemy_health_mult');
      if (healthMod) {
        const oldHealth = finalEnemy.maxHealth;
        finalEnemy.maxHealth = Math.floor(finalEnemy.maxHealth * healthMod.effect_value);
        finalEnemy.health = finalEnemy.maxHealth;
        console.log(`[loadEnemyForBattle] Applied enemy_health_mult: ${oldHealth} -> ${finalEnemy.maxHealth} (${healthMod.effect_value}x)`);
      }
      
      // Apply enemy attack multiplier
      const attackMod = activeModifiers.find(m => m.effect_type === 'enemy_attack_mult');
      if (attackMod) {
        const oldAttack = finalEnemy.nextAttack;
        finalEnemy.nextAttack = Math.floor(finalEnemy.nextAttack * attackMod.effect_value);
        console.log(`[loadEnemyForBattle] Applied enemy_attack_mult: ${oldAttack} -> ${finalEnemy.nextAttack} (${attackMod.effect_value}x)`);
      }
    }
    
    return finalEnemy;
    
  } catch (error) {
    console.error('[loadEnemyForBattle] Error:', error);
    
    if (retryCount < 2) {
      const delay = (retryCount + 1) * 3000;
      console.log(`[loadEnemyForBattle] Network error, retrying in ${delay}ms... (attempt ${retryCount + 1}/2)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return loadEnemyForBattle(victories, retryCount + 1, customDeckMode, activeModifiers);
    }
    
    console.log('[loadEnemyForBattle] Max retries reached or unrecoverable error, returning default enemy');
    return createDefaultEnemy(nextBattle);
  }
}

// Helper function to create a default enemy
function createDefaultEnemy(battleNumber) {
  // This function currently does not differentiate between customDeckMode and regular mode for defaults,
  // which is fine as it's a last-resort fallback. It only checks battle number for boss/elite type.
  const isBoss = battleNumber === 5 || battleNumber === 10 || battleNumber === 15 || battleNumber === 20; // Expanded for custom mode's bosses
  const isElite = (battleNumber >= 6 && battleNumber <= 9) || (battleNumber >= 11 && battleNumber <= 14) || (battleNumber >= 16 && battleNumber <= 19); // Expanded for custom mode's elites
  
  if (isBoss) {
    const defaultBoss = FALLBACK_BOSSES[0];
    return {
      name: defaultBoss.name,
      description: defaultBoss.description,
      health: defaultBoss.maxHealth,
      maxHealth: defaultBoss.maxHealth,
      nextAttack: defaultBoss.attack,
      shield: 0,
      image: defaultBoss.image,
      isBoss: true,
      bossData: { name: defaultBoss.name, special_abilities: defaultBoss.special_abilities || [] },
      special_abilities: defaultBoss.special_abilities || [],
      isVulnerable: false,
      isStunned: false,
      burnStacks: 0,
      poisonStacks: 0,
      confusedStacks: 0,
      affixes: [],
    };
  } else if (isElite) {
    const defaultElite = FALLBACK_ELITES[0];
    return {
      name: defaultElite.name,
      description: defaultElite.description,
      health: defaultElite.maxHealth,
      maxHealth: defaultElite.maxHealth,
      nextAttack: defaultElite.attack,
      shield: 0,
      image: defaultElite.image,
      isBoss: false,
      isVulnerable: false,
      isStunned: false,
      burnStacks: 0,
      poisonStacks: 0,
      confusedStacks: 0,
      affixes: defaultElite.affixes || [],
    };
  } else {
    const defaultEnemy = FALLBACK_ENEMIES[0];
    return {
      name: defaultEnemy.name,
      description: defaultEnemy.description,
      health: defaultEnemy.maxHealth,
      maxHealth: defaultEnemy.maxHealth,
      nextAttack: defaultEnemy.attack,
      shield: 0,
      image: defaultEnemy.image,
      isBoss: false,
      isVulnerable: false,
      isStunned: false,
      burnStacks: 0,
      poisonStacks: 0,
      confusedStacks: 0,
      affixes: [],
    };
  }
}

// Clear cache (useful for testing or after admin changes)
export function clearEnemyCache() {
  enemyCache = {
    enemies: null,
    elites: null,
    bosses: null,
    encounters: null,
    lastFetch: 0,
    cacheDuration: 60000,
  };
  console.log('[clearEnemyCache] Enemy cache cleared');
}


// CompanionSystem.js - Manages companion triggers and effects during combat

export class CompanionSystem {
  constructor(companions, config, addLog) {
    this.companions = companions || [];
    this.config = config || {};
    this.addLog = addLog;
    this.triggerLocks = {}; // Prevent duplicate triggers
    this.activeProcCounts = {}; // Track procs for telemetry
  }

  // Initialize trigger locks for new battle
  initBattle() {
    this.triggerLocks = {};
    this.activeProcCounts = {};
    this.companions.forEach(comp => {
      this.activeProcCounts[comp.id] = 0;
    });
  }

  // Check if companion can trigger (respects once-per-turn locks)
  canTrigger(companionId, triggerType, turnNumber) {
    const lockKey = `${companionId}_${triggerType}_${turnNumber}`;
    if (this.triggerLocks[lockKey]) {
      return false;
    }
    return true;
  }

  // Lock a trigger to prevent duplicates
  lockTrigger(companionId, triggerType, turnNumber) {
    const lockKey = `${companionId}_${triggerType}_${turnNumber}`;
    this.triggerLocks[lockKey] = true;
  }

  // Apply global multipliers from config
  applyMultiplier(value, type) {
    const multipliers = this.config.global_multipliers || {};
    const multiplier = multipliers[`${type}_multiplier`] || 1.0;
    return Math.floor(value * multiplier);
  }

  // Trigger companions based on event
  trigger(event, context, dispatch, combatActions) {
    const results = [];
    
    this.companions.forEach(companion => {
      const effect = companion.base_effect;
      
      // Check if this companion should trigger for this event
      if (effect.trigger_type !== event.type) return;
      
      // Check trigger locks
      if (!this.canTrigger(companion.id, event.type, context.turnNumber)) {
        return;
      }

      // Check conditions
      if (effect.condition) {
        if (!this.checkCondition(effect.condition, context)) {
          return;
        }
      }

      // Apply the effect
      const result = this.applyEffect(companion, effect, context, dispatch, combatActions);
      
      if (result) {
        results.push(result);
        this.lockTrigger(companion.id, event.type, context.turnNumber);
        this.activeProcCounts[companion.id]++;
        
        if (this.addLog) {
          this.addLog(`🐾 ${companion.name}: ${result.message}`, 'companion');
        }
      }
    });

    return results;
  }

  // Check if condition is met
  checkCondition(condition, context) {
    switch (condition) {
      case 'hp_below_50':
        return (context.player.health / context.player.maxHealth) < 0.5;
      case 'has_burn':
        return context.enemy.burnStacks > 0;
      case 'has_shield':
        return context.player.shield > 0;
      case 'third_attack_card':
        return context.attackCardsPlayedThisTurn === 2; // 3rd is index 2
      case 'every_third_card':
        return context.cardsPlayedThisTurn % 3 === 0;
      case 'on_death':
        return context.player.health <= 0;
      case 'random_chance_33':
        return Math.random() < 0.33;
      default:
        return true;
    }
  }

  // Apply companion effect
  applyEffect(companion, effect, context, dispatch, combatActions) {
    const effectType = effect.effect_type;
    let value = effect.effect_value;

    // Apply blessings if any
    const blessings = context.chosenBlessings?.[companion.id] || {};
    
    switch (effectType) {
      case 'phoenix_resurrection':
        if (context.player.health <= 0) {
          const reviveHP = this.applyMultiplier(value, 'heal');
          dispatch({
            type: combatActions.UPDATE_PLAYER,
            payload: { health: reviveHP }
          });
          return { message: `Resurrected with ${reviveHP} HP!`, effect: 'revive' };
        }
        break;

      case 'draw_cards':
        dispatch({
          type: combatActions.DRAW_CARDS,
          payload: { count: value }
        });
        return { message: `Drew ${value} card(s)`, effect: 'draw' };

      case 'gain_shield':
        const shieldAmount = this.applyMultiplier(value, 'shield');
        dispatch({
          type: combatActions.GAIN_SHIELD,
          payload: { amount: shieldAmount }
        });
        return { message: `Gained ${shieldAmount} shield`, effect: 'shield' };

      case 'gain_energy':
        dispatch({
          type: combatActions.UPDATE_PLAYER,
          payload: { energy: Math.min(context.player.maxEnergy, context.player.energy + value) }
        });
        return { message: `Gained ${value} energy`, effect: 'energy' };

      case 'heal_player':
        const healAmount = this.applyMultiplier(value, 'heal');
        dispatch({
          type: combatActions.HEAL_PLAYER,
          payload: { amount: healAmount }
        });
        return { message: `Healed ${healAmount} HP`, effect: 'heal' };

      case 'damage_amplify':
        // Adds bonus damage to next attack
        dispatch({
          type: combatActions.UPDATE_TEMP_BUFFS,
          payload: { nextAttackBonus: (context.tempBuffs.nextAttackBonus || 0) + value }
        });
        return { message: `Next attack deals +${value} damage`, effect: 'buff' };

      case 'apply_burn':
        const burnStacks = this.applyMultiplier(value, 'debuff');
        dispatch({
          type: combatActions.UPDATE_ENEMY,
          payload: { burnStacks: context.enemy.burnStacks + burnStacks }
        });
        return { message: `Applied ${burnStacks} Burn`, effect: 'debuff' };

      case 'apply_poison':
        const poisonStacks = this.applyMultiplier(value, 'debuff');
        dispatch({
          type: combatActions.UPDATE_ENEMY,
          payload: { poisonStacks: context.enemy.poisonStacks + poisonStacks }
        });
        return { message: `Applied ${poisonStacks} Poison`, effect: 'debuff' };

      case 'apply_slow':
        // Applies stun/slow effect
        dispatch({
          type: combatActions.UPDATE_ENEMY,
          payload: { isStunned: true }
        });
        return { message: 'Enemy slowed!', effect: 'debuff' };

      case 'damage_reduction':
        // Reduces incoming damage
        return { message: `Reduces damage by ${value}`, effect: 'passive' };

      case 'amplify_debuff':
        // Amplifies existing debuffs
        return { message: `Debuffs amplified by +${value}`, effect: 'buff' };

      case 'combo_counter':
        // Tracks combo hits
        return { message: `Combo +${value}!`, effect: 'buff' };

      case 'growth_stack':
        // Growth mechanic (Ancient Tree)
        return { message: 'Growth +1', effect: 'stack' };

      case 'improved_rewards':
        // Passive economy bonus
        return null; // Handled elsewhere

      default:
        return null;
    }

    return null;
  }

  // Get proc telemetry
  getTelemetry() {
    return {
      totalProcs: Object.values(this.activeProcCounts).reduce((a, b) => a + b, 0),
      procsByCompanion: { ...this.activeProcCounts }
    };
  }
}

export default CompanionSystem;

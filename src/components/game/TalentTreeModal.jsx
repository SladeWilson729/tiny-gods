
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { Loader2, Lock, Check, Trophy, Star, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const GOD_TALENTS = {
  Athena: {
    tier1: {
      calculated_strike: {
        name: "Calculated Strike",
        description: "When you have 4+ Shield, your attack cards deal +3 damage.",
        icon: "⚔️"
      },
      divine_patience: {
        name: "Divine Patience",
        description: "Start each turn with +2 Energy but draw 1 fewer card.",
        icon: "⚡"
      },
      shield_readiness: {
        name: "Shield Readiness",
        description: "Start each battle with 8 Shield.",
        icon: "🛡️"
      }
    },
    tier2: {
      shared_wisdom: {
        name: "Shared Wisdom",
        description: "All Shield cards cost 1 less Energy.",
        icon: "📚"
      },
      insight_edge: {
        name: "Insight's Edge",
        description: "Negate the first enemy attack each battle.",
        icon: "👁️"
      },
      aggressive_defense: {
        name: "Aggressive Defense",
        description: "When you have 10+ Shield and play a damage card, you deal +3 bonus damage.",
        icon: "⚔️🛡️"
      }
    },
    tier3: {
      aegis_mastery: {
        name: "Aegis Mastery",
        description: "Shield cards grant 50% more Shield.",
        icon: "🛡️✨"
      },
      tactical_supremacy: {
        name: "Tactical Supremacy",
        description: "At the start of your turn, if you have 15+ Shield, draw 2 extra cards.",
        icon: "📜"
      },
      divine_retribution: {
        name: "Divine Retribution",
        description: "When an enemy attacks you while you have Shield, deal 5 damage back to them.",
        icon: "⚡🛡️"
      }
    },
    tier4: {
      aegis_ascendant: {
        name: "Aegis Ascendant",
        description: "When your Shield exceeds your current HP, gain +50% damage and Reflect 25% of all incoming damage for 2 turns. (Triggers once per battle.)",
        icon: "🛡️👑"
      }
    }
  },
  Zeus: {
    tier1: {
      lightning_surge: {
        name: "Lightning Surge",
        description: "Every 2nd attack card deals +6 bonus damage.",
        icon: "⚡"
      },
      storm_caller: {
        name: "Storm Caller",
        description: "Start each battle with +1 Energy.",
        icon: "🌩️"
      },
      thunder_shield: {
        name: "Thunder Shield",
        description: "Start each battle with 5 Shield.",
        icon: "🛡️"
      }
    },
    tier2: {
      chain_lightning: {
        name: "Chain Lightning",
        description: "After dealing damage 3 times in one turn, deal 10 bonus damage.",
        icon: "⚡⚡"
      },
      divine_authority: {
        name: "Divine Authority",
        description: "All damage cards cost 1 less Energy.",
        icon: "👑"
      },
      thunderous_might: {
        name: "Thunderous Might",
        description: "Your first attack each turn deals +8 damage.",
        icon: "💪"
      }
    },
    tier3: {
      olympian_wrath: {
        name: "Olympian Wrath",
        description: "Deal 3 damage to the enemy at the start of each of your turns.",
        icon: "⚡👑"
      },
      god_king: {
        name: "God King",
        description: "+20 Max Health and heal 5 Health at the start of each battle.",
        icon: "❤️"
      },
      storm_lord: {
        name: "Storm Lord",
        description: "Every 3rd attack card costs 0 Energy.",
        icon: "🌩️⚡"
      }
    }
  },
  Thor: {
    tier1: {
      mjolnir_strike: {
        name: "Mjolnir's Strike",
        description: "Your first attack each turn deals +5 damage.",
        icon: "🔨"
      },
      asgardian_vigor: {
        name: "Asgardian Vigor",
        description: "+15 Max Health.",
        icon: "❤️"
      },
      storm_armor: {
        name: "Storm Armor",
        description: "Start each battle with 6 Shield.",
        icon: "⚡🛡️"
      }
    },
    tier2: {
      thunder_god: {
        name: "Thunder God",
        description: "After playing 3 attack cards, gain 1 Energy.",
        icon: "⚡"
      },
      press_the_advantage: {
        name: "Press the Advantage",
        description: "After playing 2 damage cards, Thor's next damage card gets +5 damage.",
        icon: "💥"
      },
      lightning_reflexes: {
        name: "Lightning Reflexes",
        description: "Draw 1 extra card at the start of each turn.",
        icon: "📜"
      }
    },
    tier3: {
      godly_strength: {
        name: "Godly Strength",
        description: "All attack cards deal +3 damage.",
        icon: "💪⚡"
      },
      booming_presence: {
        name: "Booming Presence",
        description: "While an enemy is stunned, damage cards deal +4 damage.",
        icon: "⚡💥"
      },
      thunderstrike: {
        name: "Thunderstrike",
        description: "Your 3rd attack card each turn deals triple damage.",
        icon: "⚡⚡⚡"
      }
    },
    tier4: {
      mjolnirs_judgment: {
        name: "Mjolnir's Judgment",
        description: "Every 3 attacks trigger a Chain Lightning that deals 15 damage to the enemy and restores 1 Energy.",
        icon: "🔨⚡"
      }
    }
  },
  Anubis: {
    tier1: {
      soul_harvest: {
        name: "Soul Harvest",
        description: "Heal for 50% of damage dealt with attack cards.",
        icon: "💀❤️"
      },
      eternal_guardian: {
        name: "Eternal Guardian",
        description: "While Anubis is at 50% or less HP, when you play a card gain +5 HP.",
        icon: "🛡️"
      },
      death_touch: {
        name: "Death's Touch",
        description: "While Anubis is at 50% or less HP, attacks deal +5 damage and 4 self damage.",
        icon: "💀"
      }
    },
    tier2: {
      scales_of_judgment: {
        name: "Scales of Judgment",
        description: "When below 50% Health, all cards cost 1 less Energy.",
        icon: "⚖️"
      },
      underworld_resilience: {
        name: "Underworld Resilience",
        description: "When Anubis would be reduced to zero HP, instead restore his HP to 50%.",
        icon: "💀🛡️"
      },
      life_drain: {
        name: "Life Drain",
        description: "When you lose HP from self damage, draw a card.",
        icon: "❤️⚡"
      }
    },
    tier3: {
      judge_of_souls: {
        name: "Judge of Souls",
        description: "Heal for 100% of damage dealt with attack cards (replaces Soul Harvest).",
        icon: "💀❤️✨"
      },
      eternal_curse: {
        name: "Eternal Curse",
        description: "While Anubis is at 50% or less HP, attacks apply 2 stacks of poison.",
        icon: "💀⚡"
      },
      death_defiance: {
        name: "Death Defiance",
        description: "Cheat death twice per battle instead of once (requires Underworld Resilience).",
        icon: "💀🛡️⚡"
      }
    },
    tier4: {
      eternal_balance: {
        name: "Eternal Balance",
        description: "For every 25 HP you lose in a battle, permanently gain +5 Attack and +5 Shield for the rest of that run.",
        icon: "⚖️👑"
      }
    }
  },
  Hades: {
    tier1: {
      underworld_pact: {
        name: "Underworld Pact",
        description: "Gain +5 Max Health after each victory.",
        icon: "💀❤️"
      },
      lord_of_riches: {
        name: "Lord of Riches",
        description: "When choosing a relic, see 4 relics instead of 3.",
        icon: "💎"
      },
      dark_resilience: {
        name: "Dark Resilience",
        description: "+25 Max Health.",
        icon: "🛡️"
      }
    },
    tier2: {
      lord_of_dead: {
        name: "Lord of the Dead",
        description: "Gain +10 Max Health after each victory instead of +5.",
        icon: "💀👑"
      },
      shadow_strike: {
        name: "Shadow Strike",
        description: "Attack cards have a 15% chance to deal double damage.",
        icon: "🌑"
      },
      revel_in_riches: {
        name: "Revel in Riches",
        description: "Relics provide double the bonus to Hades.",
        icon: "💎🌑"
      }
    },
    tier3: {
      king_of_underworld: {
        name: "King of the Underworld",
        description: "Gain +15 Max Health after each victory (+10 bonus to base +5).",
        icon: "👑💀"
      },
      eternal_darkness: {
        name: "Eternal Darkness",
        description: "All attack cards cost 1 less Energy.",
        icon: "🌑⚡"
      },
      all_that_glitters: {
        name: "All that Glitters",
        description: "Hades selects relics at levels 2, 4, 6, 8 instead of 3, 6, 9.",
        icon: "💎👑"
      }
    },
    tier4: {
      gold_makes_the_rules: {
        name: "Gold Makes the Rules",
        description: "At the start of your turn, gain HP, Shield, and bonus damage equal to the number of relics you own.",
        icon: "💰👑"
      }
    }
  },
  Shiva: {
    tier1: {
      cosmic_dance: {
        name: "Many Arms",
        description: "After playing two cards of the same type, the next card of that type costs 1 less Energy.",
        icon: "💃"
      },
      destructive_power: {
        name: "Destructive Power",
        description: "Attack cards deal +4 damage.",
        icon: "🔥"
      },
      divine_balance: {
        name: "Divine Balance",
        description: "Start each turn with +1 Energy.",
        icon: "⚖️"
      }
    },
    tier2: {
      third_eye: {
        name: "Third Eye",
        description: "Draw 2 extra cards at the start of each turn.",
        icon: "👁️"
      },
      tandava_fury: {
        name: "Tandava Fury",
        description: "When you play 4 cards in one turn, gain 2 Energy.",
        icon: "🔥💃"
      },
      cycle_mastery: {
        name: "Cycle Mastery",
        description: "Same-type discount is now 2 Energy instead of 1.",
        icon: "♻️"
      }
    },
    tier3: {
      eternal_dance: {
        name: "Eternal Dance",
        description: "Start each turn with +2 Energy.",
        icon: "💫"
      },
      destroyer_form: {
        name: "Destroyer Form",
        description: "Attack cards deal +5 damage.",
        icon: "🔥💀"
      },
      cosmic_annihilation: {
        name: "Cosmic Annihilation",
        description: "After playing all 3 card types in one turn, deal 15 damage to the enemy.",
        icon: "💥🌌"
      }
    },
    tier4: {
      dance_of_annihilation: {
        name: "Dance of Annihilation",
        description: "When you deal damage 5 times in one turn, your next card that turn costs 0 and deals double damage.",
        icon: "💃🔥"
      }
    }
  },
  Ra: {
    tier1: {
      solar_fury: {
        name: "Solar Fury",
        description: "While at full Health, gain +1 Energy at the start of your turn.",
        icon: "☀️"
      },
      sun_blessing: {
        name: "Sun's Blessing",
        description: "+20 Max Health.",
        icon: "❤️☀️"
      },
      desert_heat: {
        name: "Desert Heat",
        description: "Attack cards deal +3 damage.",
        icon: "🔥"
      }
    },
    tier2: {
      burning_radiance: {
        name: "Burning Radiance",
        description: "All attack cards apply 5 Burn damage.",
        icon: "☀️⚡"
      },
      eternal_sun: {
        name: "Eternal Sun",
        description: "Heal 5 Health at the start of each battle.",
        icon: "❤️"
      },
      scorching_might: {
        name: "Scorching Might",
        description: "Solar Fury now grants +2 Energy instead of +1.",
        icon: "☀️☀️"
      }
    },
    tier3: {
      sun_god_ascendant: {
        name: "Sun God Ascendant",
        description: "While at full Health, all cards cost 1 less Energy.",
        icon: "☀️👑"
      },
      solar_regeneration: {
        name: "Solar Regeneration",
        description: "Heal 3 Health at the start of your turn.",
        icon: "❤️✨"
      },
      inferno: {
        name: "Inferno",
        description: "At full Health, enemies take 5 burn damage at the start of their turn.",
        icon: "🔥☀️"
      }
    },
    tier4: {
      solar_ascension: {
        name: "Solar Ascension",
        description: "Every 4 turns, unleash a Solar Blast that deals 20 Burn and heals 15 HP.",
        icon: "☀️👑"
      }
    }
  },
  Quetzalcoatl: {
    tier1: {
      serpent_wisdom: {
        name: "Serpent Wisdom",
        description: "Draw +1 card at the start of each turn.",
        icon: "🐍"
      },
      feathered_shield: {
        name: "Feathered Shield",
        description: "Start each battle with 7 Shield.",
        icon: "🪶🛡️"
      },
      whispering_winds: {
        name: "Whispering Winds",
        description: "After you play 3 cards, draw a card.",
        icon: "🌬️"
      }
    },
    tier2: {
      divine_knowledge: {
        name: "Divine Knowledge",
        description: "When you draw a card, gain +2 Shield.",
        icon: "📚🛡️"
      },
      zephyrs_grace: {
        name: "Zephyr's Grace",
        description: "Each time you play a card that costs 0, gain 3 Shield and draw 1 card.",
        icon: "🪶✨"
      },
      wind_master: {
        name: "Wind Master",
        description: "Whispering Winds now also grants +3 Shield.",
        icon: "🌪️"
      }
    },
    tier3: {
      storm_caller: {
        name: "Storm Caller",
        description: "Whispering Winds now also grants +1 Energy.",
        icon: "🌬️⚡"
      },
      sky_lord: {
        name: "Sky Lord",
        description: "At the start of your turn, draw cards until you have 7 in hand.",
        icon: "🪶👑"
      },
      feathered_ascension: {
        name: "Feathered Ascension",
        description: "After drawing 5+ cards in one turn, all cards cost 1 less this turn.",
        icon: "🐍✨"
      }
    },
    tier4: {
      serpents_momentum: {
        name: "Serpent's Momentum",
        description: "Every 3rd card you play each turn gains Surge and Charge 2 automatically.",
        icon: "🐍⚡"
      }
    }
  },
  Loki: {
    tier1: {
      tricksters_guile: {
        name: "Trickster's Guile",
        description: "Reduce enemy damage by 3 each turn.",
        icon: "😈"
      },
      chaos_magic: {
        name: "Chaos Magic",
        description: "When you play a card, there is a 25% chance your next card will cost 1 less.",
        icon: "🎭"
      },
      illusory_defense: {
        name: "Illusory Defense",
        description: "Attacks have a 25% chance to confuse the enemy.",
        icon: "🛡️"
      }
    },
    tier2: {
      master_deceiver: {
        name: "Master Deceiver",
        description: "Reduce enemy damage by 5 instead of 3.",
        icon: "😈✨"
      },
      clever_deception: {
        name: "Clever Deception",
        description: "Deal +4 damage to attacks while the enemy is confused.",
        icon: "🎭💫"
      },
      mischief_maker: {
        name: "Mischief Maker",
        description: "Every 3rd card you play costs 0 Energy.",
        icon: "😈⚡"
      }
    },
    tier3: {
      god_of_mischief: {
        name: "God of Mischief",
        description: "Reduce enemy damage by 7 and gain 3 Shield each turn.",
        icon: "😈👑"
      },
      glorious_purpose: {
        name: "Glorious Purpose",
        description: "When you attack a confused enemy, draw a card.",
        icon: "🎭✨"
      },
      tricksters_triumph: {
        name: "Trickster's Triumph",
        description: "Every 4th card you play costs 0 Energy.",
        icon: "😈⚡"
      }
    },
    tier4: {
      tricksters_reversal: {
        name: "Trickster's Reversal",
        description: "Once per battle, when the enemy deals more than 20 damage in a single hit, you negate the attack and instead deal that damage back as Burn.",
        icon: "🎭🔥"
      }
    }
  },
  Cthulhu: {
    tier1: {
      eldritch_awakening: {
        name: "Eldritch Awakening",
        description: "Whenever you discard a card, gain 10 HP.",
        icon: "🐙"
      },
      cosmic_horror: {
        name: "Cosmic Horror",
        description: "Attack cards deal +4 damage.",
        icon: "👁️"
      },
      void_shield: {
        name: "Void Shield",
        description: "Start each battle with 8 Shield.",
        icon: "🌑🛡️"
      }
    },
    tier2: {
      maddening_presence: {
        name: "Maddening Presence",
        description: "Vulnerable now increases damage taken by 75% instead of 50%.",
        icon: "😵‍💫"
      },
      deep_one_blessing: {
        name: "Deep One's Blessing",
        description: "+30 Max Health.",
        icon: "🐙❤️"
      },
      reality_warp: {
        name: "Reality Warp",
        description: "Whenever you discard a card, draw a card.",
        icon: "🌀"
      }
    },
    tier3: {
      elder_god: {
        name: "Elder God",
        description: "Vulnerable enemies take double damage instead of 75% extra.",
        icon: "👁️⚡"
      },
      nightmare_incarnate: {
        name: "Nightmare Incarnate",
        description: "When you discard a card, your next attack gets +8 damage.",
        icon: "😱"
      },
      cosmic_dread: {
        name: "Cosmic Dread",
        description: "Vulnerable enemies take 10 damage at the start of their turn.",
        icon: "🐙💀"
      }
    },
    tier4: {
      gold_makes_the_rules: {
        name: "Depths of Madness",
        description: "When you discard a card, gain 1 temporary energy.",
        icon: "🌊💀"
      }
    }
  },
  "Baron Samedi": {
    tier1: {
      death_curse: {
        name: "Death Curse",
        description: "First attack on an enemy applies 1 Poison stack.",
        icon: "💀"
      },
      voodoo_resilience: {
        name: "Voodoo Resilience",
        description: "+25 Max Health.",
        icon: "🎭❤️"
      },
      spirit_shield: {
        name: "Spirit Shield",
        description: "Start each battle with 7 Shield.",
        icon: "👻🛡️"
      }
    },
    tier2: {
      master_of_death: {
        name: "Master of Death",
        description: "Poison deals 3 damage per stack instead of 2.",
        icon: "💀⚡"
      },
      loa_blessing: {
        name: "Loa's Blessing",
        description: "Heal 5 Health whenever an enemy loses Health from Poison.",
        icon: "🎭❤️"
      },
      toxic_strike: {
        name: "Toxic Strike",
        description: "Attack cards that deal 10+ damage apply 1 Poison stack.",
        icon: "☠️"
      }
    },
    tier3: {
      death_lord: {
        name: "Death Lord",
        description: "Poison deals 5 damage per stack.",
        icon: "💀👑"
      },
      voodoo_master: {
        name: "Voodoo Master",
        description: "All attacks apply 3 Poison stacks instead of 1.",
        icon: "🎭⚡"
      },
      spirit_vengeance: {
        name: "Spirit Vengeance",
        description: "When you take damage, apply 1 Poison stack to the enemy.",
        icon: "👻💀"
      }
    },
    tier4: {
      laughter_of_the_grave: {
        name: "Laughter of the Grave",
        description: "Every time you apply Burn, gain +2 temporary Shield and Heal 2 HP. If the enemy dies while Burning, you start your next battle with +15 HP.",
        icon: "🎭🔥"
      }
    }
  },
  Odin: {
    tier1: {
      runes_of_power: {
        name: "Runes of Power",
        description: "Once per turn, sacrifice 1 Health to gain 2 Energy.",
        icon: "ᚱ"
      },
      allfather_wisdom: {
        name: "Allfather's Wisdom",
        description: "Draw 1 extra card at the start of each turn.",
        icon: "📖"
      },
      valhalla_blessing: {
        name: "Valhalla's Blessing",
        description: "+20 Max Health.",
        icon: "⚔️❤️"
      }
    },
    tier2: {
      greater_runes: {
        name: "Greater Runes",
        description: "Runes of Power can be used twice per turn.",
        icon: "ᚱᚱ"
      },
      gungnir_strike: {
        name: "Gungnir's Strike",
        description: "Attack cards deal +5 damage.",
        icon: "🗡️"
      },
      ravens_insight: {
        name: "Raven's Insight",
        description: "Draw 2 extra cards at the start of each turn.",
        icon: "🐦‍⬛"
      }
    },
    tier3: {
      supreme_runes: {
        name: "Supreme Runes",
        description: "Runes of Power now grants +3 Energy.",
        icon: "ᚱ✨"
      },
      king_of_asgard: {
        name: "King of Asgard",
        description: "+30 Max Health and all cards cost 1 less Energy.",
        icon: "👑⚡"
      },
      odin_force: {
        name: "Odin Force",
        description: "Start each turn with +2 Energy.",
        icon: "⚡⚡"
      }
    },
    tier4: {
      allfather_pact: {
        name: "Allfather's Pact",
        description: "Gain 1 temporary Energy whenever you deal damage to an enemy with a status effect (e.g., Burn, Poison, Stun).",
        icon: "👑✨"
      }
    }
  },
  Susanoo: {
    tier1: {
      rising_tempest: {
        name: "Rising Tempest",
        description: "When you take damage, your next attack deals +5 bonus damage.",
        icon: "⚡"
      },
      defiant_tide: {
        name: "Defiant Tide",
        description: "Start each battle with 5 Shield. Heal 10 when dropping below 50% HP (once per battle).",
        icon: "🌊"
      },
      blood_surge: {
        name: "Blood Surge",
        description: "Self-damage cards deal +50% more damage.",
        icon: "🩸"
      }
    },
    tier2: {
      fury_unbound: {
        name: "Fury Unbound",
        description: "Every 5th card played this battle costs 0 Energy.",
        icon: "⚔️"
      },
      raging_storm: {
        name: "Raging Storm",
        description: "After taking damage 3 times, deal 15 damage to the enemy.",
        icon: "⚡"
      },
      sea_reclaimer: {
        name: "Sea Reclaimer",
        description: "Whenever you heal, gain +5 Shield.",
        icon: "🌀"
      }
    },
    tier3: {
      heavens_rage: {
        name: "Heaven's Rage",
        description: "While below 50% HP, all attack cards cost 1 less Energy.",
        icon: "🌩️"
      },
      storm_sovereign: {
        name: "Storm Sovereign",
        description: "Start each turn with +1 Energy if you took damage last turn.",
        icon: "⚡"
      },
      wrath_reborn: {
        name: "Wrath Reborn",
        description: "When reduced to 1 HP or less for the first time each battle, heal 20 and deal 30 damage to the enemy.",
        icon: "🌊"
      }
    }
  },
  "The Morrígan": {
    tier1: {
      blood_feather: {
        name: "Blood Feather",
        description: "Start each battle with +1 Energy if your HP is below 75%.",
        icon: "🐦"
      },
      crows_hunger: {
        name: "Crow's Hunger",
        description: "Heal 5 HP every 3 turns.",
        icon: "🖤"
      },
      dark_omen: {
        name: "Dark Omen",
        description: "The first damage card each battle automatically applies Vulnerable (2).",
        icon: "⚔️"
      }
    },
    tier2: {
      foresight: {
        name: "Foresight",
        description: "When you end your turn with 2+ Energy unused, gain +6 Shield and draw 1 card.",
        icon: "👁️"
      },
      mark_of_fate: {
        name: "Mark of Fate",
        description: "After using a Heal card, your next attack deals +50% damage.",
        icon: "☠️"
      },
      raven_queens_grace: {
        name: "Raven Queen's Grace",
        description: "Every 5th card played restores 10 HP.",
        icon: "🕯️"
      }
    },
    tier3: {
      queen_of_fate: {
        name: "Queen of Fate",
        description: "When the enemy's HP drops below 30%, deal 20 automatic damage and apply Weak (3).",
        icon: "🦅"
      },
      prophecy_fulfilled: {
        name: "Prophecy Fulfilled",
        description: "At the start of your turn, if you have 50+ Shield, double your Attack for that turn.",
        icon: "🌑"
      },
      phantom_resurrection: {
        name: "Phantom Resurrection",
        description: "Once per battle, when you die, revive at 25% HP and gain +25% damage permanently.",
        icon: "🖤"
      }
    }
  },
  Lucifer: {
    tier1: {
      light_in_darkness: {
        name: "Light in Darkness",
        description: "+20% Burn damage while under 50% HP.",
        icon: "💫"
      },
      fuel_the_flame: {
        name: "Fuel the Flame",
        description: "Burn effects on you heal 2 HP instead of hurting you.",
        icon: "🔥"
      },
      prideful_endurance: {
        name: "Prideful Endurance",
        description: "The first time you drop below 25% HP each battle, gain 10 Shield.",
        icon: "💀"
      }
    },
    tier2: {
      wrath_unbound: {
        name: "Wrath Unbound",
        description: "When you deal Burn damage while under 50% HP, gain +1 Energy (once per turn).",
        icon: "⚔️"
      },
      hells_embrace: {
        name: "Hell's Embrace",
        description: "Heal 10 HP each turn Burn is active on enemy.",
        icon: "🌟"
      },
      radiant_fury: {
        name: "Radiant Fury",
        description: "Every 5th Burn tick deals double damage.",
        icon: "🔥"
      }
    },
    tier3: {
      morningstar_ascendant: {
        name: "The Morningstar Ascendant",
        description: "Below 25% HP: all damage cards cost 1 less Energy.",
        icon: "😈"
      },
      blaze_of_defiance: {
        name: "Blaze of Defiance",
        description: "On death, revive at 10% HP and immediately apply Burn (25).",
        icon: "🌅"
      },
      infernal_apotheosis: {
        name: "Infernal Apotheosis",
        description: "Burn ticks now have a 20% chance to instantly trigger twice.",
        icon: "🔥"
      }
    }
  },
  Ganesha: {
    tier1: {
      gentle_wisdom: {
        name: "Gentle Wisdom",
        description: "Heal +3 HP whenever you draw a card.",
        icon: "🐘"
      },
      sacred_stillness: {
        name: "Sacred Stillness",
        description: "Start each battle with +1 Energy but draw 1 fewer card.",
        icon: "🕯️"
      },
      calm_mind: {
        name: "Calm Mind",
        description: "Charge stacks persist between draws (do not reset when card is drawn again).",
        icon: "💎"
      }
    },
    tier2: {
      blessed_path: {
        name: "Blessed Path",
        description: "Your Heal cards cost 1 less Energy if you have Shield active.",
        icon: "🕉️"
      },
      endless_patience: {
        name: "Endless Patience",
        description: "Charge bonuses are doubled on all Heal cards.",
        icon: "🪷"
      },
      clear_insight: {
        name: "Clear Insight",
        description: "Every 3rd card you play each turn costs 0 Energy.",
        icon: "📜"
      }
    },
    tier3: {
      inner_radiance: {
        name: "Inner Radiance",
        description: "Gain +1 permanent Max Energy every 4th turn.",
        icon: "🔥"
      },
      divine_harmony: {
        name: "Divine Harmony",
        description: "When you Heal, gain Shield equal to 50% of the amount healed.",
        icon: "💫"
      },
      meditative_flow: {
        name: "Meditative Flow",
        description: "Charge cards in hand gain +1 bonus stack every other turn.",
        icon: "🌙"
      }
    },
    tier4: {
      path_of_enlightenment: {
        name: "Path of Enlightenment",
        description: "When you reach 50 total Charge stacks in a battle, all cards cost 1 less for the rest of that combat.",
        icon: "👑🕉️"
      }
    }
  }
};

export default function TalentTreeModal({ open, onClose }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGod, setSelectedGod] = useState('Athena');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadUserData();
    }
  }, [open]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const userData = await base44.auth.me();
      console.log("TalentTreeModal - Loaded user data:", userData);
      console.log("TalentTreeModal - god_runs_completed:", userData.god_runs_completed);
      setUser(userData);
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGodRuns = (godName) => {
    const runs = user?.god_runs_completed?.[godName] || 0;
    console.log(`TalentTreeModal - ${godName} has ${runs} completed runs`);
    return runs;
  };

  const getSelectedTalent = (godName, tier) => {
    if (tier === 1) return user?.god_talents_tier1?.[godName];
    if (tier === 2) return user?.god_talents_tier2?.[godName];
    if (tier === 3) return user?.god_talents_tier3?.[godName];
    if (tier === 4) return user?.god_talents_tier4?.[godName];
    return null;
  };

  const canSelectTier = (godName, tier) => {
    const runs = getGodRuns(godName);
    if (tier === 1) return runs >= 1;
    if (tier === 2) return runs >= 3;
    if (tier === 3) return runs >= 6;
    if (tier === 4) return runs >= 10 && (godName === 'Cthulhu' || godName === 'Hades' || godName === 'Athena' || godName === 'Thor' || godName === 'Shiva' || godName === 'Anubis' || godName === 'Baron Samedi' || godName === 'Ra' || godName === 'Loki' || godName === 'Quetzalcoatl' || godName === 'Ganesha' || godName === 'Odin');
    return false;
  };

  const handleSelectTalent = async (godName, tier, talentKey) => {
    if (!canSelectTier(godName, tier)) return;
    
    setSaving(true);
    try {
      const fieldName = `god_talents_tier${tier}`;
      const currentTalents = user?.[fieldName] || {};
      const newTalents = { ...currentTalents, [godName]: talentKey };
      
      await base44.auth.updateMe({ [fieldName]: newTalents });
      await loadUserData();
    } catch (error) {
      console.error("Failed to save talent:", error);
    } finally {
      setSaving(false);
    }
  };

  // Filter out Zeus, Odin, Hades, and Cthulhu
  const godNames = Object.keys(GOD_TALENTS).filter(god =>
    god !== 'Zeus' &&
    god !== 'Odin' &&
    god !== 'Hades' &&
    god !== 'Cthulhu'
  );

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-black border-amber-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-4xl text-amber-400 flex items-center gap-3 mb-2">
            <Star className="w-10 h-10" />
            Divine Talent Trees
          </DialogTitle>
          <DialogDescription className="text-xl text-gray-300">
            Complete runs to unlock permanent upgrades for each god
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-16 h-16 animate-spin text-amber-400" />
          </div>
        ) : (
          <Tabs value={selectedGod} onValueChange={setSelectedGod} className="w-full">
            <TabsList className="w-full flex flex-wrap bg-black/60 p-3 gap-3 h-auto mb-6 border border-amber-700/30">
              {godNames.map(god => {
                const runs = getGodRuns(god);
                const tier1Selected = getSelectedTalent(god, 1);
                const tier2Selected = getSelectedTalent(god, 2);
                const tier3Selected = getSelectedTalent(god, 3);
                const tier4Selected = getSelectedTalent(god, 4);
                const hasAnyTalent = tier1Selected || tier2Selected || tier3Selected || tier4Selected;
                
                return (
                  <TabsTrigger 
                    key={god} 
                    value={god} 
                    className="flex-1 min-w-[140px] data-[state=active]:bg-amber-600 relative py-3 text-base font-semibold"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-base">{god}</span>
                      <span className="text-sm text-gray-300 font-normal">
                        {runs} {runs === 1 ? 'run' : 'runs'}
                      </span>
                      {hasAnyTalent && (
                        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center border-2 border-black">
                          <Check className="w-3 h-3 text-black" />
                        </div>
                      )}
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {godNames.map(god => (
              <TabsContent key={god} value={god} className="mt-8 space-y-10">
                {/* Tier 1 */}
                <div>
                  <div className="flex items-center gap-4 mb-6 pb-3 border-b-2 border-yellow-500/50">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                    <div>
                      <h3 className="text-3xl font-bold text-yellow-400">Tier 1 Talents</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {canSelectTier(god, 1) ? (
                          <>
                            <Check className="w-5 h-5 text-green-400" />
                            <span className="text-base text-green-300">Unlocked - 1 run completed</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5 text-gray-500" />
                            <span className="text-base text-gray-400">Requires 1 run</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {Object.entries(GOD_TALENTS[god].tier1).map(([key, talent]) => {
                      const isSelected = getSelectedTalent(god, 1) === key;
                      const canSelect = canSelectTier(god, 1);
                      
                      return (
                        <TalentCard
                          key={key}
                          talent={talent}
                          isSelected={isSelected}
                          canSelect={canSelect}
                          onClick={() => handleSelectTalent(god, 1, key)}
                          saving={saving}
                          tier={1}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Tier 2 */}
                <div>
                  <div className="flex items-center gap-4 mb-6 pb-3 border-b-2 border-cyan-500/50">
                    <Trophy className="w-8 h-8 text-cyan-400" />
                    <div>
                      <h3 className="text-3xl font-bold text-cyan-400">Tier 2 Talents</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {canSelectTier(god, 2) ? (
                          <>
                            <Check className="w-5 h-5 text-green-400" />
                            <span className="text-base text-green-300">Unlocked - 3 runs completed</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5 text-gray-500" />
                            <span className="text-base text-gray-400">Requires 3 runs</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {Object.entries(GOD_TALENTS[god].tier2).map(([key, talent]) => {
                      const isSelected = getSelectedTalent(god, 2) === key;
                      const canSelect = canSelectTier(god, 2);
                      
                      return (
                        <TalentCard
                          key={key}
                          talent={talent}
                          isSelected={isSelected}
                          canSelect={canSelect}
                          onClick={() => handleSelectTalent(god, 2, key)}
                          saving={saving}
                          tier={2}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Tier 3 */}
                <div>
                  <div className="flex items-center gap-4 mb-6 pb-3 border-b-2 border-amber-500/50">
                    <Crown className="w-8 h-8 text-amber-400" />
                    <div>
                      <h3 className="text-3xl font-bold text-amber-400">Tier 3 Talents</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {canSelectTier(god, 3) ? (
                          <>
                            <Check className="w-5 h-5 text-green-400" />
                            <span className="text-base text-green-300">Unlocked - 6 runs completed</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5 text-gray-500" />
                            <span className="text-base text-gray-400">Requires 6 runs</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {Object.entries(GOD_TALENTS[god].tier3).map(([key, talent]) => {
                      const isSelected = getSelectedTalent(god, 3) === key;
                      const canSelect = canSelectTier(god, 3);
                      
                      return (
                        <TalentCard
                          key={key}
                          talent={talent}
                          isSelected={isSelected}
                          canSelect={canSelect}
                          onClick={() => handleSelectTalent(god, 3, key)}
                          saving={saving}
                          tier={3}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Tier 4 (Special Gods Only) */}
                {(god === 'Cthulhu' || god === 'Hades' || god === 'Athena' || god === 'Thor' || god === 'Shiva' || god === 'Anubis' || god === 'Baron Samedi' || god === 'Ra' || god === 'Loki' || god === 'Quetzalcoatl' || god === 'Ganesha' || god === 'Odin') && GOD_TALENTS[god].tier4 && (
                  <div>
                    <div className="flex items-center gap-4 mb-6 pb-3 border-b-2 border-purple-500/50">
                      <Crown className="w-9 h-9 text-purple-500 animate-pulse" />
                      <div>
                        <h3 className="text-3xl font-bold text-purple-500">
                          Tier 4 Talent - {
                            god === 'Cthulhu' ? 'ELDER GOD' : 
                            god === 'Hades' ? 'LORD OF WEALTH' :
                            god === 'Athena' ? 'DIVINE ASCENSION' :
                            god === 'Thor' ? 'GODLY MIGHT' :
                            god === 'Shiva' ? 'COSMIC DESTROYER' :
                            god === 'Anubis' ? 'ETERNAL SCALES' :
                            god === 'Baron Samedi' ? 'DEATH\'S JEST' :
                            god === 'Ra' ? 'SUN GOD SUPREME' :
                            god === 'Loki' ? 'ULTIMATE TRICKSTER' :
                            god === 'Quetzalcoatl' ? 'FEATHERED SERPENT GOD' :
                            god === 'Ganesha' ? 'PATH OF ENLIGHTENMENT' :
                            god === 'Odin' ? 'ALLFATHER' :
                            ''
                          }
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {canSelectTier(god, 4) ? (
                            <>
                              <Check className="w-5 h-5 text-green-400" />
                              <span className="text-base text-green-300">Unlocked - 10 runs completed</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-5 h-5 text-gray-500" />
                              <span className="text-base text-gray-400">Requires 10 runs</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      {Object.entries(GOD_TALENTS[god].tier4).map(([key, talent]) => {
                        const isSelected = getSelectedTalent(god, 4) === key;
                        const canSelect = canSelectTier(god, 4);
                        
                        return (
                          <TalentCard
                            key={key}
                            talent={talent}
                            isSelected={isSelected}
                            canSelect={canSelect}
                            onClick={() => handleSelectTalent(god, 4, key)}
                            saving={saving}
                            tier={4}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TalentCard({ talent, isSelected, canSelect, onClick, saving, tier = 1 }) {
  const borderColor = tier === 4 ? 'border-purple-600' : tier === 3 ? 'border-amber-500' : tier === 2 ? 'border-cyan-500' : 'border-yellow-500';
  const bgColor = tier === 4 ? 'bg-purple-950/40' : tier === 3 ? 'bg-amber-950/40' : tier === 2 ? 'bg-cyan-950/40' : 'bg-yellow-950/40';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={canSelect && !isSelected ? { scale: 1.03 } : {}}
    >
      <Card 
        className={`relative overflow-hidden cursor-pointer transition-all min-h-[200px] flex flex-col ${
          isSelected 
            ? `ring-4 ring-green-500 ${bgColor}` 
            : canSelect 
              ? `${bgColor} hover:bg-opacity-60` 
              : 'bg-gray-900/70 opacity-50 cursor-not-allowed'
        } ${borderColor} border-3 p-6`}
        onClick={() => canSelect && !saving && onClick()}
      >
        {!canSelect && (
          <div className="absolute top-3 right-3">
            <Lock className="w-7 h-7 text-gray-500" />
          </div>
        )}
        
        {isSelected && (
          <div className="absolute top-3 right-3">
            <div className="bg-green-500 rounded-full p-1.5">
              <Check className="w-6 h-6 text-white" />
            </div>
          </div>
        )}

        <div className="text-5xl mb-4 text-center">{talent.icon}</div>
        <h4 className="text-xl font-bold text-white mb-3 text-center leading-tight">{talent.name}</h4>
        <p className="text-base text-gray-200 text-center leading-relaxed flex-grow">{talent.description}</p>
      </Card>
    </motion.div>
  );
}


import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Sparkles, Star, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

const GOD_TALENTS = {
  Athena: {
    static_ability: "When you play a Shield card, gain 1 Energy.",
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
    }
  },
  Zeus: {
    static_ability: "Every time you deal damage, there's a 10% chance to deal 2 bonus damage.",
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
    static_ability: "Every 2nd damage card played applies Stun to the enemy.",
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
        icon: "⚡🔨💥"
      }
    }
  },
  Anubis: {
    static_ability: "When you defeat an enemy, heal 2 Health.",
    tier1: {
      soul_harvest: {
        name: "Soul Harvest",
        description: "Heal 5 Health after each battle.",
        icon: "💀❤️"
      },
      eternal_guardian: {
        name: "Eternal Guardian",
        description: "+20 Max Health.",
        icon: "🛡️"
      },
      death_touch: {
        name: "Death's Touch",
        description: "Attack cards deal +3 damage.",
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
        description: "The first time you would take fatal damage each battle, survive with 1 Health instead.",
        icon: "💀🛡️"
      },
      life_drain: {
        name: "Life Drain",
        description: "Heal 5 Health whenever you play a damage card.",
        icon: "❤️⚡"
      }
    },
    tier3: {
      judge_of_souls: {
        name: "Judge of Souls",
        description: "Heal for 100% of damage dealt (doubled from base 50%).",
        icon: "💀❤️✨"
      },
      eternal_curse: {
        name: "Eternal Curse",
        description: "Enemies take 5 damage at the start of their turn.",
        icon: "💀⚡"
      },
      death_defiance: {
        name: "Death Defiance",
        description: "Cheat death twice per battle instead of once.",
        icon: "💀🛡️⚡"
      }
    }
  },
  Hades: {
    static_ability: "Enemies lose 1 Health at the start of your turn.",
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
    static_ability: "Cycle of Creation and Destruction: When you play 3 different types of cards (Damage, Shield, Heal) in one turn, your next attack deals +8 damage.",
    tier1: {
      cosmic_dance: {
        name: "Many Arms",
        description: "After playing two cards of the same type, the next card of that type costs 1 less Energy.",
        icon: "💃"
      },
      destructive_power: {
        name: "Destructive Power",
        description: "Attack cards deal +4 damage.",
        icon: "💥"
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
    }
  },
  Ra: {
    static_ability: "Solar Ascension: Whenever you play a heal card, your next damage card deals +6 damage.",
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
        description: "Solar Fury now grants +2 Energy instead of +1 (while at full Health).",
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
    static_ability: "Discarding a card grants 1 Shield.",
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
        description: "Once per turn, discard a card and draw a new one.",
        icon: "🌬️"
      }
    },
    tier2: {
      divine_knowledge: {
        name: "Divine Knowledge",
        description: "Draw +2 cards at the start of each turn.",
        icon: "📚"
      },
      feathered_serpent: {
        name: "Feathered Serpent",
        description: "Each card drawn has a 10% chance to cost 1 less this turn.",
        icon: "🪶"
      },
      wind_master: {
        name: "Wind Master",
        description: "Whispering Winds can be used twice per turn.",
        icon: "🌪️"
      }
    },
    tier3: {
      storm_caller: {
        name: "Storm Caller",
        description: "When you use Whispering Winds, gain 1 Energy.",
        icon: "🌬️⚡"
      },
      sky_lord: {
        name: "Sky Lord",
        description: "At the start of your turn, draw cards until you have 7 in hand.",
        icon: "🪶👑"
      },
      feathered_ascension: { // Changed from feathered_serpent
        name: "Feathered Ascension", // Changed from Feathered Serpent
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
    static_ability: "Unstable Trickster: At the start of each turn, one random card in your hand costs 1 less (minimum 0).",
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
    static_ability: "Eldritch Touch: When you discard a card, apply Vulnerable to the enemy.",
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
      },
    },
    tier4: {
      depths_of_madness: {
        name: "Depths of Madness",
        description: "When you discard a card, gain 1 temporary energy.",
        icon: "🌊💀"
      }
    }
  },
  "Baron Samedi": {
    static_ability: "When an enemy is afflicted with Poison, heal 1 Health at the end of your turn.",
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
    static_ability: "Gain 1 Energy at the start of battle.",
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
    }
  },
  Anansi: {
    static_ability: "Web Weaver: When you play a 0 or 1 cost card, gain 2 Shield.",
    tier1: {
      tangle_sense: {
        name: "Tangle Sense",
        description: "When you play a Shield card, draw 1 if you have fewer than 3 cards in hand.",
        icon: "🕷️"
      },
      web_spinner: {
        name: "Web Spinner",
        description: "Every 3rd card you play refunds 1 Energy.",
        icon: "📜"
      },
      thread_memory: {
        name: "Thread Memory",
        description: "When you reshuffle your deck, heal 10 HP.",
        icon: "🎭"
      }
    },
    tier2: {
      grand_storyteller: {
        name: "Grand Storyteller",
        description: "Every 5th card you play gains a random +10 bonus effect (damage, shield, or heal).",
        icon: "🪡"
      },
      silken_power: {
        name: "Silken Power",
        description: "Gain +2 Shield per card drawn that turn.",
        icon: "🕸️"
      },
      confounding_web: {
        name: "Confounding Web",
        description: "Enemies start each battle Confused (1) — 50% chance to skip first attack.",
        icon: "🌀"
      }
    },
    tier3: {
      author_of_fate: {
        name: "Author of Fate",
        description: "Once per battle, replay your last card for free.",
        icon: "📖"
      },
      infinite_thread: {
        name: "Infinite Thread",
        description: "Drawing 3+ cards in one turn refunds 1 Energy.",
        icon: "🕷️"
      },
      master_trickster: {
        name: "Master Trickster",
        description: "Every 10th card you play this battle costs 0 and deals double damage.",
        icon: "🎭"
      }
    }
  }
};

export default function GodAbilitiesModal({ open, onClose, god, godTalents }) {
  if (!god) return null;

  const getTalentInfo = (tier, talentKey) => {
    if (!talentKey || !GOD_TALENTS[god.name]) return null;
    return GOD_TALENTS[god.name][tier]?.[talentKey];
  };

  const currentGodData = GOD_TALENTS[god.name];
  const displayedStaticAbility = currentGodData?.static_ability || god.static_ability || "No static ability defined.";

  const tier1Talent = getTalentInfo('tier1', godTalents?.tier1);
  const tier2Talent = getTalentInfo('tier2', godTalents?.tier2);
  const tier3Talent = getTalentInfo('tier3', godTalents?.tier3);
  const tier4Talent = getTalentInfo('tier4', godTalents?.tier4);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-black border-purple-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-4xl text-purple-300 flex items-center gap-3 mb-2">
            <img src={god.image} alt={god.name} className="w-16 h-16 rounded-full border-2 border-purple-500" />
            {god.name}
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-lg">
            Your god's innate power and selected talents for this run
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Static Ability */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-amber-900/40 to-yellow-900/40 border-2 border-amber-600 p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <Sparkles className="w-8 h-8 text-amber-400" />
                <div>
                  <h3 className="text-2xl font-bold text-amber-300">Static Ability</h3>
                  <span className="text-xs bg-amber-600 text-white px-3 py-1 rounded-full font-bold">ALWAYS ACTIVE</span>
                </div>
              </div>
              <p className="text-white text-xl leading-relaxed font-medium">
                {displayedStaticAbility}
              </p>
            </Card>
          </motion.div>

          {/* Selected Talents */}
          {(tier1Talent || tier2Talent || tier3Talent || tier4Talent) && (
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-purple-300 flex items-center gap-3 border-b-2 border-purple-500 pb-3">
                <Star className="w-7 h-7" />
                Selected Talents
              </h3>

              {tier1Talent && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500 p-6 shadow-xl">
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{tier1Talent.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-5 h-5 text-yellow-400" />
                          <span className="text-xs font-bold text-yellow-400 tracking-wider">TIER 1</span>
                        </div>
                        <h4 className="text-2xl font-bold text-white mb-2">{tier1Talent.name}</h4>
                        <p className="text-gray-200 text-lg leading-relaxed">{tier1Talent.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {tier2Talent && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-2 border-cyan-500 p-6 shadow-xl">
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{tier2Talent.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-5 h-5 text-cyan-400" />
                          <Star className="w-5 h-5 text-cyan-400" />
                          <span className="text-xs font-bold text-cyan-400 tracking-wider">TIER 2</span>
                        </div>
                        <h4 className="text-2xl font-bold text-white mb-2">{tier2Talent.name}</h4>
                        <p className="text-gray-200 text-lg leading-relaxed">{tier2Talent.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {tier3Talent && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500 p-6 shadow-xl">
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{tier3Talent.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-6 h-6 text-purple-400" />
                          <span className="text-xs font-bold text-purple-400 tracking-wider">TIER 3</span>
                        </div>
                        <h4 className="text-2xl font-bold text-white mb-2">{tier3Talent.name}</h4>
                        <p className="text-gray-200 text-lg leading-relaxed">{tier3Talent.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {tier4Talent && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="bg-gradient-to-br from-purple-950/50 to-indigo-950/50 border-2 border-purple-600 p-6 shadow-2xl animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{tier4Talent.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-7 h-7 text-purple-500 animate-pulse" />
                          <span className="text-xs font-bold text-purple-500 tracking-wider">TIER 4 - ELDER GOD</span>
                        </div>
                        <h4 className="text-2xl font-bold text-white mb-2">{tier4Talent.name}</h4>
                        <p className="text-gray-200 text-lg leading-relaxed">{tier4Talent.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          )}

          {!tier1Talent && !tier2Talent && !tier3Talent && !tier4Talent && (
            <Card className="bg-black/40 border-gray-700 p-8 text-center">
              <p className="text-gray-400 text-xl mb-2">No talents selected for this run.</p>
              <p className="text-gray-500 text-base">Complete runs to unlock permanent upgrades!</p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

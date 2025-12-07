
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check if user is admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        const godAbilities = {
            'Zeus': 'Conduit of Power: Every 3rd attack played in a turn refunds 1 energy and applies Vulnerable for 1 turn.',
            'Thor': 'Shocking Strike: Every 2nd damage card played applies Stun to the enemy.',
            'Shiva': 'Cycle of Creation and Destruction: When you play 3 different types of cards (Damage, Shield, Heal) in one turn, your next attack deals +8 damage.',
            'Hades': 'Power Over Death: When Hades reaches 0 HP, restore his HP to 50. This effect triggers once per battle.',
            'Anubis': 'Balancing the Scales: While Anubis is at 50% or less HP, card effects are increased by an additional half.',
            'Baron Samedi': 'Deal with Death: When you apply Burn or deal damage over time, heal for 3 HP.',
            'Ra': 'Solar Ascension: Whenever you play a heal card, your next damage card deals +6 damage.',
            'Cthulhu': 'Eldritch Touch: Attack cards have a 25% chance to apply Vulnerable.',
            'Loki': 'Unstable Trickster: At the start of each turn, one random card in your hand costs 1 less (minimum 0).',
            'Quetzalcoatl': 'Feathered Serpent: Each card you draw has a 10% chance to cost 1 less energy this turn.',
            'Athena': 'Aegis of Valor: Gain Shield equal to 50% of damage dealt.',
            'Odin': 'Allfather\'s Wisdom: Draw 1 extra card at the start of each turn.'
        };

        const gods = await base44.asServiceRole.entities.God.list();
        const results = [];

        for (const god of gods) {
            if (godAbilities[god.name]) {
                await base44.asServiceRole.entities.God.update(god.id, {
                    static_ability: godAbilities[god.name]
                });
                results.push({ god: god.name, updated: true });
            } else {
                results.push({ god: god.name, updated: false, reason: 'No ability defined' });
            }
        }

        return Response.json({
            success: true,
            results
        });

    } catch (error) {
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});

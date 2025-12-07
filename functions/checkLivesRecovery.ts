import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentLives = user.lives ?? 5;
        const maxLives = user.lives_max ?? 5;
        
        // If already at max, no recovery needed
        if (currentLives >= maxLives) {
            return Response.json({ 
                lives: currentLives,
                maxLives,
                nextRecoveryIn: null,
                recovered: 0
            });
        }

        const lastRecovery = user.last_life_recovery ? new Date(user.last_life_recovery) : new Date();
        const now = new Date();
        const hoursSinceLastRecovery = (now - lastRecovery) / (1000 * 60 * 60);
        
        const livesToRecover = Math.floor(hoursSinceLastRecovery);
        
        if (livesToRecover > 0) {
            const newLives = Math.min(currentLives + livesToRecover, maxLives);
            const newLastRecovery = new Date(lastRecovery.getTime() + (livesToRecover * 60 * 60 * 1000));
            
            await base44.asServiceRole.entities.User.update(user.id, {
                lives: newLives,
                last_life_recovery: newLastRecovery.toISOString()
            });
            
            // Calculate time until next recovery if not at max
            let nextRecoveryIn = null;
            if (newLives < maxLives) {
                const millisUntilNext = (60 * 60 * 1000) - (now - newLastRecovery);
                nextRecoveryIn = Math.ceil(millisUntilNext / 1000 / 60); // Minutes
            }
            
            return Response.json({ 
                lives: newLives,
                maxLives,
                nextRecoveryIn,
                recovered: livesToRecover
            });
        }
        
        // Calculate time until next recovery
        const millisUntilNext = (60 * 60 * 1000) - (now - lastRecovery);
        const nextRecoveryIn = Math.ceil(millisUntilNext / 1000 / 60); // Minutes
        
        return Response.json({ 
            lives: currentLives,
            maxLives,
            nextRecoveryIn,
            recovered: 0
        });

    } catch (error) {
        console.error('Lives recovery check error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});
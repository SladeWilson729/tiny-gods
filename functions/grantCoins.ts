import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, amount } = await req.json();

        if (!userId || !amount || amount <= 0) {
            return Response.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        const targetUser = await base44.asServiceRole.entities.User.get(userId);
        if (!targetUser) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const currentCoins = targetUser.gold_coins || 0;
        const newCoins = currentCoins + amount;

        await base44.asServiceRole.entities.User.update(userId, {
            gold_coins: newCoins
        });

        return Response.json({ 
            success: true, 
            newBalance: newCoins,
            amountGranted: amount
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userQuestId } = await req.json();

        if (!userQuestId) {
            return Response.json({ error: 'User quest ID required' }, { status: 400 });
        }

        // Load user quest
        const userQuest = await base44.asServiceRole.entities.UserQuest.get(userQuestId);
        
        if (!userQuest) {
            return Response.json({ error: 'Quest not found' }, { status: 404 });
        }
        
        if (userQuest.user_email !== user.email) {
            return Response.json({ error: 'Not your quest' }, { status: 403 });
        }
        
        if (!userQuest.is_completed) {
            return Response.json({ error: 'Quest not completed' }, { status: 400 });
        }
        
        if (userQuest.is_claimed) {
            return Response.json({ error: 'Reward already claimed' }, { status: 400 });
        }
        
        // Load quest details
        const quest = await base44.asServiceRole.entities.Quest.get(userQuest.quest_id);
        
        if (!quest) {
            return Response.json({ error: 'Quest definition not found' }, { status: 404 });
        }
        
        // Grant rewards
        const currentFavor = user.favor_tokens || 0;
        const currentEssence = user.essence_crystals || 0;
        
        const updateData = {
            favor_tokens: currentFavor + quest.reward_favor,
            essence_crystals: currentEssence + quest.reward_essence
        };
        
        await base44.asServiceRole.entities.User.update(user.id, updateData);
        
        // Mark as claimed
        await base44.asServiceRole.entities.UserQuest.update(userQuestId, {
            is_claimed: true
        });
        
        console.log(`Quest reward claimed: ${quest.title} by ${user.email}`);
        
        return Response.json({ 
            success: true,
            rewards: {
                favor: quest.reward_favor,
                essence: quest.reward_essence
            },
            newBalances: {
                favor: currentFavor + quest.reward_favor,
                essence: currentEssence + quest.reward_essence
            }
        });

    } catch (error) {
        console.error('Quest claim error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});
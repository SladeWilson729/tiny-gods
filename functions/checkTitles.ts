import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { runId } = await req.json();

        // Fetch the game run to get context
        const run = await base44.entities.GameRun.get(runId);
        if (!run) {
            return Response.json({ error: 'Run not found' }, { status: 404 });
        }

        // Fetch god data if needed
        const god = await base44.entities.God.get(run.god_id);

        // Get all title rewards
        const allTitles = await base44.asServiceRole.entities.TitleReward.list();
        
        // Get current user's unlocked titles
        const currentUnlockedTitles = user.unlocked_titles || [];
        const newlyUnlockedTitles = [];

        for (const title of allTitles) {
            // Skip if already unlocked
            if (currentUnlockedTitles.includes(title.id)) {
                continue;
            }

            let unlocked = false;

            if (title.unlock_criteria_type === 'always_unlocked') {
                unlocked = true;
            } else if (title.unlock_criteria_type === 'win_x_runs') {
                unlocked = (user.total_victories || 0) >= title.unlock_criteria_value;
            } else if (title.unlock_criteria_type === 'win_x_runs_with_god') {
                const godRuns = user.god_runs_completed || {};
                const targetGod = title.unlock_criteria_target_id || god.name;
                unlocked = (godRuns[targetGod] || 0) >= title.unlock_criteria_value;
            } else if (title.unlock_criteria_type === 'defeat_x_bosses') {
                const estimatedBosses = Math.floor((user.total_victories || 0) / 5);
                unlocked = estimatedBosses >= title.unlock_criteria_value;
            } else if (title.unlock_criteria_type === 'defeat_specific_boss') {
                // Would need specific boss defeat tracking - skip for now
                unlocked = false;
            } else if (title.unlock_criteria_type === 'reach_x_divine_rank') {
                unlocked = (user.highest_rank_completed || 0) >= title.unlock_criteria_value;
            } else if (title.unlock_criteria_type === 'complete_x_achievements') {
                const userAchievements = await base44.asServiceRole.entities.UserAchievement.filter({
                    user_id: user.id,
                    is_unlocked: true
                });
                unlocked = userAchievements.length >= title.unlock_criteria_value;
            } else if (title.unlock_criteria_type === 'earn_x_achievement_points') {
                unlocked = (user.achievement_points || 0) >= title.unlock_criteria_value;
            } else if (title.unlock_criteria_type === 'win_hard_mode') {
                unlocked = user.has_won_hard_mode || false;
            } else if (title.unlock_criteria_type === 'win_heroic_mode') {
                unlocked = user.has_won_heroic_mode || false;
            } else if (title.unlock_criteria_type === 'win_mythic_mode') {
                unlocked = user.has_won_mythic_mode || false;
            } else if (title.unlock_criteria_type === 'win_wild_mode') {
                unlocked = (user.wild_mode_victories || 0) >= title.unlock_criteria_value;
            } else if (title.unlock_criteria_type === 'collect_x_relics') {
                unlocked = (user.total_relics_collected || 0) >= title.unlock_criteria_value;
            } else if (title.unlock_criteria_type === 'complete_all_gods') {
                const allGodsData = await base44.asServiceRole.entities.God.list();
                const godRunsData = user.god_runs_completed || {};
                const completedGodsCount = allGodsData.filter(g => (godRunsData[g.name] || 0) >= title.unlock_criteria_value).length;
                unlocked = completedGodsCount >= allGodsData.length;
            }

            if (unlocked) {
                newlyUnlockedTitles.push({
                    id: title.id,
                    name: title.name,
                    description: title.description,
                    rarity: title.rarity,
                    color: title.color
                });
            }
        }

        // Update user's unlocked titles if any new ones
        if (newlyUnlockedTitles.length > 0) {
            const updatedUnlockedTitles = [
                ...currentUnlockedTitles,
                ...newlyUnlockedTitles.map(t => t.id)
            ];

            await base44.asServiceRole.entities.User.update(user.id, {
                unlocked_titles: updatedUnlockedTitles
            });
        }

        return Response.json({
            success: true,
            newly_unlocked: newlyUnlockedTitles,
            total_unlocked: currentUnlockedTitles.length + newlyUnlockedTitles.length
        });

    } catch (error) {
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});
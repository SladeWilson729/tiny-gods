
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { runId } = await req.json();

        // Get the run data to extract stats
        const run = runId ? await base44.entities.GameRun.get(runId) : null;
        
        // Get all achievements
        const allAchievements = await base44.asServiceRole.entities.Achievement.list();
        
        // Get user's current achievement records
        const userAchievements = await base44.asServiceRole.entities.UserAchievement.filter({
            user_id: user.id
        });

        const newlyUnlocked = [];
        const totalRewards = {
            coins: 0,
            points: 0
        };

        for (const achievement of allAchievements) {
            // Check if user already has this achievement
            let existing = userAchievements.find(ua => ua.achievement_id === achievement.id);
            
            if (existing && existing.is_unlocked) {
                // Already unlocked, skip
                continue;
            }

            // Check if the achievement criteria is met and get progress
            const { isMet, currentProgress } = checkCriteria(achievement, user, run);

            // Update progress even if not yet unlocked (for tracking)
            if (!existing && currentProgress > 0) {
                // Create a new UserAchievement record for progress tracking
                existing = await base44.asServiceRole.entities.UserAchievement.create({
                    user_id: user.id,
                    achievement_id: achievement.id,
                    is_unlocked: false,
                    progress_current: currentProgress,
                    unlocked_date: null // Explicitly null for not-yet-unlocked achievements
                });
            } else if (existing && !existing.is_unlocked && currentProgress > existing.progress_current) {
                // Update existing UserAchievement progress if it's improved
                await base44.asServiceRole.entities.UserAchievement.update(existing.id, {
                    progress_current: currentProgress
                });
                // Update the in-memory 'existing' object to reflect the change
                existing.progress_current = currentProgress;
            }

            if (isMet) {
                // This block executes if the achievement criteria are now met.
                // 'existing' variable will correctly point to the UserAchievement record
                // (either pre-existing, or newly created for progress in this iteration).
                
                console.log(`🏆 Achievement unlocked: ${achievement.title}`);

                const unlockData = {
                    is_unlocked: true,
                    unlocked_date: new Date().toISOString(),
                    progress_current: achievement.criteria_value // Set to target value upon unlock
                };

                if (existing) {
                    // Update the existing (or newly created progress) record to 'unlocked'
                    await base44.asServiceRole.entities.UserAchievement.update(existing.id, unlockData);
                } else {
                    // This path is taken if the achievement was completed in one go
                    // and no progress record existed or was created prior in this loop.
                    await base44.asServiceRole.entities.UserAchievement.create({
                        user_id: user.id,
                        achievement_id: achievement.id,
                        ...unlockData
                    });
                }

                // Apply rewards
                if (achievement.reward_type === 'coins' && achievement.reward_value) {
                    const coins = parseInt(achievement.reward_value);
                    if (!isNaN(coins)) {
                        totalRewards.coins += coins;
                    }
                }

                if (achievement.reward_type === 'points' && achievement.reward_value) {
                    const points = parseInt(achievement.reward_value);
                    if (!isNaN(points)) {
                        totalRewards.points += points;
                    }
                }

                newlyUnlocked.push({
                    id: achievement.id,
                    title: achievement.title,
                    description: achievement.description,
                    icon_name: achievement.icon_name,
                    reward_type: achievement.reward_type,
                    reward_value: achievement.reward_value
                });
            }
        }

        // Apply coin rewards to user
        if (totalRewards.coins > 0) {
            const currentCoins = user.gold_coins || 0;
            await base44.asServiceRole.entities.User.update(user.id, {
                gold_coins: currentCoins + totalRewards.coins
            });
        }

        // Apply achievement points to user
        if (totalRewards.points > 0) {
            const currentPoints = user.achievement_points || 0;
            await base44.asServiceRole.entities.User.update(user.id, {
                achievement_points: currentPoints + totalRewards.points
            });

            // Update leaderboard entry with new achievement points
            const leaderboardEntries = await base44.asServiceRole.entities.LeaderboardEntry.filter({ 
                user_email: user.email 
            });

            if (leaderboardEntries.length > 0) {
                await base44.asServiceRole.entities.LeaderboardEntry.update(leaderboardEntries[0].id, {
                    achievement_points: currentPoints + totalRewards.points
                });
            }
        }

        return Response.json({
            success: true,
            newlyUnlocked,
            totalRewards
        });

    } catch (error) {
        console.error('Achievement check error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});

function checkCriteria(achievement, user, run) {
    const { criteria_type, criteria_value, criteria_target_id } = achievement;

    switch (criteria_type) {
        case 'win_run':
            return { 
                isMet: user.has_won_run === true, 
                currentProgress: user.has_won_run ? 1 : 0 
            };

        case 'complete_runs': {
            // Changed to count user's total_victories (winning runs)
            const current = user.total_victories || 0; 
            return { 
                isMet: current >= criteria_value, 
                currentProgress: current 
            };
        }

        case 'win_run_with_god': {
            if (!criteria_target_id) return { isMet: false, currentProgress: 0 };
            const godRuns = user.god_runs_completed || {};
            const current = godRuns[criteria_target_id] || 0;
            return { 
                isMet: current >= criteria_value, 
                currentProgress: current 
            };
        }

        case 'win_hard_mode':
            return { 
                isMet: user.has_won_hard_mode === true, 
                currentProgress: user.has_won_hard_mode ? 1 : 0 
            };

        case 'win_heroic_mode':
            return { 
                isMet: user.has_won_heroic_mode === true, 
                currentProgress: user.has_won_heroic_mode ? 1 : 0 
            };

        case 'win_mythic_mode':
            return { 
                isMet: user.has_won_mythic_mode === true, 
                currentProgress: user.has_won_mythic_mode ? 1 : 0 
            };

        case 'defeat_enemies': {
            const current = user.total_victories || 0;
            return { 
                isMet: current >= criteria_value, 
                currentProgress: current 
            };
        }

        case 'play_cards': {
            const current = user.total_cards_played || 0;
            return { 
                isMet: current >= criteria_value, 
                currentProgress: current 
            };
        }

        case 'deal_total_damage': {
            const current = user.total_damage_dealt || 0;
            return { 
                isMet: current >= criteria_value, 
                currentProgress: current 
            };
        }

        case 'heal_total_hp': {
            const current = user.total_hp_healed || 0;
            return { 
                isMet: current >= criteria_value, 
                currentProgress: current 
            };
        }

        case 'collect_relics_total': {
            const current = user.total_relics_collected || 0;
            return { 
                isMet: current >= criteria_value, 
                currentProgress: current 
            };
        }

        case 'max_victories_in_run': {
            if (!run) return { isMet: false, currentProgress: 0 };
            const current = run.victories;
            return { 
                isMet: current >= criteria_value, 
                currentProgress: current 
            };
        }

        case 'reach_battle': {
            if (!run) return { isMet: false, currentProgress: 0 };
            const current = run.victories;
            return { 
                isMet: current >= criteria_value, 
                currentProgress: current 
            };
        }

        case 'defeat_boss': {
            if (!criteria_target_id) return { isMet: user.has_won_run === true, currentProgress: user.has_won_run ? 1 : 0 };
            return { isMet: false, currentProgress: 0 };
        }

        case 'defeat_elite_enemy':
            return { isMet: false, currentProgress: 0 };

        case 'survive_burn_damage': {
            const current = user.total_burn_survived || 0;
            return { 
                isMet: current >= criteria_value, 
                currentProgress: current 
            };
        }

        case 'survive_poison_damage': {
            const current = user.total_poison_survived || 0;
            return { 
                isMet: current >= criteria_value, 
                currentProgress: current 
            };
        }

        default:
            return { isMet: false, currentProgress: 0 };
    }
}

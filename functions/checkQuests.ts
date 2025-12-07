
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { runId } = await req.json();

        // Load run data for context
        // Ensure to use base44.asServiceRole for accessing service-level entities
        const run = runId ? await base44.asServiceRole.entities.GameRun.get(runId) : null;
        
        // Load all active quests
        const allQuests = await base44.asServiceRole.entities.Quest.filter({ is_active: true });
        
        // Load user's quest progress
        const userQuests = await base44.asServiceRole.entities.UserQuest.filter({ user_email: user.email });
        
        const now = new Date();
        const updatedQuests = [];
        
        for (const quest of allQuests) {
            // Find or create user quest
            let userQuest = userQuests.find(uq => uq.quest_id === quest.id);
            
            // Check if quest expired
            if (userQuest && userQuest.expires_at) {
                const expiresAt = new Date(userQuest.expires_at);
                if (now > expiresAt) {
                    // Reset expired quest by deleting it
                    await base44.asServiceRole.entities.UserQuest.delete(userQuest.id);
                    userQuest = null; // Mark as null so it can be re-created
                }
            }
            
            // Create new user quest if needed
            if (!userQuest) {
                const expiresAt = new Date();
                if (quest.quest_type === 'daily') {
                    expiresAt.setDate(expiresAt.getDate() + 1);
                    expiresAt.setHours(0, 0, 0, 0); // Set to start of next day
                } else if (quest.quest_type === 'weekly') {
                    // Set to the end of the current week (Sunday midnight)
                    expiresAt.setDate(expiresAt.getDate() + (7 - expiresAt.getDay()));
                    expiresAt.setHours(0, 0, 0, 0); 
                }
                
                userQuest = await base44.asServiceRole.entities.UserQuest.create({
                    user_email: user.email,
                    quest_id: quest.id,
                    progress: 0,
                    is_completed: false,
                    is_claimed: false,
                    // Permanent quests have no expiration
                    expires_at: quest.quest_type === 'permanent' ? null : expiresAt.toISOString()
                });
            }
            
            // Skip if already completed
            if (userQuest.is_completed) {
                continue;
            }
            
            // Calculate potential new progress for this quest based on user stats and current run.
            // This new logic replaces the previous `switch` statement for determining quest progress.
            let newProgressCalculated = userQuest.progress; // Initialize with current progress

            if (quest.objective_type === 'win_runs') {
                newProgressCalculated = user.total_victories || 0;
            } else if (quest.objective_type === 'complete_runs') {
                newProgressCalculated = user.total_completed_runs || 0;
            } else if (quest.objective_type === 'win_with_god') {
                if (quest.objective_target) {
                    // Assuming user.god_runs_completed reflects lifetime wins for specific gods
                    newProgressCalculated = user.god_runs_completed ? (user.god_runs_completed[quest.objective_target] || 0) : 0;
                }
            } else if (quest.objective_type === 'defeat_enemies') {
                // Combines current run's victories with a scaled value of user's total completed runs
                newProgressCalculated = (run?.victories || 0) + (user.total_completed_runs || 0) * 10;
            } else if (quest.objective_type === 'play_cards') {
                newProgressCalculated = user.total_cards_played || 0;
            } else if (quest.objective_type === 'deal_damage') {
                newProgressCalculated = user.total_damage_dealt || 0;
            } else if (quest.objective_type === 'collect_relics') {
                newProgressCalculated = user.total_relics_collected || 0;
            } else if (quest.objective_type === 'reach_battle') {
                // For 'reach_battle', progress should be the maximum number of victories achieved in any single run
                newProgressCalculated = Math.max(userQuest.progress, run?.victories || 0);
            } else if (quest.objective_type === 'win_hard_mode') {
                newProgressCalculated = user.has_won_hard_mode ? 1 : 0;
            } else if (quest.objective_type === 'win_heroic_mode') {
                newProgressCalculated = user.has_won_heroic_mode ? 1 : 0;
            } else if (quest.objective_type === 'play_combo_cards') {
                newProgressCalculated = user.total_combo_cards_played || 0;
            } else if (quest.objective_type === 'play_surge_cards') {
                newProgressCalculated = user.total_surge_cards_played || 0;
            } else if (quest.objective_type === 'play_charge_cards') {
                newProgressCalculated = user.total_charge_cards_played || 0;
            } else if (quest.objective_type === 'play_knowledge_cards') {
                newProgressCalculated = user.total_knowledge_cards_played || 0;
            } else if (quest.objective_type === 'play_leech_cards') {
                newProgressCalculated = user.total_leech_cards_played || 0;
            } else if (quest.objective_type === 'play_cards_with_burn') {
                newProgressCalculated = user.total_burn_cards_played || 0;
            } else if (quest.objective_type === 'play_cards_with_poison') {
                newProgressCalculated = user.total_poison_cards_played || 0;
            } else if (quest.objective_type === 'play_cards_with_vulnerable') {
                newProgressCalculated = user.total_vulnerable_cards_played || 0;
            } else if (quest.objective_type === 'play_cards_with_stun') {
                newProgressCalculated = user.total_stun_cards_played || 0;
            } else if (quest.objective_type === 'play_cards_with_confused') {
                newProgressCalculated = user.total_confused_cards_played || 0;
            } else if (quest.objective_type === 'play_self_damage_cards') {
                newProgressCalculated = user.total_self_damage_cards_played || 0;
            }
            // If the objective type is not explicitly covered above, `newProgressCalculated` retains its initial `userQuest.progress` value,
            // meaning no specific progress update is applied for this iteration based on the new rules.

            // The final progress value should not exceed the objective's target value.
            const finalProgress = Math.min(newProgressCalculated, quest.objective_value);
            
            // Only update the userQuest if progress has actually changed or the completion status changes.
            if (finalProgress !== userQuest.progress || (finalProgress >= quest.objective_value && !userQuest.is_completed)) {
                const isCompleted = finalProgress >= quest.objective_value;
                
                await base44.asServiceRole.entities.UserQuest.update(userQuest.id, {
                    progress: finalProgress,
                    is_completed: isCompleted,
                    // Set `completed_date` only if the quest is newly completed.
                    // If it was already completed (userQuest.is_completed was true), preserve its existing date.
                    completed_date: isCompleted && !userQuest.is_completed ? now.toISOString() : userQuest.completed_date
                });
                
                // If the quest just became completed in this update, add it to the list of newly completed quests.
                if (isCompleted && !userQuest.is_completed) {
                    updatedQuests.push({
                        questId: quest.id,
                        title: quest.title,
                        newlyCompleted: true
                    });
                }
            }
        }
        
        return Response.json({ 
            success: true,
            updatedQuests
        });

    } catch (error) {
        console.error('Quest check error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});

import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check if user is admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        // Get all users
        const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 10000);
        
        let updatedCount = 0;
        const errors = [];

        for (const userRecord of allUsers) {
            try {
                await base44.asServiceRole.entities.User.update(userRecord.id, {
                    has_won_run: false,
                    has_won_hard_mode: false,
                    has_won_heroic_mode: false,
                    total_completed_runs: 0,
                    total_victories: 0,
                    god_runs_completed: {},
                    god_talents_tier1: {},
                    god_talents_tier2: {},
                    god_talents_tier3: {}
                });
                updatedCount++;
            } catch (error) {
                errors.push({
                    user: userRecord.email,
                    error: error.message
                });
            }
        }

        // Reset all game runs
        const allRuns = await base44.asServiceRole.entities.GameRun.list('-created_date', 10000);
        let runsDeleted = 0;
        
        for (const run of allRuns) {
            try {
                await base44.asServiceRole.entities.GameRun.delete(run.id);
                runsDeleted++;
            } catch (error) {
                errors.push({
                    run: run.id,
                    error: error.message
                });
            }
        }

        // Reset all leaderboard entries
        const allLeaderboard = await base44.asServiceRole.entities.LeaderboardEntry.list('-created_date', 10000);
        let leaderboardDeleted = 0;
        
        for (const entry of allLeaderboard) {
            try {
                await base44.asServiceRole.entities.LeaderboardEntry.delete(entry.id);
                leaderboardDeleted++;
            } catch (error) {
                errors.push({
                    leaderboard: entry.id,
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            summary: {
                users_reset: updatedCount,
                total_users: allUsers.length,
                runs_deleted: runsDeleted,
                leaderboard_entries_deleted: leaderboardDeleted,
                errors: errors.length > 0 ? errors : null
            }
        });

    } catch (error) {
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});

import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check if user is admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        // Get all users with completed runs
        const allUsers = await base44.asServiceRole.entities.User.list('-total_completed_runs', 10000);
        
        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const userRecord of allUsers) {
            const totalRuns = userRecord.total_completed_runs || 0;
            const totalVictories = userRecord.total_victories || 0;
            const wildModeVictories = userRecord.wild_mode_victories || 0;
            const achievementPoints = userRecord.achievement_points || 0;
            
            // Skip users with no completed runs
            if (totalRuns === 0) {
                skipped++;
                continue;
            }

            // Use display_name if set, otherwise fall back to full_name
            const displayName = userRecord.display_name || userRecord.full_name || userRecord.email;

            // Check if leaderboard entry exists
            const existingEntries = await base44.asServiceRole.entities.LeaderboardEntry.filter({ 
                user_email: userRecord.email 
            });

            if (existingEntries.length > 0) {
                // Update existing entry
                await base44.asServiceRole.entities.LeaderboardEntry.update(existingEntries[0].id, {
                    user_name: displayName,
                    total_completed_runs: totalRuns,
                    total_victories: totalVictories,
                    wild_mode_victories: wildModeVictories,
                    achievement_points: achievementPoints
                });
                updated++;
            } else {
                // Create new entry
                await base44.asServiceRole.entities.LeaderboardEntry.create({
                    user_email: userRecord.email,
                    user_name: displayName,
                    total_completed_runs: totalRuns,
                    total_victories: totalVictories,
                    wild_mode_victories: wildModeVictories,
                    achievement_points: achievementPoints
                });
                created++;
            }
        }

        return Response.json({
            success: true,
            summary: {
                total_users_processed: allUsers.length,
                entries_created: created,
                entries_updated: updated,
                users_skipped: skipped
            }
        });

    } catch (error) {
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});

import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check if user is admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        // Delete all leaderboard entries
        const allLeaderboard = await base44.asServiceRole.entities.LeaderboardEntry.list('-created_date', 10000);
        let leaderboardDeleted = 0;
        const errors = [];
        
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
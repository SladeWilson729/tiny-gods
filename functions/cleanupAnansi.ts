import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check if user is admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        // Get all Anansi gods
        const allGods = await base44.asServiceRole.entities.God.list('-created_date', 1000);
        const anansiGods = allGods.filter(g => g.name === 'Anansi');
        
        console.log(`Found ${anansiGods.length} Anansi gods`);
        
        const deleted = [];
        const kept = [];
        
        for (const god of anansiGods) {
            // Delete if no static_ability or empty static_ability
            if (!god.static_ability || god.static_ability.trim() === '') {
                await base44.asServiceRole.entities.God.delete(god.id);
                deleted.push({ id: god.id, name: god.name, static_ability: god.static_ability || 'none' });
            } else {
                kept.push({ id: god.id, name: god.name, static_ability: god.static_ability });
            }
        }

        return Response.json({
            success: true,
            summary: {
                total_anansi_found: anansiGods.length,
                deleted: deleted.length,
                kept: kept.length
            },
            deleted_records: deleted,
            kept_records: kept
        });

    } catch (error) {
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});
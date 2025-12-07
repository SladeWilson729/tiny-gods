import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check if user is admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        const { method, body } = await req.json();

        if (method === 'list') {
            // List all users
            const users = await base44.asServiceRole.entities.User.list('-created_date', 1000);
            return Response.json({ users });
        }

        if (method === 'update') {
            // Update a user
            const { userId, updates } = body;
            await base44.asServiceRole.entities.User.update(userId, updates);
            return Response.json({ success: true });
        }

        return Response.json({ error: 'Invalid method' }, { status: 400 });

    } catch (error) {
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});
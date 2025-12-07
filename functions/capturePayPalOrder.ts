import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId } = await req.json();

        if (!orderId) {
            return Response.json({ error: 'Order ID required' }, { status: 400 });
        }

        const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
        const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET');
        const PAYPAL_MODE = Deno.env.get('PAYPAL_MODE') || 'sandbox';
        
        const baseURL = PAYPAL_MODE === 'live' 
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        const authResponse = await fetch(`${baseURL}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        if (!authResponse.ok) {
            console.error('PayPal auth failed:', await authResponse.text());
            return Response.json({ error: 'PayPal authentication failed' }, { status: 500 });
        }

        const { access_token } = await authResponse.json();

        const captureResponse = await fetch(`${baseURL}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!captureResponse.ok) {
            const errorText = await captureResponse.text();
            console.error('PayPal capture failed:', errorText);
            return Response.json({ error: 'Payment capture failed', details: errorText }, { status: 500 });
        }

        const captureData = await captureResponse.json();

        if (captureData.status !== 'COMPLETED') {
            return Response.json({ error: 'Payment not completed', status: captureData.status }, { status: 400 });
        }

        const customId = captureData.purchase_units[0].payments.captures[0].custom_id;
        const packageData = JSON.parse(customId);

        if (packageData.userId !== user.id) {
            return Response.json({ error: 'User mismatch' }, { status: 403 });
        }

        const currentFavor = user.favor_tokens || 0;
        const currentEssence = user.essence_crystals || 0;
        
        const updateData = {
            favor_tokens: currentFavor + packageData.favor,
            essence_crystals: currentEssence + packageData.essence
        };

        if (packageData.bonusCosmetics && packageData.bonusCosmetics.length > 0) {
            const currentOwnedCosmetics = user.owned_cosmetics || [];
            const newCosmetics = [...new Set([...currentOwnedCosmetics, ...packageData.bonusCosmetics])];
            updateData.owned_cosmetics = newCosmetics;
        }

        await base44.asServiceRole.entities.User.update(user.id, updateData);

        console.log(`Payment successful! Granted ${packageData.favor} Favor Tokens and ${packageData.essence} Essence Crystals to user ${user.email}`);
        if (packageData.bonusCosmetics && packageData.bonusCosmetics.length > 0) {
            console.log(`Also granted ${packageData.bonusCosmetics.length} bonus cosmetics`);
        }

        return Response.json({ 
            success: true,
            granted: {
                favor: packageData.favor,
                essence: packageData.essence,
                cosmetics: packageData.bonusCosmetics || []
            },
            newBalances: {
                favor: currentFavor + packageData.favor,
                essence: currentEssence + packageData.essence
            },
            transactionId: captureData.id
        });

    } catch (error) {
        console.error('PayPal capture error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});
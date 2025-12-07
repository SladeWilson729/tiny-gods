
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { packageId } = await req.json();

        // Load package from database
        const packages = await base44.asServiceRole.entities.StorePackage.filter({ 
            package_id: packageId,
            is_available: true 
        });
        
        const selectedPackage = packages[0];
        if (!selectedPackage) {
            return Response.json({ error: 'Invalid or unavailable package' }, { status: 400 });
        }

        const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
        const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET');
        const PAYPAL_MODE = Deno.env.get('PAYPAL_MODE') || 'sandbox';
        
        const baseURL = PAYPAL_MODE === 'live' 
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        // Get PayPal access token
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

        // Build description with cosmetics if included
        let description = `${selectedPackage.name} - ${selectedPackage.favor_tokens} Favor Tokens + ${selectedPackage.essence_crystals} Essence Crystals`;
        if (selectedPackage.bonus_cosmetics && selectedPackage.bonus_cosmetics.length > 0) {
            description += ` + ${selectedPackage.bonus_cosmetics.length} Exclusive Cosmetic${selectedPackage.bonus_cosmetics.length > 1 ? 's' : ''}`;
        }

        // Create PayPal order
        const orderResponse = await fetch(`${baseURL}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: selectedPackage.price
                    },
                    description: description,
                    custom_id: JSON.stringify({
                        userId: user.id,
                        packageId: packageId,
                        favor: selectedPackage.favor_tokens,
                        essence: selectedPackage.essence_crystals,
                        bonusCosmetics: selectedPackage.bonus_cosmetics || []
                    })
                }],
                application_context: {
                    brand_name: 'Tiny Gods',
                    return_url: `${req.headers.get('origin')}/Store?payment=success`,
                    cancel_url: `${req.headers.get('origin')}/Store?payment=cancelled`
                }
            })
        });

        if (!orderResponse.ok) {
            console.error('PayPal order creation failed:', await orderResponse.text());
            return Response.json({ error: 'Failed to create PayPal order' }, { status: 500 });
        }

        const order = await orderResponse.json();

        return Response.json({ 
            orderId: order.id,
            approveUrl: order.links.find(link => link.rel === 'approve')?.href
        });

    } catch (error) {
        console.error('PayPal order creation error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});

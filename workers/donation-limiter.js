export default {
    async fetch(request, env) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': 'https://parvares.github.io',
            'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        };

        const RATE_LIMIT = "OFF";  // Puoi cambiare questo a "OFF" per disattivare il rate limiting
        const MAX_DONATIONS = 5;  // Quando modifichi questo valore, il contatore si resetterà
        const LIMIT_VERSION = "v2"; // Incrementato per gestire il reset
        const CONFIG_KEY = "rate_limit_config";

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: { ...corsHeaders }
            });
        }

        if (request.method === 'POST' && new URL(request.url).pathname === '/api/donate') {
            const clientIP = request.headers.get('CF-Connecting-IP');
            const today = new Date().toISOString().split('T')[0];
            
            try {
                // Verifica la configurazione corrente
                let currentConfig = await env.DONATIONS_TRACKER.get(CONFIG_KEY);
                let needsReset = false;
                
                if (!currentConfig) {
                    // Prima inizializzazione
                    currentConfig = JSON.stringify({
                        maxDonations: MAX_DONATIONS,
                        version: LIMIT_VERSION,
                        lastUpdate: today
                    });
                    await env.DONATIONS_TRACKER.put(CONFIG_KEY, currentConfig);
                } else {
                    const config = JSON.parse(currentConfig);
                    if (config.maxDonations !== MAX_DONATIONS || config.version !== LIMIT_VERSION) {
                        needsReset = true;
                        // Aggiorna la configurazione
                        config.maxDonations = MAX_DONATIONS;
                        config.version = LIMIT_VERSION;
                        config.lastUpdate = today;
                        await env.DONATIONS_TRACKER.put(CONFIG_KEY, JSON.stringify(config));
                    }
                }

                // Chiave per il contatore dell'utente
                const userKey = `${clientIP}-${today}-${LIMIT_VERSION}-${MAX_DONATIONS}`;
                
                if (needsReset) {
                    // Reset del contatore per questo utente
                    await env.DONATIONS_TRACKER.delete(userKey);
                }

                let donationCount = await env.DONATIONS_TRACKER.get(userKey);
                donationCount = donationCount ? parseInt(donationCount) : 0;
                
                if (RATE_LIMIT === "ON" && donationCount >= MAX_DONATIONS) {
                    return new Response(JSON.stringify({
                        error: `Hai già inviato ${MAX_DONATIONS} donazioni oggi. Riprova domani.`
                    }), {
                        status: 429,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                }

                const requestData = await request.json();
                
                const emailjsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Origin': 'https://bibliotecamorante.workers.dev'
                    },
                    body: JSON.stringify({
                        service_id: requestData.service_id,
                        template_id: requestData.template_id,
                        user_id: requestData.user_id,
                        template_params: requestData.template_params,
                        accessToken: requestData.user_id
                    })
                });

                if (emailjsResponse.ok) {
                    if (RATE_LIMIT === "ON") {
                        await env.DONATIONS_TRACKER.put(userKey, (donationCount + 1).toString(), { expirationTtl: 86400 });
                    }

                    return new Response(JSON.stringify({
                        success: true,
                        message: 'Donazione inviata con successo'
                    }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                } else {
                    const errorText = await emailjsResponse.text();
                    return new Response(JSON.stringify({
                        error: 'Errore nell\'invio della donazione',
                        details: errorText
                    }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                }
            } catch (error) {
                return new Response(JSON.stringify({
                    error: 'Errore interno del server',
                    details: error.message
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
};

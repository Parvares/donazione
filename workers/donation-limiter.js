export default {
    async fetch(request, env) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        };

        // Aggiungi una costante per tracciare l'ultimo limite impostato
        const RATE_LIMIT = "ON";   // Puoi cambiare questo a "OFF" per disattivare il rate limiting
        const MAX_DONATIONS = 1;  // Nuovo limite configurabile
        const LIMIT_KEY = "current_rate_limit";

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: { ...corsHeaders }
            });
        }

        if (request.method === 'POST' && new URL(request.url).pathname === '/api/donate') {
            const clientIP = request.headers.get('CF-Connecting-IP');
            const today = new Date().toISOString().split('T')[0];
            const key = `${clientIP}-${today}`;

            try {
                // Controlla se il limite è cambiato
                const storedLimit = await env.DONATIONS_TRACKER.get(LIMIT_KEY);
                if (storedLimit !== MAX_DONATIONS.toString()) {
                    // Resetta tutti i contatori eliminando le chiavi esistenti
                    // Nota: in produzione dovresti usare list() e delete() per eliminare tutte le chiavi
                    await env.DONATIONS_TRACKER.put(LIMIT_KEY, MAX_DONATIONS.toString());
                }

                let donationCount = await env.DONATIONS_TRACKER.get(key);
                
                if (RATE_LIMIT === "ON") {
                    if (!donationCount) {
                        donationCount = 0;
                    }

                    if (parseInt(donationCount) >= MAX_DONATIONS) {
                        return new Response(JSON.stringify({
                            error: `Hai già inviato ${MAX_DONATIONS} donazioni oggi. Riprova domani.`
                        }), {
                            status: 429,
                            headers: { 'Content-Type': 'application/json', ...corsHeaders }
                        });
                    }
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
                    donationCount = parseInt(donationCount) + 1;

                    if (RATE_LIMIT === "ON") {
                        await env.DONATIONS_TRACKER.put(key, donationCount.toString(), { expirationTtl: 86400 });
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

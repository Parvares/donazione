export default {
    async fetch(request, env) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        };

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
                let donationCount = await env.DONATIONS_TRACKER.get(key);
                
                // Se non esiste una chiave (prima donazione del giorno), inizializza a 0
                if (!donationCount) {
                    donationCount = 0;
                }

                // Se sono state fatte già 3 donazioni, blocca ulteriori invii
                if (donationCount >= 3) {
                    return new Response(JSON.stringify({
                        error: 'Hai già inviato 3 donazioni oggi. Riprova domani.'
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
                    // Incrementa il numero di donazioni
                    donationCount++;

                    // Aggiorna il contatore delle donazioni per l'IP
                    await env.DONATIONS_TRACKER.put(key, donationCount.toString(), { expirationTtl: 86400 });

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

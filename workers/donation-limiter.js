addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// Chiave KV per tenere traccia delle donazioni
const DONATIONS_NAMESPACE = 'DONATIONS_TRACKER'

// Headers CORS specifici per il dominio GitHub Pages
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://parvares.github.io',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

async function handleRequest(request) {
  // Verifica se è una richiesta OPTIONS (CORS preflight)
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  // Verifica se è una richiesta POST per la donazione
  if (request.method === 'POST' && new URL(request.url).pathname === '/api/donate') {
    const clientIP = request.headers.get('CF-Connecting-IP')
    const today = new Date().toISOString().split('T')[0]
    const key = `${clientIP}-${today}`

    try {
      // Verifica se l'IP ha già fatto una donazione oggi
      const donationCount = await DONATIONS_TRACKER.get(key)
      
      if (donationCount) {
        return new Response(JSON.stringify({
          error: 'Hai già inviato una donazione oggi. Riprova domani.'
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        })
      }

      // Ottieni il corpo della richiesta
      const requestData = await request.json()

      // Inoltra la richiesta a EmailJS
      const emailjsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (emailjsResponse.ok) {
        // Registra la donazione per oggi
        await DONATIONS_TRACKER.put(key, '1', {
          expirationTtl: 86400 // Scade dopo 24 ore
        })

        return new Response(JSON.stringify({
          success: true,
          message: 'Donazione inviata con successo'
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        })
      } else {
        const emailjsError = await emailjsResponse.text()
        return new Response(JSON.stringify({
          error: 'Errore nell\'invio della donazione',
          details: emailjsError
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        })
      }
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Errore interno del server',
        details: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }
  }

  // Per altre richieste, restituisci 404
  return new Response('Not Found', { 
    status: 404,
    headers: corsHeaders
  })
}

// Funzione per gestire le richieste OPTIONS (CORS preflight)
function handleOptions(request) {
  if (request.headers.get('Origin') !== null &&
      request.headers.get('Access-Control-Request-Method') !== null &&
      request.headers.get('Access-Control-Request-Headers') !== null) {
    return new Response(null, {
      headers: corsHeaders
    })
  } else {
    return new Response(null, {
      headers: {
        Allow: 'GET, HEAD, POST, OPTIONS',
      },
    })
  }
}

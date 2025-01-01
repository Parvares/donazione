addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// Chiave KV per tenere traccia delle donazioni
const DONATIONS_NAMESPACE = 'DONATIONS_TRACKER'

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
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        })
      }

      // Se non ha fatto donazioni oggi, inoltra la richiesta a EmailJS
      const emailjsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: request.body
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
            'Access-Control-Allow-Origin': '*'
          }
        })
      } else {
        return new Response(JSON.stringify({
          error: 'Errore nell\'invio della donazione'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        })
      }
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Errore interno del server'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
  }

  // Per altre richieste, restituisci 404
  return new Response('Not Found', { status: 404 })
}

function handleOptions(request) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}

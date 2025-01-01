export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }

    if (request.method === 'OPTIONS') {
      return handleOptions(request)
    }

    if (request.method === 'POST' && new URL(request.url).pathname === '/api/donate') {
      const clientIP = request.headers.get('CF-Connecting-IP')
      const today = new Date().toISOString().split('T')[0]
      const key = `${clientIP}-${today}`

      try {
        const donationCount = await env.DONATIONS_TRACKER.get(key)
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

        const requestData = await request.json()
        const emailjsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        })

        if (emailjsResponse.ok) {
          await env.DONATIONS_TRACKER.put(key, '1', { expirationTtl: 86400 })
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

    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders
    })
  }
}

function handleOptions(request) {
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      }
    })
  }
  
  return new Response(null, {
    headers: { Allow: 'GET, HEAD, POST, OPTIONS' }
  })
}
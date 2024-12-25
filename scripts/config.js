// config.js
const config = {
  emailjs: {
    serviceId: window?.__env__?.EMAILJS_SERVICE_ID || 'service_yepi8uu',
    templateId: window?.__env__?.EMAILJS_TEMPLATE_ID || 'template_s1jmd7r',
    publicKey: window?.__env__?.EMAILJS_PUBLIC_KEY || 'z6OeY42qSulJ-8EcS'
  },
  googleBooks: {
    apiKey: window?.__env__?.GOOGLE_BOOKS_API_KEY || 'AIzaSyCHJzsPtp8CfKeUag-vvyTxobwR_DmYink',
    apiOptions: {
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  },
  library: {
    email: window?.__env__?.LIBRARY_EMAIL || 'bibliotecamorante@gmail.com'
  }
};

// Aggiungi funzione per gestire le chiamate API con CORS
config.fetchWithCORS = async (url, options = {}) => {
  const defaultOptions = {
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export default config;

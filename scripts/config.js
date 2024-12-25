const config = {
    emailjs: {
        serviceId: window._env_?.EMAILJS_SERVICE_ID || 'service_yepi8uu',
        templateId: window._env_?.EMAILJS_TEMPLATE_ID || 'template_s1jmd7r',
        publicKey: window._env_?.EMAILJS_PUBLIC_KEY || 'z6OeY42qSulJ-8EcS'
    },
    googleBooks: {
        apiKey: window._env_?.GOOGLE_BOOKS_API_KEY || 'AIzaSyCHJzsPtp8CfKeUag-vvyTxobwR_DmYink'
    },
    library: {
        email: window._env_?.LIBRARY_EMAIL || 'bibliotecamorante@gmail.com'
    }
};

// Step 1: Aggiungi queste funzioni al tuo file scripts/config.js
// dopo la parte esistente del config

const emailValidation = {
    // Regex per la validazione base dell'email
    emailRegex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    
    // Domini email comuni e validi
    commonDomains: [
        'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 
        'libero.it', 'virgilio.it', 'tim.it', 'icloud.com'
    ],
    
    // Domini temporanei da bloccare
    temporaryDomains: [
        'tempmail.com', 'throwawaymail.com', 'guerrillamail.com',
        'mailinator.com', 'yopmail.com', 'tempmail.net'
    ]
};

// Esporta la configurazione aggiornata
export default {
    ...config,
    emailValidation
};

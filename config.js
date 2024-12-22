// config.js
const config = {
    EMAILJS_PUBLIC_KEY: 'z6OeY42qSulJ-8EcS',
    EMAILJS_SERVICE_ID: 'service_yepi8uu',
    EMAILJS_TEMPLATE_ID: 'template_s1jmd7r'
};

// Aggiungiamo un layer di sicurezza base
const getConfig = () => {
    // Verifica che il dominio sia quello corretto
    if (window.location.hostname !== 'parvares.github.io') {
        return null;
    }
    return config;
};

export default getConfig();

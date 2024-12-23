// config.js
const config = {
    emailjs: {
        serviceId: 'service_yepi8uu',
        templateId: 'template_s1jmd7r', 
        publicKey: 'z6OeY42qSulJ-8EcS'
    },
    googleBooks: {
        apiKey: 'AIzaSyCHJzsPtp8CfKeUag-vvyTxobwR_DmYink'
    }
};

try {
    // Verifica se siamo in un ambiente che supporta process.env
    if (typeof process !== 'undefined' && process.env) {
        config.emailjs.serviceId = process.env.EMAILJS_SERVICE_ID || config.emailjs.serviceId;
        config.emailjs.templateId = process.env.EMAILJS_TEMPLATE_ID || config.emailjs.templateId;
        config.emailjs.publicKey = process.env.EMAILJS_PUBLIC_KEY || config.emailjs.publicKey;
        config.googleBooks.apiKey = process.env.GOOGLE_BOOKS_API_KEY || config.googleBooks.apiKey;
    }
} catch (e) {
    console.warn('Environment variables not available, using default config');
}

export default config;

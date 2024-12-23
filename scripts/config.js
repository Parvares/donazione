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

export default config;

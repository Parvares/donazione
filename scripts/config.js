// config.js
const config = {
    emailjs: {
        serviceId: process.env.EMAILJS_SERVICE_ID,
        templateId: process.env.EMAILJS_TEMPLATE_ID,
        publicKey: process.env.EMAILJS_PUBLIC_KEY
    },
    googleBooks: {
        apiKey: process.env.GOOGLE_BOOKS_API_KEY
    }
};

export default config;

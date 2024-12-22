// Ottieni le variabili dall'oggetto window che verranno impostate dal workflow
const config = {
    EMAILJS_PUBLIC_KEY: window._env_.EMAILJS_PUBLIC_KEY,
    EMAILJS_SERVICE_ID: window._env_.EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID: window._env_.EMAILJS_TEMPLATE_ID
};

export default config;

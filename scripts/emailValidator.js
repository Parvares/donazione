// Step 2: Crea un nuovo file scripts/emailValidator.js
// e aggiungi questo codice

// Funzione per la validazione base dell'email
function basicEmailValidation(email) {
    const errors = [];
    
    // Controllo se l'email è vuota
    if (!email) {
        errors.push('L\'indirizzo email è obbligatorio');
        return { isValid: false, errors };
    }

    // Controllo lunghezza minima e massima
    if (email.length < 5) {
        errors.push('L\'indirizzo email è troppo corto');
    }
    if (email.length > 254) {
        errors.push('L\'indirizzo email è troppo lungo');
    }

    // Controllo formato con regex
    if (!config.emailValidation.emailRegex.test(email)) {
        errors.push('Il formato dell\'email non è valido');
        return { isValid: false, errors };
    }

    // Estrai il dominio
    const domain = email.split('@')[1].toLowerCase();

    // Controlla se è un dominio temporaneo
    if (config.emailValidation.temporaryDomains.includes(domain)) {
        errors.push('Gli indirizzi email temporanei non sono ammessi');
    }

    // Verifica ulteriori caratteristiche del dominio
    if (domain) {
        // Controlla punti consecutivi
        if (domain.includes('..')) {
            errors.push('Il dominio non può contenere punti consecutivi');
        }

        // Controlla caratteri speciali non ammessi nel dominio
        if (!/^[a-z0-9.-]+$/.test(domain)) {
            errors.push('Il dominio contiene caratteri non validi');
        }

        // Controlla lunghezza delle parti del dominio
        const domainParts = domain.split('.');
        if (domainParts.some(part => part.length > 63)) {
            errors.push('Una parte del dominio è troppo lunga');
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Funzione per il controllo dei record MX
async function checkMXRecord(email) {
    const domain = email.split('@')[1];
    
    try {
        const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        // Verifica la presenza di record MX validi
        const hasMX = data.Answer && data.Answer.length > 0;
        
        return {
            isValid: hasMX,
            error: hasMX ? null : 'Questo dominio email non ha un server di posta valido'
        };
    } catch (error) {
        console.error('Errore durante il controllo MX:', error);
        return {
            isValid: true, // In caso di errore, permettiamo di procedere
            error: null
        };
    }
}

// Funzione principale di validazione
async function validateEmail(email) {
    // Prima esegui la validazione base
    const basicValidation = basicEmailValidation(email);
    if (!basicValidation.isValid) {
        return basicValidation;
    }

    // Se la validazione base passa, controlla i record MX
    const mxCheck = await checkMXRecord(email);
    if (!mxCheck.isValid) {
        return {
            isValid: false,
            errors: [mxCheck.error]
        };
    }

    return { isValid: true, errors: [] };
}

export { validateEmail };

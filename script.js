import config from './scripts/config.js';

// --- Configurazione e Stato ---
const state = {
    bookCount: 0,
    isScanning: false
};

// Inizializza EmailJS
(function() {
    emailjs.init(config.emailjs.publicKey);
})();

document.addEventListener('DOMContentLoaded', () => {
    initializeForm();
    createBookEntry(); // Crea il primo libro vuoto
});

function initializeForm() {
    const bookList = document.getElementById('bookList');
    const form = document.getElementById('donationForm');
    const notesArea = document.getElementById('notes');

    // Gestione Note (Char Counter e Auto-resize)
    notesArea.addEventListener('input', handleNotesInput);

    // Gestione Globale Eventi sui Libri (Event Delegation)
    bookList.addEventListener('click', handleBookActions);
    bookList.addEventListener('input', handleBookInputs);
    bookList.addEventListener('keydown', handleBookNavigation);

    // Validazione Input Generici (Nome, Email, etc)
    document.querySelectorAll('#donationForm > div > input').forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (!input.matches(':focus')) validateField(input);
        });
    });

    // Submit Form
    form.addEventListener('submit', handleFormSubmit);
}

// --- Gestione Libri (CRUD) ---

function createBookEntry(data = null) {
    const template = document.getElementById('book-entry-template');
    const clone = template.content.cloneNode(true);
    const bookEntry = clone.querySelector('.book-entry');
    
    state.bookCount++;
    bookEntry.querySelector('.book-counter').textContent = state.bookCount;

    // Se ci sono dati (duplicazione), popolali
    if (data) {
        bookEntry.querySelector('.book-title').value = data.title;
        bookEntry.querySelector('.book-author').value = data.author;
        bookEntry.querySelector('.book-publisher').value = data.publisher;
        bookEntry.querySelector('.book-year').value = data.year;
        bookEntry.querySelector('.book-isbn').value = data.isbn;
    }

    // Rimuovi pulsante "Aggiungi libro" dalle entry precedenti
    const existingAddBtns = document.querySelectorAll('.add-book-btn');
    existingAddBtns.forEach(btn => btn.remove());

    document.getElementById('bookList').appendChild(bookEntry);
    updateBookButtons();
}

function handleBookActions(e) {
    const target = e.target;
    const entry = target.closest('.book-entry');
    if (!entry) return;

    // Aggiungi Nuovo Libro
    if (target.classList.contains('add-book-btn')) {
        createBookEntry();
        return;
    }

    // Rimuovi Libro
    if (target.closest('.btn-remove')) {
        if (document.querySelectorAll('.book-entry').length > 1) {
            entry.remove();
            state.bookCount--;
            updateBookIndices();
            // Riaggiungi pulsante "+" all'ultimo elemento se necessario
            const entries = document.querySelectorAll('.book-entry');
            const lastEntry = entries[entries.length - 1];
            if (!lastEntry.querySelector('.add-book-btn')) {
                const btn = document.createElement('button');
                btn.className = 'add-book-btn';
                btn.textContent = '+ Aggiungi Libro';
                btn.type = 'button';
                lastEntry.appendChild(btn);
            }
        }
        return;
    }

    // Duplica Libro
    if (target.closest('.btn-duplicate')) {
        const data = {
            title: entry.querySelector('.book-title').value,
            author: entry.querySelector('.book-author').value,
            publisher: entry.querySelector('.book-publisher').value,
            year: entry.querySelector('.book-year').value,
            isbn: entry.querySelector('.book-isbn').value
        };
        createBookEntry(data);
        return;
    }

    // Reset Campi
    if (target.closest('.btn-reset')) {
        entry.querySelectorAll('input').forEach(i => {
            i.value = '';
            hideError(i);
        });
        return;
    }

    // Ricerca Google Books (Click bottone)
    if (target.closest('.search-btn')) {
        const searchInput = entry.querySelector('.quick-search');
        performBookSearch(searchInput, entry);
        return;
    }

    // Scanner ISBN (Apertura)
    if (target.closest('.scan-isbn-btn')) {
        startScanner(entry);
        return;
    }

    // Scanner ISBN (Chiusura)
    if (target.closest('.close-scanner') || target.classList.contains('isbn-scanner-modal')) {
        stopScanner(entry);
        return;
    }

    // Selezione Risultato Ricerca
    if (target.closest('.search-result')) {
        const result = target.closest('.search-result');
        const bookData = JSON.parse(result.dataset.book);
        fillBookData(entry, bookData);
    }
}

function updateBookIndices() {
    document.querySelectorAll('.book-entry').forEach((entry, index) => {
        entry.querySelector('.book-counter').textContent = index + 1;
    });
}

function updateBookButtons() {
    // Gestisce la visibilità dei bottoni rimuovi/duplica in base al numero di libri
    const entries = document.querySelectorAll('.book-entry');
    entries.forEach(entry => {
        const removeBtn = entry.querySelector('.btn-remove');
        if (entries.length === 1) {
            removeBtn.style.display = 'none';
        } else {
            removeBtn.style.display = 'inline-block';
        }
    });
}

// --- Gestione Input e Validazione ---

function handleBookInputs(e) {
    const input = e.target;
    const entry = input.closest('.book-entry');

    // Debounce per ricerca Google
    if (input.classList.contains('quick-search')) {
        clearTimeout(input.searchTimer);
        input.searchTimer = setTimeout(() => performBookSearch(input, entry), 600);
    }

    // Validazione real-time ISBN e Anno
    if (input.classList.contains('book-isbn')) validateISBN(input);
    if (input.classList.contains('book-year')) validateBookField(input);
}

function handleBookNavigation(e) {
    // Navigazione nei risultati di ricerca con frecce
    if (e.target.classList.contains('quick-search')) {
        // Logica per navigare i risultati... (semplificata per brevità)
        // Se preme ESC chiudi risultati
        if (e.key === 'Escape') {
            const results = e.target.closest('.search-section').querySelector('.search-results');
            results.classList.add('hidden');
        }
    }
}

function validateField(input) {
    const value = input.value.trim();
    let isValid = true;

    // Se è obbligatorio
    if (input.hasAttribute('required') && !value) {
        showError(input, `Campo obbligatorio`);
        return false;
    }

    if (input.id === 'email' && value && !validateEmail(value)) {
        showError(input, 'Email non valida');
        return false;
    }

    if (input.id === 'telefono' && value && !/^[0-9]{6,15}$/.test(value)) {
        showError(input, 'Telefono non valido');
        return false;
    }

    hideError(input);
    return true;
}

function validateBookField(input) {
    const value = input.value.trim();
    
    if (input.classList.contains('book-year') && value) {
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1400 || year > currentYear) {
            showError(input, 'Anno non valido');
            return false;
        }
    }

    hideError(input);
    return true;
}

function validateISBN(input) {
    let value = input.value.replace(/\D/g, ''); // Rimuovi non numeri
    input.value = value.slice(0, 13); // Limita a 13

    if (value.length > 0 && value.length !== 10 && value.length !== 13) {
        showError(input, 'ISBN deve essere 10 o 13 cifre');
        return false;
    }
    hideError(input);
    return true;
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(input, message) {
    const errorEl = input.parentElement.querySelector('.error-message') || input.parentElement.parentElement.querySelector('.error-message');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
        input.classList.add('border-red-500');
    }
}

function hideError(input) {
    const errorEl = input.parentElement.querySelector('.error-message') || input.parentElement.parentElement.querySelector('.error-message');
    if (errorEl) {
        errorEl.classList.add('hidden');
        input.classList.remove('border-red-500');
    }
}

// --- Google Books API ---

async function performBookSearch(input, entry) {
    const query = input.value.trim();
    const resultsDiv = entry.querySelector('.search-results');
    const spinner = entry.querySelector('.search-spinner');

    if (!query) {
        resultsDiv.classList.add('hidden');
        return;
    }

    spinner.classList.remove('hidden');

    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${config.googleBooks.apiKey}&maxResults=5`);
        const data = await response.json();

        resultsDiv.innerHTML = '';
        
        if (data.items && data.items.length > 0) {
            data.items.forEach(book => {
                const info = book.volumeInfo;
                const isbnObj = info.industryIdentifiers?.find(id => id.type === 'ISBN_13') || info.industryIdentifiers?.find(id => id.type === 'ISBN_10');
                
                const bookData = {
                    title: info.title || '',
                    author: info.authors ? info.authors.join(', ') : '',
                    publisher: info.publisher || '',
                    year: info.publishedDate ? info.publishedDate.substring(0, 4) : '',
                    isbn: isbnObj ? isbnObj.identifier : ''
                };

                const div = document.createElement('div');
                div.className = 'search-result';
                div.dataset.book = JSON.stringify(bookData);
                div.innerHTML = `
                    <div class="font-medium text-blue-600">${bookData.title}</div>
                    <div class="text-sm text-gray-600">${bookData.author} (${bookData.year})</div>
                `;
                resultsDiv.appendChild(div);
            });
            resultsDiv.classList.remove('hidden');
        } else {
            resultsDiv.innerHTML = '<div class="p-3 text-gray-600">Nessun risultato</div>';
            resultsDiv.classList.remove('hidden');
        }
    } catch (err) {
        console.error(err);
        resultsDiv.innerHTML = '<div class="p-3 text-red-500">Errore ricerca</div>';
        resultsDiv.classList.remove('hidden');
    } finally {
        spinner.classList.add('hidden');
    }
}

function fillBookData(entry, data) {
    entry.querySelector('.book-title').value = data.title;
    entry.querySelector('.book-author').value = data.author;
    entry.querySelector('.book-publisher').value = data.publisher;
    entry.querySelector('.book-year').value = data.year;
    entry.querySelector('.book-isbn').value = data.isbn;

    // Pulisci ricerca
    entry.querySelector('.quick-search').value = '';
    entry.querySelector('.search-results').classList.add('hidden');
    
    // Effetto visivo (feedback)
    entry.classList.add('bg-blue-50');
    setTimeout(() => entry.classList.remove('bg-blue-50'), 500);
}

// --- Scanner ISBN (QuaggaJS) ---

function startScanner(entry) {
    if (state.isScanning) return;
    
    const modal = entry.querySelector('.isbn-scanner-modal');
    const container = modal.querySelector('.isbn-scanner-reader');
    const isbnInput = entry.querySelector('.book-isbn');
    
    // Assegna ID univoco per Quagga
    const uniqueId = 'scanner-' + Date.now();
    container.id = uniqueId;
    
    modal.classList.remove('hidden');
    state.isScanning = true;

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#' + uniqueId),
            constraints: {
                facingMode: "environment",
                aspectRatio: { min: 1, max: 2 }
            }
        },
        decoder: {
            readers: ["ean_reader"] // ISBN è EAN-13
        }
    }, function(err) {
        if (err) {
            console.error(err);
            alert("Errore fotocamera. Controlla i permessi.");
            stopScanner(entry);
            return;
        }
        Quagga.start();
    });

    Quagga.onDetected(function(result) {
        const code = result.codeResult.code;
        if (code) {
            // Semplice suono di beep
            const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...'); // (Abbreviato per pulizia, usa il tuo o un url esterno)
            // audio.play().catch(e => {}); 

            isbnInput.value = code;
            stopScanner(entry);
            validateISBN(isbnInput);
        }
    });
}

function stopScanner(entry) {
    if (state.isScanning) {
        Quagga.stop();
        state.isScanning = false;
    }
    const modal = entry.querySelector('.isbn-scanner-modal');
    modal.classList.add('hidden');
}

// --- Note e Form Submit ---

function handleNotesInput(e) {
    const area = e.target;
    const max = area.getAttribute('maxlength');
    const current = area.value.length;
    const counter = document.getElementById('charCount');
    
    area.style.height = 'auto';
    area.style.height = area.scrollHeight + 'px';
    
    counter.textContent = `${max - current} caratteri rimanenti`;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validazione Finale
    let isValid = true;
    document.querySelectorAll('input[required]').forEach(input => {
        if (!validateField(input)) isValid = false;
    });
    
    const check = document.getElementById('accept');
    if (!check.checked) {
        check.parentElement.nextElementSibling.classList.remove('hidden');
        isValid = false;
    }

    if (!isValid) {
        showPopup("Compila tutti i campi obbligatori correttamente.", "error");
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Invio in corso...";

    try {
        // Costruisci oggetto libri
        const books = [];
        document.querySelectorAll('.book-entry').forEach(entry => {
            books.push({
                title: entry.querySelector('.book-title').value,
                author: entry.querySelector('.book-author').value,
                isbn: entry.querySelector('.book-isbn').value
            });
        });

        // Prepara tabella HTML per email
        const booksTable = books.map((b, i) => 
            `${i+1}. ${b.title} - ${b.author} [${b.isbn}]`
        ).join('\n');

        await emailjs.send(
            config.emailjs.serviceId,
            config.emailjs.templateId,
            {
                from_name: document.getElementById('nome').value + ' ' + document.getElementById('cognome').value,
                from_email: document.getElementById('email').value,
                telefono: document.getElementById('telefono').value,
                tessera: document.getElementById('tessera').value,
                books_table: booksTable,
                notes: document.getElementById('notes').value
            }
        );

        showPopup("Donazione inviata con successo!", "success");
        e.target.reset();
        document.getElementById('bookList').innerHTML = ''; // Pulisci libri
        createBookEntry(); // Ricrea il primo vuoto

    } catch (err) {
        console.error(err);
        showPopup("Errore nell'invio. Riprova più tardi.", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function showPopup(msg, type) {
    const div = document.createElement('div');
    div.className = `popup-msg ${type === 'success' ? 'bg-success' : 'bg-error'}`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 5000);
}

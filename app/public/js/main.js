import { clientLog, logTrace, logDebug, logInfo, logWarn, logError, logFatal } from './utils/logger.js';
// Classe principale dell'applicazione
class App {
    constructor() {
        this.outputDiv = document.getElementById('output');
        this.apiResultDiv = document.getElementById('api-result');
        this.init();
    }
    init() {
        this.setupEventListeners();
        this.showWelcomeMessage();
    }
    setupEventListeners() {
        // Pulsante principale
        const btnPrimary = document.getElementById('btn-primary');
        btnPrimary?.addEventListener('click', () => this.handlePrimaryClick());
        // Pulsante secondario
        const btnSecondary = document.getElementById('btn-secondary');
        btnSecondary?.addEventListener('click', () => this.handleSecondaryClick());
        // Pulsante test API
        const btnApiTest = document.getElementById('btn-api-test');
        btnApiTest?.addEventListener('click', () => this.testApi());
        // Form
        const form = document.getElementById('example-form');
        form?.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }
    showWelcomeMessage() {
        console.log('App inizializzata con successo!');
        logInfo('Application initialized successfully');
        this.showOutput('Applicazione caricata e pronta all\'uso!', 'success');
    }
    handlePrimaryClick() {
        logDebug('Primary button clicked');
        this.showOutput('Hai cliccato il pulsante principale!', 'info');
        this.animateButton('btn-primary');
    }
    handleSecondaryClick() {
        this.showOutput('Hai cliccato il pulsante secondario!', 'warning');
        this.animateButton('btn-secondary');
    }
    async testApi() {
        try {
            logDebug('Starting API test call', { endpoint: '/api/test' });
            this.showApiResult('Chiamata API in corso...', 'loading');
            const response = await fetch('/api/test');
            const data = await response.json();
            logInfo('API test successful', { status: response.status, data });
            this.showApiResult(JSON.stringify(data, null, 2), 'success');
        }
        catch (error) {
            console.error('Errore API:', error);
            logError('API test failed', { error: error instanceof Error ? error.message : error });
            this.showApiResult('Errore nella chiamata API', 'error');
        }
    }
    handleFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        // const data: FormData = {
        //   name: formData.get('name') as string,
        //   email: formData.get('email') as string,
        //   message: formData.get('message') as string
        // };
        // The TypeScript compiler is trying to use the browser's built-in
        // FormData type (which has methods like append, delete, get, etc.)
        // instead of your custom interface. Solution below:
        // Rename custom interface to avoid the naming conflict
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message')
        };
        this.showOutput(`Form inviato per: ${data.name} (${data.email})`, 'success');
        // Simula invio e reset del form
        setTimeout(() => {
            form.reset();
            this.showOutput('Form resettato!', 'info');
        }, 2000);
    }
    showOutput(message, type) {
        const outputText = this.outputDiv.querySelector('p');
        if (outputText) {
            outputText.textContent = message;
        }
        // Rimuovi classi precedenti
        this.outputDiv.classList.remove('bg-green-50', 'bg-red-50', 'bg-blue-50', 'bg-yellow-50');
        this.outputDiv.classList.remove('border-green-200', 'border-red-200', 'border-blue-200', 'border-yellow-200');
        this.outputDiv.classList.remove('text-green-700', 'text-red-700', 'text-blue-700', 'text-yellow-700');
        // Aggiungi nuove classi in base al tipo
        switch (type) {
            case 'success':
                this.outputDiv.classList.add('bg-green-50', 'border-green-200', 'text-green-700');
                break;
            case 'error':
                this.outputDiv.classList.add('bg-red-50', 'border-red-200', 'text-red-700');
                break;
            case 'info':
                this.outputDiv.classList.add('bg-blue-50', 'border-blue-200', 'text-blue-700');
                break;
            case 'warning':
                this.outputDiv.classList.add('bg-yellow-50', 'border-yellow-200', 'text-yellow-700');
                break;
        }
        this.outputDiv.classList.remove('hidden');
        // Nascondi dopo 5 secondi
        setTimeout(() => {
            this.outputDiv.classList.add('hidden');
        }, 5000);
    }
    showApiResult(result, type) {
        const preElement = this.apiResultDiv.querySelector('pre');
        if (preElement) {
            preElement.textContent = result;
        }
        this.apiResultDiv.classList.remove('hidden');
        // Colori diversi in base al tipo
        this.apiResultDiv.classList.remove('bg-gray-50', 'bg-green-50', 'bg-red-50');
        this.apiResultDiv.classList.remove('border-gray-200', 'border-green-200', 'border-red-200');
        switch (type) {
            case 'loading':
                this.apiResultDiv.classList.add('bg-gray-50', 'border-gray-200');
                break;
            case 'success':
                this.apiResultDiv.classList.add('bg-green-50', 'border-green-200');
                break;
            case 'error':
                this.apiResultDiv.classList.add('bg-red-50', 'border-red-200');
                break;
        }
    }
    animateButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.add('transform', 'scale-95');
            setTimeout(() => {
                button.classList.remove('transform', 'scale-95');
            }, 150);
        }
    }
}
// Utility functions
class Utils {
    static formatDate(date) {
        return new Intl.DateTimeFormat('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
    static debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    }
    static async fetchWithTimeout(url, options = {}, timeout = 5000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        }
        catch (error) {
            clearTimeout(id);
            throw error;
        }
    }
}
// // Frontend Logger
// type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
// Inizializza l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
// Esporta per uso globale se necessario
window.App = App;
window.Utils = Utils;
window.clientLog = clientLog;
window.logTrace = logTrace;
window.logDebug = logDebug;
window.logInfo = logInfo;
window.logWarn = logWarn;
window.logError = logError;
window.logFatal = logFatal;
//# sourceMappingURL=main.js.map
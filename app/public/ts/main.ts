// Interfacce TypeScript
interface ApiResponse {
  message: string;
}

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

// Classe principale dell'applicazione
class App {
  private outputDiv: HTMLElement;
  private apiResultDiv: HTMLElement;

  constructor() {
    this.outputDiv = document.getElementById('output') as HTMLElement;
    this.apiResultDiv = document.getElementById('api-result') as HTMLElement;
    this.init();
  }

  private init(): void {
    this.setupEventListeners();
    this.showWelcomeMessage();
  }

  private setupEventListeners(): void {
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
    const form = document.getElementById('example-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => this.handleFormSubmit(e));
  }

  private showWelcomeMessage(): void {
    console.log('App inizializzata con successo!');
    this.showOutput('Applicazione caricata e pronta all\'uso!', 'success');
  }

  private handlePrimaryClick(): void {
    this.showOutput('Hai cliccato il pulsante principale!', 'info');
    this.animateButton('btn-primary');
  }

  private handleSecondaryClick(): void {
    this.showOutput('Hai cliccato il pulsante secondario!', 'warning');
    this.animateButton('btn-secondary');
  }

  private async testApi(): Promise<void> {
    try {
      this.showApiResult('Chiamata API in corso...', 'loading');
      
      const response = await fetch('/api/test');
      const data: ApiResponse = await response.json();
      
      this.showApiResult(JSON.stringify(data, null, 2), 'success');
    } catch (error) {
      console.error('Errore API:', error);
      this.showApiResult('Errore nella chiamata API', 'error');
    }
  }

  private handleFormSubmit(event: Event): void {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
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

    const data: ContactFormData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      message: formData.get('message') as string
    };

    this.showOutput(`Form inviato per: ${data.name} (${data.email})`, 'success');
    
    // Simula invio e reset del form
    setTimeout(() => {
      form.reset();
      this.showOutput('Form resettato!', 'info');
    }, 2000);
  }

  private showOutput(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
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

  private showApiResult(result: string, type: 'loading' | 'success' | 'error'): void {
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

  private animateButton(buttonId: string): void {
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
  static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  static debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  static async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number = 5000
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }
}

// Frontend Logger
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export async function clientLog(level: LogLevel, message: string, context: Record<string, any> = {}) {
  try {
    await fetch('/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, context })
    });
  } catch (err) {
    console.error('Log sending failed:', err);
  }
}

// Errori globali non catturati
window.onerror = function (message, source, lineno, colno, error) {
  clientLog('error', `Frontend error: ${message} at ${source}:${lineno}:${colno}`, {
    stack: error?.stack || null,
    url: window.location.href,
    userAgent: navigator.userAgent
  });
};


// Inizializza l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
  new App();
});

// Esporta per uso globale se necessario
(window as any).App = App;
(window as any).Utils = Utils;
(window as any).clientLog = clientLog;
(window as any).logTrace = (msg: string, ctx = {}) => clientLog('trace', msg, ctx);
(window as any).logDebug = (msg: string, ctx = {}) => clientLog('debug', msg, ctx);
(window as any).logInfo  = (msg: string, ctx = {}) => clientLog('info', msg, ctx);
(window as any).logWarn  = (msg: string, ctx = {}) => clientLog('warn', msg, ctx);
(window as any).logError = (msg: string, ctx = {}) => clientLog('error', msg, ctx);
(window as any).logFatal = (msg: string, ctx = {}) => clientLog('fatal', msg, ctx);

import { logInfo, logError } from '../utils/logger.js';
import { Win98Window } from '../components/Win98Window.js';
import { log } from 'console';

export async function renderWelcomePage() {
  const app = document.getElementById('app');
  if (!app) return;

  try {
    const res = await fetch('/html/loginform.html');
    const res2 = await fetch('/html/loginPage.html');
    const res3 = await fetch('/html/registerForm.html');
    const htmlLoginform = await res.text();
    const htmlPage = await res2.text();
    const htmlForm = await res3.text();
    app.innerHTML = htmlPage;

    // Bottone icona stile desktop
    logInfo('welcome page loaded')
    const loginButton = document.querySelector('#login-icon button');
    let loginWindow: Win98Window | null = null;

    loginButton?.addEventListener('click', () => {
      // Se la finestra esiste già, non fare nulla
      if (loginWindow) return;

      loginWindow = new Win98Window({
        title: 'Login',
        content: htmlLoginform,
        onClose: () => {
          loginWindow = null; // permetti nuova apertura
        }
      });

      app.appendChild(loginWindow.element);

      // Bind del form DOPO che la finestra è stata inserita nel DOM
      const form = loginWindow.element.querySelector('#login-form') as HTMLFormElement;
      const errorDiv = loginWindow.element.querySelector('#login-error');

      form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = (loginWindow!.element.querySelector('#username') as HTMLInputElement).value.trim();
        const password = (loginWindow!.element.querySelector('#password') as HTMLInputElement).value.trim();
        const otp = (loginWindow!.element.querySelector('#otp') as HTMLInputElement).value.trim();

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, otp }),
          });

          if (response.status === 201) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            logInfo('Login successful');
            window.location.href = '/desktop';
          } else {
            const error = await response.json();
            if (errorDiv) {
              errorDiv.textContent = error.message || 'not valid credential';
              errorDiv.classList.remove('hidden');
            }
            logError('Login failed', error);
          }
        } catch (err) {
          logError('login error', err);
          if (errorDiv) {
            errorDiv.textContent = 'server connection error';
            errorDiv.classList.remove('hidden');
          }
        }
      });
    });

    //logica register
    const registerButton = document.querySelector('#register-icon button');
    let registerWindow: Win98Window | null = null;

    registerButton?.addEventListener('click',async () => {
      if (registerWindow) return;

      registerWindow = new Win98Window({
        title: 'Register',
        content: htmlForm,
        onClose: () => {
          registerWindow = null;
        }
      });
      app.appendChild(registerWindow.element);

      const form = registerWindow.element.querySelector('#login-form') as HTMLFormElement;
      const errorDiv = registerWindow.element.querySelector('#register-error');
     
      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = (registerWindow!.element.querySelector('#username') as HTMLInputElement).value.trim();
        const email = (registerWindow!.element.querySelector('#email') as HTMLInputElement).value.trim();
        const password = (registerWindow!.element.querySelector('#password') as HTMLInputElement).value.trim();
        const display_name = (registerWindow!.element.querySelector('#display_name') as HTMLInputElement).value.trim();
        try {
          const response = await fetch('/api/auth/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({username, email, password, display_name})
          });
          if (response.status === 201){
            //logica per fare subito il login
            //per ora mandiamo a /
            window.location.href = '/desktop';
          } 
          else {
            const error = await response.json();
            if (errorDiv) {
              errorDiv.textContent = error.message || 'some registration problem :('
              errorDiv.classList.remove('hidden');
             }
             logError('registration failed', error);
          }
        }
        catch(err){
          logError('registration error');
          if(errorDiv){
            errorDiv.textContent = 'server connection error';
            errorDiv.classList.remove('hidden');
          }
        }
      })
    })

    logInfo('Login page loaded');

  } catch (err) {
    logError('Errore nel caricamento della login.html', err);
    app.innerHTML = '<p>Errore nel caricamento della pagina.</p>';
  }
}

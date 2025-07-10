import { renderHomePage } from './pages/HomePage.js';
import { renderLoginPage } from './pages/LoginPage.js';
import { renderRegisterPage } from './pages/RegisterPage.js';

const routes: Record<string, () => void> = {
  '/': renderHomePage,
  '/login': renderLoginPage,
  '/register': renderRegisterPage,
};

export function initRouter() {
  // gestione link cliccati
  document.body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.matches('[data-link]')) {
      e.preventDefault();
      const path = target.getAttribute('href')!;
      navigateTo(path);
    }
  });

  // gestione navigazione browser (back/forward)
  window.addEventListener('popstate', () => {
    render(window.location.pathname);
  });

  // prima render
  render(window.location.pathname);
}

function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  render(path);
}

function render(path: string) {
  const view = routes[path] || renderHomePage;
  view();
}
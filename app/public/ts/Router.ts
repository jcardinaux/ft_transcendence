import { renderHomePage } from './pages/HomePage.js';
import { renderWelcomePage } from './pages/welcomePage.js';
import { error404page } from './pages/404.js';
import { renderDesktopPage } from './pages/desktopPage.js';

const routes: Record<string, () => void> = {
  '/': renderHomePage,
  '/welcome': renderWelcomePage,
  '/desktop': renderDesktopPage,
};

export function initRouter() {
  document.body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.matches('[data-link]')) {
      e.preventDefault();
      const path = target.getAttribute('href')!;
      navigateTo(path);
    }
  });
  window.addEventListener('popstate', () => {
    render(window.location.pathname);
  });
  render(window.location.pathname);
}

function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  render(path);
}

function render(path: string) {
  const view = routes[path] || error404page;
  view();
}
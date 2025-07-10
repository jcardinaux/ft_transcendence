export function renderLoginPage() {
  const app = document.getElementById('app')!;
  app.innerHTML = `
    <h1 class="text-2xl font-semibold">Login</h1>
    <p class="text-gray-600">Qui andrà il form di login</p>
    <a href="/" data-link class="text-blue-500 underline mt-4 block">Torna indietro</a>
  `;
}
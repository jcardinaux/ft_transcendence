export function renderHomePage() {
  const app = document.getElementById('app')!;
  app.innerHTML = `
    <h1 class="text-3xl font-bold">Benvenuto!</h1>
    <div class="space-x-4 mt-4">
      <a href="/login" data-link class="px-4 py-2 bg-blue-500 text-white rounded">Login</a>
      <a href="/register" data-link class="px-4 py-2 bg-green-500 text-white rounded">Register</a>
    </div>
  `;
}
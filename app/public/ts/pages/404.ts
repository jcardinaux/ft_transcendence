export function error404page () {
	const app = document.getElementById('app')!;
	app.innerHTML = '<div class="bg-blue-800 text-white flex items-center justify-center min-h-screen">404 page not found :(</div>';
}

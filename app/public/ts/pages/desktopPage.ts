import { logInfo, logError } from "../utils/logger.js";
import {userApplication} from "../components/userProgram.js";
import {showUserApllication} from "../components/showUsersProgram.js"
import { Application2FA } from "../components/2faProgram.js";
import { statsProgram } from "../components/statsProgram.js";

export async function renderDesktopPage() {
	const app = document.getElementById('app')
	if(!app) return;

	try{
		const token = localStorage.getItem('token');
		if(!token){
			logError('Token JWT non trovato, utente non autenticato');
			window.location.href = '/welcome'
			return;
		}
		const res = await fetch('/html/desktopPage.html');
		const htmlPage = await res.text();
		app.innerHTML = htmlPage;
		logInfo ('desktopt page loaded');
		const response = await fetch('/api/profile/allUserInfo', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			}
		});
		if (response.status !== 200){
			logError('error retriving user info');
			window.location.href = '/welcome';
		}
		const userInfo = await response.json();
		logInfo('Dati utente:', userInfo);
		userApplication(userInfo, app);
		showUserApllication(userInfo, app);
		Application2FA(userInfo, app);
		statsProgram(userInfo, app);
	}
	catch(err){
		logError('error loading desktopPage.html', err as any);
		app.innerHTML = '<p>Error loading dwsktop.html.</p>';
	}
}
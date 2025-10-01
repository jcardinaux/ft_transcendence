import { logInfo, logError } from "../utils/logger.js";
import { Win98Window } from "../components/Win98Window.js";
import { UserListCard } from "../components/usersListCard.js";

export function statsProgram(userInfo: any, app: HTMLElement){
	const appButton = document.querySelector("#chart-icon");
	let showStats: Win98Window | null = null;

	appButton?.addEventListener('click', async () => {
		const { id, username, display_name, email, avatar} = userInfo;
		
		if(showStats) return;
		try{
			const rawHtml = await fetch ('/html/statsProgram.html');
			const window = await rawHtml.text();
			showStats = new Win98Window({
				title: 'Stats',
				content: window,
				onClose: () => {
					showStats = null;
				}
			});
			app.appendChild(showStats.element);
			
			// Carica le statistiche dal database
			await loadUserStats(showStats.element);
		}
		catch(err){
			logError("an error occured trying to start stats program", err as {} | undefined)
		}
	})

	async function loadUserStats(windowElement: HTMLElement) {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch('/api/profile/stats', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				const stats = await response.json();
				console.log('📊 Statistiche caricate:', stats);

				// Aggiorna gli elementi HTML con i dati
				const winsElement = windowElement.querySelector('#total-wins');
				const lossesElement = windowElement.querySelector('#total-losses');
				const totalElement = windowElement.querySelector('#total-games');

				if (winsElement) winsElement.textContent = stats.wins || '0';
				if (lossesElement) lossesElement.textContent = stats.losses || '0';
				if (totalElement) totalElement.textContent = stats.totalMatches || '0';

				logInfo('Statistiche aggiornate nella UI');
			} else {
				logError('Errore nel caricamento statistiche:', response.status);
			}
		} catch (error) {
			logError('Errore caricando statistiche:', error as {} | undefined);
		}
	}
}

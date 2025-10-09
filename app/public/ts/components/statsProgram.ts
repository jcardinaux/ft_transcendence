import { logInfo, logError } from "../utils/logger.js";
import { Win98Window } from "../components/Win98Window.js";
import { MatchCard } from "./matchCard.js";
import { matchOpts } from "./matchCard.js";

export interface Match{
    id: number,
    player1_id: number,
    player2_id: number,
    winner_id: number,
    score: string,
    date: string,
	gameName: string
}

type MatchArray = matchOpts[];

export function statsProgram(userInfo: any, app: HTMLElement){
	const appButton = document.querySelector("#chart-icon");
	let showStats: Win98Window | null = null;
	// Variabile per tracciare il gioco selezionato
	let selectedGameStats: 'pong' | 'peow' = 'pong';

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

			// Setup dei bottoni (sarà aggiornato dopo aver caricato i match)
			const pongBtn = showStats.element.querySelector('#pong-stats-btn') as HTMLButtonElement;
			const peowBtn = showStats.element.querySelector('#peow-stats-btn') as HTMLButtonElement;

			// Assicurati che PONG sia selezionato di default
			pongBtn?.classList.add('active-game');
			peowBtn?.classList.remove('active-game');

			const response = await fetch(`/api/matches/userAllMAtches/${id}`)

			if(response.status === 200){
				const matches : MatchArray = await response.json();
				
				// Funzione per aggiornare le statistiche
				function updateStats() {
					const totGames = showStats?.element.querySelector('#total-games') as HTMLSpanElement;
					const totWins = showStats?.element.querySelector('#total-wins') as HTMLSpanElement; 
					const totLosses = showStats?.element.querySelector('#total-losses') as HTMLSpanElement;
					
					// Due grandi if/else per separare completamente la logica
					if (selectedGameStats === 'pong') {
						// ===== LOGICA PER PONG =====
						let wins = 0;
						matches.forEach((match : matchOpts) => {
							if(match.winner_id == id && match.game_name === 'pong') {
								wins++;
							}
						});
						
						const totalPongGames = matches.filter(match => match.game_name === 'pong').length;
						const losses = totalPongGames - wins;
						
						if(totGames && totWins && totLosses){
							totGames.textContent = `${totalPongGames}`;
							totWins.textContent = `${wins}`;
							totLosses.textContent = `${losses}`;
						}
						
						const matchDiv = showStats?.element.querySelector('#match-list');
						if (matchDiv) {
							matchDiv.innerHTML = ''; // Pulisci la lista precedente
							matches.forEach(async (match : matchOpts) =>{
								if(match.game_name === 'pong') {
									const card = await MatchCard.init(match);
									matchDiv?.appendChild(card.element);
								}
							});
						}
						
					} else {
						// ===== LOGICA PER PEOW =====
						let wins = 0;
						matches.forEach((match : matchOpts) => {
							if(match.winner_id == id && match.game_name === 'peow') {
								wins++;
							}
						});
						
						const totalPeowGames = matches.filter(match => match.game_name === 'peow').length;
						const losses = totalPeowGames - wins;
						
						if(totGames && totWins && totLosses){
							totGames.textContent = `${totalPeowGames}`;
							totWins.textContent = `${wins}`;
							totLosses.textContent = `${losses}`;
						}
						
						const matchDiv = showStats?.element.querySelector('#match-list');
						if (matchDiv) {
							matchDiv.innerHTML = ''; // Pulisci la lista precedente
							matches.forEach(async (match : matchOpts) =>{
								if(match.game_name === 'peow') {
									const card = await MatchCard.init(match);
									matchDiv?.appendChild(card.element);
								}
							});
						}
					}
				}

				// Aggiorna i listener dei bottoni per ricaricare le stats
				pongBtn?.addEventListener('click', () => {
					pongBtn.classList.add('active-game');
					peowBtn?.classList.remove('active-game');
					selectedGameStats = 'pong';
					updateStats(); // ✅ Ricalcola le statistiche
				});

				peowBtn?.addEventListener('click', () => {
					peowBtn.classList.add('active-game');
					pongBtn?.classList.remove('active-game');
					selectedGameStats = 'peow';
					updateStats(); // ✅ Ricalcola le statistiche
				});
				
				// Carica le stats iniziali
				updateStats();
				app.appendChild(showStats.element);
				
				logInfo(`retrived matches from user: ${username}`)
			}
			else{
				logInfo(`error retriving matches for user: ${username}`)
			}

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

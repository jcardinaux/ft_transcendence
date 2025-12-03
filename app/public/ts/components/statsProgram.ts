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

type GameStats = {
	totalMatches: number;
	wins: number;
	losses: number;
};

type GameStatsMap = Record<string, GameStats>;

const createEmptyStats = (): GameStats => ({ totalMatches: 0, wins: 0, losses: 0 });

const normalizeGameName = (name?: string | null) => (name ?? 'unknown').toLowerCase();

function buildStatsFromMatches(matches: MatchArray, userId: number): GameStatsMap {
	return matches.reduce((acc, match) => {
		const key = normalizeGameName(match.game_name);
		if (!acc[key]) {
			acc[key] = createEmptyStats();
		}
		acc[key].totalMatches += 1;
		if (match.winner_id === userId) {
			acc[key].wins += 1;
		} else {
			acc[key].losses += 1;
		}
		return acc;
	}, {} as GameStatsMap);
}

async function fetchServerStats(token: string | null): Promise<GameStatsMap> {
	if (!token) return {};
	try {
		const response = await fetch('/api/profile/stats', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json'
			}
		});
		if (!response.ok) {
			return {};
		}
		const payload = await response.json();
		const stats: GameStatsMap = {};
		if (Array.isArray(payload.games)) {
			payload.games.forEach((game: { game?: string; totalMatches?: number; wins?: number; losses?: number; }) => {
				const key = normalizeGameName(game.game);
				stats[key] = {
					totalMatches: Number(game.totalMatches) || 0,
					wins: Number(game.wins) || 0,
					losses: Number(game.losses) || 0
				};
			});
		}
		return stats;
	}
	catch (error){
		logError('Error fetching stats from server', error as {} | undefined);
		return {};
	}
}

export function statsProgram(userInfo: any, app: HTMLElement){
	const appButton = document.querySelector("#chart-icon");
	let showStats: Win98Window | null = null;
	// Variabile per tracciare il gioco selezionato
	let selectedGameStats: 'pong' | 'peow' = 'pong';

	appButton?.addEventListener('click', async () => {
		const { id, username } = userInfo;
		const token = localStorage.getItem('token');
		
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
				const derivedStats = buildStatsFromMatches(matches, id);
				const serverStats = await fetchServerStats(token);
				let statsByGame: GameStatsMap = Object.keys(serverStats).length ? serverStats : derivedStats;
				['pong', 'peow'].forEach((game) => {
					if (!statsByGame[game]) statsByGame[game] = createEmptyStats();
				});

				// Funzione per aggiornare le statistiche
				function updateStats() {
					const totGames = showStats?.element.querySelector('#total-games') as HTMLSpanElement;
					const totWins = showStats?.element.querySelector('#total-wins') as HTMLSpanElement; 
					const totLosses = showStats?.element.querySelector('#total-losses') as HTMLSpanElement;
					const stats = statsByGame[selectedGameStats] ?? createEmptyStats();
					if(totGames && totWins && totLosses){
						totGames.textContent = `${stats.totalMatches}`;
						totWins.textContent = `${stats.wins}`;
						totLosses.textContent = `${stats.losses}`;
					}

					const matchDiv = showStats?.element.querySelector('#match-list');
					if (matchDiv) {
						matchDiv.innerHTML = '';
						matches.forEach(async (match : matchOpts) =>{
							if(normalizeGameName(match.game_name) === selectedGameStats) {
								const card = await MatchCard.init(match);
								matchDiv.appendChild(card.element);
							}
						});
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

}

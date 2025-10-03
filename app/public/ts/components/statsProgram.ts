import { logInfo, logError } from "../utils/logger.js";
import { Win98Window } from "../components/Win98Window.js";
import { MatchCard } from "./matchCard.js";

interface Match{
    id: number,
    player1_id: number,
    player2_id: number,
    winner_id: number,
    score: string,
    date: string
}

type MatchArray = Match[];

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

			const response = await fetch(`/api/matches/userAllMAtches/${id}`)

			if(response.status === 200){
				
				const totGames = showStats.element.querySelector('#total-games') as HTMLSpanElement;
				const totWins = showStats.element.querySelector('#total-wins') as HTMLSpanElement; 
				const totLosses = showStats.element.querySelector('#total-losses') as HTMLSpanElement;
				const matches : MatchArray = await response.json();
				let wins = 0;
				matches.forEach((match : Match) => {
					if(match.winner_id == id)
						wins++;
				}); 
				const losses = (matches.length) - wins;
				

				if(totGames && totWins && totLosses){
					totGames.textContent = `${matches.length}`;
					totWins.textContent = `${wins}`;
					totLosses.textContent = `${losses}`;
				
				app.appendChild(showStats.element);
				matches.forEach((match : Match) =>{
					const card = await MatchCard.init(match);
				})
				logInfo(`retrived matches from user: ${username}`)}
			}
			else{
				logInfo(`error retriving matches for user: ${username}`)
			}

		}
		catch(err){
			logError("an error occured trying to start stats program")
		}
	})
}

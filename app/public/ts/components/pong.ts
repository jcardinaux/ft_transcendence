// pong in TypeScript (da compilare in JS e usare in una pagina HTML)
// Usa <canvas id="gameCanvas" width="800" height="600"></canvas> nell'HTML


import { logInfo, logError } from "../utils/logger.js";
import { Win98Window } from "../components/Win98Window.js";


export function pong(userInfo: any, app: HTMLElement){
	const appButton = document.querySelector("#game-icon");
	let showpong: Win98Window | null = null;

	appButton?.addEventListener('click', async () => {
		const { id, username, display_name, email, avatar} = userInfo;
		
		if(showpong) return;
		try{
			const rawHtml = await fetch ('/html/pong.html');
			const windowHtml = await rawHtml.text();
			showpong = new Win98Window({
				title: 'pong Game',
				content: windowHtml,
				onClose: () => {
					showpong = null;
				}
			});
			app.appendChild(showpong.element);	
			
			// Inizializza la selezione del gioco invece del menu di modalità
			setTimeout(() => {
				initializeGameSelection(showpong!.element, userInfo);
			}, 100);
		}
		catch(err){
			logError("an error occured trying to start pong game", err as any)
		}
	})
}

// Tipi per le modalità di gioco
interface GameMode {
	type: '1v1' | '1vsCPU' | 'tournament';
	game_name: 'pong' | 'peow';
	player1: { username: string, display_name: string, id: number };
	player2?: { username: string, display_name: string, id: number };
	tournamentData?: TournamentData;
}

interface TournamentPlayer {
	username: string;
	display_name: string;
	id: number;
	verified: boolean;
}

interface TournamentMatch {
	player1: TournamentPlayer;
	player2: TournamentPlayer;
	winner?: TournamentPlayer;
	round: number;
	matchIndex: number;
}

interface TournamentData {
	game_name: 'pong' | 'peow';
	players: TournamentPlayer[];
	matches: TournamentMatch[];
	currentRound: number;
	currentMatchIndex: number;
	winner?: TournamentPlayer;
}

// Mappa per salvare i risultati: userId -> [totalMatches, totalWins, totalLoss]
const tournamentResults = new Map<number, [number, number, number]>();

// Funzione per inizializzare la selezione del gioco (pong o peow)
function initializeGameSelection(windowElement: HTMLElement, currentUser: any) {
	const gameSelection = windowElement.querySelector('#game-selection') as HTMLElement;
	const pongGameBtn = windowElement.querySelector('#pong-game-btn') as HTMLButtonElement;
	const peowGameBtn = windowElement.querySelector('#peow-game-btn') as HTMLButtonElement;

	if (!gameSelection || !pongGameBtn || !peowGameBtn) {
		logError('Elementi HTML della selezione gioco non trovati!');
		return;
	}

	// Pulsante per pong
	pongGameBtn.addEventListener('click', () => {
		// Gestione classi attive per evidenziare la selezione
		pongGameBtn.classList.add('active-game');
		peowGameBtn.classList.remove('active-game');
		initializeGameModeSelection(windowElement, currentUser, 'pong');
	});

	// Pulsante per peow
	peowGameBtn.addEventListener('click', () => {
		// Gestione classi attive per evidenziare la selezione
		peowGameBtn.classList.add('active-game');
		pongGameBtn.classList.remove('active-game');
		initializeGameModeSelection(windowElement, currentUser, 'peow');
	});
}

// Funzione per inizializzare la selezione modalità di gioco
function initializeGameModeSelection(windowElement: HTMLElement, currentUser: any, selectedGame: 'pong' | 'peow') {
	const gameSelection = windowElement.querySelector('#game-selection') as HTMLElement;
	const modeSelection = windowElement.querySelector('#game-mode-selection') as HTMLElement;
	const playerSelection = windowElement.querySelector('#player-selection') as HTMLElement;
	const gameContainer = windowElement.querySelector('#game-container') as HTMLElement;
	const gameModeTitle = windowElement.querySelector('#game-mode-title') as HTMLElement;
	
	const vsCpuBtn = windowElement.querySelector('#vs-cpu-btn') as HTMLButtonElement;
	const vsPlayerBtn = windowElement.querySelector('#vs-player-btn') as HTMLButtonElement;
	const tournamentBtn = windowElement.querySelector('#tournament-btn') as HTMLButtonElement;
	const startPvpBtn = windowElement.querySelector('#start-pvp-btn') as HTMLButtonElement;
	const backToMenuBtn = windowElement.querySelector('#back-to-menu-btn') as HTMLButtonElement;
	const backToGameSelectionBtn = windowElement.querySelector('#back-to-game-selection-btn') as HTMLButtonElement;
	const opponentInput = windowElement.querySelector('#opponent-username') as HTMLInputElement;
	const validationMessage = windowElement.querySelector('#user-validation-message') as HTMLElement;

	if (!gameSelection || !modeSelection || !playerSelection || !gameContainer) {
		logError('Elementi HTML del menu non trovati!');
		return;
	}

	// Nascondi la selezione del gioco e mostra la selezione delle modalità
	gameSelection.style.display = 'none';
	modeSelection.style.display = 'block';

	// Aggiorna il titolo in base al gioco selezionato
	if (gameModeTitle) {
		const gameIcon = selectedGame === 'pong' ? '🏓' : '⚡';
		gameModeTitle.textContent = `${gameIcon} ${selectedGame} - Scegli la modalità`;
	}

	// Modalità Practice vs CPU
	vsCpuBtn?.addEventListener('click', () => {
		if (selectedGame === 'pong') {
			const gameMode: GameMode = {
				type: '1vsCPU',
				game_name: 'pong',
				player1: currentUser
			};
			startGame(windowElement, gameMode);
		} else if (selectedGame === 'peow') {
			const gameMode: GameMode = {
				type: '1vsCPU',
				game_name: 'peow',
				player1: currentUser
			};
			startGame(windowElement, gameMode);
		}
	});

	// Modalità 1 vs 1
	vsPlayerBtn?.addEventListener('click', () => {
		modeSelection.style.display = 'none';
		playerSelection.style.display = 'block';
	});

	// Modalità Torneo
	tournamentBtn?.addEventListener('click', () => {
		if (selectedGame === 'pong') {
			initializeTournamentSetup(windowElement, currentUser, selectedGame);
		} else if (selectedGame === 'peow') {
			initializeTournamentSetup(windowElement, currentUser, selectedGame);
		}
	});

	// Torna alla selezione del gioco
	backToGameSelectionBtn?.addEventListener('click', () => {
		modeSelection.style.display = 'none';
		gameSelection.style.display = 'block';
		
		// Ripristina stato bottoni gioco (rimuove selezione attiva)
		const pongGameBtn = windowElement.querySelector('#pong-game-btn') as HTMLButtonElement;
		const peowGameBtn = windowElement.querySelector('#peow-game-btn') as HTMLButtonElement;
		pongGameBtn?.classList.remove('active-game');
		peowGameBtn?.classList.remove('active-game');
		
		if (validationMessage) validationMessage.textContent = '';
		if (opponentInput) opponentInput.value = '';
	});

	// Torna al menu delle modalità
	backToMenuBtn?.addEventListener('click', () => {
		playerSelection.style.display = 'none';
		modeSelection.style.display = 'block';
		if (validationMessage) validationMessage.textContent = '';
		if (opponentInput) opponentInput.value = '';
	});

	// Inizia partita PvP
	startPvpBtn?.addEventListener('click', async () => {
		const opponentUsername = opponentInput?.value.trim();
		
		if (!opponentUsername) {
			if (validationMessage) {
				validationMessage.textContent = 'Inserisci un nome utente!';
				validationMessage.style.color = 'red';
			}
			return;
		}

		if (opponentUsername.toLowerCase() === currentUser.username.toLowerCase()) {
			if (validationMessage) {
				validationMessage.textContent = 'Non puoi giocare contro te stesso!';
				validationMessage.style.color = 'red';
			}
			return;
		}

		// Verifica se l'utente esiste
		try {
			if (validationMessage) {
				validationMessage.textContent = 'Verificando utente...';
				validationMessage.style.color = 'orange';
			}

			const response = await fetch(`/api/auth/getuser/${opponentUsername}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (response.status === 200) {
				const opponentUser = await response.json();
				
				if (validationMessage) {
					validationMessage.textContent = `✅ Utente ${opponentUser.display_name || opponentUser.username} trovato!`;
					validationMessage.style.color = 'green';
				}

				// Avvia il gioco PvP
				setTimeout(() => {
					const gameMode: GameMode = {
						type: '1v1',
						game_name: selectedGame,
						player1: currentUser,
						player2: opponentUser
					};
					startGame(windowElement, gameMode);
				}, 1000);

			} else if (response.status === 404) {
				if (validationMessage) {
					validationMessage.textContent = `❌ Utente "${opponentUsername}" non trovato!`;
					validationMessage.style.color = 'red';
				}
			} else {
				if (validationMessage) {
					validationMessage.textContent = '❌ Errore durante la verifica utente';
					validationMessage.style.color = 'red';
				}
			}
		} catch (error) {
			logError('Errore verifica utente:', error as any);
			if (validationMessage) {
				validationMessage.textContent = '❌ Errore di connessione';
				validationMessage.style.color = 'red';
			}
		}
	});
}

// Funzione per avviare il gioco con la modalità selezionata
function startGame(windowElement: HTMLElement, gameMode: GameMode) {
	// Nascondi i menu e mostra il gioco
	const modeSelection = windowElement.querySelector('#game-mode-selection') as HTMLElement;
	const playerSelection = windowElement.querySelector('#player-selection') as HTMLElement;
	const tournamentBracket = windowElement.querySelector('#tournament-bracket') as HTMLElement;
	const gameContainer = windowElement.querySelector('#game-container') as HTMLElement;
	const playerNames = windowElement.querySelector('#player-names') as HTMLElement;

	if (!modeSelection || !playerSelection || !gameContainer) {
		logError('Elementi HTML del gioco non trovati!');
		return;
	}

	modeSelection.style.display = 'none';
	playerSelection.style.display = 'none';
	if (tournamentBracket) tournamentBracket.style.display = 'none';
	gameContainer.style.display = 'block';

	// Imposta i nomi dei giocatori
	if (playerNames) {
		if (gameMode.type === '1vsCPU') {
			playerNames.textContent = `${gameMode.player1.display_name || gameMode.player1.username} vs CPU`;
		} else if (gameMode.type === 'tournament') {
			const roundNames = ['', 'Quarti di Finale', 'Semifinali', 'Finale'];
			const roundName = gameMode.tournamentData ? roundNames[gameMode.tournamentData.currentRound] : 'Torneo';
			playerNames.textContent = `${roundName}: ${gameMode.player1.display_name || gameMode.player1.username} vs ${gameMode.player2?.display_name || gameMode.player2?.username}`;
		} else {
			playerNames.textContent = `${gameMode.player1.display_name || gameMode.player1.username} vs ${gameMode.player2?.display_name || gameMode.player2?.username}`;
		}
	}

	// Avvia il gioco appropriato
	if (gameMode.game_name === 'peow') {
		initializepeowGame(windowElement, gameMode);
	} else {
		initializepongGame(windowElement, gameMode);
	}
}

// =============== FUNZIONI PER LA GESTIONE DEL TORNEO ===============

// Funzione per inizializzare il setup del torneo
function initializeTournamentSetup(windowElement: HTMLElement, currentUser: any, selectedGame: 'pong' | 'peow') {
	const modeSelection = windowElement.querySelector('#game-mode-selection') as HTMLElement;
	const tournamentSetup = windowElement.querySelector('#tournament-setup') as HTMLElement;
	const currentUserDisplay = windowElement.querySelector('#current-user-display') as HTMLElement;
	
	if (!modeSelection || !tournamentSetup) {
		logError('Elementi HTML del torneo non trovati!');
		return;
	}
	
	// Nascondi il menu principale e mostra il setup torneo
	modeSelection.style.display = 'none';
	tournamentSetup.style.display = 'block';
	
	// Mostra l'utente corrente (con indicatore se non registrato)
	if (currentUserDisplay) {
		const userLabel = currentUser.id === 0 
			? `Tu (${currentUser.display_name || currentUser.username}) 👤`
			: `Tu (${currentUser.display_name || currentUser.username})`;
		currentUserDisplay.textContent = userLabel;
	}
	
	// Inizializza gli event listeners per il setup del torneo
	initializeTournamentEventListeners(windowElement, currentUser, selectedGame);
	
	// Controlla inizialmente lo stato dei pulsanti
	checkAllPlayersVerified(windowElement);
}

// Funzione per inizializzare tutti gli event listeners del torneo
function initializeTournamentEventListeners(windowElement: HTMLElement, currentUser: any, selectedGame: 'pong' | 'peow') {
	const verifyButtons = windowElement.querySelectorAll('.verify-player-btn') as NodeListOf<HTMLButtonElement>;
	const startTournamentBtn = windowElement.querySelector('#start-tournament-btn') as HTMLButtonElement;
	const backToMenuTournamentBtn = windowElement.querySelector('#back-to-menu-tournament-btn') as HTMLButtonElement;
	
	console.log(`Trovati ${verifyButtons.length} pulsanti di verifica`);
	console.log('Pulsante start tournament:', startTournamentBtn ? 'trovato' : 'NON TROVATO');
	
	// Event listeners per verificare i giocatori
	verifyButtons.forEach((button, index) => {
		const playerNum = button.getAttribute('data-player');
		console.log(`Attaching listener al pulsante ${index + 1}, player-${playerNum}`);
		
		button.addEventListener('click', async (e) => {
			const playerNum = (e.target as HTMLButtonElement).getAttribute('data-player');
			console.log(`Click su pulsante per player ${playerNum}`);
			if (playerNum) {
				await verifyTournamentPlayer(windowElement, playerNum, currentUser);
			}
		});
	});
	
	// Event listener per iniziare il torneo
	if (startTournamentBtn) {
		startTournamentBtn.addEventListener('click', () => {
			console.log('Click su Start Tournament');
			startTournament(windowElement, currentUser, selectedGame);
		});
	} else {
		logError('Pulsante start tournament non trovato durante l\'inizializzazione!');
	}
	
	// Event listener per tornare al menu
	backToMenuTournamentBtn?.addEventListener('click', () => {
		backToMainMenu(windowElement);
	});
}

// Funzione per verificare un singolo giocatore del torneo
async function verifyTournamentPlayer(windowElement: HTMLElement, playerNum: string, currentUser: any) {
	const playerInput = windowElement.querySelector(`#player-${playerNum}`) as HTMLInputElement;
	const verifyButton = windowElement.querySelector(`.verify-player-btn[data-player="${playerNum}"]`) as HTMLButtonElement;
	const validationMessage = windowElement.querySelector('#tournament-validation-message') as HTMLElement;
	
	if (!playerInput || !verifyButton) {
		logError(`Elementi per player ${playerNum} non trovati!`);
		return;
	}
	
	const username = playerInput.value.trim();
	
	if (!username) {
		showValidationMessage(validationMessage, `❌ Inserisci un nome per il giocatore ${playerNum}`, 'red');
		return;
	}
	
	if (username.toLowerCase() === currentUser.username.toLowerCase()) {
		showValidationMessage(validationMessage, `❌ Il giocatore ${playerNum} non può essere te stesso!`, 'red');
		return;
	}
	
	// Controlla se questo username è già stato inserito in un altro campo
	const allInputs = windowElement.querySelectorAll('input[id^="player-"]') as NodeListOf<HTMLInputElement>;
	let duplicateFound = false;
	
	allInputs.forEach((input) => {
		if (input.id !== `player-${playerNum}` && input.value.trim().toLowerCase() === username.toLowerCase()) {
			duplicateFound = true;
		}
	});
	
	if (duplicateFound) {
		showValidationMessage(validationMessage, `❌ Il giocatore "${username}" è già stato inserito!`, 'red');
		return;
	}
	
	try {
		// Disabilita il pulsante durante la verifica
		verifyButton.disabled = true;
		verifyButton.textContent = '...';
		showValidationMessage(validationMessage, `🔍 Verificando ${username}...`, 'orange');
		
		const response = await fetch(`/api/auth/getuser/${username}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		
		if (response.status === 200) {
			const userData = await response.json();
			
			console.log(`✅ Utente ${username} verificato:`, userData);
			
			// Marca come verificato
			verifyButton.textContent = '✅';
			verifyButton.style.background = '#4CAF50';
			verifyButton.style.color = 'white';
			playerInput.style.borderColor = '#4CAF50';
			playerInput.style.background = '#e8f5e8';
			playerInput.disabled = true;
			
			// Salva i dati del giocatore nell'elemento
			verifyButton.setAttribute('data-user-id', String(userData.id));
			verifyButton.setAttribute('data-display-name', userData.display_name || userData.username);
			
			showValidationMessage(validationMessage, `✅ ${userData.display_name || userData.username} verificato!`, 'green');
			
			// Controlla se tutti i giocatori sono stati verificati
			console.log('Controllo se tutti i giocatori sono verificati...');
			checkAllPlayersVerified(windowElement);
			
		} else if (response.status === 404) {
			// Utente non registrato: accetta come alias con id=0
			console.log(`👤 Utente non registrato "${username}" - usando come alias`);
			
			// Marca come verificato (utente non registrato)
			verifyButton.textContent = '👤';
			verifyButton.style.background = '#FF9800';
			verifyButton.style.color = 'white';
			playerInput.style.borderColor = '#FF9800';
			playerInput.style.background = '#fff3e0';
			playerInput.disabled = true;
			
			// Salva i dati del giocatore non registrato (id=0)
			verifyButton.setAttribute('data-user-id', '0');
			verifyButton.setAttribute('data-display-name', username);
			
			showValidationMessage(validationMessage, `👤 "${username}" aggiunto come giocatore non registrato`, 'orange');
			
			// Controlla se tutti i giocatori sono stati verificati
			checkAllPlayersVerified(windowElement);
			
		} else {
			verifyButton.disabled = false;
			verifyButton.textContent = '✓';
			showValidationMessage(validationMessage, '❌ Errore durante la verifica', 'red');
		}
		
	} catch (error) {
		logError('Errore verifica giocatore torneo:', error as any);
		verifyButton.disabled = false;
		verifyButton.textContent = '✓';
		showValidationMessage(validationMessage, '❌ Errore di connessione', 'red');
	}
}

// Funzione per controllare se tutti i giocatori sono stati verificati
function checkAllPlayersVerified(windowElement: HTMLElement) {
	const verifyButtons = windowElement.querySelectorAll('.verify-player-btn') as NodeListOf<HTMLButtonElement>;
	const startTournamentBtn = windowElement.querySelector('#start-tournament-btn') as HTMLButtonElement;
	
	if (!startTournamentBtn) {
		logError('Pulsante start tournament non trovato!');
		return;
	}
	
	let verifiedCount = 0;
	let totalButtons = 0;
	
	verifyButtons.forEach(button => {
		totalButtons++;
		// Accetta sia giocatori registrati (✅) che non registrati (👤)
		if (button.textContent === '✅' || button.textContent === '👤') {
			verifiedCount++;
		}
		console.log(`Button ${button.getAttribute('data-player')}: ${button.textContent}`);
	});
	
	console.log(`Giocatori verificati: ${verifiedCount}/${totalButtons}`);
	
	const allVerified = verifiedCount === 7; // Servono 7 giocatori oltre all'utente corrente
	
	startTournamentBtn.disabled = !allVerified;
	if (allVerified) {
		startTournamentBtn.style.opacity = '1';
		startTournamentBtn.style.background = '#FF9800';
		console.log('✅ Tutti i giocatori verificati! Pulsante abilitato.');
	} else {
		startTournamentBtn.style.opacity = '0.6';
		startTournamentBtn.style.background = '';
		console.log(`❌ Ancora ${7 - verifiedCount} giocatori da verificare.`);
	}
}

// Funzione per iniziare il torneo (MODIFICATA per usare il ranking)
async function startTournament(windowElement: HTMLElement, currentUser: any, selectedGame: 'pong' | 'peow') {
	// Raccoglie tutti i giocatori verificati
	const players: TournamentPlayer[] = [];
	
	// Aggiungi l'utente corrente come primo giocatore
	players.push({
		username: currentUser.username,
		display_name: currentUser.display_name || currentUser.username,
		id: currentUser.id,
		verified: true
	});
	
	// Aggiungi gli altri 7 giocatori (registrati ✅ o non registrati 👤)
	const verifyButtons = windowElement.querySelectorAll('.verify-player-btn') as NodeListOf<HTMLButtonElement>;
	verifyButtons.forEach(button => {
		if (button.textContent === '✅' || button.textContent === '👤') {
			const playerNum = button.getAttribute('data-player');
			const playerInput = windowElement.querySelector(`#player-${playerNum}`) as HTMLInputElement;
			
			if (playerInput) {
				players.push({
					username: playerInput.value.trim(),
					display_name: button.getAttribute('data-display-name') || playerInput.value.trim(),
					id: parseInt(button.getAttribute('data-user-id') || '0'),
					verified: true
				});
			}
		}
	});
	
	if (players.length !== 8) {
		const validationMessage = windowElement.querySelector('#tournament-validation-message') as HTMLElement;
		showValidationMessage(validationMessage, '❌ Tutti gli 8 giocatori devono essere verificati!', 'red');
		return;
	}

	// Mostra messaggio di caricamento
	const validationMessage = windowElement.querySelector('#tournament-validation-message') as HTMLElement;
	showValidationMessage(validationMessage, `🏆 Creando ranking basato sui match di ${selectedGame} giocati...`, 'orange');

	try {
		// Ottieni il ranking dei giocatori per il gioco specifico
		const ranking = await getUserMatchRanking(players, selectedGame);
		
		// Riordina i players secondo il ranking
		const rankedPlayers: TournamentPlayer[] = [];
		
		ranking.forEach(rankedUser => {
			const player = players.find(p => p.id === rankedUser.id);
			if (player) {
				rankedPlayers.push(player);
			}
		});
		
		// Aggiungi eventuali giocatori mancanti (non dovrebbe succedere)
		players.forEach(player => {
			if (!rankedPlayers.find(p => p.id === player.id)) {
				rankedPlayers.push(player);
			}
		});

		console.log('🏆 Ordine finale del torneo:');
		rankedPlayers.forEach((player, index) => {
			const userRank = ranking.find(r => r.id === player.id);
			console.log(`${index + 1}. ${player.display_name} (${userRank?.totalMatches || 0} partite)`);
		});
		
		// Inizializza la mappa dei risultati per tutti i giocatori
		rankedPlayers.forEach(player => {
			if (!tournamentResults.has(player.id)) {
				tournamentResults.set(player.id, [0, 0, 0]); // [totalMatches, totalWins, totalLoss]
			}
		});
		
		// Crea il torneo con i giocatori ordinati per ranking
		const tournamentData: TournamentData = createTournamentBracket(rankedPlayers, selectedGame);
		
		// Nascondi il setup e mostra il bracket
		const tournamentSetup = windowElement.querySelector('#tournament-setup') as HTMLElement;
		const tournamentBracket = windowElement.querySelector('#tournament-bracket') as HTMLElement;
		
		if (tournamentSetup) tournamentSetup.style.display = 'none';
		if (tournamentBracket) tournamentBracket.style.display = 'block';
		
		// Mostra messaggio di successo
		showValidationMessage(validationMessage, `✅ Torneo ${selectedGame} creato con ranking!`, 'green');
		
		// Inizializza il display del bracket
		displayTournamentBracket(windowElement, tournamentData);
		
		// Inizializza gli event listeners per il bracket
		initializeBracketEventListeners(windowElement, tournamentData);
		
	} catch (error) {
		logError('Errore nella creazione del torneo con ranking:', error as any);
		showValidationMessage(validationMessage, '❌ Errore nella creazione del ranking. Usando ordine casuale...', 'red');
		
		// Fallback: usa il sistema precedente (casuale)
		const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
		
		// Inizializza la mappa dei risultati
		shuffledPlayers.forEach(player => {
			if (!tournamentResults.has(player.id)) {
				tournamentResults.set(player.id, [0, 0, 0]);
			}
		});
		
		const tournamentData: TournamentData = createTournamentBracket(shuffledPlayers, selectedGame);
		
		const tournamentSetup = windowElement.querySelector('#tournament-setup') as HTMLElement;
		const tournamentBracket = windowElement.querySelector('#tournament-bracket') as HTMLElement;
		
		if (tournamentSetup) tournamentSetup.style.display = 'none';
		if (tournamentBracket) tournamentBracket.style.display = 'block';
		
		displayTournamentBracket(windowElement, tournamentData);
		initializeBracketEventListeners(windowElement, tournamentData);
	}
}

// Funzione per creare il bracket del torneo (MODIFICATA per usare il ranking)
function createTournamentBracket(players: TournamentPlayer[], selectedGame: 'pong' | 'peow'): TournamentData {
	console.log('🏆 Creando bracket del torneo con ranking...');
	
	// Non mescolare più casualmente - useremo il ranking
	const orderedPlayers = [...players];
	
	const matches: TournamentMatch[] = [];
	
	// Crea i match del primo round basati sul ranking
	// 1° vs 2°, 3° vs 4°, 5° vs 6°, 7° vs 8°
	for (let i = 0; i < 8; i += 2) {
		const player1 = orderedPlayers[i];
		const player2 = orderedPlayers[i + 1];
		
		console.log(`🥊 Match ${Math.floor(i / 2) + 1}: ${player1.display_name} (${i + 1}°) vs ${player2.display_name} (${i + 2}°)`);
		
		matches.push({
			player1: player1,
			player2: player2,
			round: 1,
			matchIndex: Math.floor(i / 2)
		});
	}
	
	return {
		game_name: selectedGame,
		players: orderedPlayers,
		matches,
		currentRound: 1,
		currentMatchIndex: 0
	};
}

// Funzione per visualizzare il bracket del torneo
function displayTournamentBracket(windowElement: HTMLElement, tournamentData: TournamentData) {
	const bracketDisplay = windowElement.querySelector('#bracket-display') as HTMLElement;
	const currentMatchInfo = windowElement.querySelector('#current-match-info') as HTMLElement;
	
	if (!bracketDisplay || !currentMatchInfo) return;
	
	let html = '<div style="display: flex; justify-content: space-between; max-width: 800px; margin: 0 auto;">';
	
	// Quarti di finale (Round 1)
	html += '<div style="flex: 1;"><h4>Quarti di Finale</h4>';
	const quarterFinals = tournamentData.matches.filter(m => m.round === 1);
	quarterFinals.forEach((match, index) => {
		const isCompleted = !!match.winner;
		const isCurrent = tournamentData.currentRound === 1 && tournamentData.currentMatchIndex === index;
		
		html += `<div style="
			margin: 10px 0; 
			padding: 10px; 
			border: 2px solid ${isCurrent ? '#FF9800' : (isCompleted ? '#4CAF50' : '#ddd')}; 
			border-radius: 5px;
			background: ${isCurrent ? '#fff3e0' : (isCompleted ? '#e8f5e8' : '#f9f9f9')};
		">`;
		html += `<div>${match.player1.display_name}${match.player1.id === 0 ? ' 👤' : ''}</div>`;
		html += `<div style="text-align: center; font-weight: bold; margin: 5px 0;">VS</div>`;
		html += `<div>${match.player2.display_name}${match.player2.id === 0 ? ' 👤' : ''}</div>`;
		if (match.winner) {
			html += `<div style="text-align: center; margin-top: 5px; font-weight: bold; color: green;">Vincitore: ${match.winner.display_name}</div>`;
		}
		html += '</div>';
	});
	html += '</div>';
	
	// Semifinali (Round 2)
	html += '<div style="flex: 1;"><h4>Semifinali</h4>';
	const semiFinals = tournamentData.matches.filter(m => m.round === 2);
	if (semiFinals.length > 0) {
		semiFinals.forEach((match, index) => {
			const isCompleted = !!match.winner;
			const isCurrent = tournamentData.currentRound === 2 && tournamentData.currentMatchIndex === index;
			
			html += `<div style="
				margin: 20px 0; 
				padding: 10px; 
				border: 2px solid ${isCurrent ? '#FF9800' : (isCompleted ? '#4CAF50' : '#ddd')}; 
				border-radius: 5px;
				background: ${isCurrent ? '#fff3e0' : (isCompleted ? '#e8f5e8' : '#f9f9f9')};
			">`;
			html += `<div>${match.player1.display_name}${match.player1.id === 0 ? ' 👤' : ''}</div>`;
			html += `<div style="text-align: center; font-weight: bold; margin: 5px 0;">VS</div>`;
			html += `<div>${match.player2.display_name}${match.player2.id === 0 ? ' 👤' : ''}</div>`;
			if (match.winner) {
				html += `<div style="text-align: center; margin-top: 5px; font-weight: bold; color: green;">Vincitore: ${match.winner.display_name}</div>`;
			}
			html += '</div>';
		});
	} else {
		html += '<div style="color: #999; font-style: italic; margin: 30px 0;">In attesa dei risultati dei quarti...</div>';
	}
	html += '</div>';
	
	// Finale (Round 3)
	html += '<div style="flex: 1;"><h4>Finale</h4>';
	const finals = tournamentData.matches.filter(m => m.round === 3);
	if (finals.length > 0) {
		const match = finals[0];
		const isCompleted = !!match.winner;
		const isCurrent = tournamentData.currentRound === 3 && tournamentData.currentMatchIndex === 0;
		
		html += `<div style="
			margin: 30px 0; 
			padding: 15px; 
			border: 3px solid ${isCurrent ? '#FF9800' : (isCompleted ? '#4CAF50' : '#ddd')}; 
			border-radius: 8px;
			background: ${isCurrent ? '#fff3e0' : (isCompleted ? '#e8f5e8' : '#f9f9f9')};
		">`;
		html += `<div style="font-size: 16px; font-weight: bold;">${match.player1.display_name}${match.player1.id === 0 ? ' 👤' : ''}</div>`;
		html += `<div style="text-align: center; font-weight: bold; margin: 8px 0; font-size: 18px;">VS</div>`;
		html += `<div style="font-size: 16px; font-weight: bold;">${match.player2.display_name}${match.player2.id === 0 ? ' 👤' : ''}</div>`;
		if (match.winner) {
			html += `<div style="text-align: center; margin-top: 10px; font-weight: bold; color: gold; font-size: 18px;">🏆 CAMPIONE: ${match.winner.display_name}! 🏆</div>`;
		}
		html += '</div>';
	} else {
		html += '<div style="color: #999; font-style: italic; margin: 50px 0;">In attesa dei risultati delle semifinali...</div>';
	}
	html += '</div>';
	
	html += '</div>';
	
	bracketDisplay.innerHTML = html;
	
	// Aggiorna le informazioni del match corrente
	updateCurrentMatchInfo(windowElement, tournamentData);
}

// Funzione per aggiornare le info del match corrente
function updateCurrentMatchInfo(windowElement: HTMLElement, tournamentData: TournamentData) {
	const currentMatchInfo = windowElement.querySelector('#current-match-info') as HTMLElement;
	const startMatchBtn = windowElement.querySelector('#start-current-match-btn') as HTMLButtonElement;
	
	if (!currentMatchInfo || !startMatchBtn) return;
	
	if (tournamentData.winner) {
		currentMatchInfo.innerHTML = `🏆 <span style="color: gold;">TORNEO COMPLETATO!</span><br>Campione: <strong>${tournamentData.winner.display_name}</strong>`;
		startMatchBtn.style.display = 'none';
		return;
	}
	
	// Trova il match corrente
	const currentMatches = tournamentData.matches.filter(m => m.round === tournamentData.currentRound);
	if (tournamentData.currentMatchIndex >= currentMatches.length) {
		// Round completato, passa al prossimo
		advanceToNextRound(windowElement, tournamentData);
		return;
	}
	
	const currentMatch = currentMatches[tournamentData.currentMatchIndex];
	if (!currentMatch) {
		currentMatchInfo.textContent = 'Errore nel trovare il match corrente';
		return;
	}
	
	const roundNames = ['', 'Quarti di Finale', 'Semifinali', 'Finale'];
	const p1Label = currentMatch.player1.id === 0 
		? `${currentMatch.player1.display_name} 👤` 
		: currentMatch.player1.display_name;
	const p2Label = currentMatch.player2.id === 0 
		? `${currentMatch.player2.display_name} 👤` 
		: currentMatch.player2.display_name;
	currentMatchInfo.innerHTML = `
		<span style="color: #FF9800;">${roundNames[tournamentData.currentRound]} - Match ${tournamentData.currentMatchIndex + 1}</span><br>
		<strong>${p1Label}</strong> vs <strong>${p2Label}</strong>
	`;
}

// Funzione per inizializzare gli event listeners del bracket
function initializeBracketEventListeners(windowElement: HTMLElement, tournamentData: TournamentData) {
	const startMatchBtn = windowElement.querySelector('#start-current-match-btn') as HTMLButtonElement;
	
	startMatchBtn?.addEventListener('click', () => {
		startCurrentTournamentMatch(windowElement, tournamentData);
	});
}

// Funzione per iniziare il match corrente del torneo
function startCurrentTournamentMatch(windowElement: HTMLElement, tournamentData: TournamentData) {
	const currentMatches = tournamentData.matches.filter(m => m.round === tournamentData.currentRound);
	const currentMatch = currentMatches[tournamentData.currentMatchIndex];
	
	if (!currentMatch) {
		logError('Match corrente non trovato');
		return;
	}
	
	// Crea la modalità di gioco per il match del torneo
	const gameMode: GameMode = {
		type: 'tournament',
		game_name: tournamentData.game_name,
		player1: currentMatch.player1,
		player2: currentMatch.player2,
		tournamentData: tournamentData
	};
	
	// Nascondi il bracket e inizia il gioco
	const tournamentBracket = windowElement.querySelector('#tournament-bracket') as HTMLElement;
	if (tournamentBracket) tournamentBracket.style.display = 'none';
	
	startGame(windowElement, gameMode);
}

// Funzione per avanzare al prossimo round del torneo
function advanceToNextRound(windowElement: HTMLElement, tournamentData: TournamentData) {
	const completedMatches = tournamentData.matches.filter(m => m.round === tournamentData.currentRound && m.winner);
	const totalMatchesInRound = tournamentData.matches.filter(m => m.round === tournamentData.currentRound).length;
	
	if (completedMatches.length < totalMatchesInRound) {
		// Non tutti i match del round sono completati
		return;
	}
	
	// Crea i match per il prossimo round
	const winners = completedMatches.map(m => m.winner!);
	
	if (winners.length === 1) {
		// Abbiamo un vincitore del torneo!
		tournamentData.winner = winners[0];
		displayTournamentBracket(windowElement, tournamentData);
		return;
	}
	
	// Crea i match per il prossimo round
	const nextRound = tournamentData.currentRound + 1;
	for (let i = 0; i < winners.length; i += 2) {
		if (i + 1 < winners.length) {
			tournamentData.matches.push({
				player1: winners[i],
				player2: winners[i + 1],
				round: nextRound,
				matchIndex: Math.floor(i / 2)
			});
		}
	}
	
	// Aggiorna il round corrente
	tournamentData.currentRound = nextRound;
	tournamentData.currentMatchIndex = 0;
	
	// Aggiorna la visualizzazione
	displayTournamentBracket(windowElement, tournamentData);
}

// Funzione per gestire la fine di un match del torneo
function handleTournamentMatchEnd(windowElement: HTMLElement, gameMode: GameMode, winner: 'player1' | 'player2') {
	if (!gameMode.tournamentData) return;
	
	// Trova il match corrente e imposta il vincitore
	const currentMatches = gameMode.tournamentData.matches.filter(m => m.round === gameMode.tournamentData!.currentRound);
	const currentMatch = currentMatches[gameMode.tournamentData.currentMatchIndex];
	
	if (currentMatch) {
		const winnerPlayer = winner === 'player1' ? currentMatch.player1 : currentMatch.player2;
		const loserPlayer = winner === 'player1' ? currentMatch.player2 : currentMatch.player1;
		
		currentMatch.winner = winnerPlayer;
		
		// Aggiorna i risultati nella mappa
		updateTournamentResults(winnerPlayer.id, true);
		updateTournamentResults(loserPlayer.id, false);
		
		// Salva il match nel database
		saveMatchToDatabase(gameMode, winner === 'player1' ? 0 : 1, winner === 'player2' ? 0 : 1, winner);
		
		// Avanza al prossimo match
		gameMode.tournamentData.currentMatchIndex++;
		
		// Controlla se il round è completato
		const completedMatches = currentMatches.filter(m => m.winner);
		if (completedMatches.length === currentMatches.length) {
			// Round completato, crea il prossimo round
			advanceToNextRound(windowElement, gameMode.tournamentData);
		}
		
		// Torna al bracket
		const gameContainer = windowElement.querySelector('#game-container') as HTMLElement;
		const tournamentBracket = windowElement.querySelector('#tournament-bracket') as HTMLElement;
		
		if (gameContainer) gameContainer.style.display = 'none';
		if (tournamentBracket) tournamentBracket.style.display = 'block';
		
		// Aggiorna la visualizzazione del bracket
		displayTournamentBracket(windowElement, gameMode.tournamentData);
	}
}

// Funzione per aggiornare i risultati del torneo
function updateTournamentResults(playerId: number, won: boolean) {
	const currentStats = tournamentResults.get(playerId) || [0, 0, 0];
	const newStats: [number, number, number] = [
		currentStats[0] + 1, // totalMatches
		currentStats[1] + (won ? 1 : 0), // totalWins
		currentStats[2] + (won ? 0 : 1)  // totalLoss
	];
	tournamentResults.set(playerId, newStats);
}

// Funzione per ottenere la classifica utenti per numero di partite
async function getUserMatchRanking(players: TournamentPlayer[], gameName: 'pong' | 'peow'): Promise<Array<{
	id: number,
	username: string,
	display_name: string,
	totalMatches: number,
	wins: number,
	losses: number
}>> {
	try {
		console.log(`🏆 Caricando classifica utenti per torneo ${gameName}...`, players.map(p => `${p.display_name} (${p.id})`));

		// Mappa per contare le statistiche di ogni utente
		const userStats = new Map<number, {
			id: number,
			username: string,
			display_name: string,
			totalMatches: number,
			wins: number,
			losses: number
		}>();

		// Inizializza tutti gli utenti con 0 match usando i dati già disponibili
		// Gli utenti non registrati (id=0) vengono inizializzati ma non avranno match dal DB
		players.forEach(player => {
			if (player.id === 0) {
				console.log(`👤 Inizializzando giocatore NON REGISTRATO: ${player.display_name} (id=0)`);
			} else {
				console.log(`✅ Inizializzando giocatore: ${player.display_name} (${player.id})`);
			}
			userStats.set(player.id, {
				id: player.id,
				username: player.username,
				display_name: player.display_name,
				totalMatches: 0,
				wins: 0,
				losses: 0
			});
		});

		// Ottieni tutti i match dal database
		const response = await fetch('/api/matches/allMatches');
		
		if (!response.ok) {
			logError('Errore nel caricamento dei match per la classifica');
			return Array.from(userStats.values());
		}

		const matches = await response.json();
		console.log('📊 Match totali caricati:', matches.length);
		console.log('📋 Primi 3 match dal database:', matches.slice(0, 3));

		// Filtra i match per il gioco specifico
		const gameMatches = matches.filter((match: any) => {
			console.log(`🔍 Match: game_name="${match.game_name}", cercando "${gameName}"`);
			return match.game_name === gameName;
		});
		console.log(`📊 Match di ${gameName} trovati:`, gameMatches.length);
		console.log('📋 Match filtrati:', gameMatches);

		// Conta le statistiche per ogni match che coinvolge i nostri utenti (solo per il gioco specifico)
		// Nota: gli utenti non registrati (id=0) non avranno match nel database
		for (const match of gameMatches) {
			const player1Id = match.player1_id;
			const player2Id = match.player2_id;
			const winnerId = match.winner_id;
			
			// Salta match che coinvolgono utenti non registrati (id=0)
			if (player1Id === 0 || player2Id === 0) {
				continue;
			}
			
			console.log(`🥊 Processing match: P1=${player1Id}, P2=${player2Id}, Winner=${winnerId}`);

			// Aggiorna statistiche solo per gli utenti del torneo e solo per partite del gioco specifico
			if (userStats.has(player1Id)) {
				const player1Stats = userStats.get(player1Id)!;
				player1Stats.totalMatches++;
				if (winnerId === player1Id) {
					player1Stats.wins++;
				} else {
					player1Stats.losses++;
				}
				console.log(`📊 P1 ${player1Id} stats: ${player1Stats.totalMatches}M, ${player1Stats.wins}W, ${player1Stats.losses}L`);
			}

			if (userStats.has(player2Id)) {
				const player2Stats = userStats.get(player2Id)!;
				player2Stats.totalMatches++;
				if (winnerId === player2Id) {
					player2Stats.wins++;
				} else {
					player2Stats.losses++;
				}
				console.log(`📊 P2 ${player2Id} stats: ${player2Stats.totalMatches}M, ${player2Stats.wins}W, ${player2Stats.losses}L`);
			}
		}

		// Converti la mappa in array
		const userArray = Array.from(userStats.values());
		console.log('👥 Statistiche finali utenti prima del sorting:', userArray);

		// Raggruppa utenti per numero di partite
		const groupedByMatches = new Map<number, typeof userArray>();
		
		userArray.forEach(user => {
			const matchCount = user.totalMatches;
			if (!groupedByMatches.has(matchCount)) {
				groupedByMatches.set(matchCount, []);
			}
			groupedByMatches.get(matchCount)!.push(user);
		});

		console.log('📊 Gruppi per numero di partite:', Object.fromEntries(groupedByMatches));

		// Ordina i gruppi per numero di partite (decrescente) e randomizza dentro ogni gruppo
		const sortedUsers: typeof userArray = [];
		
		// Ottieni tutte le chiavi (numero di partite) e ordinale in modo decrescente
		const matchCounts = Array.from(groupedByMatches.keys()).sort((a, b) => b - a);
		
		matchCounts.forEach(matchCount => {
			const usersWithSameMatches = groupedByMatches.get(matchCount)!;
			
			// Randomizza l'ordine degli utenti con lo stesso numero di partite
			const shuffledUsers = usersWithSameMatches.sort(() => Math.random() - 0.5);
			
			// Aggiungi al risultato finale
			sortedUsers.push(...shuffledUsers);
		});

		console.log(`🏆 Classifica torneo ${gameName} generata:`);
		sortedUsers.forEach((user, index) => {
			console.log(`${index + 1}. ${user.display_name}: ${user.totalMatches} partite ${gameName} (${user.wins}W-${user.losses}L)`);
		});

		return sortedUsers;

	} catch (error) {
		logError('Errore nel calcolo della classifica utenti:', error as any);
		return [];
	}
}

// Funzione helper per mostrare messaggi di validazione
function showValidationMessage(element: HTMLElement | null, message: string, color: string) {
	if (element) {
		element.textContent = message;
		element.style.color = color;
	}
}

// Funzione per tornare al menu principale
function backToMainMenu(windowElement: HTMLElement) {
	// Nascondi tutte le schermate
	const screens = [
		'#game-selection',
		'#game-mode-selection',
		'#player-selection', 
		'#tournament-setup',
		'#tournament-bracket',
		'#game-container'
	];
	
	screens.forEach(selector => {
		const element = windowElement.querySelector(selector) as HTMLElement;
		if (element) element.style.display = 'none';
	});
	
	// Mostra la selezione del gioco (menu principale)
	const gameSelection = windowElement.querySelector('#game-selection') as HTMLElement;
	if (gameSelection) gameSelection.style.display = 'block';
	
	// Ripristina stato bottoni gioco (rimuove selezione attiva)
	const pongGameBtn = windowElement.querySelector('#pong-game-btn') as HTMLButtonElement;
	const peowGameBtn = windowElement.querySelector('#peow-game-btn') as HTMLButtonElement;
	pongGameBtn?.classList.remove('active-game');
	peowGameBtn?.classList.remove('active-game');
	
	// Reset di tutti i campi del torneo
	resetTournamentSetup(windowElement);
}

// Funzione per resettare il setup del torneo
function resetTournamentSetup(windowElement: HTMLElement) {
	// Reset degli input dei giocatori
	for (let i = 2; i <= 8; i++) {
		const input = windowElement.querySelector(`#player-${i}`) as HTMLInputElement;
		const button = windowElement.querySelector(`.verify-player-btn[data-player="${i}"]`) as HTMLButtonElement;
		
		if (input) {
			input.value = '';
			input.disabled = false;
			input.style.borderColor = '#ddd';
			input.style.background = 'white';
		}
		
		if (button) {
			button.textContent = '✓';
			button.disabled = false;
			button.style.background = '';
			button.style.color = '';
			button.removeAttribute('data-user-id');
			button.removeAttribute('data-display-name');
		}
	}
	
	// Reset del pulsante di avvio torneo
	const startTournamentBtn = windowElement.querySelector('#start-tournament-btn') as HTMLButtonElement;
	if (startTournamentBtn) {
		startTournamentBtn.disabled = true;
		startTournamentBtn.style.opacity = '0.6';
	}
	
	// Reset del messaggio di validazione
	const validationMessage = windowElement.querySelector('#tournament-validation-message') as HTMLElement;
	if (validationMessage) {
		validationMessage.textContent = '';
	}
}

// Funzione per salvare i risultati delle partite nel database
async function saveMatchToDatabase(gameMode: GameMode, leftScore: number, rightScore: number, winner: 'player1' | 'player2') {
	console.log('🔍 saveMatchToDatabase CHIAMATA!', { gameMode, leftScore, rightScore, winner });
	
	// Ignora le partite contro la CPU
	if (gameMode.type === '1vsCPU') {
		console.log('❌ CPU match - non salvato');
		return;
	}

	// Verifica che abbiamo entrambi i giocatori
	if (!gameMode.player1 || !gameMode.player2) {
		console.log('❌ Dati giocatori mancanti');
		logError('Cannot save match: missing player data');
		return;
	}

	// Non salvare match se ENTRAMBI i giocatori sono non registrati (id=0)
	// Se solo uno è non registrato, salviamo comunque per aggiornare le statistiche del giocatore registrato
	if (gameMode.player1.id === 0 && gameMode.player2.id === 0) {
		console.log('👤 Match tra due utenti non registrati - non salvato nel database');
		return;
	}

	console.log('✅ Procedo con salvataggio...');

	try {
		// Determina il vincitore e prepara i dati
		const winnerId = winner === 'player1' ? gameMode.player1.id : gameMode.player2.id;
		const score = `${leftScore}-${rightScore}`;

		const matchData = {
			player1_id: gameMode.player1.id,
			player2_id: gameMode.player2.id,
			winner_id: winnerId,
			score: score,
			game_name: gameMode.game_name || 'pong' // Aggiungilo quando vuoi
		};

		console.log('🚀 Dati da inviare:', matchData);

		// Effettua la chiamata API
		const response = await fetch('/api/matches/addMatch', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(matchData)
		});

		console.log('📡 Risposta API:', response.status, response.ok);

		if (response.ok) {
			const result = await response.json();
			console.log('✅ Match saved successfully:', result);
		} else {
			const errorText = await response.text();
			console.log('❌ Errore API:', errorText);
			logError(`Failed to save match: ${response.status} - ${errorText}`);
		}
	} catch (error) {
		console.log('❌ Errore catch:', error);
		logError('Error saving match to database:', error as any);
	}
}

// vecchio codice inizia da qui
function initializepongGame(windowElement: HTMLElement, gameMode?: GameMode) {
	const canvas = windowElement.querySelector('#gameCanvas') as HTMLCanvasElement;
	if (!canvas) {
		logError('Canvas non trovato nella finestra pong!');
		return;
	}
	
	canvas.width = 800;
	canvas.height = 600;
	const ctx = canvas.getContext('2d')!;

	// Variabile per disabilitare l'AI in modalità PvP
	const isAIEnabled = !gameMode || gameMode.type === '1vsCPU';

	// Paddle
	class Paddle {
		public x: number;
		public y: number;
		public width: number = 20;
		public height: number = 100;
		public speed: number = 15;

		constructor(x: number, y: number) {
			this.x = x;
			this.y = y;
		}

		move(dy: number) {
			this.y += dy;
			// Limiti bordo
			if (this.y < 0) this.y = 0;
			if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;
		}

		draw(ctx: CanvasRenderingContext2D) {
			ctx.fillRect(this.x, this.y, this.width, this.height);
		}
	}

	// Ball
	class Ball {
		public x: number;
		public y: number;
		public radius: number = 10;
		public dx: number = 5;
		public dy: number = 5;

		constructor(x: number, y: number) {
			this.x = x;
			this.y = y;
		}

		move() {
			this.x += this.dx;
			this.y += this.dy;
		}

		draw(ctx: CanvasRenderingContext2D) {
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	// Game state
	// Molto vicini ai bordi (originale)
	const leftPaddle = new Paddle(20, canvas.height / 2 - 50);
	const rightPaddle = new Paddle(canvas.width - 40, canvas.height / 2 - 50);
	const ball = new Ball(canvas.width / 2, canvas.height / 2);
	let leftScore = 0;
	let rightScore = 0;
	let speedpongs = 0;
	let gameRunning = true;  
	let winner: string | null = null;  
	const WINNING_SCORE = 10; 
	let enemyInterval: number | null = null; // per tracciare l'interval 
	let moveIntervals: number[] = []; // per tracciare tutti i moveInterval 

	// Funzione per pulire tutti gli interval e event listeners
	function cleanup() {
		if (enemyInterval) {
			window.clearInterval(enemyInterval);
			enemyInterval = null;
		}
		moveIntervals.forEach(interval => window.clearInterval(interval));
		moveIntervals = [];
	} 

	function checkWinCondition(): boolean 
	{
		if (leftScore >= WINNING_SCORE)
		{
			if (gameMode && gameMode.type === '1vsCPU') {
				winner = gameMode.player1.display_name || gameMode.player1.username;
			} else if (gameMode && gameMode.type === '1v1') {
				winner = gameMode.player1.display_name || gameMode.player1.username;
				// Salva la partita nel database
				saveMatchToDatabase(gameMode, leftScore, rightScore, 'player1');
			} else if (gameMode && gameMode.type === 'tournament') {
				winner = gameMode.player1.display_name || gameMode.player1.username;
				// Salva la partita nel database
				saveMatchToDatabase(gameMode, leftScore, rightScore, 'player1');
				// Gestisce l'avanzamento del torneo
				setTimeout(() => {
					handleTournamentMatchEnd(windowElement, gameMode, 'player1');
				}, 2000);
			} else {
				winner = "Player 1 (W/S)";
			}
			gameRunning = false;
			return true;
		}
		if (rightScore >= WINNING_SCORE) 
		{
			if (gameMode && gameMode.type === '1vsCPU') {
				winner = "CPU";
			} else if (gameMode && gameMode.type === '1v1') {
				winner = gameMode.player2?.display_name || gameMode.player2?.username || "Player 2";
				// Salva la partita nel database
				saveMatchToDatabase(gameMode, leftScore, rightScore, 'player2');
			} else if (gameMode && gameMode.type === 'tournament') {
				winner = gameMode.player2?.display_name || gameMode.player2?.username || "Player 2";
				// Salva la partita nel database
				saveMatchToDatabase(gameMode, leftScore, rightScore, 'player2');
				// Gestisce l'avanzamento del torneo
				setTimeout(() => {
					handleTournamentMatchEnd(windowElement, gameMode, 'player2');
				}, 2000);
			} else {
				winner = "Player 2 (↑/↓)";
			}
			gameRunning = false;
			return true;
		}
		return false;
	}

	// Input
	let upPressed = false;
	let downPressed = false;
	let wPressed = false;
	let sPressed = false;

	// Event listeners per i tasti (solo per questa finestra)
	const keydownHandler = (e: KeyboardEvent) => {
		if (e.key === 'ArrowUp') upPressed = true;
		if (e.key === 'ArrowDown') downPressed = true;
		if (e.key === 'w') wPressed = true;
		if (e.key === 's') sPressed = true;
		// Riavvia il gioco con R quando è finito
		if ((e.key === 'r' || e.key === 'R') && !gameRunning) {
			restartGame();
		}
	};
	
	const keyupHandler = (e: KeyboardEvent) => {
		if (e.key === 'ArrowUp') upPressed = false;
		if (e.key === 'ArrowDown') downPressed = false;
		if (e.key === 'w') wPressed = false;
		if (e.key === 's') sPressed = false;
	};

	document.addEventListener('keydown', keydownHandler);
	document.addEventListener('keyup', keyupHandler);

	function resetBall() {
		ball.x = canvas.width / 2;
		ball.y = canvas.height / 2;
		ball.dx = (Math.random() > 0.5 ? 5 : -5);
		ball.dy = (Math.random() > 0.5 ? 5 : -5);
	}

	function restartGame() {
		// Pulisci tutti gli interval
		cleanup();
		
		// Reset variabili di gioco
		leftScore = 0;
		rightScore = 0;
		gameRunning = true;
		winner = null;
		
		// Reset input (per sicurezza)
		upPressed = false;
		downPressed = false;
		wPressed = false;
		sPressed = false;
		
		// Reset posizioni
		leftPaddle.y = canvas.height / 2 - 50;
		rightPaddle.y = canvas.height / 2 - 50;
		
		resetBall();
		
		// Riavvia l'AI solo se abilitata (modalità vs CPU)
		if (isAIEnabled) {
			enemy();
		}
	}

	function drawScore() {
		ctx.fillStyle = "#fff"; // Colore bianco per il testo
		ctx.font = '40px Arial';
		ctx.fillText(`${leftScore}`, canvas.width / 4, 50);
		ctx.fillText(`${rightScore}`, 3 * canvas.width / 4, 50);
	}

	function drawGameOver() {
		if (!gameRunning && winner) {
			// Sfondo semi-trasparente
			ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			
			// Riquadro centrale
			ctx.fillStyle = "#333";
			ctx.fillRect(canvas.width/2 - 200, canvas.height/2 - 100, 400, 200);
			ctx.strokeStyle = "#FFD700";
			ctx.lineWidth = 3;
			ctx.strokeRect(canvas.width/2 - 200, canvas.height/2 - 100, 400, 200);
			
			// Testo vincitore
			ctx.fillStyle = "#FFD700"; 
			ctx.font = 'bold 36px Arial';
			ctx.textAlign = 'center';
			ctx.fillText("🏆 GAME OVER! 🏆", canvas.width / 2, canvas.height / 2 - 40);
			
			ctx.fillStyle = "#FFF";
			ctx.font = 'bold 28px Arial';
			ctx.fillText(`${winner} WINS!`, canvas.width / 2, canvas.height / 2);
			
			ctx.fillStyle = "#CCC";
			ctx.font = '20px Arial';
			ctx.fillText(`Final Score: ${leftScore} - ${rightScore}`, canvas.width / 2, canvas.height / 2 + 30);
			
			ctx.fillStyle = "#FFD700";
			ctx.font = 'bold 18px Arial';
			ctx.fillText('Press R to RESTART', canvas.width / 2, canvas.height / 2 + 60);
			
			ctx.textAlign = 'left'; // Reset alignment
		}
	}

	function gameLoop() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Disegna sempre gli elementi del gioco
		ctx.fillStyle = "#fff";
		leftPaddle.draw(ctx);
		rightPaddle.draw(ctx);
		ball.draw(ctx);
		drawScore();

		// Se il gioco è finito, mostra game over e continua a ridisegnare
		if (!gameRunning) {
			drawGameOver();
			requestAnimationFrame(gameLoop); // CONTINUA IL LOOP per vedere il game over
			return;
		}

		// Muovi paddle solo se il gioco è in corso
		if (gameRunning) {
			if (wPressed) leftPaddle.move(-leftPaddle.speed);
			if (sPressed) leftPaddle.move(leftPaddle.speed);
			if (upPressed) rightPaddle.move(-rightPaddle.speed);
			if (downPressed) rightPaddle.move(rightPaddle.speed);

			// Muovi palla
			ball.move();

			// Collisione con bordo
			if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
				ball.dy *= -1;
			}

			// Collisione con paddle sinistro
			if (
				ball.dx < 0 && // la palla si muove verso sinistra
				ball.x - ball.radius < leftPaddle.x + leftPaddle.width &&
				ball.x - ball.radius > leftPaddle.x && // la palla non ha già superato il bordo
				ball.y > leftPaddle.y &&
				ball.y < leftPaddle.y + leftPaddle.height
			) 
			{
				// Calcola dove ha colpito la palla sul paddle (0 = top, 1 = bottom)
				const hitPoint = (ball.y - leftPaddle.y) / leftPaddle.height;
				
				// Se colpisce nel centro del paddle (tra 0.4 e 0.6), tiro dritto
				if (hitPoint >= 0.45 && hitPoint <= 0.55) {
					ball.dy = 0; // Tiro perfettamente orizzontale
					ball.dx = 30;  // Velocità maggiore per il tiro dritto
					console.log('🎯 TIRO DRITTO! Hit point:', hitPoint.toFixed(2));
				} else {
					// Tiro normale con angolo
					ball.dy *= 1.2;
					ball.dx *= -1;
				}
				
				ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
			}

			// Collisione con paddle destro
			if (
				ball.dx > 0 && // la palla si muove verso destra
				ball.x + ball.radius > rightPaddle.x &&
				ball.x + ball.radius < rightPaddle.x + rightPaddle.width && // la palla non ha già superato il bordo
				ball.y > rightPaddle.y &&
				ball.y < rightPaddle.y + rightPaddle.height
			) 
			{
				// Calcola dove ha colpito la palla sul paddle (0 = top, 1 = bottom)
				const hitPoint = (ball.y - rightPaddle.y) / rightPaddle.height;
				
				// Se colpisce nel centro del paddle (tra 0.4 e 0.6), tiro dritto
				if (hitPoint >= 0.45 && hitPoint <= 0.55) {
					ball.dy = 0; // Tiro perfettamente orizzontale
					ball.dx = -30; // Velocità maggiore per il tiro dritto (verso sinistra)
					console.log('🎯 TIRO DRITTO AI! Hit point:', hitPoint.toFixed(2));
				} else {
					// Tiro normale con angolo
					ball.dx *= -1;
				}
				
				ball.x = rightPaddle.x - ball.radius;
			}

			// Punto per destra
			if (ball.x - ball.radius < 0) {
				printBallGoalY();
				rightScore++;
				if (checkWinCondition()) 
				{
					
				} else {
					resetBall();
				}
			}
			// Punto per sinistra
			if (ball.x + ball.radius > canvas.width) {
				printBallGoalY();
				leftScore++;
				if (checkWinCondition()) {
					// Non fare return qui, lascia che il loop continui per mostrare game over
				} else {
					resetBall();
				}
			}
		}

		// Continua sempre il loop
		requestAnimationFrame(gameLoop);
	}

	function printBallImpactY(y: number) {
		console.log('-------------------------------------------------Preview y =', y);
	}

	function printBallGoalY() {
		if (ball.x + ball.radius > canvas.width) {
			console.log('La palla ha segnato sulla destra a y =', ball.y);
		}
	}

	function enemy() {
		// Pulisci tutti gli interval precedenti
		cleanup();
		
		// Esegui ogni 1000 ms
		enemyInterval = window.setInterval(() => 
			{
			// Calcola solo se la palla va verso destra E il gioco è in corso
			if (ball.dx > 0 && gameRunning) 
			{
				// Calcola dove la palla colpirà il muro destro
				// Formula retta: y = m*x + q
				// m = ball.dy / ball.dx
				// q = ball.y - m * ball.x
				let m = ball.dy / ball.dx;
				let q = 0;
				let x_wall = 0;
				let y_wall = 0;
				if (ball.dy == 0)
					y_wall = ball.y;
				else if (ball.dy > 0)
				{
					y_wall = 600
					q = ball.y - m * ball.x
					x_wall = (y_wall - q)/ m ;
					if (x_wall < 800)
					{
						q = y_wall - (-m) * x_wall;
						x_wall = 800;
						y_wall = -m * x_wall + q;
					}
					else 
					{
						
						y_wall = m * 800 + q;
					}
				}
				else
				{
					y_wall = 0
					q = ball.y - m * ball.x
					x_wall = (y_wall - q)/ m ;
					if (x_wall < 800)
					{
						q = y_wall -(-m) * x_wall;
						x_wall = 800;
						y_wall = -m * x_wall + q;
					}
					else 
					{
						y_wall = m * 800 + q;
					}
				}
				// x muro destro
				// y di impatto con il muros
				let future_y = Math.max(rightPaddle.height / 2, Math.min(y_wall, canvas.height - rightPaddle.height / 2));
				printBallImpactY(future_y); // Stampa la coordinata y_wall a terminale
				// Muovi paddle finché non raggiunge future_y
				const stopThreshold = 8; // soglia fissa
				const moveInterval = window.setInterval(() => {
					// Se il gioco si ferma, ferma anche il movimento dell'AI
					if (!gameRunning) {
						upPressed = false;
						downPressed = false;
						window.clearInterval(moveInterval);
						// Rimuovi dall'array di tracciamento
						const index = moveIntervals.indexOf(moveInterval);
						if (index > -1) moveIntervals.splice(index, 1);
						return;
					}
					
					const paddleCenterY = rightPaddle.y + rightPaddle.height / 2;
					if (Math.abs(paddleCenterY - future_y) > stopThreshold) {
						if (future_y < paddleCenterY) {
							upPressed = true;
							downPressed = false;
						} else if (future_y > paddleCenterY) {
							downPressed = true;
							upPressed = false;
						}
					} else {
						upPressed = false;
						downPressed = false;
						window.clearInterval(moveInterval);
						// Rimuovi dall'array di tracciamento
						const index = moveIntervals.indexOf(moveInterval);
						if (index > -1) moveIntervals.splice(index, 1);
					}
				}, 1); // 1 ms per step
				
				// Aggiungi all'array di tracciamento
				moveIntervals.push(moveInterval);
			}
		}, 1000);
	}

	// Pulisci gli event listeners quando la finestra si chiude
	windowElement.addEventListener('remove', () => {
		document.removeEventListener('keydown', keydownHandler);
		document.removeEventListener('keyup', keyupHandler);
		cleanup();
	});

	// Inizializza il gioco
	resetBall();
	// Avvia l'AI solo se abilitata (modalità vs CPU)
	if (isAIEnabled) {
		enemy();
	}
	gameLoop();
}

// =============== peow GAME IMPLEMENTATION ===============

function initializepeowGame(windowElement: HTMLElement, gameMode?: GameMode) {
	const canvas = windowElement.querySelector('#gameCanvas') as HTMLCanvasElement;
	if (!canvas) {
		logError('Canvas non trovato nella finestra peow!');
		return;
	}
	
	canvas.width = 800;
	canvas.height = 600;
	const ctx = canvas.getContext('2d')!;

	// Variabile per disabilitare l'AI in modalità PvP
	const isAIEnabled = !gameMode || gameMode.type === '1vsCPU';

	// Paddle class per peow
	class peowPaddle {
		public x: number;
		public y: number;
		public originalHeight: number = 120;
		public currentHeight: number = 120;
		public width: number = 20;
		public speed: number = 15;
		public hitCount: number = 0;

		constructor(x: number, y: number) {
			this.x = x;
			this.y = y;
		}

		move(dy: number) {
			this.y += dy;
			// Limiti bordo
			if (this.y < 0) this.y = 0;
			if (this.y + this.currentHeight > canvas.height) this.y = canvas.height - this.currentHeight;
		}

		getCenter(): { x: number, y: number } {
			return {
				x: this.x + this.width / 2,
				y: this.y + this.currentHeight / 2
			};
		}

		takeDamage(): boolean {
			this.hitCount++;
			this.currentHeight = this.originalHeight * Math.pow(2/3, this.hitCount);
			
			// Game over se colpito 3 volte
			return this.hitCount >= 3;
		}

		draw(ctx: CanvasRenderingContext2D) {
			// Paddle
			ctx.fillStyle = '#fff';
			ctx.fillRect(this.x, this.y, this.width, this.currentHeight);
			
			// Centro del paddle (punto di spawn dei proiettili)
			const center = this.getCenter();
			ctx.fillStyle = '#ff0000';
			ctx.beginPath();
			ctx.arc(center.x, center.y, 3, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	// Bullet class
	class Bullet {
		public x: number;
		public y: number;
		public dx: number;
		public dy: number = 0;
		public radius: number = 4;
		public active: boolean = true;

		constructor(x: number, y: number, direction: number) {
			this.x = x;
			this.y = y;
			this.dx = direction * 10// velocità proiettile
		}

		move() {
			this.x += this.dx;
			this.y += this.dy;
			
			// Rimuovi se esce dallo schermo
			if (this.x < 0 || this.x > canvas.width) {
				this.active = false;
			}
		}

		draw(ctx: CanvasRenderingContext2D) {
			if (!this.active) return;
			
			ctx.fillStyle = '#ffff00';
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
			ctx.fill();
		}

		checkCollision(paddle: peowPaddle): boolean {
			if (!this.active) return false;
			
			return this.x + this.radius > paddle.x &&
				   this.x - this.radius < paddle.x + paddle.width &&
				   this.y + this.radius > paddle.y &&
				   this.y - this.radius < paddle.y + paddle.currentHeight;
		}
	}

	// Game state
	let gameRunning = true;
	let winner: string | null = null;
	let leftPaddle = new peowPaddle(30, canvas.height / 2 - 60);
	let rightPaddle = new peowPaddle(canvas.width - 50, canvas.height / 2 - 60);
	let bullets: Bullet[] = [];

	// Input state (allineato a pong)
	let upPressed = false;
	let downPressed = false;
	let wPressed = false;
	let sPressed = false;

	// Cooldown per i proiettili (per evitare spam)
	let leftShootCooldown = 0;
	let rightShootCooldown = 0;
	const shootCooldownTime = 10// frames

	// Event listeners (allineato a pong)
	const keydownHandler = (e: KeyboardEvent) => {
		if (e.key === 'ArrowUp') upPressed = true;
		if (e.key === 'ArrowDown') downPressed = true;
		if (e.key === 'w') wPressed = true;
		if (e.key === 's') sPressed = true;
		// Sparo per giocatore sinistro (D)
		if (e.key === 'd' && leftShootCooldown <= 0) {
			shootBullet(leftPaddle, 1);
			leftShootCooldown = shootCooldownTime;
		}
		// Sparo per giocatore destro (ArrowLeft)
		if (e.key === 'ArrowLeft' && rightShootCooldown <= 0) {
			shootBullet(rightPaddle, -1);
			rightShootCooldown = shootCooldownTime;
		}
		// Riavvia il gioco con R quando è finito
		if ((e.key === 'r' || e.key === 'R') && !gameRunning) {
			restartGame();
		}
	};

	const keyupHandler = (e: KeyboardEvent) => {
		if (e.key === 'ArrowUp') upPressed = false;
		if (e.key === 'ArrowDown') downPressed = false;
		if (e.key === 'w') wPressed = false;
		if (e.key === 's') sPressed = false;
	};

	document.addEventListener('keydown', keydownHandler);
	document.addEventListener('keyup', keyupHandler);

	function shootBullet(paddle: peowPaddle, direction: number) {
		const center = paddle.getCenter();
		bullets.push(new Bullet(center.x, center.y, direction));
	}

	function updateAI() {
		// AI per il paddle destro (solo se abilitata)
		if (isAIEnabled && gameRunning) {
			const paddleCenter = rightPaddle.y + rightPaddle.currentHeight / 2;
			const targetY = leftPaddle.y + leftPaddle.currentHeight / 2;
			
			if (paddleCenter < targetY - 20) {
				rightPaddle.move(rightPaddle.speed * 0.7);
			} else if (paddleCenter > targetY + 20) {
				rightPaddle.move(-rightPaddle.speed * 0.7);
			}
			
			// AI spara occasionalmente
			if (Math.random() < 0.02 && rightShootCooldown <= 0) {
				shootBullet(rightPaddle, -1);
				rightShootCooldown = shootCooldownTime;
			}
		}
	}

	function updateBullets() {
		// Aggiorna cooldown
		if (leftShootCooldown > 0) leftShootCooldown--;
		if (rightShootCooldown > 0) rightShootCooldown--;

		// Aggiorna posizione proiettili
		bullets.forEach(bullet => bullet.move());

		// Controlla collisioni
		bullets.forEach(bullet => {
			if (!bullet.active) return;

			// Collisione con paddle sinistro
			if (bullet.dx < 0 && bullet.checkCollision(leftPaddle)) {
				bullet.active = false;
				const gameOver = leftPaddle.takeDamage();
				if (gameOver) {
					endGame('right');
				}
			}
			
			// Collisione con paddle destro
			if (bullet.dx > 0 && bullet.checkCollision(rightPaddle)) {
				bullet.active = false;
				const gameOver = rightPaddle.takeDamage();
				if (gameOver) {
					endGame('left');
				}
			}
		});

		// Rimuovi proiettili inattivi
		bullets = bullets.filter(bullet => bullet.active);
	}

	function endGame(winnerSide: 'left' | 'right') {
		gameRunning = false;
		
		if (winnerSide === 'left') {
			winner = gameMode?.player1.display_name || gameMode?.player1.username || "Player 1 (W/S)";
		} else {
			winner = isAIEnabled ? "CPU" : (gameMode?.player2?.display_name || gameMode?.player2?.username || "Player 2 (↑/↓)");
		}

		// Salva il match se abbiamo i dati del gameMode
		if (gameMode) {
			// Determina il vincitore per il salvataggio
			const matchWinner = winnerSide === 'left' ? 'player1' : 'player2';
			
			// Per peow, usiamo i colpi subiti come "punteggio"
			const leftScore = leftPaddle.hitCount;
			const rightScore = rightPaddle.hitCount;
			
			// Salva nel database
			saveMatchToDatabase(gameMode, leftScore, rightScore, matchWinner).then(() => {
				logInfo('Match peow salvato nel database');
			}).catch(error => {
				logError('Errore nel salvataggio del match peow:', error);
			});

			// Gestisci torneo se necessario
			if (gameMode.type === 'tournament' && gameMode.tournamentData) {
				setTimeout(() => {
					handleTournamentMatchEnd(windowElement, gameMode, matchWinner);
				}, 2000);
			}
		}
	}

	function draw() {
		// Pulisci canvas
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Disegna linea centrale
		ctx.setLineDash([10, 10]);
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(canvas.width / 2, 0);
		ctx.lineTo(canvas.width / 2, canvas.height);
		ctx.stroke();
		ctx.setLineDash([]);

		// Disegna paddles
		leftPaddle.draw(ctx);
		rightPaddle.draw(ctx);

		// Disegna proiettili
		bullets.forEach(bullet => bullet.draw(ctx));

		// Disegna hits
		drawHits();

		// Disegna game over se necessario
		if (!gameRunning) {
			drawGameOver();
		}
	}

	function drawHits() {
		ctx.fillStyle = '#fff';
		ctx.font = '24px Arial';
		
		// Colpi giocatore sinistro
		ctx.fillText(`Hits: ${leftPaddle.hitCount}/3`, 50, 50);
		
		// Colpi giocatore destro
		ctx.textAlign = 'right';
		ctx.fillText(`Hits: ${rightPaddle.hitCount}/3`, canvas.width - 50, 50);
		ctx.textAlign = 'left';
	}

	function drawGameOver() {
		if (!gameRunning && winner) {
			// Sfondo semi-trasparente
			ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			
			// Riquadro centrale
			ctx.fillStyle = "#333";
			ctx.fillRect(canvas.width/2 - 200, canvas.height/2 - 100, 400, 200);
			ctx.strokeStyle = "#FFD700";
			ctx.lineWidth = 3;
			ctx.strokeRect(canvas.width/2 - 200, canvas.height/2 - 100, 400, 200);
			
			// Testo vincitore
			ctx.fillStyle = "#FFD700"; 
			ctx.font = 'bold 36px Arial';
			ctx.textAlign = 'center';
			ctx.fillText("🎯 peow OVER! 🎯", canvas.width / 2, canvas.height / 2 - 40);
			
			ctx.fillStyle = "#FFF";
			ctx.font = 'bold 28px Arial';
			ctx.fillText(`Winner: ${winner}`, canvas.width / 2, canvas.height / 2 + 10);
			
			ctx.font = '20px Arial';
			ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 50);
			
			ctx.textAlign = 'left';
		}
	}

	function restartGame() {
		// Reset game state
		gameRunning = true;
		winner = null;
		bullets = [];
		leftShootCooldown = 0;
		rightShootCooldown = 0;
		
		// Reset input (allineato a pong)
		upPressed = false;
		downPressed = false;
		wPressed = false;
		sPressed = false;
		
		// Reset paddles
		leftPaddle = new peowPaddle(30, canvas.height / 2 - 60);
		rightPaddle = new peowPaddle(canvas.width - 50, canvas.height / 2 - 60);
	}

	function gameLoop() {
		if (gameRunning) {
			// Movimento paddle (allineato a pong)
			if (wPressed) leftPaddle.move(-leftPaddle.speed);
			if (sPressed) leftPaddle.move(leftPaddle.speed);
			if (upPressed) rightPaddle.move(-rightPaddle.speed);
			if (downPressed) rightPaddle.move(rightPaddle.speed);
			
			// Aggiorna AI se abilitata
			updateAI();
			
			// Aggiorna proiettili
			updateBullets();
		}
		
		draw();
		requestAnimationFrame(gameLoop);
	}

	// Cleanup function
	const cleanup = () => {
		document.removeEventListener('keydown', keydownHandler);
			document.removeEventListener('keyup', keyupHandler);
	};

	// Aggiungi cleanup quando la finestra viene chiusa
	windowElement.addEventListener('beforeunload', cleanup);
	
	// Observer per quando l'elemento viene rimosso dal DOM
	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.removedNodes.forEach((node) => {
				if (node === windowElement || (node instanceof Element && node.contains(windowElement))) {
					cleanup();
					observer.disconnect();
				}
			});
		});
	});
	
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});

	// Avvia il gioco
	gameLoop();
}

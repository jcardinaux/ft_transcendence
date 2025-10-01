import { authenticator } from 'otplib'
import qrcode from 'qrcode'
import bcrypt from 'bcrypt'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { randomUUID } from 'crypto'
import { REPL_MODE_SLOPPY } from 'repl'

export const updateUserName = async (req, reply) => {
	const {id} = req.user
	const {username} = req.body
	try{
		const stmt = reply.server.db.prepare('UPDATE users SET username = ? WHERE id = ?')
		const response = stmt.run(username, id)
		if(response.changes === 0)
			reply.code(404).send({message: "no user founded "})
		reply.send({message: `user ${id} are now ${username}`})
	}
	catch (err) {
		let errorMessage = err.message
		if(err.message.includes('SQLITE_CONSTRAINT_UNIQUE') || err.message.includes('UNIQUE constraint failed'))
			if (err.message.includes('users.username'))
                    errorMessage = 'this username are not avaiable';
		reply.code(500).send({message: errorMessage});
	}
}


export const generate2FA = async (req, reply) => {

	const {id, username} = req.user
	const db = reply.server.db

	const secret = authenticator.generateSecret()
	const otpauth = authenticator.keyuri(username, 'ft_trascandance', secret)
	const qrCodeDataURL = await qrcode.toDataURL(otpauth)

	db.prepare('UPDATE users SET totp_secret = ? WHERE id = ?').run(secret, id)
	reply.send({qrCode: qrCodeDataURL})
}


export const verify2FA = (req, reply) => {
	const { id } = req.user
	const { token } = req.body
	const db = reply.server.db

	const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
	if (!user || !user.totp_secret) {
		return reply.code(404).send({ message: '2FA not setup for this user' })
	}

	const isValid = authenticator.verify({ token, secret: user.totp_secret })
	if (!isValid) {
		return reply.code(401).send({ message: 'Invalid 2FA code' })
	}

	db.prepare('UPDATE users SET twofa_enabled = 1 WHERE id = ?').run(id)

	reply.send({ message: '2FA activated' })
}


export const showAllUseriInfo = async (req, reply) => {
	const {id} = req.user

	const stmt = reply.server.db.prepare('SELECT * FROM users WHERE id = ?')
	const user = stmt.get(id)

	const avatar = user.avatar || '/avatar/fallback_avatar.png'
	reply.send({...user, avatar})
}


export const changeDisplayName = async (req, reply) => {
	const {id} = req.user
	const {display_name} = req.body
	const stmt = reply.server.db.prepare('UPDATE users SET display_name = ? WHERE id = ?')
	const response = stmt.run(display_name, id)

	if (response.changes === 0)
		reply.code(404).send({message: "no user founded "})
	reply.code(200).send({message: `display name are now ${display_name}`})
}

export const changePassword = async (req, reply) => {
	const {id} = req.user
	const {newPassword, oldPassword} = req.body

	const stmt = reply.server.db.prepare('SELECT * FROM users WHERE id = ?')
	const user = stmt.get(id)

	if(!user)
		reply.code(404).send({message: 'user not found'})
	const validPwd = await bcrypt.compare(oldPassword, user.password)
	if (!validPwd) return reply.code(401).send({message: "invalid password"})

	const stmt2 = reply.server.db.prepare('UPDATE users SET password = ? WHERE id =  ?')
	const response = stmt2.run(newPassword, id)
	if (response.change === 0)
		return reply.send({message: 'error while updating passsword'})
	reply.send({message: 'password correctly changed'})
}

export const uploadAvatar = async (req, reply) => {
	const { id } = req.user
	const file = await req.file()

	if (!file || !file.filename)
		return reply.code(400).send({ message: 'No file uploaded' })

	const ext = path.extname(file.filename)
	const filename = `${id}_${randomUUID()}${ext}`
	const avatarDir = path.join(process.cwd(), 'public', 'avatar')
	const filePath = path.join(avatarDir, filename)

	await pipeline(file.file, fs.createWriteStream(filePath))

	const avatarUrl = `/avatar/${filename}`
	req.server.db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarUrl, id)

	reply.send({ message: 'Avatar uploaded', url: avatarUrl })
}

export const addFriend = async (req, reply) => {
	const {friendID} = req.params
	const { id } = req.user

	const checkFriend = reply.server.db.prepare('SELECT id FROM users WHERE id = ? ').get(friendID)
	if(!checkFriend)
		return reply.code(404).send({ message: "Friend not found" })
	if(id == friendID)
		return reply.code(400).send({message: 'cant add yourself'})
	try{
		const stmt = reply.server.db.prepare('INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)')
		stmt.run(id, friendID)
		reply.send({message: `user ${id} add user ${friendID} as a friend`})
	}
	catch (err){
		REPL_MODE_SLOPPY.code(400).send({message: err})
	}
}

export const deleteFriend = async (req, reply) => {
		const {friendID} = req.params
	const { id } = req.user

	const checkFriend = reply.server.db.prepare('SELECT id FROM users WHERE id = ? ').get(friendID)
	if(!checkFriend)
		return reply.code(404).send({ message: "Friend not found" })
	if(id === friendID)
		return reply.code(400).send({message: 'cant add yourself'})
	const changes = reply.server.db.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?').run(id, friendID)
	if (changes.changes === 0)
		reply.code(404).send({message: 'no frienship founded'})
}


export const getFriends = async (req, reply) => {
	const { id } = req.user
	const friends = req.server.db.prepare(`
		SELECT u.id, u.username, u.display_name, u.avatar,
		       u.last_seen,
		       CASE WHEN datetime(u.last_seen) >= datetime('now', '-2 minutes') THEN 1 ELSE 0 END AS is_online
		FROM users u
		JOIN friends f ON u.id = f.friend_id
		WHERE f.user_id = ?
	`).all(id)

	reply.send(friends)
}

export const userStats = async (req, reply) => {
	const {id} = req.user
	
	console.log(`🔍 Debug: user ID = ${id}, tipo: ${typeof id}`);
	
	// Query semplici e chiare per calcolare le statistiche
	
	// 1. Vittorie: partite dove l'utente è coinvolto E ha vinto
	const winsStmt = reply.server.db.prepare(`
		SELECT COUNT(*) AS wins 
		FROM matches 
		WHERE (player1_id = ? OR (player2_id = ? AND player2_id IS NOT NULL)) AND winner_id = ?
	`);
	
	// 2. Sconfitte: partite dove l'utente è coinvolto ma NON ha vinto
	const lossesStmt = reply.server.db.prepare(`
		SELECT COUNT(*) AS losses 
		FROM matches 
		WHERE (player1_id = ? OR (player2_id = ? AND player2_id IS NOT NULL))
		AND winner_id IS NOT NULL 
		AND winner_id != ?
	`);
	
	// 3. Totale partite: tutte le partite dove l'utente è coinvolto
	const totalMatchesStmt = reply.server.db.prepare(`
		SELECT COUNT(*) AS totalMatches 
		FROM matches 
		WHERE player1_id = ? OR (player2_id = ? AND player2_id IS NOT NULL)
	`);
	
	// 4. Partite PvP: partite con due giocatori reali
	const pvpMatchesStmt = reply.server.db.prepare(`
		SELECT COUNT(*) AS pvpMatches 
		FROM matches 
		WHERE (player1_id = ? OR (player2_id = ? AND player2_id IS NOT NULL)) AND player2_id IS NOT NULL
	`);
	
	// 5. Partite vs CPU: partite con CPU (player2_id NULL)
	const cpuMatchesStmt = reply.server.db.prepare(`
		SELECT COUNT(*) AS cpuMatches 
		FROM matches 
		WHERE player1_id = ? AND player2_id IS NULL
	`);
	
	// Esegui le query
	const {wins} = winsStmt.get(id, id, id);
	const {losses} = lossesStmt.get(id, id, id);
	const {totalMatches} = totalMatchesStmt.get(id, id);
	const {pvpMatches} = pvpMatchesStmt.get(id, id);
	const {cpuMatches} = cpuMatchesStmt.get(id);

	// Calcola statistiche aggiuntive
	const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0;

	console.log(`📊 Stats complete per utente ${id}:`, { 
		wins, 
		losses, 
		totalMatches, 
		pvpMatches, 
		cpuMatches,
		winRate: `${winRate}%`
	});
	
	// Debug: vediamo tutti i match di questo utente
	const allMatches = reply.server.db.prepare('SELECT * FROM matches WHERE player1_id = ? OR player2_id = ?').all(id, id);
	console.log(`🔍 Tutti i match per utente ${id}:`, allMatches);

	reply.send({
		wins,           // Partite vinte
		losses,         // Partite perse  
		totalMatches,   // Totale partite giocate
		pvpMatches,     // Partite contro altri giocatori
		cpuMatches,     // Partite contro CPU
		winRate: parseFloat(winRate)  // Percentuale di vittorie
	})
}

export const allUserMathces = async (req, reply) => {
	const {id} = req.user
	const stmt = reply.server.db.prepare('SELECT * FROM matches WHERE player1_id = ? OR player2_id = ? ORDER BY date DESC')
	const matches = stmt.all(id, id)
	reply.send(matches)
}

export const updatePlayerStats = async (req, reply) => {
	const { player1_id, player2_id, winner_id, score } = req.body;
	
	console.log('🔧 updatePlayerStats chiamata con:', { player1_id, player2_id, winner_id, score });
	console.log('🔧 Tipi:', { 
		player1_id: typeof player1_id, 
		player2_id: typeof player2_id, 
		winner_id: typeof winner_id, 
		score: typeof score 
	});
	
	try {
		// Solo player1_id è obbligatorio
		if (!player1_id) {
			console.log('❌ player1_id mancante');
			return reply.code(400).send({ 
				message: 'Parametro obbligatorio mancante: player1_id' 
			});
		}
		
		console.log('✅ player1_id presente:', player1_id);
		
		const db = reply.server.db;
		
		// Se winner_id è specificato, deve essere uno dei giocatori coinvolti
		if (winner_id !== null && winner_id !== undefined) {
			console.log('🔧 Validazione winner_id...');
			if (player2_id && winner_id !== player1_id && winner_id !== player2_id) {
				console.log('❌ winner_id non valido per PvP');
				return reply.code(400).send({ 
					message: 'winner_id deve essere uguale a player1_id o player2_id' 
				});
			} else if (!player2_id && winner_id !== player1_id) {
				console.log('❌ winner_id non valido per CPU');
				return reply.code(400).send({ 
					message: 'Per partite singole, winner_id deve essere uguale a player1_id' 
				});
			}
		}
		
		console.log('✅ Validazione winner_id OK');
		
		// Verifica che player1 esista sempre
		console.log('🔧 Verifica esistenza player1...');
		const player1 = db.prepare('SELECT id FROM users WHERE id = ?').get(player1_id);
		if (!player1) {
			console.log('❌ player1 non trovato');
			return reply.code(404).send({ message: `Giocatore con ID ${player1_id} non trovato` });
		}
		
		console.log('✅ player1 trovato');
		
		// Verifica player2 solo se specificato
		if (player2_id) {
			console.log('🔧 Verifica esistenza player2...');
			const player2 = db.prepare('SELECT id FROM users WHERE id = ?').get(player2_id);
			if (!player2) {
				console.log('❌ player2 non trovato');
				return reply.code(404).send({ message: `Giocatore con ID ${player2_id} non trovato` });
			}
			console.log('✅ player2 trovato');
		}
		
		// Inserisci il match nel database
		console.log('🔧 Inserimento nel database...');
		const result = db.prepare('INSERT INTO matches (player1_id, player2_id, winner_id, score) VALUES (?, ?, ?, ?)')
			.run(player1_id, player2_id || null, winner_id || null, score || null);
		
		console.log('✅ Match inserito con ID:', result.lastInsertRowid);
		
		const matchType = player2_id ? 'tra giocatori' : 'contro CPU';
		
		reply.send({ 
			message: `Match ${matchType} registrato con successo`,
			match_id: result.lastInsertRowid,
			player1_id: player1_id,
			player2_id: player2_id || null,
			winner_id: winner_id || null,
			score: score || null,
			match_type: player2_id ? 'pvp' : 'vs_cpu'
		});
		
	} catch (err) {
		console.error('❌ Errore in updatePlayerStats:', err);
		console.error('❌ Stack trace:', err.stack);
		reply.code(500).send({ message: 'Errore interno del server: ' + err.message });
	}
};

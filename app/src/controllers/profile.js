import { authenticator } from 'otplib'
import qrcode from 'qrcode'
import bcrypt from 'bcrypt'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { randomUUID } from 'crypto'

const broadcastFriendshipEvent = (reply, payload) => {
	const onlineUsers = reply?.server?.onlineUsers
	if (!onlineUsers)
		return
	const message = JSON.stringify({
		type: 'friendship',
		action: payload.action,
		userId: payload.userId,
		friendId: payload.friendId,
		timestamp: new Date().toISOString()
	})
	const resolveSocket = (userId) => onlineUsers.get(userId) ?? onlineUsers.get(Number(userId)) ?? onlineUsers.get(String(userId))
	for (const targetId of [payload.userId, payload.friendId]) {
		const socket = resolveSocket(targetId)
		if (socket && socket.readyState === socket.OPEN) {
			socket.send(message)
		}
	}
}

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
		return reply.code(404).send({message: 'user not found'})
	const validPwd = await bcrypt.compare(oldPassword, user.password)
	if (!validPwd) return reply.code(401).send({message: "invalid password"})

	const hashedPassword = await bcrypt.hash(newPassword, 10)
	const stmt2 = reply.server.db.prepare('UPDATE users SET password = ? WHERE id =  ?')
	const response = stmt2.run(hashedPassword, id)
	if (response.changes === 0)
		return reply.code(500).send({message: 'error while updating password'})
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
	const targetId = Number(friendID)
	const requesterId = Number(id)
	if (Number.isNaN(targetId))
		return reply.code(400).send({message: 'invalid friend id'})
	if (Number.isNaN(requesterId))
		return reply.code(400).send({message: 'invalid requester id'})

	const friendExists = reply.server.db.prepare('SELECT id FROM users WHERE id = ?').get(targetId)
	if(!friendExists)
		return reply.code(404).send({ message: 'Friend not found' })
	if(requesterId === targetId)
		return reply.code(400).send({message: 'cant add yourself'})

	try {
		const insertStmt = reply.server.db.prepare('INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)')
		const insertBoth = reply.server.db.transaction((userId, otherId) => {
			const forward = insertStmt.run(userId, otherId)
			const reverse = insertStmt.run(otherId, userId)
			return forward.changes + reverse.changes
		})
		const totalChanges = insertBoth(requesterId, targetId)
		if (totalChanges === 0) {
			return reply.send({message: 'friendship already exists'})
		}
		broadcastFriendshipEvent(reply, {action: 'added', userId: requesterId, friendId: targetId})
		reply.send({message: `user ${requesterId} and ${targetId} are now friends`})
	}
	catch (err){
		reply.code(500).send({message: err.message ?? 'error while adding friend'})
	}
}

export const deleteFriend = async (req, reply) => {
	const {friendID} = req.params
	const { id } = req.user
	const targetId = Number(friendID)
	const requesterId = Number(id)
	if (Number.isNaN(targetId))
		return reply.code(400).send({message: 'invalid friend id'})
	if (Number.isNaN(requesterId))
		return reply.code(400).send({message: 'invalid requester id'})

	const friendExists = reply.server.db.prepare('SELECT id FROM users WHERE id = ?').get(targetId)
	if(!friendExists)
		return reply.code(404).send({ message: 'Friend not found' })
	if(requesterId === targetId)
		return reply.code(400).send({message: 'cant add yourself'})

	const deleteStmt = reply.server.db.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?')
	const deleteBoth = reply.server.db.transaction((userId, otherId) => {
		const forward = deleteStmt.run(userId, otherId)
		const reverse = deleteStmt.run(otherId, userId)
		return forward.changes + reverse.changes
	})
	const totalChanges = deleteBoth(requesterId, targetId)
	if (totalChanges === 0)
		return reply.code(404).send({message: 'no friendship found'})

	broadcastFriendshipEvent(reply, {action: 'removed', userId: requesterId, friendId: targetId})
	reply.send({message: `friendship between ${requesterId} and ${targetId} removed`})
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
	reply.header('Cache-Control', 'no-store')
	reply.header('Pragma', 'no-cache')
	reply.header('Expires', '0')
	reply.send(friends)
}

export const getUserStats = (req, reply) => {
	const { id } = req.user
	const db = reply.server.db
	const totals = db.prepare(`
		SELECT 
			COUNT(*) AS totalMatches,
			SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) AS wins
		FROM matches
		WHERE player1_id = ? OR player2_id = ?
	`).get(id, id, id)

	const perGame = db.prepare(`
		SELECT 
			COALESCE(game_name, 'unknown') AS game,
			COUNT(*) AS totalMatches,
			SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) AS wins
		FROM matches
		WHERE player1_id = ? OR player2_id = ?
		GROUP BY COALESCE(game_name, 'unknown')
	`).all(id, id, id)

	const normalizedGames = perGame.map((row) => {
		const totalMatches = row.totalMatches ?? 0
		const wins = row.wins ?? 0
		return {
			game: row.game,
			totalMatches,
			wins,
			losses: totalMatches - wins
		}
	})

	const totalMatches = totals?.totalMatches ?? 0
	const wins = totals?.wins ?? 0
	reply.send({
		totalMatches,
		wins,
		losses: totalMatches - wins,
		games: normalizedGames
	})
}



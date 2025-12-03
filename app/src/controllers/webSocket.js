import jwt from 'jsonwebtoken'

export const webSocketController = (connection, req, reply) => {
	try{
		const {token} = req.params
		if (!token)
			throw new Error()
		const decoded = jwt.verify(token, reply.server.config.JWT_SECRET)
		const userId = decoded.id

		reply.server.onlineUsers.set(userId, connection.socket)
		reply.server.db.prepare('UPDATE users SET last_seen = datetime(\'now\') WHERE id = ?').run(userId)

		const broadcastPresence = (status) => {
			const payload = JSON.stringify({
				type: 'presence',
				userId,
				status,
				timestamp: new Date().toISOString()
			})
			for (const [, socket] of reply.server.onlineUsers.entries()) {
				if (socket.readyState === socket.OPEN) {
					socket.send(payload)
				}
			}
		}

		broadcastPresence('online')
		console.log(`User ${userId} connected via WS`)

		connection.socket.on('close', () => {
			reply.server.onlineUsers.delete(userId)
			reply.server.db.prepare('UPDATE users SET last_seen = datetime(\'now\') WHERE id = ?').run(userId)
			broadcastPresence('offline')
			console.log(`User ${userId} disconnected`)
		})

		connection.socket.on('error', (err) => {
			console.error('WebSocket error', err)
			connection.socket.close()
		})
	}
	catch (err){
			console.error('WebSocket auth error:', err.message)
			connection.socket.close()
	}
}
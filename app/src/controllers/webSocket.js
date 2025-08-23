export const webSocketController = (connection, req, reply) => {
	try{
		const {token} = req.params
		if (!token)
			throw new Error()
		const decoded = jwt.verify(token, reply.server.config.JWT_SECRET)
		const userId = decoded.id
		
		reply.server.onlineUsers.set(userId, connection.socket)
		console.log(`✅ User ${userId} connected via WS`)

		connection.socket.on('close', () => {
			reply.server.onlineUsers.delete(userId)
			console.log(`❌ User ${userId} disconnected`)
		});
	}
	catch (err){
			console.error('❌ WebSocket auth error:', err.message)
			connection.socket.close()
	}
}
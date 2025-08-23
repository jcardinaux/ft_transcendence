import jwt from 'jsonwebtoken'

class SocketManager {
    constructor(fastify) {
        this.fastify = fastify  // Istanza app completa
        this.connections = new Map()  // socketId -> connection data
        console.log('🔌 SocketManager creato')
    }
    //funzione principale di controllo della richiesta
    handleConnection(connection, request) {
        console.log('🔌 Tentativo connessione WebSocket')
        
        let userData = null
        const socketId = this.generateSocketId() //una semplice stringa con le info da mettere in mappa
        
        try {
            // **STEP 1: Estrai JWT Token**
            const token = this.extractToken(request) //vede se c'è il token nella richiesta
            
            if (token) {
                // **STEP 2: Verifica JWT (usa metodo di fastify)**
                const decoded = jwt.verify(token, this.fastify.config.JWT_SECRET)
                //                                  ^^^^^^^^^^^^^^^^^^^^^^^^
                //                                  FASTIFY: Accesso alla config
                
                userData = {
                    userId: decoded.id,
                    username: decoded.username,
                    socketId: socketId,
                    connectedAt: new Date(),
                    lastActivity: new Date()
                }
                
                // **STEP 3: Salva connessione**
                this.connections.set(socketId, userData)
                
                // **STEP 4: Marca utente online (usa decorator di fastify)**
                this.fastify.onlineUsers.set(userData.userId, userData)
                //   ^^^^^^^^ ^^^^^^^^^^^ ^^^^ ^^^^^^^^^^^^^^^ ^^^^^^^^
				//   |        |           |    |               |
				//   |        |           |    |               Valore da salvare
				//   |        |           |    Chiave (ID utente)
				//   |        |           Metodo Map per aggiungere
				//   |        Decorator Map degli utenti online
				//   Istanza fastify dell'app
                //  FASTIFY: Accesso al decorator onlineUsers
                
                // **STEP 5: Aggiorna database (usa decorator di fastify)**
                this.fastify.db.prepare('UPDATE users SET last_seen = datetime(\'now\') WHERE id = ?').run(userData.userId)
                //  ^^^^^^^^^^^^^^^
                //  FASTIFY: Accesso al database
                
                console.log(`✅ Utente ${userData.username} connesso via WebSocket`)
                
                // **STEP 6: Notifica altri utenti**
                this.broadcastUserStatus(userData.userId, userData.username, 'online')
                
            } else {
                console.log('❌ Nessun token JWT fornito')
            }
            
        } catch (error) {
            console.log('❌ Token JWT non valido:', error.message)
        }
        
		// questi due sono è il cuore dell'oggetto quello che effettivamente controlla i  socket, il resto
		//sono controlli per vedere se è tutto ok o se dobbiamo tenerte traccia di quella connessione
        // Gestisci messaggi ma questo gia esiste
        connection.socket.on('message', (message) => {
            this.handleMessage(connection, message, userData)
        })
        
        // Gestisci disconnessione
        connection.socket.on('close', () => {
            this.handleDisconnection(socketId, userData)
        })
    }
    
    extractToken(request) {
        // Cerca token in query string: ws://localhost:5000/ws?token=eyJ...
        if (request.query && request.query.token) {
            return request.query.token
        }
        
        // Cerca token negli headers: Authorization: Bearer eyJ...
        if (request.headers.authorization) {
            return request.headers.authorization.split(' ')[1]
        }
        
        return null
    }
    
    handleMessage(connection, rawMessage, userData) {
        try {
            const message = JSON.parse(rawMessage)
            
            // **Aggiorna attività utente se autenticato**
            if (userData) {
                userData.lastActivity = new Date()
                
                // **Aggiorna mappa online (usa decorator di fastify)**
                this.fastify.onlineUsers.set(userData.userId, userData)
                //  ^^^^^^^^^^^^^^^^^^^^^^^^
                //  FASTIFY: Aggiorna decorator
            }
            
            switch (message.type) {
                case 'ping':
                    connection.socket.send(JSON.stringify({ type: 'pong' }))
                    break
                    
                case 'get_online_users':
                    this.sendOnlineUsersList(connection)
                    break
            }
            
        } catch (error) {
            console.error('🚨 Errore parsing messaggio:', error)
        }
    }
    
    handleDisconnection(socketId, userData) {
        // Rimuovi connessione
        this.connections.delete(socketId)
        
        if (userData) {
            // **Rimuovi da mappa online (usa decorator di fastify)**
            this.fastify.onlineUsers.delete(userData.userId)
            //  ^^^^^^^^^^^^^^^^^^^^^^^^
            //  FASTIFY: Rimozione dal decorator
            
            console.log(`🔌 Utente ${userData.username} disconnesso`)
            
            // Notifica altri utenti
            this.broadcastUserStatus(userData.userId, userData.username, 'offline')
        }
    }
    
    broadcastUserStatus(userId, username, status) {
        const message = JSON.stringify({
            type: 'user_status_change',
            userId,
            username,
            status,
            timestamp: new Date().toISOString()
        })
        
        // Invia a tutte le connessioni attive
        this.connections.forEach((userData, socketId) => {
            const connection = userData.connection || this.findConnectionBySocketId(socketId)
            if (connection && connection.socket.readyState === 1) {
                connection.socket.send(message)
            }
        })
    }
    
    sendOnlineUsersList(connection) {
        // **Ottieni lista da fastify decorator**
        const onlineUsers = Array.from(this.fastify.onlineUsers.values())
        //                              ^^^^^^^^^^^^^^^^^^^^^^^^
        //                              FASTIFY: Legge dal decorator
        
        connection.socket.send(JSON.stringify({
            type: 'online_users_list',
            users: onlineUsers.map(user => ({
                userId: user.userId,
                username: user.username,
                connectedAt: user.connectedAt
            }))
        }))
    }
    
    generateSocketId() {
        return `socket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    getStats() {
        return {
            totalConnections: this.connections.size,
            onlineUsers: this.fastify.onlineUsers.size
            //           ^^^^^^^^^^^^^^^^^^^^^^^^
            //           FASTIFY: Legge dal decorator
        }
    }
}

export default SocketManager
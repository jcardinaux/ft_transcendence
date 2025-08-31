import { UsernameOpts,
	allUserOpts,
	generate2FAOpts,
	verify2FAOpts,
	displayNameOpts,
	passwordOpts,
	avatarUploadOpts,
	addFriendOpts,
	deleteFriendOpts,
	getFriendsOpts,
	userStatsOpts,
	allUserMathcesOpts} from "../schemas/profile.js"

async function profileRoute(fastify, options){
 
	fastify.put("/changeUsername", UsernameOpts)
	fastify.get("/allUserInfo", allUserOpts)
	fastify.get("/generate2FA", generate2FAOpts)
	fastify.post("/verify2FA", verify2FAOpts)
	fastify.post("/uploadAvatar", avatarUploadOpts)
	fastify.put("/changeDisplayName", displayNameOpts)
	fastify.put("/changePassword", passwordOpts)
	fastify.post("/addFriend/:friendID", addFriendOpts)
	fastify.delete("/deleteFriend/:friendID", deleteFriendOpts)
	fastify.get("/getFriends", getFriendsOpts)
	fastify.get("/stats", userStatsOpts)
	fastify.get ("/matches", allUserMathcesOpts)
	
	// **SEMPLICE: Stampa mappa online**
	fastify.get("/print-map", {
		handler: async (req, reply) => {
			console.log('🗺️  MAPPA UTENTI ONLINE:')
			console.log('Dimensione mappa:', fastify.onlineUsers.size)
			
			if (fastify.onlineUsers.size === 0) {
				console.log('❌ Nessun utente online')
			} else {
				console.log('✅ Utenti online:')
				for (const [userId, socket] of fastify.onlineUsers.entries()) {
					console.log(`   - User ID: ${userId}`)
				}
			}
			
			return { 
				message: 'Mappa stampata in console del server',
				onlineCount: fastify.onlineUsers.size,
				onlineUserIds: Array.from(fastify.onlineUsers.keys())
			}
		}
	})
}

export default profileRoute

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
}

export default profileRoute
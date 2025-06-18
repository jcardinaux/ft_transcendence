import { UsernameOpts, allUserOpts, generate2FAOpts, verify2FAOpts} from "../schemas/profile.js"

async function profileRoute(fastify, options){

	//change only username 
	fastify.put("/changeUsername", UsernameOpts)
	fastify.get("/allUserInfo", allUserOpts)
	fastify.get("/generate2FA", generate2FAOpts)
	fastify.post("/verify2FA", verify2FAOpts)
}

export default profileRoute
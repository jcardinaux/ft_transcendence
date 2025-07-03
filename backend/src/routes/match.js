import { addMatchOpts, allMatchOpts, allUserMatchOpts, deleteMatchOpts } from "../schemas/match.js";

async function matchesRoute (fastify, options) {
	fastify.get("/allMatches", allMatchOpts)
	//get all match of non logged user such as friends
	fastify.get("/userAllMAtches/:id", allUserMatchOpts)
	fastify.post("/addMatch", addMatchOpts)
	fastify.delete("/deletaMatch/:id", deleteMatchOpts)
}

export default matchesRoute
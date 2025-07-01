import { addMatchOpts, allMatchOpts, allUserMatchOpts, deleteMatchOpts } from "../schemas/match.js";

async function matchesRoute (fastify, options) {
	fastify.get("/allMatches", allMatchOpts)
	fastify.get("/userAllMAtches", allUserMatchOpts)
	fastify.post("/addMatch", addMatchOpts)
	fastify.delete("/deletaMatch/:id", deleteMatchOpts)
}

export default matchesRoute
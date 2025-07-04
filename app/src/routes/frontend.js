async function frontendRoute (fastify, options) {
	fastify.get("/", (req, reply) =>{
		return reply.sendFile('index.html');
	})
}

export default frontendRoute
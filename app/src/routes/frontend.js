async function frontendRoute (fastify, options) {
	fastify.get("/", (req, reply) => {
		return reply.sendFile('index.html');
	});

	fastify.post("/log", async (req, reply) => {
    const body = await req.body;

    const message = body?.message || "No message provided";
    const level = body?.level || "info";
    const context = body?.context || {};

    // Dispatch based on lev
  const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  if (levels.includes(level) && typeof fastify.log[level] === 'function') {
    fastify.log[level]({ context }, message);
  } else {
    fastify.log.error({ context }, `Unknown log level: ${level} — ${message}`);
  }

  return reply.send({ status: "ok" });
});


}

export default frontendRoute
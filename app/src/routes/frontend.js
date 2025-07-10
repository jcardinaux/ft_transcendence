import { access } from "fs";
import webClientLogger from '../logger/webClientLogger.js';

async function frontendRoute (fastify, options) {
	/*fastify.get("/", (req, reply) =>{
			reply.sendFile('landingPage.html');
	})
	fastify.get("/login", (req, reply) =>{
			reply.sendFile('login.html')
	})
	fastify.get("/register", (req, reply) => {
		reply.sendFile('register.html')
	})
	fastify.get("/game", (req, reply) => {
		reply.sendFile('game.html')
	})*/
  fastify.post("/log", async (req, reply) => {
    const body = await req.body;

    const message = body?.message || "No message provided";
    const level = body?.level || "info";
    const context = body?.context || {};

    const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    if (levels.includes(level) && typeof webClientLogger[level] === 'function') {
      webClientLogger[level]({ context }, message);  // ora scrive su client.log
    } else {
      fastify.log.error({ context }, `Unknown log level: ${level} — ${message}`);
    }
    return reply.send({ status: "ok" });
  });
}

export default frontendRoute;

import { access } from "fs";

async function frontendRoute (fastify, options) {
	fastify.get("/", (req, reply) =>{
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
	})
}

export default frontendRoute
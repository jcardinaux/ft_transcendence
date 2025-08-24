import { webSocketController } from "../controllers/webSocket.js"

async function WebSocketRoutes(fastify, options){
	fastify.get("/ws/:token", {websocket: true}, webSocketController)
}

export default WebSocketRoutes
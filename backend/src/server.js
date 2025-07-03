import fastify from 'fastify'
import cors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifyEnv from '@fastify/env'
import jwt from 'jsonwebtoken'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { fileURLToPath } from 'url';
import WebSocket from '@fastify/websocket'


import path, {resolve} from 'node:path'
import { readFileSync } from 'node:fs'

import authRoutes from "./routes/auth.js"
import  db from "../database/db.js"
import profileRoute from './routes/profile.js'
import matchesRoute from './routes/match.js'

const httpOption = {
    key: readFileSync(resolve('certs', 'server.key')),
    cert: readFileSync(resolve('certs', 'server.crt'))
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//env importer
const schema = {
    type: 'object',
    required: ['FASTIFY_PORT', 'JWT_SECRET', 'NODE_ENV'],
    properties: {
        FASTIFY_PORT: {
            type: 'string',
            default: 3000
        },
        JWT_SECRET: {
            type: 'string'
        },
        NODE_ENV: {
            type: 'string',
            default: 'development'
        }
    }
}
const app = fastify({logger:true, https: httpOption})

// Allow all: HTTP/HTTPS
await app.register(cors, {
    origin: true ,
    credentials: true
})

//database are now avaiable in all the project
app.decorate('db', db)
 
const onlineUsers = new Map()
app.decorate('onlineUsers', onlineUsers)

//middlewere JWT
app.decorate('verifyJWT', async function (req, reply) {
    try {
        const tokenRaw = req.headers.authorization
        if(!tokenRaw) throw new Error()
        const token = tokenRaw.split(' ')[1]
        const decoded = jwt.verify(token, this.config.JWT_SECRET)
        req.user = decoded
        this.db.prepare('UPDATE users SET last_seen = datetime(\'now\') WHERE id = ?').run(req.user.id)
    }
    catch (err){
        reply.code(401).send({message: 'unouthorized'})
    }
})

//cuore del server inizializza le rotte
const start = async () => {
    try {
        await app.register(WebSocket)
        await app.register(fastifyEnv, {
            dotenv: true, 
            schema: schema,
            confKey: 'config', //accesso gobale tramite  app.config 
        });
        await app.register(multipart)
        await app.register(fastifyStatic, {
            root: path.join(__dirname, '..', 'public'),
            prefix: '/public/'
        })
        await app.register(fastifySwagger, {
            openapi: {
                info: {
                    title: 'ft_trascandance API documentation',
                    description: 'amema & mcamilli qui della documentazione delle api del back',
                    version: '0.0.1',
                },
                servers: [
                    { url: `https://localhost:${app.config.FASTIFY_PORT}`, description: 'Local dev: Development server' },
                ],
                tags: [
                    {name: 'Auth', description: 'login and user menagment'},
                    {name: 'Profile', description: 'profile\'s update friends settings etc'}
                ],
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT',
                            description: 'Autenticazione JWT tramite header Authorization (Bearer Token)'
                        }
                    }
                }
            },
        })
        
        await app.register(fastifySwaggerUi, {
            routePrefix: '/docs',
            uiConfig: {
                deepLinking: true 
            },
        })
        await app.register(authRoutes, {prefix: '/auth'})
        await app.register(profileRoute, {prefix: '/profile'})
        await app.register(matchesRoute, {prefix: '/matches'})
        await app.listen({port: app.config.FASTIFY_PORT, host: '0.0.0.0'})
    }
    catch (error) {
        app.log.error(error)
        process.exit(1)
    }
}

start()
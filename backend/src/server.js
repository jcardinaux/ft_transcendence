import fastify from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifyEnv from '@fastify/env'
import jwt from 'jsonwebtoken'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { fileURLToPath } from 'url';


import path, {resolve} from 'node:path'
import { readFileSync } from 'node:fs'

import authRoutes from "./routes/auth.js"
import  db from "../database/db.js"
import profileRoute from './routes/profile.js'

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

//database are now avaiable in all the project
app.decorate('db', db)

//middlewere JWT, for protected route
app.decorate('verifyJWT', async function (req, reply) {
    try {
        const tokenRaw = req.headers.authorization
        if(!tokenRaw) throw new Error()
        const token = tokenRaw.split(' ')[1]
        const decoded = jwt.verify(token, this.config.JWT_SECRET)
        req.user = decoded
    }
    catch (err){
        reply.code(401).send({message: 'unauthorized'})
    }
})

//cuore del server inizializza le rotte
const start = async () => {
    try {
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
                    { url: `https://localhost:${app.config.FASTIFY_PORT}`, description: 'Development server' }
                ],
                tags: [
                    {name: 'Auth', description: 'login and user menagment'},
                    {name: 'Profile', description: 'profile\'s update friends settings etc'}
                ],
                components: {
                    securitySchemes: {
                        // Definisci il tuo schema di sicurezza chiamato 'bearerAuth'
                        bearerAuth: {
                            type: 'http',        // Indica che è un metodo di autenticazione HTTP
                            scheme: 'bearer',    // Il tipo di schema è 'bearer' (per i token Bearer)
                            bearerFormat: 'JWT', // Formato opzionale, indica che si tratta di un JWT
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
        await app.listen({port: app.config.FASTIFY_PORT, host: '0.0.0.0'})
    }
    catch (error) {
        app.log.error(error)
        process.exit(1)
    }
}

start()
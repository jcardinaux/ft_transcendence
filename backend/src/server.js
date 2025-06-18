import fastify from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifyEnv from '@fastify/env'
import jwt from 'jsonwebtoken'

import {resolve} from 'node:path'
import { readFileSync } from 'node:fs'

import authRoutes from "./routes/auth.js"
import  db from "../database/db.js"
import profileRoute from './routes/profile.js'

const httpOption = {
    key: readFileSync(resolve('certs', 'server.key')),
    cert: readFileSync(resolve('certs', 'server.crt'))
}

const app = fastify({logger:true, https: httpOption})

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

const start = async () => {
    try {
        await app.register(fastifyEnv, {
            dotenv: true, // Abilita il caricamento dal file .env
            schema: schema, // Associa lo schema definito sopra per la validazione
            confKey: 'config', // Le variabili saranno accessibili via app.config (opzionale, default è 'config')
        });
        await app.register(fastifySwagger, {
            openapi: {
                info: {
                    title: 'ft_trascandance API documentation',
                    description: 'amema & mcamilli qui della documentazione delle api del back',
                    version: '0.0.1',
                },
                servers: [
                    { url: `http://localhost:${app.config.FASTIFY_PORT}`, description: 'Development server' }
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
            routePrefix: '/docs', // L'URL dove sarà visibile la documentazione (es. http://localhost:5000/docs)
            uiConfig: {
                docExpansion: 'full', // Espandi tutte le sezioni di default
                deepLinking: true // Abilita i link profondi
            },
            // Le opzioni per initOAuth, validatorUrl, ecc.
        })
        
        await app.register(authRoutes, {prefix: '/auth'})
        await app.register(profileRoute, {prefix: '/profile'})
        await app.listen({port: app.config.FASTIFY_PORT})
    }
    catch (error) {
        app.log.error(error)
        process.exit(1)
    }
}

start()
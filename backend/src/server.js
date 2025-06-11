import fastify from 'fastify'
import loginRoutes from "./routes/login.js"
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'

const PORT = {port: 5000}
const app = fastify({logger:true})


const start = async () => {
    try {
        await app.register(fastifySwagger, {
            openapi: {
                info: {
                    title: 'ft_trascandance API documentation',
                    description: 'amema & mcamilli qui della documentazione delle api del back',
                    version: '0.0.1',
                },
                servers: [
                    { url: `http://localhost:${PORT.port}`, description: 'Development server' }
                ],
                // Se hai componenti di sicurezza o tags, puoi definirli qui
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
        
        await app.register(loginRoutes)
        await app.listen(PORT)
    }
    catch (error) {
        app.log.error(error)
        process.exit(1)
    }
}

start()
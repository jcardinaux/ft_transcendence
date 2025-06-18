import { getUserOpts, getUserByIdOpts, postUserOpts, deleteUserOpts, loginOpts} from '../schemas/auth.js'


async function authRoutes(fastify, options){
//retrive all users
    fastify.get("/users", getUserOpts)
//retrive user by id
    fastify.get("/user/:id", getUserByIdOpts)
//add a user
    fastify.post("/user", postUserOpts)
//delete a user
    fastify.delete("/user/:id", deleteUserOpts)
 //   done()
    fastify.post("/login", loginOpts)
}

export default authRoutes
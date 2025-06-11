import users from '../user.js'
import { getAllUsers, getSingleUser, addUser, deleteUser, updateUser } from '../controllers/login.js'

const UserSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        name: { type: 'string' }
    },
}

const getUserOpts = {
    schema: {
        response: {
            200: {
                type: 'array',
                items: {
                    UserSchema
                },
            },
        },
    },
    handler: getAllUsers
}

const getUserByIdOpts = {
    schema: {
        response: {
            200: UserSchema,
        },
    },
    handler: getSingleUser
}

const postUserOpts = {
    schema: {
        body: {
            type: 'object',
            required:['name'],
            properties: {
                name: {type: 'string'}
            },
        },
        response: {
            201: UserSchema,
        },
    },
    handler: addUser
}


const deleteUserOpts = {
    schema:{
        200: {
            type: 'object',
            properties: {
                message: {type: 'string'}
            },
        },
    },
    handler: deleteUser
}

const putUserOpts = {
    schema: {
        200: UserSchema
    },
    handler: updateUser
}


function loginRoutes(fastify, options, done){
//retrive all users
    fastify.get("/users", getUserOpts, )
//retrive user by id
    fastify.get("/user/:id", getUserByIdOpts)
//add a user
    fastify.post("/user", postUserOpts)
//delete a user
    fastify.delete("/user/:id", deleteUserOpts)
//update a user
    fastify.put("/user/:id", putUserOpts)
   
    done()
}

export default loginRoutes
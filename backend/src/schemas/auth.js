import { getAllUsers, getSingleUser, addUser, deleteUser, login} from '../controllers/auth.js'
import { MessageSchema, UserSchema } from '../schemas/utils.js'

export const getUserOpts = {
    schema: {
		tags: ['Auth'],
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

export const getUserByIdOpts = {
    schema: {
		tags: ['Auth'],
        response: {
            200: UserSchema,
            404: MessageSchema
        },
    },
    handler: getSingleUser
}

export const postUserOpts = {
    schema: {
		tags: ['Auth'],
        body: {
            type: 'object',
            required:['username', 'password', 'email'],
            properties: {
                username: {type: 'string'},
                password: {type: 'string'},
				email: {type: 'string'},
                display_name: {type: 'string'}
            },
        },
        response: {
            201: UserSchema,
            400: MessageSchema
        },
    },
    handler: addUser
}


export const deleteUserOpts = {
    schema:{
		tags: ['Auth'],
        200: MessageSchema,
        404: MessageSchema
    },
    handler: deleteUser
}

export const loginOpts = {
    schema: {
		tags: ['Auth'],
        body: {
            type: 'object',
            required:['username', 'password'],
            properties: {
                username: {type: 'string', description: 'email or username'},
                password: {type: 'string'},
                otp: {type: 'string'}
            },
        },
        response: {
            201: {
				type: 'object',
				properties: {
					token: {type: 'string'},
				}
			},
            401: MessageSchema
        },
    },
    handler: login
}
import { showAllUseriInfo, updateUserName, generate2FA, verify2FA } from "../controllers/profile.js"
import { CompleteUserSchema, MessageSchema } from "../schemas/utils.js"

export const UsernameOpts = {
	schema:{
		tags: ['Profile'],
		security: [{ bearerAuth: [] }],
		body:{
			type: 'object',
			required: ['username'],
			properties: {username:{type: 'string'}}
		},
		response:{
			200: MessageSchema,
			404: MessageSchema
		}
	},
	preHandler: (req, reply) => req.server.verifyJWT(req, reply),
	handler: updateUserName
}

export const allUserOpts = {
	schema: {
		tags: ['Profile'],
		security: [{ bearerAuth: [] }],
		response:{
			200: CompleteUserSchema,
		}
	},
	preHandler: (req, replay) => req.server.verifyJWT(req, replay),
	handler: showAllUseriInfo
}

export const generate2FAOpts = {
	schema:{
		tags: ['Profile'],
		security: [{ bearerAuth: [] }],
	},
	preHandler: (req, replay) => req.server.verifyJWT(req, replay),
	handler: generate2FA
}


export const verify2FAOpts = {
	schema: {
		tags: ['Profile'],
		security: [{ bearerAuth: [] }],
		body: {
			type: 'object',
			required: ['token'],
			properties:{
				token: {type: 'string'}
			}
		},
		response: {
			200: MessageSchema,
			401: MessageSchema
		}
	},
	preHandler: (req, reply) => req.server.verifyJWT(req, reply),
	handler:  verify2FA
}
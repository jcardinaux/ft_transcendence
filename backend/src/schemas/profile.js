import {showAllUseriInfo,
		updateUserName, 
		generate2FA,
		verify2FA,
		changeDisplayName, 
		changePassword,
		uploadAvatar,
		addFriend,
		deleteFriend,
		getFriends,
		userStats,
		allUserMathces} from "../controllers/profile.js"
import { CompleteUserSchema, MessageSchema, FriendSchema, MatchSchema } from "../schemas/utils.js"

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

export const displayNameOpts = {
		schema:{
		tags: ['Profile'],
		security: [{ bearerAuth: [] }],
		body:{
			type: 'object',
			required: ['display_name'],
			properties: {display_name:{type: 'string'}}
		},
		response:{
			200: MessageSchema,
			404: MessageSchema
		}
	},
	preHandler: (req, reply) => req.server.verifyJWT(req, reply),
	handler: changeDisplayName
}

export const passwordOpts = {
		schema:{
		tags: ['Profile'],
		security: [{ bearerAuth: [] }],
		body:{
			type: 'object',
			required: ['newPassword', 'oldPassword'],
			properties: {
				newPassword:{type: 'string'},
				oldPassword:{type: 'string'}
			}
		},
		response:{
			200: MessageSchema,
			404: MessageSchema
		}
	},
	preHandler: (req, reply) => req.server.verifyJWT(req, reply),
	handler: changePassword
}

export const avatarUploadOpts = {
	schema: {
		tags: ['Profile'],
		consumes: ['multipart/form-data'],
		security: [{ bearerAuth: [] }],
		response: {
			200: {
				type: 'object',
				properties: {
					message: { type: 'string' },
					url: { type: 'string' }
				}
			},
			400: { type: 'object', properties: { message: { type: 'string' } } }
		}
	},
	preHandler: (req, reply) => req.server.verifyJWT(req, reply),
	handler: uploadAvatar
}


export const addFriendOpts =  {
	schema: {
		tags: ['Profile'],
		security: [{ bearerAuth: [] }],
		response: {
			200: MessageSchema,
			404: MessageSchema,
			400: MessageSchema
		}
	},
	preHandler: (req, reply) => req.server.verifyJWT(req, reply),
	handler: addFriend
}

export const deleteFriendOpts =  {
	schema: {
		tags: ['Profile'],
		security: [{ bearerAuth: [] }],
		response: {
			200: MessageSchema,
			404: MessageSchema,
			400: MessageSchema
		}
	},
	preHandler: (req, reply) => req.server.verifyJWT(req, reply),
	handler: deleteFriend
}

export const getFriendsOpts = {
	schema: {
		tags: ['Profile'],
		security: [{ bearerAuth: []}],
		response: {
			200:{
				type: 'array',
				items: FriendSchema
			},
			404: MessageSchema,
			401: MessageSchema
		},
	},
	preHandler: (req, reply) => req.server.verifyJWT(req, reply),
	handler: getFriends
}

export const userStatsOpts = {
	schema:{
		tags:['Profile'],
		security: [{ bearerAuth: []}],
		response: {
			200: {
				tipe: 'object',
				properties: {
					wins: {type: 'integer'},
					losses: {type: 'integer'},
					matchNumber: {type: 'integer'}
				}
			}
		}
	},
	preHandler: (req, replay) => req.server.verifyJWT(req, replay),
	handler: userStats
}

export const allUserMathcesOpts = {
	schema: {
		tags: ['Profile'],
		security: [{ bearerAuth: []}],
		response: {
			200: {
				type: 'array',
				items: MatchSchema
			}
		}
	},
	preHandler: (req, replay) => req.server.verifyJWT(req, replay),
	handler: allUserMathces
}
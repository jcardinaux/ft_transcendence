export const MessageSchema = {
    type: 'object',
    properties : {
        message : {type: 'string'}
    },
}

export const UserSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        username: { type: 'string' },
		email: {type: 'string'}
    },
}

export const CompleteUserSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        username: { type: 'string' },
        password: {type: 'string'},
		email: {type: 'string'},
        avatar: {type: 'string'},
        totp_secret: {type: 'string'},
        twofa_enabled: {type: 'number'}
    },
}
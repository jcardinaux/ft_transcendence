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
        display_name: {type: 'string'},
        password: {type: 'string'},
		email: {type: 'string'},
        avatar: {type: 'string'},
        totp_secret: {type: 'string'},
        twofa_enabled: {type: 'number'},
        last_seen: {type: 'string'}
    },
}

export const FriendSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
	    username: { type: 'string' },
	    display_name: { type: 'string' },
	    avatar: { type: 'string' },
        last_seen: { type: 'string' },
        is_online: { type: 'boolean' }
    }
}

export const MatchSchema = {
    type: 'object',
    properties: {
        player1_id: {type: 'integer'},
        player2_id: {type: 'integer'},
        winner_id: {type: 'integer'},
        score: {type: 'string'},
        date: {type: 'string'}
    }
}
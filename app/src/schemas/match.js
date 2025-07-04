import { addMatch, allMatch, allUserMatch, deleteMatch } from "../controllers/match.js";
import { MatchSchema, MessageSchema } from "./utils.js";

export const allMatchOpts = {
	schema: {
		tags: ['Match'],
		response: {
			200:{
				type: 'array',
				item: {MatchSchema}
			}
		}
	},
	handler: allMatch
}

export const allUserMatchOpts = {
	schema: {
		tags: ['Match'],
		response : {
			200: {
				type: 'array',
				item: MatchSchema
			}
		}
	},
	handler: allUserMatch
}

export const addMatchOpts = {
	schema: {
		tags: ['Match'],
		body:{
			type: 'object',
			required: ['player1_id', 'player2_id', 'winner_id', 'score'],
			properties: {
				player1_id: {type: 'integer'},
        		player2_id: {type: 'integer'},
        		winner_id: {type: 'integer'},
        		score: {type: 'string'},
			}
		},
		response: {
			200: MatchSchema,
			400: MessageSchema
		}
	},
	handler: addMatch
}

export const deleteMatchOpts = {
	schema:{
		tags: ['Match'],
		response:{
			200: MessageSchema,
			404: MessageSchema
		}
	},
	handler: deleteMatch
}
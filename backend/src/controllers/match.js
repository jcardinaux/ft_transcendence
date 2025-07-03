export const allMatch = async (req, reply) => {
	const stmt = reply.server.db.prepare('SELECT * FROM matches')
	const matches = stmt.all()
	reply.send(matches)
}

export const allUserMatch = async (req, reply) => {
	const {id} = req.param
	const matches = reply.server.db.prepare('SELECT * FROM matches WHERE player1_id = ? OR player2_id = ?').all(id, id)
	reply.send(matches)
}

export const addMatch = async (req, reply) => {
	const {player1_id, player2_id, winner_id, score} = req.body
	if (winner_id !== player1_id && winner_id !== player2_id)
		reply.code(400).send({message: "winner should be player_1 or player_2"})
	else {
		const stmt = reply.server.db.prepare('INSERT INTO matches (player1_id, player2_id, winner_id, score) VALUES (?, ?, ?, ?)')
		const result  = stmt.run(player1_id, player2_id, winner_id, score)
		reply.send({player1_id, player2_id, winner_id, score})
	}
}

export const deleteMatch = async (req, reply) => {
	const {id} = req.params
	try{
		const stmt = reply.server.db.prepare('DELETE FROM matches WHERE id = ?')
		const result = stmt.run(id)
		if(result.changes === 0)
			reply.code(404).send({message: `match ${id} not found`})
		else
		reply.send({message: `match ${id} deleted`})
	}
	catch(err) {
		reply.code(500).send({message: err.message})
	}
}
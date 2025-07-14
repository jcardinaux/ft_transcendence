import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { authenticator } from 'otplib'


export const getAllUsers = (req, reply) => {
	const db = reply.server.db
	const users = db.prepare('SELECT id, username, twofa_enabled FROM users').all()
	reply.send(users)
}

export const getSingleUser = (req, reply) => {
	const {id} = req.params
	const stmt = reply.server.db.prepare('SELECT id, username, email FROM users WHERE id = ?')
	const user = stmt.get(id)
	if (!user) return reply.code(404).send({message: "Sorry we don't have this user"})
	reply.send(user)
}

export const addUser = async (req, reply) => {
	let {username, password, email, display_name} = req.body
	const cryptedPsw = await bcrypt.hash(password, 10)
	try {
		const stmt = reply.server.db.prepare('INSERT INTO users (username, password, email, display_name) VALUES (? , ?, ?, ?)')
		if(!display_name)
			display_name = username
		const newUser = stmt.run(username, cryptedPsw, email, display_name)
		reply.code(201).send({id: newUser.lastInsertRowid, username, email})
	}
	catch (err) {
		let errorMessage = 'registration error occured'
		if (err.message.includes('SQLITE_CONSTRAINT_UNIQUE') || err.message.includes('UNIQUE constraint failed')) {
                if (err.message.includes('users.username')) {
                    errorMessage = 'this username are not avaiable';
                } else if (err.message.includes('users.email')) {
                    errorMessage = 'mail already registered';
                } else {
                    errorMessage = 'this display name are not avaible';
                }
            }
		reply.code(400).send({message: errorMessage})
	}
}

//non la chiamata più sicura
export const deleteUser = (req, reply) => {
	const {id} = req.params
	const stmt = reply.server.db.prepare('DELETE FROM users WHERE id = ?')
	const response = stmt.run(id)
	if(response.changes === 0)
		return reply.code(404).send({message: "You are trying to delete a user who has already been deleted"})
	reply.send({message: `item ${id} has been removed`})
}

export const login = async (req, reply) => {
	const {username, password} = req.body
	const stmt = reply.server.db.prepare('SELECT * FROM users WHERE username = ? OR email = ?')
	const user = stmt.get(username, username)

	if(!user) return reply.code(401).send({message: `${username} are not registere as a user`})

	const validPassword = await bcrypt.compare(password, user.password)
	if (!validPassword) return reply.code(401).send({message: 'invalid password'})
	
	if(user.twofa_enabled){
		const {otp} = req.body
		if (!otp)
			return reply.code(401).send({message: 'insert otp code'})
		const validatorz = authenticator.verify({token:otp, secret: user.totp_secret})
		if (!validatorz)
			return reply.code(401).send({message: 'invalid OTP code'})	
	}

	const token = jwt.sign(
		{id: user.id, username: user.username},
		reply.server.config.JWT_SECRET,
		{expiresIn: '1d'}
	)

	reply.code(201).send({token})
}


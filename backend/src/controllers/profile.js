import { authenticator } from 'otplib'
import qrcode from 'qrcode'

export const updateUserName = async (req, reply) => {
	const {id} = req.user
	const {username} = req.body
	const stmt = reply.server.db.prepare('UPDATE users SET username = ? WHERE id = ?')
	const response = stmt.run(username, id)

	if(response.changes === 0)
		reply.code(404).send({message: "no user founded "})
	reply.send({message: `user ${id} are now ${username}`})
}


export const generate2FA = async (req, reply) => {

	const {id, username} = req.user
	const db = reply.server.db

	const secret = authenticator.generateSecret()
	const otpauth = authenticator.keyuri(username, 'ft_trascandance', secret)
	const qrCodeDataURL = await qrcode.toDataURL(otpauth)

	db.prepare('UPDATE users SET totp_secret = ? WHERE id = ?').run(secret, id)
	reply.send({qrCode: qrCodeDataURL})
}


export const verify2FA = (req, reply) => {
	const { id } = req.user
	const { token } = req.body
	const db = reply.server.db

	const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
	if (!user || !user.totp_secret) {
		return reply.code(404).send({ message: '2FA not setup for this user' })
	}

	const isValid = authenticator.verify({ token, secret: user.totp_secret })
	if (!isValid) {
		return reply.code(401).send({ message: 'Invalid 2FA code' })
	}

	db.prepare('UPDATE users SET twofa_enabled = 1 WHERE id = ?').run(id)

	reply.send({ message: '2FA activated' })
}


export const showAllUseriInfo = async (req, reply) => {
	const {id, username} = req.user

	const stmt = reply.server.db.prepare('SELECT * FROM users WHERE id = ?')
	const user = stmt.get(id)
	reply.send(user)
}

import { authenticator } from 'otplib'
import qrcode from 'qrcode'
import bcrypt from 'bcrypt'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { randomUUID } from 'crypto'

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
	const {id} = req.user

	const stmt = reply.server.db.prepare('SELECT * FROM users WHERE id = ?')
	const user = stmt.get(id)

	const avatar = user.avatar || '/public/avatar/fallback_avatar.png'
	reply.send({...user, avatar})
}


export const changeDisplayName = async (req, reply) => {
	const {id} = req.user
	const {display_name} = req.body
	const stmt = reply.server.db.prepare('UPDATE users SET display_name = ? WHERE id = ?')
	const response = stmt.run(display_name, id)

	if (response.changes === 0)
		reply.code(404).send({message: "no user founded "})
	reply.code(200).send({message: `display name are now ${display_name}`})
}

export const changePassword = async (req, reply) => {
	const {id} = req.user
	const {newPassword, oldPassword} = req.body

	const stmt = reply.server.db.prepare('SELECT * FROM users WHERE id = ?')
	const user = stmt.get(id)

	if(!user)
		reply.code(404).send({message: 'user not found'})
	const validPwd = await bcrypt.compare(oldPassword, user.password)
	if (!validPwd) return reply.code(401).send({message: "invalid password"})

	const stmt2 = reply.server.db.prepare('UPDATE users SET password = ? WHERE id =  ?')
	const response = stmt2.run(newPassword, id)
	if (response.change === 0)
		return reply.send({message: 'error while updating passsword'})
	reply.send({message: 'password correctly changed'})
}

export const uploadAvatar = async (req, reply) => {
	const { id } = req.user
	const file = await req.file()

	if (!file || !file.filename)
		return reply.code(400).send({ message: 'No file uploaded' })

	const ext = path.extname(file.filename)
	const filename = `${id}_${randomUUID()}${ext}`
	const avatarDir = path.join(process.cwd(), 'public', 'avatar')
	const filePath = path.join(avatarDir, filename)

	await pipeline(file.file, fs.createWriteStream(filePath))

	const avatarUrl = `/public/avatar/${filename}`
	req.server.db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarUrl, id)

	reply.send({ message: 'Avatar uploaded', url: avatarUrl })
}
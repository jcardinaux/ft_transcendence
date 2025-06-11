import usersConst from '../user.js'
import { v4 as uuid } from "uuid"


let users = usersConst

export const getAllUsers = (req, reply) => {
	reply.send(users)
}

export const getSingleUser = (req, reply) => {
	const {id} = req.params
	const user = users.find((user) => user.id === id)
	reply.send(user)
}

export const addUser = (req, reply) => {
	const {name} = req.body
	const newUser = {
		id: uuid(),
		name
	}
	users.push(newUser)
	reply.code(201).send(newUser)
}

export const deleteUser = (req, reply) => {
	const {id} = req.params
	users = users.filter((user) => user.id !== id)

	reply.send({message: `item ${id} has been removed`})
}

export const updateUser = (req, reply) => {
	const {id} = req.params
	const userToUpdate = users.find((user) => user.id === id)

	userToUpdate.name = req.body.name
	reply.send(userToUpdate)
}


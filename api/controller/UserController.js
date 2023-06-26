// Collection Name //
const USER = 'user'

const mongo = require("../../driver/mongoDriver")
const validate = require('../services/validate')

module.exports = {

	find: async function(req, res){
		
		const db = await mongo

		const response = await db.collection(USER).findOne({_id: new db.ObjectId(req.query['_id'])})
		res.json(response)
	},

	create: async function(req, res){

		const db = await mongo
		const user = Object.assign({}, req.body)

		console.log(user);

		// Important step //
		await validate(USER, user)

		const response = await db.collection(USER).insertOne(user)
		res.json(response.insertedId)
	}
}
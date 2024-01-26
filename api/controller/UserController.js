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

		const db_user = await db.collection(USER).findOne({ email: user.email })

		// console.log(user);
		// console.log(db_user);

		// Find one or create a new user //
		if(db_user){
			res.json(db_user);
		}
		else{
			// Important step //
			await validate(USER, user)
			user['createdAt'] = new Date()

			const response = await db.collection(USER).insertOne(user)
			res.json({_id: response.insertedId})
		}
	},

	update: async function(req, res){
		const db = await mongo
		const user = Object.assign({}, req.body)

		// console.log(user);

		// Important step //
		await validate(USER, user)
		user['updatedAt'] = new Date()

		// console.log(user);

		const response = await db.collection(USER).updateOne({_id: new db.ObjectId(user._id)}, {$set: {demographic: user.demographic}})
		res.json(response)
	}
}
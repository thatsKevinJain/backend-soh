// Collection Name //
const SUBMISSION = 'submission'

const mongo = require("../../driver/mongoDriver")
const validate = require('../services/validate')

module.exports = {

	// Find the latest submission from the user-id //
	find: async function(req, res){
		
		const db = await mongo

		const response = await db.collection(SUBMISSION).find({user: new db.ObjectId(req.query['_id'])}).sort({_id: -1}).toArray()
		res.json(response[0])
	},

	create: async function(req, res){

		const db = await mongo
		const submission = Object.assign({}, req.body)

		// Important step //
		await validate(SUBMISSION, submission)

		const response = await db.collection(SUBMISSION).insertOne(submission)
		res.json({_id: response.insertedId})
	}
}
// Collection Name //
const SUBMISSION = 'submission'
const GAME = 'game'

const mongo = require("../../driver/mongoDriver")
const validate = require('../services/validate')
const utils = require('../services/utils')

module.exports = {

	// Find all submissions from the user-id //
	find: async function(req, res){
		
		const db = await mongo

		const response = await db.collection(SUBMISSION).find({user: new db.ObjectId(req.query['_id'])}).sort({_id: -1}).toArray()
		res.json(response[0])
	},

	// create a new submission and calculate the score //
	create: async function(req, res){

		const db = await mongo
		let submission = Object.assign({}, req.body)

		// Calculate the score // 
		const game = await db.collection(GAME).findOne({})
		let results = utils.getScore(submission, game.questions, game.max_score)
		submission = Object.assign({}, {results: results}, submission)

		// Important step //
		await validate(SUBMISSION, submission)

		const response = await db.collection(SUBMISSION).insertOne(submission)
		res.json({_id: response.insertedId})
	}
}
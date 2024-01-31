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

		const response = await db.collection(SUBMISSION).find({user: new db.ObjectId(req.query['_id']), completed: true}).sort({_id: -1}).toArray()

		if(response.length > 1){
			// console.log("OLD", response[response.length-1]['results'])
			response[0]['oldResults'] = response[response.length-1]['results']
		}
		res.json(response[0])
	},

	// create a new submission, used to get the ID for future references //
	create: async function(req, res){

		const db = await mongo
		let submission = Object.assign({}, req.body, { completed: false })

		// Important step //
		await validate(SUBMISSION, submission)
		submission['createdAt'] = new Date()

		const response = await db.collection(SUBMISSION).insertOne(submission)
		res.json({_id: response.insertedId})
	},

	// update the submission with new answers if it is not yet completed //
	update: async function(req, res){

		const db = await mongo
		let submission = await db.collection(SUBMISSION).findOne({user: new db.ObjectId(req.body.user), _id: new db.ObjectId(req.body._id)})

		// console.log(submission)
		// console.log(req.body)

		if(submission && !submission.completed){
			let answers = Object.assign({}, {...submission.answers}, {...req.body.answers})

			const response = await db.collection(SUBMISSION).updateOne({_id: new db.ObjectId(req.body._id)}, {$set: {answers: answers}})
			res.json(response)
		}
		else{
			res.status(400).send({message: 'Submission not found OR it is completed!'});
		}
	},

	// finish the submission and calculate the score //
	finish: async function(req, res){

		const db = await mongo

		let submission = await db.collection(SUBMISSION).findOne({user: new db.ObjectId(req.body.user), _id: new db.ObjectId(req.body._id)})

		// Calculate the score //
		if(submission && !submission.completed){
			const game = await db.collection(GAME).findOne({})
			let results = utils.getScore(submission, game.questions, game.feedback, game.images_feedback, game.max_score, game.standardization_factor)
			submission = Object.assign({}, {...submission}, {...results}, {completed: true})

			await db.collection(SUBMISSION).updateOne({_id: new db.ObjectId(req.body._id)}, {$set: submission})
			res.json(submission)
		}
		else{
			res.status(400).send({message: 'Submission not found OR it is completed!'});
		}

		// load the LLM response async //
		if(submission && !submission.llmResponse){
			let prompt = submission.prompt

			for(var i=0; i<2; i++){
				let response = await utils.getLLMResponse(prompt)
				if(response.split("\"").includes("errors")){
					console.log("Failed to get LLM response", i, response)
					response = await utils.getLLMResponse(prompt)
				}
				else{
					console.log("Got LLM Response at:", i)
					submission = Object.assign({}, {...submission}, {llmResponse: response})
					await db.collection(SUBMISSION).updateOne({_id: new db.ObjectId(req.body._id)}, {$set: submission})
					break;
				}
			}
		}
	},
}
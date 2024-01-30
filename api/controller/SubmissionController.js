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

		const response = await db.collection(SUBMISSION).find({_id: new db.ObjectId(req.query['_id'])}).sort({_id: -1}).toArray()
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
			let results = utils.getScore(submission, game.questions, game.feedback, game.max_score, game.standardization_factor)
			submission = Object.assign({}, {...submission}, {...results}, {completed: true})

			await db.collection(SUBMISSION).updateOne({_id: new db.ObjectId(req.body._id)}, {$set: submission})
			res.json(submission)
		}
		else{
			res.status(400).send({message: 'Submission not found OR it is completed!'});
		}
	},

	getLLMResponse: async function(req, res){

		const db = await mongo

		let submission = await db.collection(SUBMISSION).findOne({user: new db.ObjectId(req.body.user), _id: new db.ObjectId(req.body._id)})

		// Calculate the score //
		if(submission && !submission.llmResponse){
			let prompt = submission.prompt

			const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/${process.env.CF_MODEL}`,
				{
					method: "POST",
					headers: { 'Authorization': `Bearer ${process.env.CF_API_KEY}` },
					body: JSON.stringify({
						"messages": [
							{"role":"system","content": "I want you to act as an happiness coach. Your goal is to provide short responses on how to improve my overall happiness levels. I am conducting a survey and each question deals with understanding the lifestyle of the respondant. I will provide the question along with the respondant's answer, your job is to give super short advices that can improve the overall happiness levels. Don't be rude and judgemental. Be very polite. \n\n"},
							{"role":"user","content": prompt}
						]
					})
				});
			const json = await response.json();

			submission = Object.assign({}, {...submission}, {llmResponse: json.result.response})
			await db.collection(SUBMISSION).updateOne({_id: new db.ObjectId(req.body._id)}, {$set: submission})
			res.json({ llmResponse: json.result.response })
		}
		else {
			res.json({llmResponse: submission.llmResponse})
		}
	},
}
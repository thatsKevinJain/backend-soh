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

		let response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/${process.env.CF_MODEL}`,
			{
				method: "POST",
				headers: { 'Authorization': `Bearer ${process.env.CF_API_KEY}` },
				body: JSON.stringify({
					"stream": true,
					"messages": [
						{"role":"system","content": "Act as an happiness coach. There are questions and answers, based on the answers, give advices to improve happiness. Try to summarize, don't repeat any phrases and stick to advices only. Don't say \'to improve your happiness\'\n\n"},
						{"role":"user","content": prompt}
					]
				})
			}).then((response) => response.body)
			  .then((body) => {
			    let reader = body.getReader()
				
				return new ReadableStream({
			      start(controller) {
			        return pump();

			        function pump() {
			          return reader.read().then(({ done, value }) => {

			            // When no more data needs to be consumed, close the stream
			            if (done) {
			              controller.close();
			              return;
			            }
			            controller.enqueue(value);
			            return pump();
			          });
			        }
			      },
			    });
			  })
			  .then((stream) => new Response(stream))
			  .then((response) => response.blob())
			  .then((blob) => blob.text())
			response = response.trim().split("data: [DONE]").join("").split("data: {\"response\":\"").join("").split("\"}\n\n").join("").trim()

			submission = Object.assign({}, {...submission}, {llmResponse: response})
			await db.collection(SUBMISSION).updateOne({_id: new db.ObjectId(req.body._id)}, {$set: submission})
			res.json({ llmResponse: response })
		}
		else {
			res.json({llmResponse: submission.llmResponse})
		}
	},
}
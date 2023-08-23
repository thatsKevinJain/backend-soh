// Collection Name //
const GAME = 'game'
const DEMOGRAPHIC = 'demographic'

const mongo = require("../../driver/mongoDriver")

module.exports = {

	getGame: async function(req, res){
		
		const db = await mongo

		const response = await db.collection(GAME).findOne({})

		const question = response.questions[req.query['i']]
		const length = response.questions.length

		res.json({ question, length })
	},

	getDemographic: async function(req, res){
		
		const db = await mongo

		const response = await db.collection(DEMOGRAPHIC).findOne({})
		res.json(response)
	}
}
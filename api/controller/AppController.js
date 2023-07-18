// Collection Name //
const GAME = 'game'
const DEMOGRAPHIC = 'demographic'

const mongo = require("../../driver/mongoDriver")

module.exports = {

	getGame: async function(req, res){
		
		const db = await mongo

		const response = await db.collection(GAME).findOne({})
		res.json(response)
	},

	getDemographic: async function(req, res){
		
		const db = await mongo

		const response = await db.collection(DEMOGRAPHIC).findOne({})
		res.json(response)
	}
}
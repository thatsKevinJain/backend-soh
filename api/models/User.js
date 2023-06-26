// Define each model here //
// Follow AJV guidelines for adding a schema //
module.exports = {
	schema: {
		type: 'object',
		dynamicDefaults: {
			createdAt: "datetime",
			updatedAt: "datetime"
		},
		properties: {
			email:{
				type: "string"
			},
			createdAt: {
				format: "date-time",
				type: "string"
			},
			updatedAt: {
				format: "date-time",
				type: "string"
			},
			answers: {
				type: 'object'
			},
			demographic: {
				type: 'object'
			}
		},
		required: ["email"],
		additionalProperties: false
	}
}
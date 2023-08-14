// Define each model here //
// Follow AJV guidelines for adding a schema //
module.exports = {
	schema: {
		type: 'object',
		dynamicDefaults: {
			createdAt: "datetime"
		},
		properties: {
			user: {
				convertToObjectId: true
			},
			createdAt: {
				format: "date-time",
				type: "string"
			},
			answers: {
				type: 'object'
			},
			results: {
				type: 'object'
			},
			scores: {
				type: 'object'
			},
			avg_scores: {
				type: 'object'
			},
			feedback: {
				type: 'string'
			}
		},
		required: ["user"],
		additionalProperties: false
	}
}
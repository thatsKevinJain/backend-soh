// Define each model here //
// Follow AJV guidelines for adding a schema //
module.exports = {
	schema: {
		type: 'object',
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
			},
			completed: {
				type: 'boolean'
			},
			prompt: {
				type: 'string'
			},
			llmResponse: {
				type: 'string'
			}
		},
		required: ["user"],
		additionalProperties: false
	}
}
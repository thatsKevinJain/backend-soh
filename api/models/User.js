// Define each model here //
// Follow AJV guidelines for adding a schema //
module.exports = {
	schema: {
		type: 'object',
		properties: {
			_id: {
				type: "string"
			},
			email:{
				type: "string"
			},
			name:{
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
			demographic: {
				type: 'object'
			}
		},
		additionalProperties: false
	}
}
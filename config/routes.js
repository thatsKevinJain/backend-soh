module.exports = {

	/*
		Model name and its allowed API actions methods are added here
		
		"method": ['get', 'put', 'post'...]		--- Allowed API methods for routes
		"auth": true/false						--- Boolean to protect a route with JWT auth
	*/

	User: {
		find: {
			method: ['get']
		},
		create: {
			method: ['post']
		}
	}
}
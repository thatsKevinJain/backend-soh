
const utils = {
	
	// Calculate score as per game logic //
	getScore: function(submission, questions, max_score){

		// Calculate the total number of questions //
		const N = questions.length
		console.log("N", N)

		// Calculate the total weight of all questions combined //
		const TOTAL_WEIGHT = questions.reduce((total_weight, question, index, questions) => {

			// Single Question //
			if(!question.multiple){
				total_weight += question.weight ? question.weight : 0
			}

			// Multiple questions //
			else{
				total_weight += question.weight ? (question.weight*question.questions.length) : 0
			}

			return total_weight
		}, 0)
		console.log("TOTAL_WEIGHT", TOTAL_WEIGHT)

		// Calculate effective weight of one question //
		// Math.floor() is used to make sure we never reach "max_score", this is *intentional*  //
		const W = Math.floor(max_score / TOTAL_WEIGHT)
		console.log("W", W)

		// Score //
		const SCORE = questions.reduce((total_score, question, index, questions) => {

			// Single Question //
			if(!question.multiple) {
				total_score += question.options.reduce((score, option) => {

					// Capture the selection made by the user for the particular question //
					const selection = submission.answers[question.id.toString()]

					// Calculate the effective score if the selection matches the current option //
					if(selection === option.id){
						score += (option.score * question.weight)
						console.log("SINGLE", option.score * question.weight)
					}
					else{
						score += 0
					}
					return score
				}, 0)
				return total_score
			}

			// Multiple Questions //
			// Iterate through each question and each option, multiply the score, sign and weight //
			else {

				total_score += question.questions.reduce((score, q, i) => {

					score += question.options.reduce((s, o, j) => {
						// Capture the selection made by the user for the particular question //
						const selection = submission.answers[question.id.toString() + "-" + (i+1).toString()]

						// Calculate the effective score //
						if(selection === o.id){
							s += (o.score * question.weight * q.sign)
							console.log("MUTLIPLE", (o.score * question.weight * q.sign))
						}
						else{
							s += 0
						}
						return s
					}, 0)
					return score
				}, 0)
				return total_score
			}
		}, 0)
		return {
			score: SCORE,
			max_score: max_score,
			total_weight: TOTAL_WEIGHT,
			effective_weight: W,
			effective_score: SCORE*W
		};
	}
}

module.exports = utils
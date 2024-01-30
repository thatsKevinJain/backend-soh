
function getAverage(id, scores){
	let count = 0
	let total = 0
	for(const key in scores){
		if(key.split("-")[0] === id){
			count += 1
			total += scores[key]
		}
	}
	return (total/count)
}

const utils = {
	
	// Calculate score as per game logic //
	getScore: function(submission, questions, feedback, max_score, standardization_factor){

		// Calculate the total number of questions //
		const N = questions.length
		// console.log("N", N)

		// Calculate the total weight of all questions combined //
		const TOTAL_WEIGHT = questions.reduce((total_weight, question) => {

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
		// console.log("TOTAL_WEIGHT", TOTAL_WEIGHT)

		// Calculate effective weight of one question //
		// Math.floor() is used to make sure we never reach "max_score", this is *intentional*  //
		const W = Math.floor(max_score / TOTAL_WEIGHT)
		// console.log("W", W)

		// SCORES array --> this holds the standardized scores for each question //
		const scores = {}

		/*
			Calculate SCORE
		*/
		const SCORE = questions.reduce((total_score, question) => {


			// Format TEXT //
			if(question.format === "text"){

				// Single Question //
				if(!question.multiple) {

					// Get the question ID //
					const id = question.id.toString()

					// Capture the selection made by the user for the particular question //
					const selection = submission.answers[id]

					if(question.options && question.options.length > 0){
						total_score += question.options.reduce((score, option) => {

							// Calculate the effective score if the selection matches the current option //
							if(selection === option.id){
								score += (option.score * question.weight)
							}
							else{
								score += 0
							}

							// Score standardization //
							scores[id] = (score * standardization_factor)

							return score
						}, 0)
					}
					else{
						var score =  ((selection * question.weight) / question.max)
						total_score += score
						scores[id] = (score * standardization_factor)
					}
					
					return total_score
				}

				// Multiple Questions //
				// Iterate through each question and each option, multiply the score, sign and weight //
				else {

					total_score += question.questions.reduce((score, q, i) => {

						// Ger the question ID //
						const id = question.id.toString() + "-" + (i+1).toString()

						// Capture the selection made by the user for the particular question //
						const selection = submission.answers[id]

						if(question.options && question.options.length > 0){

							score += question.options.reduce((s, o, j) => {

								// Calculate the effective score //
								if(selection === o.id){
									/*
										We apply the score based on their SIGN value
										+1 means take the score AS IS
										-1 means apply reverse code, here we flip the score by reducing it from 1.25
									*/
									if(q.sign > 0)
										s += (o.score * question.weight)
									else
										s += ((1.25-o.score) * question.weight)
								}
								else{
									s += 0
								}
								// Score standardization //
								scores[id] = (s*standardization_factor)

								return s
							}, 0)
						}
						else{
							var s =  ((selection * question.weight) / question.max)
							score += s ? s : 0
							scores[id] = ((s ? s : 0) * standardization_factor)
						}

						return score
					}, 0)
					return total_score
				}
			}

			// Format IMAGES //
			if(question.format === "image"){
				// Ger the question ID //
				const id = question.id.toString()

				// Capture the selection made by the user for the particular question //
				const selections = (submission.answers[id]).split(",")
				
				// Maximum score allowed by this question //
				let max = 0

				var score = question.options.reduce((s, option, i) => {

					// We do this to be able to standardize score later //
					max += option.score

					// Calculate the effective score //
					if(selections.indexOf(option.id.toString()) > -1){
						s += (option.score * question.weight)
					}
					else{
						s += 0
					}
					return s
				}, 0)

				// Score standardization //
				scores[id] = ((score * standardization_factor) / max)

				total_score += score
				return total_score
			}

		}, 0)

		/*
			Calculate average score & fetch suggestion prompts based on scores
		*/
		var avg_scores = {}

		questions.forEach((question) => {
			const id = question.id.toString()

			let average = getAverage(id, scores)
			let group = Math.ceil(average)

			avg_scores[id] = average
		})

		var standardized_score = parseFloat(((SCORE*standardization_factor)/TOTAL_WEIGHT).toFixed(2))

		var feedback = feedback.reduce((f, o, i) => {
			var prev = feedback[i-1] ? feedback[i-1].value : 0
			var curr = o.value
			if(standardized_score >= prev && standardized_score <= curr){
				f += o.text
			}
			return f
		}, "").trim()

		//////////////////////////////
		// Generate Prompt for LLMs //
		//////////////////////////////

		// Base Prompt //
		let prompt = ""

		// Append all answers to selected questions to the prompt //
		let allowedQ = [1, 2, 3, 4, 5, 6]

		for(let q of questions){

			if(allowedQ.indexOf(q.id) > -1){
				if(q.multiple){
					prompt += q.id + ". " + q.title + "\n"

					if(q.questions && q.options){
						for(let ques of q.questions){
							for(let opts of q.options){
								if(opts.id == submission.answers[`${q.id}-${ques.id}`])
									prompt += `${q.id}-${ques.id}. ${ques.q}: ${opts.option} \n`
							}
						}
					}
				}
				else{
					if(q.type == "radio" || q.type == "checkbox")
					{
						if(q.format == "text"){
							for(let opt of q.options){
								if(opt.id == submission.answers[q.id.toString()])
									prompt += `${q.id}. ${q.question}: ${opt.option} \n`
							}
						}
					}
				}
			}
		}

		return {
			results: {
				// Total sum ==> (s1*w1 + s2*w2 + ... + sn*wn)
				score: SCORE,

				// Max score a user can get, this is set in the questionaire itself //
				max_score: max_score,

				// Sum of all weights of all questions (w1 + w2 + ... + wn) //
				total_weight: TOTAL_WEIGHT,

				// Value of ONE unit weight ==> (MAX_SCORE/TOTAL_WEIGHT)
				effective_weight: W,

				// Score that the user will see (FROM 0 --> MAX_SCORE) //
				effective_score: parseInt(Math.floor(SCORE*W)),

				// Score that we want to see (FROM 0 --> 4) //
				standardized_score: standardized_score
			},
			scores: scores,
			avg_scores: avg_scores,
			feedback: feedback,
			prompt: prompt
		};
	}
}

module.exports = utils
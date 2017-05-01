const User = require('./models/User')
const email = require('./local.js').email
const devEnv = process.env.NODE_ENV === 'dev'

function init(mongoose) {

	const nev = require('email-verification')(mongoose)
	const domain = devEnv ? 'http://localhost:5000/email-verification/' : 'https://pixelscape.herokuapp.com/'

	nev.configure({
		verificationURL: domain + '${URL}',
		persistentUserModel: User,
		tempUserCollection: 'unverified_users',
		shouldSendConfirmation: false,
		transportOptions: {
			service: email.service,
			auth: {
				user: email.user,
				pass: email.pass
			}
		},
		verifyMailOptions: {
			from: email.from,
			subject: 'PixelScape - Confirm account',
			html: 'Please click the following link to confirm your account:</p><p>${URL}</p>',
			text: 'Please confirm your account by clicking the following link: ${URL}'
		}
	}, function(error, options) {})

	nev.generateTempUserModel(User, function(err, options) {})

	return nev

}

module.exports = init

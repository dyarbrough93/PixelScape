const User = require('./models/User')
const devEnv = process.env.NODE_ENV === 'dev'

function init(mongoose) {

	const nev = require('email-verification')(mongoose)
	//const domain = devEnv ? 'http://localhost:5000/email-verification/' : 'https://pixelscape.herokuapp.com/'

	const domain = 'http://localhost:5000/email-verification/'

	nev.configure({
		verificationURL: domain + '${URL}',
		persistentUserModel: User,
		tempUserCollection: 'unverified_users',
		shouldSendConfirmation: false,
		transportOptions: {
			service: process.env.EMAIL_SERVICE,
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS
			}
		},
		verifyMailOptions: {
			from: 'Do Not Reply <no.reply.pixelscape@gmail.com>',
			subject: 'PixelScape - Confirm account',
			html: 'Please click the following link to confirm your account:</p><p>${URL}</p>',
			text: 'Please confirm your account by clicking the following link: ${URL}'
		}
	}, function(error, options) {})

	nev.generateTempUserModel(User, function(err, options) {})

	return nev

}

module.exports = init

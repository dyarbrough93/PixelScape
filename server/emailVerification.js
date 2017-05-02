const User = require('./models/User')

function init(mongoose, port, devEnv) {

	let local
	if (devEnv) local = require('./local.js')

	const nev = require('email-verification')(mongoose)
	const domain = devEnv ? 'http://localhost:' + port : process.env.SITE_URL

	const fromStr = 'Do Not Reply <' + (devEnv ? local.email.user : process.env.EMAIL_USER) + '@' + (devEnv ? local.email.service : process.env.EMAIL_SERVICE) + '.com>'

	nev.configure({
		verificationURL: domain + '/email-verification/${URL}',
		persistentUserModel: User,
		tempUserCollection: 'unverified_users',
		shouldSendConfirmation: false,
		transportOptions: {
			service: devEnv ? local.email.service : process.env.EMAIL_SERVICE,
			auth: {
				user: devEnv ? local.email.user : process.env.EMAIL_USER,
				pass: devEnv ? local.email.pass : process.env.EMAIL_PASS
			}
		},
		verifyMailOptions: {
			from: fromStr,
			subject: 'PixelScape - Confirm account',
			html: 'Please click the following link to confirm your account:</p><p>${URL}</p>',
			text: 'Please confirm your account by clicking the following link: ${URL}'
		}
	}, function(error, options) {})

	nev.generateTempUserModel(User, function(err, options) {})

	return nev

}

module.exports = init

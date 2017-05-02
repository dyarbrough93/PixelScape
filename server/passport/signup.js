const formConfig = require('../config.js').server.loginForm
const LocalStrategy = require('passport-local').Strategy
const bCrypt = require('bcrypt-nodejs')
const User = require('../models/User.js')

module.exports = function(passport, nev) {

	passport.use('signup', new LocalStrategy({
			passReqToCallback: true // allows us to pass back the entire request to the callback
		},
		function(req, username, password, done) {

			let res = preDbValidation(req, username, password)
			if (res.failure) return done(null, false, req.flash('message', res.message))

			findOrCreateUser = function() {
				// find a user in Mongo with provided username
				User.findOne({
					'username': username
				}, function(err, user) {
					// In case of any error, return using the done method
					if (err) {
						console.log('Error in SignUp: ' + err)
						return done(err)
					}
					// already exists
					if (user) {
						console.log('User already exists with username: ' + username)
						return done(null, false, req.flash('message', 'User Already Exists'))
					} else {
						// if there is no user with that email
						// create the user
						let newUser = new User({
                            username: username,
                            password: createHash(password),
                            email: req.body.email,
                            firstName: req.body.firstName,
                            lastName: req.body.lastName
                        })

						nev.createTempUser(newUser, function(err, existingPersistentUser, newTempUser) {

							if (err) {
								console.log(err)
								return done(null, false, req.flash('message', err))
							}

							// user already exists in persistent collection...
							if (existingPersistentUser) {
								console.log('user already exists')
								return done(null, false, req.flash('message', 'Already registered! Please check your email for a verification code.'))
							}

							// a new user
							if (newTempUser) {
								let URL = newTempUser[nev.options.URLFieldName]
								nev.sendVerificationEmail(newTempUser.email, URL, function(err, info) {
									if (err) {
										console.log(err)
										return done(null, false)
									}
									console.log('Email sent to ' + newUser.email)
                                    return done(null, newUser)
								})

							// user already exists in temporary collection...
							} else {
								console.log('Already signed up!')
								return done(null, false, req.flash('message', 'There is already an account with this email.'))
							}
						})
					}
				})
			}
			// Delay the execution of findOrCreateUser and execute the method
			// in the next tick of the event loop
			process.nextTick(findOrCreateUser)
		}))
}

// Generates hash using bCrypt
function createHash(password) {
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null)
}

function preDbValidation(req, username, password) {

	// first name
	let fName = req.body.firstName
	if (!fName || fName.length > formConfig.lowMaxLength)
		return {
			failure: true,
			message: 'First name must use only letters and be less than ' + formConfig.lowMaxLength + ' characters.'
		}

	// last name
	let lName = req.body.lastName
	if (!lName || lName.length > formConfig.lowMaxLength)
		return {
			failure: true,
			message: 'Last name must use only letters and be less than ' + formConfig.lowMaxLength + ' characters.'
		}

	// username
	let res = /[\w]+/.exec(username)
	if (!res || res[0].length !== username.length || username.length > formConfig.lowMaxLength)
		return {
			failure: true,
			message: 'Username must use only letters, numbers, and underscores and be less than ' + formConfig.lowMaxLength + ' characters.'
		}

	// password
	if (password.length < formConfig.minLength || password.length > formConfig.lowMaxLength)
		return {
			failure: true,
			message: 'Password must be between ' + formConfig.minLength + ' and ' + formConfig.lowMaxLength + ' characters.'
		}

	// email
	res = /@[\w-\.]+/.exec(req.body.email)
	if (!res || domains.indexOf(res[0].substring(1)) === -1)
		return {
			failure: true,
			message: 'Please use a real email address.'
		}

	return {
		failure: false
	}

}

let domains = [
	/* Default domains included */
	"aol.com", "att.net", "comcast.net", "facebook.com", "gmail.com", "gmx.com", "googlemail.com",
	"google.com", "hotmail.com", "hotmail.co.uk", "mac.com", "me.com", "mail.com", "msn.com",
	"live.com", "sbcglobal.net", "verizon.net", "yahoo.com", "yahoo.co.uk",

	/* Other global domains */
	"email.com", "games.com" /* AOL */ , "gmx.net", "hush.com", "hushmail.com", "icloud.com", "inbox.com",
	"lavabit.com", "love.com" /* AOL */ , "outlook.com", "pobox.com", "rocketmail.com" /* Yahoo */ ,
	"safe-mail.net", "wow.com" /* AOL */ , "ygm.com" /* AOL */ , "ymail.com" /* Yahoo */ , "zoho.com", "fastmail.fm",
	"yandex.com", "iname.com",

	/* United States ISP domains */
	"bellsouth.net", "charter.net", "comcast.net", "cox.net", "earthlink.net", "juno.com",

	/* British ISP domains */
	"btinternet.com", "virginmedia.com", "blueyonder.co.uk", "freeserve.co.uk", "live.co.uk",
	"ntlworld.com", "o2.co.uk", "orange.net", "sky.com", "talktalk.co.uk", "tiscali.co.uk",
	"virgin.net", "wanadoo.co.uk", "bt.com",

	/* Domains used in Asia */
	"sina.com", "qq.com", "naver.com", "hanmail.net", "daum.net", "nate.com", "yahoo.co.jp", "yahoo.co.kr", "yahoo.co.id", "yahoo.co.in", "yahoo.com.sg", "yahoo.com.ph",

	/* French ISP domains */
	"hotmail.fr", "live.fr", "laposte.net", "yahoo.fr", "wanadoo.fr", "orange.fr", "gmx.fr", "sfr.fr", "neuf.fr", "free.fr",

	/* German ISP domains */
	"gmx.de", "hotmail.de", "live.de", "online.de", "t-online.de" /* T-Mobile */ , "web.de", "yahoo.de",

	/* Russian ISP domains */
	"mail.ru", "rambler.ru", "yandex.ru", "ya.ru", "list.ru",

	/* Belgian ISP domains */
	"hotmail.be", "live.be", "skynet.be", "voo.be", "tvcablenet.be", "telenet.be",

	/* Argentinian ISP domains */
	"hotmail.com.ar", "live.com.ar", "yahoo.com.ar", "fibertel.com.ar", "speedy.com.ar", "arnet.com.ar",

	/* Domains used in Mexico */
	"hotmail.com", "gmail.com", "yahoo.com.mx", "live.com.mx", "yahoo.com", "hotmail.es", "live.com", "hotmail.com.mx", "prodigy.net.mx", "msn.com",

	/* Domains used in Brazil */
	"yahoo.com.br", "hotmail.com.br", "outlook.com.br", "uol.com.br", "bol.com.br", "terra.com.br", "ig.com.br", "itelefonica.com.br", "r7.com", "zipmail.com.br", "globo.com", "globomail.com", "oi.com.br"
];

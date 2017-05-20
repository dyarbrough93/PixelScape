const config = require('./config.js').server
const express = require('express')
const router = express.Router()

let isAuthenticated = function(req, res, next) {

	if (req.isAuthenticated()) {
		return next()
    }
	res.redirect('/guest')

}

module.exports = function(passport, devEnv, local) {

	router.get('/guest', function(req, res) {
		req.logout()
		res.render('game', {
			user: req.user,
			dev: devEnv,
			loginFormData: req.session.loginFormData,
      		signupFormData: req.session.signupFormData,
			showSignup: req.session.showSignup ? true : false,
			showLogin: req.session.showLogin ? true : false
		})

		req.session.showSignup = false
		req.session.showLogin = false
	})

	router.get('/signout', function(req, res) {
		req.logout()
		req.session.loginFormData = null
		req.session.signupFormData = null
		res.redirect('/')
	})

	router.get('/archive', function(req, res) {

		res.render('archive', {
			dev: devEnv
		})

	})

	router.get('/', isAuthenticated, function(req, res) {

		req.session.loginFormData = {}
		req.session.signupFormData = null

		const adminUName = local ? local.adminUName : process.env.ADMIN_UNAME
		const admin = req.user.username === adminUName

		res.render('game', {
			user: req.user,
			dev: devEnv,
			admin: admin,
			loginFormData: req.session.loginFormData,
      		signupFormData: req.session.signupFormData,
			showSignup: req.session.showSignup ? true : false,
			showLogin: req.session.showLogin ? true : false
		})

		req.session.showSignup = false
		req.session.showLogin = false
	})

	router.post('/login', function(req, res, next) {

		req.session.loginFormData = {}
		req.session.signupFormData = null

		for (let attr in req.body) {
			req.session.loginFormData[attr] = req.body[attr]
		}

		const errors = require('./errors.js').login

		passport.authenticate('login', function(err, user, info) {

			if (err) {
				if (err.name === errors.E_USERNOTFOUND.name ||
					err.name === errors.E_BADCRED.name) {
					return res.status(400).send(err)
				} else {
					return res.status(500).send(err)
				}
			}
			if (!user) {
				return res.status(400).send(errors.E_USERNOTFOUND())
			}

			req.logIn(user, function(err) {
				if (err) return next(err)
				return res.status(200).send()
			})

		})(req, res, next)

	})

	router.post('/signup', function(req, res, next) {

		req.session.signupFormData = {}
		req.session.loginFormData = null

		for (let attr in req.body) {
			req.session.signupFormData[attr] = req.body[attr]
		}

		const errors = require('./errors.js').signup

		passport.authenticate('signup', function(err, user, info) {

			if (err) {
				if (err.name === errors.E_USEREXISTS.name)
					return res.status(400).send(err)
				else
					return res.status(500).send(err)
			}

			req.logIn(user, function(err) {
				if (err) return next(err)
				return res.redirect('/')
			})

		})(req, res, next)
	})

	return router
}

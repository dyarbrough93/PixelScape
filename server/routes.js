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

		passport.authenticate('login', function(err, user, info) {

			if (err) {
				console.log(err)
				return res.redirect('/')
			}
			if (!user) {
				req.session.showLogin = true
				return res.redirect('/')
			}

			req.logIn(user, function(err) {
				if (err) return next(err)
				req.session.showLogin = false
				return res.redirect('/')
			})

		})(req, res, next)

	})

	router.post('/signup', function(req, res, next) {

		req.session.signupFormData = {}
		req.session.loginFormData = null

		for (let attr in req.body) {
			req.session.signupFormData[attr] = req.body[attr]
		}

		passport.authenticate('signup', function(err, user, info) {

			if (err) return next(err)
			if (!user) {
				req.session.showSignup = true
				return res.redirect('/')
			}

			req.logIn(user, function(err) {
				if (err) return next(err)
				req.session.showSignup = false
				return res.redirect('/')
			})

		})(req, res, next)
	})

	return router
}

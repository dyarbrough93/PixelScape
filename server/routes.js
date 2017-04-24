const express = require('express')
const router = express.Router()

var isAuthenticated = function(req, res, next) {

    if (process.env.USE_LOGIN === 'y') {

        if (req.isAuthenticated())
            return next()
        res.redirect('/login')

    } else return next()

}

const dev = process.env.NODE_ENV === 'dev'

module.exports = function(passport) {

    router.get('/login', function(req, res) {

        res.render('login', {
            dev: dev,
            loginFormData: req.session.loginFormData,
            signupFormData: req.session.signupFormData
        })
    })

    router.get('/guest', function(req, res) {
        req.logout()
        res.render('game')
    })

    router.get('/signout', function(req, res) {
        req.logout()
        req.session.loginFormData = null
        req.session.signupFormData = null
        res.redirect('/login')
    })

    router.get('/', isAuthenticated, function(req, res) {

        res.render('game', {
            user: req.user,
            dev: dev
        })
    })

    router.post('/login', function(req, res, next) {

        req.session.loginFormData = {}
        req.session.signupFormData = null

        for (var attr in req.body) {
            req.session.loginFormData[attr] = req.body[attr]
        }

        passport.authenticate('login', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true
        })(req, res, next)
    })

    router.post('/signup', function(req, res, next) {

        req.session.signupFormData = {}
        req.session.loginFormData = null

        for (var attr in req.body) {
            req.session.signupFormData[attr] = req.body[attr]
        }

        passport.authenticate('signup', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true
        })(req, res, next)
    })

    return router
}

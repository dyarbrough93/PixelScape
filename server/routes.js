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
            dev: dev
        })
    })

    router.get('/guest', function(req, res) {
        res.render('game')
    })

    router.get('/signout', function(req, res) {
        req.logout()
        res.redirect('/login')
    })

    router.get('/', isAuthenticated, function(req, res) {

        res.render('game', {
            user: req.user,
            dev: dev
        })
    })

    router.post('/login', passport.authenticate('login', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }))

    router.post('/signup', passport.authenticate('signup', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }))

    return router
}

const express = require('express')
const router = express.Router()

var isAuthenticated = function(req, res, next) {
    if (req.isAuthenticated())
        return next()
    res.redirect('/')
}

module.exports = function(passport) {

    /* GET login page. */
    router.get('/', function(req, res) {
        // Display the Login page with any flash message, if any
        res.render('login', {
            layout: false
        })
    })

    /*router.post('/login', function(req, res) {
        req.flash('info', 'test')
        res.render('/')
    })*/

    /* Handle Login POST */
    router.post('/login', passport.authenticate('login', {
        successRedirect: '/game',
        failureRedirect: '/',
        failureFlash: true
    }))

    /* Handle Registration POST */
    router.post('/signup', passport.authenticate('signup', {
        successRedirect: '/game',
        failureRedirect: '/',
        failureFlash: true
    }))

    /* Handle Logout */
    router.get('/signout', function(req, res) {
        req.logout()
        res.redirect('/')
    })

    /* GET Home Page */
    router.get('/game', isAuthenticated, function(req, res) {
        res.render('game', {
            user: req.user
        })
    })

    return router
}

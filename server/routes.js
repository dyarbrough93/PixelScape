const express = require('express')
const router = express.Router()

var isAuthenticated = function(req, res, next) {

    if (process.env.USE_LOGIN === 'y') {

        if (req.isAuthenticated())
            return next()
        res.redirect('/login')

    } else return next()

}

module.exports = function(passport) {

    /* GET login page. */
    router.get('/login', function(req, res) {
        // Display the Login page with any flash message, if any
        res.render('login', {
            layout: false
        })
    })

    /* Handle Login POST */
    router.post('/login', passport.authenticate('login', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }))

    /* Handle Registration POST */
    router.post('/signup', passport.authenticate('signup', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }))

    /* Handle Logout */
    router.get('/signout', function(req, res) {
        req.logout()
        res.redirect('/login')
    })

    /* GET Home Page */
    router.get('/', isAuthenticated, function(req, res) {

        res.render('game', {
            user: req.user
        })
    })

    return router
}

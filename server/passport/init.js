const login = require('./login.js')
const signup = require('./signup.js')
const User = require('../models/User.js')

module.exports = function(passport){

	// Passport needs to be able to serialize and deserialize users to support persistent login sessions
    passport.serializeUser(function(user, done) {
        console.log('serializing user: ', user.username)
        done(null, user._id)
    })

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            //console.log('deserializing user: ', user.username)
            done(err, user)
        })
    })

    // Setting up Passport Strategies for Login and SignUp/Registration
    login(passport)
    signup(passport)

}

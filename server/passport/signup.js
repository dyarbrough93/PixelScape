const formConfig = require('../config.js').server.loginForm
const LocalStrategy = require('passport-local').Strategy
const bCrypt = require('bcrypt-nodejs')
const errors = require('../errors.js').signup
const User = require('../models/User.js')

module.exports = function(passport) {

    passport.use('signup', new LocalStrategy({
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {

            let valErr = preDbValidation(req, username, password)
            if (valErr) return done(valErr, false)

            findOrCreateUser = function() {
                // find a user in Mongo with provided username
                User.findOne({
                    'username': username
                }, function(err, user) {
                    // In case of any error, return using the done method
                    if (err)
                        return done(err)

                    // already exists
                    if (user) {
                        return done(errors.E_USEREXISTS, false)
                    } else {

                        // if there is no user with that username
                        // create the user
                        let newUser = new User({
							username: username,
							password: createHash(password),
                            active: true
						})

                        // save the user
                        newUser.save(function(err) {
                            if (err) return done(err)

                            console.log('User \'' + username + '\' successfully registered.')
                            return done(null, newUser)
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

    // username
    var res = /[\w]+/.exec(username)
    if (!res || res[0].length !== username.length || username.length > formConfig.lowMaxLength)
        return errors.E_INVALIDUNAME

    // password
    if (password.length < formConfig.minLength || password.length > formConfig.lowMaxLength)
        return errors.E_INVALIDPASSWORD

    return null

}

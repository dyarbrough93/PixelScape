const formConfig = require('../config.js').server.loginForm
const LocalStrategy = require('passport-local').Strategy
const bCrypt = require('bcrypt-nodejs')
const User = require('../models/User.js')

module.exports = function(passport) {

    passport.use('signup', new LocalStrategy({
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {

            var res = preDbValidation(req, username, password)
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
                        return done(null, false, req.flash('message', 'User already exists'))
                    } else {
                        // if there is no user with that username
                        // create the user
                        var newUser = new User({
							username: username,
							password: createHash(password)
						})

                        // save the user
                        newUser.save(function(err) {
                            if (err) {
                                console.log('Error in Saving user: ' + err)
                                throw err
                            }
                            console.log('User registration succesful')
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
        return { failure: true, message: 'Username must use only letters, numbers, and underscores and be less than ' + formConfig.lowMaxLength + ' characters.' }

    // password
    if (password.length < formConfig.minLength || password.length > formConfig.lowMaxLength)
        return { failure: true, message: 'Password must be between ' + formConfig.minLength + ' and ' + formConfig.lowMaxLength + ' characters.' }

    return { failure: false }

}

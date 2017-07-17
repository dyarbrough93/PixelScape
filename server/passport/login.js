const LocalStrategy   = require('passport-local').Strategy
const User = require('../models//User')
const bCrypt = require('bcrypt-nodejs')
const errors = require('../errors.js').login

let isValidPassword = function(user, password){
	return bCrypt.compareSync(password, user.password)
}

module.exports = function(passport){

	passport.use('login', new LocalStrategy({
            passReqToCallback : true
        },
        function(req, username, password, done) {

            // check in mongo if a user with username exists or not
            User.findOne({ username: username },
                function(err, user) {
                    // In case of any error, return using the done method
                    if (err)
                        return done(err)

                    // Username does not exist
                    if (!user) {
                        return done(errors.E_USERNOTFOUND, false)
                    }
                    // User exists but wrong password
                    if (!isValidPassword(user, password)) {
                        return done(errors.E_BADCRED, false) // redirect back to login page
                    }

					// user exists but has been banned
					if (!user.active) {
						return done(errors.E_BANNED, false)
					}

                    // User and password both match, return user from done method
                    // which will be treated like success
                    return done(null, user)
                }
            )
        })
    )
}

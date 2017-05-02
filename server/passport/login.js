const LocalStrategy   = require('passport-local').Strategy
const User = require('../models/User')
const bCrypt = require('bcrypt-nodejs')

let isValidPassword = function(user, password){
	return bCrypt.compareSync(password, user.password)
}

module.exports = function(passport){

	passport.use('login', new LocalStrategy({
            passReqToCallback : true
        },
        function(req, username, password, done) {

            // check in mongo if a user with username exists or not
            User.findOne({ 'username' :  username },
                function(err, user) {
                    // In case of any error, return using the done method
                    if (err)
                        return done(err)

                    // Username does not exist, log the error and redirect back
                    if (!user){
                        console.log('User Not Found with username ' + username)
                        return done(null, false, req.flash('message', 'Invalid username or password.'))
                    }
                    // User exists but wrong password, log the error
                    if (!isValidPassword(user, password)){
                        console.log('Invalid Password')
                        return done(null, false, req.flash('message', 'Invalid username or password.' )) // redirect back to login page
                    }
                    // User and password both match, return user from done method
                    // which will be treated like success
                    return done(null, user)
                }
            )

        })
    )

}

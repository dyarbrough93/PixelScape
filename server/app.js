'use strict'

const port = process.env.PORT || 5000
const devEnv = process.env.NODE_ENV === 'dev'

//===============REQUIRES=================//

const express = require('express')
const app = express()
const httpServer = require('http').Server(app)
const bodyParser = require('body-parser')
const expressSession = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')

const routes = require('./routes.js')(passport)
const initPassport = require('./passport/init.js')

//===============EXPRESS==================//

// static client folder
const staticFolder = devEnv ? '/../client' : '/../build'
app.use(express.static(__dirname + staticFolder))

app.use(bodyParser.json()) // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}))
app.use(expressSession({
    secret: 'sMkIWZ7n!#2C7Kd5mVUF'
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use(function(req, res, next) {
    res.locals.messages = require('express-messages')(req, res)
    next()
})

app.use('/', routes)

initPassport(passport)

passport.serializeUser(function(user, done) {
    done(null, user._id)
})

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user)
    })
})

// Configure express to use ejs templates
app.set('view engine', 'ejs')

module.exports = {
    // start the server
    start: function() {
        httpServer.listen(port, function() {
            console.log('listening on *:' + port)
        })
    },
    server: httpServer
}

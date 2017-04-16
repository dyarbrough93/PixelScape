const port = process.env.PORT || 5000
const devEnv = process.env.NODE_ENV === 'dev'

/*------------------------------------*
 :: Requires
 *------------------------------------*/

const express = require('express')
const app = express()
const httpServer = require('http').Server(app)
const bodyParser = require('body-parser')
const expressSession = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')

const routes = require('./server/routes.js')(passport)
const initPassport = require('./server/passport/init.js')

/*------------------------------------*
 :: Express config
 *------------------------------------*/

// static client folder
const staticFolder = devEnv ? '/../client' : '/../build'
app.use(express.static(__dirname + staticFolder))

// body parser
app.use(bodyParser.json()) // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}))

// express session
app.use(expressSession({
    secret: 'sMkIWZ7n!#2C7Kd5mVUF'
}))

// messages
app.use(flash())
app.use(function(req, res, next) {
    res.locals.messages = require('express-messages')(req, res)
    next()
})

// routes
app.use('/', routes)

// passport
app.use(passport.initialize())
app.use(passport.session())
initPassport(passport)
passport.serializeUser(function(user, done) {
    done(null, user._id)
})
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user)
    })
})

// view engine
app.set('view engine', 'ejs')
app.engine('ejs', require('express-ejs-extend'))

/*------------------------------------*
 :: Init and start server
 *------------------------------------*/

require('./server/MongoDb.js')(function() {

    const worldData = require('./server/worldData.js')

    worldData.init(function() {

        const io = require('socket.io')(app.server)
        const socketHandler = require('./server/socketHandler.js')(io, worldData)

        httpServer.listen(port, function() {
            console.log('listening on *:' + port)
        })

    })

})

const port = process.env.PORT || 5000
const devEnv = process.env.NODE_ENV === 'dev'
const local = devEnv ? require('./server/local.js') : ''
const dbUrl = devEnv ? local.mongo.dbUrl : process.env.DB_URL

/*------------------------------------*
 :: Requires
 *------------------------------------*/

// modules
const express = require('express')
const app = express()
const httpServer = require('http').Server(app)
const io = require('socket.io').listen(httpServer)
const bodyParser = require('body-parser')
const expressSession = require('express-session')
const expressNunjucks = require('express-nunjucks')
const expressMessages = require('express-messages')
const MongoStore = require('connect-mongo')(expressSession)
const passport = require('passport')
const cookieParser = require('cookie-parser')
const passportSocketIo = require("passport.socketio")
const flash = require('connect-flash')
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')

// my files
const routes = require('./server/routes.js')(passport, devEnv, local)
const initPassport = require('./server/passport/init.js')
const mongoDB = require('./server/MongoDb.js')
const worldData = require('./server/worldData.js')
const socketHandler = require('./server/socketHandler.js')

/*------------------------------------*
 :: Express config
 *------------------------------------*/

const sessionStore = new MongoStore({
	url: dbUrl
})

// static client folder
const staticFolder = devEnv ? '/client' : '/build'
app.use(express.static(__dirname + staticFolder))

// body / cookie parser
app.use(cookieParser())
app.use(bodyParser.json()) // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: true
}))

// express session
app.use(expressSession({
	key: 'express.sid',
	secret: 'sMkIWZ7n!#2C7Kd5mVUF',
	store: sessionStore,
	resave: true,
	saveUninitialized: true
}))

// passport
app.use(passport.initialize())
app.use(passport.session())
initPassport(passport)

// messages
app.use(flash())
app.use(function(req, res, next) {
	res.locals.messages = expressMessages(req, res)
	next()
})

// routes
app.use('/', routes)

// view engine
app.set('view engine', 'nunjucks')
expressNunjucks(app, {
	watch: devEnv,
	noCache: devEnv
})

// passport socket.io init
io.use(passportSocketIo.authorize({
	key: 'express.sid',
	secret: 'sMkIWZ7n!#2C7Kd5mVUF',
	store: sessionStore,
	cookieParser: cookieParser,
	success: onAuthorizeSuccess,
	fail: onAuthorizeFail
}))

function onAuthorizeSuccess(data, accept) {
	console.log('User socketio connection')

    return accept(null, true)
}

function onAuthorizeFail(data, message, error, accept) {
    if (error) console.log('Passport err: ', message)

    console.log('Guest socketio connection')

	return accept(null, false)

}

socketHandler(io, worldData)

/*------------------------------------*
 :: Init and start server
 *------------------------------------*/

mongoDB(mongoose, dbUrl, function() {

	worldData.init(function() {

		httpServer.listen(port, function() {
			console.log('listening on *:' + port)
		})

	})

})

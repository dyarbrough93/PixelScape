'use strict'

const port = process.env.PORT || 5000
const devEnv = process.env.NODE_ENV === 'dev'

//===============REQUIRES=================//

const express = require('express')
const exprApp = express()
const httpServer = require('http').Server(exprApp)
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser')
const expressSession = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')

const routes = require('./routes.js')(passport)
const initPassport = require('./passport/init.js')

//===============EXPRESS==================//

// static client folder
const staticFolder = devEnv ? '/../client' : '/../build'
exprApp.use(express.static(__dirname + staticFolder))

exprApp.use(bodyParser.json())       // to support JSON-encoded bodies
exprApp.use(bodyParser.urlencoded({  // to support URL-encoded bodies
  extended: true
}))
exprApp.use(expressSession({secret: 'sMkIWZ7n!#2C7Kd5mVUF'}))
exprApp.use(passport.initialize())
exprApp.use(passport.session())
exprApp.use(flash())

exprApp.use('/', routes)

initPassPort(passport)

passport.serializeUser(function(user, done) {
  done(null, user._id)
})

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user)
  })
})

// Configure express to use handlebars templates
;
(function handlebars() {

    const hbs = exphbs.create()

    exprApp.engine('handlebars', hbs.engine)
    exprApp.set('view engine', 'handlebars')

})()

// routes
exprApp.get('/', function(req, res) {
    if (devEnv) {
        res.render('dev/devHome', {
            layout: false
        })
    } else {
        res.render('home', {
            layout: false
        })
    }
})

exprApp.get('/login', function(req, res) {
    res.render('login', {
        layout: false
    })
})

exprApp.post('/login', function(req, res) {
    res.render('login', {
        layout: false
    })
})

/*exprApp.post('/login', function(req, res) {
    res.render('login', {
        layout: false
    })
})*/

module.exports = {
    // start the server
    start: function() {
        httpServer.listen(port, function() {
            console.log('listening on *:' + port)
        })
    },
    server: httpServer
}

'use strict'

const port = process.env.PORT || 5000
const devEnv = process.env.NODE_ENV === 'dev'

//===============REQUIRES=================//

const express = require('express')
const exprApp = express()
const httpServer = require('http').Server(exprApp)
const exphbs = require('express-handlebars')

//===============EXPRESS==================//

// static client folder
const staticFolder = devEnv ? '/../client' : '/../build'
exprApp.use(express.static(__dirname + staticFolder))

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

module.exports = {
    // start the server
    start: function() {
        httpServer.listen(port, function() {
            console.log('listening on *:' + port)
        })
    },
    server: httpServer
}

'use strict'

const port = process.env.PORT || 5000

//===============REQUIRES=================//

const express = require('express')
const exprApp = express()
const httpServer = require('http').Server(exprApp)
const exphbs = require('express-handlebars')

//===============EXPRESS==================//

// static client folder
exprApp.use(express.static(__dirname + '/../client'));

// Configure express to use handlebars templates
(function handlebars() {

    const hbs = exphbs.create()

    exprApp.engine('handlebars', hbs.engine)
    exprApp.set('view engine', 'handlebars')

})()

// routes
exprApp.get('/', function(req, res) {
    res.render('home', {
        layout: false
    })
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

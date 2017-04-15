'use strict'

const app = require('./server/app.js')
require('./server/MongoDb.js')(function() {

    const worldData = require('./server/worldData.js')

    worldData.init(function() {

        const io = require('socket.io')(app.server)
        const socketHandler = require('./server/socketHandler.js')(io, worldData)

        app.start()

    })

})

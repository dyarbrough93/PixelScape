'use strict'

const http = require('./server/http.js')
const mongodb = require('./server/MongoDb.js')(function done(opsCol, dataCol) {

    const worldData = require('./server/worldData.js')(opsCol, dataCol, function() {

        const io = require('socket.io')(http.server, worldData)
        const socketHandler = require('./server/socketHandler.js')(io)

        http.start()

    })

})

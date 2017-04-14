'use strict'

const http = require('./server/http.js')
const mongoCols = require('./server/MongoDb.js')()

const worldData = require('./server/worldData.js')

worldData.init(mongoCols.opsCol, mongoCols.dataCol, function() {

    const io = require('socket.io')(http.server)
    const socketHandler = require('./server/socketHandler.js')(io, worldData)

    http.start()

})

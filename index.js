'use strict'

const app = require('./server/app.js')
const mongoCols = require('./server/MongoDb.js')()

const worldData = require('./server/worldData.js')

worldData.init(mongoCols.opsCol, mongoCols.dataCol, function() {

    const io = require('socket.io')(app.server)
    const socketHandler = require('./server/socketHandler.js')(io, worldData)

    app.start()

})

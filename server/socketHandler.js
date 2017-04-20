const config = require('./config.js').server

const actionDelay = {}
const connectedUsers = {}

var worldData

function enoughTimePassed(socket) {

	const uname = socket.request.user.username
	const actDelayKey = uname ? uname : socket.id
	const delay = uname ? config.actionDelay : config.guestActionDelay

	// only allow add if user hasn't
	// added for actionDelay
	if (actionDelay[actDelayKey]) {
		var msPassed = (new Date() - actionDelay[actDelayKey])
		if (msPassed <= delay) return false
		actionDelay[actDelayKey] = new Date()
		return true
	} else {
		actionDelay[actDelayKey] = new Date()
		return true
	}

}

function handleBlockOperations(socket) {

    // handle block add
    socket.on('block added', function(block, callback) {

		if (!enoughTimePassed(socket)) return callback('failure')

		var uname = socket.request.user.username
		if (!uname) uname = 'Guest'

        // try to add the block
        worldData.add(block, uname, function(response) {

            // too many blocks
            if (response === 'max') return callback('max')

            // success
            if (response) {

                // tell everyone
                // a block was added
                socket.broadcast.emit('block added', block)
                return callback('success')

            }

            // failure
            return callback('failure')

        })

    })

    // handle block remove
    socket.on('block removed', function(position, callback) {

        if (!enoughTimePassed(socket)) return callback('failure')

		var uname = socket.request.user.username
		if (!uname) uname = 'Guest'

        // try to remove block
        worldData.remove(position, uname, function(success) {

            if (success) { // add block

                // tell all
                // clients a block was removed
                socket.broadcast.emit('block removed', position)
                return callback('success')

            }

            callback('failure')

        })

    })

	socket.on('get user data', function(username, callback) {

		worldData.getUserSettings(username, function(settings) {
			return callback({ settings: settings, voxels: worldData.userData[username]})
		})

	})

}

function handleChunking(socket) {

    // the client told us its ready for the
    // data, so send it
    socket.on('start chunking', function() {

        console.log('chunking')

        // prep for chunking by adding all
        // keys to an array
        var keys = []
        for (var key in worldData.voxels) {
            if (worldData.voxels.hasOwnProperty(key))
                keys.push(key)
        }

        var chunk
        var chunkSize = config.dataChunkSize,
            kLen = keys.length // total data length

        // tell the client what they're about to receive
        socket.emit('chunking size', Math.ceil(kLen / chunkSize))

        var i = 0,
            j

        // send chunks in delayed isntervals
        var interval = setInterval(function() {

            chunk = ''
            j = 0

            // construct this chunk and send it
            for (i, j; i < kLen, j < chunkSize; i++, j++) {

                if (i === kLen) break

                // format it in JSON so it can be
                // parsed by JSON.parse
                var obj = worldData.voxels[keys[i]]
                chunk += '"' + keys[i] + '"' + ':' + JSON.stringify(obj)

                if (i !== kLen - 1) chunk += ','
            }

            // send the chunk
            socket.emit('chunk', chunk)

            // we're done
            if (i > kLen - 1) {
                clearTimeout(interval)
                socket.emit('chunk done')
            }

        }, config.chunkInterval)

    })

}

function IOHandler(io, _worldData) {

    worldData = _worldData

    // new connection
    io.on('connection', function(socket) {

        // disconnect when too many users
        if (io.engine.clientsCount > config.maxClients) {
            socket.emit('max clients')
            socket.disconnect()
            return
        }

        // prevent multiple logins per user
        const uname = socket.request.user.username

        /*if (uname) {

            if (connectedUsers[uname]) {
                socket.emit('multiple logins')
                socket.disconnect()
            }
            connectedUsers[uname] = true

        } // else guest*/

        console.log('connection')
        console.log('connections: ' + io.engine.clientsCount)

        // tell the clients there is a new connection
        io.sockets.emit('update clients', io.engine.clientsCount)

        handleBlockOperations(socket)

        handleChunking(socket)

        // client disconnected
        socket.on('disconnect', function() {

            connectedUsers[uname] = false
            delete connectedUsers[uname]

            // tell all the clients a client disconnected
            io.sockets.emit('update clients', io.engine.clientsCount)
            console.log('user disconnected')
            console.log('connections: ' + io.engine.clientsCount)

        })

    })

}

module.exports = IOHandler

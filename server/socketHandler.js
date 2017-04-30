const config = require('./config.js').server
const responses = require('./socketResponses.js')

const actionDelay = {}
const deleteActionDelay = {}
const connectedUsers = {}

let worldData

let i = 0
function enoughTimePassed(socket, deleteOther) {

    const uname = socket.request.user.username
    const actDelayKey = uname ? uname : socket.id // guest
    const delay = (function() {
        if (uname) {
            if (deleteOther) return config.deleteOtherDelay
            return config.actionDelay
        } else {
            if (deleteOther) return config.guestDeleteOtherDelay
            return config.guestActionDelay
        }
    })()

    const delayObj = deleteOther ? deleteActionDelay : actionDelay

	// only allow add if user hasn't
	// added for delayObj
	if (delayObj[actDelayKey]) {
		let msPassed = (new Date() - delayObj[actDelayKey])
		if (msPassed < delay) return false
		delayObj[actDelayKey] = new Date()
		return true
	} else {
		delayObj[actDelayKey] = new Date()
		return true
	}

}

function handleBlockOperations(socket) {

    // handle block add
    socket.on('block added', function(block, callback) {

        if (!enoughTimePassed(socket)) return callback(responses.needDelay)

		let uname = socket.request.user.username
		if (!uname) uname = 'Guest'

        // try to add the block
        worldData.add(block, uname, function(response) {

            // success
            if (response === responses.success) {

                // tell everyone
                // a block was added
                socket.broadcast.emit('block added', block)

            }

            return callback(response)

        })

    })

    // handle block remove
    socket.on('block removed', function(position, callback) {

		let uname = socket.request.user.username
		if (!uname) uname = 'Guest'

		let voxel = worldData.getVoxel(position)

		let voxelUName = voxel && voxel.username ? voxel.username : 'Guest'

        if (voxel && voxelUName !== 'Guest' && voxelUName !== uname) {
            if (!enoughTimePassed(socket, true)) return callback(responses.needDelay)
        } else {
            if (!enoughTimePassed(socket)) return callback(responses.needDelay)
        }

        // try to remove block
        worldData.remove(position, uname, function(response) {

            if (response === responses.success) {

                // tell all
                // clients a block was removed
                socket.broadcast.emit('block removed', position)

            }

            return callback(response)

        })

    })

    socket.on('batch delete', function(toDelete, done) {

        worldData.batchDelete(toDelete, function(deletedVoxels) {

            for (var i = 0; i < deletedVoxels.length; i++) {
                socket.broadcast.emit('block removed', deletedVoxels[i])
            }

            done(deletedVoxels)

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
        let keys = []
        for (let key in worldData.voxels) {
            if (worldData.voxels.hasOwnProperty(key))
                keys.push(key)
        }

        let chunk
        let chunkSize = config.dataChunkSize,
            kLen = keys.length // total data length

        // tell the client what they're about to receive
        socket.emit('chunking size', Math.ceil(kLen / chunkSize))

        let i = 0,
            j

        // send chunks in delayed isntervals
        let interval = setInterval(function() {

            chunk = ''
            j = 0

            // construct this chunk and send it
            for (i, j; i < kLen, j < chunkSize; i++, j++) {

                if (i === kLen) break

                // format it in JSON so it can be
                // parsed by JSON.parse
                let obj = worldData.voxels[keys[i]]
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

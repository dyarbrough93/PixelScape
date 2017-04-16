'use strict'

const config = require('./config.js')

const actionDelay = {}

var worldData

function handleBlockOperations(socket) {

	// handle block add
	socket.on('block added', function(block, callback) {

		// only allow add if user hasn't
		// added for delayTime
		if (actionDelay[socket.id]) {
			var secondsPassed = (new Date() - actionDelay[socket.id]) / 1000
			if (secondsPassed <= config.delayTime) return callback('failure')
		}

		// try to add the block
		worldData.add(block, function(response) {

			// too many blocks
			if (response === 'max') return callback('max')

			// success
			if (response) {

				// reset timer and tell everyone
				// a block was added
				actionDelay[socket.id] = new Date()
				socket.broadcast.emit('block added', block)
				return callback('success')

			}

			// failure
			return callback('failure')

		})

	})

	// handle block remove
	socket.on('block removed', function(position, callback) {

		// only allow user to remove
		// if user hasn't acted for delayTime
		if (actionDelay[socket.id]) {
			var secondsPassed = (new Date() - actionDelay[socket.id]) / 1000
			if (secondsPassed <= config.delayTime) return callback('failure')
		}

		// try to remove block
		worldData.remove(position, function(success) {

			if (success) { // add block

				// reset action delay and tell all
				// clients a block was removed
				actionDelay[socket.id] = new Date()
				socket.broadcast.emit('block removed', position)
				return callback('success')

			}

			callback('failure')

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

		console.log(socket.request.user)

		console.log('connection')
		console.log("connections: " + io.engine.clientsCount)

		// tell the clients there is a new connection
		io.sockets.emit('update clients', io.engine.clientsCount)

		handleBlockOperations(socket)

		handleChunking(socket)

		// client disconnected
		socket.on('disconnect', function() {

			// tell all the clients a client disconnected
			io.sockets.emit('update clients', io.engine.clientsCount)
			console.log('user disconnected')
			console.log("connections: " + io.engine.clientsCount)

		})

	})

}

module.exports = IOHandler

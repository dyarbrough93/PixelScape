var SocketHandler = function(window, undefined) {

    var socket

    function init() {

        socket = io.connect()

        initSocketOns()

    }

    function initSocketOns() {

        socket.on('block added', function(block) {

            var pos = block.position

            var gPos = new THREE.Vector3(pos.x, pos.y, pos.z).initGridPos()
            var tColor = new THREE.Color(block.color)

            if (UserState.modeIsEdit() && VoxelUtils.withinSelectionBounds(gPos)) {
                ActionMgr.createVoxelAtGridPos(gPos, tColor.getHex())
            } else {
                var sid = VoxelUtils.getSectionIndices(gPos)
                var coordStr = VoxelUtils.getCoordStr(gPos)
                var pIdx = GameScene.getPSystemExpo().addPixel(gPos, tColor)
                WorldData.addVoxel(sid, coordStr, tColor, pIdx, true)
            }

            GameScene.render()

        })

        socket.on('block removed', function(pos) {

            var gPos = new THREE.Vector3(pos.x, pos.y, pos.z).initGridPos()

            if (UserState.modeIsEdit() && VoxelUtils.withinSelectionBounds(gPos)) {

                // delete voxel
                ActionMgr.deleteVoxelAtGridPos(gPos)

            } else { // delete pixel

                ActionMgr.deletePixelAtGridPos(gPos)

            }

        })

    }

    function emitBlockRemoved(gPos, cb) {

        socket.emit('block removed', {
            x: gPos.x,
            y: gPos.y,
            z: gPos.z
        }, function(response) {

            if (response === 'success')
                return cb(true)
            else return cb(false)

        })

    }

    function emitBlockAdded(gPos, hColor, cb) {

        socket.emit('block added', {
            color: hColor,
            position: {
                x: gPos.x,
                y: gPos.y,
                z: gPos.z
            }
        }, function(response) {

            if (response === 'success')
                return cb(true)
            else if (response === 'max') {
                alert('maximum voxel limit reached.')
                return cb(false)
            }

        })

    }

    /**************************************\
    | Receive Chunked Data                 |
    \**************************************/

    function retrieveData(cb) {

        socket.emit('start chunking')

        var numChunks
        var numChunksLoaded
        var chunkData

        // we get the number of chunks we are
        // about to receive
        socket.on('chunking size', function(size) {
            console.log('receiving data from server')
            numChunks = size
        })

        chunkData = '{'
        numChunksLoaded = 0

        // we receive a chunk
        socket.on('chunk', function(chunk) {

            numChunksLoaded++

            if (numChunks > 0) {
                var percent = ((numChunksLoaded / numChunks) * 100).toFixed(0)
                console.log(percent + '% chunks loaded')
            }

            chunkData += chunk
        })

        // we have received all chunks
        socket.on('chunk done', function() {
            chunkData += '}'
            chunkData = JSON.parse(chunkData)
            console.log('done retrieving data')
            cb(chunkData)
        })
    }

    return {
        init: init,
        retrieveData: retrieveData,
        emitBlockAdded: emitBlockAdded,
        emitBlockRemoved: emitBlockRemoved
    }

}()

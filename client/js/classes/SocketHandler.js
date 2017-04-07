var SocketHandler = function(window, undefined) {

    /*socket.on('block added', function(block) {

        var pos = block.position

        var gPos = new THREE.Vector3(pos.x, pos.y, pos.z).initGridPos()
        var color = new THREE.Color(block.color)

        if (currentSelection && withinSelectionBounds(gPos)) {
            createAndAddVoxel(gPos, block.color, false)
        } else {
            var sid = getSectionIndices(gPos)
            voxels[sid.a][sid.b][VoxelUtils.getCoordStr(gPos)] = {
                c: color,
                exp: true
            }
            addPixel(gPos, c)
        }

    })*/

    /**************************************\
    | Receive Chunked Data                 |
    \**************************************/

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
    })

}()

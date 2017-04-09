var Main = function() {

    $(document).ready(function() {

        // initialize classes
        Raycast.init()
        GameScene.init()
        WorldData.init()
        Mouse.init()
        Keys.init()
        UserState.init()
        MapControls.init()
        PixVoxConversion.init()
        BufMeshMgr.init()

        retrieveData(function(data) {

            WorldData.load(data)
            GameScene.render()

        })

    })

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

}()

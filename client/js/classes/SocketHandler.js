'use strict'

/**
 * Manages socket events
 * @namespace SocketHandler
 */
let SocketHandler = function(window, undefined) {

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    let socket

    /*------------------------------------*
     :: Public Methods
     *------------------------------------*/

    /**
     * Initializes the module. Must be called
     * before anything else
     * @memberOf SocketHandler
     * @access public
     */
    function init() {

        socket = io.connect()

        initSocketOns()

    }

    /**
     * Send a "block removed" socket emit
     * with the given grid position
     * @memberOf SocketHandler
     * @access public
     * @param  {VoxelUtils.GridVector3} gPos The grid
     * position of the voxel to remove
     * @param  {Function} cb Callback to call with
     * a boolean indicating success
     */
    function emitBlockRemoved(gPos, cb) {

        socket.emit('block removed', {
            x: gPos.x,
            y: gPos.y,
            z: gPos.z
        }, cb)

    }

    /**
     * Send a "block added" socket emit
     * with the given grid position and color
     * @memberOf SocketHandler
     * @access public
     * @param  {VoxelUtils.GridVector3} gPos The grid
     * position of the voxel to add
     * @param {string} hexString Hex color of the voxel
     * we are adding
     * @param  {Function} cb Callback to call with
     * a boolean indicating success
     */
    function emitBlockAdded(gPos, hexString, cb) {

        socket.emit('block added', {
            color: VoxelUtils.hexStringToDec(hexString),
            position: {
                x: gPos.x,
                y: gPos.y,
                z: gPos.z
            }
        }, cb)

    }

    /**
     * Retrieve the world data from the server
     * @param  {Function} cb Callback to call with
     * the received data as the only parameter
     */
    function retrieveData(cb) {

        socket.emit('start chunking', archiveMode)

        let numChunks
        let numChunksLoaded
        let chunkData

        // we get the number of chunks we are
        // about to receive
        socket.on('chunking size', function(size) {
            console.log('receiving data from server ...')
            numChunks = size
        })

        chunkData = '{'
        numChunksLoaded = 0

        // we receive a chunk
        socket.on('chunk', function(chunk) {

            numChunksLoaded++

            if (numChunks > 0) {
                let percent = ((numChunksLoaded / numChunks) * 100).toFixed(0)
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

    /*------------------------------------*
     :: Private Methods
     *------------------------------------*/

    /**
     * Initialize socket.on events
     * @memberOf SocketHandler
     * @access private
     */
    function initSocketOns() {

        socket.on('update clients', function(num) {
            GUI.setConnectedClients(num)
        })

        socket.on('multiple logins', function() {

            alert('You are already logged in!')
            GameScene.removeCanvas()
            GUI.destroy()

        })

        socket.on('block added', function(block) {

            let pos = block.position

            let gPos = new THREE.Vector3(pos.x, pos.y, pos.z).initGridPos()
            let tColor = new THREE.Color(block.color)
            let username = block.username

            if (User.modeIsEdit() && VoxelUtils.withinSelectionBounds(gPos)) {
                VoxelActions.createVoxelAtGridPos(gPos, tColor.getHex(), username)
            } else {
                let sid = VoxelUtils.getSectionIndices(gPos)
                let coordStr = VoxelUtils.getCoordStr(gPos)
                let pIdx = GameScene.getPSystemExpo().addPixel(gPos, tColor)
                WorldData.addVoxel(sid, coordStr, tColor, username, pIdx, true)
            }

            GameScene.render()

        })

        socket.on('block removed', function(pos) {

            let gPos = new THREE.Vector3(pos.x, pos.y, pos.z).initGridPos()

            if (User.modeIsEdit() && VoxelUtils.withinSelectionBounds(gPos)) {

                // delete voxel
                VoxelActions.deleteVoxelAtGridPos(gPos)

            } else { // delete pixel

                VoxelActions.deletePixelAtGridPos(gPos)

            }

        })

    }

    function getSocket() {
        return socket
    }

    /*********** expose public methods *************/

    return {
        init: init,
        retrieveData: retrieveData,
        emitBlockAdded: emitBlockAdded,
        emitBlockRemoved: emitBlockRemoved,
        getSocket: getSocket
    }

}()

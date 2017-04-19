'use strict'

/**
 * Manages socket events
 * @namespace SocketHandler
 */
var SocketHandler = function(window, undefined) {

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    var socket

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

    function getUserBlocks(username, cb) {
        socket.emit('get user blocks', username, function(userBlocks) {
            return cb(userBlocks)
        })
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
        }, function(response) {

            if (response === 'success')
                return cb(true)
            else return cb(false)

        })

    }

    /**
     * Send a "block added" socket emit
     * with the given grid position and color
     * @memberOf SocketHandler
     * @access public
     * @param  {VoxelUtils.GridVector3} gPos The grid
     * position of the voxel to add
     * @param {number} hColor Hex color of the voxel
     * we are adding
     * @param  {Function} cb Callback to call with
     * a boolean indicating success
     */
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

    /**
     * Retrieve the world data from the server
     * @param  {Function} cb Callback to call with
     * the received data as the only parameter
     */
    function retrieveData(cb) {

        socket.emit('start chunking')

        var numChunks
        var numChunksLoaded
        var chunkData

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

    /*------------------------------------*
     :: Private Methods
     *------------------------------------*/

    /**
     * Initialize socket.on events
     * @memberOf SocketHandler
     * @access private
     */
    function initSocketOns() {

        socket.on('multiple logins', function() {

            alert('You are already logged in!')
            GameScene.destroy()
            GUI.destroy()

        })

        socket.on('block added', function(block) {

            var pos = block.position

            var gPos = new THREE.Vector3(pos.x, pos.y, pos.z).initGridPos()
            var tColor = new THREE.Color(block.color)
            var username = block.username

            if (User.modeIsEdit() && VoxelUtils.withinSelectionBounds(gPos)) {
                VoxelActions.createVoxelAtGridPos(gPos, tColor.getHex(), username)
            } else {
                var sid = VoxelUtils.getSectionIndices(gPos)
                var coordStr = VoxelUtils.getCoordStr(gPos)
                var pIdx = GameScene.getPSystemExpo().addPixel(gPos, tColor)
                WorldData.addVoxel(sid, coordStr, tColor, username, pIdx, true)
            }

            GameScene.render()

        })

        socket.on('block removed', function(pos) {

            var gPos = new THREE.Vector3(pos.x, pos.y, pos.z).initGridPos()

            if (User.modeIsEdit() && VoxelUtils.withinSelectionBounds(gPos)) {

                // delete voxel
                VoxelActions.deleteVoxelAtGridPos(gPos)

            } else { // delete pixel

                VoxelActions.deletePixelAtGridPos(gPos)

            }

        })

    }

    /*********** expose public methods *************/

    return {
        init: init,
        retrieveData: retrieveData,
        emitBlockAdded: emitBlockAdded,
        emitBlockRemoved: emitBlockRemoved,
        getUserBlocks: getUserBlocks
    }

}()

'use strict'

/**
 * Manages the world state (location and
 * color of all voxels)
 * @namespace WorldData
 */
var WorldData = function(window, undefined) {

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    var worldData
    var userData

    /*------------------------------------*
     :: Public Methods
     *------------------------------------*/

    /**
     * Initializes the module. Must be called
     * before anything else
     * @memberOf WorldData
     * @access public
     */
    function init() {

        var secPerSide = Config.getGrid().sectionsPerSide

        worldData = []
        userData = {}
        for (var i = 0, len1 = secPerSide; i < len1; i++) {
            worldData[i] = []
            for (var j = 0, len2 = secPerSide; j < len2; j++) {
                worldData[i][j] = {}
            }
        }

    }

    /**
     * Load all of the world data into the scene
     * @memberOf WorldData
     * @access public
     * @param {object} data Contains all of the data
     * to load in, retrieved viq the SocketHandler
     */
    function loadIntoScene(data) {

        var particleSystem = GameScene.getPSystem()

        console.log('loading pixels into scene ...')

        for (var coordStr in data) {
            if (data.hasOwnProperty(coordStr)) {

                var color = data[coordStr].c
                var tColor = new THREE.Color(color)
                var username = data[coordStr].username

                var gPos = VoxelUtils.coordStrParse(coordStr)

                if (username && username !== 'Guest')
                    addToUserData(username, gPos)

                if (VoxelUtils.withinGridBoundaries(gPos)) {

                    var wPos = gPos.clone().gridToWorld()

                    var sid = VoxelUtils.getSectionIndices(gPos)

                    // add a pixel to the particle system,
                    // then add a voxel to worldData
                    var pIdx = particleSystem.addPixel(sid, wPos, tColor)
                    addVoxel(sid, coordStr, color, username, pIdx, false)

                }

            }
        }

        particleSystem.addToScene()

        console.log('done loading pixels')

        GameScene.render()

    }

    function getUserVoxels(username) {

        return userData[username]

    }

    /**
     * Creates an entry in the worldData object with the specified
     * parameters.
     * @memberOf WorldData
     * @access public
     * @param {VoxelUtils.Tuple} sid Section indices
     * @param {number} hColor Hex color
     * @param {number} pIdx Index in the particle system geometry
     * @param {boolean} exp Part of particle system expansion?
     * @param {VoxelUtils.coordStr} coordStr Coordinate string (grid coords)
     */
    function addVoxel(sid, coordStr, hColor, username, pIdx, exp) {

        worldData[sid.a][sid.b][coordStr] = {
            c: hColor,
            pIdx: pIdx,
            username: username,
            exp: exp
        }

    }

    /**
     * Add a mesh to the world data
     * @memberOf WorldData
     * @access public
     * @param {VoxelUtils.Tuple} sid Section indices of the voxel we are adding
     * @param {VoxelUtils.coordStr} coordStr coordinate string of the voxel
     * @param {THREE.Mesh} mesh The mesh to add
     */
    function addMesh(sid, coordStr, mesh, uname) {
        mesh.userData.username = uname
        worldData[sid.a][sid.b][coordStr] = mesh
    }

    /**
     * Remove a voxel from worldData
     * @memberOf WorldData
     * @access public
     * @param  {VoxelUtils.GridVector3} gPos Grid position of
     * the voxel to remove
     */
    function removeVoxel(gPos) {
        var coordStr = VoxelUtils.getCoordStr(gPos)
        var sid = VoxelUtils.getSectionIndices(gPos)
        delete worldData[sid.a][sid.b][coordStr]
    }

    /**
     * Retrieve a voxel with the specified
     * section indices and coordStr
     * @param  {VoxelUtils.GridVector3} gPos Grid position of
     * the voxel to get
     * @return {object} The mesh or object
     */
    function getVoxel(gPos) {
        var coordStr = VoxelUtils.getCoordStr(gPos)
        var sid = VoxelUtils.getSectionIndices(gPos)
        return worldData[sid.a][sid.b][coordStr]
    }

    /**
     * Return the worldData object
     * @return {Ojbect} The world data
     */
    function getWorldData() {
        return worldData
    }

    function addToUserData(username, gPos) {

        if (!userData.hasOwnProperty(username)) userData[username] = {}

        if (!userData[username][gPos.x]) userData[username][gPos.x] = {}
        if (!userData[username][gPos.x][gPos.y]) userData[username][gPos.x][gPos.y] = {}
        if (!userData[username][gPos.x][gPos.y][gPos.z]) userData[username][gPos.x][gPos.y][gPos.z] = {}

    }

    function removeFromUserData(username, gPos) {

        if (userData.hasOwnProperty(username)) {

            if (!userData[username][gPos.x]) return
            if (!userData[username][gPos.x][gPos.y]) return
            delete userData[username][gPos.x][gPos.y][gPos.z]

        }

    }

    /*********** expose public methods *************/

    return {
        init: init,
        loadIntoScene: loadIntoScene,
        getVoxel: getVoxel,
        addVoxel: addVoxel,
        addMesh: addMesh,
        getUserVoxels: getUserVoxels,
        getWorldData: getWorldData,
        removeVoxel: removeVoxel,
        addToUserData: addToUserData,
        removeFromUserData: removeFromUserData
    }

}()

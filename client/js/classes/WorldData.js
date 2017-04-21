'use strict'

/**
 * Manages the world state (location and
 * color of all voxels)
 * @namespace WorldData
 */
var WorldData = function(window, undefined) {

    /**
     * An object containing information on voxel
     * ownership, with keys being usernames and values
     * being Objects containing the owned voxels in a
     * coordinate tree (for fast indexing), with the following format:
     *<pre><code>
     * {
     *     'username': {
     *         1 : {
     *             5 : {
     *                 3 {}
     *             },
     *             4 : {
     *                 2 : {}
     *             }
     *         },
     *         6 : {
     *             2 : {
     *                 1 : {}
     *             }
     *         }
     *     }
     * }
     *</code></pre>
     * with the first level as the x coordinate, the second level as
     * the y coordinate, and the third level as the z coordinate. So,
     * in the above example, "username" owns voxels {1, 5, 3}, {1, 4, 2}, and {6, 2, 1}
     * @memberOf WorldData
     * @typedef {Object} userData
     */

    /**
     * An object containing information on all of the
     * voxels currently in the world, where keys are
     * {@link VoxelUtils.coordStr} and values can be either
     * a THREE.Mesh (a newly placed voxel) or a {@link WorldData.VoxelInfo}
     * The structure looks like this:
     *<pre><code>
     * {
     *     'x12y10z-5': {@link WorldData.VoxelInfo}
     *     'x-5y4z3': {@link WorldData.VoxelInfo}
     *     'x7y1z8': {THREE.Mesh}
     * }
     *</code></pre>
     * @memberOf WorldData
     * @typedef {Object} worldData
     */

    /*------------------------------------*
     :: Classes
     *------------------------------------*/

    /**
     * @class VoxelInfo
     * @param {number} hColor Hex color
     * @param {string} username Username of the user that owns this voxel
     * @param {number} pIdx Index in the particle system geometry
     * @param {number} bIdx Buffer index. used with BufMeshMgr
     * @param {boolean} exp Part of particle system expansion?
     * @memberOf WorldData
     */
    function VoxelInfo(hColor, username, pIdx, bIdx, exp) {

        this.hColor = hColor
        this.username = username
        this.pIdx = pIdx
        this.bIdx = bIdx
        this.exp = exp

    }

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

                var hColor = data[coordStr].c
                var tColor = new THREE.Color(hColor)
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

                    // add to worldData
                    var voxInfo = new VoxelInfo(hColor, username, pIdx, null, false)
                    addVoxel(sid, coordStr, voxInfo)

                }

            }
        }

        particleSystem.addToScene()

        console.log('done loading pixels')

        GameScene.render()

    }

    /**
     * Creates a VoxelInfo entry in the worldData object with the specified
     * parameters.
     * @memberOf WorldData
     * @access public
     * @param {VoxelUtils.Tuple} sid Section indices
     * @param {VoxelUtils.coordStr} coordStr Coordinate string (grid coords)
     * @param {WorldData.VoxelInfo} voxInfo Object containing the voxel information
     */
    function addVoxel(sid, coordStr, voxInfo) {

        worldData[sid.a][sid.b][coordStr] = voxInfo
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
     * @access public
     * @memberOf WorldData
     */
    function getVoxel(gPos) {
        var coordStr = VoxelUtils.getCoordStr(gPos)
        var sid = VoxelUtils.getSectionIndices(gPos)
        return worldData[sid.a][sid.b][coordStr]
    }

    /**
     * Add a coordinate to the attribute of the userData
     * object with the given username
     * @param {string} username The username index
     * @param {VoxelUtils.GridVector3} gPos Grid coordinate to add
     * @access public
     * @memberOf WorldData
     */
    function addToUserData(username, gPos) {

        if (!userData.hasOwnProperty(username)) userData[username] = {}

        if (!userData[username][gPos.x]) userData[username][gPos.x] = {}
        if (!userData[username][gPos.x][gPos.y]) userData[username][gPos.x][gPos.y] = {}
        if (!userData[username][gPos.x][gPos.y][gPos.z]) userData[username][gPos.x][gPos.y][gPos.z] = {}

    }

    /**
     * Remove a coordinate from the attribute of
     * userData that matches the given
     * @param  {string} username The username index
     * @param  {VoxelUtils.GridVector3} gPos Grid coordinate to remove
     * @access public
     * @memberOf WorldData
     */
    function removeFromUserData(username, gPos) {

        if (userData.hasOwnProperty(username)) {

            if (!userData[username][gPos.x]) return
            if (!userData[username][gPos.x][gPos.y]) return
            delete userData[username][gPos.x][gPos.y][gPos.z]

        }

    }

    /**
     * Return the voxels for the give username
     * @param  {string} username The username index
     * @return {Object} Voxels owned by that user
     */
    function getUserVoxels(username) {
        return userData[username]
    }

    /**
     * Return the worldData object
     * @return {Ojbect} The world data
     */
    function getWorldData() {
        return worldData
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
        removeFromUserData: removeFromUserData,
        VoxelInfo: VoxelInfo
    }

}()

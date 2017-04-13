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

                var gPos = VoxelUtils.coordStrParse(coordStr)
                var wPos = gPos.clone().gridToWorld()

                var sid = VoxelUtils.getSectionIndices(gPos)

                // add a pixel to the particle system,
                // then add a voxel to worldData
                var pIdx = particleSystem.addPixel(sid, wPos, tColor)
                addVoxel(sid, coordStr, color, pIdx, false)

            }
        }

        particleSystem.addToScene()

        console.log('done loading pixels')

        GameScene.render()

    }

    /**
     * Creates an entry in the worldData object with the specified
     * parameters.
     * @memberOf WorldData
     * @access public
     * @param {VoxelUtils.Tuple} sid Section indices
     * @param {number} tColor THREE.Color
     * @param {number} pIdx Index in the particle system geometry
     * @param {boolean} exp Part of particle system expansion?
     * @param {VoxelUtils.coordStr} coordStr Coordinate string (grid coords)
     */
    function addVoxel(sid, coordStr, tColor, pIdx, exp) {

        worldData[sid.a][sid.b][coordStr] = {
            c: tColor,
            pIdx: pIdx,
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
    function addMesh(sid, coordStr, mesh) {
        worldData[sid.a][sid.b][coordStr] = mesh
    }

    /**
     * Remove a voxel from worldData
     * @memberOf WorldData
     * @access public
     * @param {VoxelUtils.Tuple} sid Section indices
     * @param {VoxelUtils.coordStr} coordStr Coordinate string (grid coords)
     */
    function removeVoxel(sid, coordStr) {
        delete worldData[sid.a][sid.b][coordStr]
    }

    /**
     * Retrieve a voxel with the specified
     * section indices and coordStr
     * @param  {VoxelUtils.Tuple} sid Section indices
     * @param  {VoxelUtils.coordStr} coordStr Coordinate string
     * @return {object} The mesh or object
     */
    function getVoxel(sid, coordStr) {
        return worldData[sid.a][sid.b][coordStr]
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
        getWorldData: getWorldData,
        removeVoxel: removeVoxel
    }

}()

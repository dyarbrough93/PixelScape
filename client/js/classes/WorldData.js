var WorldData = function(window, undefined) {

    var worldData

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
     * Load all of the world data
     * @memberOf VoxelWorld
     * @param {Object} data Contains
     * @param {VoxelUtils.coordStr} voxelData.coordStr Coordinate string in grid coordinates.
     * @param {Number} voxelData.coordStr.c Hex color of the voxel
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
     *
     * @param {VoxelUtils.Tuple} sid Section indices
     * @param {number} tColor THREE Color
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

    function addMesh(sid, coordStr, mesh) {
        worldData[sid.a][sid.b][coordStr] = mesh
    }

    /**
     * Remove a voxel from worldData
     *
     * @param {VoxelUtils.Tuple} sid Section indices
     * @param {VoxelUtils.coordStr} coordStr Coordinate string (grid coords)
     */
    function removeVoxel(sid, coordStr) {
        delete worldData[sid.a][sid.b][coordStr]
    }

    function getVoxel(sid, coordStr) {
        return worldData[sid.a][sid.b][coordStr]
    }

    function getWorldData() {
        return worldData
    }

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

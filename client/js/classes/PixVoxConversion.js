'use strict'

/**
 * Manages conversion between voxels
 * and pixels
 * @namespace PixVoxConversion
 */
let PixVoxConversion = function(window, undefined) {

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    let convertedVoxels

    /*------------------------------------*
     :: Public Methods
     *------------------------------------*/

    /**
     * Initializes the module. Must be called
     * before anything else
     * @memberOf PixVoxConversion
     * @access public
     */
    function init() {

        convertedVoxels = {}

    }

    /**
     * Convert the given region from pixels to
     * voxels
     * @memberOf PixVoxConversion
     * @access public
     * @param  {RegionSelection} region The region in which
     * all pixels should be converted
     */
    function convertToVoxels(region) {

        constrainRegion(region)
        let numCubes = addRegionToConvertedVoxels(region)

        if (validNumConverting(numCubes)) {

            BufMeshMgr.createBufMesh(numCubes, GameScene.getScene())
            addToBufMesh()
            GameScene.render()

        }

    }

    /**
     * Convert the given region from voxels to
     * pixels
     * @memberOf PixVoxConversion
     * @access public
     * @param  {RegionSelection} region The region in which
     * all voxels should be converted
     */
    function convertToPixels() {

        let i = 0
        let worldData = WorldData.getWorldData()

        let pSystemExpo = GameScene.getPSystemExpo()
        let pSystem = GameScene.getPSystem()

        for (let voxPos in convertedVoxels) {

            // get basic info we need
            let gPos = VoxelUtils.coordStrParse(voxPos)
            gPos = new THREE.Vector3(gPos.x, gPos.y, gPos.z).initGridPos()
            let wPos = gPos.clone().gridToWorld()

            let sid = VoxelUtils.getSectionIndices(gPos)
            let vox = WorldData.getVoxel(gPos)

            if (vox) {

                if (vox.isMesh) { // newly added in selected region

                    let tColor = vox.geometry.faces[0].color

                    // add to particle system expo
                    let pIdx = pSystemExpo.addPixel(gPos, tColor)
                    let coordStr = VoxelUtils.getCoordStr(gPos)

                    let username = User.getUName()

                    // overwrite mesh with voxel entry
                    let voxInfo = new WorldData.VoxelInfo(tColor.getHex(), username, pIdx, null, true)
                    WorldData.addVoxel(sid, coordStr, voxInfo)

                    // remove from scene and stop
                    // raycasting against it
                    GameScene.removeFromScene(vox)
                    Raycast.remove(vox)

                } else {

                    if (vox.exp) { // part of particleSystemExpo
                        pSystemExpo.showPixel(vox.pIdx)
                    } else { // part of regular particleSystem
                        pSystem.showPixel(sid, vox.pIdx)
                    }

                }

            } else { // not defined
                console.warn('convertedVoxels entry has no associated WorldData entry')
                convertedVoxels.splice(i, 1)
            }

            i++

        }

        let bufMesh = BufMeshMgr.getBufMesh()
        Raycast.remove(bufMesh)
        GameScene.removeFromScene(bufMesh)
        BufMeshMgr.destroyBufMesh()

        convertedVoxels = {}

        GameScene.render()

    }

    /**
     * Add a voxel to the convertedVoxels object
     * @memberOf PixVoxConversion
     * @access public
     * @param {VoxelUtils.Tuple} sid Section indices of the
     * voxel we are adding
     * @param {VoxelUtils.coordStr} coord Coord string of the
     * voxel we are adding
     */
    function addToConvertedVoxels(sid, coord) {
        let worldData = WorldData.getWorldData()
        convertedVoxels[coord] = worldData[sid.a][sid.b][coord]
    }

    /**
     * Remove a voxel from the convertedVoxels object
     * @memberOf PixVoxConversion
     * @access public
     * @param {VoxelUtils.coordStr} coord Coord string of the
     * voxel we are removing
     */
    function removeFromConvertedVoxels(coord) {
        delete convertedVoxels[coord]
    }

    /*------------------------------------*
     :: Private Methods
     *------------------------------------*/

     /**
      * Contrain the selection region so that
      * it is not outside the bounds of the grid
      * @memberOf PixVoxConversion
      * @access private
      * @param  {RegionSelection} region The region to contrain
      * (will be modified by this function)
      */
     function constrainRegion(region) {

         let spsg = archiveMode ? ArchiveConfig.get().sqPerSideOfGrid : Config.getGrid().sqPerSideOfGrid

         let c1 = region.corner1
         let c2 = region.corner2

         let minxz = -(spsg / 2)
         let maxxz = spsg / 2

         if (c1.x < minxz)
             c1.x = minxz
         if (c1.z < minxz)
             c1.z = minxz
         if (c2.x > maxxz)
             c2.x = maxxz
         if (c2.z > maxxz)
             c2.z = maxxz

     }

     /**
      * Add all voxels in the given region to
      * the convertedVoxels object
      * @memberOf PixVoxConversion
      * @access private
      * @param {RegionSelection} region The region
      */
     function addRegionToConvertedVoxels(region) {

         let worldData = WorldData.getWorldData()

         let c1 = region.corner1
         let c2 = region.corner2

         let c1Sid = VoxelUtils.getSectionIndices(c1)
         let c2Sid = VoxelUtils.getSectionIndices(c2)

         let numConverted = 0

         for (let x = c1Sid.a; x <= c2Sid.a; x++) {
             for (let z = c1Sid.b; z <= c2Sid.b; z++) {
                 for (let voxPos in worldData[x][z]) {
                     let gPos = VoxelUtils.coordStrParse(voxPos)
                     if (VoxelUtils.withinSelectionBounds(gPos)) {
                         convertedVoxels[voxPos] = worldData[x][z][voxPos]
                         numConverted++
                     }
                 }
             }
         }

         return numConverted
     }

     /**
      * Check to see if the number of voxels we are
      * attempting to convert is valid (not too high)
      * @memberOf PixVoxConversion
      * @access private
      * @param  {number} numConverting Number of voxels
      * we are attempting to convert
      * @return {boolean}
      */
     function validNumConverting(numConverting) {

         let convConfig = Config.getConvert()
         let warnThresh = convConfig.warnThreshold
         let errThresh = convConfig.errorThreshold

         if (numConverting >= warnThresh && numConverting < errThresh) {

             alert("warning: converting " + numConverting + " voxels could cause performance issues")

         } else if (numConverting >= errThresh) {

             alert("error: converting " + numConverting + " voxels would cause performance issues")
             User.setSelectMode()
             convertedVoxels = {}
             return false

         }

         return true

     }

     /**
      * Add the voxels in convertedVoxels to the
      * buffer mesh before it is added to the scene
      * @memberOf PixVoxConversion
      * @access private
      */
     function addToBufMesh() {

         function hidePixel(voxel, sid) {

             let pIdx = voxel.pIdx

             if (voxel.exp) pSystemExpansion.hidePixel(pIdx)
             else pSystem.hidePixel(sid, pIdx)

         }

         let pSystemExpansion = GameScene.getPSystemExpo()
         let pSystem = GameScene.getPSystem()

         let gPos
         let wPos
         let sid
         let currVox

         let i = 0
         let bufVertsLen = BufMeshMgr.getBufVertsLen()

         for (let voxPos in convertedVoxels) {

             gPos = VoxelUtils.coordStrParse(voxPos).initGridPos()
             wPos = gPos.clone().gridToWorld()
             sid = VoxelUtils.getSectionIndices(gPos)
             currVox = convertedVoxels[voxPos]

             let hColor = currVox.hColor
             let tColor = new THREE.Color(hColor)

             /*// vvv black magic, don't touch
             if (i === 0) console.log(wPos)
             // ^^^ somehow fixes raycast lag*/

             BufMeshMgr.addVoxel(i, wPos, tColor)
             hidePixel(currVox, sid)
             currVox.bIdx = i

             i += bufVertsLen

         }

         let bufMesh = BufMeshMgr.getBufMesh()

         Raycast.add(bufMesh)
         GameScene.addToScene(bufMesh)

     }

     /*********** expose public methods *************/

    return {
        init: init,
        convertToVoxels: convertToVoxels,
        convertToPixels: convertToPixels,
        addToConvertedVoxels: addToConvertedVoxels,
        removeFromConvertedVoxels: removeFromConvertedVoxels
    }

}()

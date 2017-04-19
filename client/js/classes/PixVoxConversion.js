'use strict'

/**
 * Manages conversion between voxels
 * and pixels
 * @namespace PixVoxConversion
 */
var PixVoxConversion = function(window, undefined) {

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    var convertedVoxels

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
        var numCubes = addRegionToConvertedVoxels(region)

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

        var i = 0
        var worldData = WorldData.getWorldData()

        var pSystemExpo = GameScene.getPSystemExpo()
        var pSystem = GameScene.getPSystem()

        for (var voxPos in convertedVoxels) {

            // get basic info we need
            var gPos = VoxelUtils.coordStrParse(voxPos)
            gPos = new THREE.Vector3(gPos.x, gPos.y, gPos.z).initGridPos()
            var wPos = gPos.clone().gridToWorld()

            var sid = VoxelUtils.getSectionIndices(gPos)
            var vox = WorldData.getVoxel(sid, voxPos)

            if (vox) {

                if (vox.isMesh) { // newly added in selected region

                    var tColor = vox.geometry.faces[0].color

                    // add to particle system expo
                    var pIdx = pSystemExpo.addPixel(gPos, tColor)
                    var coordStr = VoxelUtils.getCoordStr(gPos)

                    var username = User.getUName()

                    // overwrite mesh with voxel entry
                    WorldData.addVoxel(sid, coordStr, tColor.getHex(), username, pIdx, true)

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

        var bufMesh = BufMeshMgr.getBufMesh()
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
        var worldData = WorldData.getWorldData()
        convertedVoxels[coord] = worldData[sid.a][sid.b][coord]
    }

    /**
     * Remove a voxel from the convertedVoxels object
     * @memberOf PixVoxConversion
     * @access public
     * @param {VoxelUtils.Tuple} sid Section indices of the
     * voxel we are removing
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

         var spsg = Config.getGrid().sqPerSideOfGrid

         var c1 = region.corner1
         var c2 = region.corner2

         var minxz = -(spsg / 2)
         var maxxz = spsg / 2

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

         var worldData = WorldData.getWorldData()

         var c1 = region.corner1
         var c2 = region.corner2

         var c1Sid = VoxelUtils.getSectionIndices(c1)
         var c2Sid = VoxelUtils.getSectionIndices(c2)

         var numConverted = 0

         for (var x = c1Sid.a; x <= c2Sid.a; x++) {
             for (var z = c1Sid.b; z <= c2Sid.b; z++) {
                 for (var voxPos in worldData[x][z]) {
                     var gPos = VoxelUtils.coordStrParse(voxPos)
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

         var convConfig = Config.getConvert()
         var warnThresh = convConfig.warnThreshold
         var errThresh = convConfig.errorThreshold

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

             var pIdx = voxel.pIdx

             if (voxel.exp) pSystemExpansion.hidePixel(pIdx)
             else pSystem.hidePixel(sid, pIdx)

         }

         var pSystemExpansion = GameScene.getPSystemExpo()
         var pSystem = GameScene.getPSystem()

         var gPos
         var wPos
         var sid
         var currVox

         var i = 0
         var bufVertsLen = BufMeshMgr.getBufVertsLen()

         for (var voxPos in convertedVoxels) {

             gPos = VoxelUtils.coordStrParse(voxPos).initGridPos()
             wPos = gPos.clone().gridToWorld()
             sid = VoxelUtils.getSectionIndices(gPos)
             currVox = convertedVoxels[voxPos]

             var hColor = currVox.c
             var tColor = new THREE.Color(hColor)

             /*// vvv black magic, don't touch
             if (i === 0) console.log(wPos)
             // ^^^ somehow fixes raycast lag*/

             BufMeshMgr.addVoxel(i, wPos, tColor)
             hidePixel(currVox, sid)
             currVox.bIdx = i

             i += bufVertsLen

         }

         var bufMesh = BufMeshMgr.getBufMesh()

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

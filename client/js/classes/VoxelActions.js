'use strict'

/**
 * This module manages the creation and deletion
 * of voxels
 * @namespace VoxelActions
 */
let VoxelActions = function(window, undefined) {

    /*------------------------------------*
     :: Public Methods
     *------------------------------------*/

    /**
     * Creates a voxel mesh at the specified
     * grid position
     * @memberOf VoxelActions
     * @access public
     * @param  {VoxelUtils.GridVector3} gPos The grid position
     * to create the voxel at
     * @param  {string} hexString Hex color of the voxel
     */
    function createVoxelAtGridPos(gPos, hexString, username) {

        let voxelMesh = VoxelUtils.initVoxel({
            color: VoxelUtils.hexStringToDec(hexString),
            gPos: gPos
        })

        let sid = VoxelUtils.getSectionIndices(gPos)

        let coordStr = VoxelUtils.getCoordStr(gPos)
        WorldData.addMesh(sid, coordStr, voxelMesh, username)

        Raycast.add(voxelMesh)
        PixVoxConversion.addToConvertedVoxels(sid, coordStr)

        WorldData.addToUserData(username, gPos)

        GameScene.addToScene(voxelMesh)
        GameScene.render()

    }

    /**
     * Creates a voxel at a position based on the
     * given intersect
     * @memberOf VoxelActions
     * @access public
     * @param  {THREE.Intersect} intersect The intersect
     * @param  {Function} done Called upon completion
     */
    function createVoxelAtIntersect(intersect, done) {

        let gPos = intersect.point
        gPos.add(intersect.face.normal)
        gPos.initWorldPos()
        gPos.worldToGrid()

        let hexString = GUI.getBlockColor()

        SocketHandler.emitBlockAdded(gPos, hexString, function(response) {

            let responses = SocketResponses.get()

            if (response === responses.success) {
                createVoxelAtGridPos(gPos, hexString, User.getUName())
                return done(true)
            } else {
                console.debug(response)
                if (response === 'max') {
                    let maxVoxels = Config.getGeneral().maxGlobalBlocks
                    alert('Maximum voxel limit of ' + maxVoxels + ' reached.')
                }
                return done(false)
            }

        })

    }

    /**
     * Deletes a voxel mesh. This is a voxel that
     * was newly created after the conversion from
     * pixels to voxels
     * @memberOf VoxelActions
     * @access public
     * @param  {VoxelUtils.GridVector3} gPos Grid position of the voxel to delete
     */
    function deleteVoxelAtGridPos(gPos) {

        let voxel = WorldData.getVoxel(gPos)

        // newly created, delete mesh
        if (voxel.isMesh) deleteNewVoxel(gPos)
        // part of buffer geom, delete from buf
        else deleteMergedVoxel(gPos, false)

    }

    /**
     * Deletes a voxel at a position based on the
     * given intersect
     * @memberOf VoxelActions
     * @access public
     * @param  {THREE.Intersect}   intersect The intersect
     * @param  {Function} done      Called upon completion
     */
    function deleteVoxelAtIntersect(intersect, done) {

        let iobj = intersect.object

        if (iobj.name !== 'plane') {

            let gPos
            let successFunc
            if (iobj.name === 'voxel') {

                gPos = iobj.position.clone()
                gPos.initWorldPos()
                gPos.worldToGrid()

                successFunc = deleteNewVoxel

            } else {

                gPos = (intersect.point).sub(intersect.face.normal)
                gPos.worldToGrid()

                successFunc = deleteMergedVoxel

            }

            SocketHandler.emitBlockRemoved(gPos, function(response) {
                let responses = SocketResponses.get()
                if (response === responses.success) {
                    successFunc(gPos)
                    return done(true)
                } else { // handle errs
                    console.debug(response)
                    return done(false)
                }
            })

        }

    }

    /**
     * Deletes a pixel at the specified grid position
     * @memberOf VoxelActions
     * @access public
     * @param  {VoxelUtils.GridVector3} gPos The grid position
     */
    function deletePixelAtGridPos(gPos) {

        let vox = WorldData.getVoxel(gPos)

        // part of expansion
        if (vox.exp) GameScene.getPSystemExpo().hidePixel(vox.pIdx)
        // part of original
        else GameScene.getPSystem().hidePixel(sid, vox.pIdx)

        let username = vox.isMesh ? vox.userData.username : vox.username
        WorldData.removeFromUserData(username, gPos)
        WorldData.removeVoxel(gPos)

        GameScene.render()

    }

    /*------------------------------------*
     :: Private Methods
     *------------------------------------*/

    /**
     * Deletes a specified voxel mesh. This is a voxel that has been added to the
     * selected region since its selection
     * @memberOf VoxelActions
     * @access private
     * @param {VoxelUtils.GridVector3} gPos Grid position of the voxel to delete
     */
    function deleteNewVoxel(gPos) {

        let vox = WorldData.getVoxel(gPos)

        let coordStr = VoxelUtils.getCoordStr(gPos)

        GameScene.removeFromScene(vox)

        let username = vox.isMesh ? vox.userData.username : vox.username
        WorldData.removeFromUserData(username, gPos)
        WorldData.removeVoxel(gPos)

        Raycast.remove(vox)
        PixVoxConversion.removeFromConvertedVoxels(coordStr)

        if (vox.exp) {
            GameScene.getPSystemExpo().deletePixel(vox.pIdx)
        }

        GameScene.render()

    }

    /**
     * Deletes a specified voxel from the buffer geometry. This is a voxel
     * that was created upon initial conversion from pixels to voxels.
     * @memberOf VoxelActions
     * @access private
     * @param {VoxelUtils.GridVector3} gPos Grid position of the voxel to delete
     */
    function deleteMergedVoxel(gPos) {

        let vox = WorldData.getVoxel(gPos)
        let coordStr = VoxelUtils.getCoordStr(gPos)

        BufMeshMgr.removeVoxel(vox.bIdx)
        PixVoxConversion.removeFromConvertedVoxels(coordStr)

        let username = vox.isMesh ? vox.userData.username : vox.username
        WorldData.removeFromUserData(username, gPos)
        WorldData.removeVoxel(gPos)

        if (vox.exp) {
            GameScene.getPSystemExpo().hidePixel(vox.pIdx)
        }

        GameScene.render()

    }

    /*********** expose public methods *************/

    return {

        createVoxelAtGridPos: createVoxelAtGridPos,
        createVoxelAtIntersect: createVoxelAtIntersect,
        deleteVoxelAtIntersect: deleteVoxelAtIntersect,
        deleteVoxelAtGridPos: deleteVoxelAtGridPos,
        deletePixelAtGridPos: deletePixelAtGridPos

    }

}(window)

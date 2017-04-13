'use strict'

/**
 * This module manages the creation and deletion
 * of voxels
 * @namespace VoxelActions
 */
var VoxelActions = function(window, undefined) {

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
     * @param  {number} hColor Hex color of the voxel
     */
    function createVoxelAtGridPos(gPos, hColor) {

        var voxelMesh = VoxelUtils.initVoxel({
            color: hColor,
            gPos: gPos
        })

        var sid = VoxelUtils.getSectionIndices(gPos)

        var coordStr = VoxelUtils.getCoordStr(gPos)
        WorldData.addMesh(sid, coordStr, voxelMesh)

        Raycast.add(voxelMesh)
        PixVoxConversion.addToConvertedVoxels(sid, coordStr)

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

        var gPos = intersect.point
        gPos.add(intersect.face.normal)
        gPos.initWorldPos()
        gPos.worldToGrid()

        var hColor = GUI.getBlockColor()

        SocketHandler.emitBlockAdded(gPos, hColor, function(success) {
            if (success) {
                createVoxelAtGridPos(gPos, hColor)
                done()
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

        var sid = VoxelUtils.getSectionIndices(gPos)
        var coordStr = VoxelUtils.getCoordStr(gPos)
        var voxel = WorldData.getVoxel(sid, coordStr)

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

        var iobj = intersect.object

        if (iobj.name !== 'plane') {

            var gPos
            if (iobj.name === 'voxel') {

                gPos = iobj.position.clone()
                gPos.initWorldPos()
                gPos.worldToGrid()

                SocketHandler.emitBlockRemoved(gPos, function(success) {
                    if (success) {
                        deleteNewVoxel(gPos)
                        done(success)
                    }
                })

            } else {

                gPos = (intersect.point).sub(intersect.face.normal)
                gPos.initWorldPos()
                gPos.worldToGrid()

                SocketHandler.emitBlockRemoved(gPos, function(success) {
                    if (success) {
                        deleteMergedVoxel(gPos)
                        done(success)
                    }
                })

            }

        }

    }

    /**
     * Deletes a voxel at the specified grid position
     * @memberOf VoxelActions
     * @access public
     * @param  {VoxelUtils.GridVector3} gPos The grid position
     */
    function deletePixelAtGridPos(gPos) {

        var sid = VoxelUtils.getSectionIndices(gPos)
        var coordStr = VoxelUtils.getCoordStr(gPos)
        var vox = WorldData.getVoxel(sid, coordStr)

        // part of expansion
        if (vox.exp) GameScene.getPSystemExpo().hidePixel(vox.pIdx)
        // part of original
        else GameScene.getPSystem().hidePixel(sid, vox.pIdx)

        WorldData.removeVoxel(sid, coordStr)

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

        var sid = VoxelUtils.getSectionIndices(gPos)
        var coordStr = VoxelUtils.getCoordStr(gPos)
        var vox = WorldData.getVoxel(sid, coordStr)

        GameScene.removeFromScene(vox)
        WorldData.removeVoxel(sid, coordStr)
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

        var sid = VoxelUtils.getSectionIndices(gPos)
        var coordStr = VoxelUtils.getCoordStr(gPos)
        var vox = WorldData.getVoxel(sid, coordStr)

        BufMeshMgr.removeVoxel(vox.bIdx)
        PixVoxConversion.removeFromConvertedVoxels(coordStr)
        WorldData.removeVoxel(sid, coordStr)

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

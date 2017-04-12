var ActionMgr = function(window, undefined) {

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

    function createVoxelAtIntersect(intersect, done) {

        var gPos = intersect.point
        gPos.add(intersect.face.normal)
        gPos.initWorldPos()
        gPos.worldToGrid()

        var hColor = GUI.getBlockColor()

        SocketHandler.emitBlockAdded(gPos, hColor, function(success) {
            if (success) createVoxelAtGridPos(gPos, hColor)
        })

    }

    /**
     * Deletes a specified voxel mesh. This is a voxel that has been added to the
     * selected region since its selection
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
     * @param {VoxelUtils.GridVector3} gPos Grid position of the voxel to delete
     * @param {boolean} emit Whether or not to broadcast the delete via socket.emit
     */
    function deleteMergedVoxel(gPos) {

        var sid = VoxelUtils.getSectionIndices(gPos)
        var coordStr = VoxelUtils.getCoordStr(gPos)
        var vox = WorldData.getVoxel(sid, coordStr)

        BufMeshMgr.removeVoxel(vox.bIdx)
        PixVoxConversion.removeFromConvertedVoxels(coordStr)
        WorldData.removeVoxel(sid, coordStr)

        if (vox.exp) {
            GameScene.getPSystemExpo().deletePixel(vox.pIdx)
        }

        GameScene.render()

    }

    function deleteVoxelAtIntersect(intersect, done) {

        var iobj = intersect.object

        if (iobj.name !== 'plane') {

            if (iobj.name === 'voxel') {

                var gPos = iobj.position.clone()
                gPos.initWorldPos()
                gPos.worldToGrid()

                SocketHandler.emitBlockRemoved(gPos, function(success) {
                    if (success) {
                        deleteNewVoxel(gPos)
                        done()
                    }
                })

            } else {

                var gPos = (intersect.point).sub(intersect.face.normal)
                gPos.initWorldPos()
                gPos.worldToGrid()

                SocketHandler.emitBlockRemoved(gPos, function(success) {
                    if (success) {
                        deleteMergedVoxel(gPos)
                        done()
                    }
                })

            }

        }

    }

    return {

        createVoxelAtIntersect: createVoxelAtIntersect,
        createVoxelAtGridPos: createVoxelAtGridPos,
        deleteVoxelAtIntersect: deleteVoxelAtIntersect

    }

}(window)

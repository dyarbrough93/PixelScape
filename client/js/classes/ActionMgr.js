var ActionMgr = function(window, undefined) {

    function createNewVoxel(gPos, hColor, emit, done) {

        var voxelMesh = VoxelUtils.initVoxel({
            color: hColor,
            gPos: gPos
        })

        function addVoxelMesh() {

            var sid = VoxelUtils.getSectionIndices(gPos)

            var coordStr = VoxelUtils.getCoordStr(gPos)
            WorldData.addMesh(sid, coordStr, voxelMesh)

            Raycast.add(voxelMesh)
            PixVoxConversion.addToConvertedVoxels(sid, coordStr)

            GameScene.addToScene(voxelMesh)
            GameScene.render()

            done()

        }

        if (emit) {
            socket.emit('block added', {
                color: hColor,
                position: {
                    x: gPos.x,
                    y: gPos.y,
                    z: gPos.z
                }
            }, function(response) {

                if (response === 'success')
                    addVoxelMesh()
                else if (response === 'max')
                    alert('maximum voxel limit reached.')

            })
        } else addVoxelMesh()
    }

    function createVoxel(intersect, done) {

        var gPos = intersect.point
        gPos.add(intersect.face.normal)
        gPos.initWorldPos()
        gPos.worldToGrid()

        createNewVoxel(gPos, GUI.getBlockColor(), true, done)

    }

    function broadcastRemove(gPos, cb) {

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
     * Deletes a specified voxel mesh. This is a voxel that has been added to the
     * selected region since its selection
     * @param {VoxelUtils.GridVector3} gPos Grid position of the voxel to delete
     * @param {boolean} emit Whether or not to broadcast the delete via socket.emit
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

    function deleteVoxel(intersect, done) {

        var iobj = intersect.object

        if (iobj.name !== 'plane') {

            if (iobj.name === 'voxel') {

                var gPos = iobj.position.clone()
                gPos.initWorldPos()
                gPos.worldToGrid()

                broadcastRemove(gPos, function(success) {
                    if (success) {
                        deleteNewVoxel(gPos)
                        done()
                    }
                })

            } else {

                var gPos = (intersect.point).sub(intersect.face.normal)
                gPos.initWorldPos()
                gPos.worldToGrid()

                broadcastRemove(gPos, function(success) {
                    if (success) {
                        deleteMergedVoxel(gPos)
                        done()
                    }
                })

            }

        }

    }

    return {

        createVoxel: createVoxel,
        deleteVoxel: deleteVoxel

    }

}(window)

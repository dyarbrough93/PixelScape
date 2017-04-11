var PixVoxConversion = function(window, undefined) {

    var convertedVoxels

    function init() {

        convertedVoxels = {}

    }

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

    function validNumConverting(numConverting) {

        var convConfig = Config.getConvert()
        var warnThresh = convConfig.warnThreshold
        var errThresh = convConfig.errorThreshold

        if (numConverting >= warnThresh && numConverting < errThresh) {

            alert("warning: converting " + numConverting + " voxels could cause performance issues")

        } else if (numConverting >= errThresh) {

            alert("error: converting " + numConverting + " voxels would cause performance issues")
            UserState.setSelectMode()
            convertedVoxels = {}
            return false

        }

        return true

    }

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
        var vox

        var worldData = WorldData.getWorldData()

        var i = 0
        var bufVertsLen = BufMeshMgr.getBufVertsLen()

        for (var voxPos in convertedVoxels) {

            gPos = VoxelUtils.coordStrParse(voxPos).initGridPos()
            wPos = gPos.clone().gridToWorld()
            sid = VoxelUtils.getSectionIndices(gPos)
            currVox = convertedVoxels[voxPos]

            var hColor = currVox.c
            var tColor = new THREE.Color(hColor)

            // vvv black magic, don't touch
            if (i === 0) console.log(wPos)
            // ^^^ somehow fixes raycast lag

            BufMeshMgr.addVoxel(i, wPos, tColor)
            hidePixel(currVox, sid)
            currVox.bIdx = i

            i += bufVertsLen

        }

        var bufMesh = BufMeshMgr.getBufMesh()

        Raycast.add(bufMesh)
        GameScene.addToScene(bufMesh)

    }

    function convertToVoxels(region) {

        constrainRegion(region)
        var numCubes = addRegionToConvertedVoxels(region)

        if (validNumConverting(numCubes)) {

            BufMeshMgr.createBufMesh(numCubes, GameScene.getScene())
            addToBufMesh()
            GameScene.render()

        }

    }

    function addNewPixel(vox, gPos) {

    }

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
                    var sid = VoxelUtils.getSectionIndices(gPos)
                    var coordStr = VoxelUtils.getCoordStr(gPos)
                    WorldData.addVoxel(sid, tColor.getHex(), pIdx, true, coordStr)

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

    function addToConvertedVoxels(sid, coord) {
        var worldData = WorldData.getWorldData()
        convertedVoxels[coord] = worldData[sid.a][sid.b][coord]
    }

    function removeFromConvertedVoxels(coord) {
        delete convertedVoxels[coord]
    }

    return {
        init: init,
        convertToVoxels: convertToVoxels,
        convertToPixels: convertToPixels,
        addToConvertedVoxels: addToConvertedVoxels,
        removeFromConvertedVoxels: removeFromConvertedVoxels
    }

}()

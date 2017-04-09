var PixVoxConversion = function(window, undefined) {

    var convertedVoxels

    function init() {

        convertedVoxels = []

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

    function addToConvertedVoxels(region) {

        var worldData = WorldData.getWorldData()

        var c1 = region.corner1
        var c2 = region.corner2

        var c1Sid = VoxelUtils.getSectionIndices(c1)
        var c2Sid = VoxelUtils.getSectionIndices(c2)

        for (var x = c1Sid.a; x <= c2Sid.a; x++) {
            for (var z = c1Sid.b; z <= c2Sid.b; z++) {
                for (var voxPos in worldData[x][z]) {
                    var gPos = VoxelUtils.coordStrParse(voxPos)
                    if (VoxelUtils.withinSelectionBounds(gPos))
                        convertedVoxels.push(voxPos)
                }
            }
        }
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
            convertedVoxels = []
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
        convertedVoxels.forEach(function(voxPos) {

            gPos = VoxelUtils.coordStrParse(voxPos).initGridPos()
            wPos = gPos.clone().gridToWorld()
            sid = VoxelUtils.getSectionIndices(gPos)
            currVox = worldData[sid.a][sid.b][voxPos]

            var hColor = currVox.c
            var tColor = new THREE.Color(hColor)

            // vvv black magic, don't touch
            if (i === 0) console.log(wPos)
            // ^^^ somehow fixes raycast lag

            BufMeshMgr.addVoxel(i, wPos, tColor)

            hidePixel(currVox, sid)

            currVox.bIdx = i

            i += bufVertsLen

        })

        var bufMesh = BufMeshMgr.getBufMesh()

        Raycast.add(bufMesh)
        GameScene.addToScene(bufMesh)

    }

    function convertToVoxels(region) {

        constrainRegion(region)
        addToConvertedVoxels(region)

        var numCubes = convertedVoxels.length
        if (validNumConverting(numCubes)) {

            BufMeshMgr.createBufMesh(numCubes, GameScene.getScene())
            addToBufMesh()
            GameScene.render()

        }

    }

    function convertToPixels() {

    }

    return {
        init: init,
        convertToVoxels: convertToVoxels,
        convertToPixels: convertToPixels
    }

}()

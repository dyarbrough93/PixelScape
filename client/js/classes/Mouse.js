var Mouse = function(window, undefined) {

    var pos

    function init() {

        pos = new THREE.Vector2()

        addEventListeners()

    }

    function addEventListeners() {
        document.addEventListener('mousemove', mouseMove)
        document.addEventListener('mousedown', mouseDown)
    }

    function removeEventListenerers() {
        document.removeEventListener('mousemove', mouseMove)
        document.removeEventListener('mousedown', mouseDown)
    }

    function mouseDown(e) {
        if (e.which === 1) leftDown(e)
    }

    function validHeight(pos) {

        // too high?
        if (pos.y >= Config.get().maxVoxelHeight) {

            if (!Keys.shiftDown() && !UserState.stateIsPick()) {
                alert('Max height reached.')
                return false
            }

        }

        // too low?
        if (pos.y < 0) return false

        return true

    }

    /**
     * Checks to see if a coordinate is within the bounds of the
     * currently selected region.
     * @memberOf! VoxelWorld
     * @param {VoxelUtils.GridVector3} gPos Grid position to check
     * @returns {boolean}
     */
    function withinSelectionBounds(gPos) {

        var selectedRegion = UserState.getSelectedRegion()

        return (gPos.x >= selectedRegion.corner1.x &&
            gPos.z >= selectedRegion.corner1.z &&
            gPos.x <= selectedRegion.corner2.x &&
            gPos.z <= selectedRegion.corner2.z)

    }

    function validEdit(intxGPos) {

        return validHeight(intxGPos) &&
            withinSelectionBounds(intxGPos)

    }

    function leftDown(e) {

        e.preventDefault()

        var intersect = getMouseIntersects(e).closestIntx

        if (intersect) {

            var intxGPos = intersect.point.clone().initWorldPos()
            intxGPos = intxGPos.add(intersect.face.normal).worldToGrid()

            if (UserState.modeIsEdit()) {

            } else if (UserState.modeIsEdit()) {

                if (validEdit(intxGPos)) {

                    if (UserState.stateIsPick())
                        GUI.setPickColor(intersect)
                    else if (Keys.shiftDown())
                        GameScene.deleteVoxel(intersect)
                    else GameScene.createVoxel(intersect)

                }

            } else if (UserState.modeIsSelect()) {

                UserState.setSelectedRegion(intxGPos)
                var region = UserState.getSelectedRegion()
                PixVoxConversion.convertToVoxels(region)

            }

        }

    }

    function mouseMove(e) {

        e.preventDefault()

        var intersects = getMouseIntersects(e)
        var intersect = intersects.closestIntx

        if (intersect) {

            if (UserState.modeIsEdit()) {

                if (intersect.object.name === 'plane')
                    GameScene.setDeleteMeshVis(false)

                else if (Keys.shiftDown()) {

                    GameScene.setDeleteMeshVis(true)
                    GameScene.setDeleteMeshPos(intersect)

                } else {

                    GameScene.setGhostMeshVis(false)


                }

            } else if (UserState.modeIsSelect()) {

                var planeIntx = intersects.planeIntx

                if (planeIntx) {

                    GameScene.moveRegionSelectPlane(planeIntx)

                }

            }

        }

    }

    function getMouseIntersects(e) {

        var camera = GameScene.getCamera()

        pos.x = (e.clientX / window.innerWidth) * 2 - 1
        pos.y = -(e.clientY / window.innerHeight) * 2 + 1

        var intersects = Raycast.getIntersects(pos, camera)

        var minDist = Number.MAX_VALUE
        var closestIntx
        var planeIntx

        intersects.forEach(function(intx) {
            if (intx.distance < minDist) {
                closestIntx = intx
                minDist = intx.distance
            }
            if (intx.object.name === 'plane')
                planeIntx = intx
        })

        return {
            closestIntx: closestIntx,
            planeIntx: planeIntx
        }

    }

    function getPos() {
        return pos
    }

    return {
        init: init,
        getPos: getPos,
        mouseMove: mouseMove,
        leftDown: leftDown
    }

}(window)

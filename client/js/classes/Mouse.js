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

    function validEdit(intxGPos) {

        return VoxelUtils.validHeight(intxGPos) &&
            VoxelUtils.withinSelectionBounds(intxGPos)

    }

    function leftDown(e) {

        e.preventDefault()

        var intersect = getMouseIntersects(e).closestIntx

        if (intersect) {

            var intxGPos = intersect.point.clone().initWorldPos()
            intxGPos = intxGPos.add(intersect.face.normal).worldToGrid()

            if (UserState.modeIsEdit()) {

                if (validEdit(intxGPos)) {

                    if (UserState.stateIsPick())
                        GUI.setPickColor(intersect)
                    else if (Keys.isShiftDown())
                        ActionMgr.deleteVoxel(intersect)
                    else ActionMgr.createVoxel(intersect)

                }

            } else if (UserState.modeIsSelect()) {

                UserState.setSelectedRegion(intersect)
                var region = UserState.getSelectedRegion()
                PixVoxConversion.convertToVoxels(region)
                UserState.setEditMode()

            }

        }

        GameScene.render()

    }

    function mouseMove(e) {

        e.preventDefault()

        var intersects = getMouseIntersects(e)
        var intersect = intersects.closestIntx

        if (intersect) {

            if (UserState.modeIsEdit()) {

                GameScene.updateGhostMesh(intersect)

                if (intersect.object.name === 'plane')
                    GameScene.setDeleteMeshVis(false)

                else if (Keys.isShiftDown()) {

                    GameScene.setDeleteMeshVis(true)
                    GameScene.updateDeleteMesh(intersect)

                }

            } else if (UserState.modeIsSelect()) {

                var planeIntx = intersects.planeIntx

                if (planeIntx) {

                    GameScene.moveRegionSelectPlane(planeIntx)

                }

            }

        }

        GameScene.render()

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

var Mouse = function(window, undefined) {

    var pos

    function init() {

        pos = {}

        addEventListeners()

    }

    function addEventListeners() {

        // we are using a jQuery bind here so we can force
        // trigger a mouseMove event from mouseDown
        $(document).mousemove(mouseMove)
        document.addEventListener('mousedown', mouseDown)
    }

    function removeEventListenerers() {
        $(document).unbind('mousemove')
        document.removeEventListener('mousedown', mouseDown)
    }

    function mouseDown(e) {
        if (GUI.wasClicked()) {
            GUI.setClicked(false)
            return
        }
        if (e.which === 1) leftDown(e)
    }

    function validEdit(intxGPos) {

        return VoxelUtils.validHeight(intxGPos) &&
            VoxelUtils.withinSelectionBounds(intxGPos)

    }

    function forceTriggerMouseMove() {

        var e = $.Event('mousemove')
        e.clientX = pos.clientX
        e.clientY = pos.clientY

        mouseMove(e)

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
                    else if (Keys.isShiftDown()) {
                        ActionMgr.deleteVoxel(intersect, function() {
                            forceTriggerMouseMove()
                        })
                    } else {
                        ActionMgr.createVoxel(intersect, function() {
                            forceTriggerMouseMove()
                        })
                    }

                }

            } else if (UserState.modeIsSelect()) {

                UserState.setSelectedRegion(intersect)
                var region = UserState.getSelectedRegion()
                PixVoxConversion.convertToVoxels(region)
                UserState.setEditMode()

            }

        }

    }

    function mouseMove(e) {

        e.preventDefault()

        pos.clientX = e.clientX
        pos.clientY = e.clientY

        var intersects = getMouseIntersects(e)
        var intersect = intersects.closestIntx

        if (intersect) {

            if (UserState.modeIsEdit()) {

                GameScene.updateGhostMesh(intersect)
                GameScene.updateDeleteMesh(intersect)

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
        forceTriggerMouseMove: forceTriggerMouseMove,
        leftDown: leftDown
    }

}(window)

var Mouse = function(window, undefined) {

    var pos

    function init() {

        pos = new THREE.Vector2()

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

        /*return (gPos.x >= currentSelection.c1.x &&
        gPos.z >= currentSelection.c1.z &&
        gPos.x <= currentSelection.c2.x &&
        gPos.z <= currentSelection.c2.z &&
        gPos.y < maxVoxelHeight)*/
        
    }

    handleEdit(intxGPos) {

        if (!validHeight(intxGPos)) return
        if (!withinSelectionBounds(intxGPos)) return

    }

    function leftDown(e) {

        var intersect = getIntersect(e)

        if (intersect) {

            var intxGPos = intersect.point().clone().initWorldPos()
            intxGPos = intxGPos.add(intersect.face.normal).worldToGrid()

            if (UserState.modeIsEdit()) {

            } else if (UserState.modeIsEdit()) {

            }

        }

    }

    function leftUp(e) {

    }

    function rightDown(e) {

    }

    function rightUp(e) {

    }

    function getIntersect(e) {

        var camera = GameScene.getCamera()

        pos.x = (e.clientX / window.innerWidth) * 2
        pos.y = (e.clientY / window.innerHeight) * 2

        var intersects = Raycast.getIntersects(pos, camera)

        var minDist = Number.MAX_VALUE
        var intersect

        intersects.forEach(function(intx) {
            if (intx.distance < minDist) {
                intersect = intx
                minDist = intx.distance
            }
        })

        return intersect

    }

    function getPos() {
        return pos
    }

    return {
        init: init,
        getPos: getPos
    }

}()

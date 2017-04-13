'use strict'

/**
 * Manages and routes Mouse events
 * @namespace Mouse
 */
var Mouse = function(window, undefined) {

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    var pos

    /*------------------------------------*
     :: Public Methods
     *------------------------------------*/

    /**
     * Initializes the module. Must be called
     * before anything else
     * @memberOf Mouse
     * @access public
     */
    function init() {

        pos = {}

        addEventListeners()

    }

    /**
     * Route a mouse down event
     * @memberOf Mouse
     * @access public
     * @param  {Event} e
     */
    function mouseDown(e) {
        if (GUI.wasClicked()) {
            GUI.setClicked(false)
            return
        }
        if (e.which === 1) leftDown(e)
    }

    /**
     * Force trigger a mouse move event. This is
     * needed when certain changes are made that
     * require the specific functionality of the
     * mouse move event but cannot be extracted into
     * another function
     * @memberOf Mouse
     * @access public
     */
    function forceTriggerMouseMove() {

        var e = $.Event('mousemove')
        e.clientX = pos.clientX
        e.clientY = pos.clientY

        mouseMove(e)

    }

    /*------------------------------------*
     :: Private Methods
     *------------------------------------*/

    /**
     * Handle a left mouse button
     * down event
     * @memberOf Mouse
     * @access private
     * @param  {Event} e
     */
    function leftDown(e) {

        e.preventDefault()

        var intersect = getMouseIntersects(e).closestIntx

        if (intersect) { // only act if we intersected something

            var intxGPos = intersect.point.clone().initWorldPos()
            intxGPos = intxGPos.add(intersect.face.normal).worldToGrid()

            if (UserState.modeIsEdit()) {

                if (VoxelUtils.validBlockLocation(intxGPos)) {

                    if (UserState.stateIsPick())
                        GUI.setPickColor(intersect)
                    else { // create or delete

                        if (!UserState.canAct()) return
                        UserState.resetActionTimer()

                        if (Keys.isShiftDown()) { // delete voxel
                            VoxelActions.deleteVoxelAtIntersect(intersect, function(success) {
                                if (success) forceTriggerMouseMove()
                            })
                        } else { // create voxel
                            VoxelActions.createVoxelAtIntersect(intersect, function(success) {
                                if (success) forceTriggerMouseMove()
                            })
                        }

                    }

                }

            } else if (UserState.modeIsSelect()) {

                // switch to edit mode
                UserState.setSelectedRegion(intersect)
                var region = UserState.getSelectedRegion()
                PixVoxConversion.convertToVoxels(region)
                UserState.setEditMode()

            }

        }

    }

    /**
     * Handle a mouse move event
     * @memberOf Mouse
     * @access private
     * @param  {Event} e
     */
    function mouseMove(e) {

        e.preventDefault()

        pos.clientX = e.clientX
        pos.clientY = e.clientY

        var intersects = getMouseIntersects(e)
        var intersect = intersects.closestIntx

        if (intersect) { // only act if we intersected something

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

    /**
     * This gets the objects that the mouse
     * is currently intersecting based on the event\
     * @memberOf Mouse
     * @access private
     * @param  {Event} e
     * @return {object}
     * @return {{closestIntx: THREE.Intersect, planeIntx: THREE.Intersect}} closestIntx is
     * the object the mouse intersected that the is closest to the raycast origin. planeIntx
     * is the voxelPlane intersect, if there is one
     */
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

    /**
     * Add mouse event listeners to the document
     * @memberOf Mouse
     * @access private
     */
    function addEventListeners() {

        // we are using a jQuery bind here so we can force
        // trigger a mouseMove event from mouseDown
        $(document).mousemove(mouseMove)
        document.addEventListener('mousedown', mouseDown)
    }

    /**
     * Remove mouse event listeners to the document
     * @memberOf Mouse
     * @access private
     */
    function removeEventListeners() {
        $(document).unbind('mousemove')
        document.removeEventListener('mousedown', mouseDown)
    }

    /*********** expose public methods *************/

    return {
        init: init,
        forceTriggerMouseMove: forceTriggerMouseMove
    }

}(window)

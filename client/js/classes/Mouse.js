'use strict'

/**
 * Manages and routes Mouse events
 * @namespace Mouse
 */
let Mouse = function(window, undefined) {

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    let pos

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
     * Force trigger a mouse move event. This is
     * needed when certain changes are made that
     * require the specific functionality of the
     * mouse move event but cannot be extracted into
     * another function
     * @memberOf Mouse
     * @access public
     */
    function forceTriggerMouseMove() {

        let e = $.Event('mousemove')
        e.clientX = pos.clientX
        e.clientY = pos.clientY

        mouseMove(e)

    }

    /*------------------------------------*
     :: Private Methods
     *------------------------------------*/

     /**
      * Route a mouse down event
      * @memberOf Mouse
      * @access private
      * @param  {Event} e
      */
     function mouseDown(e) {

         if (GUI.wasClicked()) {
             GUI.setClicked(false)
             return
         }
         if (User.stateIsHighlight()) return
         if (e.which === 1) leftDown(e)
     }

    /**
     * Handle a left mouse button
     * down event
     * @memberOf Mouse
     * @access private
     * @param  {Event} e
     */
    function leftDown(e) {

        e.preventDefault()

        let intersect = getMouseIntersects(e).closestIntx

        if (intersect) { // only act if we intersected something

            let intxGPos = intersect.point.clone().initWorldPos()
            intxGPos = intxGPos.add(intersect.face.normal).worldToGrid()

            if (User.modeIsEdit()) {

                if (VoxelUtils.validBlockLocation(intxGPos)) {

                    if (User.stateIsPick())
                        GUI.setPickColor(intersect)
                    else { // create or delete

                        if (Keys.isShiftDown()) { // delete voxel

                            let deleteInfo = checkDelete(intersect)
                            if (!deleteInfo) return

                            VoxelActions.deleteVoxelAtIntersect(intersect, function(success) {
                                if (success) {
                                    forceTriggerMouseMove()
                                    GUI.resetActionTimer(deleteInfo.actionDelay, deleteInfo.timerID)
                                    if (deleteInfo.resetOwn) User.resetOwnActionTimer()
                                    else User.resetDeleteOtherTimer()
                                }
                            })
                        } else { // create voxel
                            if (!User.canActOnOwn()) {
                                GUI.popCircleTimer('#actOwnCircleTimer')
                                return
                            }
                            VoxelActions.createVoxelAtIntersect(intersect, function(success) {
                                if (success) {
                                    forceTriggerMouseMove()
                                    GUI.resetActionTimer(User.getActionDelay(), '#actOwnCircleTimer')
                                    User.resetOwnActionTimer()
                                }
                            })
                        }

                    }

                }

            } else if (User.modeIsSelect()) {

                // switch to edit mode
                User.setSelectedRegion(intersect)
                let region = User.getSelectedRegion()
                PixVoxConversion.convertToVoxels(region)
                User.setEditMode()

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

        if (e.ctrlKey) Keys.setCtrlDown(e.ctrlKey)
        if (e.shiftKey) Keys.setShiftDown(e.shiftKey)

        pos.clientX = e.clientX
        pos.clientY = e.clientY

        let intersects = getMouseIntersects(e)
        let intersect = intersects.closestIntx

        if (intersect) { // only act if we intersected something

            GUI.setCoords(intersects.planeIntx)

            if (User.modeIsEdit()) {

                if (User.stateIsDefault()) {
                    GameScene.updateGhostMesh(intersect)
                    GameScene.updateDeleteMesh(intersect)
                }

                if (User.stateIsHighlight())
                    GameScene.highlightUserVoxels(intersect)

            } else if (User.modeIsSelect()) {

                let planeIntx = intersects.planeIntx

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

        let camera = GameScene.getCamera()

        pos.x = (e.clientX / window.innerWidth) * 2 - 1
        pos.y = -(e.clientY / window.innerHeight) * 2 + 1

        let intersects = Raycast.getIntersects(pos, camera)

        let minDist = Number.MAX_VALUE
        let closestIntx
        let planeIntx

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

    function checkDelete(intersect) {

        let timerID
        let actionDelay
        let resetOwn

        let myUName = User.getUName()
        let voxelUName = WorldData.getUsernameAtIntersect(intersect)

        if (voxelUName !== myUName && voxelUName !== 'Guest') {
            if (!User.canDeleteOther()) {
                GUI.popCircleTimer('#actOtherCircleTimer')
                return false
            }
            timerID = '#actOtherCircleTimer'
            resetOwn = false
            actionDelay = User.getDeleteOtherDelay()
        } else {
            if (!User.canActOnOwn()) {
                GUI.popCircleTimer('#actOwnCircleTimer')
                return false
            }
            timerID = '#actOwnCircleTimer'
            resetOwn = true
            actionDelay = User.getActionDelay()
        }

        return {
            timerID: timerID,
            actionDelay: actionDelay,
            resetOwn: resetOwn
        }

   }

    /*********** expose public methods *************/

    return {
        init: init,
        forceTriggerMouseMove: forceTriggerMouseMove
    }

}(window)

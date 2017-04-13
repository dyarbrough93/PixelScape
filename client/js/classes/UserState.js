'use strict'

/**
 * Manages and stores the user's current state
 * @namespace UserState
 */
var UserState = function(window, undefined) {

    /*------------------------------------*
     :: Private Classes
     *------------------------------------*/

    /**
     * Represents a square region selection
     * @class RegionSelection
     * @property {THREE.Vector3} corner1 The top left corner
     * of the selection
     * @property {THREE.Vector3} corner2 The bottom right corner
     * of the selection
     */
    function RegionSelection(c1, c2) {
        return {
            corner1: c1,
            corner2: c2
        }
    }

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    var states
    var state
    var modes
    var mode
    var selectedRegion
    var actionTimer

    /*------------------------------------*
     :: Public Methods
     *------------------------------------*/

    /**
     * Initializes the module. Must be called
     * before anything else
     * @memberOf UserState
     * @access public
     */
    function init() {

        states = {
            DEFAULT: 0,
            PICKCOLOR: 1
        }

        modes = {
            SELECT: 0,
            EDIT: 1
        }

        state = states.DEFAULT
        mode = modes.SELECT

        selectedRegion = new RegionSelection(0, 0)

        actionTimer = new Date()

    }

    function resetActionTimer() {
        actionTimer = new Date()
    }

    function canAct() {
        var actionDelay = Config.getGeneral().actionDelay
        return new Date(new Date() - actionTimer).getMilliseconds() > actionDelay
    }

    /**
     * Set the selected region based on the given intersect
     * @memberOf UserState
     * @access public
     * @param {THREE.Intersect} intersect The intersect
     */
    function setSelectedRegion(intersect) {

        var gPos = intersect.point.clone().initWorldPos()
        gPos.add(intersect.face.normal).worldToGrid()

        var halfSpssp = (Config.getGrid().sqPerSideOfSelectPlane - 1) / 2

        var x1 = gPos.x - halfSpssp
        var x2 = gPos.x + halfSpssp
        var z1 = gPos.z - halfSpssp
        var z2 = gPos.z + halfSpssp

        var c1 = new THREE.Vector3(x1, 0, z1).initGridPos()
        var c2 = new THREE.Vector3(x2, 0, z2).initGridPos()

        if (!selectedRegion) selectedRegion = new RegionSelection(c1, c2)

        else {

            selectedRegion.corner1 = c1
            selectedRegion.corner2 = c2

        }
    }

    /*********** setters *************/

    function setDefaultState() {
        state = states.DEFAULT
        $('body').css('cursor', 'default')
    }

    function setPickState() {
        state = states.PICKCOLOR
        $('body').css('cursor', 'url(/img/eyedropper2.cur), auto')
    }

    function setEditMode() {
        mode = modes.EDIT
    }

    function setSelectMode() {
        mode = modes.SELECT
    }

    /*********** getters *************/

    function modeIsSelect() {
        return mode === modes.SELECT
    }

    function modeIsEdit() {
        return mode === modes.EDIT
    }

    function stateIsPick() {
        return state === states.PICKCOLOR
    }

    function getSelectedRegion() {
        return selectedRegion
    }

    function resetSelectedRegion() {
        selectedRegion = undefined
    }

    /*********** expose public methods *************/

    return {
        init: init,
        canAct: canAct,
        resetActionTimer,
        modeIsSelect: modeIsSelect,
        modeIsEdit: modeIsEdit,
        stateIsPick: stateIsPick,
        setDefaultState: setDefaultState,
        setEditMode: setEditMode,
        setSelectMode: setSelectMode,
        setPickState: setPickState,
        getSelectedRegion: getSelectedRegion,
        setSelectedRegion: setSelectedRegion,
        resetSelectedRegion: resetSelectedRegion
    }

}(window)

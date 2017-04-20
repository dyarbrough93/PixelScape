'use strict'

/**
 * Manages and stores the user's current state
 * @namespace UserState
 */
var User = function(window, undefined) {

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
    var currentHoveredUser

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
            PICKCOLOR: 1,
            HIGHLIGHT: 2
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

    /**
     * Reset the action timer to delay
     * actions again
     * @memberOf UserState
     * @access public
     */
    function resetActionTimer() {
        actionTimer = new Date()
    }

    /**
     * Checks if the user can act
     * based on the actionDelay config
     * setting and the last time acted
     * @memberOf UserState
     * @access public
     * @return {boolean}
     */
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

    /**
     * Set the user state to default
     * @memberOf UserState
     * @access public
     */
    function setDefaultState() {
        state = states.DEFAULT
        GameScene.removeOutlines()
        $('body').css('cursor', 'default')
    }

    /**
     * Set the user state to PICKCOLOR
     * @memberOf UserState
     * @access public
     */
    function setPickState() {
        state = states.PICKCOLOR
        $('body').css('cursor', 'url(/img/eyedropper2.cur), auto')
    }

    function setHighlightState() {
        state = states.HIGHLIGHT
        $('body').css('cursor', 'pointer')
    }

    /**
     * Set the user mode to edit
     * @memberOf UserState
     * @access public
     */
    function setEditMode() {
        mode = modes.EDIT
    }

    /**
     * Set the user mode to select
     * @memberOf UserState
     * @access public
     */
    function setSelectMode() {
        mode = modes.SELECT
    }

    /**
     * Set the currently selected region
     * to undefined
     * @memberOf UserState
     * @access public
     */
    function resetSelectedRegion() {
        selectedRegion = undefined
    }

    function setCurrentHoveredUser(user) {
        currentHoveredUser = user
    }

    /*********** getters *************/

    /**
     * Is the user mode select?
     * @memberOf UserState
     * @access public
     * @return {boolean}
     */
    function modeIsSelect() {
        return mode === modes.SELECT
    }

    /**
     * Is the user mode edit?
     * @memberOf UserState
     * @access public
     * @return {boolean}
     */
    function modeIsEdit() {
        return mode === modes.EDIT
    }

    /**
     * Is the user state pick?
     * @memberOf UserState
     * @access public
     * @return {boolean}
     */
    function stateIsPick() {
        return state === states.PICKCOLOR
    }

    function stateIsHighlight() {
        return state === states.HIGHLIGHT
    }

    function stateIsDefault() {
        return state === states.DEFAULT
    }

    /**
     * Get the currently selected region
     * @memberOf UserState
     * @access public
     * @return {User.RegionSelection}
     */
    function getSelectedRegion() {
        return selectedRegion
    }

    function getUName() {
        var username = $('#user #username').html()
        if (!username) username = 'Guest'
        var res = /[a-zA-Z0-9_]+/.exec(username)
        if (res) username = res[0]
        return username
    }

    function getCurrentHoveredUser() {
        return currentHoveredUser
    }

    /*********** expose public methods *************/

    return {
        init: init,
        canAct: canAct,
        getUName: getUName,
        resetActionTimer: resetActionTimer,
        modeIsSelect: modeIsSelect,
        modeIsEdit: modeIsEdit,
        stateIsPick: stateIsPick,
        stateIsHighlight: stateIsHighlight,
        stateIsDefault: stateIsDefault,
        setDefaultState: setDefaultState,
        setHighlightState: setHighlightState,
        setEditMode: setEditMode,
        setSelectMode: setSelectMode,
        setPickState: setPickState,
        getSelectedRegion: getSelectedRegion,
        setSelectedRegion: setSelectedRegion,
        resetSelectedRegion: resetSelectedRegion,
        getCurrentHoveredUser: getCurrentHoveredUser,
        setCurrentHoveredUser: setCurrentHoveredUser
    }

}(window)

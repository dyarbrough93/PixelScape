'use strict'

/**
 * Manages and stores the user's current state
 * @namespace UserState
 */
let User = function(window, undefined) {

    /*------------------------------------*
     :: Classes
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

    let states
    let state
    let modes
    let mode
    let selectedRegion
    let actionTimer
    let deleteOtherTimer
    let currentHoveredUser
    let actionDelay
    let deleteOtherDelay

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

        setDefaultState()
        setSelectMode()

        selectedRegion = new RegionSelection(0, 0)

        let re = /[\w-]+/
        let res = re.exec(window.location.pathname)
        let config = Config.getGeneral()

        if (res && res[0] === 'guest') {
             actionDelay = config.guestActionDelay
             deleteOtherDelay = config.guestDeleteOtherDelay
         }
        else {
            actionDelay = config.actionDelay
            deleteOtherDelay = config.deleteOtherDelay
        }

        let now = Date.now()

        actionTimer = new Date(now - actionDelay)
        deleteOtherTimer = new Date(now - deleteOtherDelay)

    }

    /**
     * Reset the action timer to delay
     * actions again
     * @memberOf UserState
     * @access public
     */
    function resetOwnActionTimer() {
        actionTimer = new Date()
    }

    function resetDeleteOtherTimer() {
        deleteOtherTimer = new Date()
    }

    /**
     * Checks if the user can act
     * based on the actionDelay config
     * setting and the last time acted
     * @memberOf UserState
     * @access public
     * @return {boolean}
     */
    function canActOnOwn() {
        let msSinceAct = new Date(new Date() - actionTimer).getTime()
        return msSinceAct > actionDelay
    }

    function canDeleteOther() {
        let msSinceAct = new Date(new Date() - deleteOtherTimer).getTime()
        return msSinceAct > deleteOtherDelay
    }

    /**
     * Set the selected region based on the given intersect
     * @memberOf UserState
     * @access public
     * @param {THREE.Intersect} intersect The intersect
     */
    function setSelectedRegion(intersect) {

        let gPos = intersect.point.clone().initWorldPos()
        gPos.add(intersect.face.normal).worldToGrid()

        let halfSpssp = (GUI.getSSSP() - 1) / 2

        let x1 = gPos.x - halfSpssp
        let x2 = gPos.x + halfSpssp
        let z1 = gPos.z - halfSpssp
        let z2 = gPos.z + halfSpssp

        let c1 = new THREE.Vector3(x1, 0, z1).initGridPos()
        let c2 = new THREE.Vector3(x2, 0, z2).initGridPos()

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
        $('body').css('cursor', 'url(/img/default.cur), auto')
    }

    /**
     * Set the user state to PICKCOLOR
     * @memberOf UserState
     * @access public
     */
    function setPickState() {
        state = states.PICKCOLOR
        $('body').css('cursor', 'url(/img/picker.cur), auto')
    }

    function setHighlightState() {
        state = states.HIGHLIGHT
        $('body').css('cursor', 'url(/img/highlight.cur), auto')
    }

    /**
     * Set the user mode to edit
     * @memberOf UserState
     * @access public
     */
    function setEditMode() {
        mode = modes.EDIT
        GameScene.setRegionSelectPlaneVis(false)
    }

    /**
     * Set the user mode to select
     * @memberOf UserState
     * @access public
     */
    function setSelectMode() {
        mode = modes.SELECT
        GameScene.setRegionSelectPlaneVis(true)
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
        let username = $('#user #username').html()
        if (!username) username = 'Guest'
        let res = /[a-zA-Z0-9_]+/.exec(username)
        if (res) username = res[0]
        return username
    }

    function getCurrentHoveredUser() {
        return currentHoveredUser
    }

    function getActionDelay() {
        return actionDelay
    }

    function getDeleteOtherDelay() {
        return deleteOtherDelay
    }

    /*********** expose public methods *************/

    return {
        init: init,
        canActOnOwn: canActOnOwn,
        canDeleteOther: canDeleteOther,
        getUName: getUName,
        resetOwnActionTimer: resetOwnActionTimer,
        resetDeleteOtherTimer: resetDeleteOtherTimer,
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
        setCurrentHoveredUser: setCurrentHoveredUser,
        getActionDelay: getActionDelay,
        getDeleteOtherDelay: getDeleteOtherDelay
    }

}(window)

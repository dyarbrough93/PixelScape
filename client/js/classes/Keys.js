'use strict'

/**
 * Manages and routes keyboard events
 * @namespace Keys
 */
var Keys = function(window, undefined) {

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    var keyStates

    /*------------------------------------*
     :: Public Methods
     *------------------------------------*/

    /**
     * Initializes the module. Must be called
     * before anything else
     * @memberOf Keys
     * @access public
     */
    function init() {

        keyStates = {
            shiftDown: false,
            ctrlDown: false
        }

        addEventListeners()

    }

    /**
     * Is the shift key currently down?
     * @memberOf Keys
     * @access public
     * @return {Boolean}
     */
    function isShiftDown() {
        return keyStates.shiftDown
    }

    /*------------------------------------*
     :: Private Methods
     *------------------------------------*/

     /**
      * Add keyboard event listeners to the document
      * @memberOf Keys
      * @access private
      */
    function addEventListeners() {

        document.addEventListener('keydown', keyDown)
        document.addEventListener('keyup', keyUp)

    }

    /**
     * Remove keyboard event listeners from the document
     * @memberOf Keys
     * @access private
     */
    function removeEventListeners() {

        document.removeEventListener('keydown', keyDown)
        document.removeEventListener('keyup', keyUp)

    }

    /**
     * Route keydown events
     * @memberOf Keys
     * @access private
     * @param  {Event} e
     */
    function keyDown(e) {

        switch (e.keyCode) {

            case 27:
                escDown()
                break

            case 16:
                shiftDown()
                break

            case 17:
                ctrlDown()
                break

        }

        // 1-3
        if (e.keyCode >= 49 && e.keyCode <= 51)
            numberDown(e)

    }

    /**
     * Route keyup events
     * @memberOf Keys
     * @access private
     * @param  {Event} e
     */
    function keyUp(e) {

        switch (e.keyCode) {

            case 16:
                shiftUp()
                break

            case 17:
                ctrlUp()
                break

        }

    }

    /**
     * Handle number presses
     * @memberOf Keys
     * @access private
     * @param  {Event} e
     */
    function numberDown(e) {

        e.preventDefault()

        var colorNum = e.keyCode - 48

        if (keyStates.ctrlDown)
            GUI.setSavedColor(colorNum)
        else GUI.loadSavedColor(colorNum)

    }

    /**
     * Handle an escape down event
     * @memberOf Keys
     * @access private
     */
    function escDown() {

        if (UserState.stateIsPick())
            UserState.setDefaultState()


        if (UserState.modeIsEdit()) {

            UserState.setSelectMode()
            UserState.resetSelectedRegion()
            PixVoxConversion.convertToPixels()
            GameScene.setGhostMeshVis(false)

        }

    }

    /**
     * Handle a shift down event
     * @memberOf Keys
     * @access private
     */
    function shiftDown() {
        keyStates.shiftDown = true
        Mouse.forceTriggerMouseMove()
    }

    /**
     * Handle a control down event
     * @memberOf Keys
     * @access private
     */
    function ctrlDown() {
        keyStates.ctrlDown = true
    }

    /**
     * Handle a control up event
     * @memberOf Keys
     * @access private
     */
    function ctrlUp() {
        keyStates.ctrlDown = false
    }

    /**
     * Handle a shift up event
     * @memberOf Keys
     * @access private
     */
    function shiftUp() {
        keyStates.shiftDown = false
        Mouse.forceTriggerMouseMove()
    }

    /*********** expose public methods *************/

    return {
        init: init,
        isShiftDown: isShiftDown
    }

}()

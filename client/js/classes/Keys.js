var Keys = function(window, undefined) {

    var keyStates

    function init() {

        keyStates = {
            shiftDown: false,
            ctrlDown: false
        }

        addEventListeners()

    }

    function addEventListeners() {

        document.addEventListener('keydown', keyDown)
        document.addEventListener('keyup', keyUp)

    }

    function removeEventListeners() {

        document.removeEventListener('keydown', keyDown)
        document.removeEventListener('keyup', keyUp)

    }

    function keyDown(e) {

        switch (e.keyCode) {

            case 27:
                escDown(e)
                break

            case 16:
                shiftDown(e)
                break

            case 17:
                ctrlDown(e)
                break

        }

        // 1-3
        if (e.keyCode >= 49 && e.keyCode <= 51)
            numberDown(e)

    }

    function numberDown(e) {

        e.preventDefault()

        var colorNum = e.keyCode - 48

        if (keyStates.ctrlDown)
            GUI.setSavedColor(colorNum)
        else GUI.loadSavedColor(colorNum)

    }

    function keyUp(e) {

        switch (e.keyCode) {

            case 16:
                shiftUp(e)
                break

            case 17:
                ctrlUp(e)
                break

        }

    }

    function escDown(e) {

        if (UserState.stateIsPick())
            UserState.setDefaultState()


        if (UserState.modeIsEdit()) {

            UserState.setSelectMode()
            UserState.resetSelectedRegion()
            PixVoxConversion.convertToPixels()
            GameScene.setGhostMeshVis(false)

        }

    }

    function shiftDown() {
        keyStates.shiftDown = true
        Mouse.forceTriggerMouseMove()
    }

    function ctrlDown() {
        keyStates.ctrlDown = true
    }

    function ctrlUp() {
        keyStates.ctrlDown = false
    }

    function shiftUp() {
        keyStates.shiftDown = false
        Mouse.forceTriggerMouseMove()
    }

    function isShiftDown() {
        return keyStates.shiftDown
    }

    return {
        init: init,
        isShiftDown: isShiftDown
    }

}()

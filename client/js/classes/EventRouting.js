var EventRouting = function(window, undefined) {

    function init() {

        window.addEventListener('resize', onWindowResize)
        addEventListeners()

    }

    function mouseDown(e) {

        if (e.which === 1)
            Mouse.leftDown(e)

    }

    function mouseUp(e) {

        if (e.which === 1)
            Mouse.leftUp(e)

    }

    function keyDown(e) {

        switch (e.keyCode) {

            case 27:
                Keys.escDown(e)
                break

            case 16:
                Keys.shiftDown(e)
                break

            case 17:
                Keys.ctrlDown(e)
                break

        }

    }

    function keyUp(e) {

        switch (e.keyCode) {

            case 16:
                Keys.shiftUp(e)
                break

            case 17:
                Keys.ctrlUp(e)
                break

        }

    }

    function addEventListeners() {

        document.addEventListener('mousedown', mouseDown)
        document.addEventListener('mouseup', mouseUp)
        document.addEventListener('keydown', keyDown)
        document.addEventListener('keyup', keyUp)

    }

    function removeEventListeners() {

        document.removeEventListener('mousedown', mouseDown)
        document.removeEventListener('mouseup', mouseUp)
        document.removeEventListener('keydown', keyDown)
        document.removeEventListener('keyup', keyUp)

    }

    return {
        init: init,
        addEventListeners: addEventListeners,
        removeEventListeners: removeEventListeners
    }

}(window)

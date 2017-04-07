var UserState = function(window, undefined) {

    var states
    var state
    var modes
    var mode

    function init() {

        states = {
            DEFAULT: 0,
            PICKCOLOR: 1
        }

        mode = {
            SELECT: 0,
            EDIT: 1
        }

        state = states.DEFAULT
        mode = modes.SELECT

    }

    function getState() {
        return state
    }

    function getMode() {
        return mode
    }

    return {
        getState: getState,
        getMode: getMode
    }

}(window)

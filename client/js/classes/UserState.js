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

    function setDefaultState() {
        state = states.DEFAULT
    }

    function setPickState() {
        state = states.PICKCOLOR
    }

    function modeIsSelect() {
        return mode === modes.SELECT
    }

    function modeIsEdit() {
        return mode === modes.EDIT
    }

    return {
        modeIsSelect: modeIsSelect,
        modeIsEdit: modeIsEdit,
        setDefaultState: setDefaultState,
        setPickState: setPickState
    }

}(window)

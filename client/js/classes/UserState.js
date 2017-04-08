var UserState = function(window, undefined) {

    var states
    var state
    var modes
    var mode
    var selectedRegion

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

    function setSelectedRegion(intxGPos) {

        var spssp = Config.getGrid().sqPerSideOfSelectPlane

        var x1 = intxGPos.x - spssp
        var x2 = intxGPos.x + spssp
        var z1 = intxGPos.z - spssp
        var z2 = intxGpos.z + spssp

        var c1 = new THREE.Vector3(x1, p.y, z1).initGridPos()
        var c2 = new THREE.Vector3(x2, p.y, z2).initGridPos()

        selectedRegion = {
            corner1: c1,
            corner2: c2
        }
    }

    function getSelectedRegion() {
        return selectedRegion
    }

    return {
        init: init,
        modeIsSelect: modeIsSelect,
        modeIsEdit: modeIsEdit,
        setDefaultState: setDefaultState,
        setPickState: setPickState,
        getSelectedRegion: getSelectedRegion
    }

}(window)

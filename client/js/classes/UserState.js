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

    function modeIsSelect() {
        return mode === modes.SELECT
    }

    function modeIsEdit() {
        return mode === modes.EDIT
    }

    function stateIsPick() {
        return state === states.PICKCOLOR
    }

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

        selectedRegion = {
            corner1: c1,
            corner2: c2
        }
    }

    function getSelectedRegion() {
        return selectedRegion
    }

    function resetSelectedRegion() {
      selectedRegion = undefined
    }

    return {
        init: init,
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

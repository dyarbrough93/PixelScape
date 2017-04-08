var Config = function(window, undefined) {

    var settings = {
        "general": {
            "maxVoxelHeight": 75,
            "actionDelay": 0.4,
            "chatDelay": 3
        },
        "grid": {
            "blockSize": 50,
            "sqPerSideOfSelectPlane": 351,
            "sqPerSideOfSection": 151,
            "sectionsPerSide": 17,
            "sqPerSideOfGrid": 2566,
            "size": 64150
        },
        "mapControls": {
            "zoomSpeed": 1,
            "minDistance": 0,
            "maxDistance": 1.7976931348623157e+308,
            "rotateSpeed": 0.5,
            "minPolarAngle": 0.05,
            "maxPolarAngle": 1.4612058853906016
        }
    }

    function get() {
        return settings
    }

    function getGeneral() {
        return settings.general
    }

    function getGrid() {
        return settings.grid
    }

    function getMapControls() {
        return settings.mapControls
    }

    return {
        get: get,
        getGeneral: getGeneral,
        getGrid: getGrid,
        getMapControls: getMapControls
    }

}()

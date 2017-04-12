var Config = function(window, undefined) {

    var settings = {
        "general": {
            "maxVoxelHeight": 75,
            "actionDelay": 0.4,
            "chatDelay": 3,
            "clearColor": 16777215
        },
        "convert": {
            "warnThreshold": 15000,
            "errorThreshold": 30000
        },
        "grid": {
            "blockSize": 50,
            "sqPerSideOfSelectPlane": 51,
            "sqPerSideOfSection": 151,
            "sectionsPerSide": 15,
            "sqPerSideOfGrid": 2264,
            "size": 56600
        },
        "mapControls": {
            "minDistance": 0,
            "maxDistance": 1.7976931348623157e+308,
            "camMinxz": -100000,
            "camMaxxz": 100000,
            "camMiny": 100,
            "camMaxy": 75000,
            "rotateSpeed": 0.5,
            "zoomSpeed": 1,
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

    function getConvert() {
        return settings.convert
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
        getConvert: getConvert,
        getGrid: getGrid,
        getMapControls: getMapControls
    }

}()

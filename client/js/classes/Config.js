var Config = function(window, undefined) {

    var settings = {
        "maxVoxelHeight": 75,
        "actionDelay": 0.4,
        "chatDelay": 3
    }

    function get() {
        return settings
    }

    return {
        get: get
    }

}()

var GUI = function(window, undefined) {

    var settings = {
        blockColor: 0xffffff * Math.random()
    }

    function getBlockColor() {
        return settings.blockColor
    }

    return {
        getBlockColor: getBlockColor
    }

}(window)

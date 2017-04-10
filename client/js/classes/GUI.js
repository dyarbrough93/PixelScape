var GUI = function(window, undefined) {

    var settings
    var gui

    function init() {

        settings = {
            blockColor: 0xffffff * Math.random(),
            logWorldData: function() {
                var worldData = WorldData.getWorldData()
                for (var i = 0; i < worldData.length; i++) {
                    for (var j = 0; j < worldData[i].length; j++) {
                        for (var voxPos in worldData[i][j]) {
                            console.log(voxPos)
                        }
                    }
                }
            }
        }

        gui = new dat.GUI()
        gui.add(settings, 'logWorldData')

    }

    function getBlockColor() {
        return settings.blockColor
    }

    return {
        init: init,
        getBlockColor: getBlockColor
    }

}(window)

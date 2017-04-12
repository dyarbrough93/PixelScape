var GUI = function(window, undefined) {

    var settings
    var gui
    var guiClicked

    function init() {

        settings = {
            colors: {
                blockColor: randomHexColor(),
                savedColor1: randomHexColor(),
                savedColor2: randomHexColor(),
                savedColor3: randomHexColor(),
                randomColor: setRandomBlockColor,
                colorPicker: pickColor
            },
            debug: {
                logWorldData: function() {
                    var worldData = WorldData.getWorldData()
                    for (var i = 0; i < worldData.length; i++) {
                        for (var j = 0; j < worldData[i].length; j++) {
                            for (var voxPos in worldData[i][j]) {
                                console.log(`voxPos: ${voxPos}`)
                            }
                        }
                    }
                }
            }
        }

        gui = new dat.GUI()
        guiClicked = false

        addGUIEls()

        // if it was the gui that was clicked,
        // save this fact so that we can prevent
        // world actions from taking place behind it
        $('.dg').mousedown(function() {
            guiClicked = true
        })

    }

    function addGUIEls() {

        var colors = gui.addFolder('colors')
        var debug = gui.addFolder('debug')

        ;
        (function initColorsFolder() {

            var blockColor = colors.addColor(settings.colors, 'blockColor')
            colors.addColor(settings.colors, 'savedColor1')
            colors.addColor(settings.colors, 'savedColor2')
            colors.addColor(settings.colors, 'savedColor3')

            colors.add(settings.colors, 'randomColor')
            colors.add(settings.colors, 'colorPicker')

            blockColor.onChange(function(newColor) {
                GameScene.setGhostMeshColor(newColor)
            })

            colors.open()

        })()

        debug.add(settings.debug, 'logWorldData')

    }

    function pickColor() {

    }

    function setRandomBlockColor() {
        GameScene.setGhostMeshColor(randomHexColor())
    }

    function randomHexColor() {
        return 0xffffff * Math.random()
    }

    function getBlockColor() {
        return settings.colors.blockColor
    }

    function wasClicked() {
        return guiClicked
    }

    function setClicked(clicked) {
        guiClicked = clicked
    }

    return {
        init: init,
        getBlockColor: getBlockColor,
        wasClicked: wasClicked,
        setClicked: setClicked
    }

}(window)

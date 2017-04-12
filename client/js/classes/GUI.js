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

            var blockColor = colors.addColor(settings.colors, 'blockColor').listen()
            colors.addColor(settings.colors, 'savedColor1')
            colors.addColor(settings.colors, 'savedColor2')
            colors.addColor(settings.colors, 'savedColor3')

            colors.add(settings.colors, 'randomColor')
            colors.add(settings.colors, 'colorPicker')

            blockColor.onChange(function(newColor) {

                // if the gui color is manually edited (typing in the color),
                // it returns a hex string for some reason.
                if (newColor[0] === '#') newColor = parseInt(newColor.substring(1), 16)
                GameScene.setGhostMeshColor(newColor)
                settings.colors.blockColor = newColor

            })

            colors.open()

        })()

        debug.add(settings.debug, 'logWorldData')

    }

    function setPickColor(intersect) {

        var iObj = intersect.object
        var objName = iObj.name

        var pickColor

        if (objName !== 'plane') {

            if (objName === 'BufferMesh') {

                var bufColArr = iObj.geometry.attributes.color.array
                var idx = intersect.index * 3

                pickColor = new THREE.Color(bufColArr[idx], bufColArr[idx + 1], bufColArr[idx + 2])

            } else { // voxel

                pickColor = intersect.face.color

            }

            var hColor = pickColor.getHex()

            settings.colors.blockColor = hColor
            UserState.setDefaultState()
            GameScene.setGhostMeshColor(hColor ^ 0x4C000000)

        }

    }

    function pickColor() {
        if (UserState.modeIsEdit())
            UserState.setPickState()
    }

    function setRandomBlockColor() {
        var randColor = randomHexColor()
        GameScene.setGhostMeshColor(randColor)
        settings.colors.blockColor = randColor
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
        setClicked: setClicked,
        setPickColor: setPickColor
    }

}(window)

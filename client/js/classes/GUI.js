var GUI = function(window, undefined) {

    var settings
    var gui
    var guiClicked

    function init() {

        settings = {
            colors: {
                blockColor: randomHexColor(),
                saved: {
                    1: randomHexColor(),
                    2: randomHexColor(),
                    3: randomHexColor()
                },
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

        var colors = gui.addFolder('Colors')
        var debug = gui.addFolder('_debug')

        ;
        (function initColorsFolder() {

            var blockColor = colors.addColor(settings.colors, 'blockColor').listen().name('Block Color')
            colors.addColor(settings.colors.saved, '1').name('Saved Color 1').listen()
            colors.addColor(settings.colors.saved, '2').name('Saved Color 2').listen()
            colors.addColor(settings.colors.saved, '3').name('Saved Color 3').listen()

            colors.add(settings.colors, 'randomColor').name('Random Color')
            colors.add(settings.colors, 'colorPicker').name('Color Picker')

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

    function setSavedColor(cNum) {
        settings.colors.saved[cNum] = settings.colors.blockColor
    }

    function loadSavedColor(cNum) {
        settings.colors.blockColor = settings.colors.saved[cNum]
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
        setPickColor: setPickColor,
        setSavedColor: setSavedColor,
        loadSavedColor: loadSavedColor
    }

}(window)

'use strict'

/**
 * Manages the game's dat.GUI
 * @namespace GUI
 */
var GUI = function(window, undefined) {

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    var settings
    var gui
    var guiClicked

    /*------------------------------------*
     :: Public Methods
     *------------------------------------*/

    /**
     * Initializes the module. Must be called
     * before anything else
     * @memberOf GUI
     * @access public
     */
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
                                console.log('voxPos: ' + voxPos)
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

    /**
     * Set the specified saved color to the block color
     * @memberOf GUI
     * @access public
     * @param {number} cNum The saved color number
     */
    function setSavedColor(cNum) {
        settings.colors.saved[cNum] = settings.colors.blockColor
    }

    /**
     * Set the block color to the specified saved color
     * @memberOf GUI
     * @access public
     * @param {number} cNum The saved color number
     */
    function loadSavedColor(cNum) {
        settings.colors.blockColor = settings.colors.saved[cNum]
    }

    /**
     * Given an intersect, extract the color of the intersected
     * block (if it was a block that was intersected) and assign it
     * to the blockColor + update the Game scenes ghost mesh
     * @memberOf GUI
     * @access public
     * @param {THREE.Intersect} intersect The intersect
     */
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

    /**
     * Get the current block color
     * @memberOf GUI
     * @access public
     * @return {number} The block color
     */
    function getBlockColor() {
        return settings.colors.blockColor
    }

    /**
     * Return whether or not the GUI was click
     * before the mouse click event was received
     * @memberOf GUI
     * @access public
     * @return {number} The block color
     */
    function wasClicked() {
        return guiClicked
    }

    /**
     * Set clicked to true or false
     * @memberOf GUI
     * @access public
     * @param clicked What to set it to
     */
    function setClicked(clicked) {
        guiClicked = clicked
    }

    /*------------------------------------*
     :: Private Methods
     *------------------------------------*/

    /**
     * Add the necessary elements to the gui
     * @memberOf GUI
     * @access private
     */
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
        debug.open()

    }

    /**
     * If the pick color button is clicked,
     * set the users state to pickcolor
     * @memberOf GUI
     * @access private
     */
    function pickColor() {
        if (UserState.modeIsEdit())
            UserState.setPickState()
    }

    /**
     * Set the block color to a random color
     * @memberOf GUI
     * @access private
     */
    function setRandomBlockColor() {
        var randColor = randomHexColor()
        GameScene.setGhostMeshColor(randColor)
        settings.colors.blockColor = randColor
    }

    /**
     * Get a random hex color
     * @memberOf GUI
     * @access private
     * @return {number} The random hex color
     */
    function randomHexColor() {
        return 0xffffff * Math.random()
    }

    /*********** expose public methods *************/

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

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
    var controlKit
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

        var startingBlockColor = randomHexColor().getHashHexString()

        settings = {
            colors: {
                blockColor: startingBlockColor,
                prevBlockColor: startingBlockColor,
                saved: [],
                randomColor: setRandomBlockColor
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
                },
                hoveredUser: '',
                userName: User.getUName()
            },
            userSettings: {
                useAA: Config.getGeneral().aaOnByDefault
            },
            logout: function() {
                var url = window.location.protocol + '//' + window.location.host
                window.location = url + '/signout'
            },
            coords: ''
        }

        controlKit = new ControlKit()
        guiClicked = false

        initControlKit()

        // if it was the gui that was clicked,
        // save this fact so that we can prevent
        // world actions from taking place behind it
        $('.dg').mousedown(function() {
            guiClicked = true
        })

        // if it was the gui that was clicked,
        // save this fact so that we can prevent
        // world actions from taking place behind it
        $('#controlKit .panel').mousedown(function() {
            guiClicked = true

            // this has to be assigned here because
            // some elements don't exist on page load
            $('#controlKit *').mousedown(function() {
                guiClicked = true
            })

        })

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
            var hexString = '#' + pickColor.getHexString()

            GameScene.setGhostMeshColor(hColor ^ 0x4C000000)

            settings.colors.blockColor = hexString
            pushToSavedColors()

            controlKit.update()

        }

        togglePickColor()

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

    function destroy() {
        gui.destroy()
    }

    function displayString(string) {
        settings.debug.hoveredUser = string
        controlKit.update()
    }

    function setCoords(planeIntx) {

        if (planeIntx) {
            var gPos = (planeIntx.point).clone().add(planeIntx.face.normal).worldToGrid()
            settings.coords = '(' + gPos.x + ', ' + gPos.z + ')'
            controlKit.update()
        }
    }

    /*------------------------------------*
     :: Private Methods
     *------------------------------------*/

    /**
     * Add the necessary elements to the gui
     * @memberOf GUI
     * @access private
     */
    function initControlKit() {

        var mainPanel = controlKit.addPanel({
            label: ' ',
            align: 'right',
            width: 275
        })

        mainPanel.addGroup({
                label: 'Controls'
            })
            .addSubGroup({
                label: 'Colors'
            })
            .addColor(settings.colors, 'blockColor', {
                presets: 'saved',
                label: 'Block Color',
                onChange: function(newColor) {
                    // get decimal
                    var dColor = VoxelUtils.hexStringToDec(newColor)
                    GameScene.setGhostMeshColor(dColor)
                    pushToSavedColors()
                }
            })
            .addButton('Color Picker', togglePickColor)
            .addButton('Random Color', settings.colors.randomColor)
            .addSubGroup({
                label: 'Highlight Voxels by User'
            })
            .addButton('Start Highlighting', highlight)
            .addStringOutput(settings.debug, 'hoveredUser', {
                label: 'Owner'
            })

        mainPanel.addGroup({
                label: 'Info'
            })
            .addStringOutput(settings, 'coords', {
                label: 'Coordinates'
            })

        mainPanel.addGroup({
                label: 'Debug'
            })
            .addButton('Log World Data', settings.debug.logWorldData)
            .addStringInput(settings.debug, 'userName', {
                label: 'Username'
            })

        mainPanel.addGroup({
                label: 'Settings'
            })
            .addCheckbox(settings.userSettings, 'useAA', {
                label: 'Antialiasing',
                onChange: function() {
                    GameScene.switchRenderer()
                }
            })
            .addButton('Log Out', settings.logout)

    }

    function highlight(forceOff) {
        if (User.modeIsEdit()) {
            if (User.stateIsDefault() && !forceOff) {
                $('#controlKit [value="Start Highlighting"]').val('Stop Highlighting (or ESC)')
                User.setHighlightState()
            } else if (User.stateIsHighlight()) {
                $('#controlKit [value="Stop Highlighting (or ESC)"]').val('Start Highlighting')
                User.setDefaultState()
            }
        }
    }

    /**
     * If the pick color button is clicked,
     * set the users state to pickcolor
     * @memberOf GUI
     * @access private
     */
    function togglePickColor() {
        if (User.modeIsEdit()) {
            if (User.stateIsDefault()) {
                $('#controlKit [value="Color Picker"]').val('Click Voxel')
                User.setPickState()
            } else if (User.stateIsPick()) {
                $('#controlKit [value="Click Voxel"]').val('Color Picker')
                User.setDefaultState()
            }
        }
    }

    /**
     * Set the block color to a random color
     * @memberOf GUI
     * @access private
     */
    function setRandomBlockColor() {
        var randColor = randomHexColor()
        GameScene.setGhostMeshColor(randColor.getHex())
        settings.colors.blockColor = randColor.getHashHexString()
        pushToSavedColors()
        controlKit.update()
    }

    function pushToSavedColors() {
        var maxColors = Config.getGUI().maxSavedColors

        var savedColors = settings.colors.saved
        var prevBlockColor = settings.colors.prevBlockColor

        var idx = savedColors.indexOf(prevBlockColor)
        if (idx !== -1) savedColors.splice(idx, 1)

        savedColors.unshift(prevBlockColor)
        if (savedColors.length > maxColors) savedColors.pop()
        settings.colors.prevBlockColor = settings.colors.blockColor
    }

    /**
     * Get a random hex color
     * @memberOf GUI
     * @access private
     * @return {number} The random hex color
     */
    function randomHexColor() {
        return new THREE.Color(0xffffff * Math.random())
    }

    /*********** expose public methods *************/

    return {
        init: init,
        destroy: destroy,
        displayString: displayString,
        getBlockColor: getBlockColor,
        wasClicked: wasClicked,
        setClicked: setClicked,
        setPickColor: setPickColor,
        highlight: highlight,
        setCoords: setCoords
    }

}(window)

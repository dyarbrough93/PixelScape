'use strict'

/**
 * Manages the game's dat.GUI
 * @namespace GUI
 */
let GUI = function(window, undefined) {

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    let settings
    let controlKit
    let guiClicked
    let animSpeed

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

        let startingBlockColor = randomHexColor().getHashHexString()

        settings = {
            colors: {
                blockColor: startingBlockColor,
                prevBlockColor: startingBlockColor,
                saved: [],
                randomColor: setRandomBlockColor
            },
            debug: {
                logWorldData: function() {
                    let worldData = WorldData.getWorldData()
                    for (let i = 0; i < worldData.length; i++) {
                        for (let j = 0; j < worldData[i].length; j++) {
                            for (let voxPos in worldData[i][j]) {
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
            coords: '',
            highlight: {
                offText: 'Start Highlighting',
                onText: 'Stop Highlighting (or ESC)',
                color: '#000000'
            },
            sqPerSideOfSelectPlane: Config.getGrid().sqPerSideOfSelectPlane,
            sliderRange: [5, 101],
            connectedClients: 0
        }

        controlKit = new ControlKit()
        guiClicked = false
        animSpeed = 185

        initControlKit()

        // login
        $('#button-login').click(function() {
            showLogin()
        })

        // logout
		$('#button-logout').click(function() {

			let url = window.location.protocol + '//' + window.location.host
			window.location = url + '/signout'

		})

        $('#button-archive').click(function() {
            let url = window.location.protocol + '//' + window.location.host
			window.location = url + '/archive'
        })

        $('#button-controls').click(function() {
            $(document).trigger('modalOpened')
            showModal()
        })

        $('.btn').mouseup(function() {
			$(this).blur()
		})

        /*if (User.getUName() === 'Guest') showModal()
        else*/ $(document).trigger('modalClosed')

        // if it was the gui that was clicked,
        // save this fact so that we can prevent
        // world actions from taking place behind it
        $('#controlKit *, .btn').mousedown(function() {
            guiClicked = true
            // this has to be assigned here because
            // some elements don't exist on page load
            $('#controlKit *').mousedown(function() {
                guiClicked = true
            })

        })

        $(".btn").mouseup(function() {
            $(this).blur()
        })

        $('#circleTimerHelp').mousedown(function() {
            guiClicked = true
            $(document).trigger('modalOpened')
        })

        $('#timerHelpModal').on('hidden.bs.modal', function() {
            $(document).trigger('modalClosed')
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

        let iObj = intersect.object
        let objName = iObj.name

        let pickColor

        if (objName !== 'plane') {

            if (objName === 'BufferMesh') {

                let bufColArr = iObj.geometry.attributes.color.array
                let idx = intersect.index * 3

                pickColor = new THREE.Color(bufColArr[idx], bufColArr[idx + 1], bufColArr[idx + 2])

            } else { // voxel

                pickColor = intersect.face.color

            }

            let hColor = pickColor.getHex()
            let hexString = '#' + pickColor.getHexString()

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
            let gPos = (planeIntx.point).clone().add(planeIntx.face.normal).worldToGrid()
            settings.coords = '(' + gPos.x + ', ' + gPos.z + ')'
            controlKit.update()
        }
    }

    function getHighlightColor() {
        return settings.highlight.color
    }

    function resetActionTimer(ms, timerID) {

        let r = parseInt($(timerID + ' circle').attr('r'))
        let circumf = 2 * Math.PI * r

        $(timerID).css('display', 'block')
        $(timerID).css('stroke-dasharray', circumf)

        $(timerID + ' .circle_animation').css('stroke-dashoffset', circumf)
        $(timerID + ' .circle_animation').animate({
            'stroke-dashoffset': 0
        }, {
            duration: ms - 150,
            queue: false,
            complete: function() {
                $(timerID).fadeOut(150)
            }
        })

    }

    function popCircleTimer(timerID) {

        let strokeWidth = parseInt($(timerID + ' circle').attr('stroke-width'))
        let strokeColor = $(timerID + ' circle').attr('stroke')
        let newStrokeColor = '#7e2929'
        let newStrokeWidth = strokeWidth + 1

        let popSpeed = 125

        $(timerID + ' .circle_animation').css({
            'stroke': newStrokeColor,
            transition: popSpeed
        })
        $(timerID + ' .circle_animation').animate({
            'stroke-width': newStrokeWidth
        }, popSpeed, function() {
            $(timerID + ' .circle_animation').css({
                'stroke': strokeColor,
                transition: popSpeed
            })
            $(timerID + ' .circle_animation').animate({
                'stroke-width': strokeWidth
            }, popSpeed)
        })

    }

    function showModal() {
        $('#welcome-modal').modal()
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

        let mainPanel = controlKit.addPanel({
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
                    let dColor = VoxelUtils.hexStringToDec(newColor)
                    GameScene.setGhostMeshColor(dColor)
                    pushToSavedColors()
                }
            })
            .addButton('Color Picker', togglePickColor)
            .addButton('Random Color', settings.colors.randomColor)
            .addSubGroup({
                label: 'Highlight Voxels by User'
            })
            .addButton('Start Highlighting', toggleHighlight)
            .addStringOutput(settings.debug, 'hoveredUser', {
                label: 'Owner'
            })
            .addColor(settings.highlight, 'color', {
                label: 'Highlight Color'
            })

        mainPanel.addGroup({
                label: 'Info',
                enable: false
            })
            .addStringOutput(settings, 'connectedClients', {
                label: 'Connections'
            })
            .addStringOutput(settings, 'coords', {
                label: 'Coordinates'
            })
            .addStringInput(settings.debug, 'userName', {
                label: 'Username'
            })

        mainPanel.addGroup({
                label: 'Settings',
                enable: false
            })
            .addCheckbox(settings.userSettings, 'useAA', {
                label: 'Antialiasing',
                onChange: function() {
                    GameScene.switchRenderer()
                }
            })
            .addSlider(settings, 'sqPerSideOfSelectPlane', 'sliderRange', {
                label: 'Selection Plane Size',
                onChange: function() {

                    var sssp = settings.sqPerSideOfSelectPlane
                    let blockSize = Config.getGrid().blockSize

                    GameScene.setupRegionSelectPlane(blockSize * sssp)

                },
                step: 1,
                dp: 0
            })

    }

    function showLogin() {

        $(document).trigger('modalOpened')

        $('#login-modal').css('z-index', 3)
        $('#modal-background').css('z-index', 2)

        $('#login-modal').animate({
            opacity: 1
        }, {
            queue: false
        }, animSpeed)

        $('#modal-background').animate({
            opacity: 0.5
        }, {
            queue: false
        }, animSpeed)

        // hide modal on click background
        $('#modal-background').click(hideLogin)

    }

    function hideLogin() {

        $('#login-modal').animate({
            opacity: 0
        }, {
            queue: false,
            duration: animSpeed,
            done: function() {
                $('#login-modal').css('z-index', -1)
            }
        })

        $('#modal-background').animate({
            opacity: 0
        }, {
            queue: false,
            duration: animSpeed,
            done: function() {
                $('#modal-background').css('z-index', -1)
                $(document).trigger('modalClosed')
            }
        })

        $('#modal-background').off('click')
    }

    function toggleHighlight() {
        if (User.modeIsEdit()) {
            if (User.stateIsDefault()) {
                $('#controlKit [value="' + settings.highlight.offText + '"]').val(settings.highlight.onText)
                User.setHighlightState()
            } else if (User.stateIsHighlight()) {
                $('#controlKit [value="' + settings.highlight.onText + '"]').val(settings.highlight.offText)
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
        let randColor = randomHexColor()
        GameScene.setGhostMeshColor(randColor.getHex())
        settings.colors.blockColor = randColor.getHashHexString()
        pushToSavedColors()
        controlKit.update()
    }

    function pushToSavedColors() {
        let maxColors = Config.getGUI().maxSavedColors

        let savedColors = settings.colors.saved
        let prevBlockColor = settings.colors.prevBlockColor

        let idx = savedColors.indexOf(prevBlockColor)
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

    function getControlKit() {
        return controlKit
    }

    function getSSSP() {
        return settings.sqPerSideOfSelectPlane
    }

    function setConnectedClients(num) {
        settings.connectedClients = num
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
        toggleHighlight: toggleHighlight,
        setCoords: setCoords,
        getHighlightColor: getHighlightColor,
        togglePickColor: togglePickColor,
        resetActionTimer: resetActionTimer,
        popCircleTimer: popCircleTimer,
        getControlKit: getControlKit,
        setConnectedClients: setConnectedClients,
        getSSSP: getSSSP,
        showLogin: showLogin
    }

}(window)

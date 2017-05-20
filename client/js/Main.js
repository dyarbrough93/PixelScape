'use strict'

/**
 * Initializes all classes and triggers
 * the server data retrieval
 * @namespace Main
 */
let Main = function() {

	$(document).ready(function() {

		// prevent middle click directional scroll
		$('body').mousedown(function(e) {
			if (e.button == 1)
				e.preventDefault()
		})

		// initialize classes
		if (!archiveMode) {
			Mouse.init()
			Keys.init()
			GUI.init()
			Raycast.init()
		} else {
            Mouse = {}
			Mouse.pos = {
				x: 0,
				y: 0
			}
			document.addEventListener('mousemove', function(e) {
				Mouse.pos.x = (e.clientX / window.innerWidth) * 2 - 1
		        Mouse.pos.y = -(e.clientY / window.innerHeight) * 2 + 1
			})
			Mouse.getMousePos = function() {
				return Mouse.pos
			}
            Keys = {}
            GUI = {
                getBlockColor: function() { return 0 },
                setConnectedClients: function() { return true }
            }
            Raycast = {
                add: function() { return true }
            }
        }
		GameScene.init()
		WorldData.init()
		if (!archiveMode) User.init()
        else User = {}
		MapControls.init()
		if (!archiveMode) {
			PixVoxConversion.init()
			BufMeshMgr.init()
		} else {
            PixVoxConversion = {}
            BufMeshMgr = {}
        }
		SocketHandler.init()

		// download the world data and
		// load it into the scene
		SocketHandler.retrieveData(function(data) {

			WorldData.loadIntoScene(data)

		})

	})

}()

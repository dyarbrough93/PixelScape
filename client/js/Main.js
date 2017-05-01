'use strict'

/**
 * Initializes all classes and triggers
 * the server data retrieval
 * @namespace Main
 */
var Main = function() {

    $(document).ready(function() {

        $('body').mousedown(function (e) {
            if (e.button == 1)
                e.preventDefault()
        })

        // initialize classes
        Mouse.init()
        GUI.init()
        Raycast.init()
        GameScene.init()
        WorldData.init()
        Keys.init()
        User.init()
        MapControls.init()
        PixVoxConversion.init()
        BufMeshMgr.init()
        SocketHandler.init()

        // download the world data and
        // load it into the scene
        SocketHandler.retrieveData(function(data) {

            WorldData.loadIntoScene(data)

        })

    })

}()

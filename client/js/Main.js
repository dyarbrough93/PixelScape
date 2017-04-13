'use strict'

/**
 * Initializes all classes and triggers
 * the server data retrieval
 * @namespace Main
 */
var Main = function() {

    $(document).ready(function() {

        // initialize classes
        GUI.init()
        Raycast.init()
        GameScene.init()
        WorldData.init()
        Mouse.init()
        Keys.init()
        UserState.init()
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

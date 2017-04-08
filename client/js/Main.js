var Main = function() {

  $(document).ready(function() {

    // initialize classes
    Raycast.init()
    GameScene.init()
    WorldData.init()
    EventRouting.init()

    socket.emit('start chunking')

  })

}()

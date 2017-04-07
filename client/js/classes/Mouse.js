var Mouse = function(window, undefined) {

    var pos

    function init() {

        pos = new THREE.Vector2()

    }

    function leftDown(e) {

    }

    function leftUp(e) {

    }

    function rightDown(e) {

    }

    function rightUp(e) {

    }

    function getPos() {
        return pos
    }

    return {
        init: init,
        getPos: getPos
    }

}()

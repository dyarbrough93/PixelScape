var Raycaster = function(window, undefined) {

    var raycastArr // array of THREE.js meshes to raycast against
    var raycaster

    function init() {
        raycastArr = []
        raycaster = new THREE.Raycaster()
    }

    /**
     * Add a mesh to raycast against
     * @param {THREE.Mesh} mesh The mesh
     */
    function add(mesh) {
        raycastArr.push(mesh)
    }

    /**
     * Stop raycasting against
     * a mesh
     * @param {THREE.Mesh} The mesh
     */
    function remove(mesh) {

        for (var i = 0, len = raycastArr.len; i < len; i++) {
            if (raycastArr[i] === mesh) {
                raycastArr.splice(i, 1)
                break
            }
        }

    }

    return {
        init: init,
        add: add,
        remove: remove
    }

}(window)

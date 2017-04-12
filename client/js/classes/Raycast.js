var Raycast = function(window, undefined) {

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

        for (var i = 0, len = raycastArr.length; i < len; i++) {
            if (raycastArr[i] === mesh) {
                raycastArr.splice(i, 1)
                break
            }
        }

    }

    function getIntersects(pos, camera) {
        raycaster.setFromCamera(pos, camera)
        return raycaster.intersectObjects(raycastArr)
    }

    return {
        init: init,
        add: add,
        remove: remove,
        getIntersects: getIntersects
    }

}(window)

'use strict'

/**
 * Manages raycasting operations
 * @namespace Raycast
 */
let Raycast = function(window, undefined) {

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    let raycastArr // array of THREE.js meshes to raycast against
    let raycaster

    /*------------------------------------*
     :: Public Methods
     *------------------------------------*/

     /**
      * Initializes the module. Must be called
      * before anything else
      * @memberOf Raycast
      * @access public
      */
    function init() {
        raycastArr = []
        raycaster = new THREE.Raycaster()
    }

    /**
     * Add a mesh to raycast against
     * @memberOf Raycast
     * @access public
     * @param {THREE.Mesh} mesh The mesh
     */
    function add(mesh) {
        raycastArr.push(mesh)
    }

    /**
     * Stop raycasting against
     * a mesh
     * @memberOf Raycast
     * @access public
     * @param {THREE.Mesh} The mesh
     */
    function remove(mesh) {

        for (let i = 0, len = raycastArr.length; i < len; i++) {
            if (raycastArr[i] === mesh) {
                raycastArr.splice(i, 1)
                break
            }
        }

    }

    /**
     * Get intersects based on the given
     * position and camera
     * @memberOf Raycast
     * @access public
     * @param  {number} pos    The position
     * @param  {THREE.Camera} camera The camera
     * @return {Object[]} Array of intersects
     */
    function getIntersects(pos, camera) {
        raycaster.setFromCamera(pos, camera)
        return raycaster.intersectObjects(raycastArr)
    }

    /*********** expose public methods *************/

    return {
        init: init,
        add: add,
        remove: remove,
        getIntersects: getIntersects
    }

}(window)

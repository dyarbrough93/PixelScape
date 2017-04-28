'use strict'

/**
 * This module manages the creation / deletion of a buffer
 * mesh. It also provides methods for inserting and removing
 * voxels from the buffer mesh
 * @namespace BufMeshMgr
 */
let BufMeshMgr = function(window, undefined) {

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    let p
    let n

    let bufVerts
    let bufNorms

    let bufObj

    /*------------------------------------*
     :: Public methods
     *------------------------------------*/

    /**
     * Initializes the module. Must be
     * called before usage.
     * @memberOf BufMeshMgr
     * @access public
     */
    function init() {

        let blockSize = Config.getGrid().blockSize

        p = blockSize / 2
        n = -blockSize / 2

        bufVerts = new Float32Array([

            // front
            n, n, p,
            p, n, p,
            p, p, p,

            p, p, p,
            n, p, p,
            n, n, p,

            // right
            p, p, p,
            p, n, p,
            p, p, n,

            p, n, p,
            p, n, n,
            p, p, n,

            // top
            p, p, p,
            n, p, n,
            n, p, p,

            p, p, n,
            n, p, n,
            p, p, p,

            // left
            n, p, n,
            n, n, p,
            n, p, p,

            n, p, n,
            n, n, n,
            n, n, p,

            // back
            p, p, n,
            p, n, n,
            n, p, n,

            n, n, n,
            n, p, n,
            p, n, n,

            //bottom
            p, n, p,
            n, n, p,
            n, n, n,

            p, n, n,
            p, n, p,
            n, n, n
        ])
        bufNorms = new Float32Array([

            //front
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,

            0, 0, 1,
            0, 0, 1,
            0, 0, 1,

            // right
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,

            1, 0, 0,
            1, 0, 0,
            1, 0, 0,

            // top
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,

            0, 1, 0,
            0, 1, 0,
            0, 1, 0,

            // left
            -1, 0, 0,
            (-1), 0, 0,
            (-1), 0, 0,

            -1, 0, 0,
            (-1), 0, 0,
            (-1), 0, 0,

            // back
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,

            0, 0, -1,
            0, 0, -1,
            0, 0, -1,

            // bottom
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,

            0, -1, 0,
            0, -1, 0,
            0, -1, 0

        ])

    }

    /**
     * Creates the buffer mesh.
     * @memberOf BufMeshMgr
     * @access public
     * @param {number} size Number of spaces to initialize the bufferattributes with
     */
    function createBufMesh(size) {

        bufObj = {
            size: size,
            geom: new THREE.BufferGeometry(),
            mat: new THREE.MeshLambertMaterial({
                vertexColors: THREE.VertexColors
            }),
            init: function() {

                this.mesh = new THREE.Mesh(this.geom, this.mat)
                this.mesh.name = 'BufferMesh'
                this.mesh.castShadow = true

                this.geom.addAttribute('position', new THREE.BufferAttribute(new Float32Array(this.size * bufVerts.length), 3))
                this.geom.addAttribute('color', new THREE.BufferAttribute(new Float32Array(this.size * bufVerts.length), 3))
                this.geom.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.size * bufVerts.length), 3))

                return this
            }

        }.init()

    }

    /**
     * Adds a voxel to the buffer mesh. Only to be used before
     * the mesh is added to the scene.
     * @memberOf BufMeshMgr
     * @access public
     * @param {number} addIdx Index to add the voxel at
     * @param {VoxelUtils.WorldVector3} wPos World position of the voxel
     * @param {THREE.Color} color Color of the voxel
     */
    function addVoxel(addIdx, wPos, tColor) {

        let bufPositions = bufObj.geom.attributes.position.array
        let bufColors = bufObj.geom.attributes.color.array
        let bufNormals = bufObj.geom.attributes.normal.array

        for (let iter = 0; iter < bufVerts.length; iter += 3) {

            // add vertices
            bufPositions[addIdx + iter] = (bufVerts[iter] + wPos.x)
            bufPositions[addIdx + iter + 1] = (bufVerts[iter + 1] + wPos.y)
            bufPositions[addIdx + iter + 2] = (bufVerts[iter + 2] + wPos.z)

            // add normals
            bufNormals[addIdx + iter] = bufNorms[iter]
            bufNormals[addIdx + iter + 1] = bufNorms[iter + 1]
            bufNormals[addIdx + iter + 2] = bufNorms[iter + 2]

            // add colors
            bufColors[addIdx + iter] = tColor.r
            bufColors[addIdx + iter + 1] = tColor.g
            bufColors[addIdx + iter + 2] = tColor.b

        }
    }

    /**
     * Removes a voxel from the buffer mesh
     * (sets associated vertices / colors to 0)
     * @memberOf BufMeshMgr
     * @access public
     * @param {number} bIdx Index of the voxel to remove.
     */
    function removeVoxel(bIdx) {

        let bufAttrs = bufObj.geom.attributes

        for (let i = 0; i < 108; i++) {
            bufAttrs.color.array[bIdx + i] = 0
            bufAttrs.normal.array[bIdx + i] = 0
            bufAttrs.position.array[bIdx + i] = 0
        }
        bufAttrs.position.needsUpdate = true
        bufAttrs.normal.needsUpdate = true
        bufAttrs.color.needsUpdate = true

    }

    /**
     * De-initializes all properties and frees associated memory.
     * @memberOf BufMeshMgr
     * @access public
     */
    function destroyBufMesh() {

        bufObj.geom.removeAttribute('position')
        bufObj.geom.removeAttribute('normal')
        bufObj.geom.removeAttribute('color')
        bufObj.geom.attributes = undefined

        bufObj.geom.dispose()
        bufObj.mat.dispose()

        bufObj.mesh = undefined

    }

    /**
     * Gets the length of the buffer
     * vertices array
     * @memberOf BufMeshMgr
     * @access public
     * @return {number} The length
     */
    function getBufVertsLen() {
        return bufVerts.length
    }

    /**
     * Gets the actual mesh associated
     * with the buffer object
     * @memberOf BufMeshMgr
     * @access public
     * @return {THREE.Mesh} The buffer mesh
     */
    function getBufMesh() {
        return bufObj.mesh
    }

    /*********** expose public methods *************/

    return {
        init: init,
        destroyBufMesh: destroyBufMesh,
        createBufMesh: createBufMesh,
        getBufVertsLen: getBufVertsLen,
        removeVoxel: removeVoxel,
        getBufMesh: getBufMesh,
        addVoxel: addVoxel
    }

}(window)

'use strict'

var BufMeshMgr = function(window, undefined) {

    var p
    var n

    var bufVerts
    var bufNorms

    var bufObj

    function init() {

        var blockSize = Config.getGrid().blockSize

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
     * Object used to manage the game's buffer mesh
     * @constructor
     * @param {number} size Number of spaces to initialize the bufferattributes with
     * @param {THREE.Scene} scene Scene this mesh is attached to
     */
    function createBufMesh(size, scene) {

        bufObj = {
            size: size,
            scene: scene,
            geom: new THREE.BufferGeometry(),
            mat: new THREE.MeshPhongMaterial({
                vertexColors: THREE.VertexColors
            }),
            init: function() {

                this.mesh = new THREE.Mesh(this.geom, this.mat)
                this.mesh.name = 'BufferMesh'

                this.geom.addAttribute('position', new THREE.BufferAttribute(new Float32Array(this._size * bufVerts.length), 3))
                this.geom.addAttribute('color', new THREE.BufferAttribute(new Float32Array(this._size * bufVerts.length), 3))
                this.geom.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(this._size * bufVerts.length), 3))

                return this
            }

        }.init()

    }

    /**
     * Adds a voxel to the buffer mesh. Only to be used before
     * the mesh is added to the scene.
     * @memberOf BufMeshObj
     * @param {number} addIdx Index to add the voxel at
     * @param {VoxelUtils.WorldVector3} wPos World position of the voxel
     * @param {THREE.Color} color Color of the voxel
     */
    function addVoxel(addIdx, wPos, tColor) {

        var bufPositions = bufObj.geom.attributes.position.array
        var bufColors = bufObj.geom.attributes.color.array
        var bufNormals = bufObj.geom.attributes.normal.array

        for (var iter = 0; iter < bufVerts.length; iter += 3) {

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
     * Removes a voxel from the buffer mesh (sets associated vertices / colors to 0)
     * @memberOf BufMeshObj
     * @param {number} bIdx Index of the voxel to remove.
     */
    function removeVoxel(bIdx) {

        var bufAttrs = bufMesh.geom.attributes

        for (var i = 0; i < 108; i++) {
            bufAttrs.color.array[bIdx + i] = 0
            bufAttrs.normal.array[bIdx + i] = 0
            bufAttrs.position.array[bIdx + i] = 0
        }
        bufAttrs.position.needsUpdate = true
        bufAttrs.normal.needsUpdate = true
        bufAttrs.color.needsUpdate = true

    }

    /**
     * Adds the buffer mesh to the scene.
     * @memberOf BufMeshObj
     */
    function addToScene() {
        bufMesh.scene.add(bufMesh.mesh)
    }

    /**
     * Removes the buffer mesh from the scene.
     * @memberOf BufMeshObj
     */
    function removeFromScene() {
        bufMesh.scene.remove(bufMesh.mesh)
    }

    /**
     * De-initializes all properties and frees associated memory.
     * @memberOf BufMeshObj
     */
    function destroy() {

        bufMesh.geom.removeAttribute('position')
        bufMesh.geom.removeAttribute('normal')
        bufMesh.geom.removeAttribute('color')
        bufMesh.geom.attributes = undefined

        bufMesh.geom.dispose()
        bufMesh.mat.dispose()

        bufMesh.mesh = undefined

    }

    function getBufVertsLen() {
        return bufVerts.length
    }

    function getBufMesh() {
        return bufObj.mesh
    }

    return {
        init: init,
        createBufMesh: createBufMesh,
        getBufVertsLen: getBufVertsLen,
        getBufMesh: getBufMesh,
        addVoxel: addVoxel
    }

}(window)

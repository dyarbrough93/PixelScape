/**
 * Defines particle systems for use in main class
 * @namespace ParticleSystems
 */
var ParticleSystems = (function(window, undefined) {

    /**
     * Used when setting a particle's y position so that it is not seen
     */
    var nullVal = 1000000

    /**
     * Used to hold pixels that were not loaded in with the rest
     * of the world data; i.e. pixels that have been created since
     * initial load
     * @memberOf ParticleSystems
     * @class PSystemExpansion
     * @param {number} size The initial size of the expansion (max new particles it can hold)
     * @param {THREE.Scene} scene The scene this expansion is attached to. Will be automatically
     * added to scene.
     */
    function PSystemExpansion(size, scene) {

        initExpo(this, size, scene, false)

        scene.add(this._points)
    }

    /**
     * This is a helper function for the particle system expansion class.
     * It takes care of the bulk of the initialization, while allowing for
     * reuse (re-initialization while maintaining some class values) in doubleSize().
     * @memberOf ParticleSystems
     * @param {PSystemExpansion} _this Expansion we are initializing
     * @param {number} size Size. Same as in constructor
     * @param {THREE.scene} scene Same as in constructor
     * @param {boolean} double Are we doubling the size of the expansion?
     * @param {Array} oldVertices Only used when doubling; old vertex values
     * to copy over
     * @param {Array} oldColors Only used when doubling; old colors to copy over
     */
    function initExpo(_this, size, scene, double, oldVertices, oldColors) {
        _this._size = size
        _this._emptyIndices = []
        _this._systemIdx = 0
        _this._geom = new THREE.Geometry()
        _this._scene = scene
        _this._hiddenPointsPositions = []

        var oldSize = size

        _this._points = new THREE.Points(
            _this._geom,
            new THREE.PointsMaterial({
                size: 125,
                vertexColors: THREE.VertexColors,
            })
        )

        if (double) {
            // copy over the old data
            for (var i = 0, len = _this._size; i < len; i++) {
                var v = oldVertices[i],
                    c = oldColors[i]
                _this._geom.vertices.push(new THREE.Vector3(v.x, v.y, v.z))
                _this._geom.colors.push(new THREE.Color(c.r, c.g, c.b))
            }
        }

        if (double) _this._size *= 2

        // initialize blank array spaces (bug fix hack)
        for (var i = 0, len = _this._size; i < len; i++) {
            _this._geom.vertices.push(new THREE.Vector3(0, nullVal, 0))
            _this._geom.colors.push(new THREE.Color())
        }

        // frustum culling bug fix hack
        _this._points.frustumCulled = false

        // disappearing vertices bug fix hack
        _this._geom.vertices[(double ? oldSize : 0)] = new THREE.Vector3(0, nullVal, 0)
        _this._geom.colors[(double ? oldSize : 0)] = new THREE.Color(0xffffff)

        if (double) _this._size *= 2
    }

    PSystemExpansion.prototype = {
        /**
         * Adds a pixel to the particle system expansion
         * @instance
         * @memberOf ParticleSystems.PSystemExpansion
         * @param {VoxelUtils.GridVector3} gPos Grid position to add at
         * @param {THREE.Color} color Color of the pixel
         * @returns {number} The index in the vertices / colors array the pixel was added
         */
        addPixel: function(gPos, color) {

            if (this._systemIdx >= this._size) {

                // @TODO: fix double size or find another solution
                throw new Error('Too many expansion pixels.')

                console.debug('resizing psystem')
                this.doubleSize()
            }

            var wPos = gPos.clone()
            wPos.gridToWorld()

            var particle = new THREE.Vector3(wPos.x, wPos.y, wPos.z)

            var index
            if (this._emptyIndices.length > 0) {
                index = this._emptyIndices[0]
                this._emptyIndices.splice(0, 1)
            }            else {
                index = this._systemIdx
                this._systemIdx++
            }

            this._geom.vertices[index] = particle
            this._geom.colors[index] = color

            this.update()

            return index

        },
        /**
         * Deletes a pixel from the particle system expansion
         * @instance
         * @memberOf ParticleSystems.PSystemExpansion
         * @param {number} pIdx Index in the vertices array of the particle to delete
         */
        deletePixel: function(pIdx) {

            this._geom.vertices[pIdx].y = nullVal
            this._emptyIndices.push(pIdx)
            this.update()
        },
        /**
         * Shows a pixel that has been hidden by {@link ParticleSystems.PSystemExpansion#hidePixel}
         * @instance
         * @memberOf ParticleSystems.PSystemExpansion
         * @param {number} pIdx Index in the vertices array of the particle to show
         */
        showPixel: function(pIdx) {

            this.checkVertexExists(pIdx)
            this.checkHiddenPointExists(pIdx)

            var oldVal = this._hiddenPointsPositions[pIdx]
            this._hiddenPointsPositions[pIdx] = undefined
            this._geom.vertices[pIdx].y = oldVal
            this._geom.verticesNeedUpdate = true
        },
        /**
         * Hides a pixel. Can be shown with {@link ParticleSystems.PSystemExpansion#showPixel}
         * @instance
         * @memberOf ParticleSystems.PSystemExpansion
         * @param {number} pIdx Index in the vertices array of the particle to hide
         */
        hidePixel: function(pIdx) {

            this.checkVertexExists(pIdx)

            var yVal = this._geom.vertices[pIdx].y
            this._geom.vertices[pIdx].y = nullVal
            this._hiddenPointsPositions[pIdx] = yVal
            this._geom.verticesNeedUpdate = true
        },
        /**
         * Doubles the size of the particle system expansion. Used when there are no more
         * empty spots to fill
         * @instance
         * @private
         * @memberOf ParticleSystems.PSystemExpansion
         * @param {number} pIdx Index in the vertices array of the particle to hide
         */
        doubleSize: function() {

            this._scene.remove(this._points)

            var oldVertices = this._geom.vertices,
                oldColors = this._geom.colors

            var oldEmptyIndices = this._emptyIndices,
                oldSysIndex = this._systemIdx,
                oldHiddenPositions = this._hiddenPointsPositions

            initExpo(this, this._size, this._scene, true, oldVertices, oldColors)

            this._emptyIndices = oldEmptyIndices
            this._systemIdx = oldSysIndex
            this._hiddenPointsPositions = oldHiddenPositions

            this._scene.add(this._points)
        },
        /**
         * Sets colorsNeedUpdate and verticesNeedUpdate to true
         * @instance
         * @memberOf ParticleSystems.PSystemExpansion
         */
        update: function() {
            this._geom.colorsNeedUpdate = true
            this._geom.verticesNeedUpdate = true
        },
        /**
         * Checks if the specified index in the vertices array has a valid value
         * @instance
         * @memberOf ParticleSystems.PSystemExpansion
         * @private
         */
        checkVertexExists: function(pIdx) {
            if ((!(this._geom.vertices[pIdx])) === 'undefined')
                throw new Error('vertices[' + pIdx + '] does not exist')
        },
        /**
         * Checks if the specified index in the hiddenPointsPositions array has a valid value
         * @instance
         * @memberOf ParticleSystems.PSystemExpansion
         * @private
         */
        checkHiddenPointExists: function(pIdx) {
            if ((!(this._hiddenPointsPositions[pIdx])) === 'undefined')
                throw new Error('hiddenPointsPositions[' + pIdx + '] does not exist')
        }
    }

    /**
     * Used to hold pixels that were loaded in upon scene initialization. Particles
     * cannot be added to this object once it has been added to the scene
     * @memberOf ParticleSystems
     * @class ParticleSystem
     * @param {number} size The number of rows and columns in the 2D array
     * @param {THREE.Scene} scene The scene this expansion is attached to. Must be manually
     * added.
     */
    function ParticleSystem(size, scene) {

        this._geom = []
        this._points = []
        this._hiddenPointsPositions = []
        this._size = size
        this._scene = scene

        this._mat = new THREE.PointsMaterial({
            size: 125,
            vertexColors: THREE.VertexColors
        })

        for (var i = 0; i < size; i++) {

            this._geom[i] = []
            this._points[i] = []
            this._hiddenPointsPositions[i] = []

            for (var j = 0; j < size; j++) {

                this._geom[i][j] = new THREE.Geometry()

                this._points[i][j] = new THREE.Points(
                    this._geom[i][j],
                    this._mat)

                this._hiddenPointsPositions[i][j] = []

            }
        }
    }

    ParticleSystem.prototype = {
        /**
         * Adds the particle system to the scene it was initialized with.
         * @instance
         * @memberOf ParticleSystems.ParticleSystem
         */
        addToScene: function() {
            for (var i = 0; i < this._size; i++) {
                for (var j = 0; j < this._size; j++) {
                    this._scene.add(this._points[i][j])
                }
            }
        },
        /**
         * Removes the particle system from the scene it was initialized with.
         * @instance
         * @memberOf ParticleSystems.ParticleSystem
         */
        removeFromScene: function() {
            for (var i = 0; i < this._size; i++) {
                for (var j = 0; j < this._size; j++) {
                    this._scene.remove(this._points[i][j])
                }
            }
        },
        /**
         * Adds a pixel to the particle system. Only to be used during initization, before
         * it is added to the scene.
         * @instance
         * @memberOf ParticleSystems.ParticleSystem
         * @param {VoxelUtils.Tuple} sid Section indices of the pixel to add
         * @param {VoxelUtils.WorldVector3} wPos World position of the pixel to add
         * @param {THREE.Color} color Color of the pixel
         * @returns {number} Index in the vertices / colors arrays
         */
        addPixel: function(sid, wPos, color) {

            var pIdx = this._geom[sid.a][sid.b].vertices.push(wPos) - 1
            this._geom[sid.a][sid.b].colors.push(color)

            return pIdx

        },
        /**
         * Hides the pixel at the specified index.
         * @instance
         * @memberOf ParticleSystems.ParticleSystem
         * @param {VoxelUtils.Tuple} sid Section indices of the pixel to hide
         * @param {number} pIdx Array index of the pixel to hide
         */
        hidePixel: function(sid, pIdx) {

            this.checkVertexExists(sid, pIdx)

            var yVal = this._geom[sid.a][sid.b].vertices[pIdx].y
            this._geom[sid.a][sid.b].vertices[pIdx].y = nullVal
            this._hiddenPointsPositions[sid.a][sid.b][pIdx] = yVal
            this._geom[sid.a][sid.b].verticesNeedUpdate = true
        },
        /**
         * Shows the pixel at the specified index.
         * @instance
         * @memberOf ParticleSystems.ParticleSystem
         * @param {VoxelUtils.Tuple} sid Section indices of the pixel to show
         * @param {number} pIdx Array index of the pixel to show
         */
        showPixel: function(sid, pIdx) {

            this.checkVertexExists(sid, pIdx)
            this.checkHiddenPointExists(sid, pIdx)

            var oldVal = this._hiddenPointsPositions[sid.a][sid.b][pIdx]
            this._hiddenPointsPositions[sid.a][sid.b][pIdx] = undefined
            this._geom[sid.a][sid.b].vertices[pIdx].y = oldVal
            this._geom[sid.a][sid.b].verticesNeedUpdate = true
        },
        /**
         * Checks if the specified index in the vertices array has a valid value
         * @instance
         * @memberOf ParticleSystems.PSystemExpansion
         * @private
         */
        checkVertexExists: function(sid, pIdx) {
            if ((this._geom[sid.a][sid.b].vertices[pIdx]) === 'undefined')
                throw new Error('vertices[' + pIdx + '] does not exist')
        },
        /**
         * Checks if the specified index in the hiddenPointsPositions array has a valid value
         * @instance
         * @memberOf ParticleSystems.PSystemExpansion
         * @private
         */
        checkHiddenPointExists: function(sid, pIdx) {
             if ((this._hiddenPointsPositions[sid.a][sid.b][pIdx]) === 'undefined') {
                 debugLog(this._hiddenPointsPositions[sid.a][sid.b][pIdx])
                throw new Error('hiddenPointsPositions[' + pIdx + '] does not exist')
             }
        }
    }

    return {
        PSystemExpansion: PSystemExpansion,
        ParticleSystem: ParticleSystem
    }

})(window)

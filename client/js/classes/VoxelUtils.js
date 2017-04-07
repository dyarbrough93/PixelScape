'use strict'

/*
 * @file VoxelUtils
 * @author Davis Yarbrough
 */

/**
 * Provides utility functions for VoxelWorld.js
 * @namespace VoxelUtils
 */
var VoxelUtils = (function(window, undefined) {

    /**
     * A coordinate string defining the grid position of a voxel.
     * Formatted as "x[-]{0,1}[0-9]+y[-]{0,1}[0-9]+z[-]{0,1}[0-9]+".
     * So "x-12y3z15" (x: -12, y: 3, z: 15) would be a valid example.
     * @memberOf! VoxelUtils
     * @typedef {string} coordStr
     */

    /**
     * A THREE.Vector3 that represents a grid coordinate. Can
     * be initialized with "new THREE.Vector3().initGridPos()",
     * or by calling "vec3.worldToGrid()".
     * @memberOf! VoxelUtils
     * @typedef {THREE.Vector3} GridVector3
     */

    /**
     * A THREE.Vector3 that represents a world coordinate. Can
     * be initialized with "new THREE.Vector3().initWorldPos()",
     * or by calling "vec3.gridToWorld()".
     * @memberOf! VoxelUtils
     * @typedef {THREE.Vector3} WorldVector3
     */

    String.prototype.isCoordStr = function() {
        var formatReg = /x[-]*\d+y[-]*\d+z[-]*\d+/
        return !!formatReg.exec(this)
    }

    /**
     * Sets a THREE.Vector3's values to the
     * center of the closest world "anchor". I.e. the position
     * that would be used to set the world coordinates of a
     * voxel at that location (multiples of 50 for x and z,
     * (multiples of 50) + 25 for y).
     * @memberOf! VoxelUtils
     */
    THREE.Vector3.prototype.setWorldPosition = function() {

        this.worldToGrid()
        this.gridToWorld()

    }

    /**
     * Converts a THREE.Vector3's values from world
     * coordinates to grid coordinates.
     * @memberOf! VoxelUtils
     */
    THREE.Vector3.prototype.worldToGrid = function() {

        if (!this.isWorldPos)
            throw new Validation.IllegalUsageException('This method can only be called on a WorldVector3')

        this.divideScalar(50)

        Math.round(this.setComponent(0, Math.round(this.x)))
        Math.round(this.setComponent(1, Math.floor(this.y)))
        Math.round(this.setComponent(2, Math.round(this.z)))

        this.isGridPos = true
        this.isWorldPos = false

        return this

    }

    /**
     * Converts a THREE.Vector3's values from grid
     * coordinates to world coordinates.
     * @memberOf! VoxelUtils
     */
    THREE.Vector3.prototype.gridToWorld = function() {

        if (!this.isGridPos)
            throw new Validation.IllegalUsageException('This method can only be called on a GridVector3')

        this.multiplyScalar(50)
        this.setComponent(1, this.y + 25)

        this.isWorldPos = true
        this.isGridPos = false

        return this

    }

    /**
     * Marks this vector as a grid position (game coordinates).
     * @memberOf! VoxelUtils
     * @returns {VoxelUtils.GridVector3} This object
     */
    THREE.Vector3.prototype.initGridPos = function() {
        this.isGridPos = true
        return this
    }

    /**
     * Marks this vector as a world position (scene coordinates).
     * @memberOf! VoxelUtils
     * @returns {VoxelUtils.WorldVector3} This object
     */
    THREE.Vector3.prototype.initWorldPos = function() {
        this.isWorldPos = true
        return this
    }

    /**
     * Tuple object.
     * @memberOf VoxelUtils
     * @class Tuple
     * @type {Object}
     * @property {Number} a First value
     * @property {Number} b Second value
     */
    function Tuple(a, b) {
        return {
            a: a,
            b: b,
            /**
             * Checks is this is valid tuple.
             * For validation
             * @instance
             * @memberOf VoxelUtils.Tuple
             * @method isValidTuple
             */
            isValidTuple: function() {
                return typeof this.a === 'number' &&
                    typeof this.b === 'number'
            }
        }
    }

    /**
     * Takes a coordinate string, parses it and returns
     * it as a THREE.Vector3.
     *
     * @memberOf VoxelUtils
     * @param {VoxelUtils.coordStr} coordStr Coordinate string representing
     * a grid position
     * @returns {THREE.Vector3} Parsed position vector
     */
    function coordStrParse(coordStr) {

        if (!coordStr.isCoordStr())
            throw new Validation.IllegalArgumentException("Argument must be in the format 'x0y0z0")

        var xreg = /x[-]*\d+/,
            yreg = /y[-]*\d+/,
            zreg = /z[-]*\d+/

        var pos = {
            x: parseInt(xreg.exec(coordStr)[0].slice(1)),
            y: parseInt(yreg.exec(coordStr)[0].slice(1)),
            z: parseInt(zreg.exec(coordStr)[0].slice(1))
        }

        return new THREE.Vector3(pos.x, pos.y, pos.z).initGridPos()

    }

    /**
     * Takes a THREE.Vector3 and converts it to a coordinate
     * string.
     *
     * @memberOf VoxelUtils
     * @param {VoxelUtils.GridVector3} gPos Position in grid coordinates
     * @returns {VoxelUtils.coordStr} Grid coordinate string
     */
    function getCoordStr(gPos) {

        if (!gPos.hasOwnProperty("x") ||
            !gPos.hasOwnProperty("y") ||
            !gPos.hasOwnProperty("z"))
            throw new Validation.IllegalArgumentException("Argument must have attributes x, y, and z defined")

        return "x" + gPos.x + "y" + gPos.y + "z" + gPos.z
    }

    /**
     * Get the section indices of the specified grid position.
     * @memberOf VoxelWorld
     * @param {VoxelUtils.GridVector3} gPos Grid position to check
     * @returns {voxelUtils.Point}
     */
    function getSectionIndices(gPos) {

        var sqPerSGrid = GameScene.getSqPerSideOfGrid()
        var sqPerSSect = GameScene.getSqPerSideOfSection()

        return new VoxelUtils.Tuple(
            Math.floor((gPos.x + sqPerSGrid / 2) / sqPerSSect),
            Math.floor((gPos.z + sqPerSGrid / 2) / sqPerSSect)
        )

    }

    /**
     * Initializes a voxel mesh with the specified position
     * @memberOf! VoxelUtils.
     * @param {Object} args  Voxel parameters
     * @param {GridVector3} args.gPos Grid position
     * @param {Number} args.color Hex color
     * @return {THREE.Mesh} The threejs voxel mesh
     */
    function initVoxel(args) {

        if (!args || !args.hasOwnProperty("gPos") || !args.gPos.isGridPos)
            throw new Validation.IllegalArgumentException("args.gPos must be defined and a THREE.Vector3 grid position")

        var wPos = args.gPos.clone()
        wPos.gridToWorld()

        var geom = new THREE.BoxGeometry(50, 50, 50),
            material = new THREE.MeshLambertMaterial({
                vertexColors: THREE.VertexColors
            })

        var color = args.color || 0
        for (var i = 0; i < geom.faces.length; i++) {
            var face = geom.faces[i]
            face.color.setHex(color)
        }

        var mesh = new THREE.Mesh(geom, material)

        mesh.name = "Voxel"
        mesh.position.set(wPos.x, wPos.y, wPos.z)
        mesh.updateMatrix()

        return mesh

    }

    /**
     * Counts the number of root attributes in an
     * object.
     *
     * @memberOf! VoxelUtils
     * @param {Object} obj The object
     * @returns {Number}
     */
    function countObjAttrs(obj) {
        var num = 0
        for (var attr in obj) {
            num++
        }
        return num
    }

    /**************************************/

    return {
        coordStrParse: coordStrParse,
        getCoordStr: getCoordStr,
        initVoxel: initVoxel,
        countObjAttrs: countObjAttrs,
        Tuple: Tuple,
        getSectionIndices: getSectionIndices

    }

})(window)

'use strict'

/**
 * Manages the game scene (camera, scene, lights, etc)
 * and related game assets
 * @namespace GameScene
 */
var GameScene = function(window, undefined) {

    if (!Detector.webgl) Detector.addGetWebGLMessage()

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    // basic scene els
    var scene
    var camera
    var renderer

    // the game scene div
    var container

    // planes
    var voxelPlane
    var mapControlsPlane
    var regionSelectPlane

    // meshes
    var ghostMesh
    var deleteMesh

    // particle systems
    var particleSystem
    var pSystemExpansion

    /*------------------------------------*
     :: Public methods
     *------------------------------------*/

    /**
     * Initializes the game scene. Must be
     * called before anything else.
     * @memberOf GameScene
     * @access public
     */
    function init() {

        scene = new THREE.Scene()
        container = document.getElementById('container')

        var gridConfig = Config.getGrid()

        ;
        (function _initCamera() {

            var config = {
                fov: 45,
                near: 100,
                far: 300000,
                distMult: 0.1
            }

            var aspect = window.innerWidth / window.innerHeight

            camera = new THREE.PerspectiveCamera(config.fov, aspect, config.near, config.far)
            camera.position.set(10000 * config.distMult, 15000 * config.distMult, 10000 * config.distMult)
            camera.lookAt(new THREE.Vector3()) // look at 0, 0, 0

        })()

        ;
        (function _initRenderer() {

            var {
                clearColor
            } = Config.getGeneral()

            renderer = new THREE.WebGLRenderer({
                antialias: false
            })
            renderer.setClearColor(clearColor)
            renderer.sortObjects = false
            renderer.setSize(window.innerWidth, window.innerHeight)
            container.appendChild(renderer.domElement)

        })()

        ;
        (function _initLights() {

            var ambientLight = new THREE.AmbientLight(0x606060)
            scene.add(ambientLight)

            var directionalLight = new THREE.DirectionalLight(0xffffff)
            directionalLight.position.set(1, 0.75, 0.5).normalize()
            scene.add(directionalLight)

        })()

        ;
        (function _initPlanes() {

            var gridSize = gridConfig.size
            var blockSize = gridConfig.blockSize

            var stdSideLen = gridSize * 2 + blockSize

            var nullMat = new THREE.MeshBasicMaterial({
                visible: false
            })

            // this is the plane the voxels are actually placed on.
            ;
            (function _initVoxelPlane() {

                var voxGeom = new THREE.PlaneGeometry(stdSideLen, stdSideLen)
                voxGeom.rotateX(-Math.PI / 2)

                var voxelPlane = new THREE.Mesh(voxGeom, nullMat)
                voxelPlane.name = 'plane'

                scene.add(voxelPlane)
                Raycast.add(voxelPlane)

            })()

            // This is the floor that is actually visible. It has to be offset
            // to reduce flickering from the selection plane
            ;
            (function _floorPlane() {

                var floorGeom = new THREE.PlaneGeometry(stdSideLen, stdSideLen)
                floorGeom.rotateX(-Math.PI / 2)
                floorGeom.translate(0, -25, 0)

                var floorMat = new THREE.MeshBasicMaterial({
                    color: '#f5f5f5'
                })

                var floorPlane = new THREE.Mesh(floorGeom, floorMat)

                scene.add(floorPlane)

            })()

            // This is the plane that MapControls uses to
            // pan and rotate
            ;
            (function _initControlsPlane() {

                var ctrlGeom = new THREE.PlaneGeometry(gridSize * 40, gridSize * 40)
                ctrlGeom.rotateX(-Math.PI / 2)

                mapControlsPlane = new THREE.Mesh(ctrlGeom, nullMat)

                mapControlsPlane.name = 'plane'

                scene.add(mapControlsPlane)

            })()

            // this is the transparent plane used to
            // select a region for editing
            ;
            (function _initRegionSelectPlane() {

                var spssp = gridConfig.sqPerSideOfSelectPlane

                var selGeom = new THREE.PlaneGeometry(blockSize * spssp, blockSize * spssp)
                selGeom.rotateX(-Math.PI / 2)
                selGeom.translate(0, -25, 0)

                var selMat = new THREE.MeshBasicMaterial({
                    color: '#008cff',
                    transparent: true,
                    opacity: 0.10
                })

                regionSelectPlane = new THREE.Mesh(selGeom, selMat)

                scene.add(regionSelectPlane)

            })()

        })()

        ;
        (function _initHoverVoxels() {

            // voxel shown when hovering grid
            (function _initGhostVoxel() {

                var blockSize = Config.getGrid().blockSize

                var ghostGeo = new THREE.CubeGeometry(blockSize, blockSize, blockSize)

                var ghostMaterial = new THREE.MeshBasicMaterial({
                    color: GUI.getBlockColor(),
                    transparent: true,
                    opacity: 0.5,
                    visible: false
                })

                ghostMesh = new THREE.Mesh(ghostGeo, ghostMaterial)
                scene.add(ghostMesh)

            })()

            ;
            // cube rendered over voxel when hovered and shift is held
            (function _initDeleteVoxel() {

                var redXTexture = new THREE.ImageUtils.loadTexture('img/redx.png')

                var deleteGeo = new THREE.CubeGeometry(51, 51, 51)
                var deleteMat = new THREE.MeshPhongMaterial({
                    map: redXTexture,
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.4,
                    visible: false
                })

                deleteMesh = new THREE.Mesh(deleteGeo, deleteMat)

                scene.add(deleteMesh)

            })()


        })()

        ;
        (function _initParticleSystems() {

            var sps = Config.getGrid().sectionsPerSide

            particleSystem = new ParticleSystems.ParticleSystem(sps, scene)
            pSystemExpansion = new ParticleSystems.PSystemExpansion(100000, scene)

        })()

        window.addEventListener('resize', onWindowResize)

    }

    /**
     * Renders the scene
     * @memberOf GameScene
     * @access public
     */
    function render() {

        renderer.render(scene, camera)

    }

    /**
     * Moves the region select plane based on
     * the given intersect
     * @memberOf GameScene
     * @access public
     * @param  {THREE.Intersect} planeIntx Intersection with the voxelPlane
     */
    function moveRegionSelectPlane(planeIntx) {

        regionSelectPlane.position.copy(planeIntx.point).add(planeIntx.face.normal).initWorldPos()
        regionSelectPlane.position.snapToGrid()

        render()

    }

    /**
     * Turn the delete mesh visibility on or off
     * @memberOf GameScene
     * @access public
     * @param {boolean} visible set visiblity
     */
    function setDeleteMeshVis(visible) {
        deleteMesh.material.visible = visible
    }

    /**
     * Turn the ghost mesh visibility on or off
     * @memberOf GameScene
     * @access public
     * @param {boolean} visible set visibility
     */
    function setGhostMeshVis(visible) {
        ghostMesh.material.visible = visible
    }

    /**
     * Set the color of the ghost mesh
     * @memberOf GameScene
     * @access public
     * @param {number} hColor Hex color to set
     */
    function setGhostMeshColor(hColor) {
        ghostMesh.material.color.setHex(hColor)
    }

    /**
     * Update the position / visibility of the ghost mesh
     * based on the given intersect
     * @memberOf GameScene
     * @access public
     * @param  {THREE.Intersect} intersect The intersect used to
     * set the position
     */
    function updateGhostMesh(intersect) {

        var gPos = intersect.point.clone().initWorldPos()
        gPos.add(intersect.face.normal).worldToGrid()

        if (!VoxelUtils.withinSelectionBounds(gPos) ||
            Keys.isShiftDown() || UserState.stateIsPick()) {
            setGhostMeshVis(false)
            return
        }

        setGhostMeshVis(true)

        var gmp = ghostMesh.position

        gmp.copy(intersect.point)
        gmp.add(intersect.face.normal)
        gmp.initWorldPos()
        gmp.snapToGrid()

    }

    /**
     * Update the position and visibility of the
     * delete mesh based on the given intersect
     * @memberOf GameScene
     * @access public
     * @param  {THREE.Intersect} intersect The intersect
     * used to set the position
     */
    function updateDeleteMesh(intersect) {

        if (intersect.object.name === 'plane' ||
            !Keys.isShiftDown()) {
            setDeleteMeshVis(false)
            return
        }

        setDeleteMeshVis(true)

        var dmp = deleteMesh.position

        dmp.copy(intersect.point)
        dmp.sub(intersect.face.normal)
        dmp.initWorldPos()
        dmp.snapToGrid()

    }

    /**
     * Adds an object to the scene
     * @memberOf GameScene
     * @access public
     * @param {THREE.Object} obj The object to add
     */
    function addToScene(obj) {
        scene.add(obj)
    }

    /**
     * Remove an object from the scene
     * @param  {THREE.Object} obj The object to remove
     */
    function removeFromScene(obj) {
        scene.remove(obj)
    }

    /******************Getters *************/

    function getPSystem() {
        return particleSystem
    }

    function getPSystemExpo() {
        return pSystemExpansion
    }

    function getMapControlsPlane() {
        return mapControlsPlane
    }

    function getCamera() {
        return camera
    }

    function getScene() {
        return scene
    }

    /*------------------------------------*
     :: Private methods
     *------------------------------------*/

    /**
     * Resizes on the scene when the window
     * is resized
     * @memberOf GameScene
     * @access private
     */
    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()

        renderer.setSize(window.innerWidth, window.innerHeight)

    }

    /*********** expose public methods *************/

    return {

        init: init,
        addToScene: addToScene,
        removeFromScene: removeFromScene,
        setDeleteMeshVis: setDeleteMeshVis,
        setGhostMeshVis: setGhostMeshVis,
        setGhostMeshColor: setGhostMeshColor,
        updateGhostMesh: updateGhostMesh,
        updateDeleteMesh: updateDeleteMesh,
        moveRegionSelectPlane: moveRegionSelectPlane,
        getMapControlsPlane: getMapControlsPlane,
        getScene: getScene,
        getCamera: getCamera,
        getPSystem: getPSystem,
        getPSystemExpo: getPSystemExpo,
        render: render

    }

}(window)

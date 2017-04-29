'use strict'

/**
 * Manages the game scene (camera, scene, lights, etc)
 * and related game assets
 * @namespace GameScene
 */
let GameScene = function(window, undefined) {

    if (!Detector.webgl) Detector.addGetWebGLMessage()

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    // basic scene els
    let scene
    let camera
    let renderer
    let noaarenderer
    let aarenderer // with antialiasing

    // the game scene div
    let container

    // lights
    let trackingDirLight
    let globalDirLight
    let ambientLight

    // planes
    let voxelPlane
    let mapControlsPlane
    let regionSelectPlane

    // meshes
    let ghostMesh
    let deleteMesh

    // particle systems
    let particleSystem
    let pSystemExpansion

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

        let gridConfig = Config.getGrid()

        ;
        (function _initCamera() {

            let config = {
                fov: 45,
                near: 100,
                far: 300000,
                distMult: 0.1
            }

            let aspect = window.innerWidth / window.innerHeight

            camera = new THREE.PerspectiveCamera(config.fov, aspect, config.near, config.far)
            camera.position.set(10000 * config.distMult, 15000 * config.distMult, 10000 * config.distMult)
            camera.lookAt(new THREE.Vector3()) // look at 0, 0, 0

        })()

        ;
        (function _initRenderer() {

            function setSharedConfig(r) {

                r.setClearColor('#ffffff')
                r.sortObjects = false
                r.setSize(window.innerWidth, window.innerHeight)

            }

            aarenderer = new THREE.WebGLRenderer({
                antialias: true
            })

            noaarenderer = new THREE.WebGLRenderer({
                antialias: false
            })

            setSharedConfig(aarenderer)
            setSharedConfig(noaarenderer)

            if (Config.getGeneral().aaOnByDefault) renderer = aarenderer
            else renderer = noaarenderer

            container.appendChild(renderer.domElement)

        })()

        ;
        (function _initLights() {

            ambientLight = new THREE.AmbientLight(0xffffff, 0.45)
            scene.add(ambientLight)

            let pos = gridConfig.sqPerSideOfGrid / 2 * 50

            globalDirLight = new THREE.DirectionalLight(0xffffff, 0.6)
            globalDirLight.position.set(pos, pos / 2, 0)
            globalDirLight.target.position.set(0,0,0)
            scene.add(globalDirLight)

			trackingDirLight = new THREE.DirectionalLight(0xffffff, 0.4)
            scene.add(trackingDirLight.target)
			scene.add(trackingDirLight)

        })()

        ;
        (function _initPlanes() {

            let gridSize = gridConfig.size
            let blockSize = gridConfig.blockSize

            let stdSideLen = gridSize * 2 + blockSize

            let nullMat = new THREE.MeshBasicMaterial({
                visible: false
            })

            // this is the plane the voxels are actually placed on.
            ;
            (function _initVoxelPlane() {

                let voxGeom = new THREE.PlaneGeometry(stdSideLen, stdSideLen)
                voxGeom.rotateX(-Math.PI / 2)

                let voxelPlane = new THREE.Mesh(voxGeom, nullMat)
                voxelPlane.name = 'plane'

                Raycast.add(voxelPlane)

                let axisHelper = new THREE.AxisHelper(150)
                scene.add(axisHelper)

            })()

            // This is the floor that is actually visible. It has to be offset
            // to reduce flickering from the selection plane
            ;
            (function _floorPlane() {

                let floorGeom = new THREE.PlaneGeometry(stdSideLen, stdSideLen)
                floorGeom.rotateX(-Math.PI / 2)
                floorGeom.translate(0, -25, 0)

                let floorMat = new THREE.MeshBasicMaterial({
                    color: '#f5f5f5'
                })

                let floorPlane = new THREE.Mesh(floorGeom, floorMat)

                scene.add(floorPlane)

            })()

            // This is the plane that MapControls uses to
            // pan and rotate
            ;
            (function _initControlsPlane() {

                let ctrlGeom = new THREE.PlaneGeometry(gridSize * 40, gridSize * 40)
                ctrlGeom.rotateX(-Math.PI / 2)

                mapControlsPlane = new THREE.Mesh(ctrlGeom, nullMat)

                mapControlsPlane.name = 'plane'

                scene.add(mapControlsPlane)

            })()

            // this is the transparent plane used to
            // select a region for editing
            ;
            (function _initRegionSelectPlane() {

                let spssp = gridConfig.sqPerSideOfSelectPlane

                let selGeom = new THREE.PlaneGeometry(blockSize * spssp, blockSize * spssp)
                selGeom.rotateX(-Math.PI / 2)
                selGeom.translate(0, -25, 0)

                let selMat = new THREE.MeshBasicMaterial({
                    color: '#ff0000',
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

                let blockSize = Config.getGrid().blockSize

                let ghostGeo = new THREE.CubeGeometry(blockSize, blockSize, blockSize)

                let ghostMaterial = new THREE.MeshBasicMaterial({
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

                let redXTexture = new THREE.ImageUtils.loadTexture('img/redx.png')

                let deleteGeo = new THREE.CubeGeometry(51, 51, 51)
                let deleteMat = new THREE.MeshPhongMaterial({
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

            let sps = Config.getGrid().sectionsPerSide

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
     * Turn the region select plane visibility on or off
     * @memberOf GameScene
     * @access public
     * @param {boolean} visible set visiblity
     */
    function setRegionSelectPlaneVis(visible) {

        if (!visible) {
            regionSelectPlane.material.opacity = 0.085
            regionSelectPlane.material.color.set(0xb1b1b1)
        } else {
            regionSelectPlane.material.opacity = 0.10
            regionSelectPlane.material.color.set(0xff0000)
        }

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

        let gPos = intersect.point.clone().initWorldPos()
        gPos.add(intersect.face.normal).worldToGrid()

        if (!VoxelUtils.validBlockLocation(gPos) ||
            Keys.isShiftDown() || !User.stateIsDefault()) {
            setGhostMeshVis(false)
            return
        }

        setGhostMeshVis(true)

        let gmp = ghostMesh.position

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

        let dmp = deleteMesh.position

        dmp.copy(intersect.point)
        dmp.sub(intersect.face.normal)
        dmp.initWorldPos()
        dmp.snapToGrid()

    }

    /**
     * Highlight all voxels owned by the voxel
     * that is currently intersected
     * @access public
     * @memberOf GameScene
     * @param  {THREE.Intersect} intersect The intersect
     */
    function highlightUserVoxels(intersect) {

        // return and reset if shouldn't highlight
        if (intersect.object.name === 'plane') {
            removeOutlines()
            GUI.displayString('')
            return
        }

        // get grid / world pos
        let wPos = intersect.point.clone().sub(intersect.face.normal)
        let gPos = intersect.point.clone().sub(intersect.face.normal)
        wPos.initWorldPos().snapToGrid()
        gPos.initWorldPos().worldToGrid()

        // voxel at intersect
        let voxel = WorldData.getVoxel(gPos)

        // get uname
        let username = voxel.isMesh ? voxel.userData.username : voxel.username

        // guest voxel
        if (!username || username === 'Guest') {
            GUI.displayString('Guest')
            return
        }

        // avoid redundant calls
        let currentHoveredUser = User.getCurrentHoveredUser()
        if (currentHoveredUser && username === currentHoveredUser) return

        // remove existing
        // outlines
        removeOutlines()

        // set some vars
        User.setCurrentHoveredUser(username)
        GUI.displayString(username)

        // get the user voxels
        let mergedGeo = VoxelUtils.buildOutlineGeom(username)

        // create the merged mesh and add it to the scene
        let outlineMaterial = new THREE.MeshBasicMaterial({
            color: GUI.getHighlightColor(),
            side: THREE.BackSide
        })

        let mergedMesh = new THREE.Mesh(mergedGeo, outlineMaterial)
        mergedMesh.name = 'outlineMesh'

        scene.add(mergedMesh)
        GameScene.render()

    }

    /**
     * Switch between the antialiasing
     * renderer and the non-antialiasing renderer
     * @access public
     * @memberOf GameScene
     */
    function switchRenderer() {

        removeCanvas()

        if (renderer === aarenderer)
            renderer = noaarenderer
        else renderer = aarenderer

        container.appendChild(renderer.domElement)

        onWindowResize()

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
     * @memberOf GameScene
     * @access public
     * @param  {THREE.Object} obj The object to remove
     */
    function removeFromScene(obj) {
        scene.remove(obj)
    }

    /**
     * Remove the canvas from the game container
     * @memberOf GameScene
     * @access public
     */
    function removeCanvas() {
        container.removeChild(container.getElementsByTagName('canvas')[0])
    }

    function setDirLightPos(position, target) {
        trackingDirLight.position.set(position.x, position.y, position.z)
        if (target) trackingDirLight.target.position.set(target.x, 500, target.z)
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
        render()

    }

    /**
     * Remove the outlineMesh from the scene
     * @memberOf GameScene
     * @access private
     */
    function removeOutlines() {
        User.setCurrentHoveredUser(undefined)
        for (let i = scene.children.length - 1; i >= 0; i--) {
            let obj = scene.children[i]
            if (obj.name === 'outlineMesh') {
                scene.remove(obj)
            }
        }
    }

    /*********** expose public methods *************/

    return {

        init: init,
        removeCanvas: removeCanvas,
        switchRenderer: switchRenderer,
        addToScene: addToScene,
        removeFromScene: removeFromScene,
        highlightUserVoxels: highlightUserVoxels,
        setDeleteMeshVis: setDeleteMeshVis,
        setGhostMeshVis: setGhostMeshVis,
        setRegionSelectPlaneVis: setRegionSelectPlaneVis,
        setGhostMeshColor: setGhostMeshColor,
        updateGhostMesh: updateGhostMesh,
        updateDeleteMesh: updateDeleteMesh,
        moveRegionSelectPlane: moveRegionSelectPlane,
        getMapControlsPlane: getMapControlsPlane,
        removeOutlines: removeOutlines,
        getScene: getScene,
        getCamera: getCamera,
        getPSystem: getPSystem,
        getPSystemExpo: getPSystemExpo,
        setDirLightPos: setDirLightPos,
        render: render

    }

}(window)

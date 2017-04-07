/**
 * The game scene.
 * @namespace Scene
 */
var Scene = function(window, undefined) {

    if (!Detector.webgl) Detector.addGetWebGLMessage()

    /******************************************\
    | Class Variables                          |
    \******************************************/

    // public
    var scene
    var camera
    var renderer

    // private
    var container
    var sqPerSideOfSection = 151 // odd
    var sectionsPerSide = 17
    var sqPerSideOfGrid = sqPerSideOfSection * sectionsPerSide - 1 // must be odd
    var gridSize = sqPerSideOfGrid * 25 // scene size of the grid; must be even
    var sqPerSideOfSelectGrid = 351 // < sqPerSideOfSection, odd

    /**************************************\
    | Initialization                       |
    \**************************************/

    function init() {

        scene = new THREE.Scene()
        raycaster = new THREE.Raycaster()
        container = document.getElementById('container')

        ;
        (function _initCamera() {

            var config = {
                fov: 45,
                near: 100,
                far: 300000,
                distMult: 1
            }

            var aspect = window.innerWidth / window.innerHeight

            camera = new THREE.PerspectiveCamera(config.fov, aspect, config.near, config.far)
            camera.position.set(10000 * config.distMult, 15000 * config.distMult, 10000 * config.distMult)
            camera.lookAt(new THREE.Vector3()) // look at 0, 0, 0

        })()

        ;
        (function _initRenderer() {

            var config = {
                clearColor: 0xffffff
            }

            renderer = new THREE.WebGLRenderer({
                antialias: true
            })
            renderer.setClearColor(config.clearColor)
            renderer.sortObjects = false
            renderer.setSize(window.innerWidth, window.innerHeight)
            container.appendChild(renderer.domElement)

        })()

        ;
        (function _initLights() {

            var ambientLight = new THREE.AmbientLight(0x606060)
            scene.add(ambientLight)

        })()

        ;
        (function _initMeshes() {

            var geometry = new THREE.PlaneGeometry(gridSize * 2 + 50, gridSize * 2 + 50)
            geometry.rotateX(-Math.PI / 2)

            // this is the plane the voxels are actually placed on.
            ;
            (function _initVoxelPlane() {

                voxelPlane = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
                    color: "#ffffff",
                    visible: false,
                    opacity: 1
                }))

                voxelPlane.name = "plane"

                scene.add(voxelPlane)
                raycastArr.push(voxelPlane)

            })()

            // This is the floor that is actually visible. It has to be offset
            // to reduce flickering from the selection plane
            ;
            (function _floorPlane() {

                var floorGeo = new THREE.PlaneGeometry(gridSize * 2 + 50, gridSize * 2 + 50)
                floorGeo.rotateX(-Math.PI / 2)
                floorGeo.translate(0, -25, 0)

                var floorPlane = new THREE.Mesh(floorGeo, new THREE.MeshBasicMaterial({
                    color: "#000000",
                    visible: true,
                    transparent: true,
                    opacity: 0.045
                }))

                scene.add(floorPlane)

            })()

            // This is the plane that MapControls uses to
            // pan and rotate
            ;
            (function _initControlsPlane() {

                var controlGeo = new THREE.PlaneGeometry(gridSize * 40, gridSize * 40)
                controlGeo.rotateX(-Math.PI / 2)

                mapControlsPlane = new THREE.Mesh(controlGeo, new THREE.MeshBasicMaterial({
                    color: '#ffff00',
                    visible: false
                }))

                mapControlsPlane.name = "plane"

                scene.add(mapControlsPlane)

            })()

            // this is the transparent plane used to
            // select a region for editing
            ;
            (function _initRegionSelectPlane() {

                var geo = new THREE.PlaneGeometry(50 * sqPerSideOfSelectGrid, 50 * sqPerSideOfSelectGrid),
                    mat = new THREE.MeshBasicMaterial({
                        color: "#008cff",
                        opacity: 0.10,
                        transparent: true,
                        visible: true
                    })

                geo.rotateX(-Math.PI / 2)
                geo.translate(0, -25, 0)

                regionSelectPlane = new THREE.Mesh(geo, mat)

                scene.add(regionSelectPlane)

            })()

        })()

        ;
        (function _initCubeInfo() {

            // voxel shown when hovering grid
            ;
            (function _initGhostVoxelInfo() {

                rollOverGeo = new THREE.CubeGeometry(50, 50, 50)

                rollOverMaterial = new THREE.MeshBasicMaterial({
                    color: guiSettings.blockColor,
                    transparent: true,
                    opacity: 0.5,
                    visible: false
                })

                rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial)
                scene.add(rollOverMesh)

            })()

            ;
            // cube rendered over voxel when hovered and shift is held
            (function _initDeleteVoxel() {

                var redXTexture = new THREE.ImageUtils.loadTexture("images/redx.png"),

                    deleteVoxel = new THREE.Mesh(new THREE.CubeGeometry(51, 51, 51), new THREE.MeshPhongMaterial({
                        map: redXTexture,
                        color: 0xffffff,
                        transparent: true,
                        opacity: 0.4,
                        visible: false
                    }))
            })()

            scene.add(deleteVoxel)

        })()

    }

    function render() {
        renderer.render(scene, camera)
    }

    // zoom, pan, rotate logic
    //MapControls(camera, render, document, mapControlsPlane);

    return {
        init: init
    }

}(window)

'use strict'

/**
 * The game scene.
 * @namespace Scene
 */
var GameScene = function(window, undefined) {

    if (!Detector.webgl) Detector.addGetWebGLMessage()

    /******************************************\
    | Class Variables                          |
    \******************************************/

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

    /******************************************\
    | Functions                                |
    \******************************************/

    function init() {

        scene = new THREE.Scene()
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

            var gridSize = Config.getGrid().size

            var geometry = new THREE.PlaneGeometry(gridSize * 2 + 50, gridSize * 2 + 50)
            geometry.rotateX(-Math.PI / 2)

            // this is the plane the voxels are actually placed on.
            ;
            (function _initVoxelPlane() {

                var voxelPlane = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
                    color: "#ffffff",
                    visible: false,
                    opacity: 1
                }))

                voxelPlane.name = "plane"

                scene.add(voxelPlane)
                Raycast.add(voxelPlane)

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

                var spssp = Config.getGrid().sqPerSideOfSelectPlane

                var geo = new THREE.PlaneGeometry(50 * spssp, 50 * spssp),
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
        (function _initHoverVoxels() {

            // voxel shown when hovering grid
            ;
            (function _initGhostVoxel() {

                var ghostGeo = new THREE.CubeGeometry(50, 50, 50)

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

                var redXTexture = new THREE.ImageUtils.loadTexture("img/redx.png")

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

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()

        renderer.setSize(window.innerWidth, window.innerHeight)

    }

    function render() {

        renderer.render(scene, camera)

    }

    /******************Getters *************/

    function getScene() {
        return scene
    }

    function getCamera() {
        return camera
    }

    function getRenderer() {
        return renderer
    }

    function getMapControlsPlane() {
        return mapControlsPlane
    }

    function getVoxelPlane() {
        return voxelPlane
    }

    function getRegionSelectPlane() {
        return regionSelectPlane
    }

    function getGhostMesh() {
        return ghostMesh
    }

    function getDeleteMesh() {
        return deleteMesh
    }

    function getPSystem() {
        return particleSystem
    }

    function getPSystemExpo() {
        return pSystemExpansion
    }

    /*************Public module elements ***********/

    return {

        init: init,
        getScene: getScene,
        getCamera: getCamera,
        getRenderer: getRenderer,
        getMapControlsPlane: getMapControlsPlane,
        getVoxelPlane: getVoxelPlane,
        getRegionSelectPlane: getRegionSelectPlane,
        getGhostMesh: getGhostMesh,
        getDeleteMesh: getDeleteMesh,
        getPSystem: getPSystem,
        getPSystemExpo: getPSystemExpo,
        render: render

    }

}(window)

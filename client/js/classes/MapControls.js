'use strict'

/**
 * @author Jacek Jankowski / http://grey-eminence.org/
 */

// It is an adaptation of the three.js OrbitControls class to map environments

/**
 * Handles the zoom, pan, and rotate controls
 * @namespace MapControls
 */
 var MapControls = function() {

     var enabled
     var target
     var raycastPlane
     var camera
     var config

     // constraints
     var camMinxz
     var camMaxxz
     var camMiny
     var camMaxy

     function init() {

         enabled = true
         this.target = new THREE.Vector3()
         raycastPlane = GameScene.getMapControlsPlane()
         camera = GameScene.getCamera()
         config = Config.getMapControls()

         camMinxz = config.camMinxz
         camMaxxz = config.camMaxxz
         camMiny  = config.camMiny
         camMaxy  = config.camMaxy

     }

    // internals
    var EPS = 0.000001
    var rotateStart = new THREE.Vector2()
    var rotateEnd = new THREE.Vector2()
    var rotateDelta = new THREE.Vector2()
    var panStart = new THREE.Vector3()
    var panDelta = new THREE.Vector3()
    var phiDelta = 0
    var thetaDelta = 0
    var lastPosition = new THREE.Vector3()
    var STATE = {
        NONE: -1,
        ROTATE: 0,
        DOLLY: 1,
        PAN: 2
    }
    var state = STATE.NONE
    var vector, projector, intersects,
        raycaster = new THREE.Raycaster()

    function update() {

        if (lastPosition.distanceTo(camera.position) > 0) {

            GameScene.render()
            lastPosition.copy(camera.position)

        }

    }

    function getIntersects(xy) {
        raycaster.setFromCamera(xy, camera)
        return raycaster.intersectObject(raycastPlane)
    }

    function onMouseDown(event) {

        event.preventDefault()

        if (!enabled) {
            return
        }

        var intersects
        if (event.button === 1) {

            state = STATE.PAN

            var mouseX = (event.clientX / window.innerWidth) * 2 - 1
            var mouseY = -(event.clientY / window.innerHeight) * 2 + 1

            intersects = getIntersects({
                x: mouseX,
                y: mouseY
            })

            if (intersects.length > 0) {

                panStart = intersects[0].point

            }

        } else if (event.button === 2) {

            state = STATE.ROTATE

            intersects = getIntersects({
                x: 0,
                y: 0
            })

            if (intersects.length > 0) {
                target = intersects[0].point
            }

            rotateStart.set(event.clientX, event.clientY)

        }

        document.addEventListener('mousemove', onMouseMove, false)
        document.addEventListener('mouseup', onMouseUp, false)

    }

    function onMouseMove(event) {

        if (enabled === false) return

        event.preventDefault()

        var element = document === document ? document.body : document

        if (state === STATE.PAN) {

            var mouseX = (event.clientX / window.innerWidth) * 2 - 1
            var mouseY = -(event.clientY / window.innerHeight) * 2 + 1

            var intersects = getIntersects({
                x: mouseX,
                y: mouseY
            })

            if (intersects.length > 0) {

                panDelta = intersects[0].point

                var delta = new THREE.Vector3()
                delta.subVectors(panStart, panDelta)

                //console.log(camera.position)
                var pos = camera.position.clone()
                pos.addVectors(pos, delta)

                if ((pos.x < camMinxz && pos.x < camera.position.x) ||
                    (pos.x > camMaxxz && pos.x > camera.position.x) ||
                    (pos.z < camMinxz && pos.z < camera.position.z) ||
                    (pos.z > camMaxxz && pos.z > camera.position.z)) return

                camera.position.addVectors(camera.position, delta)

                update()

            }

        } else if (state === STATE.ROTATE) {

            rotateEnd.set(event.clientX, event.clientY)
            rotateDelta.subVectors(rotateEnd, rotateStart)

            thetaDelta -= 2 * Math.PI * rotateDelta.x / element.clientWidth * config.rotateSpeed
            phiDelta -= 2 * Math.PI * rotateDelta.y / element.clientHeight * config.rotateSpeed

            var position = camera.position
            var offset = position.clone().sub(target)

            // angle from z-axis around y-axis
            var theta = Math.atan2(offset.x, offset.z)

            // angle from y-axis
            var phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y)

            theta += thetaDelta
            phi += phiDelta

            // restrict phi to be between desired limits
            phi = Math.max(config.minPolarAngle, Math.min(config.maxPolarAngle, phi))

            // restrict phi to be betwee EPS and PI-EPS
            phi = Math.max(EPS, Math.min(Math.PI - EPS, phi))

            var radius = offset.length()

            // restrict radius to be between desired limits
            radius = Math.max(config.minDistance, Math.min(config.maxDistance, radius))

            offset.x = radius * Math.sin(phi) * Math.sin(theta)
            offset.y = radius * Math.cos(phi)
            offset.z = radius * Math.sin(phi) * Math.cos(theta)

            position.copy(target).add(offset)

            camera.lookAt(target)

            thetaDelta = 0
            phiDelta = 0

            rotateStart.copy(rotateEnd)

            update()

        }

    }

    function onMouseUp( /* event */ ) {

        if (enabled === false) return

        document.removeEventListener('mousemove', onMouseMove, false)
        document.removeEventListener('mouseup', onMouseUp, false)

        state = STATE.NONE

    }

    function onMouseWheel(event) {

        if (enabled === false) return

        var delta = 0

        if (event.wheelDelta) { // WebKit / Opera / Explorer 9

            delta = event.wheelDelta

        } else if (event.deltaY) { // Firefox

            delta = -event.deltaY * zoomSpeed * 25

        }

        var zoomOffset = new THREE.Vector3()
        var te = camera.matrix.elements
        zoomOffset.set(te[8], te[9], te[10])
        zoomOffset.multiplyScalar(delta * -config.zoomSpeed * camera.position.y / 1000)

        var pos = camera.position.clone()
        pos.addVectors(pos, zoomOffset)
        //
        if ((delta < 0 && pos.y > camMaxy) ||
            (delta > 0 && pos.y < camMiny) ||
            (pos.x < camMinxz && pos.x < camera.position.x) ||
            (pos.x > camMaxxz && pos.x > camera.position.x) ||
            (pos.z < camMinxz && pos.z < camera.position.z) ||
            (pos.z > camMaxxz && pos.z > camera.position.z)) return

        camera.position.addVectors(camera.position, zoomOffset)
        update()

    }

    document.addEventListener('contextmenu', function(event) {
        event.preventDefault()
    }, false)
    document.addEventListener('mousedown', onMouseDown, false)
    document.addEventListener('wheel', onMouseWheel, false)

    return {
        init: init
    }

}()

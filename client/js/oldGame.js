String.prototype.isCoordStr = function() {
  var formatReg = /x[-]*\d+y[-]*\d+z[-]*\d+/
  return !!formatReg.exec(this)
}

Array.prototype.removeObj = function(obj) {
  for (var i = 0, len = this.length; i < len; i++) {
    if (this[i] === obj) {
      this.splice(i, 1)
      break
    }
  }
}

function modalClosed() {

  $(document).trigger("modalClosed")

}

/**
 * The main class. Contains bulk of the game logic.
 * @namespace Game
 */
var Scene = function(window, undefined) {

  if (!Detector.webglg) Detector.addGetWebGLMessage()

  /******************************************\
  | Class Variables                          |
  \******************************************/

  // essentials
  var scene, // the threejs scene
    camera, // the scene's camera
    renderer, // the scene's renderer
    raycaster, // used to raycast
    container, // the container the scene will be contained in
    clearColor = 0xffffff, // the color to clear the scene with
    raycastArr = [] // array of objects to raycast against

  // meshes
  var voxelPlane, // main plane voxels are placed on; also used in MapControls
    mapControlsPlane, // plane used for dragging / panning
    regionSelectPlane // the plane used in picking region

  /**
   * 2D array of all voxels currently in the scene. Can contain
   * THREE.Mesh's as well as simple objects
   * @memberOf! VoxelWorld
   */
  var voxels = [] // all voxels in the scene, including those that have not been merged

  // cube info
  // @TODO: rename all to "hover"
  var rollOverMesh, // mesh for the ghost hover cube
    rollOverMaterial // material for the ghost hover cube

  // misc
  var keys = { // keystate info
      shiftDown: false,
      ctrlDown: false
    },
    sqPerSideOfSection = 151, // odd
    sectionsPerSide = 17,
    sqPerSideOfGrid = sqPerSideOfSection * sectionsPerSide - 1, // +1
    gridSize = sqPerSideOfGrid * 25, // size of the grid; must be even
    sqPerSideOfSelectGrid = 351, // < sqPerSideOfSection, odd

    mouse, // @TODO: describe / move
    /**
     * User control state. These are used
     * only when the user is in edit mode
     * @memberOf! VoxelWorld
     * @enum {number}
     */
    states = { // user control state
      /** The default state */
      DEFAULT: -1,
      /** User is picking a color */
      PICKCOLOR: 0
    },
    /**
     * Describes whether the user is in select or edit mode
     * @memberOf! VoxelWorld
     * @enum {number}
     */
    modes = {
      /** Region select mode */
      REGIONSELECT: 0,
      /** Edit mode */
      EDIT: 1
    },
    state = states.DEFAULT,
    mode = modes.REGIONSELECT,
    guiClicked = false, // @TODO: describe / move
    chatClicked = false,
    pickColor = 0, // used in color picking
    mouseRightDown = false,
    mouseMiddleDown = false,
    currentSelection,
    maxVoxelHeight = 75

  $('#chatBox').mousedown(function() {
    chatClicked = true
  })

  // settings for dat.gui
  var guiSettings = {

    // colors
    blockColor: 0xffffff * Math.random(),
    randomColor: function() {
      this.blockColor = 0xffffff * Math.random()
      rollOverMaterial.color.setHex(this.blockColor ^ 0x4C000000)
    },
    colorPicker: function() {
      if (state === states.DEFAULT) {
        rollOverMesh.material.visible = false
        state = states.PICKCOLOR
      } else {
        rollOverMesh.material.visible = true
        state = states.DEFAULT
      }
    },
    savedColor1: 0xff0000 * Math.random(),
    savedColor2: 0xff0000 * Math.random(),
    savedColor3: 0xff0000 * Math.random(),
    savedColor4: 0xff0000 * Math.random(),

    // options
    sqPerSideSelectGrid: sqPerSideOfSelectGrid,
    viewOnly: false,
    showControls: function() {
      $('#basic-modal-content').modal({
        onClose: function() {
          modalClosed()
          $.modal.impl.close()
        }
      })
      $(document).trigger('modalOpened')
    },
    coolDownTimer: 0,
    numClients: 0

  }

  // for placement timer
  var timer,
    interval,
    updateInterval = 0.5

  var lastAction = new Date()

  function resetTimer(duration) {

    timer = duration

    function decrementTimer() {

      timer -= updateInterval
      if (timer < 0) {
        clearInterval(interval)
      }
    }

    decrementTimer()

    interval = setInterval(function() {

      decrementTimer()

    }, (updateInterval * 1000));
  }

  /**************************************\
  | Class Functions                      |
  \**************************************/

  /************* Event Handlers **********/

  function onDocumentMouseUp(e) {

    if (e.which === 2) mouseMiddleDown = false
    mouseRightDown = false

  }

  function onDocumentMouseDown(event) {

    // middle
    if (event.which === 2) mouseMiddleDown = true

    if (event.which === 1) { // left

      (function _handleLeftClick() {

        // don't do anything if it was the gui that was clicked
        if (guiClicked || chatClicked) {
          guiClicked = false
          chatClicked = false
          return
        }

        if (guiSettings.viewOnly && mode === modes.EDIT) return

        var intersect = getMouseIntersects({
          event: event
        }).closest;

        (function _handleIntersects() {

          if (intersect) {

            var objName = intersect.object.name

            var p = intersect.point.clone().initWorldPos()
            p.add(intersect.face.normal).worldToGrid()

            if (mode === modes.EDIT) {

              if (p.y >= maxVoxelHeight && !keys.shiftDown && state !== states.PICKCOLOR) {
                alert('too high')
                return
              }

              if (withinSelectionBounds(p)) {

                // set pick color
                if (state === states.PICKCOLOR) {
                  if (objName !== "plane") {
                    (function _setPickColor() {

                      if (intersect.object.name === "BufferMesh") {

                        var cArr = intersect.object.geometry.attributes.color.array,
                          idx = intersect.index * 3

                        pickColor = new THREE.Color(cArr[idx], cArr[idx + 1], cArr[idx + 2])

                      } else if (intersect.object.name === "Voxel") {
                        pickColor = intersect.face.color
                      }

                      guiSettings.blockColor = pickColor.getHex()
                      state = states.DEFAULT
                      rollOverMesh.material.visible = true
                      rollOverMaterial.color.setHex(guiSettings.blockColor ^ 0x4C000000)

                    })();
                  }
                }
                // delete voxel
                else if (keys.shiftDown) {

                  if (enoughTimePassed()) {

                    if (objName !== "plane") {

                      (function _deleteCube() {

                        if (intersect.object.name === "Voxel") {

                          var gPos = intersect.object.position.clone().initWorldPos().worldToGrid()
                          deleteFromNew(gPos, true)

                        } else {

                          var gPos = (intersect.point).sub(intersect.face.normal).initWorldPos()

                          gPos.worldToGrid()
                          deleteFromMerged(gPos, true)
                        }

                        var e = $.Event('mousemove')
                        e.clientX = mouse.clientX
                        e.clientY = mouse.clientY
                        onDocumentMouseMove(e, true)

                      })();
                    }

                  }
                }
                // add voxel
                else if (intersect.object !== mapControlsPlane) {

                  if (enoughTimePassed()) {

                    (function _createVoxel() {

                      var gPos = intersect.point.add(intersect.face.normal).initWorldPos()
                      gPos.worldToGrid()
                      createAndAddVoxel(gPos, guiSettings.blockColor, true)

                    })();

                  }
                }

              }

            } else if (mode === modes.REGIONSELECT) {

              var spssg = ((sqPerSideOfSelectGrid - 1) / 2)
              var c1 = new THREE.Vector3(p.x - spssg, p.y, p.z - spssg).initGridPos(),
                c2 = new THREE.Vector3(p.x + spssg, p.y, p.z + spssg).initGridPos()

              mode = modes.EDIT
              convertToVoxels(c1, c2)

            }
          }

        })();

      })();

    }

  }

  var n = 0 // mousemove call cycle tracker
  function onDocumentMouseMove(event, forceRaycast) {

    event.preventDefault()

    mouse.clientX = event.clientX
    mouse.clientY = event.clientY

    var intersect

    if (mode === modes.EDIT) {

      // only raycast every nth time
      if (!forceRaycast) {
        if (!(n === 1)) {
          n++
          return
        } else n = 0
      }

      if (guiSettings.viewOnly) return
    }

    var intersects = getMouseIntersects({
      event: event
    })
    intersect = intersects.closest

    if (intersect) {
      if (mode === modes.EDIT) {
        if (intersect.object.name !== "plane") { // intersected voxel

          if (keys.shiftDown) { // delete  mode

            (function _moveDeleteVoxel() {

              deleteVoxel.material.visible = true

              // set position
              deleteVoxel.position.copy(intersect.point).sub(intersect.face.normal).initWorldPos()
              deleteVoxel.position.setWorldPosition()

            })();

          }

        } else { // intersected plane

          deleteVoxel.material.visible = false

        }

        (function _moveRollOverMesh() {

          var gPos = intersect.point.clone().initWorldPos()
          gPos.add(intersect.face.normal).worldToGrid()

          if (withinSelectionBounds(gPos)) {

            if (!keys.shiftDown)
              rollOverMesh.material.visible = true

            rollOverMesh.position.copy(intersect.point)
              .add(intersect.face.normal).initWorldPos()

            rollOverMesh.position.setWorldPosition()

          } else {
            rollOverMesh.material.visible = false
          }

        })();

      } else if (mode === modes.REGIONSELECT) {
        (function _moveRegionSelectPlane() {

          var voxelPlaneIntx = intersects.voxelPlane

          if (voxelPlaneIntx) {

            regionSelectPlane.position.copy(voxelPlaneIntx.point).add(voxelPlaneIntx.face.normal).initWorldPos()
            regionSelectPlane.position.setWorldPosition()

          }

        })();
      }
    }
  }

  function onDocumentKeyDown(event) {

    /**
     * Loads a color into the blockColor
     * @param {THREE.Color} color The color to load
     */
    function loadSavedColor(color) {

      if (state === states.PICKCOLOR) return
      guiSettings.blockColor = color
      rollOverMaterial.color.setHex(guiSettings.blockColor ^ 0x4C000000)

    }

    // 1, 2, 3, or 4
    if (event.keyCode === 49 || event.keyCode === 50 ||
      event.keyCode === 51 || event.keyCode === 52) {
      if (event.keyCode === 49) { // 1
        if (keys.ctrlDown) {
          guiSettings.savedColor1 = guiSettings.blockColor
          event.preventDefault()
        } else loadSavedColor(guiSettings.savedColor1)
      }

      if (event.keyCode === 50) { // 2
        if (keys.ctrlDown) {
          guiSettings.savedColor2 = guiSettings.blockColor
          event.preventDefault()
        } else loadSavedColor(guiSettings.savedColor2)
      }

      if (event.keyCode === 51) { // 3
        if (keys.ctrlDown) {
          guiSettings.savedColor3 = guiSettings.blockColor
          event.preventDefault()
        } else loadSavedColor(guiSettings.savedColor3)
      }

      if (event.keyCode === 52) { // 4
        if (keys.ctrlDown) {
          guiSettings.savedColor4 = guiSettings.blockColor
          event.preventDefault()
        } else loadSavedColor(guiSettings.savedColor4)
      }
    }

    switch (event.keyCode) {

      case 27: // esc

        if (mode === modes.EDIT) {
          mode = modes.REGIONSELECT
          convertToPixels()
          currentSelection = undefined
          rollOverMesh.material.visible = false
        }

        break

      case 16: // shift

        if (!keys.shiftDown) {

          keys.shiftDown = true
          rollOverMesh.material.visible = false

          var e = $.Event('mousemove')
          e.clientX = mouse.clientX
          e.clientY = mouse.clientY

          $(document).trigger(e)

          break

        }

      case 17: // ctrl

        keys.ctrlDown = true
        break

    }
  }

  function onDocumentKeyUp(event) {

    switch (event.keyCode) {

      case 16: // shift

        if (keys.shiftDown) {

          keys.shiftDown = false
          rollOverMesh.material.visible = true
          deleteVoxel.material.visible = false
          break

        }

      case 17: // ctrl

        keys.ctrlDown = false
        break

    }

  }

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)

  }

  /*************************************/

  /**
   * Add a pixel to the pixel system expansion.
   * @memberOf! VoxelWorld
   * @param {VoxelUtils.GridVector3} gPos Grid position to add at
   * @param {THREE.Color} color Color of the pixel
   */
  function addPixel(gPos, color) {

    var index = pSystemExpansion.addPixel(gPos, color)

    var sid = getSectionIndices(gPos)
    addToVoxels(sid, color.getHex(), index, true, VoxelUtils.getCoordStr(gPos))

  }

  /**
   * Array used in convertToVoxels and convertToPixels. Stores array
   * of {@link VoxelUtils.coordStr}.
   * @memberOf! VoxelWorld
   */
  var voxArr = []
  var flag = true

  /**
   * Converts the specified region from pixels to voxels.
   * @memberOf! VoxelWorld
   * @param {VoxelUtils.GridVector3} corner1 Top left corner of the region to convert
   * @param {VoxelUtils.GridVector3} corner2 Bottom right corner of the region to convert
   */
  function convertToVoxels(corner1, corner2) {

    // constraints
    if (corner1.x < -(sqPerSideOfGrid / 2))
      corner1.x = -(sqPerSideOfGrid / 2)
    if (corner1.z < -(sqPerSideOfGrid / 2))
      corner1.z = -(sqPerSideOfGrid / 2)
    if (corner2.x > (sqPerSideOfGrid / 2))
      corner2.x = (sqPerSideOfGrid / 2)
    if (corner2.z > (sqPerSideOfGrid / 2))
      corner2.z = (sqPerSideOfGrid / 2)

    currentSelection = {
      c1: corner1,
      c2: corner2
    }

    var c1Sid = getSectionIndices(corner1)
    var c2Sid = getSectionIndices(corner2)

    for (var x = c1Sid.a; x <= c2Sid.a; x++) {
      for (var z = c1Sid.b; z <= c2Sid.b; z++) {
        for (var voxPos in voxels[x][z]) {

          var pos = VoxelUtils.coordStrParse(voxPos)
          if (pos.x >= corner1.x && pos.z >= corner1.z &&
            pos.x <= corner2.x && pos.z <= corner2.z)
            voxArr.push(voxPos)

        }

      }
    }

    var numCubes = voxArr.length

    // WARN 15,000
    // MAX 30,000

    if (!guiSettings.viewOnly) {
      if (numCubes > 15000 && numCubes < 30000) {
        alert("warning: converting " + numCubes + " voxels could cause performance issues")
      } else if (numCubes >= 30000) {
        alert("error: converting " + numCubes + " voxels would cause performance issues")
        mode = modes.REGIONSELECT
        voxArr = []
        return
      }
    } else {
      if (numCubes > 100000 && numCubes < 250000) {
        alert("warning: converting " + numCubes + " voxels could cause performance issues")
      } else if (numCubes >= 250000) {
        alert("error: converting " + numCubes + " voxels would cause performance issues")
        mode = modes.REGIONSELECT
        voxArr = []
        return
      }
    }

    bufMesh = new BufMeshObj(numCubes, scene)

    var i = 0
    voxArr.forEach(function(voxPos) {

      var gPos = VoxelUtils.coordStrParse(voxPos).initGridPos(),
        wPos = gPos.clone().gridToWorld(),
        sid = getSectionIndices(gPos),
        vox = voxels[sid.a][sid.b][voxPos]

      var color = vox.c
      var tColor = new THREE.Color(color)

      // vvv this fixes raycast lag ???????????????????
      if (i === 0)
        console.log(wPos)
      // ^^^ what in the fucking fuck

      bufMesh.addVoxel(i, wPos, tColor)

      var pIdx = vox.pIdx

      if (vox.exp)
        pSystemExpansion.hidePixel(pIdx)
      else
        particleSystem.hidePixel(sid, pIdx)

      vox.bIdx = i

      i += bufVerts.length
    })

    raycastArr.push(bufMesh._mesh)
    bufMesh.addToScene()

  }

  /**
   * Converts the currently selected region from voxels to pixels.
   * @memberOf! VoxelWorld
   */
  function convertToPixels() {

    var i = 0
    voxArr.forEach(function(voxPos) {

      var gPos = VoxelUtils.coordStrParse(voxPos),
        gPos = new THREE.Vector3(gPos.x, gPos.y, gPos.z).initGridPos(),
        wPos = gPos.clone().gridToWorld()

      var sid = getSectionIndices(gPos),
        vox = voxels[sid.a][sid.b][voxPos]

      if (vox) {
        if (vox.isMesh) { // newly created
          var c = vox.geometry.faces[0].color

          addPixel(gPos, c)

          scene.remove(vox)
          raycastArr.removeObj(vox)
        } else {
          if (vox.exp)
            pSystemExpansion.showPixel(vox.pIdx)
          else
            particleSystem.showPixel(sid, vox.pIdx)
        }
      } else {
        console.warn('voxArr entry has no associated voxels entry')
        voxArr.splice(i, 1)
      }

      i++

    })

    raycastArr.removeObj(bufMesh._mesh)

    bufMesh.removeFromScene()
    bufMesh.delete()

    voxArr = []

  }

  var testidx = 0

  /**
   * Deletes a specified voxel from the buffer geometry.
   * @memberOf! VoxelWorld
   * @param {VoxelUtils.GridVector3} gPos Grid position of the voxel to delete
   * @param {boolean} emit Whether or not to broadcast the delete via socket.emit
   */
  function deleteFromMerged(gPos, emit) {
    function removeBlock() {

      var sid = getSectionIndices(gPos),
        vox = voxels[sid.a][sid.b][VoxelUtils.getCoordStr(gPos)]

      bufMesh.removeVoxel(vox.bIdx)

      voxArr.removeObj(VoxelUtils.getCoordStr(gPos))
      removeFromVoxels(sid, VoxelUtils.getCoordStr(gPos))

      if (vox.exp) {
        pSystemExpansion.deletePixel(vox.pIdx)
      }

    }

    if (emit) {

      socket.emit('block removed', {
        x: gPos.x,
        y: gPos.y,
        z: gPos.z
      }, function(response) {

        if (response === 'success') {
          removeBlock()
        }

      })
    } else removeBlock()

  }

  function enoughTimePassed() {
    var lastActionSecs = (new Date() - lastAction) / 1000
    if (lastActionSecs < 0.5) return false
    lastAction = new Date()
    return true
  }

  /**
   * Deletes a specified voxel mesh.
   * @memberOf! VoxelWorld
   * @param {VoxelUtils.GridVector3} gPos Grid position of the voxel to delete
   * @param {boolean} emit Whether or not to broadcast the delete via socket.emit
   */
  function deleteFromNew(gPos, emit) {

    var sid = getSectionIndices(gPos)
    vox = voxels[sid.a][sid.b][VoxelUtils.getCoordStr(gPos)]

    function removeBlock() {

      var coordStr = VoxelUtils.getCoordStr(gPos)

      scene.remove(vox)
      removeFromVoxels(sid, coordStr)
      raycastArr.removeObj(vox)
      voxArr.removeObj(coordStr)

      if (vox.exp) {
        pSystemExpansion.deletePixel(vox.pIdx)
      }

    }

    if (emit) {

      socket.emit('block removed', {
        x: gPos.x,
        y: gPos.y,
        z: gPos.z
      }, function(response) {

        if (response === 'success') {
          removeBlock()
        }

      })
    } else removeBlock()


  }

  function getMouseIntersects(args) {

    var intersect, voxelPlane

    mouse.x = (args.event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(args.event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    var intersects = raycaster.intersectObjects(raycastArr)

    var minDist = Number.MAX_VALUE
    intersects.forEach(function(intx) {
      if (intx.distance < minDist) {
        intersect = intx
        minDist = intx.distance
      }
      if (intx.object.name === "plane") voxelPlane = intx
    })

    if (args && args.retArray)
      return intersects

    return {
      closest: intersect,
      voxelPlane: voxelPlane
    }
  }

  /**
   * Checks to see if a coordinate is within the bounds of the
   * currently selected region.
   * @memberOf! VoxelWorld
   * @param {VoxelUtils.GridVector3} gPos Grid position to check
   * @returns {boolean}
   */
  function withinSelectionBounds(gPos) {

    if (keys.shiftDown) return true

    return (gPos.x >= currentSelection.c1.x &&
      gPos.z >= currentSelection.c1.z &&
      gPos.x <= currentSelection.c2.x &&
      gPos.z <= currentSelection.c2.z &&
      gPos.y < maxVoxelHeight)
  }

  /**
   * Creates and adds a new voxel mesh to the scene.
   * @memberOf! VoxelWorld
   * @param {VoxelUtils.GridVector3} gPos Grid position of the voxel to create
   * @param {Number} color Hex color of the voxel
   */
  function createAndAddVoxel(gPos, color, emit) {

    var voxelMesh = VoxelUtils.initVoxel({
      color: color,
      gPos: gPos
    })

    function updateObjs() {

      var sid = getSectionIndices(gPos)
      voxels[sid.a][sid.b][VoxelUtils.getCoordStr(gPos)] = voxelMesh

      raycastArr.push(voxelMesh)
      voxArr.push(VoxelUtils.getCoordStr(gPos))

      scene.add(voxelMesh)

    }

    if (emit) {
      socket.emit('block added', {
        color: color,
        position: {
          x: gPos.x,
          y: gPos.y,
          z: gPos.z
        }
      }, function(response) {

        if (response === 'success') {
          updateObjs()
        } else if (response === 'max') {
          alert('maximum voxel limit reached.')
        }

      })
    } else updateObjs()
  }

  /**
   * Load all of the world data and add it to the scene.
   * @memberOf VoxelWorld
   * @param {Object} voxelData Contains
   * @param {VoxelUtils.coordStr} voxelData.coordStr Coordinate string in grid coordinates.
   * @param {Number} voxelData.coordStr.c Hex color of the voxel
   */
  function loadWorldData(voxelData) {

    console.log('loading pixels into scene')

    var numCubes = VoxelUtils.countObjAttrs(voxelData)

    console.log("num pixels to load: " + numCubes)

    var numLoaded = 0

    // initialize all voxels
    for (var coord in voxelData) {

      // get some data
      var color = voxelData[coord].c,
        tColor = new THREE.Color(color)

      var gPos = VoxelUtils.coordStrParse(coord),
        sid = getSectionIndices(gPos)

      var wPos = gPos.clone().gridToWorld()

      var pIdx = particleSystem.addPixel(sid, wPos, tColor)
      addToVoxels(sid, color, pIdx, false, coord)

      numLoaded++

      if (numLoaded % 15000 === 0)
        console.debug(((numLoaded / numCubes) * 100).toFixed(0) + '% added to scene')

    }

    // add particle systems to scene
    particleSystem.addToScene()

    console.log('done loading pixels')
    animate()
    chunkData = undefined

  }

  /**
   * Creates an entry in the voxels object with the specified
   * parameters.
   *
   * @memberOf VoxelWorld
   * @param {VoxelUtils.Tuple} sid Section indices
   * @param {number} color Color
   * @param {number} pIdx Index in the particle system geometry
   * @param {boolean} exp Part of particle system expansion?
   * @param {VoxelUtils.coordStr} coord Coordinate string (grid coords)
   */
  function addToVoxels(sid, color, pIdx, exp, coord) {

    voxels[sid.a][sid.b][coord] = {
      c: color,
      pIdx: pIdx,
      exp: exp
    }

  }

  function removeFromVoxels(sid, coord) {

    delete voxels[sid.a][sid.b][coord]

  }

  /**
   * Get the section indices of the specified grid position.
   * @memberOf VoxelWorld
   * @param {VoxelUtils.GridVector3} gPos Grid position to check
   * @returns {voxelUtils.Point}
   */
  function getSectionIndices(gPos) {

    return new VoxelUtils.Tuple(
      Math.floor((gPos.x + sqPerSideOfGrid / 2) / sqPerSideOfSection),
      Math.floor((gPos.z + sqPerSideOfGrid / 2) / sqPerSideOfSection)
    )

  }

  // render / update
  function animate() {

    requestAnimationFrame(animate)

    if (!mouseMiddleDown)
      renderer.render(scene, camera)

  }

  /**************************************\
  | Initialization                       |
  \**************************************/

  var scene
  var camera
  var container

  function init() {

    scene = new THREE.Scene()
    container = document.getElementById('container')

    ;(function _initCamera() {

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

    ;(function _initRenderer() {

      renderer = new THREE.WebGLRenderer({
        antialias: true
      })
      renderer.setClearColor(clearColor)
      renderer.sortObjects = false
      renderer.setSize(window.innerWidth, window.innerHeight)
      container.appendChild(renderer.domElement)

    })()

    raycaster = new THREE.Raycaster()

  }

  (function _initLights() {

    var ambientLight = new THREE.AmbientLight(0x606060)
    scene.add(ambientLight)

    var directionalLight = new THREE.DirectionalLight(0xffffff)
    directionalLight.position.set(1, 0.75, 0.5).normalize()
    scene.add(directionalLight)

  })();

  var bufMesh;

  (function _addEventListeners() {

    window.addEventListener('resize', onWindowResize, false)

    $(document).on("modalClosed", function() {

      // so jquery event trigger will work
      $(document).mousemove(onDocumentMouseMove)

      document.addEventListener('mousedown', onDocumentMouseDown, false)
      document.addEventListener('mouseup', onDocumentMouseUp, false)
      document.addEventListener('keydown', onDocumentKeyDown, false)
      document.addEventListener('keyup', onDocumentKeyUp, false)

    })

    $(document).on("modalOpened", function() {

      $(document).unbind('mousemove')

      document.removeEventListener('mousedown', onDocumentMouseDown, false)
      document.removeEventListener('mouseup', onDocumentMouseUp, false)
      document.removeEventListener('keydown', onDocumentKeyDown, false)
      document.removeEventListener('keyup', onDocumentKeyUp, false)

    })

  })();

  function render() {
    renderer.render(scene, camera)
  }

  (function _initGUI() {

    gui = new dat.GUI()

    var colors = gui.addFolder('Colors')

    var blockColor = colors.addColor(guiSettings, 'blockColor').listen()
    blockColor.onChange(function(value) {

      rollOverMaterial.color.setHex(guiSettings.blockColor ^ 0x4C000000)

    })

    colors.addColor(guiSettings, 'savedColor1').listen()
    colors.addColor(guiSettings, 'savedColor2').listen()
    colors.addColor(guiSettings, 'savedColor3').listen()
    colors.addColor(guiSettings, 'savedColor4').listen()
    colors.add(guiSettings, 'randomColor')
    colors.add(guiSettings, 'colorPicker')

    var options = gui.addFolder('Options')

    var con2 = options.add(guiSettings, 'sqPerSideSelectGrid', 45, sqPerSideOfSelectGrid * 2 + 1).listen()
    options.add(guiSettings, 'viewOnly').listen()

    gui.add(guiSettings, 'showControls')
    //gui.add(guiSettings, 'coolDownTimer').listen()
    gui.add(guiSettings, 'numClients').listen()

    con2.onChange(function(value) {

      value = Math.floor(value)

      if (value % 2 === 0)
        value -= 1

      sqPerSideOfSelectGrid = value
      guiSettings.sqPerSideSelectGrid = value

      var geo = new THREE.PlaneGeometry(50 * sqPerSideOfSelectGrid, 50 * sqPerSideOfSelectGrid),
        mat = new THREE.MeshBasicMaterial({
          color: "#008cff",
          opacity: 0.15,
          transparent: true,
          visible: true
        })

      var oldSelectPos = regionSelectPlane.position

      geo.rotateX(-Math.PI / 2)
      geo.translate(0, -25, 0)

      scene.remove(regionSelectPlane)
      regionSelectPlane = new THREE.Mesh(geo, mat)
      scene.add(regionSelectPlane)
    })

    $('.dg').mousedown(function() {

      guiClicked = true

    })

  })();

  (function _initMeshes() {

    var geometry = new THREE.PlaneGeometry(gridSize * 2 + 50, gridSize * 2 + 50)
    geometry.rotateX(-Math.PI / 2);

    (function _initVoxelPlane() {

      voxelPlane = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
        color: "#ffffff",
        visible: false,
        opacity: 1
      }))

      voxelPlane.name = "plane"

      scene.add(voxelPlane)
      raycastArr.push(voxelPlane)

    })();

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

    })();

    (function _initControlsPlane() {

      var controlGeo = new THREE.PlaneGeometry(gridSize * 40, gridSize * 40)
      controlGeo.rotateX(-Math.PI / 2)

      mapControlsPlane = new THREE.Mesh(controlGeo, new THREE.MeshBasicMaterial({
        color: '#ffff00',
        visible: false
      }))

      mapControlsPlane.name = "plane"

      scene.add(mapControlsPlane)

    })();

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

    })();

  })();

  (function _initCubeInfo() {

    // voxel shown when hovering grid
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

    })();

    scene.add(deleteVoxel)

  })();

  var particleSystem = new ParticleSystems.ParticleSystem(sectionsPerSide, scene)
  var pSystemExpansion = new ParticleSystems.PSystemExpansion(100000, scene)

  for (var i = 0, len1 = sectionsPerSide; i < len1; i++) {
    voxels[i] = []
    for (var j = 0, len2 = sectionsPerSide; j < len2; j++) {
      voxels[i][j] = {}
    }
  }

  var worldData;
  (function _initSocketHandlers() {

    socket.on('block added', function(info) {

      var gPos = new THREE.Vector3(info.position.x, info.position.y, info.position.z).initGridPos()
      var c = new THREE.Color(info.color)

      if (currentSelection && withinSelectionBounds(gPos)) {
        createAndAddVoxel(gPos, info.color, false)
      } else {
        var sid = getSectionIndices(gPos)
        voxels[sid.a][sid.b][VoxelUtils.getCoordStr(gPos)] = {
          c: info.color,
          exp: true
        }
        addPixel(gPos, c)
      }

    })

    socket.on('block removed', function(gPos) {

      gPos = new THREE.Vector3(gPos.x, gPos.y, gPos.z).initGridPos()

      var sid = getSectionIndices(gPos),
        vox = voxels[sid.a][sid.b][VoxelUtils.getCoordStr(gPos)],
        wPos = gPos.clone().gridToWorld()

      if (currentSelection && withinSelectionBounds(gPos)) {
        if (vox.isMesh) { // delete mesh
          deleteFromNew(gPos, false)
        } else { // delete from buffer
          deleteFromMerged(gPos, false)
        }
      } else { // delete pixel

        if (vox.exp) {
          pSystemExpansion.deletePixel(vox.pIdx)
        } else {
          particleSystem.hidePixel(sid, vox.pIdx)
        }

        removeFromVoxels(sid, VoxelUtils.getCoordStr(gPos))

      }

    })

    socket.on('update clients', function(numClients) {
      guiSettings.numClients = numClients
    })

    /*socket.on('set delay', function(secs) {
        blockPlaceDelay = secs
        resetTimer(5)
    })*/

    socket.on('max clients', function() {
      alert('Pixelscape is experiencing heavy load. Please try again later')
    })

  })();

  // zoom, pan, rotate logic
  MapControls(camera, render, document, mapControlsPlane);

  console.debug('retrieving data from server')
  socket.emit('start chunking')

  var numChunks = 0,
    numChunksLoaded = 0
  socket.on('chunking size', function(size) {
    numChunks = size
  })

  var chunkData = '{'
  socket.on('chunk', function(chunk) {
    numChunksLoaded++
    if (numChunks > 0) {
      var percent = ((numChunksLoaded / numChunks) * 100).toFixed(0)
      console.debug(percent + '% chunks loaded')
    }
    chunkData += chunk
  })

  socket.on('chunk done', function() {
    chunkData += '}'
    chunkData = JSON.parse(chunkData)
    console.log('done retrieving data')
    loadWorldData(chunkData)
  })

  return {
    init: init
  }

}(window)

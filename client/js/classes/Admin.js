'use strict'

/**
 * @namespace AdminGUI
 */
let AdminGUI = function(window, undefined) {

    let settings
    let controlKit
    let socket
    let pos

    let deletingRegion = false
    let deletingRegionWithColor = false
    let cleaningRegion = false
    let deletingRegionWithUName = false

    setTimeout(function init() {

        document.addEventListener('mousedown', adminMouseDown)
        pos = {}
        socket = SocketHandler.getSocket()
        settings = {
            /*logWorldData: function() {
                let worldData = WorldData.getWorldData()
                for (let i = 0; i < worldData.length; i++) {
                    for (let j = 0; j < worldData[i].length; j++) {
                        for (let voxPos in worldData[i][j]) {
                            console.log('voxPos: ' + voxPos)
                        }
                    }
                }
            }*/
            deleteRegion: {
                offText: 'Delete Region',
                onText: 'Deleting'
            },
            deleteRegionWColor: {
                offText: 'Delete Region w/ Color',
                onText: 'Deleting Region w/ Color'
            },
            cleanRegion: {
                offText: 'Clean Region',
                onText: 'Cleaning Region'
            },
            deleteRegionWUName: {
                offText: 'Delete Region with Username',
                onText: 'Deleting Region with Username'
            },
            username: ''
        }

        controlKit = GUI.getControlKit()
        initControlKit()

        // don't know why we need this
        $('#controlKit .panel').mousedown(function() {
            GUI.setClicked(true)
            // this has to be assigned here because
            // some elements don't exist on page load
            $('#controlKit *').mousedown(function() {
                GUI.setClicked(true)
            })

        })

    }, 400)

    function initControlKit() {

        let mainPanel = controlKit.addPanel({
                label: 'Admin Biiiiiiitch',
                align: 'left',
                width: 275
            })
            .addButton(settings.deleteRegion.offText, function() {
                Mouse.preventRegionSelect()
                toggleAdminControl('deleteRegion', true)
                deletingRegion = true
            })
            .addButton(settings.deleteRegionWColor.offText, function() {
                Mouse.preventRegionSelect()
                toggleAdminControl('deleteRegionWColor', true)
                deletingRegionWithColor = true
            })
            .addButton(settings.cleanRegion.offText, function() {
                Mouse.preventRegionSelect()
                toggleAdminControl('cleanRegion', true)
                cleaningRegion = true
            })
            .addButton(settings.deleteRegionWUName.offText, function() {
                Mouse.preventRegionSelect()
                toggleAdminControl('deleteRegionWUName', true)
                deletingRegionWithUName = true
            })
            .addStringInput(settings, 'username', {
                label: 'Username',
                onChange: function() {
                    console.log('onChange')
                }
            })

    }

    function toggleAdminControl(name, on) {
        if (on) {
            $('#controlKit [value="' + settings[name].offText + '"]').css('color', 'red')
            $('#controlKit [value="' + settings[name].offText + '"]').val(settings[name].onText)
        } else {
            $('#controlKit [value="' + settings[name].onText + '"]').css('color', '')
            $('#controlKit [value="' + settings[name].onText + '"]').val(settings[name].offText)
        }
    }

    function adminMouseDown(e) {
        if (User.stateIsHighlight()) return
        if (e.which === 1) leftDown(e)
    }

    /**
     * Handle a left mouse button
     * down event
     * @memberOf Mouse
     * @access private
     * @param  {Event} e
     */
    function leftDown(e) {

        let intersect = Mouse.getMouseIntersects(e).closestIntx

        if (intersect) {

            if (deletingRegionWithUName || deletingRegion || deletingRegionWithColor || cleaningRegion) {

                let p = intersect.point.clone().initWorldPos()
                p.add(intersect.face.normal).worldToGrid()

                let spssp = ((GUI.getSSSP() - 1) / 2)
                let c1 = new THREE.Vector3(p.x - spssp, p.y, p.z - spssp).initGridPos()
                let c2 = new THREE.Vector3(p.x + spssp, p.y, p.z + spssp).initGridPos()

                let intxGPos = intersect.point.clone().initWorldPos()
                intxGPos = intxGPos.add(intersect.face.normal).worldToGrid()

                let particleSystem = GameScene.getPSystem()

                let c1Sid = VoxelUtils.getSectionIndices(c1)
                let c2Sid = VoxelUtils.getSectionIndices(c2)

                let count = 0
                let toRemove = []

                let voxels = WorldData.getWorldData()

                for (let x = c1Sid.a; x <= c2Sid.a; x++) {
                    for (let z = c1Sid.b; z <= c2Sid.b; z++) {
                        for (let voxPos in voxels[x][z]) {
                            let gPos = VoxelUtils.coordStrParse(voxPos)
                            if (gPos.x >= c1.x && gPos.z >= c1.z &&
                                gPos.x <= c2.x && gPos.z <= c2.z) {

                                if (deletingRegionWithColor) {
                                    if (WorldData.getVoxel(gPos).hColor !== VoxelUtils.hexStringToDec(GUI.getBlockColor()))
                                        continue
                                }

                                if (cleaningRegion) {
                                    let sid = new VoxelUtils.Tuple(x, z)
                                    if (touchingOwnColor(sid, gPos))
                                        continue
                                }

                                if (deletingRegionWithUName) {
                                    if (WorldData.getVoxel(gPos).username !== settings.username)
                                        continue
                                }

                                toRemove.push(gPos)

                                let sid = new VoxelUtils.Tuple(x, z)
                                let vox = voxels[x][z][voxPos]
                                let wPos = gPos.clone().gridToWorld()
                                particleSystem.hidePixel(sid, vox.pIdx)
                                WorldData.removeVoxel(gPos)
                            }
                        }
                    }
                }
                if (toRemove.length > 0) {
                    socket.emit('batch delete', toRemove, function(deletedVoxels) {
                        console.log(`removed ${deletedVoxels.length} of ${toRemove.length} voxels.`)
                    })
                }

                toggleAdminControl('deleteRegion', false)
                toggleAdminControl('deleteRegionWColor', false)
                toggleAdminControl('cleanRegion', false)
                toggleAdminControl('deleteRegionWUName', false)

                deletingRegion = false
                deletingRegionWithColor = false
                cleaningRegion = false
                deletingRegionWithUName = false

            }
        }
    }

    function colorsMatch(gPos, color) {

        var vox = WorldData.getVoxel(gPos)
        return vox && (parseInt(vox.hColor) === parseInt(color))

    }

    function touchingOwnColor(sid, gPos) {

        var origVox = WorldData.getVoxel(gPos)
        var color = origVox.hColor

        for (var x = -1; x <= 1; x++) {
            for (var y = -1; y <= 1; y++) {
                for (var z = -1; z <= 1; z++) {
                    if (x === 0 && y === 0 && z === 0 || y < 0) continue
                    var posCheck = new THREE.Vector3(gPos.x + x, gPos.y + y, gPos.z + z)
                    if (colorsMatch(posCheck, color)) return true
                }
            }
        }

        return false

    }

}(window)

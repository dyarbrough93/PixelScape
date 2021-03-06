const config = require('./config.js').server
const utils = require('./utils.js')
const responses = require('./socketResponses.js')
const VoxelData = require('./models/VoxelData').voxelData
const ArchiveVoxelData = require('./models/VoxelData').archiveVoxelData
const Operation = require('./models/Operation')
const User = require('./models//User')

let numVoxels = 0

let WorldData = {}
module.exports = WorldData

WorldData.voxels = {} // worldData
WorldData.archiveVoxels = {} //
WorldData.userData = {} // indexed by user, each attr holds an array of all voxels that user owns

WorldData.removeOldGuestVoxels = function(cb) {

    VoxelData.find({ 'data.username': 'Guest' }, function(err, guestVoxels) {
        if (err) return cb(err)

        let deleteVoxels = []

        guestVoxels.forEach(function(guestVoxel) {
            let ms = (new Date(new Date() - guestVoxel._id.getTimestamp()).getTime())
            let minutes = (ms / (1000 * 60)) % 60
            if (minutes >= config.guestVoxelTime) {
                WorldData.remove(utils.coordStrParse(guestVoxel.key), 'Guest', function() {})
                deleteVoxels.push(guestVoxel)
            }
        })

        return cb(err, deleteVoxels)
    })
}

/*
 * Add a voxel to the worldData object
 * @param voxel Voxel info from client emit
 *
 * @return {boolean} Whether or not the voxel
 * was successfully aded
 */
WorldData.add = function(voxel, username, cb) {

    let gPos = voxel.position

    // check constraints
    if (numVoxels >= config.maxGlobalBlocks) return cb(responses.maxVoxels)
    if (gPos.y >= config.maxVoxelHeight) return cb(responses.tooHigh)
    if (!utils.withinGridBoundaries(gPos)) return cb(responses.outOfBounds)

    // already exists
    if (WorldData.voxels.hasOwnProperty(utils.getPosStr(gPos)))
        return cb(responses.alreadyExists)

    WorldData.voxels[utils.getPosStr(gPos)] = {
        c: voxel.color,
        username: username
    }

    let op = new Operation({
        operation: 'add',
        data: {
            color: parseInt(voxel.color),
            position: voxel.position,
            username: username
        }
    })

    let vox = new VoxelData({
        key: utils.getPosStr(gPos),
        data: {
            c: parseInt(voxel.color),
            username: username
        }
    })

    // insert into the
    // operations collection
    op.save(function(err) {
        if (utils.dbErr(err)) {
            delete WorldData.voxels[utils.getPosStr(gPos)]
            return cb(responses.utils.dbErr)
        }

        vox.save(function(err2) {
            if (utils.dbErr(err2)) {
                delete WorldData.voxels[utils.getPosStr(gPos)]
                return cb(responses.utils.dbErr)
            }

            if (username !== 'Guest') {

                // give the user ownership of the voxel
                let uarr = WorldData.userData[username]
                if (!uarr) WorldData.userData[username] = []
                WorldData.userData[username].push(utils.getPosStr(gPos))

            }

            numVoxels++
            return cb(responses.success)

        })
    })
}


/*
 * Remove object at position from the worldData object
 * @param gPos Grid position of the voxel to remove
 *
 * @return {boolean} Whether or not the voxel
 * was successfully removed
 */
WorldData.remove = function(gPos, username, cb) {

    let coordStr = utils.getPosStr(gPos)
    let vox = WorldData.voxels[coordStr]

    // make sure it exists
    if (vox) {

        delete WorldData.voxels[utils.getPosStr(gPos)]

        let op = new Operation({
            operation: 'remove',
            data: {
                position: gPos,
                username: username
            }
        })

        // insert into the
        // operations collection
        op.save(function(err) {
            if (utils.dbErr(err)) {
                WorldData.voxels[coordStr] = vox
                return cb(responses.utils.dbErr)
            }

            // remove from the
            // data collection
            VoxelData.remove({
                key: coordStr
            }, function(err2) {
                if (utils.dbErr(err2)) {
                    WorldData.voxels[coordStr] = vox
                    return cb(responses.utils.dbErr)
                }

                numVoxels--

                if (username && username !== 'Guest') {
                    if (WorldData.userData[username]) {
                        let idx = WorldData.userData[username].indexOf(coordStr)
                        if (idx > -1) WorldData.userData[username].splice(idx, 1)
                    }
                }

                return cb(responses.success, gPos)
            })
        })

    } else return cb(responses.noExist) // doesn't exist

}

WorldData.batchDelete = function(toDelete, done) {

    var numToDelete = toDelete.length
    var i = 0
    var deletedVoxels = []

    function deleteVoxels(i) {
        var gPos = toDelete[i]
        WorldData.remove(gPos, 'Admin', function(success, retPos) {
            if (success) deletedVoxels.push(retPos)
            if (i < numToDelete - 1) deleteVoxels(++i)
            else {
                return done(deletedVoxels)
            }
        })
    }

    deleteVoxels(0)

}

WorldData.getVoxel = function(gPos) {

    let coordStr = utils.getPosStr(gPos)
    return WorldData.voxels[coordStr]

}

WorldData.init = function(done) {

    VoxelData.find({}, function(err, data) {

        if (utils.dbErr(err)) {
            process.exit()
        }

        ArchiveVoxelData.find({}, function(err, archiveData) {

            if (utils.dbErr(err)) {
                process.exit()
            }

            loadData(data, archiveData)
            done()

        })
    })
}

/*
 * Loads data at the specified path into coords
 * @param path The file's path, including file name
 */
function loadData(data, archiveData) {

    console.log('loading world data from mongodb.worldData ...')

    data.forEach(function(item) {
        WorldData.voxels[item.key] = item.data
    })

    archiveData.forEach(function(item) {
        WorldData.archiveVoxels[item.key] = item.data
    })

    console.log('loaded worldData from mongodb')

}

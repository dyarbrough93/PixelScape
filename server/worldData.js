const config = require('./config.js').server
const responses = require('./socketResponses.js')
const VoxelData = require('./models/VoxelData')
const Operation = require('./models/Operation')
const User = require('./models/User')

let numVoxels = 0

let WorldData = {}
module.exports = WorldData

WorldData.voxels = {} // worldData
WorldData.userData = {} // indexed by user, each attr holds an array of all voxels that user owns
WorldData.count = function() {

    if (!numVoxels) {
        for (let vox in WorldData.voxels) {
            if (WorldData.voxels.hasOwnProperty(vox))
                numVoxels++
        }
        return numVoxels++
    } else {
        return numVoxels
    }
}

function getPosStr(pos) {
    return 'x' + pos.x + 'y' + pos.y + 'z' + pos.z
}

function dbErr(err) {
    if (err) {
        console.log(err)
        return true
    }
    return false
}

/*
 * Add a voxel to the worldData object
 * @param voxel Voxel info from client emit
 *
 * @return {boolean} Whether or not the voxel
 * was successfully aded
 */
WorldData.add = function(voxel, username, cb) {

    let pos = voxel.position

    // check constraints
    if (numVoxels >= config.maxGlobalBlocks) return cb(responses.maxVoxels)
    if (pos.y >= config.maxVoxelHeight) return cb(responses.tooHigh)

    // already exists
    if (WorldData.voxels.hasOwnProperty(getPosStr(pos)))
        return cb(responses.alreadyExists)

    WorldData.voxels[getPosStr(pos)] = {
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
        key: getPosStr(pos),
        data: {
            c: parseInt(voxel.color),
            username: username
        }
    })

    // insert into the
    // operations collection
    op.save(function(err) {
        if (dbErr(err)) {
            delete WorldData.voxels[getPosStr(pos)]
            return cb(responses.dbErr)
        }

        vox.save(function(err2) {
            if (dbErr(err2)) {
                delete WorldData.voxels[getPosStr(pos)]
                return cb(responses.dbErr)
            }

            if (username !== 'Guest') {

                // give the user ownership of the voxel
                let uarr = WorldData.userData[username]
                if (!uarr) WorldData.userData[username] = []
                WorldData.userData[username].push(getPosStr(pos))

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

    let coordStr = getPosStr(gPos)
    let vox = WorldData.voxels[coordStr]

    // make sure it exists
    if (vox) {

        delete WorldData.voxels[getPosStr(gPos)]

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
            if (dbErr(err)) {
                WorldData.voxels[coordStr] = vox
                return cb(responses.dbErr)
            }

            // remove from the
            // data collection
            VoxelData.remove({
                key: coordStr
            }, function(err2) {
                if (dbErr(err2)) {
                    WorldData.voxels[coordStr] = vox
                    return cb(responses.dbErr)
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
        var pos = toDelete[i]
        WorldData.remove(pos, 'Admin', function(success, retPos) {
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

    let coordStr = getPosStr(gPos)
    return WorldData.voxels[coordStr]

}

WorldData.init = function(done) {

    VoxelData.find({}, function(err, data) {

        if (dbErr(err)) {
            process.exit()
        }

        loadData(data)
        done()

    })
}

/*
 * Loads data at the specified path into coords
 * @param path The file's path, including file name
 */
function loadData(data) {

    console.log('loading world data from mongodb.worldData ...')

    data.forEach(function(item) {
        WorldData.voxels[item.key] = item.data
    })

    WorldData.numVoxels = WorldData.count()
    console.log('loaded worldData from mongodb')

}

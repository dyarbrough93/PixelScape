const config = require('./config.js').server
const VoxelData = require('./models/VoxelData')
const Operation = require('./models/Operation')

var numVoxels = 0

var WorldData = {}
module.exports = WorldData

WorldData.voxels = {} // worldData
WorldData.userData = {} // indexed by user, each attr holds an array of all voxels that user owns
WorldData.count = function() {

    if (!numVoxels) {
        for (var vox in WorldData.voxels) {
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

    var pos = voxel.position

    // check constraints
    if (numVoxels >= config.maxGlobalBlocks) return cb('max')
    if (pos.y >= config.maxVoxelHeight) return cb(false) // too high

    // already exists
    if (WorldData.voxels.hasOwnProperty(getPosStr(pos)))
        return cb(false)

    var op = new Operation({
        operation: 'add',
        data: {
            color: parseInt(voxel.color),
            position: voxel.position,
            username: username
        }
    })

    var vox = new VoxelData({
        key: getPosStr(pos),
        data: {
            c: parseInt(voxel.color),
            username: username
        }
    })

    // insert into the
    // operations collection
    op.save(function(err) {
        if (dbErr(err)) return cb(false)

        vox.save(function(err2) {
            if (dbErr(err2)) return cb(false)

            // add the voxel to worldData
            // and return success
            WorldData.voxels[getPosStr(pos)] = {
                c: voxel.color,
                username: username
            }

            // give the user ownership of the voxel
            var uarr = WorldData.userData[username]
            if (!uarr || uarr.length === 0) WorldData.userData[username] = []
            WorldData.userData[username].push(getPosStr(pos))

            numVoxels++
            return cb(true)

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
WorldData.remove = function(gPos, cb) {

    // make sure it exists
    if (WorldData.voxels[getPosStr(gPos)]) {

        var op = new Operation({
            operation: 'remove',
            data: {
                position: gPos
            }
        })

        // insert into the
        // operations collection
        op.save(function(err) {
            if (dbErr(err)) return cb(false)

            // remove from the
            // data collection
            VoxelData.remove({ key: getPosStr(gPos) }, function(err2) {
                if (dbErr(err2)) return cb(false)

                // remove it from worldData and
                // return success
                delete WorldData.voxels[getPosStr(gPos)]
                numVoxels--
                return cb(true)
            })
        })

    } else return cb(false) // doesn't exist

}

WorldData.init = function(done) {

    VoxelData.find({}, function(err, data) {

        if (dbErr(err)) {
            process.exit()
        }

        loadData(data, function() {
            done()
        })

    })
}

function initUserData() {

    for (var voxel in WorldData.voxels) {

        if (WorldData.voxels.hasOwnProperty(voxel)) {

            var uname = WorldData.voxels[voxel].username

            if (!WorldData.userData[uname]) WorldData.userData[uname] = []
            WorldData.userData[uname].push(voxel)

        }

    }

}

/*
 * Loads data at the specified path into coords
 * @param path The file's path, including file name
 */
function loadData(data, done) {

    console.log('loading world data from mongodb.worldData ...')

    data.forEach(function(item) {
        WorldData.voxels[item.key] = item.data
    })

    WorldData.numVoxels = WorldData.count()
    console.log('loaded worldData from mongodb')

    initUserData()

    done()

}

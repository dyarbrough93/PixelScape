const config = require('./config.js')
const VoxelData = require('./models/VoxelData')
const Operation = require('./models/Operation')

var numVoxels = 0

var WorldData = {}
module.exports = WorldData

WorldData.voxels = {} // worldData
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
    return "x" + pos.x + "y" + pos.y + "z" + pos.z
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
 * @param info Info from client emit
 *
 * @return {boolean} Whether or not the voxel
 * was successfully aded
 */
WorldData.add = function(info, cb) {

    var pos = info.position

    // check constraints
    if (numVoxels >= config.maxGlobalBlocks) return cb('max')
    if (pos.y >= config.maxVoxelHeight) return cb(false) // too high

    // already exists
    if (WorldData.voxels.hasOwnProperty(getPosStr(pos)))
        return cb(false)

    var op = new Operation({
        operation: 'add',
        data: {
            color: parseInt(info.color),
            position: info.position
        }
    })

    var vox = new VoxelData({
        key: getPosStr(pos),
        data: {
            c: parseInt(info.color)
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
                c: info.color
            }

            numVoxels++
            return cb(true)

        })
    })
}


/*
 * Remove object at position from the worldData object
 * @param position Position of the voxel to remove
 *
 * @return {boolean} Whether or not the voxel
 * was successfully removed
 */
WorldData.remove = function(pos, cb) {

    // make sure it exists
    if (WorldData.voxels[getPosStr(pos)]) {

        var op = new Operation({
            operation: 'remove',
            data: {
                position: pos
            }
        })

        var vox = new VoxelData({
            key: getPosStr(pos)
        })

        // insert into the
        // operations collection
        op.save(function(err) {
            if (dbErr(err)) return cb(false)

            // remove from the
            // data collection
            vox.remove(function(err2) {
                if (dbErr(err2)) return cb(false)

                // remove it from worldData and
                // return success
                delete WorldData.voxels[getPosStr(pos)]
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

/*
 * Loads data at the specified path into coords
 * @param path The file's path, including file name
 */
function loadData(data, done) {

    console.log('loading world data from mongodb.worldData...')

    data.forEach(function(item) {
        WorldData.voxels[item.key] = item.data
    })

    WorldData.numVoxels = WorldData.count()
    console.log('loaded worldData from mongodb')

    done()

}

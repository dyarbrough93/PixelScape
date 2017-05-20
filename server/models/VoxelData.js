const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dev = (process.env.NODE_ENV === 'dev' && process.env.REAL_DATA !== 'y') ? 'test' : ''

let voxelData = {
    key: String,
    data: {
        c: Number, // color
        username: String // creator
    }
}

let dataSchema = new Schema(voxelData, { collection: dev + 'worldDataV2' })
let archiveDataSchema = new Schema(voxelData, { collection: 'worldData' })

module.exports = {
    voxelData: mongoose.model('VoxelData', dataSchema),
    archiveVoxelData: mongoose.model('ArchiveVoxelData', archiveDataSchema)
}

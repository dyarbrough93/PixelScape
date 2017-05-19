const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dev = (process.env.NODE_ENV === 'dev' && process.env.REAL_DATA !== 'y') ? 'test' : ''

let dataSchema = new Schema({
    key: String,
    data: {
        c: Number, // color
        username: String // creator
    }
}, {collection: dev + 'worldDataV2'})

module.exports = mongoose.model('VoxelData', dataSchema)

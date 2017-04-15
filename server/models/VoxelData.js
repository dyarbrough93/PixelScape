const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dev = process.env.NODE_ENV === 'dev' ? 'test' : ''

var dataSchema = new Schema({
    key: String,
    data: {
        c: Number // color
    }
}, {collection: dev + 'worldData'})

module.exports = mongoose.model('VoxelData', dataSchema)

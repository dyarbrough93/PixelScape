const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dev = process.env.NODE_ENV === 'dev' ? 'test' : ''

let opSchema = new Schema({
    operation: String,
    data: {
        color: Number,
        position: {
            x: Number,
            y: Number,
            z: Number
        },
        username: String
    }
}, {collection: dev + 'PixOpsV2'})

module.exports = mongoose.model('Operation', opSchema)

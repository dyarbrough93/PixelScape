const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dev = process.env.NODE_ENV === 'dev' ? 'test' : ''

var opSchema = new Schema({
    operation: String,
    data: {
        color: Number,
        position: {
            x: Number,
            y: Number,
            z: Number
        }
    }
}, {collection: dev + 'ops'})

module.exports = mongoose.model('Operation', opSchema)

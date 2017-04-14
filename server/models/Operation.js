const mongoose = require('mongoose')
const Schema = mongoose.Schema

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
})

module.exports = mongoose.model('ops', opSchema);

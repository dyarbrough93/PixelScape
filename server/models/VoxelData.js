const mongoose = require('mongoose')
const Schema = mongoose.Schema

var dataSchema = new Schema({
    key: String,
    data: {
        c: Number // color
    }
})

module.exports = mongoose.model('worldData', dataSchema);

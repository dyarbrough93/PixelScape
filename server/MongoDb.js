const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dbUrl = '***REMOVED***'

function init(done) {

    mongoose.connect(dbUrl)
    var opsCol = mongoose.model('testops', new Schema({
        operation: String,
        data: {
            color: Number,
            position: {
                x: Number,
                y: Number,
                z: Number,
            }
        }
    }))
    var dataCol = mongoose.model('testworldData', new Schema({
        key: String,
        data: {
            c: Number
        }
    }))
    return {
        opsCol: opsCol,
        dataCol: dataCol
    }

}

module.exports = init

const local = require('./local.js')
const mongoose = require('mongoose')
const Schema = mongoose.Schema

var dbUrl = 'mongodb://'
dbUrl += local.mongo.username + ':' + local.mongo.password
dbUrl += '@' + local.mongo.url
dbUrl += ':' + local.mongo.port
dbUrl += '/' + local.mongo.db

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

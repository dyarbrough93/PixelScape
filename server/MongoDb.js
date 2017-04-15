const local = require('./local.js')
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const Schema = mongoose.Schema

var dbUrl = 'mongodb://'
dbUrl += local.mongo.username + ':' + local.mongo.password
dbUrl += '@' + local.mongo.url
dbUrl += ':' + local.mongo.port
dbUrl += '/' + local.mongo.db

function init(done) {

    mongoose.connect(dbUrl)
    const conn = mongoose.connection
    conn.once('open', done)

}

module.exports = init

const dbUrl = require('./local.js').mongo.dbUrl
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const Schema = mongoose.Schema

function init(done) {

    mongoose.connect(dbUrl)
    const conn = mongoose.connection
    conn.once('open', done)

}

module.exports = init

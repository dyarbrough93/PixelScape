const dbUrl = require('./local.js').mongo.dbUrl

function init(mongoose, done) {

    mongoose.connect(dbUrl)
    const conn = mongoose.connection
    conn.once('open', done)

}

module.exports = init

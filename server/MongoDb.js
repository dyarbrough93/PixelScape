function init(mongoose, dbUrl, done) {

    mongoose.connect(dbUrl)
    const conn = mongoose.connection
    conn.once('open', done)

}

module.exports = init

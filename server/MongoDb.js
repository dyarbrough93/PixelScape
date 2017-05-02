function init(mongoose, done) {

    mongoose.connect(process.env.DB_URL)
    const conn = mongoose.connection
    conn.once('open', done)

}

module.exports = init

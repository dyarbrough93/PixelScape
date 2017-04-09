const MongoClient = require('mongodb').MongoClient

const dbUrl = "***REMOVED***"

function handleErr(err) {
    if (err) {
        console.log(err)
        process.exit()
    }
}

function init(done) {

    MongoClient.connect(dbUrl, function(err, db) {

        handleErr(err)
        console.log('Connected to mongodb')

        // get the ops collection
        db.collection('testops', function(err, opsCol) {

            handleErr(err)

            // get the worldData collection
            db.collection('worldData', function(err, dataCol) {

                handleErr(err)
                done(opsCol, dataCol)

            })
        })
    })

}

module.exports = init

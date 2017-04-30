const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dev = process.env.NODE_ENV === 'dev' ? 'test' : ''

var userSchema = new Schema({
    username: {type: String, unique: true, required: true, dropDups: true},
    firstName: String,
    lastName: String,
    password: {type: String, required: true},
    email: {type: String, unique: true, required: true, dropDups: true},
    settings: {
        voxelOutlineColor: Number
    }
}, {collection: dev + 'users'})

module.exports = mongoose.model('User', userSchema)

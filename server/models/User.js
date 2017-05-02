const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dev = process.env.NODE_ENV === 'dev' ? 'test' : ''

let userSchema = new Schema({
    username: String,
    firstName: String,
    lastName: String,
    password: {type: String, required: true},
    email: {type: String, unique: true, required: true, dropDups: true}
}, {collection: dev + 'users'})

module.exports = mongoose.model('User', userSchema)

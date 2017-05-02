const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dev = process.env.NODE_ENV === 'dev' ? 'test' : ''

let userInfo = {
    username: {type: String, unique: true, required: true},
    firstName: String,
    lastName: String,
    password: {type: String, required: true},
    email: {type: String, unique: true, required: true, dropDups: true}
}

let userSchema = new Schema(userInfo, {collection: dev + 'users'})

userInfo.GENERATED_VERIFYING_URL = String
let tempUserSchema = new Schema(userInfo, {collection: dev + 'unverified_users'})

module.exports = {
    user: mongoose.model('User', userSchema),
    tempUser: mongoose.model('TempUser', tempUserSchema)
}

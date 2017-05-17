const mongoose = require('mongoose')
const Schema = mongoose.Schema
mongoose.Promise = require('bluebird')
const mongoConnect = require('./server/MongoDb.js')
const local = require('./server/local.js')
const dbUrl = local.mongo.dbUrl

process.env.NODE_ENV = 'dev'
const bCrypt = require('bcrypt-nodejs')

mongoConnect(mongoose, dbUrl, function() {

	var breakfastSchema = new Schema({
		eggs: {
			type: Number,
			min: [6, 'Too few eggs'],
			max: 12
		},
		bacon: {
			type: Number,
			required: [true, 'Why no bacon?']
		},
		drink: {
			type: String,
			enum: ['Coffee', 'Tea'],
			required: function() {
				return this.bacon > 3;
			}
		}
	});
	var Breakfast = mongoose.model('Breakfast', breakfastSchema);

	var badBreakfast = new Breakfast({
		eggs: 2,
		bacon: 0,
		drink: 'Milk'
	});
	var error = badBreakfast.validateSync();
    console.log(error)
})

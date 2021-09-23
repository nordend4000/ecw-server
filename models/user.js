const mongoose = require("mongoose")
const user = new mongoose.Schema({
	email: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	firstName: {
		type: String,
		required: false,
	},
	lastName: {
		type: String,
		required: false,
	},
	streetNumber: {
		type: String,
		required: false,
	},
	street: {
		type: String,
		required: false,
	},
	zipCode: {
		type: String,
		required: false,
	},
	city: {
		type: String,
		required: false,
	},
	country: {
		type: String,
		required: false,
	},
	phone: {
		type: String,
		required: false,
	},
	order: {
		type: String,
		required: false,
	},
})

module.exports = mongoose.model("User", user)
